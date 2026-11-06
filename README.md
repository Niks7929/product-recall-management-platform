# RecallGuard — Enterprise Product Recall & Consumer Safety Management Platform

RecallGuard is a full-stack, enterprise-grade statutory product recall and defect surveillance registry platform built in alignment with **ISO 10377** (Consumer Product Safety Guidelines) and regulatory compliance standards (CPSC, NHTSA, FDA).

The platform bridges regulatory oversight authorities, certified manufacturers, support resolution teams, and consumers into a unified, tamper-evident workflow for automated product defect tracing, emergency safety advisories, and statutory remedy execution (100% free returns, replacements, and refunds).

---

## 🔄 End-to-End Platform Architecture & Workflow

```
       ┌────────────────────────────────────────────────────────┐
       │             PUBLIC SAFETY REGISTRY (PORTAL)            │
       │  • Live Safety Surveillance Metrics                    │
       │  • Web Speech API Voice Search (Mic recognition)        │
       │  • Multi-Sector Filter (Automotive, Medical, Tech, etc.)│
       └────────────────────────┬───────────────────────────────┘
                                │
               ┌────────────────┼────────────────┐
               │                                 │
               ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│       CONSUMER PORTAL         │ │     MANUFACTURER PORTAL       │
│ • Register Purchased Product  │ │ • Enterprise Verification     │
│ • Automated Recall Detection  │ │ • Production Lots & Batches   │
│ • File 100% Free Returns      │ │ • Submit Recall Requests      │
│ • File Safety Complaints      │ │ • Process Hazardous Returns   │
└──────────────┬────────────────┘ └──────────────┬────────────────┘
               │                                 │
               │                                 │
               ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     SUPPORT STAFF PORTAL      │ │     SUPER ADMIN PORTAL        │
│ • Safety Complaint Triage     │ │ • Verify & Approve Companies  │
│ • Direct Two-Way Messaging    │ │ • Certify & Publish Recalls   │
│ • Inspect & Verify Returns    │ │ • Provision Safety Staff      │
│ • Authorize Refund Release    │ │ • Tamper-Evident Audit Trails │
└───────────────────────────────┘ └───────────────────────────────┘
                                │
                                ▼
       ┌────────────────────────────────────────────────────────┐
       │             RECALLGUARD CORE ENGINE & DATABASE         │
       │  • Node.js 22 + Native SQLite Database (16 Tables)     │
       │  • Cryptographic Salted scrypt Hashing & Sessions      │
       │  • Automated Customer Detection Engine                 │
       │  • Real-Time Audit Logging & Event Tracking            │
       └────────────────────────────────────────────────────────┘
```

---

## 🔄 How The Platform Works (Step-by-Step Flow)

1. **Manufacturer Onboarding:**
   - A manufacturing enterprise registers by providing corporate registration number, tax ID, and safety officer details.
   - The **Super Admin** verifies business legitimacy and approves the enterprise.

2. **Production Batch & Serial Tracking:**
   - The verified company logs manufacturing batches, production lot dates, distributed quantities, and unit serial ranges into the catalog.

3. **Defect Discovery & Recall Request:**
   - Upon identifying a critical component failure or thermal/mechanical risk, the company submits a formal recall filing specifying hazard severity (`critical`, `high`, `medium`), affected batches, and statutory remedy (`refund`, `replacement`, `repair`).

4. **Regulatory Certification & Publication:**
   - The **Super Admin** reviews technical safety filings, risk parameters, and approves publication.
   - The notice is immediately published to the **Live Public Registry**.

5. **Automated Customer Detection Engine:**
   - The instant a recall is published, the platform's detection engine scans all registered consumer products.
   - Any consumer whose registered product matches the affected batch numbers or serial ranges is automatically flagged (`affected_by_recall`) and receives an instant high-priority notification.

6. **100% Free Return & Statutory Remedy:**
   - The affected consumer initiates a return claim directly through their portal.
   - Pre-paid hazardous courier shipping documentation is generated.
   - Upon return verification by **Safety Support Staff**, an automated full refund (ACH) or expedited replacement is dispatched at zero cost to the citizen.

---

## 🚀 Key Modules & Capabilities

### 1. 🔍 Public Safety Registry & Web Speech API Voice Search
- **Live Surveillance Metrics:** Real-time metrics for active recalls, critical hazards, tracked production lots, and certified manufacturers.
- **Web Speech API Integration:** Speak product models, brand names, or batch numbers into the browser microphone (`SpeechRecognition` / `webkitSpeechRecognition`) with pulsing audio states.
- **Multi-Sector Filtering:** Instant filtering across 6 sectors: Automotive & Mobility, Consumer Electronics, Medical & Healthcare, Child Care & Toys, Food & Beverages, Industrial & Tools.
- **Active Filter Chips & Clear Controls:** Removable filter chips, instant search-clear button (`✕`), and dynamic empty-state recovery.

### 2. 👤 Consumer Safety Portal
- **Equipment Registration:** Consumers register purchased products with purchase date, vendor invoice, batch number, and serial number.
- **Automated Defect Detection Engine:** Instantly alerts consumers upon product registration if their specific batch or serial is recalled.
- **Statutory Remedy Claims:** 1-click filing for 100% manufacturer-funded pre-paid courier returns, replacements, or full refunds.
- **Safety Complaints:** Consumers report unlisted hardware defects and communicate directly with safety support staff via two-way threaded messaging.

### 3. 🏭 Manufacturer / Corporate Portal
- **Verification Onboarding:** Business entity registration with corporate registration numbers, tax IDs, and safety officer verification.
- **Production Lot & Batch Tracing:** Granular tracking of manufactured lots, distribution quantities, and individual serial numbers.
- **Recall Filing Workflow:** Formal recall submission detailing defect root causes, thermal/mechanical hazards, affected batch numbers, and remedial protocols.
- **Pre-Paid Return & Refund Processing:** Management of consumer returns, dispatch of shipping labels, and payment processing.

### 4. 🏛️ Regulatory Super Admin Portal
- **Discrete & Secure Access:** Concealed administration credentials (`admin` / `admin@gmail.com` with `admin123`).
- **Manufacturer Audit & Approval:** Regulatory review of corporate credentials before granting recall issuance authorization.
- **Recall Advisory Certification:** In-depth technical risk analysis before officially publishing recall bulletins to the public registry.
- **ISO 10377 Audit Logging:** Permanent, tamper-evident audit logs capturing actor IDs, timestamps, IP addresses, and transition states.

### 5. 🎧 Safety Support Staff Portal
- **Case Triage & Assignment:** Assignment and investigation of consumer safety complaints.
- **Two-Way Threaded Messages:** Real-time support messaging between consumers and safety officers.
- **Item Receipt & Verification:** Warehouse verification of returned items and authorization of final refund releases.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Modern component architecture, functional hooks, strict types |
| **Styling & Design** | **Tailwind CSS v4** | Clean, responsive design with zero external widget bloat |
| **Icons** | **Lucide React** | Lightweight, clean interface icons |
| **Voice Search** | **Web Speech API** | Native browser speech recognition with voice feedback |
| **Backend Server** | **Express.js + Node.js 22** | Unified full-stack server running Vite middlewares in development |
| **Database** | **`node:sqlite` (SQLite 3)** | Embedded ACID-compliant database with relational foreign key enforcement |
| **Cryptography** | **Node.js Crypto (`scrypt`)** | Salted `scrypt` password hashing (16384 N, 8 r, 1 p, 64-byte key) with cryptographically random salts |

---

## 🗄️ Relational Database Schema (16 Tables)

The embedded database (`product_recall_platform.db`) consists of:

- `users` — Authentication credentials, roles (`super_admin`, `company`, `customer`, `support_staff`), salted hashes.
- `sessions` — Cryptographically random 32-byte tokens with expiration timestamps.
- `companies` — Corporate verification records, tax IDs, industry classifications, approval states.
- `support_staff` — Safety division staff codes and department assignments.
- `product_categories` — Standardized industry sectors and icons.
- `products` — Models, SKUs, warranty terms, and active recall flags.
- `product_batches` — Manufacturing dates, lot quantities, and recall quarantine statuses.
- `product_serials` — Serialized unit tracking.
- `customer_products` — Registered consumer units linked to recall detection flags.
- `recall_requests` — Official technical recall filings, severity levels, affected batches, and remedies.
- `notifications` — High-priority safety alerts and return updates.
- `complaints` & `complaint_messages` — Consumer safety reports and threaded conversations.
- `return_requests` — Hazmat return logistics, tracking numbers, and progress states.
- `refund_requests` — Bank ACH / wire refunds issued to consumers.
- `replacement_requests` — Tracking of upgraded replacement unit dispatches.
- `audit_logs` — Immutable audit trail of every critical system transaction.

---

## 🔐 Default Access Accounts

| Role | Username / Identifier | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin@gmail.com` | `admin123` |
| **Manufacturer** | `Apex Mobility` | `safety@apexmobility.com` | `Company123!` |
| **Consumer** | `David Miller` | `david.miller@example.com` | `Customer123!` |
| **Safety Staff** | `Sarah Jenkins` | `sarah.jenkins@recallguard.gov` | `Staff123!` |

*(Note: Users can also register new Consumer, Company, or Staff accounts anytime via the navigation modals).*

---

## 📦 Local Installation & Running

### Prerequisites
- **Node.js v22 or higher**
- **npm** or **bun**

### 1. Clone & Install Dependencies
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd recallguard
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The embedded database initializes and seeds automatically on first launch.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🚢 How to Push to GitHub (प्रोजेक्ट GitHub ला कसा टाकायचा)

Follow these steps in your terminal to push this project to your GitHub repository:

```bash
# 1. Check git status
git status

# 2. Add all modified files
git add .

# 3. Commit your changes
git commit -m "feat: complete enterprise product recall management platform (RecallGuard)"

# 4. Set branch to main
git branch -M main

# 5. Link your GitHub repository (GitHub वरील तुमच्या नवीन repo चा URL टाका)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 6. Push code to GitHub (GitHub वर कोड पुश करा)
git push -u origin main
```

---

## 📜 Regulatory Standards Compliance
- **ISO 10377:2013** — Consumer product safety: Guidelines for suppliers
- **CPSC / NHTSA Alignment** — Defect discovery, formal lot quarantine, and expedited consumer remedies
- **Cryptographic Security** — Salted scrypt key derivation and timing-safe session validation
