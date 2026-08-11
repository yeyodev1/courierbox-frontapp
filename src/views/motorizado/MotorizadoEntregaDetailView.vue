<template>
  <div class="detail">
    <button class="back" @click="$router.push('/motorizado')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Mis entregas
    </button>

    <div v-if="loading" class="loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="title" />
      <AppSkeleton variant="card" height="150px" />
      <AppSkeleton variant="card" height="220px" />
    </div>

    <template v-else-if="envio">
      <section class="info-card">
        <div class="info-head">
          <h2>{{ envio.clienteNombre }}</h2>
          <span class="badge" :class="`estado-${envio.estado}`">{{ estadoLabel(envio.estado) }}</span>
        </div>

        <a v-if="mapsUrl" class="dir-link" :href="mapsUrl" target="_blank" rel="noopener">
          <i class="fa-solid fa-location-dot" aria-hidden="true" />
          <span>{{ envio.clienteDireccion }}</span>
          <i class="fa-solid fa-arrow-up-right-from-square ext" aria-hidden="true" />
        </a>
        <p v-else class="dir-plain"><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ envio.clienteDireccion }}</p>

        <div class="quick-actions" v-if="envio.clienteTelefono">
          <a class="qa call" :href="`tel:${envio.clienteTelefono}`"><i class="fa-solid fa-phone" aria-hidden="true" /> Llamar</a>
        </div>

        <div class="meta-grid">
          <div><span>Valor cobrado</span><strong>${{ (envio.valorCobrado || 0).toFixed(2) }}</strong></div>
          <div><span>Modo</span><strong>{{ envio.modo === 'interprovincial' ? 'Interprovincial' : 'Local' }}</strong></div>
          <div v-if="envio.ciudadDestino"><span>Ciudad</span><strong>{{ envio.ciudadDestino }}</strong></div>
        </div>

        <div v-if="envio.notas" class="notas">
          <span>Instrucciones</span>
          <p>{{ envio.notas }}</p>
        </div>
      </section>

      <!-- Delivered: show evidence -->
      <section v-if="envio.estado === 'entregado'" class="evidence-card">
        <h3><i class="fa-solid fa-circle-check" aria-hidden="true" /> Entrega registrada</h3>
        <p v-if="envio.entregadoEn" class="muted">{{ formatDate(envio.entregadoEn) }}</p>
        <img v-if="envio.fotoEntregaUrl" :src="envio.fotoEntregaUrl" alt="Foto entrega" class="ev-img" />
        <p v-if="recibidoPorTexto" class="novedad-view"><strong>Recibido por:</strong> {{ recibidoPorTexto }}</p>
        <img v-if="envio.firmaUrl" :src="envio.firmaUrl" alt="Firma" class="ev-firma" />
        <p v-if="envio.novedad" class="novedad-view"><strong>Novedad:</strong> {{ envio.novedad }}</p>
      </section>

      <!-- Delivery capture -->
      <section v-else class="capture-card">
        <h3>Registrar entrega</h3>

        <div v-if="envio.estado === 'asignado' || envio.estado === 'reprogramado'" class="route-start">
          <i class="fa-solid fa-route" aria-hidden="true" />
          <div>
            <strong>Inicia la ruta antes de entregar</strong>
            <span>La hora de salida quedará en la bitácora.</span>
          </div>
          <button type="button" :disabled="saving" @click="iniciarRuta">Iniciar ruta</button>
        </div>

        <template v-if="envio.estado === 'en_ruta'">

        <div class="field">
          <label>Foto de la entrega *</label>
          <div class="photo-box" @click="fileInput?.click()">
            <img v-if="fotoPreview" :src="fotoPreview" alt="Foto" />
            <div v-else class="photo-placeholder">
              <i class="fa-solid fa-camera" aria-hidden="true" />
              <span>{{ uploadingFoto ? 'Subiendo...' : 'Tomar / subir foto' }}</span>
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFoto" />
        </div>

        <div class="field">
          <label>Datos de quien recibe *</label>
          <div class="recibe-grid">
            <input v-model="recibeNombre" placeholder="Nombre" />
            <input v-model="recibeApellido" placeholder="Apellido" />
            <input v-model="recibeCedula" placeholder="Cédula" inputmode="numeric" />
            <input v-model="recibeContacto" placeholder="Correo o teléfono de quien recibe" />
          </div>
        </div>

        <div class="field">
          <label>Firma de quien recibe (con el dedo) *</label>
          <div class="sign-wrap">
            <canvas
              ref="canvas"
              class="sign-canvas"
              @pointerdown="startDraw"
              @pointermove="draw"
              @pointerup="endDraw"
              @pointerleave="endDraw"
            />
            <button type="button" class="clear-sign" @click="clearSign">Limpiar</button>
          </div>
        </div>

        <div class="field">
          <label>Novedad / observación (opcional)</label>
          <textarea v-model="novedad" rows="2" placeholder="Ej: recibió el conserje, timbre dañado..."></textarea>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="deliver-btn" :disabled="!puedeEntregar || saving" @click="entregar">
          <i class="fa-solid fa-check" aria-hidden="true" />
          {{ saving ? 'Guardando...' : 'Marcar como entregado' }}
        </button>
        <p class="hint">Se guardará como evidencia y se enviará el comprobante al cliente por correo.</p>

        <div class="failure-box">
          <label>¿No se pudo entregar?</label>
          <textarea v-model="motivoFallido" rows="2" placeholder="Indica el motivo obligatorio"></textarea>
          <button type="button" class="failure-btn" :disabled="!motivoFallido.trim() || saving" @click="marcarFallido">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Registrar entrega fallida
          </button>
        </div>
        </template>
      </section>
    </template>

    <p v-else class="loading">No se encontró la entrega.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useRoute, useRouter } from 'vue-router'
import { enviosApi, type EnvioDomicilio } from '@/services/envios.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const id = String(route.params.id)
const loading = ref(true)
const saving = ref(false)
const uploadingFoto = ref(false)
const error = ref('')
const envio = ref<EnvioDomicilio | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const fotoPreview = ref('')
const fotoUrl = ref('')
const firmaUrl = ref('')
const novedad = ref('')
const motivoFallido = ref('')
const recibeNombre = ref('')
const recibeApellido = ref('')
const recibeCedula = ref('')
const recibeContacto = ref('')

const puedeEntregar = computed(() =>
  envio.value?.estado === 'en_ruta' &&
  !!fotoUrl.value &&
  (!!firmaUrl.value || hasSignature.value) &&
  !!recibeNombre.value.trim() &&
  !!recibeApellido.value.trim() &&
  recibeCedula.value.replace(/\D+/g, '').length >= 6
)

const recibidoPorTexto = computed(() => {
  const e = envio.value
  if (!e) return ''
  const nombre = [e.recibidoPorNombre, e.recibidoPorApellido].filter(Boolean).join(' ')
  if (!nombre) return ''
  return e.recibidoPorCedula ? `${nombre} · CI ${e.recibidoPorCedula}` : nombre
})

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
const hasSignature = ref(false)

const mapsUrl = computed(() => {
  const dir = envio.value?.clienteDireccion ?? ''
  const urlMatch = dir.match(/https?:\/\/\S+/)
  if (urlMatch) return urlMatch[0]
  if (!dir) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`
})

function estadoLabel(estado: string) {
  return {
    pendiente: 'Pendiente', asignado: 'Asignado', en_ruta: 'En ruta',
    entregado: 'Entregado', fallido: 'Fallido', reprogramado: 'Reprogramado',
  }[estado] ?? estado
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

async function onFoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fotoPreview.value = URL.createObjectURL(file)
  uploadingFoto.value = true
  error.value = ''
  try {
    const res = await enviosApi.uploadArchivo(id, 'foto', file)
    fotoUrl.value = res.envio.fotoEntregaUrl || res.upload.url || ''
    if (!fotoUrl.value) error.value = 'La foto no se subió (revisa Cloudinary). Intenta de nuevo.'
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudo subir la foto'
    fotoPreview.value = ''
  } finally {
    uploadingFoto.value = false
  }
}

// --- signature pad ---
function setupCanvas() {
  const c = canvas.value
  if (!c) return
  const ratio = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  c.width = rect.width * ratio
  c.height = rect.height * ratio
  ctx = c.getContext('2d')
  if (ctx) {
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0B0B0E'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }
}
function pos(e: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
function startDraw(e: PointerEvent) {
  if (!ctx) return
  drawing = true
  const p = pos(e)
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
}
function draw(e: PointerEvent) {
  if (!drawing || !ctx) return
  const p = pos(e)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  hasSignature.value = true
}
function endDraw() { drawing = false }
function clearSign() {
  const c = canvas.value
  if (!c || !ctx) return
  const rect = c.getBoundingClientRect()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, rect.width, rect.height)
  hasSignature.value = false
}
function canvasToFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const c = canvas.value
    if (!c || !hasSignature.value) { resolve(null); return }
    c.toBlob((blob) => {
      if (!blob) { resolve(null); return }
      resolve(new File([blob], `firma-${id}.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

async function entregar() {
  if (!fotoUrl.value) { error.value = 'Toma la foto de la entrega primero'; return }
  if (!recibeNombre.value.trim() || !recibeApellido.value.trim() || !recibeCedula.value.trim()) {
    error.value = 'Completa nombre, apellido y cédula de quien recibe'
    return
  }
  if (!hasSignature.value && !firmaUrl.value) { error.value = 'La firma de quien recibe es obligatoria'; return }
  saving.value = true
  error.value = ''
  try {
    const firmaFile = await canvasToFile()
    if (!firmaFile && !firmaUrl.value) throw new Error('La firma de quien recibe es obligatoria')
    if (firmaFile) {
      const firmaResult = await enviosApi.uploadArchivo(id, 'firma', firmaFile)
      firmaUrl.value = firmaResult.envio.firmaUrl || firmaResult.upload.url || ''
    }
    if (!firmaUrl.value) throw new Error('No se pudo guardar la firma')
    const result = await enviosApi.marcarEntregado(id, {
      novedad: novedad.value,
      recibidoPorNombre: recibeNombre.value.trim(),
      recibidoPorApellido: recibeApellido.value.trim(),
      recibidoPorCedula: recibeCedula.value.trim(),
      recibidoPorContacto: recibeContacto.value.trim(),
    })
    if (!result.notificacion) {
      toast.showNotification('Entrega registrada. El cliente no tiene un correo configurado.', 'warning')
    } else {
      const emailSent = result.notificacion.estado === 'enviada'
      toast.showNotification(
        emailSent ? 'Entrega registrada y comprobante enviado por correo.' : 'Entrega registrada. El correo quedó pendiente de revisión administrativa.',
        emailSent ? 'success' : 'warning',
      )
    }
    router.push('/motorizado')
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudo marcar como entregado'
  } finally {
    saving.value = false
  }
}

async function iniciarRuta() {
  saving.value = true
  error.value = ''
  try {
    const result = await enviosApi.iniciarRuta(id)
    envio.value = result.envio
    await nextTick()
    setupCanvas()
    toast.showNotification('Ruta iniciada y registrada en la bitácora', 'success')
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudo iniciar la ruta'
  } finally {
    saving.value = false
  }
}

async function marcarFallido() {
  if (!motivoFallido.value.trim()) return
  saving.value = true
  error.value = ''
  try {
    const result = await enviosApi.marcarFallido(id, motivoFallido.value.trim())
    envio.value = result.envio
    toast.showNotification('Entrega fallida registrada en la bitácora', 'warning')
    router.push('/motorizado')
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudo registrar la novedad'
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const res = await enviosApi.getById(id)
    envio.value = res.envio
    fotoUrl.value = res.envio.fotoEntregaUrl || ''
    fotoPreview.value = res.envio.fotoEntregaUrl || ''
    firmaUrl.value = res.envio.firmaUrl || ''
  } catch {
    envio.value = null
  } finally {
    loading.value = false
    if (envio.value && envio.value.estado !== 'entregado') {
      await nextTick()
      setupCanvas()
    }
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.detail { display: flex; flex-direction: column; gap: $space-4; }
.back {
  align-self: flex-start; background: transparent; border: none; color: $brand-orange;
  cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: $space-2; font-size: 0.9rem;
}
.loading { color: $ink-400; text-align: center; padding: $space-6 0; }
.info-card, .capture-card, .evidence-card {
  background: $ink-900; border: 1px solid $ink-700; border-radius: 16px; padding: $space-5;
  display: flex; flex-direction: column; gap: $space-4;
}
.info-head { display: flex; align-items: center; justify-content: space-between; gap: $space-2; }
.info-head h2 { margin: 0; color: $fg-dark; font-size: 1.25rem; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: $ink-700; color: $ink-300; }
.badge.estado-entregado { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.estado-en_ruta { background: rgba(240,138,31,0.16); color: $brand-orange; }
.badge.estado-asignado { background: rgba(84,132,255,0.16); color: #7fa3ff; }
.dir-link, .dir-plain {
  display: flex; align-items: flex-start; gap: $space-2; color: $fg-dark; text-decoration: none;
  background: $ink-1000; border: 1px solid $ink-700; border-radius: 12px; padding: $space-3 $space-4; line-height: 1.4;
}
.dir-link { border-color: rgba($brand-orange, 0.3); }
.dir-link .ext { margin-left: auto; color: $brand-orange; }
.quick-actions { display: flex; gap: $space-3; }
.qa {
  flex: 1; text-align: center; padding: $space-3; border-radius: 12px; text-decoration: none; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; gap: $space-2;
}
.qa.call { background: $ink-700; color: $fg-dark; }
.meta-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.meta-grid > div { flex: 1 1 100px; display: flex; flex-direction: column; gap: 2px; }
.meta-grid span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.meta-grid strong { color: $fg-dark; }
.notas { display: flex; flex-direction: column; gap: 4px; }
.notas span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.notas p { margin: 0; color: $ink-300; line-height: 1.5; }

.capture-card h3, .evidence-card h3 { margin: 0; color: $fg-dark; font-size: 1.05rem; display: flex; align-items: center; gap: $space-2; }
.field { display: flex; flex-direction: column; gap: $space-2; }
.field label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.hidden { display: none; }
.photo-box {
  border: 2px dashed $ink-500; border-radius: 14px; min-height: 180px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; overflow: hidden; background: $ink-1000;
  img { width: 100%; max-height: 320px; object-fit: contain; }
}
.photo-placeholder { display: flex; flex-direction: column; align-items: center; gap: $space-2; color: $ink-400; }
.photo-placeholder i { font-size: 2rem; color: $brand-orange; }
.recibe-grid { display: flex; flex-direction: column; gap: $space-2; }
.recibe-grid input {
  background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark;
  padding: $space-3; font-family: inherit; outline: none;
  &:focus { border-color: $brand-orange; }
}
.sign-wrap { position: relative; }
.sign-canvas {
  width: 100%; height: 160px; background: #fff; border-radius: 12px; border: 1px solid $ink-500;
  touch-action: none; display: block;
}
.clear-sign {
  position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.06); border: 1px solid #ccc;
  color: #333; border-radius: 8px; padding: 4px 10px; cursor: pointer; font-size: 0.78rem;
}
textarea {
  background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark;
  padding: $space-3; resize: vertical; font-family: inherit; outline: none;
  &:focus { border-color: $brand-orange; }
}
.error { color: $signal-red; font-size: 0.85rem; margin: 0; }
.deliver-btn {
  background: $brand-orange; color: $ink-1000; border: none; border-radius: 14px;
  padding: $space-4; font-weight: 800; font-size: 1rem; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: $space-2;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.hint { color: $ink-400; font-size: 0.78rem; text-align: center; margin: 0; }
.route-start {
  display: flex; align-items: center; flex-wrap: wrap; gap: $space-3; padding: $space-4;
  border: 1px solid rgba($signal-blue, 0.45); border-radius: 14px; background: rgba($signal-blue, 0.1);
  transition: transform 180ms ease, border-color 180ms ease, opacity 180ms ease;
  > i { color: $signal-blue; font-size: 1.4rem; }
  > div { flex: 1 1 220px; display: flex; flex-direction: column; gap: 2px; }
  strong { color: $fg-dark; }
  span { color: $ink-300; font-size: 0.82rem; }
  button { border: 0; border-radius: 10px; padding: $space-3 $space-4; background: $signal-blue; color: #fff; font-weight: 800; cursor: pointer; }
}
.failure-box {
  display: flex; flex-direction: column; gap: $space-2; padding-top: $space-4;
  border-top: 1px solid rgba($signal-red, 0.3);
  label { color: $signal-red; font-weight: 700; }
}
.failure-btn {
  align-self: flex-start; display: inline-flex; align-items: center; gap: $space-2; border: 1px solid $signal-red;
  border-radius: 10px; padding: $space-3 $space-4; background: rgba($signal-red, 0.12); color: #ff8a8f;
  font-weight: 800; cursor: pointer; transition: transform 180ms ease, background 180ms ease;
  &:hover:not(:disabled) { transform: translateY(-2px); background: rgba($signal-red, 0.2); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
@media (prefers-reduced-motion: reduce) {
  .route-start, .failure-btn { transition: none; }
  .failure-btn:hover:not(:disabled) { transform: none; }
}
.ev-img { width: 100%; max-height: 320px; object-fit: contain; border-radius: 12px; border: 1px solid $ink-700; }
.ev-firma { width: 200px; background: #fff; border-radius: 8px; padding: 4px; }
.muted { color: $ink-400; font-size: 0.85rem; margin: 0; }
.novedad-view { color: $ink-300; margin: 0; strong { color: $fg-dark; } }
</style>
