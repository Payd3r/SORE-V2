import { getCookie } from './cookies';

interface FetchOptions extends RequestInit {
  // You can add custom options here if needed
}

export async function customFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const csrfToken = getCookie('csrf-token');

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // You can handle errors globally here
    console.error('API request failed:', response);
  }

  return response;
}

export const getMemoryById = async (id: string) => {
  const response = await fetch(`/api/memories/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Errore nel recupero del ricordo' }));
    throw new Error(errorData.message || 'Errore sconosciuto');
  }
  return response.json();
}; 