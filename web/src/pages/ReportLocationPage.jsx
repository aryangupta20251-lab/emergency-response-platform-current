import { CheckCircle2, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import MapContainer from '../components/MapContainer'
import ReportShell from '../components/ReportShell'
import { useAccidentReport } from '../context/AccidentReportContext'

export default function ReportLocationPage() {
  const navigate = useNavigate()
  const { report, updateReport, requestLocation } = useAccidentReport()
  const locationReady = report.locationState === 'available' && Boolean(report.location)
  const cancel = () => { updateReport({ location: null, locationState: 'permission-required' }); navigate('/dashboard') }
  return (
    <ReportShell activeStep={1} onCancel={cancel}>
      <Card className="report-card">
        <div className="card-heading">
          <div><span className="muted-label">Step 2 of 4</span><h2 className="report-card-title">Confirm accident location</h2></div>
          <MapPin color="var(--color-primary)" size={22} />
        </div>
        <p className="report-copy">Your browser asks for location permission only when you choose to share it. Location is not tracked continuously.</p>
        <MapContainer
          locationState={report.locationState}
          userLocation={report.location}
          center={report.location ? [report.location.latitude, report.location.longitude] : undefined}
          onRequestLocation={requestLocation}
          onSelectLocation={({ latitude, longitude }) => updateReport({
            locationState: 'available',
            locationError: '',
            location: {
              name: 'Selected map point',
              source: 'Selected on Google Maps',
              latitude,
              longitude,
            },
          })}
        />
        <div className="location-choice">
          {locationReady ? <><CheckCircle2 size={18} /><span><strong>{report.location.name}</strong><small>{report.location.source}{report.location.source === 'Selected on Google Maps' ? ` · ${report.location.latitude.toFixed(5)}, ${report.location.longitude.toFixed(5)}` : ''}</small></span></> : <><MapPin size={18} /><span><strong>{report.locationState === 'loading' ? 'Finding location...' : 'Location not selected'}</strong><small>{report.locationError || 'Use the location control or select a point directly on the map.'}</small></span></>}
        </div>
        {report.locationError && <Alert tone="info" title="Location unavailable">{report.locationError}</Alert>}
      </Card>
      <Alert tone="info" title="Your privacy matters">Your browser location is used only after you request it. Location and report details are sent to this platform only when you submit; official emergency services are not contacted.</Alert>
      <div className="report-actions">
        <Button variant="ghost" onClick={() => navigate('/report-accident')}>Back</Button>
        <Button disabled={!locationReady} onClick={() => navigate('/report-accident/information')}>Continue <ArrowRightIcon /></Button>
      </div>
    </ReportShell>
  )
}

function ArrowRightIcon() { return <span aria-hidden="true">→</span> }