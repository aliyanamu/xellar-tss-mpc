import * as crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
 
/**
 * Sanitizes the request payload to include only allowed keys.
 * Removes undefined, null, or prototype-polluting keys.
 */
export function sanitizedBody(inputObject) {
  console.log('inputObject', inputObject);
  if (typeof inputObject !== 'object' || inputObject === null) {
    throw new Error('Input must be a non-null object');
  }

  // Only allow these keys for now
  const allowedKeys = ['subId', 'network', 'chainId'];

  const cleanObject = {};

  for (const key of allowedKeys) {
    if (
      Object.prototype.hasOwnProperty.call(inputObject, key) &&
      inputObject[key] != null &&
      !['__proto__', 'constructor', 'prototype'].includes(key)
    ) {
      cleanObject[key] = inputObject[key];
    }
  }

  console.log('sanitizedObject', JSON.stringify(cleanObject));
  return JSON.stringify(cleanObject); // Minified, safe JSON string
}

/**
 * Hashes the sanitized JSON string using SHA256.
 */
function hashMinifiedJSON(sanitized) {
  const hash = crypto.createHash('sha256').update(sanitized).digest('hex');
  return hash.toLowerCase();
}

/**
 * Generates HMAC signature from sanitized payload.
 */
function generateSignature(method, url, clientSecret, hashedMinifiedJSON, timestamp) {
  const stringToSign = `${method.toUpperCase()}:${url}:${hashedMinifiedJSON}:${timestamp}`;
  console.log('stringToSign:', stringToSign);
  const hmac = crypto.createHmac('sha256', clientSecret).update(stringToSign).digest();
  return hmac.toString('base64');
}

function formatDateISOWithOffset(date) {
  const pad = (n) => String(n).padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1); // getUTCMonth() dimulai dari 0
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  // Format: YYYY-MM-DDTHH:mm:ss+00:00
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
}

/**
 * Builds headers for the request.
 */
export function prepareHeaders(method, url, requestBody) {
  const appId = process.env.XELLAR_APP_ID || '';
  const clientSecret = process.env.XELLAR_CLIENT_SECRET || '';
  const timestamp = formatDateISOWithOffset(new Date());
  const hashedMinifiedJSON = hashMinifiedJSON(requestBody);
  const signature = generateSignature(method, url, clientSecret, hashedMinifiedJSON, timestamp);

  const headers = {
    'Content-Type': 'application/json',
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-APP-ID': appId,
  };

  console.log('authorization', {
    appId,
    clientSecret,
    hashedMinifiedJSON,
    timestamp,
    signature,
    requestBody,
  });
  console.log('headers', headers);

  return headers;
}
