// src/app/snapshots/[symbol]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SnapshotsSymbolPage({
  params,
}: {
  params: { symbol: string };
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const symbol = decodeURIComponent(params.symbol);

  const rows = await prisma.priceSnapshot.findMany({
    where: { userId: session.userId, symbol },
    orderBy: { asOf: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{symbol}</h1>
        <Link href="/watchlist" className="underline text-sm">
          ← Volver a watchlist
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">Aún no tienes snapshots de {symbol}.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="border p-2 flex justify-between">
              <span>{new Date(r.asOf).toLocaleString()}</span>
              <span className="font-mono">
                {Number.isFinite(Number(r.price)) ? `$ ${Number(r.price).toFixed(2)}` : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

