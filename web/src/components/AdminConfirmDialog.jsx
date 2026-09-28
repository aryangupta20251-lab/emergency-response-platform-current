import { AlertTriangle, X } from 'lucide-react'
import Card from './Card'
import Button from './Button'

export default function AdminConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, loading = false }) {
  return <div className="modal-backdrop" role="presentation"><Card className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title"><button className="icon-button admin-dialog-close" type="button" onClick={onCancel} aria-label="Close confirmation"><X size={17} /></button><div className="delete-dialog__icon"><AlertTriangle size={22} /></div><h2 id="admin-confirm-title">{title}</h2><p>{message}</p><div className="report-actions"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div></Card></div>
}