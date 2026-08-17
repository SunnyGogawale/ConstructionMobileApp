import API_BASE_URL from '../constants/api';

async function loginUser({mobileNumber, email, password}) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({mobileNumber, email, password}),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to sign in');
  }

  return payload;
}

export default loginUser;
