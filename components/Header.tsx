'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Startseite' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10" ref={menuRef}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image src="/icon-192.png" alt="FCA" width={36} height={36} className="rounded-lg" />
        </Link>

        {!isHome && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-muted transition-colors"
            aria-label="Menü öffnen"
          >
            <span className={cn(
              'block h-[2px] w-5 bg-foreground rounded-full transition-all duration-200',
              open && 'rotate-45 translate-y-[7px]'
            )} />
            <span className={cn(
              'block h-[2px] w-5 bg-foreground rounded-full transition-all duration-200',
              open && 'opacity-0 scale-x-0'
            )} />
            <span className={cn(
              'block h-[2px] w-5 bg-foreground rounded-full transition-all duration-200',
              open && '-rotate-45 -translate-y-[7px]'
            )} />
          </button>
        )}
      </div>

      {!isHome && (
        <div className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        )}>
          <nav className="border-t border-border/60 bg-card/95 backdrop-blur">
            <div className="max-w-2xl mx-auto px-4 py-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center py-3.5 text-sm font-medium border-b border-border/30 last:border-0 transition-colors',
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
