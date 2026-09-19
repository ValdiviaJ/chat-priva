/**
 * Web Crypto API utilities for End-to-End Encryption (E2EE)
 * Using ECDH (P-256) for Key Exchange and AES-GCM (256-bit) for symmetric encryption.
 */

// Generate an ephemeral ECDH keypair
export async function generateE2EEKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// Export public key to base64 (spki)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  const bytes = new Uint8Array(exported);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Import base64 public key from peer
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

// Derive a shared AES-GCM 256-bit key from our private key and peer's public key
export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

const E2EE_PREFIX = '🔒E2EE:';

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
