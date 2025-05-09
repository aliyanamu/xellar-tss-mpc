import axios from 'axios';
import prepareHeaders from './headers.js';

const config = {
  baseUrl: 'https://tss-dev.xellar.co',
  endpoints: {
    createAccount: '/api/v1/wallet/account',
    getAccount: '/api/v1/wallet/account/{id}',
  },
};

function resolveEndpoint(endpointKey, params = {}) {
  let path = config.endpoints[endpointKey];
  if (!path) throw new Error(`Unknown endpoint "${endpointKey}"`);

  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }

  return path;
}

async function makeRequest(endpointKey, method = 'GET', payload = null, pathParams = {}) {
  const endpointPath = resolveEndpoint(endpointKey, pathParams);
  const url = `${config.baseUrl}${endpointPath}`;
  const body = payload ? JSON.stringify(payload) : null;

  try {
    const response = await axios({
      method,
      url,
      headers: prepareHeaders(method, endpointPath, body),
      data: body,
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    handleRequestError(error);
    throw error;
  }
}

function handleRequestError(error) {
  if (error.response) {
    console.error('Server responded with an error:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Request setup error:', error.message);
  }
}

async function createAccount(accountData) {
  console.log('Creating account...');
  try {
    const { data } = await makeRequest('createAccount', 'POST', accountData);
    console.log('✔ Account created:\n', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('✖ Failed to create account:', err.message);
    return null;
  }
}

async function getAccount(accountId) {
  console.log('Retrieving account...');
  try {
    const { data } = await makeRequest('getAccount', 'GET', null, { id: accountId });
    console.log('✔ Account retrieved:\n', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('✖ Failed to retrieve account:', err.message);
    return null;
  }
}

async function runTests() {
  const testAccount = { subId: 'c9da759c-c0c1-708c-6ffa-76ca2f05048f' };

  console.log('📡 Testing Xellar TSS Service');
  console.log(`→ Base URL: ${config.baseUrl}\n`);

  const created = await createAccount(testAccount);
  // const fetched = await getAccount(testAccount.subId);

  console.log('Final result:', created);
}

runTests();
