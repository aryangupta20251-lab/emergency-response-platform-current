const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

async function request(path, body) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('The account service is unavailable. Check that the backend is running.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The account service returned an unreadable response.')
  }
  if (!response.ok) throw new Error(result.message || 'The account request could not be completed.')
  return result
}

export const authService = {
  async login({ identifier, password }) {
    if (typeof identifier !== 'string' || !identifier.trim()
      || typeof password !== 'string' || password.length < 6) {
      throw new Error('Enter a valid email or phone number and a password with at least 6 characters.')
    }

    const result = await request('/auth/login', { identifier: identifier.trim(), password })
    return { user: result.user, token: result.token }
  },

  async register({ name, identifier, password }) {
    if (typeof name !== 'string' || name.trim().length < 2
      || typeof identifier !== 'string' || !identifier.trim()
      || typeof password !== 'string' || password.length < 6) {
      throw new Error('Enter your name, a valid email or phone number, and a password with at least 6 characters.')
    }

    await request('/auth/register', {
      name: name.trim(),
      identifier: identifier.trim(),
      password,
    })
    return authService.login({ identifier, password })
  },

  async requestPasswordReset(identifier) {
    if (!identifier.trim()) throw new Error('Enter the email or phone number linked to your account.')
    return { identifier: identifier.trim().toLowerCase() }
  },

  async resetPassword({ password, confirmPassword }) {
    if (password.length < 6) throw new Error('Your new password must be at least 6 characters.')
    if (password !== confirmPassword) throw new Error('Passwords do not match.')
    return true
  }
}