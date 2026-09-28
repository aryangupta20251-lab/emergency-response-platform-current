import { createContext, useCallback, useContext, useState } from 'react'
import { useAuth } from './AuthContext'
import { accidentReportService } from '../services/accidentReportService'

const initialReport = {
  location: null,
  locationState: 'permission-required',
  locationError: '',
  accidentType: '',
  peopleInvolved: '',
  injuries: '',
  vehicles: '',
  description: '',
  submittedReport: null
}

const AccidentReportContext = createContext(null)

export function AccidentReportProvider({ children }) {
  const [report, setReport] = useState(initialReport)
  const { token } = useAuth()

  const updateReport = useCallback((updates) => setReport((current) => ({ ...current, ...updates })), [])
  const resetReport = useCallback(() => setReport(initialReport), [])
  const requestLocation = useCallback(() => {
    setReport((current) => ({ ...current, locationState: 'loading', locationError: '' }))
    if (!navigator.geolocation) {
      setReport((current) => ({ ...current, locationState: 'unavailable', locationError: 'This browser does not support location access.' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setReport((current) => ({
        ...current,
        locationState: 'available',
        locationError: '',
        location: {
          name: 'Current device location',
          source: 'Browser location permission',
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      })),
      (error) => setReport((current) => ({
        ...current,
        locationState: 'unavailable',
        locationError: error.code === error.PERMISSION_DENIED
          ? 'Location permission was not granted. You can continue without sharing your location.'
          : 'Your location could not be determined. You can retry or continue without it.',
      })),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    )
  }, [])
  const submitReport = useCallback(async () => {
    const submittedReport = await accidentReportService.submit(report, token)
    setReport((current) => ({ ...current, submittedReport }))
    return submittedReport
  }, [report, token])

  return <AccidentReportContext.Provider value={{ report, updateReport, resetReport, requestLocation, submitReport }}>{children}</AccidentReportContext.Provider>
}

export function useAccidentReport() {
  const context = useContext(AccidentReportContext)
  if (!context) throw new Error('useAccidentReport must be used inside AccidentReportProvider')
  return context
}