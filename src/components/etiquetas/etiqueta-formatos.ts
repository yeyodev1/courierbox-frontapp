/**
 * Formatos de etiqueta 4×6 de bodega. Son los mismos que la bodega imprimía
 * en Multitrack: Courier Box y una variante por cada courier aliado al que
 * Courier Box le recibe carga. Cambia el encabezado, el pie y, en algunos,
 * un segundo código de barras abajo.
 */

export interface FormatoEtiqueta {
  /** Código del aliado (COURIERBOX, GRACIABOX…). */
  id: string
  /** Lo que se ve en el selector. */
  nombre: string
  /** Nombre que va en el encabezado cuando no hay logo propio. */
  marca: string
  /** Courier Box sin logo subido usa el del proyecto. */
  logoCourierBox?: boolean
  /** Logo subido desde la pantalla de Aliados. */
  logoUrl?: string
  /** Líneas del pie, de izquierda a derecha. */
  pie: string[]
  /** Frase centrada al final, si la marca la usa. */
  lema?: string
  /** Segundo código de barras abajo, con la referencia de la caja. */
  barrasAbajo?: boolean
  /** Cómo se llama la fila del tracking. */
  rotuloTracking?: string
  /** Textos de la columna AGENCIA del manifiesto que lo identifican. */
  coincidencias?: string[]
  /** Courier Box: el formato de toda caja que no es de un aliado. */
  principal?: boolean
  activo?: boolean
}

/**
 * Los formatos de siempre. Valen mientras no carga el catálogo de Aliados (o
 * si no se puede leer), así la bodega nunca se queda sin poder imprimir.
 */
export const FORMATOS: FormatoEtiqueta[] = [
  { id: 'COURIERBOX', nombre: 'Courier Box', marca: 'COURIER BOX', logoCourierBox: true, pie: ['IG courierbox_ec', 'WA +1 347 824 8937'], coincidencias: ['COURIER BOX', 'CBOX'], principal: true },
  { id: 'GRACIABOX', nombre: 'Gracia Box', marca: 'GRACIA', pie: ['Instagram: gracia.ec', 'WhatsApp: +593 99 988 7278'], lema: 'Del mundo a tu puerta', coincidencias: ['GRACIA'] },
  { id: 'SUNSET', nombre: 'Sunset Express', marca: 'SUNSET EXPRESS', pie: [], coincidencias: ['SUNSET'] },
  { id: 'AVCCOURIER', nombre: 'AVC Courier', marca: 'AVC COURIER', pie: [], barrasAbajo: true, coincidencias: ['AVC'] },
  { id: 'QUIKCARGO', nombre: 'Quik Cargo', marca: 'QUIK CARGO', pie: [], barrasAbajo: true, coincidencias: ['QUIK', 'QUICK'] },
  { id: 'MIMALETA', nombre: 'Mi Maleta', marca: 'MI MALETA', pie: [], barrasAbajo: true, rotuloTracking: 'No. TRACKING', coincidencias: ['MI MALETA'] },
  { id: 'TELOTRAEMOS', nombre: 'Te lo traemos', marca: 'TE LO TRAEMOS', pie: ['WA: +593 98 220 9762'], lema: 'Entregas rápidas y seguras', coincidencias: ['TE LO TRAEMOS'] },
  { id: 'SHIPIT', nombre: 'Ship It', marca: 'SHIP IT', pie: [], coincidencias: ['SHIP IT'] },
  { id: 'EASYCOURIER', nombre: 'Easy Courier', marca: 'EASY COURIER', pie: [], coincidencias: ['EASY COURIER'] },
  { id: 'FASTCOURIER', nombre: 'Fast Courier', marca: 'FAST COURIER', pie: [], coincidencias: ['FAST COURIER'] },
]

const principalDe = (lista: FormatoEtiqueta[]) => lista.find((f) => f.principal) ?? lista[0] ?? FORMATOS[0]!

export const formatoPorId = (id: string, lista: FormatoEtiqueta[] = FORMATOS): FormatoEtiqueta =>
  lista.find((f) => f.id === id) ?? principalDe(lista)

const normalizar = (s: string | null | undefined) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')

/**
 * El formato que le toca a una caja según su agencia, con la misma regla que
 * usa el servidor para la tarifa. Courier Box, CBOX Express, Farmasi y
 * cualquier agencia desconocida salen con el principal; la bodega puede
 * cambiarlo antes de imprimir.
 */
export function formatoPorAgencia(agencia: string | null | undefined, lista: FormatoEtiqueta[] = FORMATOS): string {
  const a = normalizar(agencia)
  const principal = principalDe(lista)
  if (!a) return principal.id
  for (const f of lista) {
    if (f.principal || f.activo === false) continue
    if ((f.coincidencias ?? []).some((c) => normalizar(c) && a.includes(normalizar(c)))) return f.id
  }
  return principal.id
}

/** Un aliado del catálogo convertido en formato de etiqueta. */
export function formatoDesdeAliado(a: {
  codigo: string
  nombre: string
  marca: string
  logoUrl?: string
  pie?: string[]
  lema?: string
  barrasAbajo?: boolean
  rotuloTracking?: string
  coincidencias?: string[]
  principal?: boolean
  activo?: boolean
}): FormatoEtiqueta {
  return {
    id: a.codigo,
    nombre: a.nombre,
    marca: a.marca || a.nombre.toUpperCase(),
    logoUrl: a.logoUrl || '',
    logoCourierBox: Boolean(a.principal && !a.logoUrl),
    pie: a.pie ?? [],
    lema: a.lema || '',
    barrasAbajo: Boolean(a.barrasAbajo),
    rotuloTracking: a.rotuloTracking || '',
    coincidencias: a.coincidencias ?? [],
    principal: Boolean(a.principal),
    activo: a.activo !== false,
  }
}

/** El manifiesto pone "AUTOMATICO DATOS CLIENTE" cuando no trae ciudad ni dirección. */
export function datoReal(valor: string | null | undefined): string {
  const v = String(valor ?? '').trim()
  if (!v || /AUTOMATIC/i.test(v)) return ''
  return v
}
