'use client';

import type { ReactNode } from 'react';

/**
 * Social-auth staging area (A1): the "or continue with" divider + Google/
 * Apple button slots, LAYOUT ONLY for now. A2 (launch requirement, before
 * Oct 1) wires Google + Apple + passcode by passing real handlers — the
 * buttons enable themselves and the "arriving soon" caption disappears, no
 * redesign. Until then the buttons are disabled and honestly labeled; we
 * never render dead-but-clickable controls.
 */
export function PortalAuthProviders({
  onGoogle,
  onApple,
}: {
  /** A2 wires these; absent → the A1 staged (disabled) presentation. */
  onGoogle?: () => void;
  onApple?: () => void;
}) {
  const wired = Boolean(onGoogle && onApple);
  return (
    <div className="portal-auth__providers-block">
      <div className="portal-auth__divider" role="separator" aria-label="or continue with">
        <span className="type-caption">or continue with</span>
      </div>
      <div className="portal-auth__providers">
        <ProviderButton label="Google" onClick={onGoogle} icon={<GoogleMark />} />
        <ProviderButton label="Apple" onClick={onApple} icon={<AppleMark />} />
      </div>
      {!wired && (
        <p className="type-caption portal-auth__providers-note">
          Google &amp; Apple sign-in arrive with the next update — email works today.
        </p>
      )}
    </div>
  );
}

function ProviderButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="portal-auth__provider type-button"
      type="button"
      disabled={!onClick}
      aria-disabled={!onClick}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.29v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.29a12 12 0 0 0 0 10.78l3.99-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.61l3.99 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.87 12.72c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.16-3 .9-3.78.9-.78 0-1.98-.88-3.26-.86-1.68.03-3.22.97-4.08 2.47-1.74 3.02-.44 7.49 1.25 9.94.83 1.2 1.82 2.55 3.12 2.5 1.25-.05 1.72-.81 3.23-.81 1.5 0 1.93.81 3.25.79 1.35-.03 2.2-1.22 3.02-2.43.95-1.39 1.34-2.74 1.36-2.81-.03-.02-2.61-1-2.63-3.97ZM14.4 5.37c.68-.83 1.15-1.98 1.02-3.12-.99.04-2.18.66-2.89 1.48-.63.73-1.19 1.9-1.04 3.02 1.1.09 2.22-.56 2.91-1.38Z" />
    </svg>
  );
}
