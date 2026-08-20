export interface MegaLink {
  num: string
  to: string
  label: string
  kicker: string
  art: string
}

export const MEGA_LINKS: MegaLink[] = [
  { num: '01', to: '/', label: 'Inicio', kicker: 'Tú pides, nosotros del resto', art: 'home' },
  { num: '02', to: '/servicios', label: 'Servicios', kicker: 'USA · España → Ecuador', art: 'services' },
  { num: '03', to: '/cotizar', label: 'Cotizar', kicker: 'Calcula tu envío en segundos', art: 'quote' },
  { num: '04', to: '/comprar-por-mi', label: 'Comprar por mí', kicker: 'Pega el link, nosotros lo compramos', art: 'quote' },
  { num: '05', to: '/rastrear', label: 'Rastrear', kicker: 'Estado en vivo de tu envío', art: 'track' },
  { num: '06', to: '/pagos', label: 'Mis Pagos', kicker: 'Deudas y comprobantes', art: 'payment' },
  { num: '07', to: '/nosotros', label: 'Nosotros', kicker: 'Operamos cada eslabón', art: 'about' },
  { num: '08', to: '/contacto', label: 'Contacto', kicker: 'Respuesta en minutos', art: 'contact' },
]

const ART_GLYPHS: Record<string, string> = {
  home: '●',
  services: '◇',
  quote: '$',
  track: '↗',
  about: '⌬',
}

/** Contact and payment share the envelope; everything else has its own mark. */
export const glyphFor = (art: string) => ART_GLYPHS[art] ?? '✉'
