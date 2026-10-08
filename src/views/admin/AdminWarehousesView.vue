<script setup lang="ts">
/**
 * Warehouses: todas las cajas que entraron, como en Multitrack. Cada fila es un
 * WR; se busca por WR, tracking, master o cliente, se filtra por estado,
 * agencia y fechas, y se imprimen las etiquetas 4×6 de una o de muchas.
 */
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { Warehouse } from '@/services/paquetes.api'
import { formatDate } from '@/utils/format'
import WarehouseDetalleModal from './Warehouses/WarehouseDetalleModal.vue'
import { ESTADO_UI, useWarehouses } from './Warehouses/useWarehouses'

const w = useWarehouses()
const route = useRoute()

/** La bodega factura en su propio panel; el admin, en el suyo. */
const enBodega = computed(() => route.path.startsWith('/bodega'))
const facturarUrl = (p: Warehouse | null) => {
  if (!p) return ''
  const base = enBodega.value ? '/bodega/facturacion' : '/admin/facturacion'
  const q = p.masterClienteId?.codigoCasillero || ''
  return `${base}?q=${encodeURIComponent(q)}&sel=${encodeURIComponent(p.wr)}`
}

const estadoOpciones = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ESTADO_UI).map(([value, e]) => ({ value, label: e.label })),
]
const facturadoOpciones = [
  { value: '', label: 'Con y sin factura' },
  { value: 'no', label: 'Pendientes de facturar' },
  { value: 'si', label: 'Ya facturadas' },
]
const agenciaOpciones = computed(() => [{ value: '', label: 'Todas las agencias' }, ...w.agencias.value.map((a) => ({ value: a, label: a }))])

const seleccionadas = computed(() => [...w.seleccion.value])

onMounted(() => {
  if (typeof route.query.q === 'string') w.filtros.q = route.query.q
  else w.cargar()
})
</script>

<template>
  <div class="wh">
    <header class="head">
      <div>
        <h1>Warehouses</h1>
        <p>Cada caja que entró con su WR. Busca, revisa su detalle e imprime las etiquetas de bodega (4×6).</p>
      </div>
      <div class="stats" aria-live="polite">
        <div><span>Cajas</span><strong>{{ w.total.value }}</strong></div>
        <div><span>Peso</span><strong>{{ w.pesoTotalLb.value.toFixed(2) }} lb</strong></div>
        <div><span>Sin factura</span><strong>{{ w.sinFactura.value }}</strong></div>
      </div>
    </header>

    <section class="panel filtros" aria-label="Filtros">
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input v-model="w.filtros.q" type="search" placeholder="WR, tracking, master, cliente, casillero o descripción…" aria-label="Buscar warehouses" data-test="buscar-wh" />
        <span v-if="w.cargando.value" class="spin"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /></span>
      </div>
      <div class="filtros__fila">
        <AppSelect v-model="w.filtros.estado" :options="estadoOpciones" />
        <AppSelect v-model="w.filtros.agencia" :options="agenciaOpciones" />
        <AppSelect v-model="w.filtros.facturado" :options="facturadoOpciones" />
        <AppDatePicker v-model="w.filtros.desde" placeholder="Desde" :max="w.filtros.hasta || undefined" />
        <AppDatePicker v-model="w.filtros.hasta" placeholder="Hasta" :min="w.filtros.desde || undefined" />
        <button v-if="w.hayFiltros.value" type="button" class="link" @click="w.limpiarFiltros">Quitar filtros</button>
      </div>
    </section>

    <Transition name="bar">
      <div v-if="w.seleccion.value.size" class="seleccion" data-test="barra-seleccion">
        <span><strong>{{ w.seleccion.value.size }}</strong> caja(s) marcadas</span>
        <button type="button" class="link" @click="w.limpiarSeleccion">Limpiar</button>
        <button type="button" class="btn primary" data-test="imprimir-seleccion" @click="w.imprimir(seleccionadas)">
          <i class="fa-solid fa-print" aria-hidden="true" /> Imprimir etiquetas
        </button>
      </div>
    </Transition>

    <section class="panel">
      <div v-if="w.cargando.value && !w.cargado.value" aria-busy="true"><AppSkeleton variant="card" height="52px" :count="6" gap="0.5rem" /></div>
      <p v-else-if="!w.paquetes.value.length" class="empty">
        <i class="fa-solid fa-boxes-stacked" aria-hidden="true" />
        {{ w.hayFiltros.value ? 'Ninguna caja con esos filtros.' : 'Todavía no hay cajas ingresadas.' }}
      </p>
      <div v-else class="tabla-wrap" :class="{ cargando: w.cargando.value }">
        <table class="tabla">
          <thead>
            <tr>
              <th class="chk"><input type="checkbox" :checked="w.todosMarcados.value" aria-label="Marcar toda la página" @change="w.toggleTodos" /></th>
              <th>Warehouse</th>
              <th>Ingreso</th>
              <th>Cliente · agencia</th>
              <th class="num">Peso</th>
              <th>Estado</th>
              <th>Factura</th>
              <th class="acc"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in w.paquetes.value" :key="p._id" :class="{ marcada: w.seleccion.value.has(p._id) }" :data-test="`wh-${p._id}`">
              <td class="chk"><input type="checkbox" :checked="w.seleccion.value.has(p._id)" :aria-label="`Marcar ${p.wr}`" @change="w.toggle(p._id)" /></td>
              <td>
                <button type="button" class="wr" @click="w.abierto.value = p">{{ p.wr || p.sh || p.trackingOriginal }}</button>
                <small>{{ p.mg || '—' }} · {{ p.contenido || 'Sin descripción' }}</small>
              </td>
              <td class="nowrap">{{ formatDate(p.fechaIngreso || p.createdAt) }}</td>
              <td class="cliente">
                <span>{{ p.masterClienteId?.nombreOficial || p.consigneeLimpio || '—' }}</span>
                <small>{{ [p.masterClienteId?.codigoCasillero, p.agencia?.trim()].filter(Boolean).join(' · ') || '—' }}</small>
              </td>
              <td class="num">{{ (Number(p.pesoLb) || 0).toFixed(2) }}</td>
              <td><span class="pill" :class="`pill--${ESTADO_UI[p.estado]?.tono ?? 'neutro'}`">{{ ESTADO_UI[p.estado]?.label ?? p.estado }}</span></td>
              <td class="nowrap">{{ p.facturaId?.numeroFactura || '—' }}</td>
              <td class="acc">
                <button type="button" class="icono" :title="`Imprimir etiqueta de ${p.wr}`" :aria-label="`Imprimir etiqueta de ${p.wr}`" @click="w.imprimir([p._id])">
                  <i class="fa-solid fa-print" aria-hidden="true" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="w.paginas.value > 1" class="pager" aria-label="Páginas">
        <button type="button" class="btn ghost" :disabled="w.page.value <= 1 || w.cargando.value" @click="w.page.value--">Anterior</button>
        <span>Página {{ w.page.value }} de {{ w.paginas.value }}</span>
        <button type="button" class="btn ghost" :disabled="w.page.value >= w.paginas.value || w.cargando.value" @click="w.page.value++">Siguiente</button>
      </nav>
    </section>

    <WarehouseDetalleModal
      :paquete="w.abierto.value"
      :facturar-url="facturarUrl(w.abierto.value)"
      @close="w.abierto.value = null"
      @imprimir="(p) => w.imprimir([p._id])"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.wh { display: flex; flex-direction: column; gap: $space-5; min-width: 0; max-width: 100%; }

.head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; flex-wrap: wrap;
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 60ch; }
}
.stats {
  display: flex; gap: $space-3; flex-wrap: wrap;
  > div { display: flex; flex-direction: column; padding: $space-2 $space-4; border-radius: $radius-md; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); min-width: 96px; }
  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.1rem; font-variant-numeric: tabular-nums; color: $fg-dark; }
}

.panel { display: flex; flex-direction: column; gap: $space-4; padding: $space-5; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; min-width: 0;
  @media (max-width: 640px) { padding: $space-4; } }

.search {
  display: flex; align-items: center; gap: $space-3; padding: 0 $space-4; border-radius: $radius-md; border: 1px solid rgba($ink-500, 0.25); background: $ink-850;
  > i { color: $ink-400; }
  input { flex: 1; min-width: 0; min-height: 48px; border: none; background: transparent; color: $fg-dark; font: inherit; outline: none; }
  &:focus-within { border-color: rgba($brand-orange, 0.5); }
}
.spin { color: $brand-orange; }

.filtros__fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: $space-3; align-items: center; }

.seleccion {
  position: sticky; top: $space-3; z-index: 3;
  display: flex; align-items: center; gap: $space-4; flex-wrap: wrap;
  padding: $space-3 $space-4; border-radius: $radius-lg; border: 1px solid $brand-orange; background: rgba($brand-orange, 0.1);
  > span { flex: 1; color: $fg-dark; }
}

.tabla-wrap { position: relative; width: 100%; max-width: 100%; overflow-x: auto; transition: opacity $dur-fast ease; &.cargando { opacity: 0.55; } }
.tabla {
  width: 100%; border-collapse: collapse; font-size: 0.86rem;
  th { text-align: left; color: $ink-400; font-weight: 600; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; padding: $space-2 $space-3; border-bottom: 1px solid rgba($ink-500, 0.25); white-space: nowrap; }
  td { padding: $space-3; border-bottom: 1px solid rgba($ink-500, 0.12); color: $ink-200; vertical-align: top;
    small { display: block; color: $ink-500; font-size: 0.76rem; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
  tr.marcada td { background: rgba($brand-orange, 0.06); }
  .chk { width: 36px; input { width: 18px; height: 18px; accent-color: $brand-orange; } }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .nowrap { white-space: nowrap; }
  .acc { width: 48px; text-align: right; }
  .cliente { min-width: 170px; }
}
.wr { background: none; border: none; padding: 0; font: inherit; font-weight: 700; color: $fg-dark; cursor: pointer; font-variant-numeric: tabular-nums; &:hover { color: $brand-orange; text-decoration: underline; } }
.icono { width: 36px; height: 36px; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: transparent; color: $ink-300; cursor: pointer; &:hover { color: $brand-orange; border-color: rgba($brand-orange, 0.4); } }

.pill { display: inline-block; padding: 2px 10px; border-radius: $radius-pill; font-size: 0.74rem; font-weight: 700; white-space: nowrap;
  &--ok { background: rgba($signal-green, 0.14); color: $signal-green; }
  &--proceso { background: rgba($signal-amber, 0.16); color: $signal-amber; }
  &--info { background: rgba($brand-orange, 0.14); color: $brand-orange; }
  &--neutro { background: rgba($ink-500, 0.25); color: $ink-300; } }

.pager { display: flex; align-items: center; justify-content: center; gap: $space-4; color: $ink-400; font-size: 0.85rem; }

.empty { display: flex; align-items: center; justify-content: center; gap: $space-3; padding: $space-8; margin: 0; color: $ink-500; font-size: 0.88rem; }
.link { background: none; border: none; padding: 0; color: $brand-orange; font: inherit; font-size: 0.85rem; cursor: pointer; &:hover { text-decoration: underline; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.bar-enter-active, .bar-leave-active { transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo; }
.bar-enter-from, .bar-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) { .bar-enter-active, .bar-leave-active, .tabla-wrap { transition: none; } }
</style>
