const localApiBaseUrl = 'http://localhost:5000/api'

function getDevelopmentApiBaseUrl() {
  if (typeof window === 'undefined') return localApiBaseUrl

  const url = new URL(window.location.href)
  url.protocol = 'http:'
  url.port = '5000'
  url.pathname = '/api'
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configuredUrl && import.meta.env.PROD) {
    throw new Error('VITE_API_BASE_URL must be configured for production builds.')
  }
  const baseUrl = configuredUrl || (import.meta.env.DEV ? getDevelopmentApiBaseUrl() : localApiBaseUrl)

  let parsedUrl
  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid absolute HTTP(S) URL.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)
    || parsedUrl.username
    || parsedUrl.password
    || parsedUrl.search
    || parsedUrl.hash) {
    throw new Error('VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query, or fragment.')
  }

  return parsedUrl.toString().replace(/\/+$/, '')
}

export function getSocketBaseUrl() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '')
}
