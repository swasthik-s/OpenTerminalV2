export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  if (!path.startsWith("/api/")) throw new Error("API paths must begin with /api/");
  const response = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? `HTTP ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return apiGet<T>(path, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(path, { method: "DELETE", cache: "no-store" });
  if (!response.ok && response.status !== 204) throw new ApiError(`HTTP ${response.status}`, response.status);
}

export type Quote = {
  symbol: string;
  name: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  exchange: string | null;
  source: string;
};
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export function fmt(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
