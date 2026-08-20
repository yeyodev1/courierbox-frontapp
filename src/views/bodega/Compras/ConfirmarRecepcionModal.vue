<script setup lang="ts">
/** Second gate before reception: confirming emails the client that it arrived. */
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppUploadProgress from '@/components/ui/AppUploadProgress.vue'
import type { UploadItem } from '@/composables/useUploadQueue'

defineProps<{
  open: boolean
  saving: boolean
  email: string
  sendingMsg: string
  items: UploadItem[]
  done: number
  failed: number
  pending: number
  percent: number
}>()

const emit = defineEmits<{ close: []; confirmar: []; retry: [] }>()
</script>

<template>
  <AppOverlay :open="open" layer="nested" label="Confirmar recepción" :persistent="saving" @close="emit('close')">
    <div class="card-modal small">
      <AppUploadProgress
        v-if="saving"
        :items="items"
        :done="done"
        :failed="failed"
        :pending="pending"
        :percent="percent"
        :message="sendingMsg"
        hint="No cierres esta ventana: estamos guardando las fotos y avisando al cliente."
        @retry="emit('retry')"
      />

      <template v-else>
        <div class="del-icon warn"><i class="fa-solid fa-bell" /></div>
        <h3>¿Confirmar recepción?</h3>
        <p>
          Esto <strong>disparará una notificación al cliente</strong>
          ({{ email || 'sin correo' }}) avisando que su producto llegó a bodega.
        </p>
        <div class="cm-foot center">
          <button class="btn ghost" @click="emit('close')">Volver</button>
          <button class="btn primary" @click="emit('confirmar')">
            <i class="fa-solid fa-paper-plane" /> Sí, notificar
          </button>
        </div>
      </template>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.card-modal {
  width: min(560px, 100%);
  background: $ink-900;
  border: 1px solid $ink-700;
  border-radius: 20px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &.small {
    max-width: 440px;
    text-align: center;
    align-items: center;

    h3 { margin: 0; color: $fg-dark; }
    p { margin: 0; color: $ink-300; strong { color: $fg-dark; } }
  }
}

.cm-foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;

  &.center { justify-content: center; }
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

  &.primary { background: $brand-orange; color: $ink-1000; }
  &.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }
}

.del-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;

  &.warn { background: rgba($brand-orange, 0.14); color: $brand-orange; }
}

</style>
