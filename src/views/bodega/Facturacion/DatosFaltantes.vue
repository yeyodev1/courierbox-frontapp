<script setup lang="ts">
/**
 * Lo que le falta al cliente para que la factura salga y el SRI la autorice,
 * con el formulario para completarlo ahí mismo. Lo requerido bloquea el botón
 * de emitir; lo demás sólo avisa. Sin cédula y hasta $50, ofrece consumidor
 * final como salida.
 */
import { computed, reactive, watch } from 'vue'
import type { DatoFaltante } from '@/services/facturacion.api'
import type { FormularioCliente } from './useFacturacion'

const props = defineProps<{
  cliente: { nombre: string; identificacion: string; email: string; telefono: string; direccion: string }
  faltantes: DatoFaltante[]
  consumidorFinal: boolean
  consumidorFinalPosible: boolean
  guardando: boolean
}>()

const emit = defineEmits<{
  guardar: [datos: Partial<FormularioCliente>]
  'update:consumidorFinal': [value: boolean]
}>()

const ETIQUETAS: Record<DatoFaltante['campo'], { label: string; placeholder: string; tipo: string }> = {
  cedulaRuc: { label: 'Cédula o RUC', placeholder: '0954227641 o 0993388549001', tipo: 'text' },
  nombreOficial: { label: 'Nombre o razón social', placeholder: 'Como debe salir en la factura', tipo: 'text' },
  email: { label: 'Correo', placeholder: 'cliente@correo.com', tipo: 'email' },
  telefono: { label: 'Teléfono', placeholder: '09…', tipo: 'tel' },
  direccion: { label: 'Dirección', placeholder: 'Calle y ciudad', tipo: 'text' },
}

const form = reactive<FormularioCliente>({
  nombreOficial: props.cliente.nombre,
  cedulaRuc: props.cliente.identificacion,
  email: props.cliente.email,
  telefono: props.cliente.telefono,
  direccion: props.cliente.direccion,
})

// Si cambia el cliente elegido, el formulario arranca con sus datos.
watch(
  () => props.cliente,
  (c) => Object.assign(form, { nombreOficial: c.nombre, cedulaRuc: c.identificacion, email: c.email, telefono: c.telefono, direccion: c.direccion }),
)

const requeridos = computed(() => props.faltantes.filter((f) => f.requerido))
const sinIdentificacion = computed(() => !props.cliente.identificacion.replace(/\D+/g, ''))
const ofreceConsumidorFinal = computed(() => sinIdentificacion.value && props.consumidorFinalPosible)

/** Sólo viaja lo que cambió respecto a lo que el cliente ya tenía. */
const cambios = computed<Partial<FormularioCliente>>(() => {
  const out: Partial<FormularioCliente> = {}
  if (form.nombreOficial.trim() !== props.cliente.nombre) out.nombreOficial = form.nombreOficial.trim()
  if (form.cedulaRuc.trim() !== props.cliente.identificacion) out.cedulaRuc = form.cedulaRuc.trim()
  if (form.email.trim() !== props.cliente.email) out.email = form.email.trim()
  if (form.telefono.trim() !== props.cliente.telefono) out.telefono = form.telefono.trim()
  if (form.direccion.trim() !== props.cliente.direccion) out.direccion = form.direccion.trim()
  return out
})

const hayCambios = computed(() => Object.keys(cambios.value).length > 0)

function guardar() {
  if (!hayCambios.value || props.guardando) return
  emit('guardar', cambios.value)
}
</script>

<template>
  <section class="faltantes" :class="{ bloquea: requeridos.length && !consumidorFinal }" data-test="datos-faltantes">
    <header class="faltantes__head">
      <i class="fa-solid" :class="requeridos.length && !consumidorFinal ? 'fa-triangle-exclamation' : 'fa-circle-info'" aria-hidden="true" />
      <div>
        <strong v-if="requeridos.length && !consumidorFinal">Faltan datos para que el SRI autorice la factura</strong>
        <strong v-else-if="requeridos.length && consumidorFinal">Se facturará a consumidor final</strong>
        <strong v-else>Datos recomendados</strong>
        <p v-if="requeridos.length && !consumidorFinal">Complétalos aquí mismo; se guardan en el cliente para la próxima.</p>
        <p v-else>Sin esto la factura sale igual, pero le llega peor al cliente.</p>
      </div>
    </header>

    <TransitionGroup name="lista" tag="ul" class="faltantes__lista">
      <li v-for="f in faltantes" :key="f.campo" :class="{ requerido: f.requerido && !(consumidorFinal && f.campo === 'cedulaRuc') }" :data-test="`faltante-${f.campo}`">
        <i class="fa-solid" :class="f.requerido ? 'fa-circle-exclamation' : 'fa-circle-dot'" aria-hidden="true" />
        {{ f.mensaje }}
      </li>
    </TransitionGroup>

    <label v-if="ofreceConsumidorFinal" class="cf" data-test="consumidor-final">
      <input type="checkbox" :checked="consumidorFinal" @change="emit('update:consumidorFinal', ($event.target as HTMLInputElement).checked)" />
      <span>
        <strong>Facturar a consumidor final</strong>
        <small>El SRI lo admite hasta $50. La factura sale a «Consumidor Final» y no a nombre del cliente.</small>
      </span>
    </label>

    <form class="grid" @submit.prevent="guardar">
      <label v-for="f in faltantes" :key="f.campo" class="field" :class="{ 'span-2': f.campo === 'direccion' || f.campo === 'nombreOficial' }">
        <span>{{ ETIQUETAS[f.campo].label }}<template v-if="f.requerido"> *</template></span>
        <input v-model="form[f.campo]" :type="ETIQUETAS[f.campo].tipo" :placeholder="ETIQUETAS[f.campo].placeholder" :data-test="`input-${f.campo}`" :disabled="guardando" />
      </label>
      <div class="acciones">
        <button type="submit" class="btn primary sm" :disabled="!hayCambios || guardando" data-test="guardar-cliente">
          <i class="fa-solid" :class="guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" />
          {{ guardando ? 'Guardando…' : 'Guardar en el cliente' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;

@include ui.buttons;
@include ui.fields;

.faltantes {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($signal-blue, 0.3);
  background: rgba($signal-blue, 0.06);
  transition: border-color $dur-base ease, background $dur-base ease;

  &.bloquea {
    border-color: rgba($signal-amber, 0.45);
    background: rgba($signal-amber, 0.07);
    .faltantes__head > i { color: $signal-amber; }
  }

  &__head {
    display: flex;
    gap: $space-3;
    align-items: flex-start;
    > i { color: $signal-blue; margin-top: 3px; }
    strong { display: block; color: $fg-dark; font-size: 0.95rem; }
    p { margin: 2px 0 0; color: $ink-400; font-size: 0.82rem; }
  }

  &__lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: $ink-300;

    li { display: flex; gap: $space-2; align-items: flex-start; }
    li i { margin-top: 3px; color: $ink-500; }
    li.requerido { color: $ink-100; }
    li.requerido i { color: $signal-amber; }
  }
}

.cf {
  display: flex;
  gap: $space-3;
  align-items: flex-start;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px dashed rgba($brand-orange, 0.4);
  cursor: pointer;

  input { width: 20px; height: 20px; accent-color: $brand-orange; flex: 0 0 auto; margin-top: 2px; }
  strong { display: block; color: $fg-dark; font-size: 0.88rem; }
  small { color: $ink-400; font-size: 0.78rem; }
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
  .span-2 { grid-column: 1 / -1; }
  .acciones { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
}

.lista-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.lista-leave-active { transition: opacity $dur-fast ease; }
.lista-enter-from { opacity: 0; transform: translateY(4px); }
.lista-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .faltantes, .lista-enter-active, .lista-leave-active { transition: none; }
}
</style>
