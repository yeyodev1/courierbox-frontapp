<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { enviosApi, type EnvioDomicilio, type PaqueteSimple } from '@/services/envios.api'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import { useToastStore } from '@/stores/toast.store'

// ── Tab state ──
const activeTab = ref<'envios' | 'proveedores'>('envios')
const pendingProvTipo = ref<'usa' | 'local' | null>(null)
const toastStore = useToastStore()

// ══════════════════════════════════════════
// ENVÍOS
// ══════════════════════════════════════════

const envios = ref<EnvioDomicilio[]>([])
const loading = ref(false)
const filtroEstado = ref('')
const filtroDesde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const filtroHasta = ref(new Date().toISOString().slice(0, 10))
const resumen = ref<{ locales: { total: number; cobrados: number; costo?: number; novedades?: number }; interprovinciales: { total: number; cobrados: number; pagados: number; costo?: number; novedades?: number }; porEstado: Array<{ _id: string; total: number }>; saldo: number } | null>(null)

const showModal = ref(false)
const searchResults = ref<PaqueteSimple[]>([])
const searchQuery = ref('')
const searching = ref(false)
const clientSearchResults = ref<{ clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[]>([])
const clientSearching = ref(false)

const form = ref({
  modo: 'local' as 'local' | 'interprovincial',
  paqueteId: '',
  paqueteLabel: '',
  clienteNombre: '',
  clienteDireccion: '',
  clienteTelefono: '',
  numeroInvoice: '',
  ciudadDestino: '',
  proveedorUtilizado: '',
  valorCobrado: 0,
  valorPagadoProveedor: 0,
  usaProveedorId: '',
  usaProveedorNombre: '',
  usaTracking: '',
  usaCosto: 0,
  localProveedorId: '',
  localProveedorNombre: '',
  localTracking: '',
  localCosto: 0,
  notas: '',
})

const fotoEntrega = ref<File | null>(null)
const firmaEntrega = ref<File | null>(null)
const guiaArchivo = ref<File | null>(null)

function setFile(event: Event, kind: 'foto' | 'firma' | 'guia') {
  const file = (event.target as HTMLInputElement | null)?.files?.[0] || null
  if (kind === 'foto') fotoEntrega.value = file
  if (kind === 'firma') firmaEntrega.value = file
  if (kind === 'guia') guiaArchivo.value = file
}

const proveedoresActivos = computed(() => proveedores.value.filter((p) => p.activo))

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente', asignado: 'Asignado', en_ruta: 'En ruta', entregado: 'Entregado', fallido: 'Fallido',
}

const filtered = computed(() => {
  if (!filtroEstado.value) return envios.value
  return envios.value.filter((e) => e.estado === filtroEstado.value)
})

async function load() {
  loading.value = true
  try {
    const [data, sum] = await Promise.all([
      enviosApi.list({ estado: filtroEstado.value || undefined, desde: filtroDesde.value || undefined, hasta: filtroHasta.value || undefined, limit: 200 }),
      enviosApi.resumen({ desde: filtroDesde.value || undefined, hasta: filtroHasta.value || undefined }),
    ])
    envios.value = data.envios
    resumen.value = sum
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  } finally {
    loading.value = false
  }
}

async function searchPaquetes() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    const data = await enviosApi.buscarPaquetes(searchQuery.value.trim())
    searchResults.value = data.paquetes
  } catch (e: any) {
    console.error(e)
  } finally {
    searching.value = false
  }
}

function selectPaquete(p: PaqueteSimple) {
  form.value.paqueteId = p._id
  form.value.paqueteLabel = `${p.wr || p.sh || p.trackingOriginal}`
  searchResults.value = []
  searchQuery.value = ''
}

function openCreate() {
  form.value = {
    modo: 'local', paqueteId: '', paqueteLabel: '', clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
    numeroInvoice: '', ciudadDestino: '', proveedorUtilizado: '', valorCobrado: 0, valorPagadoProveedor: 0,
    usaProveedorId: '', usaProveedorNombre: '', usaTracking: '', usaCosto: 0,
    localProveedorId: '', localProveedorNombre: '', localTracking: '', localCosto: 0, notas: '',
  }
  fotoEntrega.value = null
  firmaEntrega.value = null
  guiaArchivo.value = null
  loadProveedores()
  showModal.value = true
}

async function searchClient() {
  const q = form.value.clienteNombre.trim()
  if (q.length < 2) { clientSearchResults.value = []; return }
  clientSearching.value = true
  try {
    const data = await enviosApi.buscarClientes(q)
    clientSearchResults.value = data.clientes
  } catch { clientSearchResults.value = [] } finally {
    clientSearching.value = false
  }
}

function selectClient(c: { clientName: string; clientEmail?: string; clientPhone?: string }) {
  form.value.clienteNombre = c.clientName
  form.value.clienteTelefono = c.clientPhone || form.value.clienteTelefono
  clientSearchResults.value = []
}

function selectUsaProv(id: string) {
  const p = proveedores.value.find((x) => x._id === id)
  form.value.usaProveedorId = id
  form.value.usaProveedorNombre = p?.nombre || ''
}

function selectLocalProv(id: string) {
  const p = proveedores.value.find((x) => x._id === id)
  form.value.localProveedorId = id
  form.value.localProveedorNombre = p?.nombre || ''
}

async function create() {
  if (!form.value.paqueteId || !form.value.clienteNombre || !form.value.clienteDireccion) return
  try {
    const created = await enviosApi.create({
      modo: form.value.modo,
      paqueteId: form.value.paqueteId,
      clienteNombre: form.value.clienteNombre,
      clienteDireccion: form.value.clienteDireccion,
      clienteTelefono: form.value.clienteTelefono || undefined,
      numeroInvoice: form.value.numeroInvoice || undefined,
      ciudadDestino: form.value.ciudadDestino || undefined,
      proveedorUtilizado: form.value.proveedorUtilizado || undefined,
      valorCobrado: form.value.valorCobrado,
      valorPagadoProveedor: form.value.valorPagadoProveedor,
      trayectoUsa: {
        proveedorId: form.value.usaProveedorId || undefined,
        proveedorNombre: form.value.usaProveedorNombre,
        tracking: form.value.usaTracking,
        costo: form.value.usaCosto,
      },
      trayectoLocal: {
        proveedorId: form.value.localProveedorId || undefined,
        proveedorNombre: form.value.localProveedorNombre,
        tracking: form.value.localTracking,
        costo: form.value.localCosto,
      },
      notas: form.value.notas,
    })

    const envioId = created.envio?._id
    if (envioId) {
      if (fotoEntrega.value) await enviosApi.uploadArchivo(envioId, 'foto', fotoEntrega.value)
      if (firmaEntrega.value) await enviosApi.uploadArchivo(envioId, 'firma', firmaEntrega.value)
      if (guiaArchivo.value) await enviosApi.uploadArchivo(envioId, 'guia', guiaArchivo.value)
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al crear', 'error')
  }
}

async function updateStatus(e: EnvioDomicilio, estado: string) {
  try {
    await enviosApi.update(e._id, { estado: estado as any })
    await load()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  }
}

async function togglePago(e: EnvioDomicilio, trayecto: 'trayectoUsa' | 'trayectoLocal') {
  const leg = trayecto === 'trayectoUsa' ? e.trayectoUsa : e.trayectoLocal
  try {
    await enviosApi.marcarPago(e._id, trayecto, !leg.pagado)
    await load()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  }
}

function formatMoney(n: number) { return `$${(n || 0).toFixed(2)}` }

function openGuide(e: EnvioDomicilio) {
  if (!e.guiaUrl || !e.clienteTelefono) return
  const message = encodeURIComponent(`Hola ${e.clienteNombre}, te comparto la guía de tu envío: ${e.guiaUrl}`)
  const phone = String(e.clienteTelefono).replace(/\D/g, '')
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ══════════════════════════════════════════
// PROVEEDORES
// ══════════════════════════════════════════

const proveedores = ref<Proveedor[]>([])
const provLoading = ref(false)
const provFilterQuery = ref('')
const showProvModal = ref(false)
const editingProv = ref<Proveedor | null>(null)
const provForm = ref({ nombre: '', tipo: '', pais: '', ciudad: '', contacto: '', telefono: '', email: '', notas: '' })

function goToCreateProv() {
  pendingProvTipo.value = null
  showModal.value = false
  provForm.value = { nombre: '', tipo: '', pais: '', ciudad: '', contacto: '', telefono: '', email: '', notas: '' }
  editingProv.value = null
  showProvModal.value = true
  activeTab.value = 'proveedores'
}

async function saveProvAndReturn() {
  if (!provForm.value.nombre) return
  try {
    if (editingProv.value) {
      await proveedoresApi.update(editingProv.value._id, provForm.value)
    } else {
      const data = await proveedoresApi.create(provForm.value)
      await loadProveedores()
      // Auto-select in form if coming from envios tab
      if (data.proveedor._id) {
        const isUsa = data.proveedor.tipo?.toLowerCase().includes('usa') || data.proveedor.pais?.toLowerCase() === 'estados unidos'
        if (isUsa) selectUsaProv(data.proveedor._id)
        else selectLocalProv(data.proveedor._id)
      }
    }
    showProvModal.value = false
    // Return to envios tab and re-open the form
    if (activeTab.value === 'proveedores' && showModal.value === false) {
      activeTab.value = 'envios'
      showModal.value = true
    }
    await loadProveedores()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  }
}

const filteredProveedores = computed(() => {
  if (!provFilterQuery.value) return proveedores.value
  const q = provFilterQuery.value.toLowerCase()
  return proveedores.value.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q) ||
      p.pais.toLowerCase().includes(q) ||
      p.ciudad.toLowerCase().includes(q) ||
      p.contacto.toLowerCase().includes(q)
  )
})

async function loadProveedores() {
  provLoading.value = true
  try {
    const data = await proveedoresApi.list({ q: provFilterQuery.value || undefined, limit: 200 })
    proveedores.value = data.proveedores
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  } finally {
    provLoading.value = false
  }
}

function openProvCreate() {
  editingProv.value = null
  provForm.value = { nombre: '', tipo: '', pais: '', ciudad: '', contacto: '', telefono: '', email: '', notas: '' }
  showProvModal.value = true
}

function openProvEdit(p: Proveedor) {
  editingProv.value = p
  provForm.value = { nombre: p.nombre, tipo: p.tipo, pais: p.pais, ciudad: p.ciudad, contacto: p.contacto, telefono: p.telefono, email: p.email, notas: p.notas }
  showProvModal.value = true
}



async function toggleProvActivo(p: Proveedor) {
  try {
    await proveedoresApi.update(p._id, { activo: !p.activo })
    await loadProveedores()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error', 'error')
  }
}

onMounted(() => {
  load()
  loadProveedores()
})

watch([filtroEstado, filtroDesde, filtroHasta], load)
</script>

<template>
  <div class="envios-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Envíos a Domicilio</h1>
        <p class="page-subtitle">Gestiona envíos de última milla y proveedores logísticos</p>
      </div>
    </div>

    <div v-if="resumen" class="stats-grid">
      <article class="stat-card"><span>Locales</span><strong>{{ resumen.locales.total }}</strong><small>{{ formatMoney(resumen.locales.cobrados) }} cobrados</small></article>
      <article class="stat-card"><span>Interprovinciales</span><strong>{{ resumen.interprovinciales.total }}</strong><small>{{ formatMoney(resumen.interprovinciales.cobrados) }} cobrados</small></article>
      <article class="stat-card"><span>Saldo</span><strong>{{ formatMoney(resumen.saldo) }}</strong><small>cobrado menos costos</small></article>
      <article class="stat-card"><span>Novedades</span><strong>{{ (resumen.locales.novedades || 0) + (resumen.interprovinciales.novedades || 0) }}</strong><small>casos con observación</small></article>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'envios' }" @click="activeTab = 'envios'">Envíos</button>
      <button class="tab" :class="{ active: activeTab === 'proveedores' }" @click="activeTab = 'proveedores'">Proveedores</button>
    </div>

    <!-- ════════════════ ENVÍOS ════════════════ -->
    <template v-if="activeTab === 'envios'">
      <div class="toolbar">
        <label class="filter">
          <span>Estado</span>
          <select v-model="filtroEstado" class="field-input" @change="load">
            <option value="">Todos</option>
            <option v-for="(l, k) in estadoLabel" :key="k" :value="k">{{ l }}</option>
          </select>
        </label>
        <AppDatePicker v-model="filtroDesde" label="Desde" />
        <AppDatePicker v-model="filtroHasta" label="Hasta" />
        <button class="btn-primary" @click="openCreate"><i class="fa-solid fa-plus" /> Nuevo envío</button>
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 4" :key="n" class="skeleton-row"></div>
      </div>
       <div v-else-if="filtered.length === 0" class="empty"><i class="fa-solid fa-truck" /><p>No hay envíos</p></div>

      <div v-else class="table-wrapper">
        <table class="envios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Modo</th>
              <th>Cliente</th>
              <th>Paquete</th>
              <th>Proveedor USA</th>
              <th>Tracking USA</th>
              <th>Pago USA</th>
              <th>Proveedor Local</th>
              <th>Tracking Local</th>
              <th>Pago Local</th>
              <th>Cobrado</th>
              <th>Guía</th>
              <th>Evidencia</th>
              <th>Costo</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in filtered" :key="e._id">
              <td class="mono">#{{ e._id.slice(-6).toUpperCase() }}</td>
              <td><span class="badge badge-blue">{{ e.modo || 'local' }}</span></td>
              <td><strong>{{ e.clienteNombre }}</strong><div class="cell-sub">{{ e.clienteDireccion.slice(0, 30) }}</div></td>
              <td class="mono">{{ e.paqueteId?.wr || e.paqueteId?.sh || '—' }}</td>
              <td>{{ e.trayectoUsa?.proveedorNombre || '—' }}</td>
              <td class="mono">{{ e.trayectoUsa?.tracking || '—' }}</td>
              <td>
                <button
                  class="btn-pago"
                  :class="{ pagado: e.trayectoUsa?.pagado }"
                  @click="togglePago(e, 'trayectoUsa')"
                  :title="e.trayectoUsa?.pagado ? 'Pagado' : 'Marcar como pagado'"
                >
                  <i :class="e.trayectoUsa?.pagado ? 'fa-solid fa-check-circle' : 'fa-regular fa-circle'" />
                </button>
              </td>
              <td>{{ e.trayectoLocal?.proveedorNombre || '—' }}</td>
              <td class="mono">{{ e.trayectoLocal?.tracking || '—' }}</td>
              <td>
                <button
                  class="btn-pago"
                  :class="{ pagado: e.trayectoLocal?.pagado }"
                  @click="togglePago(e, 'trayectoLocal')"
                  :title="e.trayectoLocal?.pagado ? 'Pagado' : 'Marcar como pagado'"
                >
                  <i :class="e.trayectoLocal?.pagado ? 'fa-solid fa-check-circle' : 'fa-regular fa-circle'" />
                </button>
              </td>
              <td>
                <div v-if="e.guiaUrl" class="file-actions">
                  <a :href="e.guiaUrl" target="_blank" class="file-link">Abrir</a>
                  <button v-if="e.clienteTelefono" class="btn-link" type="button" @click="openGuide(e)">Enviar por WhatsApp</button>
                </div>
                <span v-else>—</span>
              </td>
              <td>
                <a v-if="e.fotoEntregaUrl || e.firmaUrl || e.evidenciaUrl" :href="e.fotoEntregaUrl || e.evidenciaUrl || e.firmaUrl" target="_blank" class="file-link">Abrir</a>
                <span v-else>—</span>
              </td>
              <td class="mono costo">{{ formatMoney((e.trayectoUsa?.costo || 0) + (e.trayectoLocal?.costo || 0)) }}</td>
              <td class="mono costo">{{ formatMoney(e.valorCobrado || 0) }}</td>
              <td>
                <select class="badge-select" :value="e.estado" @change="updateStatus(e, ($event.target as HTMLSelectElement).value)">
                  <option v-for="(l, k) in estadoLabel" :key="k" :value="k">{{ l }}</option>
                </select>
              </td>
              <td class="mono">{{ formatDate(e.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ════════════════ PROVEEDORES ════════════════ -->
    <template v-if="activeTab === 'proveedores'">
      <div class="toolbar">
        <label class="filter search-filter">
          <i class="fa-solid fa-search" />
          <input v-model="provFilterQuery" class="field-input" placeholder="Buscar proveedor por nombre, tipo, país..." @input="loadProveedores" />
        </label>
        <button class="btn-primary" @click="openProvCreate"><i class="fa-solid fa-plus" /> Nuevo proveedor</button>
      </div>

      <div v-if="provLoading" class="loading"><i class="fa-solid fa-circle-notch fa-spin" /> Cargando...</div>
      <div v-else-if="filteredProveedores.length === 0" class="empty"><i class="fa-solid fa-truck-field" /><p>No hay proveedores</p></div>

      <div v-else class="table-wrapper">
        <table class="envios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo / Ruta</th>
              <th>País</th>
              <th>Ciudad</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProveedores" :key="p._id">
              <td><strong>{{ p.nombre }}</strong></td>
              <td>{{ p.tipo || '—' }}</td>
              <td>{{ p.pais || '—' }}</td>
              <td>{{ p.ciudad || '—' }}</td>
              <td>{{ p.contacto || '—' }}</td>
              <td>{{ p.telefono || '—' }}</td>
              <td>
                <span class="badge" :class="p.activo ? 'badge-green' : 'badge-gray'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn-icon" @click="openProvEdit(p)" title="Editar"><i class="fa-solid fa-pen" /></button>
                  <button class="btn-icon" @click="toggleProvActivo(p)" :title="p.activo ? 'Desactivar' : 'Activar'">
                    <i :class="p.activo ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ─── Modal: Crear envío ─── -->
    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card wide">
          <div class="modal-icon-box info"><i class="fa-solid fa-truck" /></div>
          <h3>Nuevo envío</h3>
          <div class="modal-body">
            <section>
              <h4>Tipo de envío</h4>
              <div class="field-row">
                <select v-model="form.modo" class="field-input">
                  <option value="local">Local</option>
                  <option value="interprovincial">Interprovincial</option>
                </select>
              </div>
            </section>
            <section>
              <h4>Paquete</h4>
              <div class="paquete-search">
                <input v-model="searchQuery" class="field-input" placeholder="Buscar por WR, SH o tracking..." @keyup.enter="searchPaquetes" />
                <button class="btn-sm" :disabled="searching" @click="searchPaquetes"><i class="fa-solid fa-search" /></button>
              </div>
              <div v-if="searchResults.length" class="search-results">
                <button v-for="p in searchResults" :key="p._id" class="search-item" @click="selectPaquete(p)">
                  {{ p.wr || p.sh || p.trackingOriginal }} — {{ p.contenido?.slice(0, 40) }}
                </button>
              </div>
              <div v-if="form.paqueteLabel" class="selected-paquete">
                <i class="fa-solid fa-box" /> {{ form.paqueteLabel }}
              </div>
            </section>
            <section>
              <h4>Cliente <span class="badge badge-blue">búsqueda inteligente</span></h4>
              <div class="client-search-wrapper">
                <input
                  v-model="form.clienteNombre"
                  class="field-input"
                  placeholder="Nombre del cliente *"
                  @input="searchClient"
                  @focus="form.clienteNombre.length >= 2 && searchClient()"
                />
                <div v-if="clientSearchResults.length && form.clienteNombre.length >= 2" class="client-suggestions">
                  <button
                    v-for="c in clientSearchResults"
                    :key="c.clientName + (c.clientEmail || '')"
                    class="client-suggestion"
                    @click="selectClient(c)"
                  >
                    <strong>{{ c.clientName }}</strong>
                    <span v-if="c.clientEmail || c.clientPhone" class="suggestion-contact">
                      {{ c.clientEmail }} {{ c.clientPhone ? '· ' + c.clientPhone : '' }}
                    </span>
                    <span class="suggestion-meta">Última orden: {{ formatDate(c.lastOrderDate) }}</span>
                  </button>
                </div>
              </div>
              <div class="field-row">
                <input v-model="form.clienteDireccion" class="field-input" placeholder="Dirección *" />
                <input v-model="form.clienteTelefono" class="field-input" placeholder="Teléfono" />
              </div>
            </section>
            <section v-if="form.modo === 'interprovincial'">
              <h4>Datos interprovinciales</h4>
              <div class="field-row">
                <input v-model="form.numeroInvoice" class="field-input" placeholder="Número de invoice" />
                <input v-model="form.ciudadDestino" class="field-input" placeholder="Ciudad destino" />
              </div>
              <div class="field-row">
                <input v-model="form.proveedorUtilizado" class="field-input" placeholder="Proveedor utilizado" />
                <input v-model.number="form.valorCobrado" type="number" min="0" step="0.01" class="field-input cost" placeholder="Valor cobrado" />
              </div>
              <div class="field-row">
                <input v-model.number="form.valorPagadoProveedor" type="number" min="0" step="0.01" class="field-input cost" placeholder="Valor pagado al proveedor" />
                <input type="file" class="field-input" @change="(e) => setFile(e, 'guia')" />
              </div>
            </section>
            <section v-if="form.modo === 'local'">
              <h4>Trayecto 1 <span class="badge badge-blue">Origen → Miami</span></h4>
              <div class="field-row prov-row">
                <select v-model="form.usaProveedorId" class="field-input prov-select" @change="selectUsaProv(form.usaProveedorId)">
                  <option value="">Seleccionar proveedor...</option>
                  <option v-for="p in proveedoresActivos" :key="p._id" :value="p._id">
                    {{ p.nombre }}{{ p.pais ? ` (${p.pais})` : '' }}{{ p.tipo ? ` — ${p.tipo}` : '' }}
                  </option>
                </select>
                <button class="btn-add-prov" type="button" @click="goToCreateProv()" title="Agregar nuevo proveedor">
                  <i class="fa-solid fa-plus" />
                </button>
              </div>
              <div class="field-row">
                <input v-model="form.usaTracking" class="field-input" placeholder="Tracking" />
                <input v-model.number="form.usaCosto" type="number" min="0" step="0.01" class="field-input cost" placeholder="Costo $" />
              </div>
            </section>
            <section>
              <h4>Trayecto 2 <span class="badge badge-orange">Miami → Destino</span></h4>
              <div class="field-row prov-row">
                <select v-model="form.localProveedorId" class="field-input prov-select" @change="selectLocalProv(form.localProveedorId)">
                  <option value="">Seleccionar proveedor...</option>
                  <option v-for="p in proveedoresActivos" :key="p._id" :value="p._id">
                    {{ p.nombre }}{{ p.pais ? ` (${p.pais})` : '' }}{{ p.tipo ? ` — ${p.tipo}` : '' }}
                  </option>
                </select>
                <button class="btn-add-prov" type="button" @click="goToCreateProv()" title="Agregar nuevo proveedor">
                  <i class="fa-solid fa-plus" />
                </button>
              </div>
              <div class="field-row">
                <input v-model="form.localTracking" class="field-input" placeholder="Tracking" />
                <input v-model.number="form.localCosto" type="number" min="0" step="0.01" class="field-input cost" placeholder="Costo $" />
              </div>
            </section>
            <section v-if="form.modo === 'local'">
              <h4>Evidencia de entrega</h4>
              <div class="field-row">
                <input type="file" accept="image/*" class="field-input" @change="(e) => setFile(e, 'foto')" />
                <input type="file" accept="image/*" class="field-input" @change="(e) => setFile(e, 'firma')" />
              </div>
            </section>
            <textarea v-model="form.notas" class="field-input" rows="2" placeholder="Notas adicionales..." />
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showModal = false">Cancelar</button>
            <button class="btn-primary" @click="create" :disabled="!form.paqueteId || !form.clienteNombre || !form.clienteDireccion">
              <i class="fa-solid fa-plus" /> Crear envío
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ─── Modal: Crear/Editar proveedor ─── -->
    <transition name="fade">
      <div v-if="showProvModal" class="modal-overlay" @click.self="showProvModal = false">
        <div class="modal-card">
          <div class="modal-icon-box info"><i class="fa-solid fa-truck-field" /></div>
          <h3>{{ editingProv ? 'Editar' : 'Nuevo' }} proveedor</h3>
          <div class="modal-body">
            <input v-model="provForm.nombre" class="field-input" placeholder="Nombre del proveedor *" />
            <input v-model="provForm.tipo" class="field-input" placeholder="Tipo o ruta (ej: Courier USA, Envío Expreso, Flota propia...)" />
            <div class="field-row">
              <input v-model="provForm.pais" class="field-input" placeholder="País de origen" />
              <input v-model="provForm.ciudad" class="field-input" placeholder="Ciudad" />
            </div>
            <div class="field-row">
              <input v-model="provForm.contacto" class="field-input" placeholder="Persona de contacto" />
              <input v-model="provForm.telefono" class="field-input" placeholder="Teléfono" />
            </div>
            <input v-model="provForm.email" class="field-input" type="email" placeholder="Email" />
            <textarea v-model="provForm.notas" class="field-input" rows="2" placeholder="Notas..." />
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showProvModal = false; if (activeTab === 'proveedores' && !editingProv) { activeTab = 'envios'; showModal = true; }">Cancelar</button>
            <button class="btn-primary" @click="saveProvAndReturn" :disabled="!provForm.nombre">
              <i class="fa-solid fa-check" /> {{ editingProv ? 'Guardar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.envios-page { display: flex; flex-direction: column; gap: $space-6; }

.tabs { display: flex; gap: $space-1; background: $ink-900; border-radius: 12px; padding: $space-1; width: fit-content; }

.tab {
  padding: $space-2 $space-5;
  background: transparent; border: none; border-radius: 10px; color: $ink-400; font-family: inherit;
  font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
  &:hover { color: $fg-dark; }
  &.active { background: $brand-orange; color: #fff; }
}

.toolbar { display: flex; align-items: end; gap: $space-4; flex-wrap: wrap; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $space-4;
}

.stat-card {
  background: rgba($ink-900, 0.72);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-4;

  span {
    color: $ink-400;
    font-size: 0.8rem;
  }

  strong {
    display: block;
    margin: $space-2 0;
    font-size: 1.8rem;
  }

  small {
    color: $ink-500;
  }
}

.client-search-wrapper { position: relative; }

.client-suggestions {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
  background: $ink-800; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
  margin-top: 4px; max-height: 200px; overflow-y: auto;
}

.client-suggestion {
  width: 100%; display: flex; flex-direction: column; gap: 2px;
  padding: $space-2 $space-3; background: transparent; border: none; border-bottom: 1px solid rgba($ink-500, 0.06);
  color: $fg-dark; font-family: inherit; font-size: 0.85rem; text-align: left; cursor: pointer;
  &:last-child { border-bottom: none; }
  &:hover { background: rgba($brand-orange, 0.08); }
  strong { font-size: 0.9rem; }
}

.suggestion-contact { font-size: 0.75rem; color: $ink-400; }
.suggestion-meta { font-size: 0.7rem; color: $ink-500; }

.search-filter {
  display: flex; align-items: center; gap: $space-2; background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15); border-radius: 12px; padding: $space-1 $space-3;
  i { color: $ink-400; }
  .field-input { background: transparent; border: none; padding: $space-1; min-width: 260px; }
}

.filter {
  display: flex; align-items: center; gap: $space-3; color: $ink-300; font-size: 0.9rem;
  .field-input { background: $ink-900; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px; padding: $space-2 $space-3; color: $fg-dark; font-family: inherit; outline: none; &:focus { border-color: $brand-orange; } }
}

.btn-primary {
  display: inline-flex; align-items: center; gap: $space-2; padding: 0.6rem 1.25rem; background: $brand-orange;
  border: none; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.9rem; font-family: inherit;
  &:hover { background: color.adjust($brand-orange, $lightness: -8%); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.loading, .empty { display: flex; align-items: center; justify-content: center; gap: $space-3; padding: $space-12 0; color: $ink-500; i { font-size: 1.5rem; } }

.alert { display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4; border-radius: 12px; font-size: 0.9rem; background: rgba($signal-red, 0.1); color: #ff8a8f; border: 1px solid rgba($signal-red, 0.15); }

.table-wrapper { overflow-x: auto; background: $ink-900; border: 1px solid rgba($ink-500, 0.12); border-radius: 16px; }

.envios-table {
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
  th, td { padding: $space-2 $space-3; text-align: left; border-bottom: 1px solid rgba($ink-500, 0.08); white-space: nowrap; }
  th { color: $ink-400; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr:last-child td { border-bottom: none; }
  .mono { font-variant-numeric: tabular-nums; font-family: monospace; font-size: 0.8rem; }
  .cell-sub { color: $ink-400; font-size: 0.75rem; margin-top: 2px; }
  .costo { color: $brand-orange; font-weight: 700; }
}

.badge-select {
  background: $ink-1000; border: 1px solid rgba($ink-500, 0.2); border-radius: 8px; padding: 2px 6px;
  color: $fg-dark; font-family: inherit; font-size: 0.8rem; cursor: pointer;
}

.btn-pago {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px; color: $ink-400; cursor: pointer; font-size: 1.1rem;
  transition: all 0.2s;
  &:hover { color: $brand-orange; }
  &.pagado { color: #81c784; }
}

.skeleton-list { display: flex; flex-direction: column; gap: $space-3; }
.skeleton-row { height: 58px; border-radius: 14px; background: linear-gradient(90deg, rgba($ink-700,.7), rgba($ink-600,.7), rgba($ink-700,.7)); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

.file-link {
  color: $brand-orange;
  text-decoration: none;
  font-weight: 600;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-link {
  border: none;
  background: transparent;
  color: $ink-300;
  font: inherit;
  padding: 0;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: $brand-orange;
  }
}

@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.badge {
  padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600;
  &.badge-blue { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.badge-orange { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.badge-green { background: rgba(#81c784, 0.12); color: #81c784; }
  &.badge-gray { background: rgba($ink-500, 0.15); color: $ink-400; }
}

.row-actions { display: flex; gap: $space-1; }

.btn-icon {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid rgba($ink-500, 0.15); border-radius: 8px; color: $ink-400; cursor: pointer;
  font-size: 0.85rem; transition: all 0.2s;
  &:hover { border-color: rgba($brand-orange, 0.3); color: $brand-orange; }
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba($ink-1000, 0.75); backdrop-filter: blur(6px); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: $space-4;
}

.modal-card {
  background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: 20px; padding: $space-6;
  max-width: 480px; width: 100%; text-align: center;
  &.wide { max-width: 640px; }
  &.small { max-width: 420px; }
  .modal-icon-box {
    width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    margin: 0 auto $space-4; font-size: 1.2rem;
    &.info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  }
  h3 { font-size: 1.15rem; margin: 0 0 $space-4; }
}

.modal-body {
  text-align: left;
  display: flex; flex-direction: column; gap: $space-4;
  section h4 { font-size: 0.85rem; margin: 0 0 $space-2; color: $ink-300; display: flex; align-items: center; gap: $space-2; }
  &.compact { gap: $space-3; }
}

.field-row { display: flex; gap: $space-2; }

.field-input {
  width: 100%; background: $ink-800; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
  padding: $space-2 $space-3; color: $fg-dark; font-family: inherit; font-size: 0.9rem; outline: none;
  box-sizing: border-box;
  &::placeholder { color: $ink-400; }
  &:focus { border-color: $brand-orange; }
  &.cost { max-width: 120px; }
}

.prov-hint {
  font-size: 0.85rem; color: $ink-300; margin: -$space-2 0 0;
  strong { color: $brand-orange; }
}

.prov-row { display: flex; gap: $space-2; align-items: center; }

.prov-select {
  flex: 1;
  &.field-input {
    background: $ink-800; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
    padding: $space-2 $space-3; color: $fg-dark; font-family: inherit; font-size: 0.9rem; outline: none;
    cursor: pointer;
    &:focus { border-color: $brand-orange; }
  }
}

.btn-add-prov {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: rgba($brand-orange, 0.1); border: 1px solid rgba($brand-orange, 0.2); border-radius: 10px;
  color: $brand-orange; cursor: pointer; flex-shrink: 0; transition: all 0.2s;
  &:hover { background: rgba($brand-orange, 0.2); }
  i { font-size: 0.9rem; }
}

.paquete-search { display: flex; gap: $space-2; }

.btn-sm {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: $ink-700; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px; color: $fg-dark; cursor: pointer; flex-shrink: 0;
  &:hover { background: $ink-600; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.search-results { display: flex; flex-direction: column; gap: 2px; max-height: 150px; overflow-y: auto; }

.search-item {
  width: 100%; padding: $space-2; background: transparent; border: 1px solid rgba($ink-500, 0.1); border-radius: 8px;
  color: $fg-dark; font-family: inherit; font-size: 0.85rem; text-align: left; cursor: pointer;
  &:hover { background: rgba($brand-orange, 0.08); }
}

.selected-paquete { padding: $space-2; background: rgba($brand-orange, 0.08); border-radius: 8px; font-size: 0.85rem; color: $brand-orange; i { margin-right: $space-1; } }

.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; margin-top: $space-4; }

.btn-ghost {
  padding: 0.75rem 1.5rem; background: transparent; border: 1px solid rgba($ink-500, 0.3); border-radius: 10px;
  color: $ink-300; font-weight: 500; cursor: pointer; font-size: 0.9rem; font-family: inherit;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}

@media (max-width: 640px) {
  .toolbar { align-items: stretch; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
