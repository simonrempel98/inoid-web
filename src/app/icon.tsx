import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#003366',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* "id" Text */}
        <span
          style={{
            color: 'white',
            fontSize: 17,
            fontWeight: 900,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: -1,
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          id
        </span>

        {/* Cyan Punkt oben rechts */}
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#0099cc',
          }}
        />
      </div>
    ),
    { width: 32, height: 32 }
  )
}
