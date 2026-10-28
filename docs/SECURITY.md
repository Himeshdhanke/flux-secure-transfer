# SecureShare — Security Architecture & Threat Model

## 1. Threat Model & Security Posture

SecureShare protects confidential documents shared across untrusted networks and shared storage environments.

### 1.1 Threat Actors & Capabilities

| Threat Actor | Capabilities & Objectives | Mitigations in SecureShare |
| :--- | :--- | :--- |
| **Malicious Network Intermediary (Man-in-the-Middle)** | Attempts to intercept documents in transit or eavesdrop on network traffic. | Enforced TLS (HTTPS) with HSTS, strict `Referrer-Policy: no-referrer`, and authenticated encryption. |
| **Storage Infrastructure Compromise** | An attacker gains read-only access to S3 object storage or database dumps. | Application-level envelope encryption: storage holds only AES-256-GCM ciphertext. MongoDB holds only wrapped keys and SHA-256 hashes of tokens. |
| **Unauthorized Recipient (Intruder / Eve)** | Possesses a valid share link URL but is not the intended recipient. | Zero-trust recipient verification: every request validates receiver Cognito/JWT identity against `share.recipientEmail`. |
| **Authorized Receiver with Malicious Intent** | Seeks to download the original file or distribute leaked copies anonymously. | Original PDF is never delivered; only watermarked raster page images are served. Watermarks embed receiver's identity, timestamp, and session ID to facilitate leak attribution. |
| **Former Authorized Receiver** | Attempts to access document after agreement termination or share expiration. | UTC-based expiry enforced on every single page request; instantaneous sender revocation terminates active viewing immediately. |

---

## 2. Cryptographic Specifications

SecureShare uses Node.js standard `node:crypto` primitives. No custom or unvetted cryptographic algorithms are implemented.

### 2.1 Authenticated Document Encryption: AES-256-GCM
- **Algorithm**: `aes-256-gcm` (NIST SP 800-38D).
- **Key Generation**: 32 cryptographically random bytes generated via `crypto.randomBytes(32)` for each document (Data Encryption Key / DEK).
- **Initialization Vector / Nonce**: 12 random bytes (96 bits) generated per encryption operation. Nonces are never reused with the same key.
- **Authentication Tag**: 16 bytes (128 bits). Decryption strictly calls `decipher.setAuthTag()` before consuming data; if ciphertext or tag is modified by even 1 bit, decryption terminates with an immediate cryptographic failure.
- **Memory Zeroization**: Plaintext buffers and unencrypted DEKs are explicitly overwritten using `buffer.fill(0)` immediately after use.

### 2.2 Envelope Key Wrapping
- **Master Key**: 256-bit key loaded from protected environment configuration (`SECURESHARE_MASTER_KEY`).
- **Wrapping Mechanism**: The DEK is encrypted using `aes-256-gcm` with the master key, producing a wrapped key object containing:
  ```json
  {
    "ciphertext": "<hex-encoded-encrypted-dek>",
    "nonce": "<12-byte-hex-nonce>",
    "authTag": "<16-byte-hex-tag>"
  }
  ```
- **Guarantees**: Raw DEKs are never stored in MongoDB, logs, source control, or sent to client browsers.

### 2.3 Secure Share Tokens & Hashing
- **Token Generation**: 32 cryptographically random bytes via `crypto.randomBytes(32)`, encoded as a URL-safe Base64 string (`base64url`).
- **Storage Hashing**: Raw tokens are hashed immediately using SHA-256 (`crypto.createHash('sha256')`). Only the 64-character hex digest is stored in MongoDB.
- **Timing Attack Mitigation**: Token comparisons utilize constant-time comparison (`crypto.timingSafeEqual`).
- **Log Hygiene**: Raw tokens, DEKs, and passwords are automatically scrubbed from structured logs via a recursive sanitization filter.

---

## 3. Zero-Trust Access Control & Expiry

Authorization is never assumed based on frontend state or link possession. Every page request executes an atomic policy verification:

```text
Check 1: SHA-256(RawToken) matches active Share record in MongoDB.
Check 2: share.revokedAt is NULL (immediate killswitch enforcement).
Check 3: Current UTC timestamp <= share.expiresAt (strict time-to-live).
Check 4: Request contains verified Cognito/JWT token with valid signature.
Check 5: Authenticated receiver email == share.recipientEmail (case-insensitive).
Check 6: Viewing session is active and has not exceeded maxViewSessions limit.
Check 7: Requested page number is within [1, document.pageCount].
```

If any check fails, access is denied immediately with HTTP 401 or 403, and an audit event (`SHARE_VIEW_DENIED_*`) is logged.

---

## 4. Screenshot & Copying Limitations: Honest Analysis

### 4.1 The Reality of Web Applications
No web application can physically prevent:
1. **External Photography**: A user using an external camera, smartphone, or secondary recording device to take a picture of their physical screen.
2. **Operating System Screen Capture**: OS-level screenshot tools (e.g. Snipping Tool, PrintScreen, macOS Screenshot) or hypervisor/virtual-machine screen grabs that bypass browser JavaScript hooks.
3. **Hardware Video Interception**: HDMI capture cards or display hardware splitters.

**SecureShare makes no false claims of absolute screenshot prevention.** Instead, SecureShare implements a defense-in-depth posture:

### 4.2 Web Defense & Leak Attribution
1. **No Original PDF Delivery**: The receiver receives only watermarked raster PNG images. The original PDF vector graphics, embedded text, attachments, and metadata are never accessible.
2. **Dynamic Server-Side Watermarking**:
   - The watermark is baked directly into the image raster pixels using Sharp. It is not an easily removable CSS overlay.
   - Watermarks display repeated, semi-transparent diagonal text across the page content with verified sender email, receiver email, UTC timestamp, and unique session ID.
   - If an unauthorized photo or screenshot is taken and leaked, the embedded watermark provides indisputable forensic attribution back to the specific recipient and viewing session.
3. **Browser Deterrence**:
   - Context menus and image dragging are disabled.
   - Standard printing (`Ctrl+P` / `@media print`) is disabled.
   - `Cache-Control: no-store` prevents browser disk caching.
4. **Mobile OS Considerations (`FLAG_SECURE`)**:
   - On native mobile platforms (e.g., Android), applications can set the `FLAG_SECURE` window flag to prevent OS-level screenshots and screen recording. This is outside the scope of web browsers, which lack access to OS window security APIs.

---

## 5. Input Validation & Injection Defenses

1. **SVG / XML Injection Defense**:
   All user-derived fields (sender email, recipient email, session IDs) are strictly escaped (`&`, `<`, `>`, `"`, `'`) before being embedded into SVG watermark templates, preventing SVG script execution or XML parser abuse.
2. **PDF Header & Structure Validation**:
   Uploaded files must begin with the standard `%PDF` magic bytes (0x25 0x50 0x44 0x46) and pass structural inspection via `pdf-lib` before encryption is attempted.
3. **Strict Size Limits**:
   File sizes are capped at 20MB in memory; requests exceeding limits are rejected by Multer before buffering. Page counts are capped at 100 pages to prevent denial-of-service (DoS) via resource exhaustion.
4. **NoSQL Query Injection**:
   All MongoDB queries use explicit object property bindings and Zod schema validation to eliminate query operator injection.
