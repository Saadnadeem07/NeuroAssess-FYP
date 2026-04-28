import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

interface ApiErrorPayload {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  requestId?: string;
  details?: unknown;
}

interface CustomAxiosInstance extends AxiosInstance {
  checkAuth: () => Promise<boolean>;
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // cookies carry both access + refresh tokens
  timeout: 30000,
}) as CustomAxiosInstance;

// Single-flight refresh to avoid stampedes when multiple requests hit 401 at once.
let refreshInFlight: Promise<boolean> | null = null;
const tryRefresh = async (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${apiUrl}/auth/refresh`, null, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error)
);

const PUBLIC_AUTH_PATHS = [
  "/auth/refresh",
  "/auth/patient/login",
  "/auth/psychiatrist/login",
  "/auth/admin/login",
  "/auth/patient/register",
  "/auth/psychiatrist/register",
];

const isPublicAuthPath = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some((p) => url.includes(p));

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      // Don't try to refresh on the auth endpoints themselves.
      if (!isPublicAuthPath(original.url)) {
        original._retried = true;
        const refreshed = await tryRefresh();
        if (refreshed) {
          return api.request(original);
        }
        // Refresh failed — emit a global event so the auth context can
        // clear state and route to login. Avoid window.location to keep SPA state.
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    if (!error.response && error.request) {
      error.message = navigator.onLine
        ? "Network error: unable to reach the server."
        : "You are offline. Please check your connection.";
    }
    return Promise.reject(error);
  }
);

api.checkAuth = async () => {
  try {
    const role = localStorage.getItem("currentRole");
    if (!role) return false;
    const response = await api.get(`/auth/${role}/me`);
    return Boolean(response.data?.success);
  } catch {
    return false;
  }
};

export default api;
