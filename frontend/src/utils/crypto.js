// src/utils/crypto.js
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const ivLength = 16;
let key;

const FALLBACK_HEX_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"; // 64 hex chars for 32 bytes

try {
  if (!process.env.ENCRYPTION_KEY) {
    console.error("[Crypto Error] ENCRYPTION_KEY is not set in .env file. Using fallback key.");
    key = Buffer.from(FALLBACK_HEX_KEY, "hex");
  } else if (process.env.ENCRYPTION_KEY.length !== 64) {
    console.warn(`[Crypto Warning] ENCRYPTION_KEY in .env is not 64 hex characters long (is ${process.env.ENCRYPTION_KEY.length}). This may lead to issues. Attempting to use it, but for AES-256, a 32-byte key (64 hex chars) is standard. If it's a raw 32-char key, consider Buffer.from(key, 'utf8'). For now, trying as hex or falling back.`);
    // Attempt to use it as hex, if it fails or results in wrong length, fallback.
    try {
        const tempKey = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
        if (tempKey.length === 32) {
            key = tempKey;
        } else {
            console.error(`[Crypto Error] ENCRYPTION_KEY (hex) resulted in ${tempKey.length} bytes, not 32. Using fallback key.`);
            key = Buffer.from(FALLBACK_HEX_KEY, "hex");
        }
    } catch (e) {
        console.error("[Crypto Error] Failed to process ENCRYPTION_KEY as hex. Using fallback key.", e.message);
        key = Buffer.from(FALLBACK_HEX_KEY, "hex");
    }
  } else {
    // Key is 64 hex characters long, as expected
    key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    if (key.length !== 32) {
        // This case should ideally not be reached if length is 64 and hex is valid
        console.error(`[Crypto Error] ENCRYPTION_KEY (hex) resulted in ${key.length} bytes, not 32, despite being 64 chars. Using fallback key.`);
        key = Buffer.from(FALLBACK_HEX_KEY, "hex");
    }
  }
} catch (error) {
  console.error("[Crypto Error] Critical error initializing encryption key. Using fallback key.", error);
  key = Buffer.from(FALLBACK_HEX_KEY, "hex");
}

if (key.length !== 32) {
    // Final safeguard, though the above logic should prevent this.
    console.error(`[Crypto FATAL] Key is still not 32 bytes long after all checks (length: ${key.length}). This will cause runtime errors. Ensure ENCRYPTION_KEY is a 64-character hex string.`);
    // Potentially throw an error here to halt startup in production
    // throw new Error("Encryption key is improperly configured.");
}


export const encrypt = (text) => {
  if (text === null || typeof text === 'undefined') {
    console.warn('[Encrypt] Attempted to encrypt null or undefined value.');
    return null; // Or handle as an error, or return an empty encrypted string
  }
  try {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(String(text), "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("[Encrypt] Encryption failed:", error.message, "(Key length at encryption:", key.length, ")");
    // Potentially re-throw or return a specific error indicator
    throw new Error(`Encryption process failed: ${error.message}`);
  }
};

export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    console.warn('[Decrypt] Invalid encrypted text format or null value provided. Input:', encryptedText);
    return null; // Or handle appropriately
  }
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
        console.warn('[Decrypt] Encrypted text format error: IV and text not separated by colon.');
        return "[Помилка формату шифрування]";
    }
    const iv = Buffer.from(textParts[0], 'hex');
    if (iv.length !== ivLength) {
        console.warn(`[Decrypt] Invalid IV length: expected ${ivLength}, got ${iv.length}`);
        return "[Помилка IV шифрування]";
    }
    const encryptedData = textParts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("[Decrypt] Decryption failed:", error.message, "(Key length at decryption:", key.length, ") Input was:", encryptedText.substring(0,40) + "...");
    return "[Помилка дешифрування]";
  }
};