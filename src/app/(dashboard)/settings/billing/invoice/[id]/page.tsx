import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SELLER } from '@/lib/plans'
import { getTranslations } from 'next-intl/server'
import { PrintButton } from './print-button'

type InvoiceRow = {
  id: string
  organization_id: string
  invoice_number: string
  plan: string
  amount_net: number
  vat_rate: number
  amount_vat: number
  amount_gross: number
  status: string
  activation_code: string | null
  billing_name: string
  billing_street: string | null
  billing_city: string | null
  billing_country: string | null
  billing_vat_id: string | null
  paid_at: string | null
  created_at: string
}

function planLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise',
  }
  return labels[plan] ?? plan
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('invoice')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoice } = await (supabase as any)
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single() as { data: InvoiceRow | null }

  if (!invoice) notFound()

  const issueDate = new Date(invoice.created_at)
  const dueDateObj = new Date(issueDate)
  dueDateObj.setDate(dueDateObj.getDate() + 14)

  const formatDate = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const statusColor = invoice.status === 'paid' ? '#166534' : invoice.status === 'cancelled' ? '#991b1b' : '#854d0e'
  const statusLabel = invoice.status === 'paid' ? t('statusPaid') : invoice.status === 'cancelled' ? t('statusCancelled') : t('statusPending')

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      {/* Print / Back button */}
      <div className="no-print" style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--ds-border)' }}>
        <a href="/settings/billing" style={{ fontSize: 13, color: '#003366', textDecoration: 'none', fontWeight: 700 }}>
          ← {t('back')}
        </a>
        <PrintButton />
      </div>

      {/* Invoice document */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 40px 60px', background: 'var(--ds-surface)', color: 'var(--ds-text)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#003366', letterSpacing: 1 }}>INO</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t('companyTag')}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#333', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{SELLER.name}</div>
            <div>{SELLER.street}</div>
            <div>{SELLER.city}</div>
            <div>{SELLER.country}</div>
            <div>{t('vatId')}: {SELLER.vat_id}</div>
            <div>{t('taxNumber')}: {SELLER.tax_number}</div>
          </div>
        </div>

        {/* Recipient + Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, gap: 40 }}>
          <div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('recipient')}</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700 }}>{invoice.billing_name}</div>
              {invoice.billing_street && <div>{invoice.billing_street}</div>}
              {invoice.billing_city && <div>{invoice.billing_city}</div>}
              <div>{invoice.billing_country ?? t('defaultCountry')}</div>
              {invoice.billing_vat_id && <div>{t('vatId')}: {invoice.billing_vat_id}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 2 }}>
            <div><span style={{ color: '#888' }}>{t('number')}:</span> <strong>{invoice.invoice_number}</strong></div>
            <div><span style={{ color: '#888' }}>{t('date')}:</span> {formatDate(issueDate)}</div>
            <div><span style={{ color: '#888' }}>{t('dueDate')}:</span> {formatDate(dueDateObj)}</div>
            <div>
              <span style={{ color: '#888' }}>{t('statusLabel')}:</span>{' '}
              <span style={{ fontWeight: 700, color: statusColor }}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#003366', margin: '0 0 24px' }}>{t('title')}</h2>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #003366' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#003366', fontWeight: 700 }}>{t('descCol')}</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#003366', fontWeight: 700 }}>{t('amountCol')}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 0' }}>
                <div style={{ fontWeight: 700 }}>{t('planDesc', { plan: planLabel(invoice.plan) })}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {t('planSubDesc', { plan: planLabel(invoice.plan) })}
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '12px 0', fontWeight: 700 }}>
                {fmt(invoice.amount_net)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ minWidth: 280, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#555' }}>
              <span>{t('netAmount')}</span><span>{fmt(invoice.amount_net)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#555' }}>
              <span>{t('vatAmount', { rate: Math.round((invoice.vat_rate ?? 0.19) * 100) })}</span>
              <span>{fmt(invoice.amount_vat)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0',
              borderTop: '2px solid #003366', marginTop: 4,
              fontWeight: 700, fontSize: 16, color: '#003366',
            }}>
              <span>{t('grossAmount')}</span><span>{fmt(invoice.amount_gross)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        {invoice.status !== 'paid' && (
          <div style={{
            background: '#f0f6ff', border: '1px solid var(--ds-border)',
            borderRadius: 10, padding: '16px 20px', marginBottom: 24, fontSize: 13,
          }}>
            <div style={{ fontWeight: 700, color: '#003366', marginBottom: 8 }}>{t('bankTitle')}</div>
            <div style={{ lineHeight: 2, color: '#333' }}>
              <div><span style={{ color: '#888' }}>{t('bankRecipient')}:</span> {SELLER.name}</div>
              <div><span style={{ color: '#888' }}>{t('bankName')}:</span> {SELLER.bank_name}</div>
              <div><span style={{ color: '#888' }}>{t('bankIBAN')}:</span> <strong>{SELLER.iban}</strong></div>
              <div><span style={{ color: '#888' }}>{t('bankBIC')}:</span> {SELLER.bic}</div>
              <div><span style={{ color: '#888' }}>{t('bankRef')}:</span> <strong>{invoice.invoice_number}</strong></div>
            </div>
          </div>
        )}

        {/* Activation code */}
        {invoice.status === 'paid' && invoice.activation_code && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: 10, padding: '16px 20px', marginBottom: 24, fontSize: 13,
          }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>{t('activationTitle')}</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.2em', color: '#003366', fontFamily: 'monospace' }}>
              {invoice.activation_code}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
              {t('activationDesc')}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ fontSize: 11, color: '#888', lineHeight: 1.7, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
          <p style={{ margin: '0 0 6px' }}>{t('footer1')}</p>
          <p style={{ margin: 0 }}>{t('footer2', { email: SELLER.email })}</p>
        </div>

      </div>
    </>
  )
}
