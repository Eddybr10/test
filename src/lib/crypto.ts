/**
 * Utilidades Criptográficas Client-Side (Zero-Knowledge)
 * Usamos la API Web Crypto nativa del navegador.
 */

// Convierte un string a un ArrayBuffer
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Deriva una clave AES-GCM a partir de una contraseña y un salt usando PBKDF2.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Convierte un ArrayBuffer a una cadena Base64
 */
export function bufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convierte una cadena Base64 a un ArrayBuffer
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Genera un salt aleatorio (16 bytes)
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Encripta un texto plano. Retorna el texto cifrado y el IV en Base64.
 */
export async function encryptData(plainText: string, key: CryptoKey): Promise<{ ciphertext: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any
    },
    key,
    enc.encode(plainText)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer)
  };
}

/**
 * Desencripta un texto cifrado en Base64 con su respectivo IV.
 */
export async function decryptData(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer) as any
    },
    key,
    ciphertextBuffer
  );

  return dec.decode(decryptedBuffer);
}

/**
 * Hashea la contraseña maestra para enviar al servidor y autenticar (nunca se envía la maestra plana)
 */
export async function hashMasterPasswordForAuth(password: string, saltBase64: string): Promise<string> {
  const key = await deriveKey(password, new Uint8Array(base64ToBuffer(saltBase64)));
  const exported = await window.crypto.subtle.exportKey("raw", key);
  
  // Realizamos un hash adicional sobre la clave derivada para no enviar la clave de encriptación al servidor
  const authHash = await window.crypto.subtle.digest("SHA-256", exported);
  return bufferToBase64(authHash);
}

/**
 * Generador de contraseñas seguras
 */
export function generatePassword(length = 16, useSymbols = true, useNumbers = true, useUppercase = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = lowercase;
  if (useUppercase) chars += uppercase;
  if (useNumbers) chars += numbers;
  if (useSymbols) chars += symbols;

  let password = '';
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }

  return password;
}
