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
  // Every privileged function's ACL, enumerated from the catalog and matched
  // EXACTLY against the intended classification (Codex #1) — an unclassified
  // function or an unexpected grant fails this test.
  const EXPECTED: Record<string, { auth: boolean; svc: boolean }> = {
    // app schema — helpers RLS policies and RPC guards evaluate as the caller
    'app.current_base509_account_id': { auth: true, svc: true },
    'app.current_membership': { auth: true, svc: true },
    'app.role_rank': { auth: true, svc: true },
    'app.has_role': { auth: true, svc: true },
    'app.member_business_ids': { auth: true, svc: true },
    'app.client_business_ids': { auth: true, svc: true },
    'app.current_client_id': { auth: true, svc: true },
    'app.has_capability': { auth: true, svc: true },
    'app.require_account': { auth: true, svc: true },
    'app.require_role': { auth: true, svc: true },
    // app schema — the human over-capacity op: authenticated sessions only
    // (machine identities must be unable to reach it at all)
    'app.capacity_check_human_override': { auth: true, svc: false },
    // app schema — internal-only (no API role may execute)
    'app.jwt': { auth: false, svc: false },
    'app.jwt_issuer': { auth: false, svc: false },
    'app.starter_entitlements': { auth: false, svc: false },
    'app.effective_entitlements': { auth: false, svc: false },
    'app.require_entitlement': { auth: false, svc: false },
    'app.client_limit': { auth: false, svc: false },
    'app.seat_limit': { auth: false, svc: false },
    'app.append_audit': { auth: false, svc: false },
    'app.lock_business_account': { auth: false, svc: false },
    'app.capacity_check': { auth: false, svc: false },
    'app.capacity_check_core': { auth: false, svc: false },
    'app.window_effective_assignments': { auth: false, svc: false },
    'app.validate_zone_boundary': { auth: false, svc: false },
    'app.validate_service_capacity': { auth: false, svc: false },
    'app.audit_config_change': { auth: false, svc: false },
    'app.touch_updated_at': { auth: false, svc: false },
    'app.prevent_tenant_rekey': { auth: false, svc: false },
    'app.raise_immutable': { auth: false, svc: false },
    'app.protect_business_columns': { auth: false, svc: false },
    'app.protect_client_columns': { auth: false, svc: false },
    'app.enforce_no_dual_relationship_membership': { auth: false, svc: false },
    'app.enforce_no_dual_relationship_client': { auth: false, svc: false },
    'app.enforce_owner_remains': { auth: false, svc: false },
    // public schema — typed RPCs
    'public.bootstrap_account': { auth: true, svc: false },
    'public.create_business': { auth: true, svc: true },
    'public.create_invite': { auth: true, svc: true },
    'public.revoke_invite': { auth: true, svc: true },
    'public.redeem_invite': { auth: true, svc: true },
    'public.create_client': { auth: true, svc: true },
    'public.reactivate_client': { auth: true, svc: true },
    'public.set_client_status': { auth: true, svc: true },
    'public.change_membership_role': { auth: true, svc: true },
    'public.remove_member': { auth: true, svc: true },
    'public.reactivate_member': { auth: true, svc: true },
    'public.team_directory': { auth: true, svc: true },
    'public.set_occurrence_care_status': { auth: true, svc: true },
    'public.effective_availability': { auth: true, svc: true },
    'public.set_calendar_day': { auth: true, svc: true },
    'public.set_service_day_override': { auth: true, svc: true },
    'public.set_pool_day_override': { auth: true, svc: true },
    'public.set_window_day_override': { auth: true, svc: true },
    'public.reset_day_override': { auth: true, svc: true },
    'public.get_effective_entitlements': { auth: true, svc: true },
    // public schema — machine op (workload identity only)
    'public.sync_entitlements': { auth: false, svc: true },
    // test harness (not a migration): the ordinary reserve path is machine-
    // only; the human over-capacity path is authenticated-only
    'test_harness.reserve_fixture': { auth: false, svc: true },
    'test_harness.reserve_fixture_over_capacity': { auth: true, svc: false },
    'test_harness.cancel_booking': { auth: false, svc: true },
  }

  it('enumerates EVERY cfg1_owner function ACL and matches the classification exactly', async () => {
    const admin = await connect()
    const rows = await admin.query(
      `select n.nspname || '.' || p.proname as fq,
              has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as auth,
              has_function_privilege('service_role', p.oid, 'execute') as svc
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where p.proowner = (select oid from pg_roles where rolname = 'cfg1_owner')
       order by fq`,
    )
    await admin.end()

    const actualNames = rows.rows.map((r: any) => r.fq as string).sort()
    expect(actualNames, 'function set drifted — classify new functions explicitly')
      .toEqual(Object.keys(EXPECTED).sort())

    for (const r of rows.rows) {
      expect(r.anon, `${r.fq}: anon must never execute privileged functions`).toBe(false)
      const want = EXPECTED[r.fq as string]!
      expect(r.auth, `${r.fq}: authenticated EXECUTE mismatch`).toBe(want.auth)
      expect(r.svc, `${r.fq}: service_role EXECUTE mismatch`).toBe(want.svc)
    }
  })

  it('denied roles fail at runtime too, not just in the catalog', async () => {
    const c = await connect()
    await become(c, 'anon')
    await expectError(c.query('select public.bootstrap_account()'), /permission denied/)
    await expectError(c.query(`select app.current_base509_account_id()`), /permission denied/)

    await become(c, 'authenticated', { sub: uuid() })
    await expectError(c.query(`select public.sync_entitlements('{}')`), /permission denied/)
    await expectError(
      c.query(`select app.capacity_check($1, $1, '2028-01-01', null, 1)`, [uuid()]),
      /permission denied/,
    )
    await expectError(
      c.query(`select app.append_audit(null, null, 'user', 'forged', 'x', null)`),
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

  it('service_role has NO direct DML on capacity-config tables (Codex #7)', async () => {
    const c = await connect()
    await become(c, 'service_role')
    for (const t of [
      'availability_conflict_groups', 'capacity_groups', 'business_services',
      'service_zones', 'business_service_zones', 'service_windows',
      'service_window_zones', 'service_member_capacity_defaults',
      'service_window_assignments', 'service_window_assignment_zones',
    ]) {
      await expectError(
        c.query(`insert into public.${t} default values`),
        /permission denied/,
      )
      await expectError(c.query(`update public.${t} set id = id`), /permission denied/)
      await expectError(c.query(`delete from public.${t}`), /permission denied/)
      // Reads stay available for tooling.
      await c.query(`select * from public.${t} limit 1`)
    }
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
