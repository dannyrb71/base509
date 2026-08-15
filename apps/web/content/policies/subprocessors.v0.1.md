# Sub-processors

## WHAT THIS PAGE IS

To run Base509's products (starting with PetAppro) we use a small number of vendors ("sub-processors"). They process data only to provide their piece of the service, under contract, and cannot use it for their own purposes. We keep this list current and notify providers before a new sub-processor starts processing their client data.

## CURRENT SUB-PROCESSORS

- Vercel — website + app hosting, CDN, serverless functions. Data: request/IP logs; form submissions in transit. Location: US.
- Supabase — database, authentication, file storage. Data: waitlist emails now; at launch, account data, provider business data, client + pet records, photos. Location: US.
- Google Workspace (Google LLC) — business email + document storage. Data: email we send/receive (e.g. support@), any attachments. Location: US.
- Resend — transactional + notification email delivery (waitlist confirmation, launch notice; later receipts/reminders). Data: name, email, message content. Location: US.
- Stripe — payments: provider subscriptions (Billing) and client→provider payments (Connect). Added when payments go live at launch. Data: name, email, billing details, transaction data. Card numbers go to Stripe, not us. Location: US.

## STRIPE IS NOT A BLANKET SUB-PROCESSOR

For much of what Stripe does — payments, identity verification, fraud prevention, regulatory compliance — Stripe acts as an independent controller for its own purposes, under its own agreements and privacy notice, not our DPA.

Added as the PetAppro mobile app ships (confirmed before they process any data): app build/update + push delivery (e.g. Expo/EAS, Apple APNs, Google FCM) and error monitoring. These are not active yet and are intentionally not listed until they are.

## NOT SUB-PROCESSORS (DELIBERATELY NOTED)

- GitHub — hosts our source code, not customer data. A developer tool, not a data processor.
- Cloudflare — our domain registrar + DNS. With email handled by Google Workspace's mail servers, Cloudflare does not process customer personal data.

## WHAT WE DELIBERATELY DON'T USE

- No third-party advertising or tracking pixels — not on our sites, not in the app.
- No data brokers — we don't buy or enrich personal information.
- No analytics that sells or shares your data.

## CHANGES TO THIS LIST

We'll post changes here and notify providers who've subscribed to updates before a new sub-processor starts processing their client data.

## CONTACT

support@base509.com · Base509 LLC, 1875 Mission St Ste 103 #660, San Francisco, CA 94103.
