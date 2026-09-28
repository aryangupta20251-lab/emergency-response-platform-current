import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import DashboardPage from '../pages/DashboardPage'
import ProtectedRoute from '../components/ProtectedRoute'
import ReportAccidentPage from '../pages/ReportAccidentPage'
import ReportLocationPage from '../pages/ReportLocationPage'
import ReportInformationPage from '../pages/ReportInformationPage'
import ReportReviewPage from '../pages/ReportReviewPage'
import IncidentsPage from '../pages/IncidentsPage'
import IncidentDetailPage from '../pages/IncidentDetailPage'
import HospitalsPage from '../pages/HospitalsPage'
import HospitalDetailPage from '../pages/HospitalDetailPage'
import NotificationsPage from '../pages/NotificationsPage'
import NotificationDetailPage from '../pages/NotificationDetailPage'
import ContactsPage from '../pages/ContactsPage'
import ProfilePage from '../pages/ProfilePage'
import SettingsPage from '../pages/SettingsPage'
import ResponderLayout from '../components/ResponderLayout'
import ResponderDashboardPage from '../pages/ResponderDashboardPage'
import ResponderIncidentPage from '../pages/ResponderIncidentPage'
import AdminLayout from '../components/AdminLayout'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminIncidentsPage from '../pages/AdminIncidentsPage'
import AdminRespondersPage from '../pages/AdminRespondersPage'
import AdminHospitalsPage from '../pages/AdminHospitalsPage'
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage'
import AdminAuditPage from '../pages/AdminAuditPage'
import AdminReportsPage from '../pages/AdminReportsPage'

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<ResponderLayout />}>
        <Route path="/responder" element={<ResponderDashboardPage />} />
        <Route path="/responder/incident/:incidentId" element={<ResponderIncidentPage />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
        <Route path="/admin/responders" element={<AdminRespondersPage />} />
        <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/audit-log" element={<AdminAuditPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>
      <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/report-accident" element={<ReportAccidentPage />} />
      <Route path="/report-accident/location" element={<ReportLocationPage />} />
      <Route path="/report-accident/information" element={<ReportInformationPage />} />
      <Route path="/report-accident/review" element={<ReportReviewPage />} />
      <Route path="/incidents" element={<IncidentsPage />} />
      <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
      <Route path="/hospitals" element={<HospitalsPage />} />
      <Route path="/hospitals/:hospitalId" element={<HospitalDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/notifications/:notificationId" element={<NotificationDetailPage />} />
      <Route path="/emergency-contacts" element={<ContactsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Route>
  </Routes>
}
