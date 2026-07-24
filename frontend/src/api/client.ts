const API_URL = import.meta.env.VITE_API_URL ?? 'http://54.166.173.26/:3000';
const HTTP_STATUS_NO_CONTENT = 204;

interface ApiErrorBody {
  message?: string | string[];
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message ?? `Request failed with status ${res.status}`);
  }

  if (res.status === HTTP_STATUS_NO_CONTENT) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
