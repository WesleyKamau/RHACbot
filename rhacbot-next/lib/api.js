const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api';
const API_URL = `${API_BASE}${API_PREFIX}`;

export async function healthCheck() {
  try {
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (error) {
    console.warn('Health check failed:', error);
    return { status: 500, data: { error: 'Health check failed' } };
  }
}

export async function getBuildings() {
  const res = await fetch('/data/buildings.json');
  if (!res.ok) throw new Error('Failed to load buildings');
  return res.json();
}

export async function addChat(payload) {
  const res = await fetch(`${API_URL}/chats/add`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function sendMessage(formData) {
  const res = await fetch(`${API_URL}/messages/send`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function authenticate(password) {
  const res = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
