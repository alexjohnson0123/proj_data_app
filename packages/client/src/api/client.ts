import { msalInstance, apiScopes } from "@/auth/msalConfig"

export async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const account = msalInstance.getAllAccounts()[0]
    const { accessToken } = await msalInstance.acquireTokenSilent({
        scopes: apiScopes,
        account
    })

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`
    }

    const res = await fetch(url, options)
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message || `Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
}
