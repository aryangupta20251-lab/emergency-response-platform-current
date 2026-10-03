export const sessionExpiredEvent = 'emergency-response:session-expired'

export function notifySessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(sessionExpiredEvent))
  }
}

export function throwForApiError(response, result, fallbackMessage) {
  if (response.status === 401) {
    notifySessionExpired()
    throw new Error('Your session has expired. Please log in again.')
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error('The server encountered an error. Please try again.')
    }
    throw new Error(result?.message || fallbackMessage)
  }
}
