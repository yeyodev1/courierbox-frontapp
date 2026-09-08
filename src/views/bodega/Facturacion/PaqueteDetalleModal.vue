<script setup lang="ts">
/** Una caja por facturar abierta: qué es, de quién es, y facturarla desde aquí. */
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { PaqueteFacturable } from '@/services/facturacion.api'
import { formatDate } from '@/utils/format'

defineProps<{ paquete: PaqueteFacturable | null }>()
const emit = defineEmits<{ close: []; facturar: [paquete: PaqueteFacturable] }>()
</script>

<template>
  <AppOverlay :open="!!paquete" label="Detalle de la caja" @close="emit('close')">
    <div v-if="paquete" class="pdm" data-test="paquete-detalle">
      <div class="pdm__head">
        <div>
          <span class="eyebrow">Caja por facturar</span>
          <h3>{{ paquete.wr || paquete.sh }}</h3>
          <p>{{ paquete.contenido || 'Sin descripción' }}</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
      </div>
      <div class="pdm__body">
        <div class="datos">
          <div><span>Peso</span><strong>{{ (Number(paquete.pesoLb) || 0).toFixed(2) }} lb</strong></div>
          <div><span>Ingreso</span><strong>{{ paquete.fechaIngreso ? formatDate(paquete.fechaIngreso) : paquete.createdAt ? formatDate(paquete.createdAt) : '—' }}</strong></div>
          <div><span>Master / agencia</span><strong>{{ paquete.mg || '—' }}<template v-if="paquete.agencia"> · {{ paquete.agencia }}</template></strong></div>
          <div><span>Tracking</span><strong class="mono">{{ paquete.trackingOriginal || '—' }}</strong></div>
          <div><span>Cliente</span><strong>{{ paquete.masterClienteId?.nombreOficial || paquete.consigneeLimpio || '—' }}</strong></div>
          <div><span>Casillero</span><strong>{{ paquete.masterClienteId?.codigoCasillero || '—' }}</strong></div>
          <div><span>Cédula / RUC</span><strong>{{ paquete.masterClienteId?.cedulaRuc || 'Sin cédula (se pide al facturar)' }}</strong></div>
          <div><span>Correo</span><strong>{{ paquete.masterClienteId?.email || '—' }}</strong></div>
          <div class="span-2"><span>Nombre en el manifiesto</span><strong>{{ paquete.consigneeNombre || '—' }}</strong></div>
        </div>
      </div>
      <div class="pdm__foot">
        <button type="button" class="btn ghost" @click="emit('close')">Cerrar</button>
        <button type="button" class="btn primary" data-test="facturar-esta" @click="emit('facturar', paquete)"><i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" /> Facturar esta caja</button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;
.pdm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 600px); display: flex; flex-direction: column; overflow: hidden; }
.pdm__head { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.2rem; } p { margin: 0; color: $ink-400; font-size: 0.88rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } } }
.pdm__body { padding: $space-5; }
.pdm__foot { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); }
.datos { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 560px) { grid-template-columns: 1fr; }
  > div { display: flex; flex-direction: column; gap: 2px; padding: $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); }
  span { color: $ink-400; font-size: 0.74rem; } strong { color: $fg-dark; font-size: 0.92rem; overflow-wrap: anywhere; } .mono { font-variant-numeric: tabular-nums; } .span-2 { grid-column: 1 / -1; } }
</style>
