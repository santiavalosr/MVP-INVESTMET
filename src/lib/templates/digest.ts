type Row = { symbol: string; price?: number; changePercent?: number; note?: string };

export function digestHtml(opts: {
  email: string;
  rows: Row[];
  period: "DAILY" | "WEEKLY" | "MONTHLY";
}) {
  const { email, rows, period } = opts;

  const items = rows.map((r) => {
    const price = Number.isFinite(r.price!) ? `$ ${r.price!.toFixed(2)}` : "N/D";
    const pct =
      typeof r.changePercent === "number"
        ? `${r.changePercent! >= 0 ? "+" : ""}${r.changePercent!.toFixed(2)}%`
        : "—";
    return `<tr>
      <td style="padding:8px 12px;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;">
        <b>${r.symbol}</b>
      </td>
      <td style="padding:8px 12px;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;">${price}</td>
      <td style="padding:8px 12px;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;">${pct}</td>
      <td style="padding:8px 12px;color:#666;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;">${r.note ?? ""}</td>
    </tr>`;
  }).join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f7f8;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;font:600 18px system-ui,Segoe UI,Roboto,Helvetica,Arial">
        MVP Invest — Resumen ${period === "DAILY" ? "diario" : period === "WEEKLY" ? "semanal" : "mensual"}
      </div>
      <div style="padding:16px 20px;font:14px/1.5 system-ui,Segoe UI,Roboto,Helvetica,Arial;color:#111">
        <p>Hola ${email}, aquí tienes el snapshot de tu watchlist:</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
          <thead>
            <tr>
              <th align="left" style="padding:8px 12px;border-bottom:1px solid #eee;font:600 13px system-ui">Ticker</th>
              <th align="left" style="padding:8px 12px;border-bottom:1px solid #eee;font:600 13px system-ui">Precio</th>
              <th align="left" style="padding:8px 12px;border-bottom:1px solid #eee;font:600 13px system-ui">% Día</th>
              <th align="left" style="padding:8px 12px;border-bottom:1px solid #eee;font:600 13px system-ui">Nota</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <p style="color:#666">Consejo: el plan gratuito de Alpha Vantage limita fuertemente las consultas. Si ves “N/D”, probablemente es por el rate-limit. Reintenta más tarde o considera caché/upgrade.</p>
      </div>
      <div style="padding:12px 20px;border-top:1px solid #e5e7eb;color:#666;font:12px system-ui">
        Recibiste este correo porque estás logueado en MVP Invest y pediste un resumen. Configura la periodicidad en tu cuenta.
      </div>
    </div>
  </body>
</html>`;
}

