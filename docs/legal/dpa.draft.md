# Base509 — Data Processing Addendum (DPA)

> ## ⚠️ DRAFT — FUNCTIONAL, PENDING LEGAL REVIEW. NOT YET IN EFFECT.
> **Status:** Draft v0.2 (Cowork, 2026-08-11) — upgraded from skeleton to functional operative language at Danny's request. **A DPA is a contract with legally prescribed content (e.g. GDPR Art. 28; CCPA/CPRA service-provider terms). This is a working draft for review by Danny's legal advisors — the `[COUNSEL: …]` flags mark the points that need a lawyer's judgment.** Do not rely on it as executed until reviewed.
> **Why we need one:** decision **D-055** — Base509 is a **processor** for the client data a Provider manages.

## Plain-English summary (not the operative terms)

When you use **PetAppro** (a Base509 product), you trust Base509 with information about **your clients and their pets**. That information is **yours** — you decide what's collected and why. Base509 only holds and processes it **for you, on your instructions.** This document is the contract that says exactly that and binds Base509 to it.
- **You are the controller.** Your client relationships, your data.
- **Base509 is your processor.** It acts on your instructions to provide the service.
- **Your own account and billing data** — Base509 is the *controller* of that, covered by the [Privacy Policy](/policies/privacy), not this DPA.

The numbered terms below are the operative agreement.

---

## 1. Definitions and roles

1.1 **Parties.** This DPA is between **Base509 LLC** ("**Base509**," "**Processor**") and the subscribing pet-care business that accepts it ("**Provider**," "**Controller**"). It is incorporated into and governed by the [Provider Terms](/policies/terms).

1.2 **Definitions.** "**Personal Data**," "**Controller**," "**Processor**," "**Processing**," "**Data Subject**," and "**Personal Data Breach**" have the meanings given under Applicable Data Protection Law. "**Provider Personal Data**" means Personal Data that Base509 Processes on the Provider's behalf under this DPA, as described in **Annex A**. "**Sub-processor**" means a third party engaged by Base509 to Process Provider Personal Data. "**Applicable Data Protection Law**" means the privacy and data-protection laws applicable to the Processing, including the California Consumer Privacy Act as amended (CCPA/CPRA) and, where applicable, the EU/UK GDPR.

1.3 **Roles.** With respect to Provider Personal Data, the **Provider is the Controller** (or a processor acting for its own clients) and **Base509 is the Processor** (a "service provider" under CCPA/CPRA). With respect to Base509's own account, billing, and platform-operation data, **Base509 is an independent Controller** — governed by the Privacy Policy, not this DPA.

---

## 2. Processing details (Annex A)

The subject matter, duration, nature and purpose of Processing, the types of Personal Data, and the categories of Data Subjects are set out in **Annex A**. The Provider's documented instructions are: (a) to Process Provider Personal Data to provide the PetAppro service as described in the Provider Terms and configured by the Provider, and (b) any further written instructions the parties agree.

---

## 3. Base509's obligations

Base509 shall:

3.1 **Process only on instructions.** Process Provider Personal Data only on the Provider's documented instructions (including as configured through the service), and to provide, secure, and support the service — and not for any other purpose. Base509 will inform the Provider if, in its opinion, an instruction infringes Applicable Data Protection Law.

3.2 **No sale, no sharing, no independent use.** Base509 will **not** sell or share Provider Personal Data, will **not** retain, use, or disclose it for any purpose other than performing the service (or as permitted by Applicable Data Protection Law), will **not** combine it with data from other sources except as needed to provide the service, and will **never market to the Provider's clients.** Base509 certifies it understands and will comply with these restrictions. *(This is also a defining commitment in the Provider Terms — not boilerplate.)*

3.3 **Confidentiality.** Ensure that personnel authorized to Process Provider Personal Data are bound by confidentiality obligations, and limit access to those who need it (least-privilege), with access logged.

3.4 **Security.** Implement and maintain appropriate technical and organizational measures to protect Provider Personal Data, as described in **Annex C**, including: encryption in transit and at rest; additional protection for home-access codes (encrypted at rest with separately held keys, revealed only behind biometric/re-auth, never logged in plaintext — **D-044**); tenant isolation enforced at the database with row-level security keyed to the business (not application code alone); MFA for owner/admin accounts; and re-authentication for sensitive actions.

3.5 **Sub-processors.** The Provider provides general authorization for Base509 to engage the Sub-processors listed at **[/policies/subprocessors](/policies/subprocessors)** (and **Annex B**). Base509 will: (a) impose data-protection obligations on each Sub-processor no less protective than this DPA; (b) remain liable for its Sub-processors' performance; and (c) give the Provider advance notice of any intended addition or replacement of a Sub-processor, with a reasonable opportunity to object on reasonable data-protection grounds. `[COUNSEL: set the notice period — e.g., 30 days — and the consequence if the Provider objects and the parties can't resolve it (typically a termination right).]`

3.6 **Assistance with Data Subject requests.** Taking into account the nature of the Processing, assist the Provider by appropriate technical and organizational measures, insofar as possible, to respond to requests from Data Subjects to exercise their rights (access, correction, deletion, portability, opt-out). Where a Data Subject contacts Base509 directly about Provider Personal Data, Base509 will refer them to the Provider.

3.7 **Assistance with compliance.** Assist the Provider in ensuring compliance with its security, breach-notification, and (where applicable) data-protection-impact-assessment obligations, taking into account the information available to Base509.

3.8 **Personal Data Breach notification.** Notify the Provider **without undue delay, and no later than seventy-two (72) hours,** after becoming aware of a Personal Data Breach affecting Provider Personal Data. The notice will describe, to the extent known: the nature of the breach, the categories and approximate number of Data Subjects and records affected, the likely consequences, and the measures taken or proposed. `[COUNSEL: confirm the 72-hour figure and whether any statutory notice runs to Base509 or the Provider.]`

3.9 **Deletion or return.** On termination or expiry of the service, and at the Provider's choice, Base509 will **delete or return** Provider Personal Data and delete existing copies, except for a **narrow, enumerated** set of records Base509 is permitted or required to retain for a disclosed, lawful purpose. `[⚠️ COUNSEL: do NOT restate a blanket "records the law requires us to retain (invoices, tax)." The Provider is the merchant and tax-reporting party for booking revenue; Base509 may be only its processor for those records. Specify per category: which party retains, on what legal basis, for how long. Ties D-057 (owner deletion / tenant closure) and Privacy §6.]`

3.10 **Records and audit.** Make available to the Provider the information reasonably necessary to demonstrate compliance with this DPA. `[COUNSEL: scope this proportionately for a company this size — a Security Overview + a completed security questionnaire in response to a reasonable request, not routine on-site audits.]`

3.11 **Tenant isolation.** A Provider's data is never accessible to another Provider; this is enforced at the data layer with row-level security keyed to the business.

---

## 4. International transfers

Base509 operates in the **United States** and Processes Provider Personal Data in the United States. This DPA does not contemplate transfers subject to EU/UK cross-border transfer rules. `[COUNSEL: if/when Base509 serves EU/UK Controllers, incorporate the appropriate Standard Contractual Clauses / UK Addendum and a transfer-impact assessment. Flag before any EU expansion — D-023.]`

---

## 5. CCPA/CPRA service-provider terms

The parties intend Base509 to be a **"service provider"** to the Provider under CCPA/CPRA. Base509 will Process Provider Personal Data only for the **business purposes** specified in this DPA and the Provider Terms, and will comply with the restrictions in §3.2. Base509 will not retain, use, disclose, sell, or share Provider Personal Data outside the direct business relationship or for any commercial purpose other than providing the service. `[COUNSEL: confirm the exact CPRA-required "service provider" language and whether "contractor" terms are also needed.]`

---

## 6. Precedence, liability, term

6.1 **Precedence.** In case of conflict between this DPA and the Provider Terms on the subject of data protection, this DPA controls. `[COUNSEL: confirm, and align the liability allocation between this DPA and the Provider Terms.]`

6.2 **Term.** This DPA takes effect when the Provider accepts the Provider Terms and continues for as long as Base509 Processes Provider Personal Data.

6.3 **Execution.** This DPA is **incorporated by reference into the Provider Terms and published here**; a signable copy is available on request. `[COUNSEL: confirm this execution method is enforceable for your intended customers.]`

---

## 7. Open questions for legal review

`[COUNSEL:]`
- **Does a DPA legally apply to Base509 today?** Base509 is a California LLC, US-only at launch, and currently meets **none** of the CCPA/CPRA thresholds (Privacy §11); GDPR doesn't apply absent EU targeting (D-023). Base509's intent is to **offer this DPA proactively** because Providers will ask and some Providers may themselves be covered. Confirm this is sensible and doesn't over-commit Base509.
- **Sensitive Personal Information.** Do home-access codes, pet medical/medication records, or precise staff location constitute "sensitive personal information" under CPRA or another regime? This drives obligations for both parties — Base509 would rather over-protect.
- **The GPS question.** A walker's location during a shift is arguably the *Provider's* worker data, Processed by Base509. Confirm treatment.

---

## Contact
**support@base509.com** · Base509 LLC, 1875 Mission St Ste 103 #660, San Francisco, CA 94103.

---

## Annex A — Details of Processing
- **Subject matter:** providing the PetAppro software — bookings, scheduling, pricing, care records, payment facilitation, notifications.
- **Duration:** the term of the Provider's subscription, plus the retention windows in Privacy Policy §6.
- **Nature & purpose:** storing, organizing, retrieving, transmitting, and deleting client/pet data so the Provider can run its business.
- **Categories of Data Subjects:** the Provider's clients (pet owners); the Provider's staff; (indirectly) pets.
- **Categories of Personal Data:** client identity + contact (name, email, phone, address); **home-access information** (entry instructions, lockbox/alarm codes — treated as sensitive, D-044); pet records (name, breed, age, photos, vet info, medications, socialization, care notes); booking history, invoices, report cards, photos; **staff location during an active service** where GPS is enabled (D-054); payment metadata (Stripe holds card data; Base509 does not).

## Annex B — Sub-processors
Listed and maintained at **[/policies/subprocessors](/policies/subprocessors)**.

## Annex C — Technical & organizational security measures
Encryption in transit and at rest; separately-held keys and biometric/re-auth gating for home-access codes; database-enforced tenant isolation (row-level security keyed to the business); least-privilege, logged access; MFA for owner/admin; re-authentication for sensitive actions; secure software-development and dependency practices. Detailed in the [Security Overview](/policies/security) when published.
