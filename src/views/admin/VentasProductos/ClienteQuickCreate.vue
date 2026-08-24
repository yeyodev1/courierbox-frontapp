<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToastStore } from '@/stores/toast.store'
import type { ClienteLite, useVentasProductos } from './useVentasProductos'

const props = defineProps<{ show: boolean; vp: ReturnType<typeof useVentasProductos>; nombreInicial?: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'creado', cliente: ClienteLite): void }>()

const toast = useToastStore()
const saving = ref(false)
/** Set when the backend rejects with 409 and hands back the owning client. */
const duplicado = ref<ClienteLite | null>(null)

const form = reactive({ nombreOficial: '', cedulaRuc: '', email: '', telefono: '', codigoCasillero: '' })

watch(
  () => props.show,
  (open) => {
    if (!open) return
    duplicado.value = null
    Object.assign(form, {
      nombreOficial: props.nombreInicial?.trim() || '',
      cedulaRuc: '',
      email: '',
      telefono: '',
      codigoCasillero: '',
    })
  },
  { immediate: true },
)

async function guardar() {
  if (!form.nombreOficial.trim()) return toast.showNotification('El nombre es obligatorio', 'error')
  saving.value = true
  duplicado.value = null
  try {
    const cliente = await props.vp.crearCliente({
      nombreOficial: form.nombreOficial.trim(),
      cedulaRuc: form.cedulaRuc.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      codigoCasillero: form.codigoCasillero.trim(),
    })
    toast.showNotification(`Cliente creado · casillero ${cliente.codigoCasillero}`, 'success')
    emit('creado', cliente)
  } catch (e: any) {
    // A 409 means the cédula or casillero already belongs to someone: offer
    // that client instead of forcing the operator to retype the search.
    if (e?.data?.cliente) duplicado.value = e.data.cliente as ClienteLite
    toast.showNotification(e?.message || 'No se pudo crear el cliente', 'error')
  } finally {
    saving.value = false
  }
}

function usarDuplicado() {
  if (duplicado.value) emit('creado', duplicado.value)
}
</script>

<template>
  <AppModal :show="show" title="Nuevo cliente" max-width="560px" @close="emit('close')">
    <div class="qc-grid">
      <label class="full">
        <span>Nombre / Razón social *</span>
        <input v-model="form.nombreOficial" class="field-input" placeholder="Ej. PETER AREVALO" autocomplete="off" />
      </label>
      <label>
        <span>Cédula / RUC</span>
        <input v-model="form.cedulaRuc" class="field-input" autocomplete="off" />
      </label>
      <label>
        <span>Teléfono</span>
        <input v-model="form.telefono" class="field-input" autocomplete="off" />
      </label>
      <label>
        <span>Email</span>
        <input v-model="form.email" type="email" class="field-input" autocomplete="off" />
      </label>
      <label>
        <span>Casillero</span>
        <input v-model="form.codigoCasillero" class="field-input" placeholder="Se genera solo" autocomplete="off" />
      </label>
    </div>

    <div v-if="duplicado" class="dup">
      <p>
        Ya existe <strong>{{ duplicado.nombreOficial }}</strong>
        <em>({{ duplicado.codigoCasillero }})</em>
      </p>
      <button type="button" class="link-btn" @click="usarDuplicado">Usar ese cliente</button>
    </div>

    <template #footer>
      <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn-primary" :disabled="saving" @click="guardar">
        {{ saving ? 'Creando…' : 'Crear cliente' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.qc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-3; margin-top: $space-3; text-align: left; }
.qc-grid .full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 4px; font-size: .85rem; }
label > span { color: $ink-400; }
.dup { margin-top: $space-3; padding: $space-3; border-radius: 12px; background: rgba($brand-orange, .1); text-align: left; }
.dup p { margin: 0 0 4px; font-size: .85rem; }
.dup em { color: $ink-400; font-style: normal; }
.link-btn { background: none; border: none; color: $brand-orange; cursor: pointer; font-size: .82rem; padding: 0; }
.btn-ghost { background: transparent; border: 1px solid rgba($ink-500, .3); color: $ink-300; border-radius: 10px; padding: $space-2 $space-4; cursor: pointer; }
@media (max-width: 600px) { .qc-grid { grid-template-columns: 1fr; } }
</style>
