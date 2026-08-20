export interface ReservaData {
  id: string
  asesorNombre: string
  clienteNombre: string
  valorTotal: number
  valorReserva: number
  paginaCompra: string
  fecha: string
  imagenCompraUrl: string
}

export const shortIdOf = (id: string) => id.slice(-8).toUpperCase()

function escapeHtml(value: string) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

const row = (label: string, value: string, valueClass = '') =>
  `<tr><td class="k">${escapeHtml(label)}</td><td class="v ${valueClass}">${value}</td></tr>`

/**
 * Renders the reservation slip into a popup and triggers print. It is a
 * standalone document on purpose: the operator hands it to the client as the
 * receipt for the deposit, so it must survive being saved as a PDF.
 *
 * Returns false when the browser blocked the popup.
 */
export function printReserva(reserva: ReservaData): boolean {
  const win = window.open('', '_blank', 'width=720,height=900')
  if (!win) return false

  const code = shortIdOf(reserva.id)
  const saldo = (reserva.valorTotal - reserva.valorReserva).toFixed(2)

  const rows = [
    row('Asesor', escapeHtml(reserva.asesorNombre)),
    row('Cliente', escapeHtml(reserva.clienteNombre)),
    row('Precio final', `$${reserva.valorTotal.toFixed(2)}`, 'total'),
    row('Reserva (abono)', `$${reserva.valorReserva.toFixed(2)}`),
    row('Saldo pendiente', `$${saldo}`),
    reserva.paginaCompra ? row('Tienda', escapeHtml(reserva.paginaCompra)) : '',
    reserva.fecha ? row('Entrega tentativa', escapeHtml(reserva.fecha)) : '',
    row('Fecha de emisión', new Date().toLocaleDateString('es-EC')),
  ].join('')

  const styles = `
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color:#1a1a1a; margin:0; padding:32px; }
    .head { background:#f08a1f; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0; }
    .head h1 { margin:0; font-size:20px; }
    .head span { font-size:12px; opacity:.9; }
    .box { border:1px solid #e5e5e5; border-top:none; border-radius:0 0 12px 12px; padding:24px; }
    .code { float:right; font-weight:bold; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    td { padding:10px 8px; border-bottom:1px solid #eee; font-size:14px; }
    td.k { color:#777; width:180px; }
    td.v { font-weight:bold; text-align:right; }
    .total { color:#f08a1f; font-size:18px; }
    img { max-width:100%; margin-top:16px; border-radius:8px; border:1px solid #ddd; }
    .foot { margin-top:20px; font-size:11px; color:#999; text-align:center; }
    @media print { body { padding:0; } }`

  win.document.write(
    `<!doctype html><html lang="es"><head><meta charset="utf-8" />` +
      `<title>Reserva ${code}</title><style>${styles}</style></head><body>` +
      `<div class="head"><span class="code">#${code}</span>` +
      `<h1>Courier Box Logistics</h1><span>Comprobante de reserva — ORDEN CONFIRMADA</span></div>` +
      `<div class="box"><table>${rows}</table>` +
      (reserva.imagenCompraUrl ? `<img src="${reserva.imagenCompraUrl}" alt="Orden" />` : '') +
      `<div class="foot">Documento de respaldo interno · courierboxlogistics.com</div></div>` +
      `<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>` +
      `</body></html>`,
  )
  win.document.close()
  return true
}

export function supportNote(state: string) {
  if (state === 'verificado') return 'Soporte: verificado sin comprobante adjunto'
  if (state === 'sin_soporte') return 'Soporte: sin comprobante'
  return 'Soporte: con comprobante adjunto'
}
