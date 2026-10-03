import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let mapsLibraryPromise
let authFailure = false
let authHandlerInstalled = false
const authFailureListeners = new Set()

function notifyAuthFailure() {
  authFailure = true
  authFailureListeners.forEach((listener) => listener())
}

function installAuthFailureHandler() {
  if (authHandlerInstalled || typeof window === 'undefined') return
  const previousHandler = window.gm_authFailure
  window.gm_authFailure = () => {
    notifyAuthFailure()
    if (typeof previousHandler === 'function') previousHandler()
  }
  authHandlerInstalled = true
}

export function subscribeToGoogleMapsAuthFailure(listener) {
  authFailureListeners.add(listener)
  if (authFailure) listener()
  return () => authFailureListeners.delete(listener)
}

export function getGoogleMapsAuthFailure() {
  return authFailure
}

export function loadGoogleMaps() {
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) {
    const error = new Error('Set VITE_GOOGLE_MAPS_API_KEY to load Google Maps.')
    error.code = 'GOOGLE_MAPS_KEY_MISSING'
    return Promise.reject(error)
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in a browser.'))
  }

  installAuthFailureHandler()
  if (!mapsLibraryPromise) {
    try {
      setOptions({ key: apiKey, v: 'weekly' })
      mapsLibraryPromise = importLibrary('maps')
    } catch (error) {
      mapsLibraryPromise = Promise.reject(error)
    }
  }

  return mapsLibraryPromise
}
