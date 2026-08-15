import fs from 'node:fs';
import path from 'node:path';

/**
 * POLICY REGISTRY — the one canonical policy source (spec §6, D-055).
 *
 * Model:
 *  - Policies live ONCE, here, as versioned markdown in content/policies/.
 *  - Rendered per surface: base509.com/policies/* (canonical) and
 *    petappro.com/privacy,/terms,/policies (same content, PetAppro-styled).
 *  - Every version has a number + effective date. Old versions stay archived
 *    and viewable at /policies/<slug>/v/<version>.
 *  - PUBLISHING IS A DELIBERATE ACT: a version only becomes the live agreement
 *    when `published` below is set to its version string (an explicit edit +
 *    deploy — never a live-mutating page). Until then drafts render with a
 *    "DRAFT — PENDING COUNSEL" banner.
 *
 * ⚠️ CONTENT RULE: no legal copy is authored or edited in this codebase.
 * Drafts come from docs/legal/*.draft.md (Cowork-authored → attorney-reviewed).
 * Files in content/policies/ are wired in verbatim.
 */

export type PolicyVersion = {
  version: string;
  /** null until counsel signs off and Danny publishes */
  effectiveDate: string | null;
  status: 'draft' | 'published' | 'archived';
  /** file under content/policies/ — absent for placeholder policies */
  file?: string;
  note?: string;
  /** interim website-only document (pre-launch) — renders the scope callout */
  interim?: boolean;
};

export type Policy = {
  slug: string;
  title: string;
  /** 'core' = every Base509 product · 'petappro' = PetAppro-specific */
  scope: 'core' | 'petappro';
  summary: string;
  /** version string of the currently-published version, or null if none */
  published: string | null;
  versions: PolicyVersion[];
};

/**
 * Provenance for the six additional-policy drafts below. They were TRANSCRIBED
 * character-for-character from the approved Figma page
 * "base509.com / Additional Policies" (file G8baGBnIdgf5TABaICn7tU, node
 * 211:522) — every sentence traces to a TEXT node on that frame. Nothing here
 * was authored, paraphrased, or edited in this codebase (COPY-AUDIT §9).
 * All six were PUBLISHED as v1.0, effective 2026-08-12 (Danny, 2026-08-13).
 * The content files keep their original `*.v0.1.md` names — the file name is an
 * opaque key, the version string in the registry is what the page renders.
 */
const FIGMA_NOTE =
  'Transcribed verbatim from Figma "base509.com / Additional Policies" (G8baGBnIdgf5TABaICn7tU, node 211:522).';

export const POLICIES: Policy[] = [
  {
    // Interim: website Terms of Use while pre-launch (Danny, 2026-07-21).
    // The product agreement (Provider/Client Terms) replaces this at launch.
    // The old product-ToS v0.1 draft was pulled from PUBLIC history (it carried
    // [TBD]/[COUNSEL] placeholders reachable at /v/0.1); its source stays in docs/legal.
    slug: 'terms',
    title: 'Terms of Use',
    scope: 'core',
    summary: 'The terms for using our websites while our products are pre-launch.',
    published: 'interim-1.0',
    versions: [
      {
        version: 'interim-1.0',
        effectiveDate: '2026-07-21',
        status: 'published',
        file: 'terms-of-use.interim-1.0.md',
        note: 'Interim website terms — replaced by Provider Terms and Client Terms at launch.',
        interim: true,
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    scope: 'core',
    summary: 'What we collect on our websites while our products are pre-launch, and your choices.',
    published: 'interim-1.0',
    versions: [
      {
        version: 'interim-1.0',
        effectiveDate: '2026-07-21',
        status: 'published',
        file: 'privacy.interim-1.0.md',
        note: 'Interim website policy — replaced by the full app privacy policy before launch.',
        interim: true,
      },
    ],
  },
  {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    scope: 'core',
    summary: 'How to cancel a subscription — self-serve, online, one click. (California ARL.)',
    published: '1.0',
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'cancellation.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    scope: 'core',
    summary: 'When and how we refund subscription payments.',
    published: '1.0',
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'refund.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'ownership',
    title: 'Account Ownership Policy',
    scope: 'core',
    summary: 'Who owns an account and its data, and what happens when an owner leaves or deletes.',
    published: '1.0',
    // D-057 (open decision) is answered in the draft below (§6 evidence ladder),
    // but the answer is not settled until counsel signs off.
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'ownership.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'subprocessors',
    title: 'Sub-processors',
    scope: 'core',
    summary: 'The vendors that process data on our behalf, and what each one does.',
    published: '1.0',
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'subprocessors.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'dpa',
    title: 'Data Processing Addendum',
    scope: 'petappro',
    summary: 'The data-processing terms between Base509 and each provider (provider-facing).',
    published: '1.0',
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'dpa.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility Statement',
    scope: 'core',
    summary: 'Our WCAG 2.1 AA commitment and how to reach us about accessibility issues.',
    published: '1.0',
    versions: [
      {
        version: '1.0',
        effectiveDate: '2026-08-12',
        status: 'published',
        file: 'accessibility.v0.1.md',
        note: FIGMA_NOTE,
      },
    ],
  },
  {
    slug: 'security',
    title: 'Security Overview',
    scope: 'core',
    summary: 'How we protect the data on our platform. (Planned — trust asset.)',
    published: null,
    versions: [],
  },
  // '/ccpa' (CA Notice at Collection) is deliberately ABSENT: per spec §6.4 it
  // only exists if we cross CCPA thresholds. Add it here if that ever happens.
];

const CONTENT_DIR = path.join(process.cwd(), 'content', 'policies');

export function getPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}

export function getVersion(policy: Policy, version: string): PolicyVersion | undefined {
  return policy.versions.find((v) => v.version === version);
}

/** The version a visitor should see: the published one, else the latest draft. */
export function currentVersion(policy: Policy): PolicyVersion | undefined {
  if (policy.published) return getVersion(policy, policy.published);
  return policy.versions[policy.versions.length - 1];
}

/**
 * PUBLIC LINKABILITY — only text that has been through publication gets a
 * permalink. A `draft` is a working document: it may still render at
 * /policies/<slug> behind the DRAFT banner (the deliberate pre-counsel
 * preview), but it gets NO /v/<version> permalink and NO entry in the public
 * version history.
 *
 * Why: the old product-ToS v0.1 draft was reachable at /policies/terms/v/0.1
 * via the version-history link and served its raw [COUNSEL:]/[TBD] working
 * flags to the public. Removing that one entry fixed that instance; this
 * predicate is the structural fix, so the next draft can't leak the same way.
 */
export function isPubliclyLinkable(v: PolicyVersion): boolean {
  return v.status === 'published' || v.status === 'archived';
}

/** The versions a visitor may link to or see listed. Never includes drafts. */
export function publicVersions(policy: Policy): PolicyVersion[] {
  return policy.versions.filter(isPubliclyLinkable);
}

export function readVersionMarkdown(v: PolicyVersion): string | null {
  if (!v.file) return null;
  const p = path.join(CONTENT_DIR, v.file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

export function policiesForSurface(surface: 'base509' | 'petappro'): Policy[] {
  if (surface === 'base509') return POLICIES;
  return POLICIES.filter((p) => p.scope === 'core' || p.scope === 'petappro');
}
