import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function DatabaseSetupPanel({ detail }: { detail: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Logo className="mx-auto h-20 w-20" />
      <h1 className="display mt-6 text-center text-3xl text-forest">Store is almost ready</h1>
      <p className="mt-4 text-center text-sm text-muted">
        The website is live, but it cannot load products until MySQL is connected.
      </p>
      <div className="soft-card mt-8 space-y-4 p-6 text-sm text-muted">
        <p className="font-medium text-forest">What to fix</p>
        <p>{detail}</p>
        <ol className="list-inside list-decimal space-y-2">
          <li>Create a cloud MySQL database named <strong>shoe_mafia</strong>.</li>
          <li>
            Set <code className="rounded bg-cream px-1">DATABASE_URL</code> on Vercel (Production) to your real URL.
          </li>
          <li>
            On your PC run:{" "}
            <code className="block mt-1 rounded bg-cream px-2 py-1 text-xs">node scripts/migrate-production.mjs</code>
          </li>
          <li>Redeploy the site.</li>
        </ol>
      </div>
      <p className="mt-6 text-center">
        <Link href="/shop" className="text-emerald underline">
          Try shop page
        </Link>
      </p>
    </div>
  );
}
