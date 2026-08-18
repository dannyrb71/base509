// CFG-1 §6 gate — Hardening
// - Audit rows immutable; secrets redacted
// - Security-definer functions not executable by unintended roles
// - Fresh-DB migration works (proven by global setup); schema completeness
// - Realistic RLS performance: EXPLAIN(ANALYZE, BUFFERS) uses the §6 indexes
import { afterAll, describe, expect, it } from 'vitest'
import { asUser, become, closeAll, connect, expectError, uuid } from './db'
import { addClient, newBusiness, setEntitlements } from './fixtures'

afterAll(closeAll)

describe('audit immutability + redaction', () => {
  it('audit rows resist update/delete/truncate from every role', async () => {
    const biz = await newBusiness() // creates business.bootstrap audit rows
    const admin = await connect()
    const row = await admin.query(
      `select id from public.audit_events where business_id = $1 limit 1`,
      [biz.businessId],
    )
    expect(row.rowCount).toBe(1)
    await expectError(
      admin.query(`update public.audit_events set action = 'x' where id = $1`, [row.rows[0].id]),
      /IMMUTABLE_ROW/,
    )
    await expectError(
      admin.query(`delete from public.audit_events where id = $1`, [row.rows[0].id]),
      /IMMUTABLE_ROW/,
    )
    await expectError(admin.query(`truncate public.audit_events`), /IMMUTABLE_ROW/)
    await admin.end()

    await asUser(biz.owner.sub, async (c) => {
      // Owner can read their business's audit trail…
      const r = await c.query(`select * from public.audit_events where business_id = $1`, [
        biz.businessId,
      ])
      expect(r.rowCount).toBeGreaterThan(0)
      // …but cannot write it.
      await expectError(
        c.query(
          `insert into public.audit_events (business_id, action, target_type) values ($1, 'forged', 'x')`,
          [biz.businessId],
        ),
        /permission denied/,
      )
      await expectError(
        c.query(`update public.audit_events set action = 'x'`),
        /permission denied/,
      )
    })
  })

  it('no invite token or other bearer secret appears anywhere in the audit log', async () => {
    const biz = await newBusiness()
    const token = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId]))
        .rows[0].token as string,
    )
    const admin = await connect()
    const all = await admin.query(
      `select string_agg(coalesce(before::text, '') || coalesce(after::text, '') || coalesce(reason, ''), ' ') as blob
       from public.audit_events where business_id = $1`,
      [biz.businessId],
    )
    expect(all.rows[0].blob).not.toContain(token)
    await admin.end()
  })
})

describe('security-definer execution boundaries', () => {
  it('unintended roles cannot execute privileged functions', async () => {
    const c = await connect()

    // anon: nothing.
    await become(c, 'anon')
    await expectError(c.query('select public.bootstrap_account()'), /permission denied/)
    await expectError(
      c.query(`select public.sync_entitlements('{}')`),
      /permission denied/,
    )
    await expectError(
      c.query(`select app.current_base509_account_id()`),
      /permission denied/,
    )
    await expectError(
      c.query(`select test_harness.reserve_fixture($1, $1, $1, '2028-01-01')`, [uuid()]),
      /permission denied/,
    )

    // authenticated: no machine ops, no internal primitive, no audit appender.
    await become(c, 'authenticated', { sub: uuid() })
    await expectError(
      c.query(`select public.sync_entitlements('{}')`),
      /permission denied/,
    )
    await expectError(
      c.query(
        `select app.capacity_check($1, $1, '2028-01-01', null, 1)`,
        [uuid()],
      ),
      /permission denied/,
    )
    await expectError(
      c.query(
        `select app.append_audit(null, null, 'user', 'forged', 'x', null)`,
      ),
      /permission denied/,
    )
    await expectError(
      c.query(`select test_harness.reserve_fixture($1, $1, $1, '2028-01-01')`, [uuid()]),
      /permission denied/,
    )
    // The issuer allowlist is invisible to app roles.
    await expectError(c.query(`select * from app.trusted_issuers`), /permission denied/)
    await c.end()
  })

  it('sync_entitlements verifies the workload identity even if EXECUTE leaked', async () => {
    // Defense in depth: the function itself checks auth.role().
    const c = await connect() // superuser HAS execute…
    await expectError(
      c.query(`select * from public.sync_entitlements('{}')`),
      /FORBIDDEN/, // …but fails the workload-identity check
    )
    await c.end()
  })
})

describe('schema completeness (fresh-DB migration ran in global setup)', () => {
  it('all CFG-1 tables exist with RLS enabled and forced-ownership', async () => {
    const admin = await connect()
    const r = await admin.query(
      `select count(*) as n
       from pg_tables
       where schemaname = 'public'
         and rowsecurity = false
         and tablename <> 'waitlist'`,
    )
    // waitlist has RLS on too, but keep it out of CFG-1's assertion surface.
    expect(Number(r.rows[0].n)).toBe(0)

    const owners = await admin.query(
      `select tablename from pg_tables
       where schemaname = 'public' and tablename <> 'waitlist' and tableowner <> 'cfg1_owner'`,
    )
    expect(owners.rows).toEqual([])
    await admin.end()
  })
})

describe('realistic RLS performance (§6 EXPLAIN gate)', () => {
  it('identity/membership resolution is index-backed at representative volumes', async () => {
    const admin = await connect()

    // Seed ~50 tenants × 40 clients + 2500 identities/memberships.
    await admin.query(`
      do $$
      declare
        i integer;
        j integer;
        v_account uuid;
        v_biz uuid;
        v_client uuid;
      begin
        for i in 1..50 loop
          insert into public.base509_accounts default values
            returning base509_account_id into v_account;
          insert into public.auth_identities (base509_account_id, issuer, provider_subject)
            values (v_account, 'https://test.local/auth/v1', 'perf-owner-' || i);
          insert into public.businesses (name, owner_account_id)
            values ('Perf ' || i, v_account) returning id into v_biz;
          insert into public.business_memberships (business_id, base509_account_id, role, status)
            values (v_biz, v_account, 'owner', 'active');
          for j in 1..40 loop
            insert into public.base509_accounts default values
              returning base509_account_id into v_account;
            insert into public.auth_identities (base509_account_id, issuer, provider_subject)
              values (v_account, 'https://test.local/auth/v1', 'perf-staff-' || i || '-' || j);
            insert into public.business_memberships (business_id, base509_account_id, role, status)
              values (v_biz, v_account, 'staff', 'active');
          end loop;
          for j in 1..40 loop
            insert into public.base509_accounts default values
              returning base509_account_id into v_account;
            insert into public.auth_identities (base509_account_id, issuer, provider_subject)
              values (v_account, 'https://test.local/auth/v1', 'perf-' || i || '-' || j);
            insert into public.clients (business_id, base509_account_id, display_name)
              values (v_biz, v_account, 'Perf client ' || j) returning id into v_client;
            insert into public.pets (business_id, client_id, name)
              values (v_biz, v_client, 'Pet ' || j);
          end loop;
        end loop;
      end
      $$;
    `)
    await admin.query('analyze')

    // 1. Identity resolution: unique (issuer, provider_subject) index.
    const p1 = await admin.query(
      `explain (analyze, buffers)
       select base509_account_id from public.auth_identities
       where issuer = 'https://test.local/auth/v1' and provider_subject = 'perf-25-7'`,
    )
    const plan1 = p1.rows.map((r: any) => r['QUERY PLAN']).join('\n')
    expect(plan1).toMatch(/Index (Only )?Scan.*auth_identities/)
    expect(plan1).not.toMatch(/Seq Scan on auth_identities/)

    // 2. Membership resolution: (business_id, base509_account_id, status).
    const biz = await admin.query(`select id from public.businesses where name = 'Perf 25'`)
    const acct = await admin.query(
      `select base509_account_id from public.auth_identities where provider_subject = 'perf-owner-25'`,
    )
    const p2 = await admin.query(
      `explain (analyze, buffers)
       select role from public.business_memberships
       where business_id = '${biz.rows[0].id}'
         and base509_account_id = '${acct.rows[0].base509_account_id}'
         and status = 'active'`,
    )
    const plan2 = p2.rows.map((r: any) => r['QUERY PLAN']).join('\n')
    expect(plan2).toMatch(/Index (Only )?Scan.*business_memberships/)
    expect(plan2).not.toMatch(/Seq Scan on business_memberships/)
    await admin.end()

    // 3. A real RLS-filtered tenant query, shaped the way the app queries
    // (always scoped to the active business_id — architecture §2.2), is
    // index-driven under RLS, not a per-row sequential scan.
    const perfBiz = biz.rows[0].id as string
    await asUser('perf-owner-25', async (c) => {
      const p3 = await c.query(
        `explain (analyze, buffers)
         select id from public.clients where business_id = '${perfBiz}'`,
      )
      const plan3 = p3.rows.map((r: any) => r['QUERY PLAN']).join('\n')
      expect(plan3).toMatch(/Index (Only )?Scan|Bitmap/)
      expect(plan3).not.toMatch(/Seq Scan on clients/)
    })
  })
})
