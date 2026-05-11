export const WHATSAPP_NUMBER_RAW = "13478248937";
export const WHATSAPP_DISPLAY = "+1 347 824 8937";
export const WHATSAPP_URL_BASE = `https://wa.me/${WHATSAPP_NUMBER_RAW}`;

export const whatsappUrl = (text?: string): string =>
  text ? `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(text)}` : WHATSAPP_URL_BASE;

export const SUPPORT_EMAIL = "ventas@courierboxlogistics.com";
export const SUPPORT_EMAIL_URL = `mailto:${SUPPORT_EMAIL}`;

export interface Office {
  id: string;
  flag: string;
  country: string;
  badge?: string;
  nombrePattern: string;
  direccion: string;
  ciudad: string;
  estado: string;
  zipCode: string;
  telefono: string;
  apartamento?: string;
  pais: string;
  nota?: string;
}

export const OFFICES: Office[] = [
  {
    id: "usa-standard",
    flag: "USA",
    country: "Courier Box USA",
    badge: "Carga Estándar · 5 a 9 días hábiles",
    nombrePattern: "Courier Box + nombre del cliente",
    direccion: "8988 NW 105th Way",
    ciudad: "Medley",
    estado: "Florida",
    zipCode: "33178",
    telefono: "+1 347 824 8937",
    pais: "Estados Unidos",
  },
  {
    id: "usa-express",
    flag: "USA",
    country: "Courier Box Express USA",
    badge: "Carga Express · 7 días tras recepción",
    nombrePattern: "Courier Box + nombre del cliente",
    direccion: "13176 NW 19th Street",
    ciudad: "Pembroke Pines",
    estado: "Florida",
    zipCode: "33028",
    telefono: "+1 347 824 8937",
    pais: "Estados Unidos",
  },
  {
    id: "esp",
    flag: "ESP",
    country: "Courier Box España",
    badge: "Recibimos envíos desde toda la Unión Europea",
    nombrePattern: "728732OU - Iniciales del cliente",
    direccion: "Calle de Albasanz 52, local B Izq",
    ciudad: "Madrid",
    estado: "Madrid",
    zipCode: "28037",
    telefono: "+34 646 552 799",
    apartamento: "728732",
    pais: "España",
    nota: "Envíos desde España y Unión Europea hacia Ecuador",
  },
];
