<template>
  <div class="detail">
    <button class="back" @click="$router.push('/bodega')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Compras
    </button>

    <div v-if="loading" class="loading">Cargando compra...</div>

    <template v-else-if="gestion">
      <section class="card info">
        <div class="info-head">
          <div>
            <span class="eyebrow">Gestión de compra</span>
            <h1>{{ clienteNombre }}</h1>
          </div>
          <span class="badge" :class="`stage-${gestion.stage}`">{{ stageLabel(gestion.stage) }}</span>
        </div>
        <div class="meta">
          <div><span>Tienda</span><strong>{{ gestion.paginaCompra || '—' }}</strong></div>
          <div><span>Valor total</span><strong>${{ money(gestion.valorTotal) }}</strong></div>
          <div><span>Asesor</span><strong>{{ asesorNombre }}</strong></div>
          <div><span>Correo cliente</span><strong>{{ clienteEmail || 'Sin correo' }}</strong></div>
        </div>
      </section>

      <!-- Already received -->
      <section v-if="yaRecibido" class="card evidence">
        <h3><i class="fa-solid fa-circle-check" aria-hidden="true" /> Producto recibido en bodega</h3>
        <p class="muted">El cliente ya fue notificado de que su producto llegó.</p>
        <div class="ev-fotos">
          <img v-for="(f, i) in gestion.fotosRelacionadas" :key="i" :src="f.url" alt="foto" />
        </div>
      </section>

      <!-- CTA to register -->
      <section v-else class="card cta">
        <div class="cta-icon"><i class="fa-solid fa-box-open" aria-hidden="true" /></div>
        <div class="cta-copy">
          <h3>Registrar envío en bodega</h3>
          <p>Sube la foto de lo recibido, define el tiempo estimado de entrega y avisa al cliente que ya lo tenemos.</p>
        </div>
        <button class="btn primary lg" @click="openModal"><i class="fa-solid fa-box-open" aria-hidden="true" /> Registrar envío</button>
      </section>
    </template>

    <p v-else class="loading">No se encontró la compra.</p>

    <!-- REGISTER MODAL -->
    <transition name="modal">
      <div v-if="showModal" class="overlay" @click.self="!sending && closeModal()">
        <div class="reg-modal">
          <!-- Sending overlay (sophisticated, per-image progress) -->
          <transition name="fade">
            <div v-if="sending || done" class="sending">
              <div v-if="!done" class="spinner">
                <span class="ring"></span>
                <span class="ring ring2"></span>
                <i class="fa-solid fa-box"></i>
              </div>
              <div v-else class="check-pop"><i class="fa-solid fa-check"></i></div>
              <p class="sending-msg">{{ done ? '¡Listo! Cliente notificado' : sendingMsg }}</p>

              <template v-if="!done">
                <div v-if="totalToUpload" class="up-progress">
                  <div class="up-bar"><div class="up-fill" :style="{ width: uploadPercent + '%' }"></div></div>
                  <span class="up-count">{{ uploadedCount }} / {{ totalToUpload }} imágenes</span>
                </div>
                <div class="up-thumbs">
                  <div v-for="f in fotoItems" :key="f.id" class="up-thumb" :class="f.status">
                    <img :src="f.preview" alt="foto" />
                    <span class="up-state">
                      <i v-if="f.status === 'done'" class="fa-solid fa-check"></i>
                      <i v-else-if="f.status === 'uploading'" class="fa-solid fa-spinner fa-spin"></i>
                      <i v-else-if="f.status === 'error'" class="fa-solid fa-triangle-exclamation"></i>
                      <i v-else class="fa-regular fa-clock"></i>
                    </span>
                  </div>
                </div>
                <div class="dots"><span></span><span></span><span></span></div>
              </template>
            </div>
          </transition>

          <div class="rm-head">
            <h3>Registrar envío</h3>
            <button class="close" :disabled="sending" @click="closeModal"><i class="fa-solid fa-xmark" /></button>
          </div>

          <div class="rm-body">
            <!-- Fotos -->
            <div class="field">
              <label>Foto(s) de lo recibido *</label>
              <div class="fotos">
                <div v-for="f in fotoItems" :key="f.id" class="foto">
                  <img :src="f.preview" alt="foto" />
                  <span class="foto-tag"><i class="fa-regular fa-clock" /> por subir</span>
                  <button class="rm" @click="removeFoto(f.id)"><i class="fa-solid fa-xmark" /></button>
                </div>
                <button class="foto add" @click="fileInput?.click()">
                  <i class="fa-solid fa-camera" /><span>Agregar</span>
                </button>
              </div>
              <span class="hint-sm">Se previsualizan aquí; se suben al presionar “Confirmar”.</span>
              <input ref="fileInput" type="file" accept="image/*" multiple capture="environment" class="hidden" @change="onFiles" />
            </div>

            <!-- ETA -->
            <div class="field">
              <label>¿En cuánto lo tendrá el cliente? *</label>
              <div class="chips">
                <button v-for="c in etaChips" :key="c" type="button" class="chip" :class="{ selected: eta === c }" @click="eta = c">{{ c }}</button>
              </div>
              <input v-model="eta" class="eta-input" placeholder="O escríbelo: ej. 2 a 3 días hábiles" />
            </div>

            <!-- Nota -->
            <div class="field">
              <label>Nota para el cliente (opcional)</label>
              <textarea v-model="nota" rows="2" placeholder="Ej. llegó en perfecto estado..."></textarea>
            </div>

            <!-- Preview toggle -->
            <button type="button" class="preview-toggle" @click="showPreview = !showPreview">
              <i class="fa-solid" :class="showPreview ? 'fa-chevron-up' : 'fa-eye'" /> {{ showPreview ? 'Ocultar' : 'Previsualizar lo que verá el cliente' }}
            </button>

            <transition name="expand">
              <div v-if="showPreview" class="email-preview">
                <div class="ep-banner">Producto recibido en bodega</div>
                <div class="ep-inner">
                  <p>Hola <strong>{{ clienteNombre }}</strong>,</p>
                  <p>¡Tu producto llegó a nuestra bodega y está siendo procesado para su envío!</p>
                  <div v-if="eta" class="ep-eta"><span>Tiempo estimado de entrega</span><strong>{{ eta }}</strong></div>
                  <div class="ep-fotos"><img v-for="f in fotoItems" :key="f.id" :src="f.preview" alt="f" /></div>
                  <p v-if="nota" class="ep-nota">{{ nota }}</p>
                  <div class="ep-btn">Ver estado de mi pedido</div>
                </div>
                <a v-if="trackingUrl" class="ep-page" :href="trackingUrl" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" /> Ver también la página de seguimiento</a>
              </div>
            </transition>

            <p v-if="error" class="err">{{ error }}</p>
          </div>

          <div class="rm-foot">
            <button class="btn ghost" :disabled="sending" @click="closeModal">Cancelar</button>
            <button class="btn primary" :disabled="sending || !fotoItems.length || !eta.trim()" @click="confirmar">
              <i class="fa-solid fa-paper-plane" /> Confirmar y notificar
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const id = String(route.params.id)
const loading = ref(true)
const gestion = ref<GestionCompra | null>(null)

const showModal = ref(false)
const showPreview = ref(false)
const sending = ref(false)
const done = ref(false)
const sendingMsg = ref('')
const error = ref('')
const eta = ref('')
const nota = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Local-first photos: preview immediately, upload only on "Guardar".
interface FotoItem { id: number; file: File; preview: string; status: 'pending' | 'uploading' | 'done' | 'error'; url?: string }
const fotoItems = ref<FotoItem[]>([])
let fotoSeq = 0
const uploadedCount = ref(0)
const totalToUpload = ref(0)
const uploadPercent = computed(() => (totalToUpload.value ? Math.round((uploadedCount.value / totalToUpload.value) * 100) : 0))

const etaChips = ['Hoy mismo', '24 horas', '1 a 2 días', '3 a 5 días', '1 semana']

const clienteNombre = computed(() => (typeof gestion.value?.contactoId === 'object' && gestion.value?.contactoId ? gestion.value.contactoId.nombre : 'Cliente'))
const clienteEmail = computed(() => (typeof gestion.value?.contactoId === 'object' && gestion.value?.contactoId ? (gestion.value.contactoId as any).email : ''))
const asesorNombre = computed(() => (typeof gestion.value?.asesorId === 'object' && gestion.value?.asesorId ? (gestion.value.asesorId as any).name : '—'))
const yaRecibido = computed(() => ['comprada', 'en_transito', 'entregada'].includes(gestion.value?.stage ?? ''))
const trackingUrl = computed(() => (gestion.value?.viewToken ? `${window.location.origin}/compra/${gestion.value.viewToken}` : ''))

function money(v: unknown) { return (Number(v) || 0).toFixed(2) }
function stageLabel(stage: string) {
  return { solicitada: 'Solicitada', revisando: 'Revisando', comprada: 'En bodega', en_transito: 'En tránsito', entregada: 'Entregada' }[stage] ?? stage
}

function openModal() {
  fotoItems.value = []
  eta.value = ''
  nota.value = ''
  error.value = ''
  showPreview.value = false
  done.value = false
  uploadedCount.value = 0
  totalToUpload.value = 0
  showModal.value = true
}
function closeModal() {
  if (sending.value) return
  showModal.value = false
}

// Only build local previews here — NO upload yet.
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

async function confirmar() {
  if (!fotoItems.value.length || !eta.value.trim()) return
  if (!clienteEmail.value) {
    error.value = 'Este cliente no tiene correo; no se puede notificar.'
    return
  }
  sending.value = true
  done.value = false
  error.value = ''

  // 1) Upload image by image, relating each resulting URL to this order.
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

    // 2) Relate all URLs to the order + notify client.
    sendingMsg.value = 'Notificando al cliente...'
    const urls = fotoItems.value.filter((f) => f.url).map((f) => ({ url: f.url as string, title: 'Recibido en bodega' }))
    await gestionesCompraAPI.recepcionBodega(id, {
      fotos: urls,
      notas: nota.value || undefined,
      entregaEstimada: eta.value.trim(),
      enviarCorreo: true,
    })

    done.value = true
    await new Promise((r) => setTimeout(r, 1100))
    toast.showNotification('Envío registrado y cliente notificado', 'success')
    router.push('/bodega')
  } catch (err: any) {
    for (const it of fotoItems.value) if (it.status === 'uploading') it.status = 'error'
    sending.value = false
    error.value = err?.message ?? 'No se pudo registrar. Reintenta.'
  }
}

onMounted(async () => {
  try {
    gestion.value = await gestionesCompraAPI.getById(id)
  } catch {
    gestion.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.detail { display: flex; flex-direction: column; gap: $space-4; }
.back { align-self: flex-start; background: transparent; border: none; color: $brand-orange; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: $space-2; }
.loading { color: $ink-400; text-align: center; padding: $space-6 0; }
.card { background: $ink-900; border: 1px solid $ink-700; border-radius: 16px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.card h3 { margin: 0; color: $fg-dark; font-size: 1.05rem; display: flex; align-items: center; gap: $space-2; }
.info-head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-3; }
.eyebrow { color: $brand-orange; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
.info-head h1 { margin: 4px 0 0; color: $fg-dark; font-size: 1.4rem; }
.meta { display: flex; flex-wrap: wrap; gap: $space-4; }
.meta > div { display: flex; flex-direction: column; gap: 2px; }
.meta span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.meta strong { color: $fg-dark; }
.muted { color: $ink-400; font-size: 0.85rem; margin: 0; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: $ink-700; color: $ink-300; }
.badge.stage-comprada { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.stage-en_transito { background: rgba(240,138,31,0.16); color: $brand-orange; }

.evidence .ev-fotos { display: flex; flex-wrap: wrap; gap: $space-3; }
.evidence img { width: 130px; height: 130px; object-fit: cover; border-radius: 12px; border: 1px solid $ink-700; }

.cta { align-items: center; text-align: center; gap: $space-3; }
.cta-icon { width: 64px; height: 64px; border-radius: 18px; background: rgba($brand-orange, 0.12); color: $brand-orange; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
.cta-copy h3 { justify-content: center; }
.cta-copy p { margin: $space-2 0 0; color: $ink-300; max-width: 460px; }

.btn { display: inline-flex; align-items: center; gap: $space-2; border-radius: 12px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.lg { padding: $space-4 $space-5; font-size: 1rem; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }

.overlay { position: fixed; inset: 0; z-index: 120; background: rgba($ink-1000, 0.82); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: $space-4; }
.reg-modal { position: relative; width: min(620px, 100%); max-height: 92vh; overflow: auto; background: $ink-900; border: 1px solid $ink-700; border-radius: 22px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.rm-head { display: flex; align-items: center; justify-content: space-between; }
.rm-head h3 { margin: 0; color: $fg-dark; }
.close { background: transparent; border: 1px solid $ink-600; color: $ink-300; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; }
.rm-body { display: flex; flex-direction: column; gap: $space-4; }
.field { display: flex; flex-direction: column; gap: $space-2; }
.field label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.fotos { display: flex; flex-wrap: wrap; gap: $space-3; }
.foto { position: relative; width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 1px solid $ink-700; background: $ink-1000; }
.foto img { width: 100%; height: 100%; object-fit: cover; }
.foto .rm { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); border: none; color: #fff; border-radius: 8px; width: 22px; height: 22px; cursor: pointer; }
.foto.add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px dashed $ink-500; color: $ink-400; cursor: pointer; i { font-size: 1.1rem; color: $brand-orange; } span { font-size: 0.72rem; } }
.foto-tag { position: absolute; left: 4px; bottom: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.65); color: $brand-orange; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
.hint-sm { color: $ink-400; font-size: 0.76rem; }
.hidden { display: none; }
.chips { display: flex; flex-wrap: wrap; gap: $space-2; }
.chip { padding: 6px 12px; border-radius: 999px; background: $ink-1000; border: 1px solid $ink-500; color: $ink-300; cursor: pointer; font-size: 0.82rem; font-weight: 600; &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.1); color: $brand-orange; } }
.eta-input, textarea { background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark; padding: $space-3; font-family: inherit; outline: none; &:focus { border-color: $brand-orange; } }
.preview-toggle { align-self: flex-start; background: transparent; border: none; color: $brand-orange; cursor: pointer; display: inline-flex; align-items: center; gap: $space-2; font-weight: 700; font-size: 0.88rem; padding: 0; }
.email-preview { border: 1px solid $ink-700; border-radius: 12px; overflow: hidden; }
.ep-banner { background: #f57c00; color: #fff; padding: $space-4; font-weight: 800; }
.ep-inner { background: #1a1a1a; color: #e0e0e0; padding: $space-4; }
.ep-inner p { line-height: 1.5; margin: 0 0 8px; }
.ep-eta { margin: 12px 0; padding: 10px 14px; background: #252525; border-left: 3px solid #f57c00; border-radius: 8px; display: flex; flex-direction: column; gap: 2px; span { color: #999; font-size: 0.72rem; } strong { color: #f57c00; } }
.ep-fotos { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; img { width: 46%; border-radius: 8px; border: 1px solid #333; } }
.ep-nota { color: #aaa; }
.ep-btn { background: #f57c00; color: #fff; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; margin-top: 12px; }
.ep-page { display: inline-flex; align-items: center; gap: 6px; color: $brand-orange; text-decoration: none; padding: $space-3; font-size: 0.85rem; }
.err { color: $signal-red; font-size: 0.85rem; margin: 0; }
.rm-foot { display: flex; justify-content: flex-end; gap: $space-3; }

/* Sophisticated sending overlay */
.sending {
  position: absolute; inset: 0; z-index: 5; border-radius: 22px;
  background: rgba($ink-1000, 0.92); backdrop-filter: blur(4px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-4;
}
.spinner { position: relative; width: 92px; height: 92px; display: flex; align-items: center; justify-content: center; }
.spinner i { color: $brand-orange; font-size: 1.6rem; animation: pulseBox 1.2s ease-in-out infinite; }
.ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: $brand-orange; animation: spin 0.9s linear infinite; box-shadow: 0 0 22px rgba($brand-orange, 0.35); }
.ring2 { inset: 12px; border-top-color: rgba($brand-orange, 0.5); animation-duration: 1.4s; animation-direction: reverse; }
.sending-msg { color: $fg-dark; font-weight: 700; margin: 0; }
.up-progress { display: flex; flex-direction: column; align-items: center; gap: 6px; width: min(320px, 80%); }
.up-bar { width: 100%; height: 6px; border-radius: 999px; background: $ink-700; overflow: hidden; }
.up-fill { height: 100%; background: $brand-orange; border-radius: 999px; transition: width 0.3s ease; box-shadow: 0 0 12px rgba($brand-orange, 0.5); }
.up-count { color: $ink-300; font-size: 0.8rem; }
.up-thumbs { display: flex; flex-wrap: wrap; gap: $space-2; justify-content: center; max-width: 380px; }
.up-thumb { position: relative; width: 54px; height: 54px; border-radius: 10px; overflow: hidden; border: 1px solid $ink-600; opacity: 0.55; transition: opacity 0.2s, border-color 0.2s; }
.up-thumb img { width: 100%; height: 100%; object-fit: cover; }
.up-thumb.uploading { opacity: 1; border-color: $brand-orange; }
.up-thumb.done { opacity: 1; border-color: $signal-green; }
.up-thumb.error { opacity: 1; border-color: $signal-red; }
.up-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); color: #fff; font-size: 0.85rem; }
.up-thumb.done .up-state { color: $signal-green; background: rgba(0,0,0,0.35); }
.up-thumb.error .up-state { color: $signal-red; }
.up-thumb.pending .up-state { color: $ink-300; }
.dots { display: flex; gap: 6px; }
.dots span { width: 8px; height: 8px; border-radius: 50%; background: $brand-orange; opacity: 0.4; animation: blink 1s infinite; }
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }
.check-pop { width: 84px; height: 84px; border-radius: 50%; background: rgba(43,187,146,0.16); color: $signal-green; display: flex; align-items: center; justify-content: center; font-size: 2rem; animation: pop 0.35s cubic-bezier(0.22,1,0.36,1); }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes pulseBox { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .reg-modal, .modal-leave-active .reg-modal { transition: transform 0.24s ease; }
.modal-enter-from .reg-modal, .modal-leave-to .reg-modal { transform: translateY(18px) scale(0.96); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }

@media (max-width: 640px) { .meta { gap: $space-3; } }
</style>
