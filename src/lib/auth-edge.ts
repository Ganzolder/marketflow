/**
 * Edge-compatible session verification (Web Crypto API).
 * Used in middleware where Node crypto is not available.
 */
export async function verifySessionEdge(token: string, secret: string): Promise<boolean> {
  try {
    const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    const parts = decoded.split(':');
    const username = parts[0];
    const timestampStr = parts[1];
    const signatureHex = parts[2];
    if (!username || !timestampStr || !signatureHex) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 60 * 60 * 24 * 7 * 1000) return false; // 7 days
    const payload = `${username}:${timestampStr}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    );
    const expectedHex = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (expectedHex.length !== signatureHex.length) return false;
    let eq = 0;
    for (let i = 0; i < expectedHex.length; i++) eq |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
    return eq === 0;
  } catch {
    return false;
  }
}
