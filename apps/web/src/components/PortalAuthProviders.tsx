'use client';

/**
 * Social sign-in buttons to VENDOR BRAND SPEC (launch-gate / App-Store-review
 * requirement) — staged in A1, wired in A2 (launch requirement, before Oct 1).
 *
 * Google — per Google Identity branding guidelines (hand-built from the
 * official assets, matching the GIS "light" rendered button): the four-color
 * "G" mark UNMODIFIED, white fill, #747775 border, #1F1F1F text, Google
 * Sans/Roboto Medium. CTA text is one of the sanctioned strings, chosen per
 * page ("Sign up with Google" / "Sign in with Google").
 *
 * Apple — per Sign in with Apple HIG, black variant: black fill, white Apple
 * mark UNMODIFIED, white text in the system font stack, sanctioned CTA
 * ("Sign up with Apple" / "Sign in with Apple").
 *
 * Equal size and prominence (full-width, 44px, same radius). A1 renders them
 * inert (disabled, no handlers, honest caption) but ALREADY brand-compliant —
 * A2 passes onGoogle/onApple and only functionality changes. When A2 adopts
 * the vendors' own rendered buttons (GIS / Apple JS), they replace these
 * markup-for-markup inside the same slots.
 */

/** Official Google "G" (four-color) — do not restyle or recolor. */
function GoogleMark() {
  return (
    <svg className="portal-auth__provider-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Official Apple mark (white, for the black button) — do not restyle. */
function AppleMark() {
  return (
    <svg className="portal-auth__provider-mark portal-auth__provider-mark--apple" viewBox="0 0 170 170" aria-hidden="true" focusable="false">
      <path
        fill="#FFFFFF"
        d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.737.12 1.083.17 2.166.17 3.268z"
      />
    </svg>
  );
}

export function PortalAuthProviders({
  mode,
  onGoogle,
  onApple,
}: {
  /** Chooses the sanctioned CTA strings ("Sign up with …" / "Sign in with …"). */
  mode: 'sign-up' | 'sign-in';
  /** A2 wires these; while absent the buttons render inert (never dead-but-clickable). */
  onGoogle?: () => void;
  onApple?: () => void;
}) {
  const verb = mode === 'sign-up' ? 'Sign up' : 'Sign in';
  const wired = Boolean(onGoogle || onApple);
  return (
    <div className="portal-auth__providers-block">
      <div className="portal-auth__divider type-caption" aria-hidden="true">or continue with</div>
      <div className="portal-auth__providers">
        <button
          className="portal-auth__provider portal-auth__provider--google"
          type="button"
          disabled={!onGoogle}
          aria-disabled={!onGoogle}
          onClick={onGoogle}
        >
          <GoogleMark />
          <span>{verb} with Google</span>
        </button>
        <button
          className="portal-auth__provider portal-auth__provider--apple"
          type="button"
          disabled={!onApple}
          aria-disabled={!onApple}
          onClick={onApple}
        >
          <AppleMark />
          <span>{verb} with Apple</span>
        </button>
      </div>
      {!wired && (
        <p className="portal-auth__providers-note type-caption">
          Google &amp; Apple sign-in arrive with the next update — email works today.
        </p>
      )}
    </div>
  );
}
