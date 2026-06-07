import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">FCA Turniere</h1>
        <p className="text-sm text-muted-foreground mt-2">Wer bist du?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2">
        <Link
          href="/eltern"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card px-6 py-10 hover:border-border hover:bg-muted/40 active:scale-[0.98] transition-all"
        >
          <span className="text-5xl">👨‍👩‍👦</span>
          <div className="text-center">
            <div className="text-lg font-bold">Ich bin Elternteil</div>
            <div className="text-sm text-muted-foreground mt-1">Kind an- oder abmelden</div>
          </div>
        </Link>

        <Link
          href="/trainer"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card px-6 py-10 hover:border-border hover:bg-muted/40 active:scale-[0.98] transition-all"
        >
          <span className="text-5xl">📋</span>
          <div className="text-center">
            <div className="text-lg font-bold">Ich bin Trainer</div>
            <div className="text-sm text-muted-foreground mt-1">Turniere verwalten</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
