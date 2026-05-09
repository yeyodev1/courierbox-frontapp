import { defineStore } from "pinia";
import axios from "axios";
import { fetchTracking, type TrackingResult } from "@/services/tracking";

const HISTORY_KEY = "courierbox:tracking:history";
const MAX_HISTORY = 5;

interface State {
  codigo: string;
  data: TrackingResult | null;
  loading: boolean;
  error: string | null;
  history: string[];
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v) => typeof v === "string").slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // ignore
  }
}

export const useTrackingStore = defineStore("tracking", {
  state: (): State => ({
    codigo: "",
    data: null,
    loading: false,
    error: null,
    history: loadHistory(),
  }),
  actions: {
    async lookup(codigoRaw: string) {
      const codigo = codigoRaw.trim().toUpperCase();
      if (!codigo) return;
      this.codigo = codigo;
      this.loading = true;
      this.error = null;
      try {
        const data = await fetchTracking(codigo);
        this.data = data;
        const next = [codigo, ...this.history.filter((c) => c !== codigo)].slice(0, MAX_HISTORY);
        this.history = next;
        saveHistory(next);
      } catch (err: unknown) {
        this.data = null;
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            this.error = "No encontramos esa guía. Verifica el número.";
          } else if (err.response?.status === 429) {
            this.error = "Muchas consultas seguidas. Espera un momento.";
          } else if (err.code === "ECONNABORTED") {
            this.error = "Estamos demorando más de lo normal. Intenta de nuevo.";
          } else {
            this.error = "No pudimos consultar la guía en este momento.";
          }
        } else {
          this.error = "No pudimos consultar la guía en este momento.";
        }
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.data = null;
      this.error = null;
      this.codigo = "";
    },
    removeFromHistory(codigo: string) {
      this.history = this.history.filter((c) => c !== codigo);
      saveHistory(this.history);
    },
  },
});
