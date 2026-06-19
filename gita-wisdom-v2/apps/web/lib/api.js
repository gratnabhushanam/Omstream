const API_BASE = process.env.NEXT_PUBLIC_API_BASE ? process.env.NEXT_PUBLIC_API_BASE.trim().replace(/\/+$/, '') : '';

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export async function apiGet(path, token) {
  const response = await fetch(buildUrl(path), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function apiPost(path, body, token) {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function apiPut(path, body, token) {
  const response = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function apiDelete(path, token) {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export { API_BASE };
