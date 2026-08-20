<script setup lang="ts">
/**
 * New cash movement. An income can be tied to a client so the entry stays
 * traceable; an expense clears that link, since there is nobody to bill.
 */
import { computed, ref, watch } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, emptyCajaForm, type CajaForm } from './useCaja'
import { useClienteSearch, type ClienteResult } from './useClienteSearch'


const props = defineProps<{ open: boolean; saving: boolean }>()

const emit = defineEmits<{
  close: []
  save: [form: CajaForm, cliente: ClienteResult | null, comprobante: File | null, idempotencyKey: string]
  'crear-contacto': [nombreSugerido: string]
  'ir-a-contactos': []
}>()

const form = ref<CajaForm>(emptyCajaForm())
const comprobante = ref<File | null>(null)
const idempotencyKey = ref(crypto.randomUUID())

const cliente = useClienteSearch((selected) => {
  form.value.clienteNombre = selected.clientName
  form.value.clienteId = selected.clientId
})

const categoriasDisponibles = computed(() =>
  form.value.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO,
)
const categoriaOptions = computed(() => categoriasDisponibles.value.map((item) => ({ value: item, label: item })))

// A fresh open must not inherit the previous entry — including its idempotency key.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.value = emptyCajaForm()
    comprobante.value = null
    idempotencyKey.value = crypto.randomUUID()
    cliente.reset()
  },
)

watch(
  () => form.value.tipo,
  (tipo) => {
    form.value.categoria = (tipo === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]) || ''
    if (tipo === 'egreso') {
      form.value.clienteNombre = ''
      form.value.clienteId = ''
      cliente.reset()
    }
  },
)

// The "create contact" dialog is a sibling modal owned by the page, but the
// client picker lives here — so the page drives creation through this handle.
defineExpose({
  crearContacto: cliente.createContacto,
  creandoContacto: cliente.creating,
})
</script>

<template>
  <AppModal
    :show="open"
    title="Nuevo movimiento"
    icon="fa-solid fa-wallet"
    icon-variant="info"
    max-width="760px"
    :prevent-close-on-overlay="saving"
    @close="emit('close')"
  >
    <div v-if="saving" class="saving-banner">
      <i class="fa-solid fa-spinner fa-spin" /> Guardando movimiento... el registro se actualizará al instante.
    </div>

    <div class="modal-grid">
      <AppSelect
        v-model="form.tipo"
        :options="[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]"
        label="Tipo"
      />
      <AppSelect v-model="form.categoria" :options="categoriaOptions" label="Categoría" />
      <AppDatePicker v-model="form.fecha" label="Fecha" />
      <label class="field">
        <span>Monto</span>
        <input v-model.number="form.monto" type="number" min="0" step="0.01" class="field-input" />
      </label>
      <label class="field full">
        <span>Descripción</span>
        <textarea v-model="form.descripcion" class="field-input" rows="3" placeholder="Qué se está registrando y por qué" />
      </label>
      <label class="field full">
        <span>Referencia</span>
        <input v-model="form.referencia" class="field-input" placeholder="Factura, nota, comprobante o código" />
      </label>

      <div v-if="form.tipo === 'ingreso'" class="field full client-box">
        <div class="section-head">
          <h4>Cliente</h4>
          <p>Busca un cliente existente para dejar la caja amarrada al caso correcto.</p>
        </div>

        <input
          v-model="cliente.query.value"
          class="field-input"
          placeholder="Buscar cliente"
          @input="cliente.search"
          @focus="cliente.query.value.length >= 2 && cliente.search()"
        />

        <div v-if="cliente.searching.value" class="hint">Buscando clientes...</div>

        <div v-if="cliente.results.value.length" class="client-results">
          <button
            v-for="c in cliente.results.value"
            :key="c.clientId"
            type="button"
            class="client-result"
            @click="cliente.select(c)"
          >
            <strong>{{ c.clientName }}</strong>
            <span>{{ c.clientEmail || c.clientPhone || 'Sin contacto' }}</span>
          </button>
        </div>

        <div v-if="cliente.selected.value" class="selected-client-pill">
          <div>
            <strong>{{ cliente.selected.value.clientName }}</strong>
            <span>{{ cliente.selected.value.clientEmail || cliente.selected.value.clientPhone || 'Sin contacto' }}</span>
          </div>
          <button type="button" class="text-link" @click="cliente.clearSelection">Cambiar</button>
        </div>

        <div v-else-if="cliente.showEmptyHelp.value" class="client-empty-help">
          <strong>No existe este cliente aún.</strong>
          <p>
            Busca por nombre, correo o teléfono. Si no aparece, créalo primero en
            <button type="button" class="text-link" @click="emit('ir-a-contactos')">Contactos</button>
            o usa
            <button type="button" class="text-link" @click="emit('crear-contacto', cliente.query.value)">
              Crear contacto aquí
            </button>.
          </p>
        </div>
      </div>

      <div class="field full">
        <AppFileUpload
          v-model="comprobante"
          label="Comprobante"
          accept="image/*,.pdf"
          hint="Adjunta una imagen o PDF. Al guardar se sube y queda visible."
          variant="proof"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button
          class="btn-primary"
          type="button"
          :disabled="saving"
          @click="emit('save', form, cliente.selected.value, comprobante, idempotencyKey)"
        >
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
          {{ saving ? 'Guardando...' : 'Guardar movimiento' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './caja-ui' as ui;

@include ui.panel;
@include ui.fields;
@include ui.buttons;

.saving-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: $space-4;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
}

.client-box { position: relative; }

.client-results {
  display: grid;
  gap: 0.5rem;
  max-height: 220px;
  overflow: auto;
}

.client-result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.12);
  background: rgba($ink-800, 0.55);
  color: $fg-dark;
  font-family: inherit;
  cursor: pointer;

  &:hover { border-color: rgba($brand-orange, 0.3); }
}

.selected-client-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba($brand-orange, 0.28);
  background: rgba($brand-orange, 0.06);

  div { display: flex; flex-direction: column; gap: 2px; }
  span { color: $ink-300; font-size: 0.8rem; }
}

.client-empty-help {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px dashed rgba($brand-orange, 0.28);
  background: rgba($brand-orange, 0.06);

  strong { color: $fg-dark; }
  p { margin: 0; color: $ink-300; }
}

.hint { color: $ink-400; font-size: 0.8rem; }
</style>
