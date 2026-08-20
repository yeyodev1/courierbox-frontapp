<script setup lang="ts">
/** Confirms the batch: who is collecting, any remarks, and the signature. */
import { ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSignaturePad from '@/components/ui/AppSignaturePad.vue'
import type { PaqueteDisponible } from '@/services/retiros_counter.api'
import { emptyRetiroForm, type RetiroForm } from './useCounter'

const props = defineProps<{
  open: boolean
  saving: boolean
  seleccionados: PaqueteDisponible[]
  clienteNombre: string
  totales: { paquetes: number; peso: number }
}>()

const emit = defineEmits<{
  close: []
  confirm: [form: RetiroForm, firmaDataUrl: string, otroRetira: boolean]
}>()

const form = ref<RetiroForm>(emptyRetiroForm())
const otroRetira = ref(false)
const firmaDataUrl = ref('')

// Every fresh open starts blank — a signature must never carry over.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.value = emptyRetiroForm()
    otroRetira.value = false
    firmaDataUrl.value = ''
  },
)
</script>

<template>
  <AppOverlay :open="open" label="Firma de retiro" :persistent="saving" @close="emit('close')">
    <div class="firma-modal">
      <div class="firma-modal__head">
        <div>
          <h3>Confirmar retiro</h3>
          <p>{{ totales.paquetes }} paquete(s) · {{ totales.peso.toFixed(2) }} lb · {{ clienteNombre }}</p>
        </div>
        <button type="button" class="close" :disabled="saving" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div class="firma-modal__body">
        <ul class="mini-list">
          <li v-for="p in seleccionados" :key="p._id">
            <strong>{{ p.wr || p.sh || p.trackingOriginal }}</strong>
            <span>{{ p.contenido || 'Sin descripción' }}</span>
            <span class="mini-list__peso">{{ (Number(p.pesoLb) || 0).toFixed(2) }} lb</span>
          </li>
        </ul>

        <label class="check">
          <input v-model="otroRetira" type="checkbox" />
          <span>Retira otra persona (no el titular)</span>
        </label>

        <div v-if="otroRetira" class="grid-2">
          <label>
            <span>Nombre de quien retira *</span>
            <input v-model="form.retiradoPorNombre" type="text" placeholder="Nombre completo" />
          </label>
          <label>
            <span>Cédula</span>
            <input v-model="form.retiradoPorCedula" type="text" placeholder="0102030405" />
          </label>
          <label class="span-2">
            <span>Parentesco / relación</span>
            <input v-model="form.retiradoPorParentesco" type="text" placeholder="Hermano, asistente…" />
          </label>
        </div>

        <label class="field">
          <span>Observaciones (opcional)</span>
          <textarea v-model="form.observaciones" rows="2" placeholder="Caja abierta, faltante, etc." />
        </label>

        <AppSignaturePad :disabled="saving" label="Firma de quien retira" @change="firmaDataUrl = $event" />
      </div>

      <div class="firma-modal__foot">
        <button type="button" class="btn ghost" :disabled="saving" @click="emit('close')">Cancelar</button>
        <button
          type="button"
          class="btn primary"
          :disabled="saving || !firmaDataUrl || (otroRetira && !form.retiradoPorNombre.trim())"
          @click="emit('confirm', form, firmaDataUrl, otroRetira)"
        >
          <i v-if="saving" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
          {{ saving ? 'Generando comprobante…' : 'Confirmar y enviar comprobante' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './counter-ui' as ui;

@include ui.button;

.firma-modal {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  width: min(100%, 680px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.firma-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5;
  border-bottom: 1px solid rgba($ink-500, 0.15);

  h3 { margin: 0 0 2px; font-size: 1.1rem; }
  p { margin: 0; color: $ink-400; font-size: 0.85rem; }

  .close {
    width: 34px;
    height: 34px;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.2);
    background: rgba($ink-800, 0.8);
    color: $ink-300;
    cursor: pointer;
  }
}

.firma-modal__body {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.firma-modal__foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-top: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;

  @media (max-width: 560px) { flex-direction: column-reverse; }
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: $radius-md;

  li {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2 $space-3;
    border-bottom: 1px solid rgba($ink-500, 0.12);
    font-size: 0.82rem;

    &:last-child { border-bottom: none; }

    span { color: $ink-400; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}

.mini-list__peso {
  flex: 0 0 auto !important;
  font-variant-numeric: tabular-nums;
}

.check {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: 0.88rem;
  color: $ink-200;
  cursor: pointer;

  input { width: 18px; height: 18px; accent-color: $brand-orange; }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;

  @media (max-width: 560px) { grid-template-columns: 1fr; }

  .span-2 { grid-column: 1 / -1; }
}

.grid-2 label,
.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span { font-size: 0.8rem; color: $ink-400; }

  input,
  textarea {
    min-height: 42px;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.25);
    background: $ink-850;
    color: $fg-dark;
    font: inherit;
    outline: none;
    resize: vertical;

    &:focus { border-color: rgba($brand-orange, 0.5); }
  }
}
</style>
