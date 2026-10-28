# SecureShare — Automated Test Suite & Verification Report

## 1. Test Suite Summary

SecureShare includes a comprehensive automated test suite built with Node.js native test runner (`node:test`) and `supertest`. The suite verifies cryptographic security, PDF parsing, server-side rasterization, dynamic watermarking, and end-to-end access control.

```text
Summary of Test Results:
✔ Total Test Cases:   31
✔ Passed:              31
✖ Failed:              0
⏱ Execution Duration:  ~3.3 seconds
```

---

## 2. Test Execution Breakdown

### 2.1 Cryptographic Operations (`server/tests/cryptography.test.js`)

| Scenario | Objective | Result |
| :--- | :--- | :--- |
| **DEK Wrapping & Unwrapping** | Wraps a 32-byte DEK with AES-256-GCM using the Master Key, verifying 12-byte nonce and 16-byte tag. Unwraps successfully. | **PASS** |
| **Key Envelope Tamper Detection** | Modifies ciphertext in wrapped key envelope; verifies that unwrap throws `CryptographicError` immediately. | **PASS** |
| **AES-256-GCM Encryption** | Encrypts sample PDF bytes and asserts ciphertext differs from plaintext. | **PASS** |
| **Nonce Uniqueness** | Encrypts identical plaintext twice; asserts generated nonces and ciphertexts are completely distinct. | **PASS** |
| **Authenticated Decryption** | Decrypts valid ciphertext and verifies recovered plaintext strictly matches original buffer. | **PASS** |
| **Ciphertext Tampering Rejection** | Flips bits in ciphertext; verifies that authenticated decryption fails on authentication tag verification. | **PASS** |
| **AuthTag Tampering Rejection** | Modifies authentication tag byte; verifies that decipher rejects data immediately without yielding plaintext. | **PASS** |
| **URL-Safe Token Generation** | Verifies generated 32-byte random share token is encoded in URL-safe Base64 without prohibited characters (`+`, `/`, `=`). | **PASS** |
| **SHA-256 Token Hashing** | Verifies deterministic 64-character hex digest calculation for database storage. | **PASS** |
| **Timing-Safe Comparison** | Verifies that token comparison executes in constant time using `crypto.timingSafeEqual`. | **PASS** |

### 2.2 PDF Parsing & Dynamic Watermarking (`server/tests/watermarkAndRendering.test.js`)

| Scenario | Objective | Result |
| :--- | :--- | :--- |
| **PDF Inspection & Parsing** | Validates structural integrity and extracts exact page counts from multi-page PDFs using `pdf-lib`. | **PASS** |
| **Invalid PDF Header Rejection** | Rejects non-PDF files lacking the `%PDF` magic bytes (0x25 0x50 0x44 0x46) with `ValidationError`. | **PASS** |
| **Memory Page Rendering** | Renders Page 1 of a PDF in memory into a high-resolution PNG image buffer via PDF.js and Canvas. | **PASS** |
| **Out-of-Bounds Page Rejection** | Requests Page 99 on a 2-page document; asserts request fails with `ValidationError`. | **PASS** |
| **Dynamic Watermark Compositing** | Composites diagonal SVG watermark with sender email, receiver email, and timestamp onto image buffer via Sharp. | **PASS** |
| **SVG/XML Injection Defense** | Injects malicious payload (`attacker<script>alert(1)</script>" onclick="evil()`) into recipient identity; asserts payload is strictly escaped and rendered safely without XML parse errors. | **PASS** |

### 2.3 Access Control & End-to-End API Flow (`server/tests/accessAndApi.test.js`)

| Scenario | Objective | Result |
| :--- | :--- | :--- |
| **1. Multi-User Authentication** | Registers Sender (Alice), Authorized Receiver (Bob), and Intruder (Eve) via `/api/v1/auth/register`. | **PASS** |
| **2. Encrypted Document Upload** | Alice uploads PDF via `POST /api/v1/documents`. Verifies server generates random storage key, nonces, and wrapped DEK. | **PASS** |
| **3. Document Isolation** | Eve attempts to view and delete Alice's document; asserts requests return HTTP 404 (isolation enforced). | **PASS** |
| **4. Recipient-Restricted Sharing** | Alice shares document restricted to Bob's email (`bob@secureshare-test.com`). Verifies raw token is returned once and only SHA-256 hash is in MongoDB. | **PASS** |
| **5. Intruder Access Rejection** | Eve attempts to initialize viewing session on Bob's share; asserts backend returns HTTP 403 `UNAUTHORIZED_RECIPIENT`. | **PASS** |
| **6. Authorized Session Creation** | Bob initializes viewing session via `POST /api/v1/public/shares/:token/sessions`; asserts HTTP 201 with session ID. | **PASS** |
| **7. Protected Page Delivery** | Bob requests Page 1 via `GET /api/v1/public/shares/:token/pages/1`. Verifies returned stream is a valid PNG image (PNG magic bytes `89 50 4E 47`) with strict DRM headers (`Cache-Control: no-store`, `Referrer-Policy: no-referrer`). Raw PDF is never returned. | **PASS** |
| **8. Instant Revocation Killswitch** | Alice revokes share via `POST /api/v1/shares/:id/revoke`. Bob immediately requests Page 1 again; asserts request fails with HTTP 403 `REVOKED`. | **PASS** |
| **9. Strict UTC Expiry Enforcement** | Attempts page request against an expired share; asserts backend returns HTTP 403 `EXPIRED`. | **PASS** |

---

## 3. How to Run Automated Tests

To execute the full test suite locally:

```bash
# Navigate to the server directory
cd server

# Run all automated tests
npm test
```

Expected output:
```text
▶ Key Management Service - Wrap and Unwrap DEK
  ✔ Successfully wraps and unwraps 32-byte DEK
  ✔ Fails unwrapping if ciphertext or authTag is tampered with
✔ Key Management Service - Wrap and Unwrap DEK

▶ Document Encryption - AES-256-GCM
  ✔ Encrypts plaintext and returns ciphertext, nonce, and authTag
  ✔ Fresh nonce is generated for every encryption operation
  ✔ Successfully decrypts ciphertext with valid authentication tag
  ✔ Tampering with ciphertext fails authenticated decryption immediately
  ✔ Tampering with authentication tag fails decryption immediately
✔ Document Encryption - AES-256-GCM

▶ Token Cryptography & Hashing
  ✔ Generates 32-byte URL-safe base64 tokens
  ✔ SHA-256 token hashing produces consistent hex digests
  ✔ Timing safe comparison prevents timing attacks
✔ Token Cryptography & Hashing

▶ PDF Inspection & Parsing
  ✔ Successfully inspects valid multi-page PDF
  ✔ Rejects non-PDF files without standard PDF header
✔ PDF Inspection & Parsing

▶ Page Rendering & Dynamic Watermarking
  ✔ Renders page 1 to an image buffer
  ✔ Rejects page number out of range
  ✔ Applies watermarks with sender and recipient identities into image buffer
  ✔ User-provided identities cannot inject SVG/XML tags
✔ Page Rendering & Dynamic Watermarking

▶ End-to-End API Security & Access Control Flow
  ✔ 1. Authentication - Register Sender, Authorized Receiver, and Intruder
  ✔ 2. Document Upload - Encrypted storage and metadata saved
  ✔ 3. Document Isolation - Other users cannot view or delete sender document
  ✔ 4. Share Creation - Generate recipient-restricted link for Bob
  ✔ 5. Access Control - Intruder (Eve) is rejected by recipient policy
  ✔ 6. Access Control - Authorized Receiver (Bob) creates viewing session
  ✔ 7. Protected Viewing - Bob receives watermarked PNG, NOT raw PDF
  ✔ 8. Instant Revocation - Sender revokes share, receiver is immediately blocked
  ✔ 9. Expiry Enforcement - Expired share is rejected on backend
✔ End-to-End API Security & Access Control Flow

ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
```
