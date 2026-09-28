import { Bell, ChevronRight, LockKeyhole, Palette, Settings as SettingsIcon, ShieldCheck, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Card from '../components/Card'

const themeStorageKey = 'emergency-response-theme'
const accentStorageKey = 'emergency-response-accent'
const settingsStorageKey = 'emergency-response-settings'

const defaultSettings = {
  notifications: true,
  incidentUpdates: true,
  sound: false,
}

const accentOptions = [
  { value: 'cyan', label: 'Cyan pulse' },
  { value: 'violet', label: 'Violet drift' },
  { value: 'emerald', label: 'Emerald beam' },
  { value: 'rose', label: 'Rose glow' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsStorageKey) || 'null')
      return { ...defaultSettings, ...(saved || {}) }
    } catch {
      return { ...defaultSettings }
    }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem(themeStorageKey) || 'system')
  const [accent, setAccent] = useState(() => localStorage.getItem(accentStorageKey) || 'cyan')

  useEffect(() => {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem(themeStorageKey, theme)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [theme])

  useEffect(() => {
    const palette = {
      cyan: { primary: '#60a5fa', secondary: '#34d399', glow: 'rgba(96,165,250,0.38)' },
      violet: { primary: '#8b5cf6', secondary: '#22d3ee', glow: 'rgba(139,92,246,0.38)' },
      emerald: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52,211,153,0.35)' },
      rose: { primary: '#fb7185', secondary: '#f59e0b', glow: 'rgba(251,113,133,0.35)' },
    }[accent] || { primary: '#60a5fa', secondary: '#34d399', glow: 'rgba(96,165,250,0.38)' }

    localStorage.setItem(accentStorageKey, accent)
    document.documentElement.style.setProperty('--color-primary', palette.primary)
    document.documentElement.style.setProperty('--color-secondary', palette.secondary)
    document.documentElement.style.setProperty('--shadow-button', `0 12px 24px ${palette.glow}`)
    document.documentElement.style.setProperty('--color-primary-soft', `${palette.primary}22`)
  }, [accent])

  const toggle = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }))
  return <div className="page-content settings-page"><div className="page-header"><div><span className="eyebrow"><SettingsIcon size={14} /> Preferences</span><h1 className="page-title">Settings</h1><p className="page-subtitle">Shape the platform around your workflow and visual style.</p></div></div><div className="settings-grid"><Card><div className="settings-section-heading"><Bell size={18} /><div><h2>Notifications</h2><p>Choose which updates you see in the app.</p></div></div><SettingToggle icon={Bell} label="In-app notifications" detail="Show updates in the notification list" checked={settings.notifications} onChange={() => toggle('notifications')} /><SettingToggle icon={ShieldCheck} label="Incident updates" detail="Receive updates about incident status changes" checked={settings.incidentUpdates} onChange={() => toggle('incidentUpdates')} /><SettingToggle icon={Volume2} label="Sound cues" detail="Play sound for future in-app alerts" checked={settings.sound} onChange={() => toggle('sound')} /></Card><Card><div className="settings-section-heading"><Palette size={18} /><div><h2>Appearance</h2><p>Choose the color mode and accent you prefer.</p></div></div><div className="settings-choice"><span><strong>Theme</strong><small>{theme === 'dark' ? 'Dark theme active' : theme === 'light' ? 'Light theme active' : 'System theme active'}</small></span><select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme preference"><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></div><div className="settings-choice settings-choice--stack"><span><strong>Profile accent</strong><small>Customize your app highlight colors</small></span><div className="settings-accent-row">{accentOptions.map((option) => <button key={option.value} type="button" className={`settings-accent ${accent === option.value ? 'settings-accent--active' : ''}`} onClick={() => setAccent(option.value)} aria-label={option.label}><span style={{ background: option.value === 'cyan' ? '#60a5fa' : option.value === 'violet' ? '#8b5cf6' : option.value === 'emerald' ? '#34d399' : '#fb7185' }} /></button>)}</div></div></Card><Card><div className="settings-section-heading"><LockKeyhole size={18} /><div><h2>Account & security</h2><p>Keep your profile and protected actions under your control.</p></div></div><button className="settings-link" type="button"><span><strong>Password</strong><small>Update your sign-in details from the account controls</small></span><ChevronRight size={17} /></button><button className="settings-link" type="button"><span><strong>Privacy</strong><small>Review the data shared with your trusted contacts</small></span><ChevronRight size={17} /></button></Card></div></div>
}

function SettingToggle({ icon: Icon, label, detail, checked, onChange }) { return <label className="setting-toggle"><span className="setting-toggle__icon"><Icon size={16} /></span><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={onChange} /><span className="toggle-track" aria-hidden="true"><span /></span></label> }