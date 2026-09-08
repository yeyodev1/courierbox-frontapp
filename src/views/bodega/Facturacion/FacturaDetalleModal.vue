<script setup lang="ts">
/** Una factura abierta: a quién salió, sus cajas, el desglose, el SRI y el pago. */
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { FacturaDetalle } from '@/services/facturacion.api'
import { formatDate, formatDateTime } from '@/utils/format'
import { money, SRI_UI } from './useFacturacion'

defineProps<{
  open: boolean
  factura: FacturaDetalle | null
  cargando: boolean
  sincronizando: boolean
  whatsappUrl: string
}>()

const emit = defineEmits<{ close: []; sri: [] }>()

const ESTADO_PAGO: Record<string, { label: string; tono: string }> = {
  pendiente: { label: 'Pendiente de pago', tono: 'proceso' },
  verificando: { label: 'Pago por verificar', tono: 'proceso' },
  pagada: { label: 'Pagada', tono: 'ok' },
  cancelada: { label: 'Anulada', tono: 'error' },
}
</script>

<template>
  <AppOverlay :open="open" label="Detalle de factura" @close="emit('close')">
    <div class="fdm" data-test="factura-detalle">
      <div v-if="cargando || !factura" class="fdm__body"><AppSkeleton variant="card" height="80px" :count="4" gap="0.75rem" /></div>
      <template v-else>
        <div class="fdm__head" :class="`tono-${SRI_UI[factura.estadoSri]?.tono ?? 'neutro'}`">
          <div>
            <span class="eyebrow">Factura electrónica · {{ formatDate(factura.createdAt) }}</span>
            <h3>{{ factura.numeroFactura }}</h3>
            <div class="pills">
              <span class="sri-pill" :class="`sri-pill--${SRI_UI[factura.estadoSri]?.tono ?? 'neutro'}`">{{ SRI_UI[factura.estadoSri]?.label ?? factura.estadoSri }}</span>
              <span class="sri-pill" :class="`sri-pill--${ESTADO_PAGO[factura.estado]?.tono ?? 'neutro'}`">{{ ESTADO_PAGO[factura.estado]?.label ?? factura.estado }}</span>
            </div>
          </div>
          <button type="button" class="close" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
        </div>

        <div class="fdm__body">
          <section class="bloque">
            <h4>A nombre de</h4>
            <div class="datos">
              <div><span>Nombre</span><strong>{{ factura.facturadoA?.razonSocial || factura.masterClienteId?.nombreOficial || '—' }}</strong></div>
              <div><span>Identificación</span><strong>{{ factura.facturadoA?.identificacion || factura.masterClienteId?.cedulaRuc || (factura.totalGeneral <= 50 ? 'Consumidor final' : '—') }}</strong></div>
              <div><span>Correo</span><strong>{{ factura.facturadoA?.email || factura.masterClienteId?.email || '—' }}</strong></div>
              <div><span>Cliente / casillero</span><strong>{{ factura.masterClienteId?.nombreOficial || '—' }} · {{ factura.masterClienteId?.codigoCasillero || '—' }}</strong></div>
            </div>
          </section>

          <section class="bloque">
            <h4>Cajas ({{ factura.paquetes.length }})</h4>
            <table class="cajas">
              <thead><tr><th>Caja</th><th>Contenido</th><th>Ingreso</th><th class="num">Peso</th></tr></thead>
              <tbody>
                <tr v-for="p in factura.paquetes" :key="p._id">
                  <td><strong>{{ p.wr || p.sh }}</strong><small v-if="p.trackingOriginal">{{ p.trackingOriginal }}</small></td>
                  <td>{{ p.contenido || '—' }}</td>
                  <td>{{ p.fechaIngreso ? formatDate(p.fechaIngreso) : '—' }}<small v-if="p.agencia">{{ p.agencia }}</small></td>
                  <td class="num">{{ (Number(p.pesoLb) || 0).toFixed(2) }} lb</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="bloque">
            <h4>Desglose</h4>
            <dl class="desglose">
              <div><dt>Peso total</dt><dd>{{ factura.pesoTotalLb.toFixed(2) }} lb</dd></div>
              <div><dt>Flete</dt><dd>{{ money(factura.totalFlete) }}</dd></div>
              <div><dt>Arancel</dt><dd>{{ money(factura.totalArancel) }}</dd></div>
              <div><dt>IVA</dt><dd>{{ money(factura.iva) }}</dd></div>
              <div class="total"><dt>Total</dt><dd>{{ money(factura.totalGeneral) }}</dd></div>
            </dl>
          </section>

          <section class="bloque">
            <h4>SRI y Contifico</h4>
            <div class="datos">
              <div><span>Estado</span><strong>{{ SRI_UI[factura.estadoSri]?.label ?? factura.estadoSri }}</strong></div>
              <div><span>Autorización</span><strong class="mono">{{ factura.autorizacionSri || '—' }}</strong></div>
              <div><span>Autorizada</span><strong>{{ factura.autorizadaEn ? formatDateTime(factura.autorizadaEn) : '—' }}</strong></div>
              <div><span>Última consulta</span><strong>{{ factura.sriRevisadoEn ? formatDateTime(factura.sriRevisadoEn) : '—' }}</strong></div>
              <div v-if="factura.mensajeSri && factura.estadoSri !== 'autorizado'" class="span-2"><span>Mensaje</span><strong>{{ factura.mensajeSri }}</strong></div>
            </div>
          </section>

          <section class="bloque">
            <h4>Pago</h4>
            <div class="datos">
              <div><span>Estado</span><strong>{{ ESTADO_PAGO[factura.estado]?.label ?? factura.estado }}</strong></div>
              <div><span>Referencia</span><strong>{{ factura.referenciaPago || '—' }}</strong></div>
              <div><span>Pagada</span><strong>{{ factura.pagadaEn ? formatDateTime(factura.pagadaEn) : '—' }}</strong></div>
              <div><span>Comprobante</span><strong><a v-if="factura.comprobanteUrl" :href="factura.comprobanteUrl" target="_blank" rel="noopener">Ver comprobante</a><template v-else>—</template></strong></div>
            </div>
          </section>
        </div>

        <div class="fdm__foot">
          <a v-if="factura.pdfUrl" class="btn ghost" :href="factura.pdfUrl" target="_blank" rel="noopener" data-test="detalle-pdf"><i class="fa-solid fa-file-pdf" aria-hidden="true" /> RIDE (PDF)</a>
          <a v-if="factura.xmlUrl" class="btn ghost" :href="factura.xmlUrl" target="_blank" rel="noopener"><i class="fa-solid fa-file-code" aria-hidden="true" /> XML</a>
          <button v-if="factura.estadoSri !== 'autorizado' && factura.estadoSri !== 'simulado'" type="button" class="btn ghost" :disabled="sincronizando" @click="emit('sri')"><i class="fa-solid fa-rotate" :class="{ 'fa-spin': sincronizando }" aria-hidden="true" /> Consultar SRI</button>
          <a class="btn wa" :href="whatsappUrl" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp</a>
        </div>
      </template>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.fdm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 760px); max-height: calc(100svh - 2rem); display: flex; flex-direction: column; overflow: hidden; }
.fdm__head { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15); border-top: 4px solid $ink-500;
  &.tono-ok { border-top-color: $signal-green; } &.tono-proceso { border-top-color: $signal-amber; } &.tono-error { border-top-color: $signal-red; }
  .eyebrow { display: block; color: $ink-400; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
  h3 { margin: 0 0 $space-2; font-size: 1.35rem; font-variant-numeric: tabular-nums; }
  .pills { display: flex; gap: $space-2; flex-wrap: wrap; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } }
}
.fdm__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: $space-5; display: flex; flex-direction: column; gap: $space-5; }
.fdm__foot { display: flex; justify-content: flex-end; gap: $space-3; flex-wrap: wrap; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); .btn { text-decoration: none; } .wa { background: rgba(37, 211, 102, 0.14); border-color: rgba(37, 211, 102, 0.4); color: #4ce08a; } }
.bloque { display: flex; flex-direction: column; gap: $space-3; h4 { margin: 0; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em; color: $ink-400; } }
.datos { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 560px) { grid-template-columns: 1fr; }
  > div { display: flex; flex-direction: column; gap: 2px; padding: $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); }
  span { color: $ink-400; font-size: 0.74rem; } strong { color: $fg-dark; font-size: 0.92rem; overflow-wrap: anywhere; } .mono { font-variant-numeric: tabular-nums; font-size: 0.8rem; } .span-2 { grid-column: 1 / -1; } a { color: $brand-orange; } }
.cajas { width: 100%; border-collapse: collapse; font-size: 0.88rem;
  th, td { padding: $space-2 $space-3; text-align: left; border-bottom: 1px solid rgba($ink-500, 0.15); vertical-align: top; }
  th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: $ink-400; }
  td strong { display: block; color: $fg-dark; } td small { display: block; color: $ink-500; font-size: 0.74rem; } .num { text-align: right; white-space: nowrap; } }
.desglose { display: flex; flex-wrap: wrap; gap: $space-4; margin: 0; > div { display: flex; flex-direction: column; gap: 2px; } dt { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; } dd { margin: 0; color: $ink-100; font-variant-numeric: tabular-nums; } .total dd { color: $brand-orange; font-weight: 700; font-size: 1.2rem; } }
.sri-pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: $radius-pill; font-size: 0.74rem; font-weight: 700;
  &--ok { background: rgba($signal-green, 0.14); color: $signal-green; } &--proceso { background: rgba($signal-amber, 0.16); color: $signal-amber; } &--error { background: rgba($signal-red, 0.16); color: $signal-red; } &--neutro { background: rgba($ink-500, 0.25); color: $ink-300; } }
</style>
