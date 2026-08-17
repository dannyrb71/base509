# PetAppro Privacy Policy

> ## ⛔ DRAFT v0.2 — DO NOT PUBLISH
> **Remains DO NOT PUBLISH until ALL of the following are implemented and verified:**
> 1. the **retention schedule** (§6) has real numbers, not `[PERIOD]`;
> 2. the **GPS just-in-time disclosure** ships (Google requires it *before* the permission prompt — a policy paragraph is not enough);
> 3. the **vendor inventory** is confirmed by engineering (the subprocessor page is still unverified — do not link it as a definitive list);
> 4. every **security claim** in §9 is implemented and tested;
> 5. **Client-deletion behavior** matches what §7 says — the v0.1 promise was false;
> 6. Apple **App Privacy** + Google **Data Safety** answers are synchronized with this text.
>
> **Status:** Draft v0.2 (2026-07-17) — rebuilt on attorney-review feedback. Supersedes v0.1 entirely.
> **Author:** Cowork · **Reviewer:** attorney · **Renders via:** the `/policies` hub.

**Effective date:** `[DATE]` · **Version:** `[VERSION]`

---

PetAppro is software provided by Base509 LLC. Pet-care businesses use PetAppro to operate their businesses, and their Clients use it to manage pet information and bookings with those businesses.

This Policy explains what personal information PetAppro collects, how we use and disclose it, and the choices available to you.

## The short version

- We do not sell personal information or share it for cross-context behavioral advertising.
- **We do not use a Provider's Client list, booking records, care records, or other Provider-controlled data to target advertising or market PetAppro to that Provider's Clients.** PetAppro may advertise through general digital channels, and a Provider's Client may see those advertisements independently.
- Providers control the Client, pet, booking, care, and workforce records they manage through PetAppro.
- PetAppro separately controls information needed to operate accounts, authentication, security, subscriptions, direct support, diagnostics, and legal compliance.
- Precise location is collected only for an active location-enabled service, after permission is granted.
- PetAppro does not provide advertising based on location, pet information, or booking activity.
- You can initiate account deletion from inside the app and through our web deletion resource.

---

## 1. Who is responsible for your information

PetAppro handles information in two different roles.

### Information PetAppro controls

Base509 LLC determines how and why PetAppro processes information needed for:
- creation and administration of PetAppro accounts;
- authentication and account security;
- Provider subscriptions and Base509 billing;
- direct support requests sent to PetAppro;
- service, security, diagnostic, fraud-prevention, and audit records;
- communications from PetAppro about the software; and
- compliance with PetAppro's own legal obligations.

This Privacy Policy governs those activities.

### Information Providers control

Each Provider determines how and why it handles the Client, pet, booking, care, invoice, report-card, home-access, and workforce information used to operate its business.

For that information, the Provider is the controller or business and PetAppro acts as its **processor or service provider**. PetAppro processes that information under the Provider's instructions, the applicable Provider agreement, and our Data Processing Addendum.

A Provider's own privacy notice governs its relationship with its Clients and workers. PetAppro's independent role is limited to the platform purposes described above and is not used to circumvent our processor restrictions.

### Stripe and other independent services

Stripe, Apple, Google, and other services may process some information for their own payment, identity, fraud-prevention, security, or legal-compliance purposes. **When they act independently, their own privacy notices and terms govern that processing.**

---

## 2. Information we collect

Depending on how you use PetAppro, we may collect the following categories.

### Account and contact information
- name;
- email address;
- telephone number;
- account and internal user identifiers;
- authentication-provider identifiers;
- account role and Provider relationships; and
- authentication, session, and account-recovery records.

Authentication credentials are handled through our authentication provider. **When you use device biometrics to reauthenticate, PetAppro receives an authentication result from the device; we do not receive or store your fingerprint or facial-recognition template.**

### Provider business information
- business name and contact information;
- logo and business profile;
- service area, operating hours, services, prices, and availability;
- policies, cancellation terms, and business settings;
- staff memberships, roles, and permissions; and
- subscription plan and billing history.

### Client, pet, and care information

Information entered by Clients, Providers, or authorized Provider staff may include:
- Client name, contact information, address, and Provider relationship;
- pet name, breed, age, photographs, veterinarian information, medications, socialization, and care instructions;
- booking dates, requested services, history, report cards, photographs, invoices, receipts, and adjustments;
- emergency contacts; and
- home-entry instructions, lockbox information, alarm instructions, or access codes where needed for a Provider's services.

**Information about an animal may still be personal information** when it identifies or can reasonably be linked to an individual or household.

### Location information

When an authorized Provider worker starts an active location-enabled service and grants device permission, PetAppro collects precise device location to create and display the service route, document the service, and provide the location feature requested by the Provider and Client.

**Location collection may continue while the app is in the background or the screen is off during that active service.** The route may be visible to the Provider's authorized personnel and the Client associated with that booking.

PetAppro does not use precise location for advertising, general employee profiling, or tracking outside an active location-enabled service. Location collection is designed to stop when the service ends or when permission is withdrawn.

**Precise route coordinates are retained for `[RETENTION PERIOD]`, after which `[DELETE OR REDUCE TO NON-PRECISE SERVICE SUMMARY]`.**

**Providers are responsible for giving their staff and contractors any monitoring notice and obtaining any consent required for workplace or contractor location tracking.**

You may decline or revoke location permission through your device settings. If you do, location-dependent features will not work, but unrelated PetAppro features will remain available.

> ### ⛔ `[BLOCKER — GPS. Policy text is NOT sufficient.]`
> **Google requires a separate, prominent, just-in-time in-app disclosure immediately before the permission request.** A privacy-policy paragraph does not satisfy it. ([Google prominent disclosure](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en))
> **Unanswered product questions this policy cannot paper over:**
> - What happens if a worker **forgets to end the walk**? Indefinite background tracking of an employee is the failure mode. Needs an auto-stop (geofence, max duration, or end-of-shift cutoff) — **decide before launch.**
> - Exactly **who** sees the route, and for how long is it visible?
> - **California restricts electronic tracking devices** — [Penal Code §637.7](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.7). Counsel must review the workforce-tracking posture.
> - **Provider Terms need a covenant** obligating Providers to give staff legally required monitoring notice and obtain consent. Not yet drafted. → GPS is a launch gate (**D-054**).

### Payment and transaction information

Stripe processes payment credentials. **PetAppro is not intended to receive or store complete card numbers or card security codes.**

PetAppro may receive and store payment metadata needed to administer subscriptions and record Provider transactions, including:
- payment and transaction identifiers;
- amount, currency, date, and status;
- card brand and last four digits where supplied by Stripe;
- refund, dispute, and chargeback status;
- Provider Stripe account identifiers; and
- subscription and invoice history.

Client booking payments are processed **for the applicable Provider through the Provider's Stripe account**. Provider subscription payments are processed for Base509 LLC.

### Device, usage, and diagnostic information
- IP address;
- browser, operating-system, app-version, and device information;
- device or installation identifiers;
- screens and features used;
- access times and referring pages;
- push-notification tokens;
- crash reports, error records, and performance diagnostics; and
- security, authentication, and audit events.

### Communications

We collect information you send to PetAppro support and communications submitted through account, privacy, security, or legal-request channels.

### Sources of information

We receive information:
- directly from you;
- from the Provider and its authorized staff;
- automatically from your device or browser;
- from identity providers you choose, such as Apple or Google;
- from Stripe and other service providers;
- from other users authorized to submit information concerning a booking, pet, or Provider relationship; and
- from security and fraud-prevention systems.

**We do not purchase personal information from data brokers.**

---

## 3. How we use information

We use information to:
- create, authenticate, secure, and administer accounts;
- provide bookings, scheduling, pricing, payment records, invoices, notifications, report cards, and location-enabled services;
- operate Provider subscriptions;
- provide requested support;
- protect PetAppro, Providers, Clients, animals, and other persons;
- detect fraud, abuse, security incidents, and unauthorized access;
- troubleshoot errors and improve reliability;
- enforce our agreements;
- comply with lawful requests and applicable legal obligations;
- establish, exercise, or defend legal claims; and
- send Providers product, service, and commercial communications consistent with their communication choices.

We may use aggregated or properly deidentified information to understand and improve PetAppro. **We do not attempt to reidentify properly deidentified information.**

**We do not use identifiable Provider Client Data to train general-purpose artificial-intelligence or machine-learning models** unless the applicable Provider and affected person have separately and expressly authorized that use. *(D-055.)*

---

## 4. What we do not do

We do not:
- **sell** personal information or share it for **cross-context behavioral advertising**;
- use Provider-controlled Client lists or Client, pet, booking, care, or payment information to **target or personalize PetAppro advertising**;
- use one Provider's information to **promote or recommend another Provider**;
- operate a **public Provider directory** or introduce Clients to Providers *(D-029)*; or
- use Provider-controlled information for an **unrelated independent commercial purpose**.

### Marketing and advertising

PetAppro may promote its products through websites, search engines, social media, app stores, and other general digital channels. Those advertisements may be seen by anyone, including people who happen to be Clients of a Provider.

**We do not currently:**
- upload Provider Client lists to advertising platforms;
- use Provider-controlled Client, pet, booking, care, or payment information to target or personalize advertising;
- create advertising audiences or lookalike audiences from Provider-controlled data;
- retarget people based on their activity inside the authenticated PetAppro app; or
- disclose Provider-controlled data to advertisers for campaign targeting or measurement.

**General advertising that reaches a Provider's Client incidentally is not marketing based on that Provider's data.**

If we propose to use personal information for materially different advertising, targeting, retargeting, audience-building, or campaign-measurement practices, we will update this Policy before beginning that practice and obtain consent or provide an opt-out where required.

> ### ✅ `[DECIDED — Danny, 2026-07-17: no absolutes in published policy copy.]`
> *"Fine with not saying absolutes (Never, always, etc.) so let's scrub for those. 'we don't' 'we are not' 'do not currently', etc. should work."*
>
> **Adopted.** Both v0.1 absolutes are gone. Published copy uses **present-tense factual statements** ("we do not", "we are not") and **"do not currently"** where a practice could legitimately change. Cowork's pitch for a permanent never-poach covenant was **not** taken — noted and closed, not relitigated.
>
> **Scope of the scrub — published policy copy only.** Present-tense statements of current fact are *not* absolutes and stay: *"we do not sell personal information"* (CCPA-significant), *"we do not purchase from data brokers"*, *"we do not use identifiable Provider Client Data to train general-purpose models"* (D-055). Hedging those into "do not currently" would weaken commitments that are easy to keep and that counsel wants stated plainly. **The scrub targets `never` / `always` / `ever` / `guarantee` / `all` — not the present tense.**
> **Internal governance docs keep their absolutes** (D-058 "never ship a badge" etc.). Those are rules binding us, not representations made to users. Different documents, different job.
>
> **`[OPERATIONAL GATE — this is what makes "do not currently" honest:]`** any later use of customer lists, pixels, retargeting, conversion APIs, or custom audiences must trigger a privacy-policy, subprocessor, cookie/tracking, and app-store disclosure review **BEFORE activation.** → Legal README #23. Without that gate, "currently" is just a word.

---

## 5. When we disclose information

We may disclose information to the following categories of recipients.

### Providers and authorized users

A Provider and its authorized staff can access information associated with that Provider's business according to their roles and permissions. A Client can access information associated with their own Provider relationships and pets.

**Information belonging to one Provider is not intended to be accessible to another Provider** merely because both use PetAppro.

### Vendors processing information for us

We use vendors for hosting, databases, authentication, storage, error monitoring, email, push notifications, payments, and other infrastructure. They may process information only for the contracted services, subject to applicable contractual and security obligations.

Our current Provider-data subprocessor list is available at `[SUBPROCESSOR URL]`.

> ⛔ `[BLOCKER: DO NOT link the subprocessor page until engineering confirms every production SDK, vendor, region, data category, and role. It still contains placeholders and a deferred SMS vendor. Linking an unverified list from a published policy is a representation we cannot support.]`

### Independent payment, identity, and platform services

Stripe, Apple, Google, and similar services may receive information and **act as independent controllers** for payment processing, identity services, fraud prevention, regulatory compliance, app distribution, or their own platform security.

### At your direction

We disclose information when you or the applicable Provider directs us to do so, including when content is exported or shared through device sharing features.

### Legal process, security, and safety

We may preserve or disclose information when we reasonably believe it is necessary to:
- comply with applicable law or valid legal process;
- protect the rights, safety, or property of PetAppro, a Provider, a Client, an animal, or another person;
- investigate fraud, abuse, or a security incident; or
- establish, exercise, or defend legal claims.

**When legally permitted and reasonably practicable, we may notify the affected Provider or user before disclosing information in response to legal process.** We may delay or withhold notice when prohibited by law, when notice could create a safety or security risk, or when it could compromise an investigation.

### Corporate transactions

Information may be reviewed or transferred as part of a proposed or completed financing, merger, acquisition, reorganization, sale of assets, or similar transaction. A recipient remains subject to this Policy for the transferred information unless affected persons receive notice of a materially different practice as required by law.

---

## 6. Retention

We retain personal information only for as long as reasonably necessary for the disclosed purpose, the Provider's documented instructions, and applicable legal, security, accounting, and dispute-resolution requirements.

Our launch retention schedule is:

- **Precise GPS coordinates:** `[PERIOD]`, followed by `[DELETION/SUMMARIZATION]`.
- **Home-access information:** until removed by the Client or Provider, the Provider relationship ends, or `[PERIOD]` after it is no longer needed.
- **Active Provider-controlled records:** for the duration of the Provider relationship, subject to Provider instructions and the DPA.
- **Closed-business export copy:** the 30-day export period, followed by `[DELETION PERIOD]`.
- **PetAppro account and profile information:** while the account is active and for `[PERIOD]` after deletion is initiated, except retained categories below.
- **Authentication and security logs:** `[PERIOD]`.
- **Diagnostic and crash data:** `[PERIOD]`.
- **Support communications:** `[PERIOD]`.
- **PetAppro subscription, accounting, refund, and tax-support records:** `[PERIOD]`.
- **Consent, policy-acceptance, deletion, and ownership-transfer records:** `[PERIOD]`.
- **Backups:** removed or overwritten within `[PERIOD]` after deletion from active systems, unless technically isolated and retained longer for disaster recovery.

When information must be retained after account deletion, we minimize it, restrict access, and separate or tombstone it where reasonably possible. **Retained information will not preserve a working login or permit a closed business to resume operating.** *(D-057.)*

**Provider booking invoices and transaction records are retained according to the Provider's instructions, the DPA, the Provider's disclosed retention practices, and any independently applicable legal obligations. PetAppro does not claim that every Provider invoice is a Base509 tax record.**

> ### ⛔ `[BLOCKER — retention schedule must be filled before publication]`
> Apple expressly expects the policy to explain retention and deletion. `[PERIOD]` placeholders cannot ship.
> **Recommended starting points — product-and-counsel decisions, NOT settled legal mandates:**
>
> | Category | Recommended starting point |
> |---|---|
> | Precise GPS route | **90 days**, then delete coordinates; retain only start/end time + distance |
> | Home access information | Until removed or Provider relationship ends; **purge promptly** from active systems |
> | Crash / diagnostic data | 12 months |
> | Authentication / security logs | 24 months |
> | Support communications | 3 years after closure |
> | Policy acceptance + deletion audit | 5 years after closure |
> | Base509 subscription / accounting records | 7 years, **subject to CPA confirmation** |
> | Closed Provider export copy | 30-day export window, then delete active copy within 30 additional days |
> | Backups | Vendor-confirmed cycle, ideally **no more than 35–90 days** |
> | Provider booking / invoice records | **Provider-controlled** schedule documented in the DPA — **do not call them Base509 tax records** |
>
> ⚠️ **Home-access codes and precise GPS are the two highest-risk categories we hold.** Retention defaults should be aggressive (short), not comfortable.
> `[ENGINEERING: confirm the backup cycle with Supabase before we publish a number. A published backup period we can't meet is a false statement.]`

---

## 7. Account deletion

You can initiate account deletion **from inside the PetAppro app and through our web deletion resource.**

### Client deletion

Before you confirm, the deletion flow identifies active services, future bookings, possible cancellation consequences, available exports, and information that may be retained.

Deleting a Client account:
- revokes PetAppro sessions and sign-in credentials, and removes or deidentifies PetAppro-controlled account information, subject to the retention rules above;
- **cancels unstarted future bookings, with notice to you and each affected Provider at the same time** — any disclosed cancellation consequence is shown **before** you confirm, and handled under the Provider policy you previously accepted;
- puts an **active service** into a restricted completion or safety-handoff state only as long as reasonably necessary;
- ends or unlinks the Client's active PetAppro relationships as disclosed in the deletion flow; and
- initiates the applicable deletion or unlinking workflow for Provider-controlled information.

Deletion scheduled after your last active booking may also be offered, but it will not be the only option.

**A Provider may retain transaction or service records when the Provider has an independent lawful basis or obligation to do so.** PetAppro will process Provider-controlled information according to the Provider's instructions and the DPA. **Deleting a PetAppro account therefore may not erase every record independently retained by a Provider.**

Leaving one Provider does not require deleting relationships with other Providers.

> `[CORRECTED 2026-07-17 — v0.1 said deletion removes your pets and profile "from every provider you've connected with." **That was false and contradicted our own controller/processor split.** We cannot erase records a Provider controls, irrespective of that Provider's retention instructions and obligations. Fixed above; the deletion UI must say the same thing.]`
> `[ALIGNED 2026-07-17 — future-booking cancellation added to match [Client Terms §9](client-terms.draft.md). Privacy §7 had been silent on bookings while Client Terms §9 said immediate deletion cancels them; silence in the privacy policy would have been an incomplete disclosure of a material deletion consequence. **These two sections must be reviewed together from here on.** → README #34.]`

### Provider deletion and business closure

Deleting an individual Provider user does not automatically delete a Provider business controlled by other authorized users.

When the departing user is the only PetAppro Owner, the deletion flow will first offer a **transfer to a successor who must affirmatively accept**. If no transfer is completed, the Provider may close the business through the closure process described in the Provider Terms and Account Ownership Policy.

Business closure includes the applicable notices, booking and refund workflow, and a **30-day Client read-only export period**. An active animal-care service may enter a **restricted safety-closure state** only as long as reasonably necessary for safe handoff and documentation.

**Deletion will not be refused solely because an amount remains unpaid.**

If you used **Sign in with Apple**, PetAppro will revoke the applicable token as part of account deletion.

---

## 8. Your choices

Depending on the information and applicable law, you may:
- access or receive a copy of information about you;
- correct inaccurate account information;
- delete your account or request deletion of particular information;
- withdraw location permission through device settings;
- manage push notifications through PetAppro or device settings;
- unsubscribe from PetAppro marketing email; and
- object to or restrict particular processing where applicable law provides that right.

**Marketing opt-outs do not stop booking confirmations, security alerts, subscription notices, policy notices, or other necessary service communications.**

For **PetAppro-controlled** information, contact us using the information below. For **Provider-controlled** information, contact the Provider first. We will assist the Provider with an appropriate request as required by our agreement and applicable law.

We may need to verify your identity and authority before completing a request. We will respond within the period required by applicable law or, when no statutory period applies, within a reasonable time.

> `[BUILD: marketing email must be a separate, independently unsubscribable stream from transactional/service mail. Opt-outs honored within **10 business days** — CAN-SPAM. ([FTC guidance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)) → README #21.]`

---

## 9. Security

We use administrative, technical, and organizational safeguards designed to protect personal information in light of its nature and the risks involved. These include access controls, encryption in transit, protected infrastructure, authentication controls, tenant-level access restrictions, and security monitoring appropriate to the service.

Home-access information is treated as restricted information and is subject to additional access and display controls. **`[Publish only after engineering verifies the precise controls.]`**

No method of transmission or storage is perfectly secure. If a security incident triggers a legal notification obligation, we will provide notice as required by applicable law.

> ### ⛔ `[BLOCKER — engineering verification gate]`
> v0.1 made specific representations about separate encryption keys, biometric gates, logging, auditing, MFA, and reauthentication. **Every one must be implemented and tested before publication** — an unmet security promise is a misrepresentation, and the first place a plaintiff looks.
> This section is deliberately written to state **defensible safeguards without exposing security architecture**. Resist the urge to add impressive detail. `[CODEX / CLAUDE CODE: verify each claim above and report. Anything unverified gets cut, not softened.]`

---

## 10. Children

PetAppro accounts are intended only for persons who are **at least 18 years old**. PetAppro is not directed to children under 13, and we do not knowingly permit a child under 13 to create an account or submit personal information directly to PetAppro.

A Provider must not submit personal information about a child unless it has a lawful, service-related reason and any required authorization. If you believe a child has provided information directly to PetAppro inappropriately, contact us so we can investigate and take appropriate action.

> `[CORRECTED — v0.1's "we don't knowingly collect information from anyone under 18" could be false: Providers routinely enter household contacts, and a minor may be an emergency contact or listed household member. COPPA principally concerns services directed to under-13s or operators knowingly collecting directly from them. ([FTC](https://www.ftc.gov/system/files/ftc_gov/pdf/coppa-age-verification-policy-statement.pdf))]`

---

## 11. United States service

PetAppro is offered for use in the United States. Information may be processed in the United States and in other locations where verified vendors operate, as identified in our current vendor disclosures.

PetAppro is not currently offered or marketed to persons in the European Economic Area, United Kingdom, or other jurisdictions requiring international-transfer mechanisms not described in this Policy.

---

## 12. California online privacy disclosures

California's Online Privacy Protection Act requires disclosure of PetAppro's online collection and tracking practices. *(CalOPPA applies independently of CCPA size thresholds — [Bus. & Prof. Code §22575](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22575).)*

The categories of personal information we collect are described in **§2**. The categories of third parties and other recipients to whom information may be disclosed are described in **§5**. Procedures for reviewing and correcting information are described in **§8**.

### Do Not Track and Global Privacy Control

Some browsers offer "Do Not Track," Global Privacy Control, or similar signals. PetAppro does not sell personal information or share it for cross-context behavioral advertising, so there is currently no sale or advertising-sharing activity to opt out of.

Because PetAppro does not engage in those activities, these signals do not otherwise change how PetAppro operates. **If our practices or applicable law change, we will recognize legally required browser-based opt-out signals.**

### Third-party collection over time

PetAppro does not permit advertising networks to collect information through PetAppro for behavioral advertising.

Infrastructure, diagnostic, payment, identity, and app-platform providers may collect IP addresses, device information, transaction information, or diagnostics in connection with providing their services. Their processing is described in §5 and, where they act independently, in their own privacy notices.

### CCPA status

PetAppro provides the choices described in §8 as **product commitments** and as required by applicable law. This Policy does not represent that Base509 LLC has voluntarily certified itself as a "business" subject to every provision of the California Consumer Privacy Act.

If the CCPA or another privacy law applies to particular processing, we will provide and honor the rights, notices, and appeal procedures required by that law.

> `[CORRECTED — do not publish the CCPA revenue threshold. v0.1 cited it as a "2026 threshold"; the adjusted figure is **$26.625 million effective January 1, 2025**, and it changes periodically. Citing a number that drifts guarantees the policy goes stale. Stating our posture is enough. ([CPPA](https://cppa.ca.gov/regulations/cpi_adjustment.html))]`

---

## 13. Changes to this Policy

Each published version of this Policy will have a **version number, publication date, and effective date**. Prior versions will remain available.

We will provide advance notice of a material change when reasonably practicable. If a change introduces a materially different collection, use, or disclosure requiring consent, we will obtain that consent before applying the new practice.

**Non-substantive corrections do not require renewed consent**, but we will identify the correction date and preserve a record of the prior text.

---

## 14. Contact

Privacy questions and requests may be sent to:

**support@base509.com**

or by mail to:

**Base509 LLC**
1875 Mission St Ste 103 #660
San Francisco, CA 94103

> `[✅ RESOLVED 2026-07-17 — business mailing address secured (PostScan Mail, SF). Privacy requests route to support@ + this address, NOT to the registered agent: agents are contracted for service of process and may not forward general mail, and a privacy request dying in an agent's mailroom is a compliance failure with a statutory clock on it. Service of process goes to Launch Registered Agent (Vista) — see both Terms §12. **The home/principal-office address is not published anywhere.** → D-059.]`

---

### Attribution
Portions of the structure and plain-language approach are adapted from [37signals' policies](https://37signals.com/policies), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). `[Confirm final wording with counsel.]`
