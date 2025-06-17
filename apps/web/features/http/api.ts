import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("__session="),
  );

  if (!sessionCookie) return null;

  return sessionCookie.split("=")[1].trim();
}

api.interceptors.request.use(async (config) => {
  try {
    const token = getTokenFromCookie();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});
