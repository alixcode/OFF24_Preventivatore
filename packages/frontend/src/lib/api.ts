const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("off24_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Errore ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  dashboard: {
    kpi: () => request<any>("/dashboard/kpi"),
  },
  quotes: {
    list: (params?: { status?: string; page?: number }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request<any>(`/quotes${qs ? "?" + qs : ""}`);
    },
    get: (id: string) => request<any>(`/quotes/${id}`),
    create: (data: any) => request<any>("/quotes", { method: "POST", body: JSON.stringify(data) }),
    newVersion: (id: string, data: any) =>
      request<any>(`/quotes/${id}/version`, { method: "POST", body: JSON.stringify(data) }),
    downloadPdf: async (id: string): Promise<void> => {
      const token = getToken();
      const res = await fetch(`${BASE}/quotes/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Errore generazione PDF");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `preventivo_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
  materials: {
    list: () => request<any[]>("/materials"),
    updatePrice: (id: string, data: { price: number; notes?: string }) =>
      request<any>(`/materials/${id}/price`, { method: "PUT", body: JSON.stringify(data) }),
  },
  clients: {
    list: () => request<any[]>("/clients"),
    create: (data: any) => request<any>("/clients", { method: "POST", body: JSON.stringify(data) }),
  },
};
