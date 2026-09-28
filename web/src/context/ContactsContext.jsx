import { createContext, useCallback, useContext, useState } from 'react'
import { initialContacts } from '../data/contactData'

const ContactsContext = createContext(null)

export function ContactsProvider({ children }) {
  const [contacts, setContacts] = useState(initialContacts)
  const addContact = useCallback((contact) => setContacts((current) => [...current, { ...contact, id: `contact-${Date.now()}` }]), [])
  const updateContact = useCallback((id, updates) => setContacts((current) => current.map((contact) => contact.id === id ? { ...contact, ...updates } : contact)), [])
  const deleteContact = useCallback((id) => setContacts((current) => current.filter((contact) => contact.id !== id)), [])
  return <ContactsContext.Provider value={{ contacts, addContact, updateContact, deleteContact }}>{children}</ContactsContext.Provider>
}

export function useContacts() {
  const context = useContext(ContactsContext)
  if (!context) throw new Error('useContacts must be used inside ContactsProvider')
  return context
}