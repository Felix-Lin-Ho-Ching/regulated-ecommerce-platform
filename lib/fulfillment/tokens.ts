import crypto from "node:crypto";

export function createRawFulfillmentToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashFulfillmentToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function fulfillmentTokenExpiry(days = 14) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
