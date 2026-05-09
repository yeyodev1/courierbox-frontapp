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
  descripcion: string;
  ubicacion?: string;
}

export interface TrackingResult {
  codigo: string;
  estado: EstadoCanonico;
  estadoLabel: string;
  pesoLb: number | null;
  costo: number | null;
  fechaEntrega: string | null;
  eventos: TrackingEvento[];
  imagenes: string[];
  actualizadoEn: string;
}

class TrackingService extends APIBase {
  async fetch(codigo: string): Promise<TrackingResult> {
    const res = await this["get"]<TrackingResult>(`tracking/${encodeURIComponent(codigo)}`);
    return res.data;
  }
}

export const trackingService = new TrackingService();

export async function fetchTracking(codigo: string): Promise<TrackingResult> {
  return trackingService.fetch(codigo);
}
