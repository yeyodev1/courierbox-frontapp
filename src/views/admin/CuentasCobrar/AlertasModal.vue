<script setup lang="ts">
/**
 * A quién le llega el correo diario de cobros (08:00, hora de Ecuador) y el
 * botón para mandarlo ya mismo.
 */
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { cuentasCobrarApi } from '@/services/cuentas_cobrar.api'
import { useToastStore } from '@/stores/toast.store'
import { errorDe } from './useCuentasCobrar'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const toast = useToastStore()
const cargando = ref(false)
const guardando = ref(false)
const enviando = ref(false)
const activo = ref(true)
const destinatarios = ref<string[]>([])
const nuevo = ref('')
const original = ref('')

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

watch(
  () => props.open,
  async (abierto) => {
    if (!abierto) return
    cargando.value = true
    try {
      const a = await cuentasCobrarApi.alertas()
      activo.value = a.activo
      destinatarios.value = [...a.destinatarios]
      original.value = JSON.stringify(a)
    } catch (e) {
      toast.showNotification(errorDe(e, 'No se pudo leer la configuración de alertas.'), 'error')
    } finally {
      cargando.value = false
    }
  },
)

function agregar() {
  const correo = nuevo.value.trim().toLowerCase()
  if (!correo) return
  if (!EMAIL.test(correo)) return toast.showNotification(`"${correo}" no es un correo válido.`, 'error')
  if (!destinatarios.value.includes(correo)) destinatarios.value.push(correo)
  nuevo.value = ''
}

function quitar(correo: string) {
  destinatarios.value = destinatarios.value.filter((d) => d !== correo)
}

const cambio = () => JSON.stringify({ activo: activo.value, destinatarios: destinatarios.value }) !== original.value

async function guardar() {
  if (nuevo.value.trim()) agregar()
  if (!destinatarios.value.length) return toast.showNotification('Deja al menos un correo.', 'error')
  guardando.value = true
  try {
    const a = await cuentasCobrarApi.guardarAlertas({ activo: activo.value, destinatarios: destinatarios.value })
    original.value = JSON.stringify(a)
    toast.showNotification('Alertas guardadas.', 'success')
    emit('close')
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudieron guardar las alertas.'), 'error')
  } finally {
    guardando.value = false
  }
}

async function enviarAhora() {
  if (cambio()) await guardar()
  enviando.value = true
  try {
    const r = await cuentasCobrarApi.enviarResumen()
    toast.showNotification(`Resumen enviado a ${r.destinatarios?.join(', ') ?? 'los destinatarios'}.`, 'success')
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo enviar el resumen.'), 'error')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <AppModal
    :show="open"
    title="Alertas por correo"
    icon="fa-solid fa-envelope"
    max-width="520px"
    fit-content
    :disable-close="guardando || enviando"
    @close="emit('close')"
  >
    <div class="al">
      <p class="al__intro">
        Todos los días a las <strong>8:00</strong> llega un correo con las cuentas que tienen <strong>fecha de cobro hoy</strong>, las que
        <strong>vencen hoy</strong> y las <strong>atrasadas</strong>. Si no hay nada, no se envía.
      </p>

      <p v-if="cargando" class="muted"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> Cargando…</p>
      <template v-else>
        <label class="al__switch">
          <input v-model="activo" type="checkbox" />
          <span class="al__track" aria-hidden="true"><span /></span>
          <span>{{ activo ? 'Alertas activadas' : 'Alertas desactivadas' }}</span>
        </label>

        <div class="al__lista">
          <span class="al__label">Destinatarios</span>
          <TransitionGroup tag="ul" name="al-chip">
            <li v-for="d in destinatarios" :key="d">
              {{ d }}
              <button type="button" :aria-label="`Quitar ${d}`" @click="quitar(d)"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
            </li>
          </TransitionGroup>
          <form class="al__nuevo" @submit.prevent="agregar">
            <input v-model="nuevo" type="email" placeholder="secretaria@courierboxlogistics.com" />
            <button type="submit" class="btn ghost sm"><i class="fa-solid fa-plus" aria-hidden="true" /> Agregar</button>
          </form>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="al__acciones">
        <button type="button" class="btn ghost" :disabled="enviando || guardando || cargando" @click="enviarAhora">
          <i class="fa-solid" :class="enviando ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'" aria-hidden="true" />
          {{ enviando ? 'Enviando…' : 'Enviar resumen ahora' }}
        </button>
        <button type="button" class="btn primary" :disabled="guardando || cargando" @click="guardar">
          <i class="fa-solid" :class="guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" />
          Guardar
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.al { display: flex; flex-direction: column; gap: $space-4; }
.al__intro { margin: 0; color: $ink-300; font-size: 0.9rem; line-height: 1.55; strong { color: $fg-dark; } }
.muted { margin: 0; color: $ink-400; }
.al__label { font-size: 0.78rem; color: $ink-300; }
.al__lista { display: flex; flex-direction: column; gap: $space-2;
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: $space-2; }
  li { display: inline-flex; align-items: center; gap: 6px; padding: 6px 6px 6px 12px; border-radius: 999px; background: rgba($brand-orange, 0.12); color: $brand-orange-soft; font-size: 0.84rem;
    button { width: 24px; height: 24px; border-radius: 50%; border: none; background: transparent; color: inherit; cursor: pointer; &:hover { background: rgba($brand-orange, 0.2); } } } }
.al__nuevo { display: flex; gap: $space-2;
  input { flex: 1; min-width: 0; min-height: 40px; padding: 0 $space-3; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: $ink-850; color: $fg-dark; font: inherit; outline: none;
    &:focus { border-color: rgba($brand-orange, 0.6); } } }
.al__acciones { display: flex; justify-content: flex-end; gap: $space-2; flex-wrap: wrap; }

.al__switch { display: inline-flex; align-items: center; gap: $space-3; cursor: pointer; color: $ink-200; font-size: 0.9rem; align-self: flex-start;
  input { position: absolute; opacity: 0; pointer-events: none; }
  .al__track { width: 40px; height: 22px; border-radius: 999px; background: $ink-600; position: relative; transition: background 0.2s;
    span { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); } }
  input:checked + .al__track { background: $signal-green; span { transform: translateX(18px); } }
  input:focus-visible + .al__track { outline: 2px solid $brand-orange; outline-offset: 2px; } }

.al-chip-enter-active, .al-chip-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.al-chip-enter-from, .al-chip-leave-to { opacity: 0; transform: scale(0.9); }
</style>
