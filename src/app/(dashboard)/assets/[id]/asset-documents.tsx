'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, Trash2, Download } from 'lucide-react'
import { checkDocSize, formatBytes, DOC_DEFAULT_MAX_BYTES } from '@/lib/compress-image'
import { compressPdf, PDF_COMPRESS_THRESHOLD_BYTES } from '@/lib/compress-pdf'

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.dwg,.dxf,.zip'

function fileIcon(url: string) {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
  const colors: Record<string, string> = {
    pdf: '#E74C3C',
    doc: '#2B5797', docx: '#2B5797',
    xls: '#1D6F42', xlsx: '#1D6F42',
    ppt: '#D04423', pptx: '#D04423',
    dwg: '#F39C12', dxf: '#F39C12',
    zip: '#8E44AD',
  }
  return colors[ext] ?? '#96aed2'
}

function fileName(url: string) {
  const raw = decodeURIComponent(url.split('/').pop() ?? url)
  return raw.replace(/^\d+_/, '')
}

export function AssetDocuments({ assetId, initialUrls, canEdit, docMaxSizeMb = 10 }: {
  assetId: string
  initialUrls: string[]
  canEdit: boolean
  docMaxSizeMb?: number
}) {
  const t = useTranslations()
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const router = useRouter()
  const maxBytes = docMaxSizeMb > 0 ? docMaxSizeMb * 1024 * 1024 : Infinity

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    setCompressionInfo(null)
    const supabase = createClient()

    const newUrls: string[] = []
    let totalSaved = 0
    for (let rawFile of files) {
      // Größencheck vor Komprimierung
      const sizeCheck = checkDocSize(rawFile, maxBytes)
      if (!sizeCheck.ok) { setError(sizeCheck.message ?? 'Datei zu groß'); continue }

      // PDF-Komprimierung
      if (rawFile.name.toLowerCase().endsWith('.pdf') && rawFile.size > PDF_COMPRESS_THRESHOLD_BYTES) {
        const result = await compressPdf(rawFile)
        if (result.wasCompressed) {
          totalSaved += result.originalSize - result.compressedSize
          rawFile = result.file
        }
      }

      const safeName = rawFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `assets/${assetId}/docs/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage
        .from('org-files')
        .upload(path, rawFile, { upsert: true })
      if (upErr) { setError(`${t('common.error')}: ${upErr.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      newUrls.push(publicUrl)
    }
    if (totalSaved > 0) setCompressionInfo(`PDF komprimiert · ${formatBytes(totalSaved)} gespart`)

    if (newUrls.length > 0) {
      const combined = [...urls, ...newUrls]
      await supabase.from('assets').update({ document_urls: combined }).eq('id', assetId)
      setUrls(combined)
      router.refresh()
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(url: string) {
    const supabase = createClient()
    const updated = urls.filter(u => u !== url)
    await supabase.from('assets').update({ document_urls: updated }).eq('id', assetId)
    setUrls(updated)
    router.refresh()
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} /> {t('assets.fields.documents')}
          {urls.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: '#96aed2', marginLeft: 2 }}>{urls.length}</span>
          )}
        </h2>
        {canEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: '#0099cc', fontWeight: 600 }}>
            <Upload size={13} />
            {uploading ? t('common.loading') : t('common.upload')}
            <input
              type="file"
              multiple
              accept={ACCEPTED}
              style={{ display: 'none' }}
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#E74C3C', margin: '0 0 8px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px' }}>
          {error}
        </p>
      )}
      {compressionInfo && (
        <p style={{ fontSize: 12, color: '#059669', margin: '0 0 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
          ✓ {compressionInfo}
        </p>
      )}

      {urls.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: '20px 16px', border: '1px solid #e8eef6', textAlign: 'center' }}>
          <FileText size={24} color="#c8d4e8" style={{ marginBottom: 8 }} />
          <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
            {canEdit ? t('service.entry.addDocument') : t('common.noData')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {urls.map(url => (
            <div key={url} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', borderRadius: 10, padding: '10px 14px',
              border: '1px solid #e8eef6',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: `${fileIcon(url)}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={16} color={fileIcon(url)} />
              </div>
              <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: '#000',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName(url)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', color: '#0099cc', padding: 4 }}>
                  <Download size={15} />
                </a>
                {canEdit && (
                  <button onClick={() => handleDelete(url)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0ccda', padding: 4, display: 'flex' }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
