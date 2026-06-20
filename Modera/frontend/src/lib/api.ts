const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_BASE_URL = rawApiUrl.replace(/\/$/, "");

export function apiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
