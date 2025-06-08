import crypto from "crypto";

const algorithm = "aes-256-cbc";
const ivLength = 16; // AES block size is 128 bits (16 bytes)
let key;

// Цей ключ буде використаний, якщо ENCRYPTION_KEY в .env не встановлено або некоректний.
// ВАЖЛИВО: Для продакшену ЗАВЖДИ встановлюйте надійний, унікальний ключ в .env!
const FALLBACK_HEX_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"; // 64 hex chars = 32 bytes

try {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    console.error("[Crypto Init Error] ENCRYPTION_KEY is not set in the .env file. Using a fallback key. THIS IS INSECURE FOR PRODUCTION. Please set a strong 64-character hex key.");
    key = Buffer.from(FALLBACK_HEX_KEY, "hex");
  } else if (envKey.length !== 64) {
    // Дозволяємо 32-символьний ключ, інтерпретуючи його як UTF-8, якщо він не є 64-символьним шістнадцятковим.
    // Це менш безпечно, ніж спеціально згенерований шістнадцятковий ключ.
    if (envKey.length === 32) {
        console.warn(`[Crypto Init Warning] ENCRYPTION_KEY is 32 characters long. Interpreting as UTF-8. For optimal security, a 64-character hex key (32 bytes) is recommended.`);
        key = Buffer.from(envKey, 'utf-8');
        if (key.length !== 32) { // Перевірка, чи UTF-8 кодування дало 32 байти
            console.error(`[Crypto Init Error] ENCRYPTION_KEY (UTF-8) did not result in a 32-byte key (got ${key.length} bytes). Using fallback key. THIS IS INSECURE FOR PRODUCTION.`);
            key = Buffer.from(FALLBACK_HEX_KEY, "hex");
        }
    } else {
        console.error(`[Crypto Init Error] ENCRYPTION_KEY in .env is ${envKey.length} characters long. It must be a 64-character hex string (for 32 bytes) or a 32-character string (interpreted as UTF-8 for a 32-byte key). Using fallback key. THIS IS INSECURE FOR PRODUCTION.`);
        key = Buffer.from(FALLBACK_HEX_KEY, "hex");
    }
  } else {
    // Ключ має 64 символи, пробуємо інтерпретувати як hex
    try {
        key = Buffer.from(envKey, "hex");
        if (key.length !== 32) {
            console.error(`[Crypto Init Error] ENCRYPTION_KEY (hex, 64 chars) resulted in ${key.length} bytes, not 32. This is unexpected. Using fallback key. THIS IS INSECURE FOR PRODUCTION.`);
            key = Buffer.from(FALLBACK_HEX_KEY, "hex");
        }
    } catch (e) {
        console.error("[Crypto Init Error] Failed to process ENCRYPTION_KEY as hex, even though it was 64 characters. Ensure it's a valid hex string. Using fallback key. THIS IS INSECURE FOR PRODUCTION.", e.message);
        key = Buffer.from(FALLBACK_HEX_KEY, "hex");
    }
  }
} catch (error) {
  console.error("[Crypto Init Error] Critical error initializing encryption key from .env. Using fallback key. THIS IS INSECURE FOR PRODUCTION.", error);
  key = Buffer.from(FALLBACK_HEX_KEY, "hex");
}

if (key.length !== 32) {
    // Фінальна перевірка, хоча попередня логіка має це запобігти.
    console.error(`[Crypto FATAL] Key is still not 32 bytes long after all checks (length: ${key.length}). This will cause runtime errors during encryption/decryption. Ensure ENCRYPTION_KEY is correctly configured.`);
    // В продакшені тут можна було б викинути помилку, щоб зупинити запуск.
    // throw new Error("Encryption key is improperly configured and could not be resolved to 32 bytes.");
} else {
    console.log("[Crypto Init] Encryption key initialized successfully (32 bytes).");
}

export const encrypt = (text) => {
  if (text === null || typeof text === 'undefined') {
    console.warn('[Encrypt] Attempted to encrypt null or undefined value.');
    return null;
  }
  if (key.length !== 32) {
      console.error("[Encrypt Error] Cannot encrypt: Encryption key is not 32 bytes long.");
      throw new Error("Encryption key error: Invalid key length for encryption.");
  }
  try {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(String(text), "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("[Encrypt] Encryption failed:", error.message);
    throw new Error(`Encryption process failed: ${error.message}`);
  }
};

export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    console.warn('[Decrypt] Invalid encrypted text format or null/empty value provided. Input:', encryptedText);
    return null;
  }
  if (key.length !== 32) {
      console.error("[Decrypt Error] Cannot decrypt: Encryption key is not 32 bytes long.");
      return "[Помилка ключа дешифрування]";
  }
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
        console.warn('[Decrypt] Encrypted text format error: IV and text not separated by colon.');
        return "[Помилка формату шифрування]";
    }
    const ivHex = textParts[0];
    const encryptedData = textParts[1];

    if (ivHex.length !== ivLength * 2) { // Each byte is 2 hex chars
        console.warn(`[Decrypt] Invalid IV length: expected ${ivLength * 2} hex characters, got ${ivHex.length}`);
        return "[Помилка IV шифрування]";
    }
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("[Decrypt] Decryption failed:", error.message, "Input was:", encryptedText.substring(0,40) + "...");
    return "[Помилка дешифрування]";
  }
};