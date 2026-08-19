import Image from 'next/image';

/** Minimal centered card shell for the portal auth pages (no app chrome). */
export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-auth">
      <div className="portal-auth__card" role="main">
        <Image
          src="/brands/petappro/petappro-wordmark.svg"
          alt="PetAppro"
          width={166}
          height={40}
          priority
          className="portal-auth__logo"
        />
        {children}
      </div>
    </div>
  );
}
