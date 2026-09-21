/**
 * Web Crypto API utilities for Room-level End-to-End Encryption (E2EE)
 * Using PBKDF2 to derive an AES-GCM (256-bit) key deterministically from the room code.
 * This guarantees:
 * 1. Supabase stores only encrypted ciphertexts (zero knowledge on the DB/server).
 * 2. Anyone with the room URL/code can decrypt current and past messages in the room seamlessly.
 * 3. Leaving and re-entering the room never loses message decryption capability.
 */

const E2EE_PREFIX = '🔒E2EE:';

// Deterministic salt for the room code PBKDF2 derivation
const SALT = new TextEncoder().encode('quickchat_e2ee_room_salt_v1');

export async function deriveRoomKey(roomCode: string, roomPin?: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secret = roomPin && roomPin.trim() 
    ? `${roomCode.trim().toUpperCase()}:${roomPin.trim()}` 
    : roomCode.trim().toUpperCase();

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Check if a message is E2EE encrypted
export function isE2EEPayload(text: string): boolean {
  return typeof text === 'string' && text.startsWith(E2EE_PREFIX);
}

// Encrypt plaintext or JSON string using AES-GCM
export async function encryptMessage(
  plaintext: string,
  aesKey: CryptoKey
): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    data
  );

  const ivB64 = window.btoa(String.fromCharCode(...iv));
  const cipherBytes = new Uint8Array(ciphertext);
  let cipherBinary = '';
  for (let i = 0; i < cipherBytes.byteLength; i++) {
    cipherBinary += String.fromCharCode(cipherBytes[i]);
  }
  const cipherB64 = window.btoa(cipherBinary);

  return `${E2EE_PREFIX}${ivB64}:${cipherB64}`;
}

// Decrypt ciphertext using AES-GCM
export async function decryptMessage(
  encryptedString: string,
  aesKey: CryptoKey
): Promise<string> {
  if (!isE2EEPayload(encryptedString)) {
    return encryptedString;
  }

  const raw = encryptedString.slice(E2EE_PREFIX.length);
  const [ivB64, cipherB64] = raw.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid E2EE format');
  }

  const ivBinary = window.atob(ivB64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    iv[i] = ivBinary.charCodeAt(i);
  }

  const cipherBinary = window.atob(cipherB64);
  const cipherBytes = new Uint8Array(cipherBinary.length);
  for (let i = 0; i < cipherBinary.length; i++) {
    cipherBytes[i] = cipherBinary.charCodeAt(i);
  }

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    cipherBytes.buffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
