import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const here = path.dirname(fileURLToPath(import.meta.url));
const asset = (name) => path.join(here, "assets", name);
const config = JSON.parse(fs.readFileSync(path.join(here, "provider.json"), "utf8"));

const mimeFor = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".svg" ? "image/svg+xml" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
};

const dataUri = (filename) => {
  const data = fs.readFileSync(filename).toString("base64");
  return `data:${mimeFor(filename)};base64,${data}`;
};

const fontUri = (weight) => {
  const filename = `/Users/dannybaker/Library/Fonts/FontBase/Poppins-${weight}.ttf`;
  return `data:font/ttf;base64,${fs.readFileSync(filename).toString("base64")}`;
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const providerName = escapeXml(config.providerName);
const providerCode = escapeXml(config.providerCode);
const displayUrl = escapeXml(config.displayUrl);

const providerLogo = config.providerLogo
  ? `<image href="${dataUri(path.resolve(here, config.providerLogo))}" x="72" y="61" width="142" height="142" preserveAspectRatio="xMidYMid meet"/>`
  : `<g aria-label="Provider logo placeholder">
      <rect x="70" y="59" width="146" height="146" rx="22" fill="#FFFFFF" stroke="#8AA2A8" stroke-width="3" stroke-dasharray="9 8"/>
      <circle cx="143" cy="111" r="13" fill="#DDEDEF"/>
      <circle cx="116" cy="118" r="8" fill="#DDEDEF"/>
      <circle cx="170" cy="118" r="8" fill="#DDEDEF"/>
      <path d="M112 148c0-20 14-31 31-31s31 11 31 31c0 17-12 26-31 26s-31-9-31-26Z" fill="#DDEDEF"/>
      <text x="143" y="191" text-anchor="middle" class="micro" fill="#51676D">YOUR LOGO</text>
    </g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="958" height="1200" viewBox="0 0 958 1200" xmlns="http://www.w3.org/2000/svg">
  <title>Petappro provider social download graphic</title>
  <desc>Editable social graphic with provider logo, name, referral code, QR code, store badges and Petappro branding.</desc>
  <defs>
    <style>
      @font-face { font-family: Poppins; src: url('${fontUri("Regular")}'); font-weight: 400; }
      @font-face { font-family: Poppins; src: url('${fontUri("Medium")}'); font-weight: 500; }
      @font-face { font-family: Poppins; src: url('${fontUri("SemiBold")}'); font-weight: 600; }
      @font-face { font-family: Poppins; src: url('${fontUri("Bold")}'); font-weight: 700; }
      text { font-family: Poppins, sans-serif; }
      .eyebrow { font-size: 18px; font-weight: 600; letter-spacing: 2.2px; }
      .provider { font-size: 44px; font-weight: 700; }
      .headline { font-size: 60px; font-weight: 700; letter-spacing: -1.7px; }
      .body { font-size: 23px; font-weight: 400; }
      .bodyStrong { font-size: 24px; font-weight: 600; }
      .chip { font-size: 15px; font-weight: 600; }
      .code { font-size: 30px; font-weight: 700; letter-spacing: 0.8px; }
      .cardTitle { font-size: 24px; font-weight: 700; }
      .cardBody { font-size: 17px; font-weight: 400; }
      .url { font-size: 16px; font-weight: 600; }
      .micro { font-size: 11px; font-weight: 600; letter-spacing: 1px; }
    </style>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#1B353C" flood-opacity="0.14"/>
    </filter>
    <clipPath id="dogCrop">
      <rect x="0" y="618" width="650" height="582"/>
    </clipPath>
  </defs>

  <rect width="958" height="1200" fill="#F7F3EA"/>
  <path d="M728 0h230v275c-72 19-143-19-183-79C742 146 726 77 728 0Z" fill="#DDEDEF"/>
  <circle cx="902" cy="79" r="84" fill="#64AC2B" opacity="0.14"/>
  <path d="M0 1048c123-45 248-28 360 50 51 36 94 70 158 102H0v-152Z" fill="#EAF4DF"/>
  <circle cx="39" cy="519" r="14" fill="#64AC2B" opacity="0.72"/>
  <circle cx="921" cy="418" r="20" fill="#006B78" opacity="0.18"/>

  ${providerLogo}
  <text x="258" y="85" class="eyebrow" fill="#64AC2B">PET CARE WITH</text>
  <text x="258" y="137" class="provider" fill="#003E4D">${providerName}</text>
  <g transform="translate(258 163)">
    <rect width="112" height="34" rx="17" fill="#EAF4DF"/><text x="56" y="23" text-anchor="middle" class="chip" fill="#426E25">DOG WALKING</text>
    <rect x="122" width="92" height="34" rx="17" fill="#DDEDEF"/><text x="168" y="23" text-anchor="middle" class="chip" fill="#006B78">BOARDING</text>
    <rect x="224" width="87" height="34" rx="17" fill="#F0E5D8"/><text x="267.5" y="23" text-anchor="middle" class="chip" fill="#8A5B39">SITTING</text>
    <rect x="321" width="88" height="34" rx="17" fill="#EEE4CF"/><text x="365" y="23" text-anchor="middle" class="chip" fill="#8A651F">DAYCARE</text>
  </g>

  <text x="56" y="287" class="headline" fill="#172E35">Your pet’s care,</text>
  <text x="56" y="354" class="headline" fill="#006B78">now in your pocket.</text>
  <text x="58" y="402" class="body" fill="#334A51">Book walks, daycare, sitting &amp; boarding with me—</text>
  <text x="58" y="436" class="body" fill="#334A51">right from the Petappro app.</text>

  <g filter="url(#shadow)">
    <rect x="56" y="478" width="846" height="112" rx="25" fill="#003E4D"/>
  </g>
  <circle cx="106" cy="534" r="26" fill="#64AC2B"/>
  <path d="M94 535l8 8 17-19" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="148" y="520" class="bodyStrong" fill="#FFFFFF">Enter this provider code when prompted</text>
  <text x="148" y="554" class="cardBody" fill="#CBE1E5">Connect with me. Questions? Contact me anytime.</text>
  <rect x="650" y="500" width="222" height="68" rx="16" fill="#FFFFFF"/>
  <text x="761" y="545" text-anchor="middle" class="code" fill="#003E4D">${providerCode}</text>

  <g clip-path="url(#dogCrop)">
    <svg x="-16" y="618" width="680" height="582" viewBox="0 500 1122 902" preserveAspectRatio="xMidYMid meet">
      <image href="${dataUri(asset("provider-dogs.png"))}" width="1122" height="1402"/>
    </svg>
  </g>

  <g filter="url(#shadow)">
    <rect x="608" y="628" width="294" height="436" rx="32" fill="#FFFFFF"/>
  </g>
  <text x="755" y="677" text-anchor="middle" class="cardTitle" fill="#172E35">Get the app</text>
  <image href="${dataUri(asset("download-qr.svg"))}" x="667" y="700" width="176" height="176"/>
  <text x="755" y="902" text-anchor="middle" class="cardBody" fill="#334A51">Scan to download</text>
  <text x="755" y="929" text-anchor="middle" class="url" fill="#006B78">${displayUrl}</text>
  <image href="${dataUri(asset("app-store-badge.svg"))}" x="642" y="956" width="118" height="39.5"/>
  <image href="${dataUri(asset("google-play-badge.png"))}" x="766" y="956" width="134" height="39.7"/>
  <text x="755" y="1028" text-anchor="middle" class="micro" fill="#6A777B">SCAN • DOWNLOAD • CONNECT</text>

  <rect x="694" y="1082" width="222" height="100" rx="21" fill="#FFFFFF" opacity="0.94"/>
  <image href="${dataUri(asset("petappro-by-base509.svg"))}" x="716" y="1092" width="178" height="80" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

const svgPath = path.join(here, "petappro-provider-download-template.svg");
const pngPath = path.join(here, "petappro-provider-download-template.png");
fs.writeFileSync(svgPath, svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
console.log(`Created ${svgPath}`);
console.log(`Created ${pngPath}`);
