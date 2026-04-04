/**
 * Central API helper.
 *
 * In development the Vite proxy rewrites /api → http://localhost:3000,
 * so we keep relative URLs.  In production (Vercel) there is no proxy,
 * so we need the absolute Railway backend URL from VITE_API_BASE_URL.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export function apiUrl(path: string): string {
  // Ensure we never double-up slashes
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const p    = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  token?: string | null;
  body?: any; // Allow objects for automatic JSON stringification
};

/**
 * Thin wrapper around fetch() that:
 *  - Resolves the URL via apiUrl()
 *  - Attaches Authorization header when token is supplied
 *  - Sets Content-Type: application/json when body is an object
 */
export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { token, headers: extraHeaders, body, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-serialise plain-object bodies
  let serialisedBody: BodyInit | null | undefined = body as BodyInit | null | undefined;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
    serialisedBody = JSON.stringify(body);
  }

  return fetch(apiUrl(path), {
    ...rest,
    headers,
    body: serialisedBody,
  });
}
