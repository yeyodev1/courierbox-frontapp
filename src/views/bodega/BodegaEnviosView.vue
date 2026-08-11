<template>
  <div class="envios">
    <header class="head">
      <div>
        <h1>Envíos</h1>
        <p>Registra deliveries locales o interprovinciales, asigna motorizados y controla lo por cobrar.</p>
      </div>
      <button class="btn primary" @click="openCreate"><i class="fa-solid fa-plus" aria-hidden="true" /> Nuevo envío</button>
    </header>

    <!-- Summary -->
    <section class="summary">
      <article class="s-card"><span>Total envíos</span><strong>{{ envios.length }}</strong></article>
      <article class="s-card accent"><span>Por cobrar (no entregados)</span><strong>${{ money(porCobrar) }}</strong></article>
      <article class="s-card"><span>Cobrado (entregados)</span><strong>${{ money(cobrado) }}</strong></article>
      <article class="s-card"><span>Pendientes de asignar</span><strong>{{ sinAsignar }}</strong></article>
    </section>

    <!-- Por asignar: compras recibidas en bodega sin envío -->
    <section v-if="porAsignar.length" class="por-asignar">
      <div class="pa-head">
        <h2><i class="fa-solid fa-box-open" aria-hidden="true" /> Por asignar <span class="pa-count">{{ porAsignar.length }}</span></h2>
        <p>Compras recibidas en bodega, listas para generar el envío y asignar un motorizado.</p>
      </div>
      <div class="pa-list">
        <article v-for="g in porAsignar" :key="g._id" class="pa-card">
          <div class="pa-info">
            <strong>{{ gClienteNombre(g) }}</strong>
            <span>{{ g.paginaCompra || 'Compra' }} · ${{ money(g.valorTotal) }}</span>
          </div>
          <button class="btn primary sm" @click="generarDesdeCompra(g)"><i class="fa-solid fa-truck-fast" /> Generar envío</button>
        </article>
      </div>
    </section>

    <!-- Filters -->
    <div class="tabs">
      <button v-for="t in tabsList" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
    </div>

    <div v-if="loading" class="skeletons"><div v-for="i in 4" :key="i" class="sk" /></div>

    <template v-else>
      <p v-if="!filtered.length" class="empty">No hay envíos en esta vista.</p>
      <div v-else class="list">
        <article v-for="e in filtered" :key="e._id" class="card">
          <div class="card-top">
            <div>
              <strong>{{ e.clienteNombre }}</strong>
              <span class="dir">{{ e.clienteDireccion }}</span>
            </div>
            <span class="badge" :class="`estado-${e.estado}`">{{ estadoLabel(e.estado) }}</span>
          </div>
          <div class="card-meta">
            <span class="modo"><i class="fa-solid" :class="e.modo === 'interprovincial' ? 'fa-route' : 'fa-motorcycle'" /> {{ e.modo === 'interprovincial' ? 'Interprovincial' : 'Local' }}</span>
            <span class="valor">${{ money(e.valorCobrado) }}</span>
          </div>
          <div class="card-assign">
            <template v-if="e.modo === 'local'">
              <label>Motorizado</label>
              <select :value="asignadoId(e)" @change="onAssign(e, ($event.target as HTMLSelectElement).value)" :disabled="e.estado === 'entregado'">
                <option value="">— Sin asignar —</option>
                <option v-for="m in motorizados" :key="m._id" :value="m._id">{{ m.name }}</option>
              </select>
            </template>
            <template v-else>
              <span class="prov"><i class="fa-solid fa-truck" /> {{ e.proveedorUtilizado || e.trayectoLocal?.proveedorNombre || 'Proveedor externo' }}</span>
              <a v-if="e.guiaUrl" :href="e.guiaUrl" target="_blank" rel="noopener" class="guia-link"><i class="fa-solid fa-file-arrow-down" /> Guía</a>
            </template>
            <span v-if="e.estado === 'entregado' && e.fotoEntregaUrl" class="ev"><i class="fa-solid fa-camera" /> Evidencia</span>
          </div>
        </article>
      </div>
    </template>

    <!-- Create modal -->
    <AppOverlay :open="showCreate" label="Crear envío" :persistent="saving" @close="showCreate = false">
        <div class="card-modal">
          <div class="cm-head">
            <h3>Nuevo envío</h3>
            <button class="close" @click="showCreate = false"><i class="fa-solid fa-xmark" /></button>
          </div>

          <div class="form">
            <div v-if="linkedGestionId" class="linked-banner">
              <i class="fa-solid fa-link" aria-hidden="true" /> Envío generado desde una compra recibida en bodega. Completa la dirección y asigna el motorizado.
            </div>
            <div class="modo-cards">
              <button class="modo-card" :class="{ selected: form.modo === 'local' }" @click="form.modo = 'local'">
                <i class="fa-solid fa-motorcycle" /> <span>Local (motorizado)</span>
              </button>
              <button class="modo-card" :class="{ selected: form.modo === 'interprovincial' }" @click="form.modo = 'interprovincial'">
                <i class="fa-solid fa-route" /> <span>Interprovincial (proveedor)</span>
              </button>
            </div>

            <div class="row">
              <div class="fg"><label>Cliente *</label><input v-model="form.clienteNombre" placeholder="Nombre del cliente" /></div>
              <div class="fg"><label>Teléfono</label><input v-model="form.clienteTelefono" placeholder="09..." /></div>
            </div>
            <div class="row">
              <div class="fg"><label>Correo (para avisarle)</label><input v-model="form.clienteEmail" type="email" placeholder="cliente@correo.com" /></div>
              <div class="fg"><label>Valor cobrado *</label><input v-model="form.valorCobrado" type="number" min="0" step="0.01" placeholder="0.00" /></div>
            </div>
            <div class="fg"><label>Dirección de entrega *</label><input v-model="form.clienteDireccion" placeholder="Dirección o link de ubicación" /></div>

            <!-- Local -->
            <div v-if="form.modo === 'local'" class="fg">
              <label>Asignar motorizado</label>
              <select v-model="form.asignadoA">
                <option value="">— Asignar después —</option>
                <option v-for="m in motorizados" :key="m._id" :value="m._id">{{ m.name }}</option>
              </select>
            </div>

            <!-- Interprovincial -->
            <template v-else>
              <div class="row">
                <div class="fg">
                  <label>Proveedor / transportadora</label>
                  <select v-model="form.proveedorNombre">
                    <option value="">— Selecciona —</option>
                    <option v-for="p in proveedores" :key="p._id" :value="p.nombre">{{ p.nombre }}</option>
                  </select>
                </div>
                <div class="fg"><label>Costo del proveedor</label><input v-model="form.costoProveedor" type="number" min="0" step="0.01" placeholder="0.00" /></div>
              </div>
              <div class="fg">
                <label>Guía del proveedor (foto/archivo)</label>
                <input type="file" accept="image/*,application/pdf" @change="onGuia" />
                <span v-if="guiaFileName" class="file-name">{{ guiaFileName }}</span>
              </div>
            </template>

            <div class="fg"><label>Notas / instrucciones</label><textarea v-model="form.notas" rows="2" placeholder="Referencias, horarios..."></textarea></div>

            <p v-if="error" class="err">{{ error }}</p>

            <AppMargenLive :cobrado="form.valorCobrado" :costo="form.costoProveedor" />
          </div>

          <div class="cm-foot">
            <button class="btn ghost" @click="showCreate = false">Cancelar</button>
            <button class="btn primary" :disabled="saving" @click="create">{{ saving ? 'Guardando...' : 'Crear envío' }}</button>
          </div>
        </div>
    </AppOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppMargenLive from '@/components/ui/AppMargenLive.vue'
import { enviosApi, type EnvioDomicilio, type Motorizado } from '@/services/envios.api'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const envios = ref<EnvioDomicilio[]>([])
const motorizados = ref<Motorizado[]>([])
const proveedores = ref<Proveedor[]>([])
const gestiones = ref<GestionCompra[]>([])
const linkedGestionId = ref<string>('')
const tab = ref<'todos' | 'pendientes' | 'entregados'>('todos')
const showCreate = ref(false)
const error = ref('')
const guiaFile = ref<File | null>(null)
const guiaFileName = ref('')

const tabsList = [
  { key: 'todos' as const, label: 'Todos' },
  { key: 'pendientes' as const, label: 'Por entregar' },
  { key: 'entregados' as const, label: 'Entregados' },
]

const form = ref({
  modo: 'local' as 'local' | 'interprovincial',
  clienteNombre: '', clienteTelefono: '', clienteEmail: '', clienteDireccion: '',
  valorCobrado: '', asignadoA: '', proveedorNombre: '', costoProveedor: '', notas: '',
})

function money(v: unknown) { return (Number(v) || 0).toFixed(2) }
function estadoLabel(e: string) {
  return { pendiente: 'Pendiente', asignado: 'Asignado', en_ruta: 'En ruta', entregado: 'Entregado', fallido: 'Fallido' }[e] ?? e
}
function asignadoId(e: EnvioDomicilio) {
  const a = e.asignadoA
  return typeof a === 'object' && a ? a._id : (typeof a === 'string' ? a : '')
}

const filtered = computed(() => {
  if (tab.value === 'pendientes') return envios.value.filter((e) => e.estado !== 'entregado')
  if (tab.value === 'entregados') return envios.value.filter((e) => e.estado === 'entregado')
  return envios.value
})
// Purchases physically received in bodega that don't have a delivery yet.
const linkedGestionIds = computed(() => new Set(envios.value.map((e) => (e.gestionCompraId ? String(e.gestionCompraId) : '')).filter(Boolean)))
const porAsignar = computed(() =>
  gestiones.value.filter((g) => {
    const received = g.estadoBodega ? g.estadoBodega === 'recibida' : g.stage === 'comprada'
    return received && !linkedGestionIds.value.has(String(g._id))
  })
)
function gClienteNombre(g: GestionCompra) { return typeof g.contactoId === 'object' && g.contactoId ? g.contactoId.nombre : 'Cliente' }

const porCobrar = computed(() => envios.value.filter((e) => e.estado !== 'entregado').reduce((s, e) => s + (Number(e.valorCobrado) || 0), 0))
const cobrado = computed(() => envios.value.filter((e) => e.estado === 'entregado').reduce((s, e) => s + (Number(e.valorCobrado) || 0), 0))
const sinAsignar = computed(() => envios.value.filter((e) => e.modo === 'local' && !asignadoId(e) && e.estado !== 'entregado').length)

function openCreate() {
  linkedGestionId.value = ''
  form.value = { modo: 'local', clienteNombre: '', clienteTelefono: '', clienteEmail: '', clienteDireccion: '', valorCobrado: '', asignadoA: '', proveedorNombre: '', costoProveedor: '', notas: '' }
  guiaFile.value = null
  guiaFileName.value = ''
  error.value = ''
  showCreate.value = true
}

// Generate a delivery from a received purchase (prefill client data).
function generarDesdeCompra(g: GestionCompra) {
  linkedGestionId.value = String(g._id)
  const c = typeof g.contactoId === 'object' && g.contactoId ? g.contactoId : null
  form.value = {
    modo: 'local',
    clienteNombre: c?.nombre ?? '',
    clienteTelefono: (c as any)?.telefono ?? '',
    clienteEmail: (c as any)?.email ?? '',
    clienteDireccion: '',
    valorCobrado: '',
    asignadoA: '',
    proveedorNombre: '',
    costoProveedor: '',
    notas: `Compra: ${g.paginaCompra || ''}`.trim(),
  }
  guiaFile.value = null
  guiaFileName.value = ''
  error.value = ''
  showCreate.value = true
}

function onGuia(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  guiaFile.value = f ?? null
  guiaFileName.value = f?.name ?? ''
}

async function load() {
  loading.value = true
  try {
    const [enviosRes, motosRes, gestRes] = await Promise.all([
      enviosApi.list({ limit: 200 }),
      enviosApi.listMotorizados(),
      gestionesCompraAPI.list({ limit: 100 }),
    ])
    envios.value = enviosRes.envios
    motorizados.value = motosRes.motorizados
    gestiones.value = gestRes.gestiones
  } finally {
    loading.value = false
  }
  try {
    const provRes = await proveedoresApi.list({ limit: 200 })
    proveedores.value = provRes.proveedores
  } catch { /* proveedores opcional */ }
}

async function create() {
  if (!form.value.clienteNombre.trim() || !form.value.clienteDireccion.trim()) {
    error.value = 'Cliente y dirección son obligatorios'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const created = await enviosApi.create({
      modo: form.value.modo,
      gestionCompraId: linkedGestionId.value || undefined,
      clienteNombre: form.value.clienteNombre.trim(),
      clienteTelefono: form.value.clienteTelefono.trim(),
      clienteEmail: form.value.clienteEmail.trim(),
      clienteDireccion: form.value.clienteDireccion.trim(),
      valorCobrado: Number(form.value.valorCobrado) || 0,
      asignadoA: form.value.modo === 'local' && form.value.asignadoA ? form.value.asignadoA : undefined,
      proveedorUtilizado: form.value.modo === 'interprovincial' ? form.value.proveedorNombre : undefined,
      trayectoLocal: form.value.modo === 'interprovincial'
        ? { proveedorNombre: form.value.proveedorNombre, costo: Number(form.value.costoProveedor) || 0 }
        : undefined,
      notas: form.value.notas.trim() || undefined,
    })
    // Upload guide if provided (interprovincial)
    if (form.value.modo === 'interprovincial' && guiaFile.value) {
      try { await enviosApi.uploadArchivo(created.envio._id, 'guia', guiaFile.value) } catch { /* opcional */ }
    }
    toast.showNotification('Envío creado y cliente notificado', 'success')
    showCreate.value = false
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'No se pudo crear el envío'
  } finally {
    saving.value = false
  }
}

async function onAssign(e: EnvioDomicilio, motorizadoId: string) {
  if (!motorizadoId) return
  try {
    await enviosApi.asignar(e._id, motorizadoId)
    toast.showNotification('Motorizado asignado', 'success')
    await load()
  } catch (err: any) {
    toast.showNotification(err?.message ?? 'No se pudo asignar', 'error')
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.envios { display: flex; flex-direction: column; gap: $space-5; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: $space-4; flex-wrap: wrap; }
.head h1 { margin: 0 0 4px; color: $fg-dark; font-size: 1.5rem; }
.head p { margin: 0; color: $ink-300; max-width: 620px; }

.summary { display: flex; flex-wrap: wrap; gap: $space-3; }
.s-card { flex: 1 1 180px; background: $ink-900; border: 1px solid rgba($ink-500, 0.14); border-radius: 16px; padding: $space-4; display: flex; flex-direction: column; gap: 6px; }
.s-card span { color: $ink-400; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; }
.s-card strong { color: $fg-dark; font-size: 1.3rem; }
.s-card.accent { border-color: rgba($brand-orange, 0.3); }
.s-card.accent strong { color: $brand-orange; }

.por-asignar { background: rgba($brand-orange, 0.06); border: 1px solid rgba($brand-orange, 0.22); border-radius: 16px; padding: $space-4 $space-5; display: flex; flex-direction: column; gap: $space-3; }
.pa-head h2 { display: flex; align-items: center; gap: $space-2; margin: 0 0 4px; color: $fg-dark; font-size: 1.1rem; i { color: $brand-orange; } }
.pa-count { background: $brand-orange; color: $ink-1000; border-radius: 999px; font-size: 0.72rem; padding: 2px 9px; font-weight: 800; }
.pa-head p { margin: 0; color: $ink-300; font-size: 0.86rem; }
.pa-list { display: flex; flex-direction: column; gap: $space-2; }
.pa-card { display: flex; align-items: center; justify-content: space-between; gap: $space-3; background: $ink-900; border: 1px solid $ink-700; border-radius: 12px; padding: $space-3 $space-4; }
.pa-info { display: flex; flex-direction: column; gap: 2px; }
.pa-info strong { color: $fg-dark; }
.pa-info span { color: $ink-400; font-size: 0.82rem; }
.linked-banner { display: flex; align-items: flex-start; gap: $space-2; background: rgba($signal-blue, 0.1); border: 1px solid rgba($signal-blue, 0.3); border-radius: 10px; padding: $space-3 $space-4; color: $ink-300; font-size: 0.85rem; line-height: 1.4; i { color: $signal-blue; margin-top: 2px; } }
.tabs { display: flex; gap: $space-2; flex-wrap: wrap; }
.tabs button { padding: $space-2 $space-4; border-radius: 10px; background: $ink-900; border: 1px solid $ink-700; color: $ink-300; cursor: pointer; font-weight: 700; &.active { border-color: $brand-orange; color: $brand-orange; background: rgba($brand-orange, 0.08); } }

.list { display: flex; flex-direction: column; gap: $space-3; }
.card { background: $ink-900; border: 1px solid $ink-700; border-radius: 14px; padding: $space-4; display: flex; flex-direction: column; gap: $space-3; }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-3; }
.card-top strong { color: $fg-dark; display: block; }
.dir { color: $ink-400; font-size: 0.84rem; }
.card-meta { display: flex; align-items: center; justify-content: space-between; gap: $space-3; }
.modo { color: $ink-300; font-size: 0.85rem; i { color: $brand-orange; margin-right: 6px; } }
.valor { color: $brand-orange; font-weight: 800; }
.card-assign { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; border-top: 1px solid $ink-700; padding-top: $space-3; }
.card-assign label { color: $ink-400; font-size: 0.8rem; }
.card-assign select { background: $ink-1000; border: 1px solid $ink-500; color: $fg-dark; border-radius: 8px; padding: 6px 10px; font-family: inherit; }
.prov { color: $ink-300; font-size: 0.85rem; i { color: $brand-orange; margin-right: 6px; } }
.guia-link, .ev { color: $brand-orange; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.ev { color: $signal-green; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: $ink-700; color: $ink-300; }
.badge.estado-entregado { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.estado-en_ruta { background: rgba(240,138,31,0.16); color: $brand-orange; }
.badge.estado-asignado { background: rgba(84,132,255,0.16); color: #7fa3ff; }
.empty { color: $ink-400; text-align: center; padding: $space-6 0; }
.skeletons { display: flex; flex-direction: column; gap: $space-3; }
.sk { height: 120px; border-radius: 14px; background: $ink-800; animation: pulse 1.4s infinite; }

.btn { display: inline-flex; align-items: center; gap: $space-2; border-radius: 12px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }

.card-modal { width: min(620px, 100%); max-height: 92vh; overflow: auto; background: $ink-900; border: 1px solid $ink-700; border-radius: 20px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.cm-head { display: flex; align-items: center; justify-content: space-between; }
.cm-head h3 { margin: 0; color: $fg-dark; }
.close { background: transparent; border: 1px solid $ink-600; color: $ink-300; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; }
.form { display: flex; flex-direction: column; gap: $space-3; }
.modo-cards { display: flex; gap: $space-3; }
.modo-card { flex: 1; display: flex; align-items: center; justify-content: center; gap: $space-2; padding: $space-3; border-radius: 12px; border: 2px solid $ink-500; background: $ink-1000; color: $fg-dark; cursor: pointer; font-weight: 700; i { color: $brand-orange; } &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.08); } }
.row { display: flex; gap: $space-3; }
.fg { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.fg label { color: $ink-300; font-size: 0.82rem; font-weight: 600; }
.fg input, .fg select, .fg textarea { background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark; padding: $space-3; font-family: inherit; outline: none; &:focus { border-color: $brand-orange; } }
.file-name { color: $ink-400; font-size: 0.8rem; }
.err { color: $signal-red; font-size: 0.85rem; margin: 0; }
.cm-foot { display: flex; justify-content: flex-end; gap: $space-3; }


@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (max-width: 640px) { .row, .modo-cards { flex-direction: column; } }
</style>
