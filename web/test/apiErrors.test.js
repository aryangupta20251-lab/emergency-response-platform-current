import assert from 'node:assert/strict'
import { test } from 'node:test'
import { notifySessionExpired, throwForApiError } from '../src/services/apiErrors.js'

test('authenticated API errors report expired sessions and server failures clearly', async (context) => {
  await context.test('401 expires the local session and asks the user to sign in', () => {
    const events = []
    const originalWindow = globalThis.window
    globalThis.window = { dispatchEvent: (event) => events.push(event.type) }

    try {
      assert.throws(
        () => throwForApiError({ status: 401, ok: false }, {}, 'Request failed.'),
        /session has expired/i,
      )
      assert.deepEqual(events, ['emergency-response:session-expired'])
    } finally {
      if (originalWindow === undefined) delete globalThis.window
      else globalThis.window = originalWindow
    }
  })

  await context.test('server failures do not expose internal response details', () => {
    assert.throws(
      () => throwForApiError({ status: 500, ok: false }, { message: 'database password leaked' }, 'Request failed.'),
      /^Error: The server encountered an error\. Please try again\.$/,
    )
  })

  await context.test('ordinary client errors preserve the backend validation message', () => {
    assert.throws(
      () => throwForApiError({ status: 400, ok: false }, { message: 'Select a valid location.' }, 'Request failed.'),
      /Select a valid location\./,
    )
  })
})

test('session expiry notifications are safe when no browser is present', () => {
  const originalWindow = globalThis.window
  try {
    delete globalThis.window
    assert.doesNotThrow(notifySessionExpired)
  } finally {
    if (originalWindow !== undefined) globalThis.window = originalWindow
  }
})
