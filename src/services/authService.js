import API_BASE_URL from '../constants/api';

async function loginUser({mobileNumber, email, password}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({mobileNumber, email, password}),
    });
  } catch (error) {
    throw new Error(
      `Cannot reach the login server at ${API_BASE_URL}. Start the backend on port 5002 and try again.`,
    );
  }

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('The login server returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to sign in');
  }

  return payload;
}

export default loginUser;
