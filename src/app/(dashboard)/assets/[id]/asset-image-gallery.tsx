'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

function ImagePlaceholder({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  )
}

export function AssetImageGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [broken, setBroken] = useState<Set<number>>(new Set())

  function markBroken(i: number) {
    setBroken(prev => new Set(prev).add(i))
  }

  if (imageUrls.length === 0) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', maxHeight: 260,
        backgroundColor: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ImagePlaceholder size={48} />
      </div>
    )
  }

  function prev() { setActiveIndex(i => (i - 1 + imageUrls.length) % imageUrls.length) }
  function next() { setActiveIndex(i => (i + 1) % imageUrls.length) }

  return (
    <>
      {/* Hauptbild */}
      <div style={{ position: 'relative', width: '100%', backgroundColor: '#f4f6f9', overflow: 'hidden', maxHeight: 300 }}>
        {broken.has(activeIndex) ? (
          <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImagePlaceholder size={48} />
          </div>
        ) : (
          <img
            src={imageUrls[activeIndex]}
            alt={title}
            onClick={() => setLightbox(true)}
            onError={() => markBroken(activeIndex)}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
          />
        )}

        {/* Pfeil links */}
        {imageUrls.length > 1 && (
          <button onClick={prev}
            style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {/* Pfeil rechts */}
        {imageUrls.length > 1 && (
          <button onClick={next}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}

        {/* Zähler */}
        {imageUrls.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 12,
            background: 'rgba(0,0,0,0.5)', color: 'white',
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            fontFamily: 'Arial, sans-serif',
          }}>
            {activeIndex + 1} / {imageUrls.length}
          </div>
        )}

        {/* Lupe-Hinweis */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          background: 'rgba(0,0,0,0.4)', color: 'white',
          fontSize: 11, padding: '3px 9px', borderRadius: 20,
          fontFamily: 'Arial, sans-serif',
        }}>
          <Search size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Vollbild
        </div>
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto' }}>
          {imageUrls.map((url, i) => (
            <button key={i} type="button" onClick={() => setActiveIndex(i)}
              style={{
                width: 56, height: 56, borderRadius: 8, flexShrink: 0, padding: 0,
                border: `2px solid ${i === activeIndex ? '#003366' : '#c8d4e8'}`,
                overflow: 'hidden', cursor: 'pointer', background: 'none',
              }}>
              {broken.has(i) ? (
                <ImagePlaceholder size={24} />
              ) : (
                <img src={url} alt=""
                  onError={() => markBroken(i)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16,
          }}
        >
          {broken.has(activeIndex) ? (
            <div style={{ width: 300, height: 200 }}><ImagePlaceholder size={48} /></div>
          ) : (
            <img
              src={imageUrls[activeIndex]}
              alt={title}
              onClick={e => e.stopPropagation()}
              onError={() => markBroken(activeIndex)}
              style={{ maxWidth: '95vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
            />
          )}

          {/* Lightbox Navigation */}
          {imageUrls.length > 1 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={e => { e.stopPropagation(); prev() }}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span style={{ color: 'white', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
                {activeIndex + 1} / {imageUrls.length}
              </span>
              <button onClick={e => { e.stopPropagation(); next() }}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Lightbox Thumbnails */}
          {imageUrls.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '95vw', padding: '0 8px' }}>
              {imageUrls.map((url, i) => (
                <button key={i} type="button" onClick={e => { e.stopPropagation(); setActiveIndex(i) }}
                  style={{
                    width: 48, height: 48, borderRadius: 6, flexShrink: 0, padding: 0,
                    border: `2px solid ${i === activeIndex ? 'white' : 'rgba(255,255,255,0.2)'}`,
                    overflow: 'hidden', cursor: 'pointer', background: 'none',
                  }}>
                  {broken.has(i) ? <ImagePlaceholder size={20} /> : (
                    <img src={url} alt="" onError={() => markBroken(i)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Arial, sans-serif', margin: 0 }}>
            Tippen zum Schließen
          </p>
        </div>
      )}
    </>
  )
}
