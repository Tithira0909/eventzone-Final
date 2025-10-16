// server/payments/onepay-client.js
const crypto = require("crypto");
const axios = require("axios");

const {
  ONEPAY_APP_ID,
  ONEPAY_API_KEY,
  ONEPAY_HASH_SECRET,
  ONEPAY_BASE,
  APP_BASE_URL,
} = process.env;

/**
 * NOTE: The exact fields & signature formula come from OnePay’s docs.
 * The skeleton below matches a common “hosted checkout” pattern.
 * Replace field names that differ in OnePay’s spec (they’re usually close).
 */

function sign(payload) {
  // Typical pattern: HMAC-SHA256 over a canonical string with a secret
  // Build in a predictable order; tweak to match OnePay spec exactly.
  const canonical = [
    payload.app_id,
    payload.reference,
    payload.amount,       // usually cents or integer; confirm with OnePay
    payload.currency,
    payload.return_url,
    payload.notify_url,
  ].join("|");
  return crypto.createHmac("sha256", ONEPAY_HASH_SECRET).update(canonical).digest("hex");
}

async function createCheckout({ reference, amount, currency, description, customer }) {
  const returnUrl = `${APP_BASE_URL}/api/pay/onepay/return?ref=${encodeURIComponent(reference)}`;
  const notifyUrl = `${APP_BASE_URL}/api/pay/onepay/webhook`;

  const body = {
    app_id: ONEPAY_APP_ID,
    reference,                    // your order id
    amount,                       // send as integer in LKR cents if required
    currency,                     // "LKR"
    description,                  // "Eventz One Tickets"
    customer_name: customer?.name,
    customer_email: customer?.email,
    customer_phone: customer?.phone,
    return_url: returnUrl,
    notify_url: notifyUrl,
    // any extra fields OnePay needs go here (e.g. expiry, meta, etc.)
  };

  // attach signature / api key
  body.signature = sign(body);

  const resp = await axios.post(`${ONEPAY_BASE}/api/v1/checkout/create`, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ONEPAY_API_KEY}`, // or whatever header OnePay requires
    },
    timeout: 15000,
  });

  // Expect something like { payment_url, checkout_id, ... }
  return resp.data;
}

function verifySignatureFromOnePay(payload) {
  // OnePay will post back fields + their signature/hmac.
  // Recompute with your secret and compare.
  const expected = sign({
    app_id: payload.app_id,
    reference: payload.reference,
    amount: payload.amount,
    currency: payload.currency,
    return_url: payload.return_url || "",
    notify_url: payload.notify_url || "",
  });
  return (payload.signature || "").toLowerCase() === expected.toLowerCase();
}

module.exports = {
  createCheckout,
  verifySignatureFromOnePay,
};
