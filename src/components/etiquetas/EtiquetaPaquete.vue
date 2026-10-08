<script setup lang="ts">
/**
 * Una etiqueta de bodega 4×6 (102 × 152 mm) para pegar en la caja, con el
 * mismo orden que la de Multitrack: marca y WR arriba, consignatario, el WR en
 * grande con su código de barras, destino, peso, tracking y descripción.
 * Va en blanco y negro porque sale por impresora térmica.
 */
import { computed, onMounted, ref, watch } from 'vue'
import JsBarcode from 'jsbarcode'
import logoMark from '@/assets/logo/courierbox-mark.png'
import type { Warehouse } from '@/services/paquetes.api'
import { datoReal, formatoPorId, type FormatoEtiqueta } from './etiqueta-formatos'

const props = defineProps<{
  paquete: Warehouse
  formato: string
  /** El catálogo de Aliados; sin él, los formatos de siempre. */
  formatos?: FormatoEtiqueta[]
}>()

const f = computed(() => formatoPorId(props.formato, props.formatos))
const referencia = computed(() => props.paquete.wr || props.paquete.sh || props.paquete.trackingOriginal || '')
const cliente = computed(() => props.paquete.masterClienteId)
const consignee = computed(() => cliente.value?.nombreOficial || props.paquete.consigneeLimpio || props.paquete.consigneeNombre || '')
const direccion = computed(() => datoReal(props.paquete.direccion) || datoReal(cliente.value?.direccion) || '')
const destino = computed(() => datoReal(props.paquete.ciudad) || 'Ecuador')
const fecha = computed(() => {
  const d = props.paquete.fechaIngreso || props.paquete.createdAt
  if (!d) return ''
  const x = new Date(d)
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
})

const barras = ref<SVGSVGElement | null>(null)
const barrasAbajo = ref<SVGSVGElement | null>(null)

/** Code 128: lo leen todas las pistolas de la bodega y acepta letras y números. */
function dibujar() {
  const valor = referencia.value
  if (!valor) return
  const base = { format: 'CODE128', displayValue: false, margin: 0, background: '#ffffff', lineColor: '#000000' }
  try {
    if (barras.value) JsBarcode(barras.value, valor, { ...base, height: 52, width: 2 })
    if (barrasAbajo.value) JsBarcode(barrasAbajo.value, valor, { ...base, height: 36, width: 2, displayValue: true, fontSize: 12 })
  } catch {
    // Un WR con caracteres raros no debe tumbar la hoja entera: queda sin barras.
  }
}

onMounted(dibujar)
watch([referencia, () => props.formato], () => queueMicrotask(dibujar), { flush: 'post' })
</script>

<template>
  <article class="etq" :data-test="`etiqueta-${paquete._id}`">
    <header class="etq__head">
      <div class="etq__marca">
        <img v-if="f.logoUrl" :src="f.logoUrl" :alt="f.nombre" class="etq__logo etq__logo--aliado" />
        <template v-else-if="f.logoCourierBox">
          <img :src="logoMark" alt="" class="etq__logo" />
          <span class="etq__marca-txt">COURIER<br />BOX</span>
        </template>
        <span v-else class="etq__marca-txt etq__marca-txt--aliado">{{ f.marca }}</span>
      </div>
      <div class="etq__wr-top">
        <span class="rot">WAREHOUSE</span>
        <strong>{{ referencia }}</strong>
        <small v-if="paquete.mg">Master {{ paquete.mg }}</small>
      </div>
      <div class="etq__tipo">
        <span class="rot">TIPO ENVÍO</span>
        <span>Aéreo</span>
      </div>
    </header>

    <section class="etq__consignee">
      <span class="rot">CONSIGNEE</span>
      <strong>{{ consignee }}<template v-if="cliente?.codigoCasillero"> · {{ cliente.codigoCasillero }}</template></strong>
      <span v-if="direccion" class="etq__dir">{{ direccion }}</span>
      <span v-if="paquete.agencia" class="etq__dir">{{ paquete.agencia.trim() }}</span>
    </section>

    <section class="etq__principal">
      <div class="etq__fila-rot">
        <span class="rot">WAREHOUSE</span>
        <span><span class="rot">FECHA</span> {{ fecha }}</span>
      </div>
      <div class="etq__numero">{{ referencia }}</div>
      <svg ref="barras" class="etq__barras" role="img" :aria-label="`Código de barras ${referencia}`" />
    </section>

    <section class="etq__destino">
      <span class="rot">DESTINO</span>
      <strong>{{ destino }}</strong>
    </section>

    <section class="etq__grid">
      <div class="celda celda--peso">
        <span class="rot">PESO</span>
        <strong>{{ (Number(paquete.pesoLb) || 0).toFixed(2) }} lb</strong>
      </div>
      <div class="celda">
        <span class="rot">{{ f.rotuloTracking || 'TRACKING' }}</span>
        <span class="mono">{{ paquete.trackingOriginal || '—' }}</span>
      </div>
      <div class="celda celda--peso">
        <span class="rot">ITEM</span>
        <span class="mono">{{ referencia }}</span>
      </div>
      <div class="celda">
        <span class="rot">DESCRIPCIÓN</span>
      </div>
    </section>
    <p class="etq__desc">{{ paquete.contenido || 'Sin descripción' }}</p>

    <svg v-if="f.barrasAbajo" ref="barrasAbajo" class="etq__barras-abajo" role="img" :aria-label="`Código de barras ${referencia}`" />

    <footer v-if="f.pie.length || f.lema" class="etq__pie">
      <div v-if="f.pie.length" class="etq__pie-lineas">
        <span v-for="l in f.pie" :key="l">{{ l }}</span>
      </div>
      <span v-if="f.lema" class="etq__lema">{{ f.lema }}</span>
    </footer>
  </article>
</template>

<style scoped lang="scss">
// Medidas en mm: la hoja es de etiqueta, no de pantalla.
.etq {
  box-sizing: border-box;
  width: 102mm;
  height: 152mm;
  padding: 4mm 5mm;
  display: flex;
  flex-direction: column;
  gap: 1.6mm;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  line-height: 1.2;
  overflow: hidden;
  page-break-after: always;
  break-after: page;

  * { box-sizing: border-box; }
}

.rot { font-weight: 700; font-size: 8pt; letter-spacing: 0.02em; }
.mono { font-family: 'Courier New', monospace; font-size: 8pt; word-break: break-all; }

.etq__head {
  display: grid;
  grid-template-columns: 1.3fr 1.4fr 0.8fr;
  border-bottom: 0.5mm solid #000;
  padding-bottom: 1.5mm;
  min-height: 17mm;

  > div + div { border-left: 0.3mm solid #000; padding-left: 2mm; }
}
.etq__marca { display: flex; align-items: center; gap: 1.5mm; }
.etq__logo { width: 11mm; height: 11mm; object-fit: contain; filter: grayscale(1) contrast(1.6); }
.etq__logo--aliado { width: 100%; max-width: 30mm; height: 14mm; object-position: left center; }
.etq__marca-txt { font-weight: 900; font-size: 11pt; line-height: 0.95; letter-spacing: -0.02em; }
.etq__marca-txt--aliado { font-size: 12pt; line-height: 1.05; }
.etq__wr-top { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  strong { font-size: 11pt; } small { font-size: 7pt; } }
.etq__tipo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; font-size: 8pt; }

.etq__consignee { display: flex; flex-direction: column; gap: 0.6mm;
  strong { font-size: 10pt; font-weight: 600; text-transform: uppercase; }
  .etq__dir { font-size: 8.5pt; text-transform: uppercase; } }

.etq__principal { border-top: 0.3mm solid #000; padding-top: 1.2mm; display: flex; flex-direction: column; align-items: center; }
.etq__fila-rot { align-self: stretch; display: flex; gap: 6mm; }
.etq__numero { font-size: 30pt; font-weight: 900; letter-spacing: -0.02em; line-height: 1; margin: 1mm 0; }
.etq__barras { width: 78mm; height: 14mm; }

.etq__destino { border-top: 0.3mm solid #000; padding-top: 1mm; display: flex; flex-direction: column;
  strong { text-align: center; font-size: 17pt; font-weight: 400; } }

.etq__grid {
  display: grid;
  grid-template-columns: 30mm 1fr;
  border-top: 0.3mm solid #000;
  border-bottom: 0.3mm solid #000;

  .celda { display: flex; flex-direction: column; gap: 0.6mm; padding: 1mm 1.5mm; min-height: 9mm; }
  .celda:nth-child(odd) { border-right: 0.3mm solid #000; padding-left: 0; }
  .celda:nth-child(-n + 2) { border-bottom: 0.3mm solid #000; }
  .celda:nth-child(even) { align-items: center; text-align: center; }
}

.etq__desc { margin: 0; text-align: center; font-size: 9pt; flex: 1; min-height: 0; overflow: hidden; }
.etq__barras-abajo { width: 86mm; height: 13mm; align-self: center; }

.etq__pie { border-top: 0.3mm solid #000; padding-top: 1mm; display: flex; flex-direction: column; gap: 1mm; }
.etq__pie-lineas { display: flex; justify-content: space-between; font-weight: 700; font-size: 8.5pt; }
.etq__lema { text-align: center; font-size: 9pt; }
</style>
