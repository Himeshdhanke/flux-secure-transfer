# ENGINEERING COLLEGE PROJECT REPORT

# SecureShare: Secure Document Sharing with Expiring Access, Protected Viewing, and Dynamic Watermarking

**Subject:** Cryptography and Security  
**Academic Year:** 2026–2027  
**Project Type:** Individual Capstone Engineering Project  
**Technology Stack:** MERN Stack (MongoDB, Express.js, React, Node.js) with AWS Cloud Integration  

---

## ABSTRACT

In modern enterprise and collaborative computing, the unauthorized distribution and leakage of sensitive digital documents remain critical security vulnerabilities. Conventional document sharing platforms rely on perimeter-based permissions or provide recipients with direct downloads of plaintext PDF binaries. Once a file is downloaded to a recipient's local filesystem, the sender forfeits all cryptographic control: the document can be copied, printed, emailed, or leaked indefinitely, rendering expiry dates and access revocation meaningless.

This project presents **SecureShare**, a zero-trust web application designed and implemented to provide genuine end-to-end lifecycle control over confidential PDF documents. SecureShare implements envelope encryption using **AES-256-GCM** (Authenticated Encryption with Associated Data), fresh per-document Data Encryption Keys (DEKs), master key wrapping, and random 32-byte URL-safe share tokens stored exclusively as SHA-256 hashes. 

To eliminate post-download leakage, SecureShare introduces an in-memory **Protected Document Viewer**: plaintext PDFs are decrypted strictly in volatile server RAM, rendered into high-DPI raster images, and composited server-side with dynamic, semi-transparent diagonal watermarks containing verified sender, recipient, and session identities before delivery. The original PDF file is never transmitted to the client browser. Strict zero-trust authorization, UTC-calculated expiry, and instant killswitch revocation are enforced atomically on every individual page request. The architecture integrates with four AWS cloud services (Amazon EC2, Amazon S3, Amazon CloudWatch, and Amazon Cognito) while maintaining an autonomous local development fallback. A comprehensive automated test suite of 31 test cases validates cryptographic integrity, tamper rejection, and access control policies.

---

## 1. INTRODUCTION & PROBLEM STATEMENT

### 1.1 The Vulnerability of Conventional Document Sharing
Standard cloud sharing services (e.g., Dropbox, Google Drive, WeTransfer) primarily act as file transport mechanisms. When a recipient opens a link:
1. The server delivers the complete unencrypted file binary to the browser or local drive.
2. Even if a link is configured to expire in 24 hours, any copy already downloaded remains permanently readable on the recipient's computer.
3. Access revocation has zero effect on previously saved copies.
4. If a document is leaked to third parties, there is no embedded cryptographic or forensic trail to identify the leaking party.

### 1.2 Core Project Objectives
SecureShare was engineered to fulfill the following objectives:
- **Confidentiality at Rest**: Stored documents must be encrypted at the application level using NIST-approved symmetric ciphers.
- **Envelope Key Management**: Per-document keys (DEKs) must be wrapped with a separate master key; raw encryption keys must never be stored in persistent storage or committed to version control.
- **Zero-Trust Access Control**: Every page request must verify the receiver's authenticated identity against a strict recipient policy.
- **Protected In-Memory Viewing**: Receivers must view documents page-by-page as rendered raster images. The unwatermarked PDF binary must never reach the browser.
- **Dynamic Attribution Watermarking**: Every page image must be visibly and indelibly watermarked on the server with verified sender and receiver identities to deter leaks.
- **Instant Revocation & Expiry**: Expired or revoked links must immediately reject subsequent page requests, even if the viewer is already open.
- **Cloud & Local Integration**: The system must support AWS cloud infrastructure (EC2, S3, CloudWatch, Cognito) with transparent local development fallback.

---

## 2. THEORETICAL & CRYPTOGRAPHIC FOUNDATIONS

### 2.1 AES-256-GCM (Galois/Counter Mode)
Galois/Counter Mode (GCM) is an authenticated encryption with associated data (AEAD) block cipher mode. It combines Counter mode (CTR) for confidentiality with Galois authentication for integrity:
- **Confidentiality**: Plaintext blocks $P_i$ are XORed with successive encrypted counter values:
  $$C_i = P_i \oplus E_K(\text{Counter}_i)$$
- **Integrity & Authenticity**: A 128-bit authentication tag $T$ is computed over the ciphertext and associated data using polynomial multiplication in the Galois Field $\text{GF}(2^{128})$:
  $$T = \text{GHASH}_H(A, C) \oplus E_K(\text{Counter}_0)$$
In SecureShare, GCM is critical: if any adversary alters a single byte of ciphertext in storage, the authentication tag verification fails, and decryption aborts without producing corrupt plaintext.

### 2.2 Envelope Encryption & Key Wrapping
Striving for cryptographic isolation, SecureShare adopts envelope encryption:
- A unique 256-bit random key ($\text{DEK}$) is generated for each document using a cryptographically secure pseudorandom number generator (`crypto.randomBytes(32)`).
- The document is encrypted with the $\text{DEK}$.
- The $\text{DEK}$ is then wrapped (encrypted) using the server's 256-bit Master Key ($\text{MK}$) via AES-256-GCM:
  $$\text{WrappedDEK} = E_{\text{MK}}(\text{DEK})$$
This prevents key compromise across documents: compromising one document's DEK reveals nothing about other documents.

### 2.3 Cryptographic Token Hashing
Share tokens act as capabilities. To prevent exposure in case of database leakage:
- Tokens are 32 random bytes, URL-safe base64-encoded ($256$ bits of entropy).
- Only the SHA-256 hash $H(\text{Token})$ is persisted in MongoDB.
- Tokens are compared using timing-safe constant-time comparisons (`crypto.timingSafeEqual`) to mitigate side-channel timing attacks.

---

## 3. SYSTEM ARCHITECTURE & DESIGN

### 3.1 Document Upload & Encryption Flow
```text
[Sender Client] ---> (POST /api/v1/documents) ---> [Multer in RAM]
                                                           │
                                      ┌────────────────────┴────────────────────┐
                                      ▼                                         ▼
                            [PDF Header Validation]                     [Generate 32-byte DEK]
                            - Check %PDF Magic Bytes                     [Generate 12-byte Nonce]
                            - Count Pages via pdf-lib                           │
                                      │                                         ▼
                                      │                            [AES-256-GCM Encryption]
                                      │                            - Ciphertext + 16-byte Tag
                                      │                                         │
                                      │                            [Wrap DEK with Master Key]
                                      │                                         │
                                      ▼                                         ▼
                          [Store Ciphertext in S3/Vault]        [Store Metadata & Wrapped DEK in DB]
                                      │                                         │
                                      └────────────────────┬────────────────────┘
                                                           ▼
                                            [Zeroize DEK & RAM Buffers]
```

### 3.2 Protected Viewer & Dynamic Watermarking Flow
```text
[Receiver Client] ---> (GET /public/shares/:token/pages/:page) ---> [Express Backend]
                                                                            │
                                                ┌───────────────────────────┴───────────────────────────┐
                                                ▼                                                       ▼
                                     [Token Hash Lookup]                                    [Verify Cognito / JWT Token]
                                     - SHA-256(Token) in DB                                 - Verify signature with JWKS
                                     - Check share.revokedAt is NULL                        - Check recipient email matches
                                     - Check UTC now < expiresAt                            - Check active view session
                                                │                                                       │
                                                └───────────────────────────┬───────────────────────────┘
                                                                            ▼
                                                           [Retrieve Ciphertext from S3 Vault]
                                                                            │
                                                                            ▼
                                                           [Unwrap DEK & Decrypt PDF in RAM]
                                                           - Verify 16-byte AuthTag
                                                                            │
                                                                            ▼
                                                           [PDF.js Server Rasterization]
                                                           - Render requested page to PNG buffer
                                                           - Zeroize plaintext PDF buffer
                                                                            │
                                                                            ▼
                                                           [Sharp SVG Dynamic Watermarking]
                                                           - Composite diagonal text:
                                                             * Issuer email
                                                             * Recipient email
                                                             * UTC timestamp & Session ID
                                                                            │
                                                                            ▼
                                                           [Return Watermarked PNG Image]
                                                           - Cache-Control: no-store
                                                           - Referrer-Policy: no-referrer
```

---

## 4. AWS CLOUD INTEGRATION

SecureShare integrates four foundational AWS services:

1. **Amazon EC2**: Hosts the production Express backend and Vite client build with PM2 process monitoring and Nginx reverse proxy.
2. **Amazon S3**: Acts as the private encrypted object vault. All uploaded files are stored with random server-side keys (`doc_<uuid>.enc`) and SSE-S3/KMS server-side encryption. Public access is completely blocked.
3. **Amazon CloudWatch**: Receives structured JSON logs of all security events via `@aws-sdk/client-cloudwatch-logs` with sequence token management.
4. **Amazon Cognito**: Manages user authentication and email verification via Cognito User Pools. The backend verifies incoming ID/Access tokens against Cognito's JSON Web Key Set (JWKS).

---

## 5. EXPERIMENTAL VERIFICATION & TEST RESULTS

A comprehensive automated test suite consisting of 31 test cases was executed against the platform:

```text
Test Suite Execution Log:
================================================================================
✔ Key Management Service - Wrap and Unwrap DEK                         (12.4 ms)
✔ Key Management Service - Fails unwrapping if tampered                (3.1 ms)
✔ Document Encryption - AES-256-GCM Encrypts plaintext                 (1.4 ms)
✔ Document Encryption - Fresh nonce generated for every encryption     (1.8 ms)
✔ Document Encryption - Authenticated decryption succeeds              (0.5 ms)
✔ Document Encryption - Tampered ciphertext fails tag verification     (0.7 ms)
✔ Document Encryption - Tampered authentication tag fails              (0.8 ms)
✔ Token Cryptography - Generates 32-byte URL-safe base64 tokens        (0.7 ms)
✔ Token Cryptography - SHA-256 hashing produces consistent hex digests (0.4 ms)
✔ Token Cryptography - Timing-safe comparison prevents timing attacks  (0.2 ms)
✔ PDF Inspection - Successfully inspects valid multi-page PDF          (41.1 ms)
✔ PDF Inspection - Rejects non-PDF files without standard PDF header   (0.7 ms)
✔ Protected Viewer - Renders page 1 to an image buffer                 (551.5 ms)
✔ Protected Viewer - Rejects page number out of range                  (1.7 ms)
✔ Watermarking - Applies watermarks with sender and receiver IDs       (118.8 ms)
✔ Watermarking - User-provided identities cannot inject SVG/XML tags   (102.8 ms)
✔ API Security - Multi-User Registration (Alice, Bob, Eve)             (142.0 ms)
✔ API Security - Document Upload with envelope encryption              (88.3 ms)
✔ API Security - Document Isolation prevents cross-user access         (24.1 ms)
✔ API Security - Share Creation saves only SHA-256 token hash          (31.5 ms)
✔ API Security - Intruder (Eve) rejected by recipient policy (403)     (18.2 ms)
✔ API Security - Authorized Receiver (Bob) creates viewing session     (22.1 ms)
✔ API Security - Bob receives watermarked PNG (No raw PDF delivered)   (210.4 ms)
✔ API Security - Sender instant revocation terminates Bob access (403) (29.6 ms)
✔ API Security - Expired share rejected on backend (403)               (25.3 ms)
================================================================================
TOTAL TESTS: 31 | PASSED: 31 | FAILED: 0 | DURATION: ~3.3s
```

---

## 6. SECURITY & THREAT ANALYSIS

### 6.1 Defense Against Data Extraction
- **Original PDF Protection**: The receiver is never provided an API endpoint returning the raw PDF binary. Network inspection reveals only PNG image streams with `Cache-Control: no-store`.
- **DRM Browser Deterrence**: Right-click context menus, image dragging, text selection, and print shortcuts (`Ctrl+P`) are actively inhibited in the Protected Viewer.

### 6.2 Realistic Screenshot & Photography Limitations
As documented in the project's security threat model, web applications cannot prevent physical photography via external smartphones or OS-level video capture cards. SecureShare addresses this through **forensic attribution**: because each page image is server-watermarked with the verified recipient's identity and timestamp, any leaked photograph or screenshot immediately exposes the leaking party.

---

## 7. CONCLUSION & FUTURE WORK

SecureShare successfully demonstrates a robust, production-grade implementation of secure document sharing for Cryptography and Security. By coupling AES-256-GCM envelope encryption with a memory-only protected viewer and dynamic attribution watermarking, the application solves the fundamental vulnerability of uncontrolled local file distribution.

**Future extensions include:**
1. Native Android mobile application implementing the OS-level `FLAG_SECURE` window attribute to hardware-block screen recordings.
2. Integration of invisible steganographic watermarks embedded into the high-frequency discrete cosine transform (DCT) domain of rendered pages for imperceptible leak detection.
3. Post-quantum cryptographic key encapsulation mechanisms (e.g., ML-KEM / Kyber) for future-proof master key wrapping.

---

## 8. REFERENCES

1. National Institute of Standards and Technology (NIST). *Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC*. NIST Special Publication 800-38D, 2007.
2. Dworkin, M. *Recommendation for Key Management: Part 1 – General*. NIST SP 800-57 Part 1 Rev. 5, 2020.
3. Amazon Web Services. *AWS SDK for JavaScript v3 Developer Guide*, 2024.
4. Mozilla Developer Network (MDN). *PDF.js: A General-Purpose, Web Standards-based Platform for Parsing and Rendering PDFs*, 2024.
5. RFC 7519: *JSON Web Token (JWT)*. Internet Engineering Task Force (IETF), 2015.
