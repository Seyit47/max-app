import type {
  AccountSettingsResponse,
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  ReadChatResponse,
  ReceivedNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types'

/** status 0 means the request never got an HTTP response (network, CORS, DNS, client timeout). */
export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }

  get isNetwork(): boolean {
    return this.status === 0
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403
  }

  /** receiveNotification refuses to work while the instance has a webhookUrl configured. */
  get isWebhookConflict(): boolean {
    return this.status === 400 && /webhook\s*url/i.test(this.message)
  }
}

/** GREEN-API hosts are sharded by the first 4 digits of idInstance. */
export function defaultApiUrl(idInstance: string): string {
  return idInstance.length >= 4 ? `https://${idInstance.slice(0, 4)}.api.green-api.com` : ''
}

// Extra time on top of receiveTimeout before we give up on a hung long-poll.
const LONG_POLL_GRACE_MS = 15_000
const DEFAULT_TIMEOUT_MS = 30_000

interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number>
  pathSuffix?: string
  signal?: AbortSignal
  timeoutMs?: number
}

export function createClient(creds: Credentials) {
  const base = creds.apiUrl.trim().replace(/\/+$/, '')

  async function request<T>(
    method: string,
    httpMethod: 'GET' | 'POST' | 'DELETE',
    opts: RequestOptions = {},
  ): Promise<T | null> {
    let url = `${base}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}`
    if (opts.pathSuffix) url += `/${encodeURIComponent(opts.pathSuffix)}`
    if (opts.query) {
      const qs = new URLSearchParams(
        Object.entries(opts.query).map(([k, v]) => [k, String(v)]),
      )
      url += `?${qs}`
    }

    const timeout = AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout

    let res: Response
    try {
      res = await fetch(url, {
        method: httpMethod,
        headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal,
      })
    } catch (err) {
      // Caller-initiated abort propagates as-is so loops can exit quietly.
      if (opts.signal?.aborted) throw err
      if (timeout.aborted) throw new GreenApiError(0, 'Request timed out')
      throw new GreenApiError(0, 'Network error: check the API URL and your connection')
    }

    const text = await res.text().catch(() => '')

    if (!res.ok) {
      throw new GreenApiError(res.status, extractErrorMessage(text) || res.statusText || `HTTP ${res.status}`)
    }

    if (!text.trim()) return null
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      throw new GreenApiError(res.status, 'Unexpected response from GREEN-API')
    }

    // Some methods (e.g. checkAccount) report failures as 200 + { status: false, reason }.
    if (isRecord(data) && data.status === false && typeof data.reason === 'string') {
      throw new GreenApiError(400, data.reason)
    }
    return data as T | null
  }

  return {
    async getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse> {
      const data = await request<StateInstanceResponse>('getStateInstance', 'GET', { signal })
      if (!data) throw new GreenApiError(0, 'Empty response from getStateInstance')
      return data
    },

    /** Details of the MAX account the instance is signed in with (phone, own chatId). */
    async getAccountSettings(signal?: AbortSignal): Promise<AccountSettingsResponse> {
      const data = await request<AccountSettingsResponse>('getAccountSettings', 'GET', { signal })
      if (!data) throw new GreenApiError(0, 'Empty response from getAccountSettings')
      return data
    },

    async checkAccount(phoneNumber: number, signal?: AbortSignal): Promise<CheckAccountResponse> {
      const data = await request<CheckAccountResponse>('checkAccount', 'POST', {
        body: { phoneNumber },
        signal,
      })
      if (!data) throw new GreenApiError(0, 'Empty response from checkAccount')
      return data
    },

    async sendMessage(chatId: string, message: string, signal?: AbortSignal): Promise<SendMessageResponse> {
      const data = await request<SendMessageResponse>('sendMessage', 'POST', {
        body: { chatId, message },
        signal,
      })
      if (!data?.idMessage) throw new GreenApiError(0, 'Empty response from sendMessage')
      return data
    },

    /** Marks messages in a chat read: idMessage and everything before it, or the whole chat if omitted. */
    async readChat(chatId: string, idMessage?: string, signal?: AbortSignal): Promise<ReadChatResponse> {
      const data = await request<ReadChatResponse>('readChat', 'POST', {
        body: idMessage ? { chatId, idMessage } : { chatId },
        signal,
      })
      return data ?? { setRead: false }
    },

    /** Long-polls the queue. Resolves to null when the timeout elapses with nothing queued. */
    async receiveNotification(receiveTimeout = 20, signal?: AbortSignal): Promise<ReceivedNotification | null> {
      const data = await request<ReceivedNotification>('receiveNotification', 'GET', {
        query: { receiveTimeout },
        signal,
        timeoutMs: receiveTimeout * 1000 + LONG_POLL_GRACE_MS,
      })
      return data && typeof data.receiptId === 'number' ? data : null
    },

    async deleteNotification(receiptId: number, signal?: AbortSignal): Promise<DeleteNotificationResponse> {
      const data = await request<DeleteNotificationResponse>('deleteNotification', 'DELETE', {
        pathSuffix: String(receiptId),
        signal,
      })
      return data ?? { result: false }
    },
  }
}

export type GreenApiClient = ReturnType<typeof createClient>

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function extractErrorMessage(text: string): string {
  if (!text) return ''
  try {
    const data: unknown = JSON.parse(text)
    if (isRecord(data)) {
      for (const key of ['message', 'reason', 'error']) {
        if (typeof data[key] === 'string' && data[key]) return data[key]
      }
    }
  } catch {
    // Not JSON; fall through to raw text.
  }
  return text.slice(0, 300)
}
