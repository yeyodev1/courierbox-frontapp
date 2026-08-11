import APIBase from "./httpBase";

export type EstadoCanonico =
  | "creado"
  | "en_bodega_miami"
  | "en_transito"
  | "en_aduana"
  | "en_distribucion"
  | "entregado"
  | "incidencia"
  | "desconocido";

export interface TrackingEvento {
  fecha: string | null;
  fechaTexto: string;
  descripcion: string;
  ubicacion?: string;
  accion?: string;
}

export interface TrackingCosto {
  pesoLb: number;
  flete: number;
  arancel: number;
  total: number;
}

export interface TrackingResult {
  codigo: string;
  wr: string | null;
  estado: EstadoCanonico;
  estadoLabel: string;
  descripcion: string | null;
  notes: string | null;
  consignee: string | null;
  trackingOriginal?: string | null;
  shipper?: string | null;
  carrier?: string | null;
  pesoLb: number | null;
  costo: TrackingCosto | null;
  fechaRecepcion: string | null;
  fechaEstado: string | null;
  eventos: TrackingEvento[];
  imagenes: string[];
  actualizadoEn: string;
}

/**
 * The tracking payload comes from a Playwright scraper against a third-party
 * courier site. A partial scrape or an upstream markup change can drop fields
 * the type declares as present, and the public /rastrear page then crashes on
 * `data.imagenes.length`. Normalising here means every consumer can trust the
 * shape without defensive checks of its own.
 */
export function normalizeTrackingResult(raw: Partial<TrackingResult> | null | undefined): TrackingResult {
  const data = raw ?? {};
  const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  return {
    codigo: String(data.codigo ?? ""),
    wr: data.wr ?? null,
    estado: (data.estado ?? "desconocido") as EstadoCanonico,
    estadoLabel: data.estadoLabel ?? "Sin información",
    descripcion: data.descripcion ?? null,
    notes: data.notes ?? null,
    consignee: data.consignee ?? null,
    trackingOriginal: data.trackingOriginal ?? null,
    shipper: data.shipper ?? null,
    carrier: data.carrier ?? null,
    pesoLb: typeof data.pesoLb === "number" ? data.pesoLb : null,
    costo: data.costo ?? null,
    fechaRecepcion: data.fechaRecepcion ?? null,
    fechaEstado: data.fechaEstado ?? null,
    eventos: asArray<TrackingEvento>(data.eventos).filter(Boolean),
    imagenes: asArray<string>(data.imagenes).filter((url) => typeof url === "string" && url.length > 0),
    actualizadoEn: data.actualizadoEn ?? new Date().toISOString(),
  };
}

class TrackingService extends APIBase {
  async fetch(codigo: string): Promise<TrackingResult> {
    const res = await this["get"]<TrackingResult>(`tracking/${encodeURIComponent(codigo)}`);
    return normalizeTrackingResult(res.data);
  }
}

export const trackingService = new TrackingService();

export async function fetchTracking(codigo: string): Promise<TrackingResult> {
  return trackingService.fetch(codigo);
}
