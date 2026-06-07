import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="shrink-0">
          <Image src="/icon-192.png" alt="FCA" width={36} height={36} className="rounded-lg" />
        </Link>
      </div>
    </header>
  )
}
