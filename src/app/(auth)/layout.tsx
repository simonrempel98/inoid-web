import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>
      {/* INOid Logo Box */}
      <div className="mb-8 bg-white rounded-2xl px-8 py-5 shadow-sm">
        <Image src="/Inometa_INOid_21x13mm.png" alt="INOid" width={140} height={87} priority />
      </div>

      {children}

      <p className="mt-8 text-xs" style={{ color: '#666666' }}>
        <a href="/impressum" className="hover:underline">Impressum</a>
        {' · '}
        <a href="/datenschutz" className="hover:underline">Datenschutz</a>
      </p>
    </div>
  )
}
