<script setup lang="ts">
/**
 * Delivery capture for the motorizado: photo, who received it, signature and
 * the failure path. Evidence is only collected once the route has started.
 */
import { ref } from 'vue'
import AppSignaturePad from '@/components/ui/AppSignaturePad.vue'

defineProps<{
  estado: string
  saving: boolean
  uploadingFoto: boolean
  fotoPreview: string
  error: string
  puedeEntregar: boolean
}>()

const recibe = defineModel<{ nombre: string; apellido: string; cedula: string; contacto: string }>('recibe', {
  required: true,
})
const novedad = defineModel<string>('novedad', { required: true })
const motivoFallido = defineModel<string>('motivoFallido', { required: true })

const emit = defineEmits<{
  foto: [file: File]
  firma: [dataUrl: string]
  'iniciar-ruta': []
  entregar: []
  fallido: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function onFoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('foto', file)
}
</script>

<template>
  <section class="capture-card">
    <h3>Registrar entrega</h3>

    <div v-if="estado === 'asignado' || estado === 'reprogramado'" class="route-start">
      <i class="fa-solid fa-route" aria-hidden="true" />
      <div>
        <strong>Inicia la ruta antes de entregar</strong>
        <span>La hora de salida quedará en la bitácora.</span>
      </div>
      <button type="button" :disabled="saving" @click="emit('iniciar-ruta')">Iniciar ruta</button>
    </div>

    <template v-if="estado === 'en_ruta'">
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
          <input v-model="recibe.nombre" placeholder="Nombre" />
          <input v-model="recibe.apellido" placeholder="Apellido" />
          <input v-model="recibe.cedula" placeholder="Cédula" inputmode="numeric" />
          <input v-model="recibe.contacto" placeholder="Correo o teléfono de quien recibe" />
        </div>
      </div>

      <AppSignaturePad
        label="Firma de quien recibe (con el dedo) *"
        height="160px"
        :disabled="saving"
        @change="(dataUrl) => emit('firma', dataUrl)"
      />

      <div class="field">
        <label>Novedad / observación (opcional)</label>
        <textarea v-model="novedad" rows="2" placeholder="Ej: recibió el conserje, timbre dañado..." />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="deliver-btn" :disabled="!puedeEntregar || saving" @click="emit('entregar')">
        <i class="fa-solid fa-check" aria-hidden="true" />
        {{ saving ? 'Guardando...' : 'Marcar como entregado' }}
      </button>
      <p class="hint">Se guardará como evidencia y se enviará el comprobante al cliente por correo.</p>

      <div class="failure-box">
        <label>¿No se pudo entregar?</label>
        <textarea v-model="motivoFallido" rows="2" placeholder="Indica el motivo obligatorio" />
        <button
          type="button"
          class="failure-btn"
          :disabled="!motivoFallido.trim() || saving"
          @click="emit('fallido')"
        >
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Registrar entrega fallida
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.capture-card {
  background: $ink-900;
  border: 1px solid $ink-700;
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;

  h3 {
    margin: 0;
    color: $fg-dark;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    gap: $space-2;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
}

.hidden { display: none; }

.photo-box {
  border: 2px dashed $ink-500;
  border-radius: 14px;
  min-height: 180px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: $ink-1000;

  img { width: 100%; max-height: 320px; object-fit: contain; }
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  color: $ink-400;

  i { font-size: 2rem; color: $brand-orange; }
}

.recibe-grid {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  input {
    background: $ink-1000;
    border: 1px solid $ink-500;
    border-radius: 10px;
    color: $fg-dark;
    padding: $space-3;
    font-family: inherit;
    outline: none;

    &:focus { border-color: $brand-orange; }
  }
}

textarea {
  background: $ink-1000;
  border: 1px solid $ink-500;
  border-radius: 10px;
  color: $fg-dark;
  padding: $space-3;
  resize: vertical;
  font-family: inherit;
  outline: none;

  &:focus { border-color: $brand-orange; }
}

.error { color: $signal-red; font-size: 0.85rem; margin: 0; }

.deliver-btn {
  background: $brand-orange;
  color: $ink-1000;
  border: none;
  border-radius: 14px;
  padding: $space-4;
  font-weight: 800;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.hint { color: $ink-400; font-size: 0.78rem; text-align: center; margin: 0; }

.route-start {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
  padding: $space-4;
  border: 1px solid rgba($signal-blue, 0.45);
  border-radius: 14px;
  background: rgba($signal-blue, 0.1);
  transition: transform 180ms ease, border-color 180ms ease, opacity 180ms ease;

  > i { color: $signal-blue; font-size: 1.4rem; }
  > div { flex: 1 1 220px; display: flex; flex-direction: column; gap: 2px; }

  strong { color: $fg-dark; }
  span { color: $ink-300; font-size: 0.82rem; }

  button {
    border: 0;
    border-radius: 10px;
    padding: $space-3 $space-4;
    background: $signal-blue;
    color: #fff;
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
  }
}

.failure-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding-top: $space-4;
  border-top: 1px solid rgba($signal-red, 0.3);

  label { color: $signal-red; font-weight: 700; }
}

.failure-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid $signal-red;
  border-radius: 10px;
  padding: $space-3 $space-4;
  background: rgba($signal-red, 0.12);
  color: #ff8a8f;
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;

  &:hover:not(:disabled) { transform: translateY(-2px); background: rgba($signal-red, 0.2); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

@media (prefers-reduced-motion: reduce) {
  .route-start,
  .failure-btn { transition: none; }
  .failure-btn:hover:not(:disabled) { transform: none; }
}
</style>
