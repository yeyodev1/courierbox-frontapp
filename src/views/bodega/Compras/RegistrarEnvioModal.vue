<script setup lang="ts">
/** Warehouse reception form: photos, ETA, note and a preview of the client's email. */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppUploadProgress from '@/components/ui/AppUploadProgress.vue'
import { ETA_CHIPS, useRegistrarEnvio } from './useRegistrarEnvio'

const props = defineProps<{
  open: boolean
  gestionId: string
  clienteNombre: string
  clienteEmail: string
  trackingUrl: string
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const r = useRegistrarEnvio(props.gestionId, () => props.clienteEmail)
const q = r.queue

/** Photos still to be stored — the number the operator is waiting on. */
const porSubir = computed(() => q.total.value - q.doneCount.value)

const STATE_TAG = {
  pending: { icon: 'fa-regular fa-clock', label: 'por subir' },
  uploading: { icon: 'fa-solid fa-arrow-up', label: 'subiendo' },
  done: { icon: 'fa-solid fa-check', label: 'guardada' },
  error: { icon: 'fa-solid fa-triangle-exclamation', label: 'falló' },
} as const

watch(() => props.open, (open) => { if (open) r.reset() })
onBeforeUnmount(q.releaseAll)

function close() {
  if (r.sending.value) return
  emit('close')
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  r.addFiles(Array.from(input.files ?? []))
  input.value = ''
}

async function confirmar() {
  if (await r.confirmar()) emit('done')
}
</script>

<template>
  <AppOverlay :open="open" label="Registrar recepción" :persistent="r.sending.value" @close="close">
    <div class="reg-modal">
      <transition name="fade">
        <div v-if="r.sending.value || r.done.value" class="sending">
          <AppUploadProgress
            :items="q.items.value"
            :done="q.doneCount.value"
            :failed="q.failedCount.value"
            :pending="q.pendingCount.value"
            :percent="q.percent.value"
            :message="r.statusMessage.value"
            :finished="r.done.value"
            finished-message="¡Listo! Cliente notificado"
            hint="No cierres esta ventana: estamos guardando las fotos y avisando al cliente."
            @retry="r.reintentar"
          />
        </div>
      </transition>

      <div class="rm-head">
        <h3>Registrar envío</h3>
        <button class="close" :disabled="r.sending.value" @click="close"><i class="fa-solid fa-xmark" /></button>
      </div>

      <div class="rm-body">
        <div class="field">
          <div class="field-head">
            <label>Foto(s) de lo recibido *</label>
            <span v-if="q.total.value" class="count-pill" :class="{ ready: !porSubir }">
              <template v-if="porSubir">{{ porSubir }} por subir</template>
              <template v-else><i class="fa-solid fa-check" /> todas guardadas</template>
            </span>
          </div>

          <div class="fotos">
            <div v-for="f in q.items.value" :key="f.id" class="foto" :class="f.status">
              <img :src="f.preview" alt="foto" />
              <span class="foto-tag">
                <i :class="STATE_TAG[f.status].icon" /> {{ STATE_TAG[f.status].label }}
              </span>
              <button class="rm" :disabled="r.sending.value" @click="q.remove(f.id)">
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
            <button class="foto add" @click="fileInput?.click()">
              <i class="fa-solid fa-camera" /><span>Agregar</span>
            </button>
          </div>

          <span class="hint-sm">Se previsualizan aquí; se suben al presionar “Confirmar”.</span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            class="hidden"
            @change="onFiles"
          />
        </div>

        <div class="field">
          <label>¿En cuánto lo tendrá el cliente? *</label>
          <div class="chips">
            <button
              v-for="c in ETA_CHIPS"
              :key="c"
              type="button"
              class="chip"
              :class="{ selected: r.eta.value === c }"
              @click="r.eta.value = c"
            >
              {{ c }}
            </button>
          </div>
          <input v-model="r.eta.value" class="eta-input" placeholder="O escríbelo: ej. 2 a 3 días hábiles" />
        </div>

        <div class="field">
          <label>Nota para el cliente (opcional)</label>
          <textarea v-model="r.nota.value" rows="2" placeholder="Ej. llegó en perfecto estado..." />
        </div>

        <button type="button" class="preview-toggle" @click="r.showPreview.value = !r.showPreview.value">
          <i class="fa-solid" :class="r.showPreview.value ? 'fa-chevron-up' : 'fa-eye'" />
          {{ r.showPreview.value ? 'Ocultar' : 'Previsualizar lo que verá el cliente' }}
        </button>

        <transition name="expand">
          <div v-if="r.showPreview.value" class="email-preview">
            <div class="ep-banner">Producto recibido en bodega</div>
            <div class="ep-inner">
              <p>Hola <strong>{{ clienteNombre }}</strong>,</p>
              <p>¡Tu producto llegó a nuestra bodega y está siendo procesado para su envío!</p>
              <div v-if="r.eta.value" class="ep-eta">
                <span>Tiempo estimado de entrega</span><strong>{{ r.eta.value }}</strong>
              </div>
              <div class="ep-fotos"><img v-for="f in q.items.value" :key="f.id" :src="f.preview" alt="f" /></div>
              <p v-if="r.nota.value" class="ep-nota">{{ r.nota.value }}</p>
              <div class="ep-btn">Ver estado de mi pedido</div>
            </div>
            <a v-if="trackingUrl" class="ep-page" :href="trackingUrl" target="_blank" rel="noopener">
              <i class="fa-solid fa-arrow-up-right-from-square" /> Ver también la página de seguimiento
            </a>
          </div>
        </transition>

        <p v-if="r.error.value" class="err">{{ r.error.value }}</p>
      </div>

      <div class="rm-foot">
        <button class="btn ghost" :disabled="r.sending.value" @click="close">Cancelar</button>
        <button class="btn primary" :disabled="r.sending.value || !r.canConfirm.value" @click="confirmar">
          <i class="fa-solid fa-paper-plane" /> Confirmar y notificar
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.reg-modal { position: relative; width: min(620px, 100%); max-height: 92vh; overflow: auto; background: $ink-900; border: 1px solid $ink-700; border-radius: 22px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.rm-head { display: flex; align-items: center; justify-content: space-between; }
.rm-head h3 { margin: 0; color: $fg-dark; }
.close { background: transparent; border: 1px solid $ink-600; color: $ink-300; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; }
.rm-body { display: flex; flex-direction: column; gap: $space-4; }
.field { display: flex; flex-direction: column; gap: $space-2; }
.field label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.field-head { display: flex; align-items: center; justify-content: space-between; gap: $space-3; }

.count-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba($brand-orange, 0.14);
  color: $brand-orange;

  &.ready { background: rgba($signal-green, 0.14); color: $signal-green; }
}

.fotos { display: flex; flex-wrap: wrap; gap: $space-3; }
.foto { position: relative; width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 2px solid $ink-700; background: $ink-1000; }
.foto img { width: 100%; height: 100%; object-fit: cover; }
.foto .rm { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); border: none; color: #fff; border-radius: 8px; width: 22px; height: 22px; cursor: pointer; &:disabled { opacity: 0.4; cursor: not-allowed; } }
.foto.add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px dashed $ink-500; color: $ink-400; cursor: pointer; i { font-size: 1.1rem; color: $brand-orange; } span { font-size: 0.72rem; } }

/* The border is the at-a-glance answer to "which ones are not saved yet?". */
.foto.uploading { border-color: $brand-orange; }
.foto.done { border-color: $signal-green; }
.foto.error { border-color: $signal-red; }

.foto-tag { position: absolute; left: 4px; bottom: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.65); color: $brand-orange; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
.foto.done .foto-tag { color: $signal-green; }
.foto.error .foto-tag { color: $signal-red; }
.foto.pending .foto-tag { color: $ink-300; }

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

.btn { display: inline-flex; align-items: center; gap: $space-2; border-radius: 12px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }

.sending {
  position: absolute; inset: 0; z-index: 5; border-radius: 22px;
  background: rgba($ink-1000, 0.94); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  overflow: auto;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active, .fade-leave-active,
  .expand-enter-active, .expand-leave-active { transition: none; }
}
</style>
