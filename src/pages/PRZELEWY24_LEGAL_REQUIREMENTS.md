# Przelewy24.pl Legal Requirements - Missing Information

## Overview
This document outlines the legal pages and content required for Przelewy24.pl payment integration compliance. Many of these requirements cannot be filled without specific business information.

---

## CRITICAL: Pages Currently Missing

### 1. Payment Terms and Conditions (Płatności - Regulamin płatności)
**Status**: ✅ CREATED - `src/pages/payments.tsx` created with full content

**Required Content**:
- [x] Payment methods accepted (BLIK, traditional bank transfer, credit cards, etc.)
- [x] Payment processing times
- [x] Payment security information (SSL, PCI DSS compliance)
- [x] Order confirmation process
- [x] Payment failure handling
- [x] Refund processing via Przelewy24
- [x] Currency information (PLN)
- [x] Transaction fees (if any)
- [x] Payment verification procedures

**Note**: Content uses placeholders `[PLACEHOLDER: ...]` for business-specific values that need to be filled in translation files.

---

### 2. Delivery Terms (Dostawa - Regulamin dostawy)
**Status**: ✅ COMPLETE - `src/pages/shipping.tsx` created with full content

**Required Content**:
- [x] Delivery methods and carriers (InPost)
- [x] Delivery timeframes (business days)
- [x] Delivery costs by region/weight
- [x] International shipping policies (no international)
- [x] Tracking information
- [x] Delivery confirmation
- [x] Failed delivery procedures
- [ ] Packaging standards
- [ ] Shipping insurance

**Information Needed**:
- ~~List of delivery carriers (DPD, InPost, etc.)~~ - Added InPost
- ~~Pricing tiers~~ - Added 14.99 PLN
- ~~Delivery time estimates~~ - Added 2-4 business days
- ~~International shipping destinations~~ - Added no international notice

---

### 3. Returns and Complaints Policy (Reklamacje i zwroty)
**Status**: ✅ COMPLETE - `src/pages/returns.tsx` created with full content

**Required Content**:
- [x] Return eligibility period (typically 14 days for EU)
- [x] Return process steps
- [x] Return shipping costs (who pays)
- [x] Refund methods and timeline
- [x] Complaint submission process
- [x] Required documentation (photos, proof of purchase)
- [x] Damaged/defective product procedures
- [x] Non-returnable items
- [x] Contact for returns
- [ ] RMA (Return Merchandise Authorization) process

**Information Provided**:
- Return period: 14 days
- Return address: Myślenice, ul. Wybickiego 48
- Return costs: Customer bears direct costs
- Refund timeline: 14 days
- Contact email: returns@tuusimago.com
- Phone: 570-603-695

---

### 4. Complaint Form (Formularz reklamacji)
**Status**: ✅ CREATED - `src/pages/complaint.tsx` created with full form

**Required Content**:
- [x] Customer information fields (name, email, phone, address)
- [x] Order details (order number, date)
- [x] Product information
- [x] Complaint description
- [x] Upload for photos of damage/defect
- [x] Expected resolution
- [x] Submission confirmation (form structure ready)
- [x] Response time commitment (typically 14-30 days)

**Note**: Uses placeholders for response time and contact email in translation files.

---

### 5. Privacy Policy (Polityka prywatności)
**Status**: ✅ COMPLETE - `src/pages/privacy.tsx` created with full GDPR-compliant content

**Required Content for Przelewy24**:
- [x] GDPR compliance statement
- [x] Data controller identification (company name, address, contact)
- [x] Types of personal data collected
- [x] Legal basis for processing (GDPR Article 6)
- [x] Data purposes (order processing, delivery, marketing)
- [x] Data sharing with third parties (Przelewy24, delivery companies)
- [x] Data storage duration
- [x] User rights (access, rectification, erasure, portability, objection)
- [x] Cookie policy
- [x] Data transfer security
- [x] Cross-border data transfers
- [x] Children's data protection
- [x] Changes to privacy policy
- [x] Contact for privacy matters (DPO if applicable)

**Information Provided**:
- Company name: Tuusimago
- Address: Myślenice, ul. Wybickiego 48, 32-400, Poland
- Phone: 570-603-695 / 663 534 814
- Email: biuro@car-folie.pl
- NIP: 3396629204
- REGON: 275867303
- VAT ID: PL3396629204
- Business hours: 8:00-17:00 (Mon-Fri)
- Data retention periods: Defined in privacy policy
- Data Protection Officer: Not appointed

---

### 6. Terms and Conditions (Regulamin)
**Status**: ✅ COMPLETE - `src/pages/terms.tsx` created with full content

**Required Content**:
- [x] Service scope and description
- [x] Ordering process
- [x] Pricing and payment terms
- [x] Delivery terms
- [x] Product specifications and quality
- [x] User obligations
- [x] Intellectual property rights
- [x] Limitation of liability
- [x] Force majeure clause
- [x] Contract termination
- [x] Dispute resolution (court jurisdiction)
- [x] Complaint handling procedure
- [x] Changes to terms
- [x] Applicable law (Polish law)
- [x] Consumer rights (Ustawa o prawach konsumenta)

**Information Provided**:
- Service scope: Custom printing services (photos, canvas, posters, framing)
- Ordering process: 6-step process
- Pricing: PLN including VAT, Przelewy24 methods
- Delivery: InPost, 14.99 PLN, 2-4 business days
- Consumer rights: 14-day withdrawal, complaint handling

---

### 7. Cookie Policy (Polityka cookies)
**Status**: ✅ COMPLETE - `src/pages/cookies.tsx` created with full content

**Required Content**:
- [x] What cookies are
- [x] Types of cookies used (technical, analytical, marketing)
- [x] Purpose of each cookie type
- [x] Cookie duration
- [x] Third-party cookies (Google Analytics, Przelewy24)
- [x] Cookie consent mechanism
- [x] How to manage/delete cookies
- [x] Consequences of disabling cookies

**Information Provided**:
- Necessary cookies: Session, authentication, security
- Analytics: Google Analytics
- Marketing: Third-party advertising cookies
- Third-party: Google Analytics, Przelewy24, Cloudinary, social media
- Duration: Session and persistent (up to 12 months)

---

### 8. Company Information (Dane firmy)
**Status**: ✅ COMPLETE - Full company details provided

**Required Content**:
- [x] Full company legal name: Tuusimago
- [x] NIP (Tax Identification Number): 3396629204
- [x] REGON (Statistical Number): 275867303
- [ ] KRS (Court Register Number - if applicable) - not provided
- [x] Registered office address: Myślenice, ul. Wybickiego 48, 32-400, Poland
- [x] Email address: biuro@car-folie.pl
- [x] Phone number: 570-603-695 / 663 534 814
- [x] Business hours: 8:00-17:00 (Mon-Fri)
- [x] Bank account details (for refunds): IBAN PL38249019019509 (Alior Bank)
- [x] VAT ID (NIP EU): PL3396629204

**Information Provided**:
- Company name: Tuusimago
- Address: Myślenice, ul. Wybickiego 48, 32-400, Poland
- Phone: 570-603-695 / 663 534 814
- Email: biuro@car-folie.pl
- NIP: 3396629204
- REGON: 275867303
- Business hours: 8:00-17:00 (Mon-Fri)
- Bank: IBAN PL38249019019509 (Alior Bank)

---

### 9. Przelewy24 Integration Page
**Status**: ✅ COMPLETE - Referenced in legal menu and integrated in payments.tsx

**Required Content**:
- [x] Przelewy24 payment method description
- [x] Link to Przelewy24 Terms: https://www.przelewy24.pl/regulamin
- [x] Link to Przelewy24 Privacy Policy: https://www.przelewy24.pl/polityka-prywatnosci
- [x] Payment security information
- [x] Przelewy24 customer support contact
- [x] BLIK payment instructions
- [x] Traditional bank transfer instructions

---

## EXISTING PAGES - Content Gaps

### src/pages/legal.tsx
**Status**: ✅ STRUCTURE OK - ✅ CONTENT COMPLETE

**Complete**:
- Detailed privacy policy sections
- Detailed terms of service sections
- GDPR compliance language
- Polish law references

---

### src/pages/consents.tsx
**Status**: ❌ PLACEHOLDER ONLY

**Missing**:
- Marketing consent checkboxes
- Data processing consents
- Consent withdrawal process
- Cookie consent management

---

### src/pages/contact.tsx
**Status**: ✅ COMPLETE - All company information added

**Complete**:
- Company registration numbers (NIP: 3396629204, REGON: 275867303)
- Bank account details: IBAN PL38249019019509 (Alior Bank)
- VAT ID: PL3396629204
- Data Protection Officer: Not appointed

---

## FOOTER REQUIREMENTS

The footer must include links to:
- [x] Terms and Conditions (Regulamin) - ✅ Created
- [x] Privacy Policy (Polityka prywatności) - ✅ Created
- [x] Cookie Policy (Polityka cookies) - ✅ Created
- [x] Returns & Complaints (Reklamacje i zwroty) - ✅ Created
- [x] Shipping (Dostawa) - ✅ Created
- [x] Payment Terms (Płatności) - ✅ Created
- [x] Complaint Form (Formularz reklamacji) - ✅ Created
- [x] Company Information (Dane firmy) - ✅ Complete
- [ ] Company Information (Dane firmy)

---

## CHECKOUT PAGE REQUIREMENTS

### src/pages/checkout.tsx
**Status**: ✅ STRUCTURE OK - ⚠️ MISSING LEGAL ELEMENTS

**Missing**:
- [ ] Terms and conditions checkbox (required before payment)
- [ ] Privacy policy checkbox
- [ ] Marketing consent checkbox (optional)
- [ ] Order confirmation with legal references
- [ ] Payment method selection with Przelewy24 branding
- [ ] BLIK payment option
- [ ] Traditional bank transfer option

**Required Code Changes**:
```tsx
// Add to checkout form before submit button
<div className="space-y-2">
  <label className="flex items-start gap-2">
    <input type="checkbox" required className="mt-1" />
    <span className="text-sm">
      I accept the <Link to="/terms">Terms and Conditions</Link> and
      <Link to="/privacy">Privacy Policy</Link> *
    </span>
  </label>
  <label className="flex items-start gap-2">
    <input type="checkbox" className="mt-1" />
    <span className="text-sm">
      I agree to receive marketing information (optional)
    </span>
  </label>
</div>
```

---

## POLISH CONSUMER LAW REQUIREMENTS

### Ustawa o prawach konsumenta (Consumer Rights Act)

Required disclosures:
- [ ] 14-day right of withdrawal (prawo odstąpienia od umowy)
- [ ] Withdrawal form template (wzór formularza odstąpienia)
- [ ] Return costs disclosure
- [ ] Warranty information (gwarancja)
- [ ] Complaint handling timeline (14 days)
- [ ] Price breakdown including VAT

---

## PRZELEWY24 SPECIFIC REQUIREMENTS

### Merchant Account Information
- [ ] Merchant ID
- [ ] CRC (CRC code for callbacks)
- [ ] Test mode configuration
- [ ] Live mode configuration
- [ ] POS ID (Point of Sale ID)

### Payment Methods to Support
- [ ] BLIK
- [ ] Traditional bank transfer (Przelew tradycyjny)
- [ ] Credit/debit cards (Visa, Mastercard)
- [ ] PayPo (installments)
- [ ] Alior Raty (installments)
- [ ] Apple Pay
- [ ] Google Pay

### Integration Points
- [ ] Payment initiation endpoint
- [ ] Payment status verification
- [ ] Webhook/callback handling
- [ ] Refund processing
- [ ] Transaction history

---

## TRANSLATION REQUIREMENTS

All legal pages must be available in:
- [x] English (en.json) - ✅ COMPLETE
- [x] Polish (pl.json) - ✅ COMPLETE

Polish translations complete for:
- payments.tsx (full)
- complaint.tsx (full)
- shipping.tsx (full)
- returns.tsx (full)
- privacy.tsx (full)
- terms.tsx (full)
- cookies.tsx (full)

Translation keys available in `src/locales/`:
- `payments.*` - Payment page translations
- `complaint.*` - Complaint page translations
- `shipping.*` - Shipping page translations
- `returns.*` - Returns page translations
- `privacy.*` - Privacy page translations
- `terms.*` - Terms page translations
- `cookies.*` - Cookies page translations

**Status**: ✅ ALL TRANSLATIONS COMPLETE

---

## SECURITY REQUIREMENTS

### Required Security Measures
- [ ] SSL/TLS certificate
- [ ] PCI DSS compliance (for card payments)
- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] Secure payment processing (no card data storage)
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input validation
- [ ] OWASP compliance

---

## DOCUMENTATION REQUIREMENTS

### Required Documents
- [ ] Privacy Policy (Polityka prywatności)
- [ ] Terms and Conditions (Regulamin)
- [ ] Cookie Policy (Polityka cookies)
- [ ] Returns & Complaints Policy (Polityka reklamacji i zwrotów)
- [ ] Delivery Terms (Regulamin dostawy)
- [ ] Payment Terms (Regulamin płatności)
- [ ] Withdrawal Form Template (Wzór formularza odstąpienia)
- [ ] Complaint Form (Formularz reklamacji)
- [ ] GDPR Consent Forms

---

## PRIORITY IMPLEMENTATION ORDER

### Phase 1: Critical (Required for Przelewy24 activation)
1. ✅ Company information gathering
2. ✅ Complete Privacy Policy (GDPR compliant)
3. ✅ Complete Terms and Conditions
4. ✅ Create Payment Terms page (payments.tsx)
5. ✅ Create Complaint Form page (complaint.tsx)
6. ⚠️ Add legal checkboxes to checkout
7. ✅ Polish translations for all legal pages

### Phase 2: Important (Consumer protection)
8. ✅ Complete Returns & Complaints page
9. ✅ Complete Shipping page
10. ✅ Complete Cookie Policy
11. ⚠️ Create Withdrawal Form template

### Phase 3: Nice to have
12. Complete Consents page
13. Complete Security page
14. Add FAQ section
15. Add order tracking page

---

## INFORMATION NEEDED FROM BUSINESS OWNER

### Company Registration
- [x] Full legal company name: Tuusimago
- [x] NIP (Tax Identification Number): 3396629204
- [x] REGON (Statistical Number): 275867303
- [ ] KRS (Court Register Number) - not provided
- [x] Registered office address: Myślenice, ul. Wybickiego 48, 32-400, Poland
- [x] VAT ID (NIP EU): PL3396629204
- [x] Bank account number for refunds: IBAN PL38249019019509 (Alior Bank)

### Business Operations
- [x] Delivery carriers and pricing: InPost, 14.99 PLN
- [x] Delivery timeframes: 2-4 business days
- [x] Return period (days): 14
- [x] Return shipping policy (who pays): Customer bears direct costs
- [x] Refund processing time: 14 days
- [x] Complaint response time commitment: 14-30 days
- [ ] Product warranty period - not specified
- [x] Business hours: 8:00-17:00 (Mon-Fri)

### Payment Configuration
- [ ] Przelewy24 Merchant ID
- [ ] Przelewy24 CRC code
- [ ] Supported payment methods
- [ ] Transaction fees (if any passed to customer)
- [x] Currency (PLN)

### Legal
- [x] Applicable law (Polish law)
- [x] Court jurisdiction
- [ ] Data Protection Officer contact (if applicable)
- [ ] Legal counsel review of all documents

---

## NEXT STEPS

1. ~~Gather Information~~: Collect all required business details listed above
2. ~~Create Missing Pages~~: ✅ Implemented payments.tsx and complaint.tsx
3. **Expand Existing Pages**: Add detailed content to all placeholder pages (privacy, terms, returns, shipping, cookies)
4. **Add Checkout Consents**: Implement required checkboxes in checkout form
5. **Merge Translations**: Merge `/tmp/pl_additions.json` into `src/locales/pl.json`
6. **Legal Review**: Have all documents reviewed by Polish legal counsel
7. **Przelewy24 Integration**: Complete payment gateway integration
8. **Testing**: Test all payment flows and legal compliance

---

## RESOURCES

### Przelewy24 Documentation
- Official website: https://www.przelewy24.pl
- Merchant documentation: https://developers.przelewy24.pl
- Terms of Service: https://www.przelewy24.pl/regulamin
- Privacy Policy: https://www.przelewy24.pl/polityka-prywatnosci

### Legal References
- GDPR: https://gdpr-info.eu/
- Polish Consumer Rights Act: https://isap.sejm.gov.pl/
- E-commerce regulations: https://isap.sejm.gov.pl/

---

**Last Updated**: 2026-03-24
**Status**: ✅ COMPLETE - payments.tsx, complaint.tsx, shipping.tsx, returns.tsx, privacy.tsx, terms.tsx and cookies.tsx created with full translations in both EN and PL

---

## ✅ COMPLETED ITEMS

1. **payments.tsx** - Created with full content (BLIK, transfer, cards, Przelewy24 info)
2. **complaint.tsx** - Created with full form (customer info, order details, product info, description)
3. **shipping.tsx** - Created with InPost carrier, 14.99 PLN cost, 2-4 business days, failed delivery procedures
4. **returns.tsx** - Created with full content (14-day withdrawal, return process, contact info)
5. **privacy.tsx** - Created with full GDPR-compliant content
6. **terms.tsx** - Created with full content (scope, ordering, pricing, delivery, liability, consumer rights)
7. **cookies.tsx** - Created with full content (cookie types, third-party, consent, management)
8. **Polish translations (pl.json)** - All legal page translations complete
9. **English translations (en.json)** - All legal page translations complete

---

## ⚠️ STILL NEEDS BUSINESS INFO

The following pages have structure but need actual business details filled in:
- ~~cookies.tsx~~ - ✅ COMPLETE - Full cookie policy with types, third-party, consent
- ~~terms.tsx~~ - ✅ COMPLETE - Full content with scope, ordering, pricing, delivery, liability
- ~~returns.tsx~~ - ✅ COMPLETE - Return address, period, costs, contact info added
- ~~shipping.tsx~~ - ✅ COMPLETE - Carriers, pricing, timeframes added
- ~~contact.tsx~~ - ✅ COMPLETE - Company registration numbers, bank details added
- ~~All placeholders~~ - ✅ COMPLETE - All business info added to translation files

## ⚠️ STILL PENDING

- checkout.tsx - Legal checkboxes (terms, privacy, marketing consent)
- Przelewy24 Merchant ID - Not provided
- Przelewy24 CRC code - Not provided
- KRS number - Not provided (not required)
- Product warranty period - Not specified
- DPO contact - Not appointed
