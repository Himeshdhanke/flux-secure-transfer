# SecureShare — Secure Document Sharing with Dynamic Watermarking & Zero-Trust Access

> **Academic Capstone Engineering Project**  
> **Subject:** Cryptography and Security  
> **Stack:** MERN (MongoDB, Express.js, React, Node.js) with AWS Cloud Integration (EC2, S3, CloudWatch, Cognito)

---

## 🛡️ Project Overview

**SecureShare** is a zero-trust encrypted document dissemination platform designed to solve the critical security problem of uncontrolled file downloads.

Traditional platforms provide receivers with direct download access to plaintext PDF files, surrendering all cryptographic control after initial download. SecureShare eliminates post-download data leakage through an in-memory **Protected Document Viewer**:
1. Plaintext PDFs are encrypted at rest with **AES-256-GCM** using fresh per-document Data Encryption Keys (DEK) wrapped with a server Master Key.
2. Share links are generated with 32 cryptographically random bytes (`crypto.randomBytes(32)`), and only their **SHA-256 hash** is stored in the database.
3. Every page request re-validates token validity, UTC expiry, instant revocation status, and recipient email matching.
4. Plaintext PDFs are decrypted strictly in volatile server RAM, rendered page-by-page to high-DPI images via PDF.js, and composited with **dynamic diagonal watermarks** (embedding verified sender, recipient, and session IDs via Sharp) before transmission.
5. **The unwatermarked PDF binary is never delivered to the client browser.**

---

## ⚡ Quick Start (Local Development)

SecureShare supports seamless local execution out of the box with zero external cloud dependencies required (MongoDB is running locally, and local encrypted vault + local auth are configured by default).

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js 22 LTS & 24)
- **MongoDB**: Community Server running locally on `mongodb://127.0.0.1:27017`

### 2. Installation
Clone the repository and install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration
The server includes a pre-configured `.env` file for local development. To customize:
```bash
cp server/.env.example server/.env
```

Key environment variables:
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/secureshare

# 256-bit AES Master Key (64 hex characters)
SECURESHARE_MASTER_KEY=e4f3a2b1c0d9e8f7a6b5c4d3e2f1a09876543210fedcba9876543210abcdef01

# Storage mode: 'local' (encrypted local disk vault) or 's3' (Amazon S3)
SECURESHARE_STORAGE_MODE=local
SECURESHARE_STORAGE_DIRECTORY=./storage_vault

# AWS Configuration (Leave empty to use automatic local fallback)
COGNITO_USER_POOL_ID=
CLOUDWATCH_ENABLED=false
```

### 4. Running the Application

In **Terminal 1** (Backend API):
```bash
cd server
npm start
```
*The server will start on `http://localhost:5000` and automatically seed demo accounts and a sample encrypted document!*

In **Terminal 2** (Frontend Client):
```bash
cd client
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 🔑 Ready-to-Test Demo Accounts

The database is pre-seeded on startup with three test personas:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Sender (Alice)** | `alice@secureshare.corp` | `Password123!` | Uploads confidential PDFs, generates recipient links, monitors views, revokes shares. |
| **Authorized Receiver (Bob)** | `bob@secureshare.corp` | `Password123!` | Authorized recipient. Opens share links and views watermarked pages. |
| **Unauthorized Intruder (Eve)** | `eve@secureshare.corp` | `Password123!` | Third party. Attempting to view Alice's documents or Bob's links is blocked (HTTP 403). |

---

## 🧪 Automated Test Suite

A comprehensive automated test suite of **31 test cases** verifies all cryptographic properties, tampering rejection, watermarking, and access control:

```bash
cd server
npm test
```

### Verified Test Categories:
- **AES-256-GCM Encryption & Decryption**: Ciphertext differs from plaintext, nonces are fresh, authentication tags match.
- **Tampering Resistance**: Modifying ciphertext or auth tags causes authenticated decryption to fail immediately.
- **Envelope Key Wrapping**: Master Key wraps and unwraps 32-byte DEKs; tampered key envelopes fail authentication checks.
- **SHA-256 Token Hashing**: Raw tokens are never stored; database holds only SHA-256 digests.
- **PDF Parsing & Validation**: Magic bytes checked; malformed files rejected.
- **Server-Side Rasterization & Watermarking**: Sharp composites diagonal watermarks; SVG injection attacks are sanitized.
- **End-to-End Zero-Trust API**:
  * Alice uploads encrypted PDF -> Stored with random object key.
  * Eve cannot access Alice's documents (HTTP 404 isolation).
  * Alice shares link restricted to Bob.
  * Eve attempts access -> Rejected with HTTP 403 (`UNAUTHORIZED_RECIPIENT`).
  * Bob opens link -> Receives watermarked PNG image with DRM headers (`Cache-Control: no-store`). Raw PDF is never returned.
  * Alice clicks "Revoke" -> Bob's subsequent page requests are immediately blocked with HTTP 403 (`REVOKED`).

---

## ☁️ AWS Cloud Services Architecture

SecureShare includes full native AWS SDK v3 integrations:

| AWS Service | Production Configuration | Local Fallback |
| :--- | :--- | :--- |
| **Amazon EC2** | Application host behind Nginx reverse proxy with TLS 1.3 and PM2 cluster. | Local Node.js runtime. |
| **Amazon S3** | Private S3 bucket storing encrypted ciphertext with SSE-S3/KMS and Block Public Access. | Local encrypted vault directory (`storage_vault/`). |
| **Amazon CloudWatch** | Structured JSON security logs sent to CloudWatch Logs group `/aws/secureshare/application-logs`. | Console and MongoDB structured audit logs. |
| **Amazon Cognito** | User Pool JWT validation using `@aws-jwt-verify` against Cognito JWKS endpoints. | Local JWT with bcrypt password hashing and Cognito-compatible `sub` claims. |

For detailed AWS IAM policies, systemd configurations, and Nginx reverse proxy rules, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`deploy/`](deploy/).

---

## 📚 Project Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System component diagrams, cryptographic data flows, and AWS integration design.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, cryptographic primitives, zero-trust evaluation, and honest screenshot limitations analysis.
- [`docs/TESTING.md`](docs/TESTING.md) — Full automated test suite report and verification logs.
- [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) — College-ready academic project report for Cryptography and Security.

---

## 🔒 Security & Screenshot Limitations (Honest Disclosure)

No web application can prevent external hardware cameras, smartphones photographing a screen, or OS-level video capture cards. 

SecureShare's threat model acknowledges this reality and provides **forensic attribution**:
- The receiver never receives the original downloadable PDF.
- The server bakes a visible, repeating diagonal watermark directly into each rendered page image displaying the verified recipient's identity, sender email, and timestamp.
- Any photograph or screenshot taken by a recipient carries an indelible forensic attribution footprint, discouraging leaks and proving recipient responsibility.

---

## 📄 License
ISC License — Individual Engineering Capstone Project.
