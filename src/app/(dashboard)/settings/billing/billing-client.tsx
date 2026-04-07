'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileText, KeyRound, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { Plan } from '@/lib/plans'

type Invoice = {
  id: string
  invoice_number: string
  plan: string
  amount_gross: number
  status: string
  created_at: string
  paid_at: string | null
}

type Props = {
  currentPlan: string
  orgName: string
  subscriptionStatus: string | null
  plans: Plan[]
  invoices: Invoice[]
}

const planLabel: Record<string, string> = {
  free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise',
}

export default function BillingClient({ currentPlan, orgName, subscriptionStatus, plans, invoices }: Props) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Rechnungsformular
  const [billingName, setBillingName] = useState(orgName)
  const [billingStreet, setBillingStreet] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingCountry, setBillingCountry] = useState('Deutschland')
  const [billingVatId, setBillingVatId] = useState('')

  // Aktivierungscode
  const [activationCode, setActivationCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  async function handleCreateInvoice() {
    if (!selectedPlan) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          billing_name: billingName,
          billing_street: billingStreet,
          billing_city: billingCity,
          billing_country: billingCountry,
          billing_vat_id: billingVatId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowInvoiceForm(false)
      router.push(`/settings/billing/invoice/${data.invoice.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleActivateCode() {
    if (!activationCode.trim()) return
    setCodeLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/activate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Plan „${planLabel[data.plan] ?? data.plan}" erfolgreich aktiviert!`)
      setActivationCode('')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCodeLoading(false)
    }
  }

  const paidPlans = plans.filter(p => p.id !== 'free')

  return (
    <div style={{ padding: '24px 16px', maxWidth: 600, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#003366', margin: '0 0 4px' }}>Abonnement</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
        Aktueller Plan: <strong>{planLabel[currentPlan] ?? currentPlan}</strong>
        {subscriptionStatus === 'active' && currentPlan !== 'free' && (
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px',
            borderRadius: 20, backgroundColor: '#00994433', color: '#006622',
          }}>Aktiv</span>
        )}
      </p>

      {success && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, color: '#166534', fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Check size={16} /> {success}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Plan-Auswahl */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
          Plan wählen
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paidPlans.map(plan => {
            const isSelected = selectedPlan === plan.id
            const isCurrent = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                onClick={() => { setSelectedPlan(plan.id); setShowInvoiceForm(false) }}
                style={{
                  border: `2px solid ${isSelected ? '#0099cc' : plan.highlighted ? '#003366' : '#c8d4e8'}`,
                  borderRadius: 14, padding: '16px', cursor: 'pointer',
                  background: isSelected ? '#f0f9ff' : 'white',
                  position: 'relative',
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute', top: -10, right: 16,
                    background: '#003366', color: 'white',
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  }}>EMPFOHLEN</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#003366' }}>{plan.name}</span>
                      {isCurrent && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 7px',
                          borderRadius: 20, backgroundColor: '#0099cc22', color: '#0099cc',
                        }}>Aktuell</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>{plan.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {plan.features.slice(0, 3).map(f => (
                        <span key={f} style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Check size={10} color="#0099cc" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#003366' }}>{plan.price_net} €</div>
                    <div style={{ fontSize: 10, color: '#888' }}>zzgl. MwSt./Monat</div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #c8d4e8' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setShowInvoiceForm(v => !v) }}
                      style={{
                        width: '100%', padding: '10px 12px',
                        background: '#003366', color: 'white',
                        border: 'none', borderRadius: 10, cursor: 'pointer',
                        fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <FileText size={14} />
                      Rechnung erstellen
                      {showInvoiceForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rechnungsformular */}
      {showInvoiceForm && selectedPlan && (
        <div style={{
          background: '#f8faff', border: '1px solid #c8d4e8', borderRadius: 14,
          padding: '20px', marginBottom: 24,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: '0 0 14px' }}>
            Rechnungsadresse
          </p>
          {[
            { label: 'Name / Firma *', value: billingName, set: setBillingName, placeholder: 'Inomet GmbH' },
            { label: 'Straße & Hausnummer', value: billingStreet, set: setBillingStreet, placeholder: 'Musterstraße 1' },
            { label: 'PLZ & Ort', value: billingCity, set: setBillingCity, placeholder: '70184 Stuttgart' },
            { label: 'Land', value: billingCountry, set: setBillingCountry, placeholder: 'Deutschland' },
            { label: 'USt-ID (optional)', value: billingVatId, set: setBillingVatId, placeholder: 'DE123456789' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4 }}>
                {f.label}
              </label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #c8d4e8', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'Arial, sans-serif',
                }}
              />
            </div>
          ))}
          <button
            onClick={handleCreateInvoice}
            disabled={loading || !billingName.trim()}
            style={{
              width: '100%', padding: '11px', marginTop: 4,
              background: '#003366', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!billingName.trim() || loading) ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
            Rechnung erstellen & anzeigen
          </button>
          <p style={{ fontSize: 11, color: '#888', margin: '8px 0 0', textAlign: 'center' }}>
            Nach Überweisung erhalten Sie Ihren 9-stelligen Aktivierungscode per E-Mail.
          </p>
        </div>
      )}

      {/* Aktivierungscode */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
          Aktivierungscode einlösen
        </p>
        <div style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                value={activationCode}
                onChange={e => setActivationCode(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9-stelliger Code"
                maxLength={9}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #c8d4e8', fontSize: 16, letterSpacing: '0.15em',
                  fontFamily: 'monospace', boxSizing: 'border-box', textAlign: 'center',
                }}
              />
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0', textAlign: 'center' }}>
                Den Code finden Sie auf Ihrer bezahlten Rechnung.
              </p>
            </div>
            <button
              onClick={handleActivateCode}
              disabled={activationCode.length !== 9 || codeLoading}
              style={{
                padding: '10px 16px', background: '#0099cc', color: 'white',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: (activationCode.length !== 9 || codeLoading) ? 0.5 : 1,
              }}
            >
              {codeLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={14} />}
              Aktivieren
            </button>
          </div>
        </div>
      </div>

      {/* Rechnungshistorie */}
      {invoices.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
            Rechnungshistorie
          </p>
          <div style={{ background: 'white', border: '1px solid #c8d4e8', borderRadius: 14, overflow: 'hidden' }}>
            {invoices.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <div style={{ height: 1, background: '#c8d4e8', margin: '0 16px' }} />}
                <a href={`/settings/billing/invoice/${inv.id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', textDecoration: 'none', color: 'inherit',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#003366' }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {planLabel[inv.plan] ?? inv.plan} · {new Date(inv.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{inv.amount_gross.toFixed(2)} €</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      backgroundColor: inv.status === 'paid' ? '#dcfce7' : inv.status === 'cancelled' ? '#fee2e2' : '#fef9c3',
                      color: inv.status === 'paid' ? '#166534' : inv.status === 'cancelled' ? '#991b1b' : '#854d0e',
                    }}>
                      {inv.status === 'paid' ? 'Bezahlt' : inv.status === 'cancelled' ? 'Storniert' : 'Ausstehend'}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
