<script setup lang="ts">
/**
 * Cuentas por cobrar general: la libreta de cobros de gerencia, sin enlace a
 * facturas ni paquetes. Se llena como una hoja de Excel (cada celda se guarda
 * al salir de ella), con abonos, saldo y estado calculados, y un correo diario
 * con lo que hay que cobrar.
 */
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import AbonoModal from './AbonoModal.vue'
import AlertasModal from './AlertasModal.vue'
import { ESTADOS, TIPOS, dinero, errorDe, hoyEcuador, leerMonto, useCuentasCobrar, type FiltroEstado } from './useCuentasCobrar'
import type { CuentaCobrar, TipoCuentaCobrar } from '@/services/cuentas_cobrar.api'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
const cc = useCuentasCobrar()
const { filtros, totales } = cc

onMounted(cc.cargar)

// ——— Fila nueva ———
const nueva = reactive({ cliente: '', tipo: 'courier' as TipoCuentaCobrar, monto: '', fechaPago: '', fechaCobro: '', asesor: '' })
const creando = ref(false)
const clienteNuevo = ref<HTMLInputElement | null>(null)

async function agregar() {
  const monto = leerMonto(nueva.monto)
  if (!nueva.cliente.trim()) return toast.showNotification('Escribe el cliente.', 'error')
  if (!Number.isFinite(monto) || monto <= 0) return toast.showNotification('Escribe un monto mayor a 0.', 'error')
  creando.value = true
  try {
    await cc.crear({ ...nueva, cliente: nueva.cliente.trim(), asesor: nueva.asesor.trim(), monto: Math.round(monto * 100) / 100 })
    // El tipo y el asesor se quedan: lo normal es cargar varias del mismo.
    Object.assign(nueva, { cliente: '', monto: '', fechaPago: '', fechaCobro: '' })
    if (filtros.estado === 'pagado' || filtros.estado === 'atrasado') filtros.estado = 'porCobrar'
    await nextTick()
    clienteNuevo.value?.focus()
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo agregar la cuenta.'), 'error')
  } finally {
    creando.value = false
  }
}

// ——— Edición en celda ———
function textoCelda(c: CuentaCobrar, campo: 'cliente' | 'asesor' | 'notas', e: Event) {
  const v = (e.target as HTMLInputElement).value.trim()
  if (campo === 'cliente' && !v) {
    ;(e.target as HTMLInputElement).value = c.cliente
    return toast.showNotification('El cliente no puede quedar vacío.', 'error')
  }
  void cc.guardarCampo(c, campo, v)
}

function montoCelda(c: CuentaCobrar, e: Event) {
  const input = e.target as HTMLInputElement
  const n = leerMonto(input.value)
  if (!Number.isFinite(n) || n <= 0) {
    input.value = c.monto.toFixed(2)
    return toast.showNotification('El monto debe ser mayor a 0.', 'error')
  }
  void cc.guardarCampo(c, 'monto', Math.round(n * 100) / 100)
}

const guardandoFila = (c: CuentaCobrar) => [...cc.guardando].some((k) => k.startsWith(`${c._id}:`))
const guardandoCelda = (c: CuentaCobrar, campo: string) => cc.guardando.has(`${c._id}:${campo}`)

// ——— Abonos ———
const abonoDe = ref<string | null>(null)
const cuentaAbono = computed(() => cc.cuentas.value.find((c) => c._id === abonoDe.value) ?? null)

// ——— Eliminar ———
const porEliminar = ref<CuentaCobrar | null>(null)
const eliminando = ref(false)

async function confirmarEliminar() {
  if (!porEliminar.value) return
  eliminando.value = true
  try {
    await cc.eliminar(porEliminar.value)
    porEliminar.value = null
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo eliminar la cuenta.'), 'error')
  } finally {
    eliminando.value = false
  }
}

const alertasAbiertas = ref(false)

const FILTROS_ESTADO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'porCobrar', etiqueta: 'Por cobrar' },
  { valor: 'atrasado', etiqueta: 'Atrasadas' },
  { valor: 'pagado', etiqueta: 'Pagadas' },
  { valor: 'todas', etiqueta: 'Todas' },
]

const hoy = hoyEcuador()
</script>

<template>
  <div class="cc">
    <header class="head">
      <div>
        <h1>Cuentas por cobrar general</h1>
        <p>Anota cada cuenta como en Excel: se guarda sola al salir de la celda. Registra abonos y pagos, y pon la fecha de cobro para que llegue el recordatorio por correo.</p>
      </div>
      <div class="head__acciones">
        <button type="button" class="btn ghost" @click="alertasAbiertas = true">
          <i class="fa-solid fa-envelope" aria-hidden="true" /> Alertas por correo
        </button>
        <button type="button" class="btn ghost" :disabled="!cc.visibles.value.length" @click="cc.exportarCsv">
          <i class="fa-solid fa-file-excel" aria-hidden="true" /> Descargar Excel
        </button>
      </div>
    </header>

    <section class="kpis" aria-label="Totales">
      <div class="kpi">
        <span>Por cobrar</span>
        <strong>{{ dinero(totales.porCobrar) }}</strong>
        <small>{{ totales.cuentasAbiertas }} cuenta{{ totales.cuentasAbiertas === 1 ? '' : 's' }} abierta{{ totales.cuentasAbiertas === 1 ? '' : 's' }}</small>
      </div>
      <button type="button" class="kpi kpi--rojo" :class="{ activo: filtros.estado === 'atrasado' }" @click="filtros.estado = filtros.estado === 'atrasado' ? 'porCobrar' : 'atrasado'">
        <span>Atrasado</span>
        <strong>{{ dinero(totales.atrasado) }}</strong>
        <small>{{ totales.cuentasAtrasadas }} cuenta{{ totales.cuentasAtrasadas === 1 ? '' : 's' }} · ver</small>
      </button>
      <div class="kpi kpi--naranja">
        <span>Cobrar en 7 días</span>
        <strong>{{ dinero(totales.semana) }}</strong>
        <small>{{ totales.cobrarHoy ? `${totales.cobrarHoy} para cobrar hoy` : `${totales.cuentasSemana} cuenta${totales.cuentasSemana === 1 ? '' : 's'}` }}</small>
      </div>
      <div class="kpi kpi--verde">
        <span>Cobrado este mes</span>
        <strong>{{ dinero(totales.cobradoMes) }}</strong>
        <small>abonos y pagos registrados</small>
      </div>
    </section>

    <section class="panel">
      <div class="barra">
        <label class="buscar">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input v-model="filtros.texto" type="search" placeholder="Buscar cliente, asesor o nota" aria-label="Buscar" />
        </label>
        <div class="segmento" role="group" aria-label="Estado">
          <button v-for="f in FILTROS_ESTADO" :key="f.valor" type="button" :class="{ activo: filtros.estado === f.valor }" @click="filtros.estado = f.valor">
            {{ f.etiqueta }}
          </button>
        </div>
        <select v-model="filtros.tipo" class="select" aria-label="Tipo">
          <option value="">Todos los tipos</option>
          <option v-for="t in TIPOS" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
        </select>
        <select v-model="filtros.asesor" class="select" aria-label="Asesor">
          <option value="">Todos los asesores</option>
          <option v-for="a in cc.asesores.value" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>

      <div class="hoja-wrap">
        <table class="hoja">
          <thead>
            <tr>
              <th class="col-cliente">Cliente</th>
              <th>Tipo</th>
              <th class="r">Monto</th>
              <th class="r">Saldo</th>
              <th>Fecha de pago</th>
              <th>Fecha de cobro <i class="fa-solid fa-bell" title="Ese día llega el recordatorio por correo" aria-hidden="true" /></th>
              <th>Status</th>
              <th>Asesor</th>
              <th>Notas</th>
              <th class="col-acciones"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            <!-- Fila para agregar: Enter en cualquier celda la guarda. -->
            <tr class="fila-nueva" @keydown.enter.prevent="agregar">
              <td class="col-cliente">
                <input ref="clienteNuevo" v-model="nueva.cliente" class="celda" placeholder="+ Nuevo cliente" list="cc-clientes" aria-label="Cliente nuevo" data-test="nuevo-cliente" />
              </td>
              <td>
                <select v-model="nueva.tipo" class="celda" aria-label="Tipo">
                  <option v-for="t in TIPOS" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
                </select>
              </td>
              <td><input v-model="nueva.monto" class="celda r" inputmode="decimal" placeholder="$0.00" aria-label="Monto" data-test="nuevo-monto" /></td>
              <td class="r muted">—</td>
              <td><input v-model="nueva.fechaPago" type="date" class="celda" aria-label="Fecha de pago" /></td>
              <td><input v-model="nueva.fechaCobro" type="date" class="celda" aria-label="Fecha de cobro" /></td>
              <td class="muted">—</td>
              <td><input v-model="nueva.asesor" class="celda" placeholder="Asesor" list="cc-asesores" aria-label="Asesor" /></td>
              <td class="muted">—</td>
              <td class="col-acciones">
                <button type="button" class="btn primary sm" :disabled="creando" data-test="agregar-cuenta" @click="agregar">
                  <i class="fa-solid" :class="creando ? 'fa-circle-notch fa-spin' : 'fa-plus'" aria-hidden="true" />
                  {{ creando ? 'Agregando' : 'Agregar' }}
                </button>
              </td>
            </tr>

            <template v-if="cc.cargando.value">
              <tr v-for="i in 5" :key="`sk-${i}`" class="esqueleto-fila">
                <td v-for="j in 10" :key="j"><span class="sk" /></td>
              </tr>
            </template>
            <tr v-else-if="cc.errorCarga.value">
              <td colspan="10" class="vacio error">{{ cc.errorCarga.value }} <button type="button" class="link" @click="cc.cargar">Reintentar</button></td>
            </tr>
            <tr v-else-if="!cc.visibles.value.length">
              <td colspan="10" class="vacio">
                {{ cc.cuentas.value.length ? 'Ninguna cuenta con estos filtros.' : 'Todavía no hay cuentas. Escribe la primera en la fila de arriba y presiona Enter.' }}
              </td>
            </tr>
          </tbody>
          <TransitionGroup tag="tbody" name="cc-fila">
            <tr
              v-for="c in cc.visibles.value"
              v-show="!cc.cargando.value"
              :key="c._id"
              :class="[`es-${c.estado}`, { recien: cc.recien.value === c._id, guardando: guardandoFila(c) }]"
            >
              <td class="col-cliente">
                <input class="celda fuerte" :value="c.cliente" :class="{ ocupada: guardandoCelda(c, 'cliente') }" aria-label="Cliente" @change="textoCelda(c, 'cliente', $event)" />
              </td>
              <td>
                <select class="celda" :value="c.tipo" aria-label="Tipo" @change="cc.guardarCampo(c, 'tipo', ($event.target as HTMLSelectElement).value as TipoCuentaCobrar)">
                  <option v-for="t in TIPOS" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
                </select>
              </td>
              <td>
                <input class="celda r num" :value="c.monto.toFixed(2)" inputmode="decimal" :class="{ ocupada: guardandoCelda(c, 'monto') }" aria-label="Monto" @change="montoCelda(c, $event)" />
              </td>
              <td class="r num saldo">
                {{ dinero(c.saldo) }}
                <small v-if="c.abonado > 0 && c.saldo > 0">abonó {{ dinero(c.abonado) }}</small>
              </td>
              <td>
                <input type="date" class="celda" :value="c.fechaPago" :class="{ vencida: c.estado === 'atrasado' }" aria-label="Fecha de pago" @change="cc.guardarCampo(c, 'fechaPago', ($event.target as HTMLInputElement).value)" />
              </td>
              <td>
                <input type="date" class="celda" :value="c.fechaCobro" :class="{ hoy: c.fechaCobro === hoy && c.saldo > 0 }" aria-label="Fecha de cobro" @change="cc.guardarCampo(c, 'fechaCobro', ($event.target as HTMLInputElement).value)" />
              </td>
              <td>
                <span class="estado" :class="`estado--${c.estado}`">{{ ESTADOS[c.estado] }}</span>
              </td>
              <td>
                <input class="celda" :value="c.asesor" list="cc-asesores" placeholder="—" aria-label="Asesor" @change="textoCelda(c, 'asesor', $event)" />
              </td>
              <td>
                <input class="celda nota" :value="c.notas" placeholder="—" :title="c.notas" aria-label="Notas" @change="textoCelda(c, 'notas', $event)" />
              </td>
              <td class="col-acciones">
                <div class="acciones">
                  <button type="button" class="btn sm abonar" :class="c.saldo > 0 ? 'primary-soft' : 'ghost'" :data-test="`abonar-${c._id}`" @click="abonoDe = c._id">
                    <i class="fa-solid" :class="c.saldo > 0 ? 'fa-hand-holding-dollar' : 'fa-receipt'" aria-hidden="true" />
                    {{ c.saldo > 0 ? 'Abonar' : 'Abonos' }}
                  </button>
                  <button type="button" class="icono" :aria-label="`Eliminar la cuenta de ${c.cliente}`" @click="porEliminar = c">
                    <i class="fa-solid fa-trash-can" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <datalist id="cc-asesores"><option v-for="a in cc.asesores.value" :key="a" :value="a" /></datalist>
      <datalist id="cc-clientes"><option v-for="c in cc.clientes.value" :key="c" :value="c" /></datalist>
    </section>

    <AbonoModal
      :cuenta="cuentaAbono"
      :abonar="(d) => cc.abonar(cuentaAbono!, d)"
      :quitar-abono="(id) => cc.quitarAbono(cuentaAbono!, id)"
      @close="abonoDe = null"
    />
    <AlertasModal :open="alertasAbiertas" @close="alertasAbiertas = false" />
    <AppConfirmModal
      :open="!!porEliminar"
      title="¿Eliminar esta cuenta?"
      :message="
        porEliminar
          ? `Se elimina la cuenta de ${porEliminar.cliente} por ${dinero(porEliminar.monto)}${porEliminar.abonos.length ? ` con sus ${porEliminar.abonos.length} abono(s)` : ''}. No se puede deshacer.`
          : ''
      "
      confirm-label="Sí, eliminar"
      :confirm-loading="eliminando"
      @cancel="porEliminar = null"
      @confirm="confirmarEliminar"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.cc { display: flex; flex-direction: column; gap: $space-5; min-width: 0; max-width: 100%; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; flex-wrap: wrap;
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 70ch; }
  &__acciones { display: flex; gap: $space-2; flex-wrap: wrap; } }

.kpis { display: grid; gap: $space-3; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); }
.kpi { display: flex; flex-direction: column; gap: 2px; padding: $space-4 $space-5; border-radius: $radius-lg; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); text-align: left; font: inherit; color: inherit;
  animation: cc-entrar 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  @for $i from 1 through 4 { &:nth-child(#{$i}) { animation-delay: #{($i - 1) * 50}ms; } }
  span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: $ink-400; }
  strong { font-size: 1.45rem; color: $fg-dark; font-variant-numeric: tabular-nums; }
  small { color: $ink-400; font-size: 0.78rem; }
  &--rojo strong { color: $signal-red; }
  &--naranja strong { color: $brand-orange; }
  &--verde strong { color: $signal-green; } }
button.kpi { cursor: pointer; transition: border-color 0.2s, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  &:hover { border-color: rgba($signal-red, 0.4); transform: translateY(-1px); }
  &.activo { border-color: $signal-red; background: rgba($signal-red, 0.08); } }

.panel { display: flex; flex-direction: column; gap: $space-4; padding: $space-5; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; min-width: 0;
  animation: cc-entrar 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  @media (max-width: 640px) { padding: $space-3; } }

.barra { display: flex; flex-wrap: wrap; gap: $space-2; align-items: center; }
.buscar { flex: 1 1 16rem; display: flex; align-items: center; gap: $space-2; min-height: 40px; padding: 0 $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.2); color: $ink-400;
  input { flex: 1; min-width: 0; border: none; background: transparent; color: $fg-dark; font: inherit; outline: none; }
  &:focus-within { border-color: rgba($brand-orange, 0.5); } }
.segmento { display: inline-flex; padding: 3px; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.2);
  button { border: none; background: transparent; color: $ink-300; font: inherit; font-size: 0.84rem; padding: 6px 12px; border-radius: 9px; cursor: pointer; transition: background 0.2s, color 0.2s;
    &:hover { color: $fg-dark; }
    &.activo { background: $ink-700; color: $fg-dark; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); } } }
.select { min-height: 40px; padding: 0 $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.2); color: $ink-200; font: inherit; font-size: 0.86rem; color-scheme: dark; }

// ——— La hoja ———
.hoja-wrap { overflow-x: auto; margin: 0 (-$space-2); padding: 0 $space-2 $space-2; }
.hoja { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem; min-width: 960px;
  th { position: sticky; top: 0; z-index: 1; background: $ink-900; text-align: left; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: $ink-400; padding: $space-2 $space-2; border-bottom: 1px solid rgba($ink-500, 0.25); white-space: nowrap;
    i { color: $brand-orange; margin-left: 2px; } }
  td { padding: 3px 2px; border-bottom: 1px solid rgba($ink-500, 0.12); vertical-align: middle; transition: background 0.3s; }
  tbody tr:hover td { background: rgba($ink-700, 0.35); }
  .r { text-align: right; }
  .num { font-variant-numeric: tabular-nums; }
  .muted { color: $ink-500; padding: 0 $space-2; } }

.col-cliente { min-width: 11rem; position: sticky; left: 0; z-index: 1; background: $ink-900; }
th.col-cliente { z-index: 2; }
// Abonar y eliminar siempre a la vista, aunque la tabla se desplace.
.col-acciones { width: 1%; white-space: nowrap; position: sticky; right: 0; z-index: 1; background: $ink-900; box-shadow: -12px 0 12px -12px rgba(0, 0, 0, 0.6); }
th.col-acciones { z-index: 2; }
.fila-nueva .col-acciones { background: color-mix(in srgb, $ink-900 96%, $brand-orange); }
tr.recien .col-acciones { background: color-mix(in srgb, $ink-900 88%, $signal-green) !important; }

.celda { width: 100%; min-width: 5.5rem; min-height: 36px; padding: 0 $space-2; border-radius: 7px; border: 1px solid transparent; background: transparent; color: $ink-200; font: inherit; outline: none; color-scheme: dark;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.2s;
  &:hover { border-color: rgba($ink-500, 0.3); }
  &:focus { border-color: rgba($brand-orange, 0.7); background: $ink-850; box-shadow: 0 0 0 3px rgba($brand-orange, 0.15); }
  &::placeholder { color: $ink-500; }
  &.fuerte { color: $fg-dark; font-weight: 600; }
  &.r { text-align: right; }
  &.nota { min-width: 8rem; color: $ink-300; }
  &.ocupada { border-color: rgba($brand-orange, 0.4); background: linear-gradient(90deg, transparent, rgba($brand-orange, 0.08), transparent); background-size: 200% 100%; animation: cc-brillo 1s linear infinite; }
  &.vencida { color: $signal-red; font-weight: 600; }
  &.hoy { color: $brand-orange; font-weight: 700; } }
select.celda { cursor: pointer; }

.saldo { padding: 0 $space-2 !important; color: $fg-dark; font-weight: 700; white-space: nowrap;
  small { display: block; font-weight: 400; color: $signal-green; font-size: 0.72rem; } }

.fila-nueva td { background: rgba($brand-orange, 0.04); border-bottom: 1px solid rgba($brand-orange, 0.25); }
.fila-nueva .col-cliente { background: color-mix(in srgb, $ink-900 96%, $brand-orange); }
.fila-nueva .celda { border-color: rgba($ink-500, 0.2); background: $ink-850; }

.estado { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; white-space: nowrap; transition: background 0.3s, color 0.3s;
  &::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  &--pendiente { background: rgba($ink-500, 0.25); color: $ink-200; }
  &--abonado { background: rgba($signal-blue, 0.15); color: #5fb6e6; }
  &--atrasado { background: rgba($signal-red, 0.15); color: #ff7a7e; }
  &--pagado { background: rgba($signal-green, 0.15); color: $signal-green; } }

tr.es-pagado .celda, tr.es-pagado .saldo { opacity: 0.55; }
tr.recien td { background: rgba($signal-green, 0.1) !important; }
tr.recien .col-cliente { background: color-mix(in srgb, $ink-900 88%, $signal-green) !important; }

.acciones { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.btn.primary-soft { background: rgba($brand-orange, 0.14); color: $brand-orange-soft; border-color: rgba($brand-orange, 0.25);
  &:hover { background: rgba($brand-orange, 0.22); } }
.btn { transition: background 0.2s, border-color 0.2s, transform 0.15s; &:active { transform: scale(0.97); } }
.icono { width: 34px; height: 34px; border-radius: 8px; border: none; background: transparent; color: $ink-500; cursor: pointer; transition: color 0.15s, background 0.15s;
  &:hover { color: $signal-red; background: rgba($signal-red, 0.1); } }

.vacio { text-align: center; padding: $space-8 $space-4 !important; color: $ink-400; animation: cc-aparecer 0.4s ease both;
  &.error { color: #ff6b6b; } }
.esqueleto-fila td { padding: $space-2; }
.sk { display: block; height: 16px; border-radius: 6px; background: linear-gradient(90deg, $ink-800, $ink-700, $ink-800); background-size: 200% 100%; animation: cc-brillo 1.3s linear infinite; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.cc-fila-enter-active { transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.cc-fila-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.cc-fila-enter-from { opacity: 0; transform: translateY(-8px); }
.cc-fila-leave-to { opacity: 0; transform: translateX(16px); }
.cc-fila-move { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes cc-entrar { from { opacity: 0; transform: translateY(10px); } }
@keyframes cc-aparecer { from { opacity: 0; } }
@keyframes cc-brillo { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .kpi, .panel, .vacio { animation: none; }
  .cc-fila-enter-active, .cc-fila-leave-active, .cc-fila-move { transition: none; }
}
</style>
