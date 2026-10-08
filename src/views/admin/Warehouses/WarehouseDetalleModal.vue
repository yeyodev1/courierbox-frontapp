<script setup lang="ts">
/** Un warehouse abierto: todo lo que trajo el manifiesto, su cliente y su factura. */
import { computed } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { Warehouse } from '@/services/paquetes.api'
import { formatDate, formatDateTime } from '@/utils/format'
import { datoReal, formatoPorAgencia, formatoPorId } from '@/components/etiquetas/etiqueta-formatos'
import { useFormatosEtiqueta } from '@/components/etiquetas/useFormatosEtiqueta'
import { ESTADO_UI } from './useWarehouses'

const props = defineProps<{ paquete: Warehouse | null; facturarUrl: string }>()
const emit = defineEmits<{ close: []; imprimir: [paquete: Warehouse] }>()

const estado = computed(() => (props.paquete ? ESTADO_UI[props.paquete.estado] : null))
const { formatos } = useFormatosEtiqueta()
const formato = computed(() =>
  props.paquete ? formatoPorId(formatoPorAgencia(props.paquete.agencia, formatos.value), formatos.value).nombre : '',
)
const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`
</script>

<template>
  <AppOverlay :open="!!paquete" label="Detalle del warehouse" @close="emit('close')">
    <div v-if="paquete" class="pdm" data-test="warehouse-detalle">
      <div class="pdm__head">
        <div>
          <span class="eyebrow">Warehouse</span>
          <h3>{{ paquete.wr || paquete.sh || paquete.trackingOriginal }}</h3>
          <p>{{ paquete.contenido || 'Sin descripción' }}</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
      </div>
      <div class="pdm__body">
        <div class="datos">
          <div><span>Estado</span><strong>{{ estado?.label ?? paquete.estado }}</strong></div>
          <div><span>Peso</span><strong>{{ (Number(paquete.pesoLb) || 0).toFixed(2) }} lb</strong></div>
          <div><span>Ingreso</span><strong>{{ paquete.fechaIngreso ? formatDate(paquete.fechaIngreso) : formatDateTime(paquete.createdAt) }}</strong></div>
          <div><span>Master</span><strong>{{ paquete.mg || '—' }}</strong></div>
          <div><span>Agencia</span><strong>{{ paquete.agencia?.trim() || '—' }}</strong></div>
          <div><span>Etiqueta</span><strong>{{ formato }}</strong></div>
          <div class="span-2"><span>Tracking</span><strong class="mono">{{ paquete.trackingOriginal || '—' }}</strong></div>
          <div><span>Cliente</span><strong>{{ paquete.masterClienteId?.nombreOficial || 'Sin cliente vinculado' }}</strong></div>
          <div><span>Casillero</span><strong>{{ paquete.masterClienteId?.codigoCasillero || '—' }}</strong></div>
          <div><span>Ciudad</span><strong>{{ datoReal(paquete.ciudad) || '—' }}</strong></div>
          <div><span>Valor declarado</span><strong>{{ paquete.valorDeclarado ? money(paquete.valorDeclarado) : '—' }}</strong></div>
          <div><span>Origen</span><strong>{{ paquete.origen || '—' }}</strong></div>
          <div><span>Reempaque</span><strong>{{ paquete.reempaque === null ? '—' : paquete.reempaque ? 'Sí' : 'No' }}</strong></div>
          <div class="span-2"><span>Nombre en el manifiesto</span><strong>{{ paquete.consigneeNombre || '—' }}</strong></div>
          <div v-if="paquete.facturaId" class="span-2">
            <span>Factura</span>
            <strong>{{ paquete.facturaId.numeroFactura }} · {{ money(paquete.facturaId.totalGeneral) }} · {{ paquete.facturaId.estado }}</strong>
          </div>
        </div>
      </div>
      <div class="pdm__foot">
        <button type="button" class="btn ghost" @click="emit('close')">Cerrar</button>
        <RouterLink v-if="!paquete.facturaId && paquete.masterClienteId" :to="facturarUrl" class="btn ghost" data-test="ir-facturar">
          <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" /> Facturar
        </RouterLink>
        <button type="button" class="btn primary" data-test="imprimir-una" @click="emit('imprimir', paquete)">
          <i class="fa-solid fa-print" aria-hidden="true" /> Imprimir etiqueta
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;
.pdm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 640px); display: flex; flex-direction: column; overflow: hidden; max-height: 92vh; }
.pdm__head { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.2rem; } p { margin: 0; color: $ink-400; font-size: 0.88rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } } }
.pdm__body { padding: $space-5; overflow-y: auto; }
.pdm__foot { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); .btn { text-decoration: none; } }
.datos { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 560px) { grid-template-columns: 1fr; }
  > div { display: flex; flex-direction: column; gap: 2px; padding: $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); }
  span { color: $ink-400; font-size: 0.74rem; } strong { color: $fg-dark; font-size: 0.92rem; overflow-wrap: anywhere; } .mono { font-variant-numeric: tabular-nums; } .span-2 { grid-column: 1 / -1; } }
</style>
