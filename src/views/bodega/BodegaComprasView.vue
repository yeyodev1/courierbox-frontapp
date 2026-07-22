<template>
  <div class="bodega-compras">
    <header class="head">
      <div>
        <h1>Compras</h1>
        <p>Marca cuando el producto llegue a bodega: sube una foto y el cliente recibe el aviso de que ya lo tenemos.</p>
      </div>
    </header>

    <!-- Filters -->
    <section class="filters">
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input v-model="q" placeholder="Buscar cliente o tienda..." />
      </div>

      <div class="presets">
        <button v-for="p in presets" :key="p.key" :class="{ active: rangePreset === p.key }" @click="setPreset(p.key)">{{ p.label }}</button>
      </div>

      <div class="range">
        <label>Desde <input type="date" v-model="desde" @change="rangePreset = 'custom'" /></label>
        <label>Hasta <input type="date" v-model="hasta" @change="rangePreset = 'custom'" /></label>
      </div>

      <div class="estado-filter">
        <button :class="{ active: estadoFiltro === 'todos' }" @click="estadoFiltro = 'todos'">Todos</button>
        <button :class="{ active: estadoFiltro === 'por_recibir' }" @click="estadoFiltro = 'por_recibir'">Por recibir</button>
        <button :class="{ active: estadoFiltro === 'en_bodega' }" @click="estadoFiltro = 'en_bodega'">En bodega</button>
      </div>
    </section>

    <div v-if="loading" class="skeletons"><div v-for="i in 4" :key="i" class="sk" /></div>

    <template v-else>
      <p v-if="!filtered.length" class="empty">No hay compras que coincidan con el filtro.</p>
      <div v-else class="grid">
        <article v-for="g in filtered" :key="g._id" class="card" :class="{ recibido: isRecibido(g) }">
          <div class="card-head">
            <strong>{{ clienteNombre(g) }}</strong>
            <span class="badge" :class="isRecibido(g) ? 'ok' : 'wait'">
              <i class="fa-solid" :class="isRecibido(g) ? 'fa-circle-check' : 'fa-clock'" />
              {{ isRecibido(g) ? 'En bodega' : 'Por recibir' }}
            </span>
          </div>
          <p class="tienda">{{ g.paginaCompra || '—' }}</p>
          <div class="card-foot">
            <span>{{ asesorNombre(g) }} · {{ formatDate(g.createdAt) }}</span>
            <span class="valor">${{ money(g.valorTotal) }}</span>
          </div>
          <div class="card-actions">
            <button class="btn ghost sm" @click="abrir(g._id)"><i class="fa-solid fa-eye" /> Ver / vista previa</button>
            <button v-if="!isRecibido(g)" class="btn primary sm" @click="openRecibir(g)"><i class="fa-solid fa-box-open" /> Marcar recibido</button>
            <span v-else class="recibido-note"><i class="fa-solid fa-envelope-circle-check" /> Cliente avisado</span>
          </div>
        </article>
      </div>
    </template>

    <!-- Quick "recibido" modal -->
    <transition name="modal">
      <div v-if="recibir" class="overlay" @click.self="!saving && (recibir = null)">
        <div class="card-modal">
          <div class="cm-head">
            <h3>Marcar recibido en bodega</h3>
            <button class="close" :disabled="saving" @click="recibir = null"><i class="fa-solid fa-xmark" /></button>
          </div>
          <p class="cm-sub">Cliente: <strong>{{ clienteNombre(recibir) }}</strong>. Sube las fotos de lo recibido; se previsualizan aquí y se suben al confirmar.</p>

          <div class="fotos">
            <div v-for="f in fotoItems" :key="f.id" class="foto" :class="f.status">
              <img :src="f.preview" alt="foto" />
              <span v-if="f.status === 'pending'" class="foto-tag"><i class="fa-regular fa-clock" /> por subir</span>
              <span v-else-if="f.status === 'uploading'" class="foto-state"><i class="fa-solid fa-spinner fa-spin" /></span>
              <span v-else class="foto-state done"><i class="fa-solid fa-check" /></span>
              <button v-if="!saving" class="rm" @click="removeFoto(f.id)"><i class="fa-solid fa-xmark" /></button>
            </div>
            <button class="foto add" :disabled="saving" @click="fileInput?.click()">
              <i class="fa-solid fa-camera" /><span>Agregar</span>
            </button>
          </div>
          <input ref="fileInput" type="file" accept="image/*" multiple capture="environment" class="hidden" @change="onFiles" />

          <div class="field">
            <label>Tiempo estimado de entrega (opcional)</label>
            <div class="chips">
              <button v-for="c in etaChips" :key="c" type="button" class="chip" :class="{ selected: eta === c }" @click="eta = c">{{ c }}</button>
            </div>
          </div>

          <textarea v-model="nota" rows="2" placeholder="Nota para el cliente (opcional)"></textarea>

          <!-- Resumen -->
          <div v-if="fotoItems.length" class="resumen">
            <span><i class="fa-solid fa-images" /> {{ fotoItems.length }} foto(s)</span>
            <span v-if="eta"><i class="fa-solid fa-clock" /> {{ eta }}</span>
            <span><i class="fa-solid fa-envelope" /> Avisará a {{ clienteEmail(recibir) || 'sin correo' }}</span>
          </div>

          <p v-if="error" class="err">{{ error }}</p>

          <div class="cm-foot">
            <button class="btn ghost" :disabled="saving" @click="recibir = null">Cancelar</button>
            <button class="btn primary" :disabled="saving || !fotoItems.length" @click="askConfirm">
              <i class="fa-solid fa-check" /> Confirmar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Second confirmation -->
    <transition name="modal">
      <div v-if="confirmAsk" class="overlay confirm-layer" @click.self="!saving && (confirmAsk = false)">
        <div class="card-modal small">
          <div v-if="saving" class="sending">
            <div class="spinner"><span class="ring"></span><span class="ring ring2"></span><i class="fa-solid fa-box"></i></div>
            <p class="sending-msg">{{ sendingMsg }}</p>
            <div v-if="totalToUpload" class="up-bar"><div class="up-fill" :style="{ width: `${totalToUpload ? Math.round((uploadedCount/totalToUpload)*100) : 0}%` }"></div></div>
            <span v-if="totalToUpload" class="up-count">{{ uploadedCount }} / {{ totalToUpload }} imágenes</span>
          </div>
          <template v-else>
            <div class="del-icon warn"><i class="fa-solid fa-bell" /></div>
            <h3>¿Confirmar recepción?</h3>
            <p>Esto <strong>disparará una notificación al cliente</strong> ({{ clienteEmail(recibir) || 'sin correo' }}) avisando que su producto llegó a bodega.</p>
            <div class="cm-foot center">
              <button class="btn ghost" @click="confirmAsk = false">Volver</button>
              <button class="btn primary" @click="doConfirm"><i class="fa-solid fa-paper-plane" /> Sí, notificar</button>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'

const router = useRouter()
const toast = useToastStore()
const loading = ref(true)
const gestiones = ref<GestionCompra[]>([])
const q = ref('')
const estadoFiltro = ref<'todos' | 'por_recibir' | 'en_bodega'>('todos')

const rangePreset = ref<'todos' | 'hoy' | '7' | '30' | 'custom'>('todos')
const desde = ref('')
const hasta = ref('')
const presets = [
  { key: 'todos' as const, label: 'Todas' },
  { key: 'hoy' as const, label: 'Hoy' },
  { key: '7' as const, label: '7 días' },
  { key: '30' as const, label: '30 días' },
]

// quick receive modal — local-first preview, upload only on final confirm
const recibir = ref<GestionCompra | null>(null)
interface FotoItem { id: number; file: File; preview: string; status: 'pending' | 'uploading' | 'done'; url?: string }
const fotoItems = ref<FotoItem[]>([])
let fotoSeq = 0
const nota = ref('')
const eta = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const error = ref('')
const confirmAsk = ref(false)
const sendingMsg = ref('')
const uploadedCount = ref(0)
const totalToUpload = ref(0)
const etaChips = ['Hoy mismo', '24 horas', '1 a 2 días', '3 a 5 días', '1 semana']

function money(v: unknown) { return (Number(v) || 0).toFixed(2) }
function clienteNombre(g: GestionCompra) {
  return typeof g.contactoId === 'object' && g.contactoId ? g.contactoId.nombre : 'Cliente'
}
function asesorNombre(g: GestionCompra) {
  return typeof g.asesorId === 'object' && g.asesorId ? (g.asesorId as any).name : '—'
}
function clienteEmail(g: GestionCompra | null) {
  return g && typeof g.contactoId === 'object' && g.contactoId ? ((g.contactoId as any).email || '') : ''
}
function isRecibido(g: GestionCompra) {
  return ['comprada', 'en_transito', 'entregada'].includes(g.stage)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' })
}

function setPreset(key: typeof rangePreset.value) {
  rangePreset.value = key
  desde.value = ''
  hasta.value = ''
}

const filtered = computed(() => {
  let list = gestiones.value

  const term = q.value.trim().toLowerCase()
  if (term) {
    list = list.filter((g) => clienteNombre(g).toLowerCase().includes(term) || (g.paginaCompra || '').toLowerCase().includes(term))
  }

  if (estadoFiltro.value === 'por_recibir') list = list.filter((g) => !isRecibido(g))
  else if (estadoFiltro.value === 'en_bodega') list = list.filter((g) => isRecibido(g))

  const now = new Date()
  if (rangePreset.value === 'hoy') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    list = list.filter((g) => new Date(g.createdAt) >= start)
  } else if (rangePreset.value === '7' || rangePreset.value === '30') {
    const days = rangePreset.value === '7' ? 7 : 30
    const start = new Date(now.getTime() - days * 86400000)
    list = list.filter((g) => new Date(g.createdAt) >= start)
  } else if (rangePreset.value === 'custom') {
    if (desde.value) {
      const d = new Date(desde.value + 'T00:00:00')
      list = list.filter((g) => new Date(g.createdAt) >= d)
    }
    if (hasta.value) {
      const h = new Date(hasta.value + 'T23:59:59')
      list = list.filter((g) => new Date(g.createdAt) <= h)
    }
  }

  return list
})

function abrir(id: string) { router.push(`/bodega/compras/${id}`) }

function openRecibir(g: GestionCompra) {
  recibir.value = g
  fotoItems.value = []
  nota.value = ''
  eta.value = ''
  error.value = ''
  confirmAsk.value = false
}

// Preview locally only — NO upload here.
function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    fotoItems.value.push({ id: ++fotoSeq, file, preview: URL.createObjectURL(file), status: 'pending' })
  }
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function removeFoto(itemId: number) {
  const idx = fotoItems.value.findIndex((f) => f.id === itemId)
  if (idx >= 0) {
    const item = fotoItems.value[idx]
    if (item) URL.revokeObjectURL(item.preview)
    fotoItems.value.splice(idx, 1)
  }
}

// Step 1: ask for final confirmation.
function askConfirm() {
  if (!fotoItems.value.length) { error.value = 'Sube al menos una foto'; return }
  error.value = ''
  confirmAsk.value = true
}

// Step 2: upload image by image + notify.
async function doConfirm() {
  if (!recibir.value) return
  saving.value = true
  error.value = ''
  const pending = fotoItems.value.filter((f) => f.status !== 'done')
  totalToUpload.value = pending.length
  uploadedCount.value = 0
  sendingMsg.value = 'Subiendo imágenes...'
  try {
    for (const item of pending) {
      item.status = 'uploading'
      const url = await gestionesCompraAPI.uploadImagen(item.file)
      if (!url) throw new Error('No se pudo subir una imagen (revisa Cloudinary).')
      item.url = url
      item.status = 'done'
      uploadedCount.value++
    }
    sendingMsg.value = 'Notificando al cliente...'
    await gestionesCompraAPI.recepcionBodega(recibir.value._id, {
      fotos: fotoItems.value.filter((f) => f.url).map((f) => ({ url: f.url as string, title: 'Recibido en bodega' })),
      notas: nota.value || undefined,
      entregaEstimada: eta.value.trim() || undefined,
      enviarCorreo: true,
    })
    toast.showNotification('Recibido registrado y cliente avisado', 'success')
    confirmAsk.value = false
    recibir.value = null
    await load()
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudo registrar'
    confirmAsk.value = false
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const res = await gestionesCompraAPI.list({ limit: 100 })
    gestiones.value = res.gestiones
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.bodega-compras { display: flex; flex-direction: column; gap: $space-5; }
.head h1 { margin: 0 0 4px; color: $fg-dark; font-size: 1.5rem; }
.head p { margin: 0; color: $ink-300; max-width: 680px; }

.filters { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; }
.search {
  display: flex; align-items: center; gap: $space-2; background: $ink-900; border: 1px solid $ink-700;
  border-radius: 12px; padding: $space-2 $space-4; color: $ink-400; flex: 1 1 240px;
  input { background: none; border: none; outline: none; color: $fg-dark; font-family: inherit; width: 100%; }
}
.presets, .estado-filter { display: flex; gap: $space-2; flex-wrap: wrap; }
.presets button, .estado-filter button {
  padding: $space-2 $space-3; border-radius: 10px; background: $ink-900; border: 1px solid $ink-700;
  color: $ink-300; cursor: pointer; font-weight: 600; font-size: 0.85rem;
  &.active { border-color: $brand-orange; color: $brand-orange; background: rgba($brand-orange, 0.08); }
}
.range { display: flex; gap: $space-3; flex-wrap: wrap; }
.range label { display: flex; flex-direction: column; gap: 4px; color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.range input { background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark; padding: 6px 10px; font-family: inherit; color-scheme: dark; }

.grid { display: flex; flex-wrap: wrap; gap: $space-4; }
.card {
  flex: 1 1 300px; max-width: 420px; background: $ink-900; border: 1px solid $ink-700; border-radius: 16px;
  padding: $space-4; display: flex; flex-direction: column; gap: $space-2;
  &.recibido { border-color: rgba(43,187,146,0.35); }
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: $space-2; }
.card-head strong { color: $fg-dark; }
.tienda { margin: 0; color: $ink-300; font-size: 0.85rem; word-break: break-word; }
.card-foot { display: flex; align-items: center; justify-content: space-between; color: $ink-400; font-size: 0.8rem; }
.valor { color: $brand-orange; font-weight: 800; }
.card-actions { display: flex; align-items: center; gap: $space-2; flex-wrap: wrap; border-top: 1px solid $ink-700; padding-top: $space-3; margin-top: $space-1; }
.recibido-note { color: $signal-green; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.badge.ok { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.wait { background: rgba(240,138,31,0.14); color: $brand-orange; }
.empty { color: $ink-400; text-align: center; padding: $space-6 0; }
.skeletons { display: flex; flex-wrap: wrap; gap: $space-4; }
.sk { flex: 1 1 300px; max-width: 420px; height: 150px; border-radius: 16px; background: $ink-800; animation: pulse 1.4s infinite; }

.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 10px; padding: $space-2 $space-3; font-weight: 700; cursor: pointer; border: 1px solid transparent; font-size: 0.85rem; }
.btn.sm { font-size: 0.82rem; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }

.overlay { position: fixed; inset: 0; z-index: 120; background: rgba($ink-1000, 0.82); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: $space-4; }
.card-modal { width: min(560px, 100%); max-height: 92vh; overflow: auto; background: $ink-900; border: 1px solid $ink-700; border-radius: 20px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.cm-head { display: flex; align-items: center; justify-content: space-between; }
.cm-head h3 { margin: 0; color: $fg-dark; }
.cm-sub { margin: 0; color: $ink-300; font-size: 0.88rem; strong { color: $fg-dark; } }
.close { background: transparent; border: 1px solid $ink-600; color: $ink-300; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; }
.fotos { display: flex; flex-wrap: wrap; gap: $space-3; }
.foto { position: relative; width: 110px; height: 110px; border-radius: 12px; overflow: hidden; border: 1px solid $ink-700; background: $ink-1000; }
.foto img { width: 100%; height: 100%; object-fit: cover; }
.foto .rm { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); border: none; color: #fff; border-radius: 8px; width: 24px; height: 24px; cursor: pointer; }
.foto.add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px dashed $ink-500; color: $ink-400; cursor: pointer; i { font-size: 1.2rem; color: $brand-orange; } span { font-size: 0.72rem; } }
.foto.uploading { border-color: $brand-orange; }
.foto.done { border-color: $signal-green; }
.foto-tag { position: absolute; left: 4px; bottom: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.65); color: $brand-orange; font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
.foto-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); color: #fff; font-size: 1rem; &.done { color: $signal-green; } }
.hidden { display: none; }
.field { display: flex; flex-direction: column; gap: $space-2; }
.field label { color: $ink-300; font-size: 0.82rem; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: $space-2; }
.chip { padding: 6px 12px; border-radius: 999px; background: $ink-1000; border: 1px solid $ink-500; color: $ink-300; cursor: pointer; font-size: 0.82rem; font-weight: 600; &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.1); color: $brand-orange; } }
.resumen { display: flex; flex-wrap: wrap; gap: $space-3; background: $ink-1000; border: 1px solid $ink-700; border-radius: 10px; padding: $space-3 $space-4; span { color: $ink-300; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; } i { color: $brand-orange; } }
textarea { background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark; padding: $space-3; resize: vertical; font-family: inherit; outline: none; &:focus { border-color: $brand-orange; } }
.err { color: $signal-red; font-size: 0.85rem; margin: 0; }
.cm-foot { display: flex; justify-content: flex-end; gap: $space-3; }
.cm-foot.center { justify-content: center; }
.confirm-layer { z-index: 130; }
.card-modal.small { max-width: 440px; text-align: center; align-items: center; }
.card-modal.small h3 { margin: 0; color: $fg-dark; }
.card-modal.small p { margin: 0; color: $ink-300; strong { color: $fg-dark; } }
.del-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
.del-icon.warn { background: rgba($brand-orange, 0.14); color: $brand-orange; }
.sending { display: flex; flex-direction: column; align-items: center; gap: $space-3; padding: $space-4 0; }
.spinner { position: relative; width: 84px; height: 84px; display: flex; align-items: center; justify-content: center; }
.spinner i { color: $brand-orange; font-size: 1.4rem; animation: pulseBox 1.2s ease-in-out infinite; }
.ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: $brand-orange; animation: spin 0.9s linear infinite; box-shadow: 0 0 20px rgba($brand-orange, 0.35); }
.ring2 { inset: 11px; border-top-color: rgba($brand-orange, 0.5); animation-duration: 1.4s; animation-direction: reverse; }
.sending-msg { color: $fg-dark; font-weight: 700; margin: 0; }
.up-bar { width: min(280px, 80%); height: 6px; border-radius: 999px; background: $ink-700; overflow: hidden; }
.up-fill { height: 100%; background: $brand-orange; border-radius: 999px; transition: width 0.3s ease; box-shadow: 0 0 12px rgba($brand-orange, 0.5); }
.up-count { color: $ink-300; font-size: 0.8rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulseBox { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .card-modal, .modal-leave-active .card-modal { transition: transform 0.24s ease; }
.modal-enter-from .card-modal, .modal-leave-to .card-modal { transform: translateY(18px) scale(0.96); }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (max-width: 640px) { .card, .sk { max-width: 100%; } }
</style>
