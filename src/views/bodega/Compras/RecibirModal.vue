<script setup lang="ts">
/**
 * Warehouse reception: photos, ETA and note. Confirming here only opens the
 * second gate — the email to the client is sent from ConfirmarRecepcionModal.
 */
import { computed, ref } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { GestionCompra } from '@/services/gestiones_compra.api'
import { ETA_CHIPS, clienteEmail, clienteNombre } from './useCompras'
import type { UploadItem } from '@/composables/useUploadQueue'

const props = defineProps<{
  gestion: GestionCompra | null
  fotos: UploadItem[]
  saving: boolean
  error: string
}>()

/** Each state gets a word and an icon, not only a colour. */
const STATE_TAG = {
  pending: { icon: 'fa-regular fa-clock', label: 'por subir' },
  uploading: { icon: 'fa-solid fa-arrow-up', label: 'subiendo' },
  done: { icon: 'fa-solid fa-check', label: 'guardada' },
  error: { icon: 'fa-solid fa-triangle-exclamation', label: 'falló' },
} as const

const porSubir = computed(() => props.fotos.filter((f) => f.status !== 'done').length)

const nota = defineModel<string>('nota', { required: true })
const eta = defineModel<string>('eta', { required: true })

const emit = defineEmits<{
  close: []
  'add-files': [files: File[]]
  'remove-foto': [id: number]
  validate: []
  confirmar: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement
  emit('add-files', Array.from(input.files ?? []))
  input.value = ''
}
</script>

<template>
  <AppOverlay :open="!!gestion" label="Registrar recepción" :persistent="saving" @close="emit('close')">
    <div v-if="gestion" class="card-modal">
      <div class="cm-head">
        <h3>Marcar recibido en bodega</h3>
        <button class="close" :disabled="saving" @click="emit('close')"><i class="fa-solid fa-xmark" /></button>
      </div>

      <p class="cm-sub">
        Cliente: <strong>{{ clienteNombre(gestion) }}</strong>. Sube las fotos de lo recibido;
        se previsualizan aquí y se suben al confirmar.
      </p>

      <div v-if="fotos.length" class="fotos-head">
        <span class="count-pill" :class="{ ready: !porSubir }">
          <template v-if="porSubir">{{ porSubir }} de {{ fotos.length }} por subir</template>
          <template v-else><i class="fa-solid fa-check" /> las {{ fotos.length }} están guardadas</template>
        </span>
      </div>

      <div class="fotos">
        <div v-for="f in fotos" :key="f.id" class="foto" :class="f.status">
          <img :src="f.preview" alt="foto" />
          <span class="foto-tag">
            <i :class="STATE_TAG[f.status].icon" /> {{ STATE_TAG[f.status].label }}
          </span>
          <button v-if="!saving" class="rm" aria-label="Quitar foto" @click="emit('remove-foto', f.id)">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <button class="foto add" :disabled="saving" @click="fileInput?.click()">
          <i class="fa-solid fa-camera" /><span>Agregar</span>
        </button>
      </div>

      <input ref="fileInput" type="file" accept="image/*" multiple capture="environment" class="hidden" @change="onFiles" />

      <div class="field">
        <label>Tiempo estimado de entrega (opcional)</label>
        <div class="chips">
          <button
            v-for="c in ETA_CHIPS"
            :key="c"
            type="button"
            class="chip"
            :class="{ selected: eta === c }"
            @click="eta = c"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <textarea v-model="nota" rows="2" placeholder="Nota para el cliente (opcional)" />

      <div v-if="fotos.length" class="resumen">
        <span><i class="fa-solid fa-images" /> {{ fotos.length }} foto(s)</span>
        <span v-if="eta"><i class="fa-solid fa-clock" /> {{ eta }}</span>
        <span><i class="fa-solid fa-envelope" /> Avisará a {{ clienteEmail(gestion) || 'sin correo' }}</span>
      </div>

      <p v-if="error" class="err">{{ error }}</p>

      <div class="cm-foot">
        <button class="btn ghost" :disabled="saving" @click="emit('close')">Cancelar</button>
        <button class="btn primary" :disabled="saving || !fotos.length" @click="emit('validate')">
          <i class="fa-solid fa-check" /> Confirmar
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.card-modal {
  width: min(560px, 100%);
  max-height: 92vh;
  overflow: auto;
  background: $ink-900;
  border: 1px solid $ink-700;
  border-radius: 20px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.cm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 { margin: 0; color: $fg-dark; }
}

.cm-sub {
  margin: 0;
  color: $ink-300;
  font-size: 0.88rem;

  strong { color: $fg-dark; }
}

.close {
  background: transparent;
  border: 1px solid $ink-600;
  color: $ink-300;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  cursor: pointer;
}

.fotos {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.foto {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid $ink-700;
  background: $ink-1000;

  img { width: 100%; height: 100%; object-fit: cover; }

  .rm {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: #fff;
    border-radius: 8px;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }

  &.add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 2px dashed $ink-500;
    color: $ink-400;
    cursor: pointer;

    i { font-size: 1.2rem; color: $brand-orange; }
    span { font-size: 0.72rem; }
  }

  /* The border answers "which ones are not saved yet?" at a glance. */
  &.uploading { border-color: $brand-orange; }
  &.done { border-color: $signal-green; }
  &.error { border-color: $signal-red; }
}

.fotos-head {
  display: flex;
  justify-content: flex-end;
}

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

.foto-tag {
  position: absolute;
  left: 4px;
  bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: $brand-orange;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.foto.done .foto-tag { color: $signal-green; }
.foto.error .foto-tag { color: $signal-red; }
.foto.pending .foto-tag { color: $ink-300; }

.hidden { display: none; }

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  label { color: $ink-300; font-size: 0.82rem; font-weight: 600; }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: $ink-1000;
  border: 1px solid $ink-500;
  color: $ink-300;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;

  &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.1); color: $brand-orange; }
}

textarea {
  background: $ink-1000;
  border: 1px solid $ink-500;
  border-radius: 10px;
  color: $fg-dark;
  padding: $space-3;
  font-family: inherit;
  resize: vertical;
  outline: none;

  &:focus { border-color: rgba($brand-orange, 0.5); }
}

.resumen {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  background: $ink-1000;
  border: 1px solid $ink-700;
  border-radius: 10px;
  padding: $space-3 $space-4;

  span { color: $ink-300; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; }
  i { color: $brand-orange; }
}

.err { color: $signal-red; font-size: 0.85rem; margin: 0; }

.cm-foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: $space-2 $space-3;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid transparent;

  &.primary {
    background: $brand-orange;
    color: $ink-1000;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }
}
</style>
