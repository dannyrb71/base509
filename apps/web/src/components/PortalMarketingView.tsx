'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PortalPageHeader, PortalPanel } from '@/components/PortalShell';

const AD_TEMPLATE = '/brands/petappro.com/petappro_social_ad_template.png';
const SAMPLE_PROVIDER_CODE = 'WOOF12345';
const SERVICES = [
  { name: 'Boarding', live: true },
  { name: 'Daycare', live: true },
  { name: 'Walking', live: true },
  { name: 'Training', live: false },
  { name: 'Drop-In Visits', live: false },
  { name: 'In-Home Sitting', live: false },
  { name: 'Grooming', live: false },
] as const;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
  });
}

export function PortalMarketingView() {
  const [businessName, setBusinessName] = useState('WOOF WETREATS');
  const [logo, setLogo] = useState('');
  const [selected, setSelected] = useState(['Boarding', 'Daycare', 'Walking']);
  const [notice, setNotice] = useState('');
  const initials = businessName.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || 'WW';

  const downloadGraphic = async () => {
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 958; canvas.height = 1200;
    const context = canvas.getContext('2d'); if (!context) return;
    const template = await loadImage(AD_TEMPLATE); context.drawImage(template, 0, 0, 958, 1200);
    const brandRoot = document.querySelector<HTMLElement>('[data-brand="petappro"]');
    if (!brandRoot) return;
    const styles = getComputedStyle(brandRoot);
    const navy = styles.getPropertyValue('--pa-brandy-800').trim();
    const accent = styles.getPropertyValue('--pa-brand-accent').trim();
    const olive = styles.getPropertyValue('--pa-camo-700').trim();
    const surface = styles.getPropertyValue('--surface-card').trim();
    const inverseText = styles.getPropertyValue('--text-inverse').trim();
    const primaryText = styles.getPropertyValue('--text-primary').trim();

    let nameX = 86;
    if (logo) {
      context.fillStyle = surface; context.beginPath(); context.roundRect(72, 48, 144, 144, 20); context.fill();
      const logoImage = await loadImage(logo); const ratio = Math.min(112 / logoImage.width, 112 / logoImage.height); const width = logoImage.width * ratio; const height = logoImage.height * ratio;
      context.drawImage(logoImage, 144 - width / 2, 120 - height / 2, width, height); nameX = 238;
    }
    context.fillStyle = navy; context.font = '700 44px Poppins, sans-serif'; context.fillText(businessName.toUpperCase().slice(0, 24), nameX, 100);
    context.fillStyle = accent; context.font = '700 16px Poppins, sans-serif'; context.fillText('THEIR HOME AWAY FROM HOME', nameX, 132);

    let badgeX = nameX;
    selected.forEach((service, index) => {
      const label = service.toUpperCase(); context.font = '700 13px Poppins, sans-serif'; const width = context.measureText(label).width + 30;
      context.fillStyle = index === 0 ? navy : index === 1 ? olive : accent; context.beginPath(); context.roundRect(badgeX, 150, width, 28, 14); context.fill();
      context.fillStyle = inverseText; context.fillText(label, badgeX + 15, 169); badgeX += width + 8;
    });
    context.fillStyle = primaryText; context.font = '700 24px Poppins, sans-serif'; context.textAlign = 'center'; context.fillText(SAMPLE_PROVIDER_CODE, 761, 580); context.textAlign = 'start';

    const link = document.createElement('a'); link.download = 'petappro-provider-social-ad.png'; link.href = canvas.toDataURL('image/png'); link.click();
    setNotice('Customized social graphic downloaded as a PNG.');
  };

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Marketing" title="Share Your Client App" body="Generate the Figma-designed provider graphic with your business identity, active services, and provider code." />
      <div className="portal-marketing-grid">
        <PortalPanel title="Customize Graphic" eyebrow="Feed post · 958 × 1200">
          <div className="portal-field-grid"><label><span>Business Name</span><input value={businessName} maxLength={24} onChange={(event) => setBusinessName(event.target.value)} /></label><label><span>Provider Code · Auto-Generated</span><input value={SAMPLE_PROVIDER_CODE} readOnly aria-describedby="provider-code-help" /></label></div>
          <div className="portal-account-callout" id="provider-code-help"><strong className="type-body-bold">Assigned Automatically</strong><p className="type-body">PetAppro assigns every provider business a unique public new-client code when the account is created. It cannot be edited here. The same code is embedded in the share link and QR code so new clients connect to the correct business.</p><p className="type-caption">This public acquisition code is separate from any private, pre-approved existing-client invitation.</p></div>
          <div className="portal-logo-upload portal-logo-upload--compact"><div className="portal-logo-upload__preview">{logo ? <Image src={logo} alt="Uploaded logo" width={80} height={80} unoptimized /> : <span className="type-title">{initials}</span>}</div><div><strong className="type-body-bold">Logo or Name-Only</strong><p className="type-caption">The layout adapts to square, vertical, horizontal, or no logo.</p><label className="btn btn--cta type-button" htmlFor="marketing-logo-upload">Choose Logo</label><input id="marketing-logo-upload" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); }} /></div></div>
          <fieldset className="portal-service-picker"><legend className="type-body-bold">Services Offered</legend>{SERVICES.map((service) => <label className={!service.live ? 'is-future' : undefined} key={service.name}><input type="checkbox" checked={selected.includes(service.name)} disabled={!service.live} onChange={(event) => setSelected((items) => event.target.checked ? [...items, service.name] : items.filter((item) => item !== service.name))} /><span>{service.name}</span>{!service.live && <small>Future</small>}</label>)}</fieldset>
          <div className="portal-marketing-actions"><button className="btn btn--cta type-button portal-download-button" type="button" onClick={downloadGraphic}><span aria-hidden="true">↓</span> Download PNG</button><button className="btn btn--secondary type-button" type="button" disabled>Story Format · Coming Soon</button></div>
          {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
        </PortalPanel>

        <PortalPanel title="Preview" eyebrow="Figma social-ad template">
          <div className="portal-social-preview">
            <Image src={AD_TEMPLATE} alt="Customized PetAppro provider social graphic preview" width={958} height={1200} priority />
            <div className={`portal-social-preview__identity${logo ? ' has-logo' : ''}`}>
              {logo && <span><Image src={logo} alt="" width={72} height={72} unoptimized /></span>}
              <div><strong>{businessName || 'YOUR BUSINESS NAME'}</strong><small>THEIR HOME AWAY FROM HOME</small><div>{selected.map((service) => <i key={service}>{service}</i>)}</div></div>
            </div>
            <strong className="portal-social-preview__code">{SAMPLE_PROVIDER_CODE}</strong>
          </div>
        </PortalPanel>
      </div>
    </div>
  );
}
