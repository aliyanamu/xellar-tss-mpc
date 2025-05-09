import * as crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
 
/**
 * Minifies a JSON string by removing unnecessary spaces.
 */
function minifiedJSON(inputJSON) {
  if (!inputJSON) {
    return "";
  }
  try {
    const parsed = JSON.parse(inputJSON);
    return JSON.stringify(parsed); // Minified JSON
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error.message}`);
  }
}
 
/**
 * Hashes the minified JSON using SHA256 and converts it to lowercase.
 */
function hashMinifiedJSON(inputJSON) {
  const minified = minifiedJSON(inputJSON);
  const hash = crypto.createHash('sha256').update(minified).digest('hex');
  return hash.toLowerCase();
}
 
/**
 * Generates the HMAC signature using the provided inputs.
 */
function generateSignature(method, url, clientSecret, hashedMinifiedJSON, timestamp) {
  const stringToSign = `${method.toUpperCase()}:${url}:${hashedMinifiedJSON}:${timestamp}`;
  console.log('stringToSign:', stringToSign);
  const hmac = crypto.createHmac('sha256', clientSecret).update(stringToSign).digest();
  return hmac.toString('base64');
}
 
/**
 * Prepares headers for an authorized request.
 */
export default function prepareHeaders(method, url, requestBody) {
  const appId = process.env.XELLAR_APP_ID || '';
  const clientSecret = process.env.XELLAR_CLIENT_SECRET || '';
 
  const timestamp = new Date().toISOString(); // ISO 8601: "YYYY-MM-DDTHH:mm:ss.sssZ"
  // Hash the minified JSON
  const hashedMinifiedJSON = hashMinifiedJSON(requestBody);
 
  // Generate signature
  const signature = generateSignature(method, url, clientSecret, hashedMinifiedJSON, timestamp);

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'X-TIMESTAMP': timestamp,    
    'X-SIGNATURE': signature,
    'X-APP-ID': appId,
  };

  console.log('authorization', { appId, clientSecret, hashedMinifiedJSON, timestamp, signature, requestBody });
  console.log('headers', headers);
  return headers;
}
