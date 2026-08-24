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
const clienteElegido = computed(() => Boolean(props.vp.ventaForm.clienteId))

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
function limpiarCliente() {
  clienteQuery.value = ''
  props.vp.ventaForm.clienteId = ''
  props.vp.ventaForm.clienteNombre = ''
  props.vp.ventaForm.clienteEmail = ''
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
    <div class="panel-head">
      <div>
        <h3>Registrar venta</h3>
        <p>Producto, cliente y condiciones de pago de una sola venta.</p>
      </div>
    </div>

    <!-- Quién vende, a quién y qué -->
    <p class="group-label">Venta</p>
    <div class="form-grid">
      <label class="field">
        <span>Vendedor</span>
        <select class="field-input" :value="vp.ventaForm.vendedorId" @change="onVendedorChange">
          <option value="">Selecciona…</option>
          <option v-for="v in vp.vendedores" :key="v._id" :value="v._id">{{ v.name || v.email }}</option>
        </select>
      </label>

      <label class="field cliente-field">
        <span>Cliente</span>
        <div class="cliente-control" :class="{ elegido: clienteElegido }">
          <i class="fa-solid fa-magnifying-glass" />
          <input
            v-model="clienteQuery"
            class="field-input"
            placeholder="Nombre, casillero o cédula"
            autocomplete="off"
            @input="onClienteInput"
            @focus="mostrarResultados = true"
            @blur="onClienteBlur"
          />
          <button v-if="clienteQuery" type="button" class="clear-btn" aria-label="Limpiar cliente" @mousedown.prevent="limpiarCliente">
            <i class="fa-solid fa-xmark" />
          </button>

          <ul v-if="mostrarResultados && (vp.clientesResultados.length || sinResultados)" class="cliente-drop">
            <li v-for="c in vp.clientesResultados" :key="c._id" @mousedown.prevent="elegirCliente(c)">
              <strong>{{ c.nombreOficial }}</strong>
              <em>{{ c.codigoCasillero }} · {{ c.email || 'sin email' }}</em>
            </li>
            <li v-if="sinResultados" class="drop-empty" @mousedown.prevent="mostrarNuevoCliente = true">
              <strong>Sin resultados para «{{ clienteQuery.trim() }}»</strong>
              <em><i class="fa-solid fa-user-plus" /> Crear este cliente</em>
            </li>
          </ul>
        </div>

        <span v-if="clienteElegido" class="field-hint ok">
          <i class="fa-solid fa-circle-check" /> Cliente vinculado
        </span>
        <button v-else type="button" class="link-btn" @click="mostrarNuevoCliente = true">
          <i class="fa-solid fa-plus" /> Nuevo cliente
        </button>
      </label>

      <label class="field">
        <span>Producto</span>
        <select v-model="vp.ventaForm.productoId" class="field-input">
          <option value="">Selecciona…</option>
          <option v-for="p in vp.inventario" :key="p._id" :value="p._id">{{ p.nombre }} — {{ money(p.precio) }}</option>
        </select>
      </label>

      <label class="field">
        <span>Cantidad</span>
        <input v-model.number="vp.ventaForm.cantidad" type="number" min="1" step="1" class="field-input" />
      </label>

      <label class="field">
        <span>Precio</span>
        <div class="segmented">
          <button type="button" :class="{ on: vp.ventaForm.precioModo === 'automatico' }" @click="vp.ventaForm.precioModo = 'automatico'">Automático</button>
          <button type="button" :class="{ on: vp.ventaForm.precioModo === 'manual' }" @click="vp.ventaForm.precioModo = 'manual'">Manual</button>
        </div>
      </label>

      <label class="field">
        <span>Precio unitario $</span>
        <input
          v-model.number="vp.ventaForm.precioUnitario"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
          :disabled="vp.ventaForm.precioModo === 'automatico'"
          :placeholder="String(vp.precioAplicado.toFixed(2))"
        />
        <span v-if="vp.ventaForm.precioModo === 'automatico'" class="field-hint">Tomado del inventario</span>
      </label>
    </div>

    <!-- Cómo se entrega y cómo se cobra -->
    <p class="group-label">Entrega y pago</p>
    <div class="form-grid">
      <label class="field">
        <span>Método de entrega</span>
        <div class="segmented">
          <button type="button" :class="{ on: vp.ventaForm.metodoEntrega === 'retiro_oficina' }" @click="vp.ventaForm.metodoEntrega = 'retiro_oficina'">Retiro en oficina</button>
          <button type="button" :class="{ on: vp.ventaForm.metodoEntrega === 'envio' }" @click="vp.ventaForm.metodoEntrega = 'envio'">Envío</button>
        </div>
      </label>

      <label v-if="vp.envioAplica" class="field">
        <span>Valor de envío $</span>
        <input v-model.number="vp.ventaForm.valorEnvio" type="number" min="0" step="0.01" class="field-input" />
      </label>

      <label class="field">
        <span>Método de pago</span>
        <select v-model="vp.ventaForm.metodoPago" class="field-input">
          <option value="">Selecciona…</option>
          <option v-for="m in METODOS_PAGO" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>

      <label class="field">
        <span>Estado del pago</span>
        <div class="check-field" :class="{ on: vp.ventaForm.pagoConfirmado }">
          <input v-model="vp.ventaForm.pagoConfirmado" type="checkbox" />
          <span>Pago confirmado</span>
        </div>
      </label>
    </div>

    <!-- Crédito y cuotas -->
    <div class="credito-block" :class="{ abierto: vp.ventaForm.esCredito }">
      <label class="check-field wide" :class="{ on: vp.ventaForm.esCredito }">
        <input v-model="vp.ventaForm.esCredito" type="checkbox" />
        <span>Venta con abono y saldo a crédito</span>
      </label>

      <div v-if="vp.ventaForm.esCredito" class="credito-body">
        <div class="credito-top">
          <label class="field abono">
            <span>Abono inicial $</span>
            <input v-model.number="vp.ventaForm.abono" type="number" min="0" step="0.01" class="field-input" />
          </label>
          <div class="saldo-chip">
            <span>Saldo a crédito</span>
            <strong>{{ money(vp.saldoCredito) }}</strong>
          </div>
        </div>

        <p class="hint">Define en qué fechas se paga el saldo. Cada fecha genera un recordatorio de cobro en el panel.</p>

        <div v-for="(c, i) in vp.ventaForm.cuotas" :key="i" class="cuota-row">
          <AppDatePicker v-model="c.fecha" label="Fecha" />
          <label class="field">
            <span>Monto $</span>
            <input v-model.number="c.monto" type="number" min="0" step="0.01" class="field-input" />
          </label>
          <button type="button" class="link-btn danger" @click="removeCuota(i)">
            <i class="fa-solid fa-trash-can" /> Quitar
          </button>
        </div>

        <div class="cuotas-foot">
          <button type="button" class="link-btn" @click="addCuota"><i class="fa-solid fa-plus" /> Agregar fecha de pago</button>
          <span class="cuotas-suma" :class="{ warn: vp.cuotasSuman > vp.saldoCredito + 0.01 }">
            Cuotas: <strong>{{ money(vp.cuotasSuman) }}</strong> / {{ money(vp.saldoCredito) }}
          </span>
        </div>
      </div>
    </div>

    <label class="field obs">
      <span>Observación</span>
      <textarea v-model="vp.ventaForm.observacion" rows="2" class="field-input" placeholder="Notas internas de esta venta (opcional)" />
    </label>

    <footer class="form-footer">
      <div class="totales">
        <div class="tot-line"><span>Subtotal</span><strong>{{ money(vp.subtotal) }}</strong></div>
        <div v-if="vp.envioAplica" class="tot-line"><span>Envío</span><strong>{{ money(vp.ventaForm.valorEnvio) }}</strong></div>
        <div class="tot-line total"><span>Total</span><strong>{{ money(vp.total) }}</strong></div>
      </div>
      <div class="footer-cta">
        <button class="btn-primary" :disabled="saving" @click="guardar">
          <i v-if="!saving" class="fa-solid fa-floppy-disk" />
          {{ saving ? 'Guardando…' : 'Guardar venta' }}
        </button>
        <p class="mail-note">Se envía un correo al admin (con costo y comisión) y un resumen al cliente.</p>
      </div>
    </footer>

    <ClienteQuickCreate
      :show="mostrarNuevoCliente"
      :vp="vp"
      :nombre-inicial="clienteQuery"
      @close="mostrarNuevoCliente = false"
      @creado="onClienteCreado"
    />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './ventas-ui' as *;

@include panel;
@include fields;
@include buttons;

/* Divider caption that opens each block of fields. */
.group-label {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin: $space-5 0 $space-3;
  color: $ink-500;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba($ink-500, 0.14);
  }

  &:first-of-type { margin-top: 0; }
}

/* Client search: icon inside the field, results floating over the grid. */
.cliente-field { position: relative; }
.cliente-control {
  position: relative;

  > i {
    position: absolute;
    left: $space-3;
    top: 50%;
    transform: translateY(-50%);
    color: $ink-500;
    font-size: 0.82rem;
    pointer-events: none;
  }

  .field-input { padding-left: $space-8; padding-right: $space-8; }

  &.elegido .field-input { border-color: rgba($signal-green, 0.45); }
}
.clear-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: $ink-400;
  cursor: pointer;

  &:hover { background: rgba($ink-500, 0.18); color: $fg-dark; }
}
.cliente-drop {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  margin: 6px 0 0;
  padding: 5px;
  list-style: none;
  background: $ink-850;
  border: 1px solid rgba($ink-500, 0.28);
  border-radius: 12px;
  max-height: 260px;
  overflow-y: auto;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);

  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $space-2 $space-3;
    border-radius: 9px;
    cursor: pointer;

    &:hover { background: rgba($brand-orange, 0.12); }
    strong { font-size: 0.88rem; }
    em { color: $ink-400; font-style: normal; font-size: 0.75rem; }
  }

  .drop-empty {
    border-top: 1px solid rgba($ink-500, 0.14);
    margin-top: 3px;
    padding-top: $space-3;

    strong { color: $ink-300; font-weight: 500; }
    em { color: $brand-orange; font-weight: 600; }
  }
}
.field-hint.ok { color: $signal-green; }

/* Credit block reads as its own card once it is switched on. */
.credito-block {
  margin-top: $space-5;
  padding: $space-4;
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 14px;
  background: rgba($ink-1000, 0.28);
  transition: border-color 0.18s ease, background 0.18s ease;

  &.abierto {
    border-color: rgba($brand-orange, 0.32);
    background: rgba($brand-orange, 0.05);
  }
}
.check-field.wide { width: 100%; font-size: 0.9rem; }
.credito-body { display: flex; flex-direction: column; gap: $space-4; margin-top: $space-4; }
.credito-top { display: flex; gap: $space-5; align-items: flex-end; flex-wrap: wrap; }
.abono { max-width: 220px; flex: 1 1 180px; }
.saldo-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-2 $space-4;
  border-radius: 12px;
  background: rgba($ink-1000, 0.5);

  span { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: $ink-400; }
  strong { color: $brand-orange; font-size: 1.3rem; font-variant-numeric: tabular-nums; }
}
.hint { margin: 0; color: $ink-400; font-size: 0.8rem; }
.cuota-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: $space-4;
  align-items: end;
  padding-bottom: $space-3;
  border-bottom: 1px dashed rgba($ink-500, 0.14);

  @media (max-width: 720px) { grid-template-columns: 1fr; }
}
.cuotas-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
}
.cuotas-suma { color: $ink-400; font-size: 0.82rem; strong { color: $fg-dark; } }
.cuotas-suma.warn { color: #ff8a8f; strong { color: #ff8a8f; } }

.obs { margin-top: $space-5; }

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: $space-5;
  margin-top: $space-5;
  padding-top: $space-4;
  border-top: 1px solid rgba($ink-500, 0.12);
  flex-wrap: wrap;
}
.totales { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
.tot-line {
  display: flex;
  justify-content: space-between;
  gap: $space-6;
  font-size: 0.85rem;
  color: $ink-400;

  strong { color: $ink-200; font-variant-numeric: tabular-nums; }

  &.total {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid rgba($ink-500, 0.14);
    font-size: 1rem;

    span { color: $ink-200; font-weight: 600; }
    strong { color: $brand-orange; font-size: 1.5rem; line-height: 1.1; }
  }
}
.footer-cta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.mail-note { margin: 0; color: $ink-500; font-size: 0.72rem; text-align: right; max-width: 340px; }

@media (max-width: 640px) {
  .form-footer { flex-direction: column; align-items: stretch; }
  .footer-cta { align-items: stretch; }
  .footer-cta .btn-primary { width: 100%; }
  .mail-note { text-align: left; max-width: none; }
}
</style>
