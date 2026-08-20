<script setup lang="ts">
/** Read-only listing of deliveries plus the inline row actions the admin needs. */
import type { EnvioDomicilio, Motorizado } from '@/services/envios.api'
import { ESTADO_LABEL, asignadoId, formatDate, formatMoney } from './useEnvios'

defineProps<{ envios: EnvioDomicilio[]; motorizados: Motorizado[] }>()

const emit = defineEmits<{
  reasignar: [envio: EnvioDomicilio, asignadoA: string]
  updateStatus: [envio: EnvioDomicilio, estado: string]
  togglePago: [envio: EnvioDomicilio, trayecto: 'trayectoUsa' | 'trayectoLocal']
  openGuide: [envio: EnvioDomicilio]
}>()

const value = (event: Event) => (event.target as HTMLSelectElement).value

/** Older records carry their cost on the legs; new ones on the provider payment. */
function costoEnvio(e: EnvioDomicilio) {
  return (e.valorPagadoProveedor || 0) + (e.trayectoUsa?.costo || 0) + (e.trayectoLocal?.costo || 0)
}
</script>

<template>
  <div class="table-wrapper">
    <table class="envios-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Modo</th>
          <th>Cliente</th>
          <th>Paquete</th>
          <th>Proveedor</th>
          <th>Pago proveedor</th>
          <th>Motorizado</th>
          <th>Guía</th>
          <th>Evidencia</th>
          <th>Costo</th>
          <th>Cobrado</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in envios" :key="e._id">
          <td class="mono">#{{ e._id.slice(-6).toUpperCase() }}</td>
          <td><span class="badge badge-blue">{{ e.modo || 'local' }}</span></td>
          <td>
            <strong>{{ e.clienteNombre }}</strong>
            <div class="cell-sub">{{ e.clienteDireccion.slice(0, 30) }}</div>
          </td>
          <td class="mono">{{ e.paqueteId?.wr || e.paqueteId?.sh || '—' }}</td>
          <td>{{ e.proveedorUtilizado || e.trayectoLocal?.proveedorNombre || e.trayectoUsa?.proveedorNombre || '—' }}</td>
          <td>
            <button
              v-if="e.modo === 'interprovincial'"
              class="btn-pago"
              :class="{ pagado: e.trayectoLocal?.pagado }"
              :title="e.trayectoLocal?.pagado ? 'Pagado' : 'Marcar como pagado'"
              @click="emit('togglePago', e, 'trayectoLocal')"
            >
              <i :class="e.trayectoLocal?.pagado ? 'fa-solid fa-check-circle' : 'fa-regular fa-circle'" />
            </button>
            <span v-else class="cell-sub">—</span>
          </td>
          <td>
            <select
              class="assign-select"
              :value="asignadoId(e)"
              :disabled="e.estado === 'entregado'"
              @change="emit('reasignar', e, value($event))"
            >
              <option value="">Sin asignar</option>
              <option v-for="m in motorizados" :key="m._id" :value="m._id">{{ m.name || m.email }}</option>
            </select>
          </td>
          <td>
            <div v-if="e.guiaUrl" class="file-actions">
              <a :href="e.guiaUrl" target="_blank" class="file-link">Abrir</a>
              <button v-if="e.clienteTelefono" class="btn-link" type="button" @click="emit('openGuide', e)">
                Enviar por WhatsApp
              </button>
            </div>
            <span v-else>—</span>
          </td>
          <td>
            <a
              v-if="e.fotoEntregaUrl || e.firmaUrl || e.evidenciaUrl"
              :href="e.fotoEntregaUrl || e.evidenciaUrl || e.firmaUrl"
              target="_blank"
              class="file-link"
            >Abrir</a>
            <span v-else>—</span>
          </td>
          <td class="mono costo">{{ formatMoney(costoEnvio(e)) }}</td>
          <td class="mono costo">{{ formatMoney(e.valorCobrado || 0) }}</td>
          <td>
            <select class="badge-select" :value="e.estado" @change="emit('updateStatus', e, value($event))">
              <option v-for="(label, key) in ESTADO_LABEL" :key="key" :value="key">{{ label }}</option>
            </select>
          </td>
          <td class="mono">{{ formatDate(e.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use './envios-ui' as ui;

@include ui.table;
@include ui.badges;
@include ui.buttons;

.badge-select {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  padding: 2px 6px;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.assign-select {
  max-width: 150px;
  padding: 5px 8px;
  background: rgba($ink-700, 0.7);
  border: 1px solid rgba($ink-500, 0.6);
  border-radius: 8px;
  color: $ink-100;
  font-size: 0.78rem;
  cursor: pointer;

  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:focus { outline: none; border-color: $brand-orange; }
}

.btn-pago {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $ink-400;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { color: $brand-orange; }
  &.pagado { color: #81c784; }
}

.file-link { color: $brand-orange; text-decoration: none; font-weight: 600; }
.file-actions { display: flex; flex-direction: column; gap: 0.25rem; }
</style>
