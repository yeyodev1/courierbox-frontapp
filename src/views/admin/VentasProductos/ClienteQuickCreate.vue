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
  <AppModal :show="show" max-width="540px" fit-content @close="emit('close')">
    <template #header>
      <header class="qc-head">
        <div class="qc-head__icon"><i class="fa-solid fa-user-plus" /></div>
        <div>
          <h3>Nuevo cliente</h3>
          <p>Queda registrado en el maestro y seleccionado en la venta.</p>
        </div>
      </header>
    </template>

    <div class="qc-grid">
      <label class="field full">
        <span>Nombre / Razón social <b>*</b></span>
        <input v-model="form.nombreOficial" class="field-input" placeholder="Ej. Peter Arévalo" autocomplete="off" />
      </label>
      <label class="field">
        <span>Cédula / RUC</span>
        <input v-model="form.cedulaRuc" class="field-input" placeholder="0912345678" autocomplete="off" />
      </label>
      <label class="field">
        <span>Teléfono</span>
        <input v-model="form.telefono" class="field-input" placeholder="0991234567" autocomplete="off" />
      </label>
      <label class="field">
        <span>Email</span>
        <input v-model="form.email" type="email" class="field-input" placeholder="cliente@correo.com" autocomplete="off" />
      </label>
      <label class="field">
        <span>Casillero</span>
        <input v-model="form.codigoCasillero" class="field-input" placeholder="Se genera solo" autocomplete="off" />
      </label>
      <p class="qc-note full">
        <i class="fa-solid fa-circle-info" />
        Solo el nombre es obligatorio. La cédula evita duplicados y el email permite enviarle el resumen de la venta.
      </p>
    </div>

    <div v-if="duplicado" class="qc-dup">
      <div>
        <strong>{{ duplicado.nombreOficial }}</strong>
        <p>Ya existe con casillero {{ duplicado.codigoCasillero }}</p>
      </div>
      <button type="button" class="link-btn" @click="usarDuplicado">Usar este cliente</button>
    </div>

    <template #footer>
      <div class="qc-actions">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="guardar">
          <i v-if="!saving" class="fa-solid fa-check" />
          {{ saving ? 'Creando…' : 'Crear cliente' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './ventas-ui' as *;

@include fields;
@include buttons;

.qc-head {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-5 $space-8 $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.12);

  h3 { margin: 0; font-size: 1.05rem; }
  p { margin: 2px 0 0; color: $ink-400; font-size: 0.8rem; }

  &__icon {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba($brand-orange, 0.14);
    color: $brand-orange;
  }

  @media (max-width: 640px) { padding: $space-4 $space-4 $space-3; }
}

.qc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
}

.qc-note {
  display: flex;
  gap: $space-2;
  margin: 0;
  color: $ink-500;
  font-size: 0.76rem;
  line-height: 1.5;

  i { color: rgba($brand-orange, 0.7); margin-top: 2px; }
}

.qc-dup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-top: $space-4;
  padding: $space-3 $space-4;
  border: 1px solid rgba($brand-orange, 0.35);
  border-radius: 12px;
  background: rgba($brand-orange, 0.08);

  p { margin: 2px 0 0; color: $ink-400; font-size: 0.78rem; }
}

.qc-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
    .btn-primary, .btn-ghost { width: 100%; }
  }
}

/* The required marker should read as an accent, not as bold body text. */
.field > span b { color: $brand-orange; font-weight: 700; }
</style>
