# 🎓 EduAuth Registry: Blockchain-Based Academic Verification System

EduAuth is a centralized, secure platform for issuing, storing, and verifying academic credentials. It connects Students, Educational Institutions, and the Higher Authority (UGC/Admin) into a single trusted ecosystem.

## 📖 System Workflow (The Core Logic)

### 1. Registration & Governance (The Gatekeeper)

- **Sign Up**: Students and Institutions register via the portal.
- **Default Status**: All new registrations are marked as pending by default. They cannot log in until approved.
- **Admin Approval**: The Super Admin (UGC) reviews registration requests.
  - **Students**: Verified against NID/Birth Certificate data.
  - **Institutions**: Verified against Government Registration Numbers.
- **Access Control**: Admins can "Revoke" an institution's access at any time, instantly stopping them from issuing new certificates.

### 2. Enrollment (The Link)

**Global vs. Local Identity:**
- Every student has a Global ID (linked to their NID).
- Institutions have their own Local IDs (e.g., Class Roll, Registration No).

**Admission Process:**
- Institutions cannot issue certificates to random users.
- They must first Enroll the student by searching their NID.
- The system links the Global Student Account to the Institution's Local Registry.
- **Constraint**: If the NID is not found in the global system, enrollment fails (Student must register first).

### 3. Issuance (The Asset)

- **Constraint**: Certificates can only be issued to students who exist in the `institution_enrollments` table for that specific institution.
- **Hashing**: The system generates a unique cryptographic hash (SHA-256) based on the Student ID + Issuer ID + Date + Credential Name.
- **Data Integrity**: This hash acts as the digital fingerprint. Any change to the data invalidates the certificate.

### 4. Verification (Privacy-Preserving)

- **Public Access**: Anyone with the Certificate Hash can verify it.
- **Identity Confirmation**: The verification page displays:
  - Student Name & Photo (to confirm the person standing before you).
  - Certificate Details (CGPA, Major, Issue Date).
  - Issuer Details (University Name).
- **Privacy**: Sensitive personal data (Phone, Address, full NID) is hidden from public verifiers.

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Relational Schema)
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Security**: Bcrypt (Password Hashing), SHA-256 (Certificate Hashing), Multer (Secure File Uploads)

## 📂 Folder Structure
```
eduauth-system/
├── backend/               # Node.js API Server
│   ├── src/
│   │   ├── config/        # Database Connection
│   │   ├── controllers/   # Business Logic (Admin, Auth, Issue, Verify)
│   │   ├── middlewares/   # Auth Checks & File Uploads
│   │   ├── routes/        # API Endpoints
│   │   └── services/      # Hash utilities & DB helpers
│   └── uploads/           # Student Photos (Publicly accessible)
├── frontend/              # React Client
│   ├── src/
│   │   ├── components/    # Reusable UI (Navbars, Cards)
│   │   ├── context/       # Auth State Management
│   │   ├── pages/         # Dashboard Views
│   │   └── services/      # Axios API Bridge
├── database/
│   └── schema.sql         # Master Database Schema (Source of Truth)
└── README.md              # Documentation
```

## 🔑 Key Features by Role

### 🛡️ Admin (UGC / Ministry)

- **Dashboard**: View aggregate stats of registered students and universities.
- **Approval Queue**: Approve/Reject new student and institution registrations.
- **Global Search**: Search any student by NID/Birth Certificate to view full academic history.
- **Institution Control**: "Stop Access" switch to freeze a university's ability to issue certificates.

### 🏛️ Institution (University / Board)

- **Student Registry**: Manage a list of enrolled students (`institution_enrollments`).
  - Filter by Session/Year or Department.
- **Issuance Portal**: Issue degrees/transcripts.
  - **Auto-Check**: Ensures student is enrolled before issuing.
- **Profile Management**: Update contact info and logo.

### 🎓 Student

- **Wallet**: View all obtained certificates from different institutions in one place.
- **Profile**: Manage personal details and photo.
- **Sharing**: Generate sharable links for verifiers.

### 🔍 Verifier (Recruiters / Public)

- **No Login Required**: Verify using the unique Certificate Hash.
- **Visual Validation**: Compare the photo on the screen with the candidate in real-time.

## 💾 Database Schema Context (For AI Assistants)

- **Users Table**: Handles login (email, password, role, status).
- **Student_Identities**: Stores sensitive NID data (Hashed).
- **Institutions**: Stores university details and `can_issue` flag.
- **Institution_Enrollments**: Link table. `student_id` (Global) <-> `institution_id`.
- **Certificates**: Stores the `certificate_hash` and metadata (JSON for CGPA/Grades).

## 🚀 Getting Started

### 1. Database Setup

- Create a MySQL database named `eduauth_registry`.
- Import `database/schema.sql` to create tables.
- **Super Admin**: Register `admin@ugc.gov.bd` and manually set `role='admin'`, `status='active'` in DB.

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# DB_HOST=localhost, DB_USER=root, DB_PASS=, DB_NAME=eduauth_registry
# JWT_SECRET=your_secret_key
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 Developer Notes (Rules for AI)

- **NID Handling**: Always hash the NID (SHA-256) before querying the `student_identities` table. Never store plain NIDs in logs.
- **Status Logic**: Users are 'pending' until Admin approves.
- **Middleware**: Always use `protect` and `authorize('role')` on sensitive routes.