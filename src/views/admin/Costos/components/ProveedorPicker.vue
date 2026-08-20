<script setup lang="ts">
/**
 * Free-text provider field with suggestions. Typing a name that does not exist
 * yet can be promoted to a real provider without leaving the expense form.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'

const props = defineProps<{ tipo: string }>()
const nombre = defineModel<string>({ required: true })

const toastStore = useToastStore()

const proveedores = ref<Proveedor[]>([])
const query = ref('')
const saving = ref(false)

const sugeridos = computed(() => {
  const q = query.value.trim().toLowerCase()
  return proveedores.value.filter((p) => !q || p.nombre.toLowerCase().includes(q)).slice(0, 8)
})

async function load() {
  try {
    const data = await proveedoresApi.list({ q: query.value || undefined, limit: 50 })
    proveedores.value = data.proveedores
  } catch {
    proveedores.value = []
  }
}

watch(query, load)
onMounted(load)

async function crear() {
  const value = nombre.value.trim()
  if (!value) return
  if (proveedores.value.some((p) => p.nombre.toLowerCase() === value.toLowerCase())) return

  saving.value = true
  try {
    await proveedoresApi.create({ nombre: value, tipo: props.tipo || 'general' } as Proveedor)
    await load()
    toastStore.showNotification('Proveedor guardado y disponible para futuros gastos.', 'success')
  } catch (error: unknown) {
    toastStore.showNotification((error as Error)?.message || 'No se pudo crear el proveedor', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="form-field full-width provider-field">
    <div class="provider-head">
      <span>Proveedor</span>
      <button
        type="button"
        class="provider-save-btn"
        :disabled="saving || !nombre.trim()"
        @click="crear"
      >
        <i class="fa-solid fa-plus" /> Crear proveedor
      </button>
    </div>

    <input v-model="nombre" class="field-input" placeholder="Nombre o empresa" @input="query = nombre" />

    <div v-if="sugeridos.length" class="provider-chips">
      <button v-for="p in sugeridos" :key="p._id" type="button" class="provider-chip" @click="nombre = p.nombre">
        {{ p.nombre }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.form-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  > span { font-size: 0.8rem; color: $ink-400; font-weight: 600; }
}

.full-width { grid-column: 1 / -1; }

.provider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.provider-save-btn {
  border: 1px solid rgba($brand-orange, 0.35);
  background: rgba($brand-orange, 0.1);
  color: $brand-orange;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.field-input {
  width: 100%;
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  padding: $space-2 $space-3;
  color: $fg-dark;
  font-family: inherit;
  outline: none;

  &:focus { border-color: $brand-orange; }
}

.provider-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.provider-chip {
  border: 1px solid rgba($ink-500, 0.2);
  background: rgba($ink-700, 0.5);
  color: $ink-200;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;

  &:hover { border-color: rgba($brand-orange, 0.4); }
}
</style>
