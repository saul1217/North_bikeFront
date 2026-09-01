import { ApiRequestError, type ApiErrorPayload } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";
const REQUEST_TIMEOUT_MS = 12_000;

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

function getErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (Array.isArray(payload?.message)) return payload.message.join(", ");
  return payload?.message || payload?.error || fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  const onAbort = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new ApiRequestError(
          "La API respondió con un formato no válido.",
          { kind: "invalid-json", status: response.status },
        );
      }
    }

    if (!response.ok) {
      throw new ApiRequestError(
        getErrorMessage(payload as ApiErrorPayload | null, `Error HTTP ${response.status}`),
        { kind: "http", status: response.status },
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("La solicitud tardó demasiado o fue cancelada.", {
        kind: "timeout",
      });
    }
    throw new ApiRequestError(
      "No fue posible conectar con North Bike. Verifica que la API esté disponible.",
      { kind: "network" },
    );
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
