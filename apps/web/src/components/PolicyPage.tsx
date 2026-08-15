import Link from 'next/link';
import { marked } from 'marked';
import {
  Policy, PolicyVersion, currentVersion, readVersionMarkdown, publicVersions,
} from '@/lib/policies';

/** Figma shows "Effective July 21, 2026", not the ISO string. Parsed as UTC so
 *  the date never shifts a day backwards in western timezones. */
function formatEffective(iso?: string | null) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Renders one policy, one page (never a wall of combined legal copy).
 * Shared by both surfaces — the surrounding brand layout does the styling.
 * `basePath` is where the policy hub lives on this surface
 * (base509: /policies · petappro: /policies).
 */
export function PolicyArticle({
  policy, version, basePath,
}: { policy: Policy; version?: PolicyVersion; basePath: string }) {
  const v = version ?? currentVersion(policy);

  if (!v) {
    return (
      <article className="prose">
        <h1>{policy.title}</h1>
        <div className="policy-banner" role="status">
          PLACEHOLDER — this policy has not been drafted yet. An attorney drafts and
          reviews all policy text before anything is published here.
        </div>
        <p>{policy.summary}</p>
        <p>
          Questions in the meantime? Contact{' '}
          <a href="mailto:support@base509.com">support@base509.com</a>.
        </p>
      </article>
    );
  }

  const isDraft = v.status !== 'published' || policy.published !== v.version;
  const isArchived = policy.published !== null && v.version !== policy.published;
  const md = readVersionMarkdown(v);
  // The page H1 comes from the registry so the title is consistent on every
  // surface (fixes the "PetAppro Terms of Service" heading on the Base509 site
  // — policies are company-level canonical, Danny 2026-07-18). The draft's own
  // leading "# ..." line is dropped AT RENDER ONLY; the source .md body is
  // untouched (attorney boundary).
  const body = md ? md.replace(/^#\s+.*\n/, '') : null;
  const html = body ? (marked.parse(body) as string) : null;

  return (
    <article className="prose">
      <h1>{policy.title}</h1>
      {isDraft && !isArchived && (
        <div className="policy-banner" role="status">
          DRAFT — PENDING COUNSEL. This text has not been reviewed or approved by an
          attorney and is not yet in effect.
        </div>
      )}
      {isArchived && (
        <div className="policy-banner" role="status">
          ARCHIVED VERSION {v.version}
          {v.effectiveDate ? ` — was effective ${formatEffective(v.effectiveDate)}` : ''}. This is not the
          current policy. <Link href={`${basePath}/${policy.slug}`}>View the current version</Link>.
        </div>
      )}
      <div className="policy-meta">
        <span>{v.interim ? `Interim v${v.version.replace('interim-', '')}` : `Version ${v.version}`}</span>
        <span>
          {v.effectiveDate ? `Effective ${formatEffective(v.effectiveDate)}` : 'Not yet in effect'}
        </span>
        {publicVersions(policy).length > 0 && (
          <Link href={`${basePath}/${policy.slug}/versions`}>Version history</Link>
        )}
      </div>
      {v.interim && !isArchived && (
        <div className="card" style={{ padding: '14px 18px', margin: '4px 0 20px', fontSize: 15 }}>
          This covers the PetAppro website while we&rsquo;re pre-launch. Fuller terms and a
          fuller privacy policy will govern the app, and you&rsquo;ll see them before you can
          create an account.
        </div>
      )}
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p>Content file missing for version {v.version}.</p>
      )}
    </article>
  );
}

export function PolicyIndex({
  policies, basePath, intro,
}: { policies: Policy[]; basePath: string; intro: string }) {
  return (
    <div>
      {intro && <p className="lead policy-index__intro">{intro}</p>}
      <div className="grid grid--2">
        {policies.map((p) => {
          const v = currentVersion(p);
          return (
            // The WHOLE card is the link, not just the title — a card that
            // looks clickable must be clickable everywhere. The title is a
            // plain <h3> now: an <a> inside this <a> would be invalid HTML.
            // aria-label keeps the accessible name short ("Refund Policy")
            // instead of reading out summary + status + CTA.
            <Link
              className="card card--raised policy-card"
              key={p.slug}
              href={`${basePath}/${p.slug}`}
              aria-label={p.title}
            >
              <h3 className="type-title">{p.title}</h3>
              <p className="type-body">{p.summary}</p>
              <p className="policy-card__status type-caption">
                {p.published
                  ? v?.interim
                    ? `Interim v${p.published.replace('interim-', '')} — in effect`
                    : `Version ${p.published} · effective ${v?.effectiveDate}`
                  : v
                    ? `Draft v${v.version} — pending counsel`
                    : 'Placeholder — not yet drafted'}
              </p>
              <span className="card__cta type-body-bold">
                Read the full policy <span aria-hidden="true">→</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PolicyVersionList({
  policy, basePath,
}: { policy: Policy; basePath: string }) {
  return (
    <div className="prose">
      <h1>{policy.title} — version history</h1>
      <p>
        Every version of this policy is archived here. Your agreement stays bound to the
        version you accepted until you accept a newer one.
      </p>
      {/* Drafts are deliberately absent: a version only becomes publicly
          linkable once it has been published (see isPubliclyLinkable). */}
      {publicVersions(policy).length === 0 && <p>No published versions yet.</p>}
      <ul>
        {publicVersions(policy).map((v) => (
          <li key={v.version}>
            <Link href={`${basePath}/${policy.slug}/v/${v.version}`}>Version {v.version}</Link>
            {' — '}
            {policy.published === v.version
              ? `current, effective ${formatEffective(v.effectiveDate)}`
              : `archived${v.effectiveDate ? `, was effective ${formatEffective(v.effectiveDate)}` : ''}`}
            {v.note ? ` · ${v.note}` : ''}
          </li>
        ))}
      </ul>
      <p><Link href={`${basePath}/${policy.slug}`}>← Back to current version</Link></p>
    </div>
  );
}
