<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import ClienteQuickCreate from './ClienteQuickCreate.vue'
import { useToastStore } from '@/stores/toast.store'
import type { ClienteLite, useVentasProductos } from './useVentasProductos'

const props = defineProps<{ vp: ReturnType<typeof useVentasProductos> }>()
const toast = useToastStore()
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`

const clienteQuery = ref('')
const mostrarResultados = ref(false)
const saving = ref(false)
const mostrarNuevoCliente = ref(false)

/** The search needs 2+ chars, so anything shorter is "not searched yet". */
const busquedaActiva = computed(() => clienteQuery.value.trim().length >= 2)
const sinResultados = computed(
  () => busquedaActiva.value && !props.vp.buscandoCliente && props.vp.clientesResultados.length === 0,
)

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito', 'Abono + crédito', 'Otro']

function onClienteInput() {
  mostrarResultados.value = true
  props.vp.buscarCliente(clienteQuery.value)
}
function onClienteBlur() {
  mostrarResultados.value = false
  // Typing a name that was never picked from the list used to leave the form
  // looking valid while clienteId stayed empty; clear it so the operator sees
  // the client is not linked yet.
  if (props.vp.ventaForm.clienteNombre !== clienteQuery.value) {
    props.vp.ventaForm.clienteId = ''
    props.vp.ventaForm.clienteNombre = ''
    props.vp.ventaForm.clienteEmail = ''
  }
}
function elegirCliente(c: ClienteLite) {
  props.vp.ventaForm.clienteId = c._id
  props.vp.ventaForm.clienteNombre = c.nombreOficial
  props.vp.ventaForm.clienteEmail = c.email || ''
  clienteQuery.value = c.nombreOficial
  mostrarResultados.value = false
}
function onClienteCreado(c: ClienteLite) {
  elegirCliente(c)
  mostrarNuevoCliente.value = false
}
function onVendedorChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  const v = props.vp.vendedores.find((x) => x._id === id)
  props.vp.ventaForm.vendedorId = id
  props.vp.ventaForm.vendedorNombre = v ? v.name || v.email : ''
}

function addCuota() {
  props.vp.ventaForm.cuotas.push({ fecha: new Date().toISOString().slice(0, 10), monto: 0 })
}
function removeCuota(i: number) {
  props.vp.ventaForm.cuotas.splice(i, 1)
}

async function guardar() {
  const f = props.vp.ventaForm
  if (!f.productoId) return toast.showNotification('Escoge un producto', 'error')
  if (!f.clienteNombre) return toast.showNotification('Escoge un cliente', 'error')
  if (props.vp.total <= 0) return toast.showNotification('El total debe ser mayor a 0', 'error')
  if (f.esCredito && props.vp.cuotasSuman > props.vp.saldoCredito + 0.01)
    return toast.showNotification('Las cuotas superan el saldo a crédito', 'error')
  saving.value = true
  try {
    const res = await props.vp.crearVenta()
    clienteQuery.value = ''
    const c = res?.correos
    const extra = c ? ` · Correo admin: ${c.admin ? 'ok' : 'no'}, cliente: ${c.cliente ? 'ok' : 'no'}` : ''
    toast.showNotification(`Venta registrada${extra}`, 'success')
  } catch (e: any) {
    toast.showNotification(e.message || 'Error al guardar la venta', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="panel">
    <h3>Registrar venta</h3>
    <div class="form-grid">
      <label>
        <span>Vendedor</span>
        <select class="field-input" :value="vp.ventaForm.vendedorId" @change="onVendedorChange">
          <option value="">Selecciona…</option>
          <option v-for="v in vp.vendedores" :key="v._id" :value="v._id">{{ v.name || v.email }}</option>
        </select>
      </label>

      <label class="cliente-field">
        <span>Cliente</span>
        <input
          v-model="clienteQuery"
          class="field-input"
          placeholder="Buscar por nombre, casillero o cédula"
          autocomplete="off"
          @input="onClienteInput"
          @focus="mostrarResultados = true"
          @blur="onClienteBlur"
        />
        <ul v-if="mostrarResultados && (vp.clientesResultados.length || sinResultados)" class="cliente-drop">
          <li v-for="c in vp.clientesResultados" :key="c._id" @mousedown.prevent="elegirCliente(c)">
            <strong>{{ c.nombreOficial }}</strong>
            <em>{{ c.codigoCasillero }} · {{ c.email || 'sin email' }}</em>
          </li>
          <li v-if="sinResultados" class="empty" @mousedown.prevent="mostrarNuevoCliente = true">
            <strong>Sin resultados para «{{ clienteQuery.trim() }}»</strong>
            <em>+ Crear este cliente</em>
          </li>
        </ul>
        <button type="button" class="link-btn nuevo-cliente" @click="mostrarNuevoCliente = true">
          + Nuevo cliente
        </button>
      </label>

      <label>
        <span>Producto</span>
        <select v-model="vp.ventaForm.productoId" class="field-input">
          <option value="">Selecciona…</option>
          <option v-for="p in vp.inventario" :key="p._id" :value="p._id">{{ p.nombre }} — {{ money(p.precio) }}</option>
        </select>
      </label>

      <label><span>Cantidad</span><input v-model.number="vp.ventaForm.cantidad" type="number" min="1" step="1" class="field-input" /></label>

      <label>
        <span>Precio</span>
        <div class="segmented">
          <button type="button" :class="{ on: vp.ventaForm.precioModo === 'automatico' }" @click="vp.ventaForm.precioModo = 'automatico'">Automático</button>
          <button type="button" :class="{ on: vp.ventaForm.precioModo === 'manual' }" @click="vp.ventaForm.precioModo = 'manual'">Manual</button>
        </div>
      </label>
      <label>
        <span>Precio unitario $</span>
        <input v-model.number="vp.ventaForm.precioUnitario" type="number" min="0" step="0.01" class="field-input" :disabled="vp.ventaForm.precioModo === 'automatico'" :placeholder="String(vp.precioAplicado.toFixed(2))" />
      </label>

      <label>
        <span>Método de entrega</span>
        <div class="segmented">
          <button type="button" :class="{ on: vp.ventaForm.metodoEntrega === 'retiro_oficina' }" @click="vp.ventaForm.metodoEntrega = 'retiro_oficina'">Retiro en oficina</button>
          <button type="button" :class="{ on: vp.ventaForm.metodoEntrega === 'envio' }" @click="vp.ventaForm.metodoEntrega = 'envio'">Envío</button>
        </div>
      </label>
      <label v-if="vp.envioAplica"><span>Valor de envío $</span><input v-model.number="vp.ventaForm.valorEnvio" type="number" min="0" step="0.01" class="field-input" /></label>

      <label>
        <span>Método de pago</span>
        <select v-model="vp.ventaForm.metodoPago" class="field-input">
          <option value="">Selecciona…</option>
          <option v-for="m in METODOS_PAGO" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
      <label class="check-field"><input v-model="vp.ventaForm.pagoConfirmado" type="checkbox" /><span>Pago confirmado</span></label>
    </div>

    <!-- Credit / installments -->
    <div class="credito-block">
      <label class="check-field big"><input v-model="vp.ventaForm.esCredito" type="checkbox" /><span>Venta con abono y saldo a crédito</span></label>
      <div v-if="vp.ventaForm.esCredito" class="credito-body">
        <div class="credito-top">
          <label><span>Abono inicial $</span><input v-model.number="vp.ventaForm.abono" type="number" min="0" step="0.01" class="field-input" /></label>
          <div class="saldo-chip"><span>Saldo a crédito</span><strong>{{ money(vp.saldoCredito) }}</strong></div>
        </div>
        <p class="hint">Define en qué fechas se paga el saldo. Cada fecha genera un recordatorio de cobro en el panel.</p>
        <div v-for="(c, i) in vp.ventaForm.cuotas" :key="i" class="cuota-row">
          <AppDatePicker v-model="c.fecha" label="Fecha" />
          <label><span>Monto $</span><input v-model.number="c.monto" type="number" min="0" step="0.01" class="field-input" /></label>
          <button type="button" class="link-btn danger" @click="removeCuota(i)">Quitar</button>
        </div>
        <div class="cuotas-foot">
          <button type="button" class="link-btn" @click="addCuota">+ Agregar fecha de pago</button>
          <span :class="{ warn: vp.cuotasSuman > vp.saldoCredito + 0.01 }">Cuotas: {{ money(vp.cuotasSuman) }} / {{ money(vp.saldoCredito) }}</span>
        </div>
      </div>
    </div>

    <label class="full obs"><span>Observación</span><textarea v-model="vp.ventaForm.observacion" rows="2" class="field-input" /></label>

    <div class="form-footer">
      <div class="totales">
        <span>Subtotal {{ money(vp.subtotal) }}</span>
        <strong>Total {{ money(vp.total) }}</strong>
      </div>
      <button class="btn-primary" :disabled="saving" @click="guardar">{{ saving ? 'Guardando…' : 'Guardar venta' }}</button>
    </div>
    <ClienteQuickCreate
      :show="mostrarNuevoCliente"
      :vp="vp"
      :nombre-inicial="clienteQuery"
      @close="mostrarNuevoCliente = false"
      @creado="onClienteCreado"
    />

    <p class="mail-note">Al guardar se envía un correo al admin (con costo y comisión) y un resumen al cliente (sin costo ni comisión).</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.panel { background: rgba($ink-900, .7); border: 1px solid rgba($ink-500, .12); border-radius: 20px; padding: $space-5; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-3; margin: $space-4 0; align-items: end; }
.full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 4px; font-size: .85rem; }
label > span { color: $ink-400; }
.cliente-field { position: relative; }
.cliente-drop {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 20; margin: 4px 0 0; padding: 4px; list-style: none;
  background: $ink-900; border: 1px solid rgba($ink-500, .25); border-radius: 12px; max-height: 240px; overflow-y: auto;
  box-shadow: 0 16px 40px rgba(0,0,0,.5);
}
.cliente-drop li { padding: $space-2 $space-3; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; }
.cliente-drop li:hover { background: rgba($brand-orange, .12); }
.cliente-drop em { color: $ink-400; font-style: normal; font-size: .75rem; }
.cliente-drop li.empty em { color: $brand-orange; }
.nuevo-cliente { align-self: flex-start; margin-top: 2px; padding: 0; }
.segmented { display: flex; gap: 4px; background: rgba($ink-700, .4); border-radius: 10px; padding: 3px; }
.segmented button { flex: 1; padding: $space-2; background: transparent; border: none; border-radius: 8px; color: $ink-300; cursor: pointer; font-size: .82rem; }
.segmented button.on { background: $brand-orange; color: $ink-1000; font-weight: 600; }
.check-field { flex-direction: row; align-items: center; gap: $space-2; }
.check-field.big { font-size: .95rem; margin-top: $space-2; }
.credito-block { border-top: 1px solid rgba($ink-500, .12); padding-top: $space-4; margin-top: $space-2; }
.credito-body { margin-top: $space-3; display: flex; flex-direction: column; gap: $space-3; }
.credito-top { display: flex; gap: $space-4; align-items: end; flex-wrap: wrap; }
.saldo-chip { display: flex; flex-direction: column; gap: 2px; }
.saldo-chip strong { color: $brand-orange; font-size: 1.2rem; }
.hint { color: $ink-400; font-size: .8rem; margin: 0; }
.cuota-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: $space-3; align-items: end; }
.cuotas-foot { display: flex; justify-content: space-between; align-items: center; }
.cuotas-foot .warn { color: #f87171; }
.obs { margin-top: $space-3; }
.link-btn { background: none; border: none; color: $brand-orange; cursor: pointer; font-size: .82rem; }
.link-btn.danger { color: #f87171; }
.form-footer { display: flex; justify-content: space-between; align-items: center; gap: $space-4; margin-top: $space-4; flex-wrap: wrap; }
.totales { display: flex; gap: $space-4; align-items: baseline; }
.totales span { color: $ink-400; }
.totales strong { font-size: 1.4rem; color: $brand-orange; }
.mail-note { color: $ink-500; font-size: .75rem; margin: $space-2 0 0; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cuota-row { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
