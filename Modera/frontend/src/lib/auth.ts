import { apiUrl } from "@/lib/api";

export function clearAuth() {
  localStorage.removeItem("token");
}

export function handleAuthFailure(router: { push: (path: string) => void }, message?: string) {
  clearAuth();
  if (message) {
    console.error(message);
  }
  router.push("/login");
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(input), {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearAuth();
  }

  return response;
}
