import axios from 'axios'
import type { AxiosResponse, AxiosRequestConfig } from 'axios'

/**
 * Every request funnels its failures through here. The old fallback threw a
 * bare English "Unknown error", which surfaced verbatim in the UI — including
 * on the login screen, where it is the only thing the user has to go on.
 */
function toApiError(error: unknown): { status: number; message: string; data?: unknown } {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as { error?: string; message?: string } | undefined
      return {
        status: error.response.status,
        message: data?.message || data?.error || descripcionPorEstado(error.response.status),
        data: error.response.data,
      }
    }
    if (error.code === 'ECONNABORTED') {
      return { status: 408, message: 'El servidor tardó demasiado en responder. Intenta de nuevo.' }
    }
    // No response at all: offline, DNS, CORS or the API is down.
    return {
      status: 0,
      message: navigator.onLine
        ? 'No pudimos conectarnos con el servidor. Intenta de nuevo en un momento.'
        : 'Parece que no tienes conexión a internet.',
    }
  }
  return { status: 500, message: 'Ocurrió un error inesperado. Intenta de nuevo.' }
}

function descripcionPorEstado(status: number): string {
  if (status === 401) return 'Tu sesión expiró o las credenciales no son válidas.'
  if (status === 403) return 'No tienes permiso para hacer esto.'
  if (status === 404) return 'No encontramos lo que buscabas.'
  if (status === 409) return 'Ese registro cambió de estado. Actualiza y vuelve a intentar.'
  if (status === 413) return 'El archivo es demasiado pesado.'
  if (status === 429) return 'Demasiados intentos seguidos. Espera un momento.'
  if (status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
  return 'No pudimos completar la operación.'
}

class APIBase {
  private baseUrl: string
  private axiosInstance = axios.create()

  constructor() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const detected = origin.includes('testing-storybrand-frontend.bakano.ec')
      ? 'https://testing-storybrand-backapp.bakano.ec/api'
      : isLocalhost
        ? 'http://localhost:8101/api'
        : ''
    const raw = detected || (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
    const trimmed = raw.replace(/\/+$/, '')
    this.baseUrl = trimmed.endsWith('/api') || /\/api\//.test(trimmed)
      ? trimmed
      : `${trimmed}/api`
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.timeout = config.timeout || 15000
        return config
      },
      (error) => Promise.reject(error),
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:token-expired'))
        }
        return Promise.reject(error)
      },
    )
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const accessToken = localStorage.getItem('admin_token') || localStorage.getItem('access_token')
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    return headers
  }

  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.get<T>(url, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      throw toApiError(error)
    }
  }

  protected async post<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    const isFormData = data instanceof FormData
    const finalHeaders = headers || this.getHeaders()

    if (isFormData) {
      delete finalHeaders['Content-Type']
    }

    try {
      return await this.axiosInstance.post<T>(url, data, {
        headers: finalHeaders,
        ...config,
      })
    } catch (error: unknown) {
      throw toApiError(error)
    }
  }

  protected async put<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.put<T>(url, data, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      throw toApiError(error)
    }
  }

  protected async patch<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.patch<T>(url, data, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      throw toApiError(error)
    }
  }

  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.delete<T>(url, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      throw toApiError(error)
    }
  }
}

export default APIBase
export const http = new APIBase()
