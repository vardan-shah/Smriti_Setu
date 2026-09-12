export async function getOrCreateAESKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem('app_aes_key');
  if (stored) {
    try {
      if (stored.startsWith('{')) {
        const jwk = JSON.parse(stored);
        return await crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      } else {
        const rawBuffer = new Uint8Array(stored.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        return await crypto.subtle.importKey("raw", rawBuffer, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      }
    } catch (e) {
      console.error("Key import failed, generating new key", e);
    }
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  const rawHex = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('app_aes_key', rawHex);
  return key;
}


export async function encryptData(data: unknown, key: CryptoKey): Promise<{ cipherText: string, iv: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(data))
  );

  const cipherText = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { cipherText, iv: ivHex };
}

export async function decryptData(cipherTextHex: string, ivHex: string, key: CryptoKey): Promise<unknown> {
  const cipherText = new Uint8Array(cipherTextHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherText
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}

export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(pin));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
