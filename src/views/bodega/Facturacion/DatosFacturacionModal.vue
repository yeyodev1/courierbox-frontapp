<script setup lang="ts">
/**
 * A quién se factura y con qué datos. Se abre desde la barra («Datos de
 * facturación») o solo, al pulsar Emitir cuando falta algo obligatorio.
 *
 * Arriba, los datos del cliente y sus alternos (la empresa, un familiar…);
 * abajo, el formulario del elegido. Guardar deja todo en el cliente para las
 * próximas facturas; «Continuar a emitir» sigue con el perfil marcado.
 */
import { computed, reactive, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { DatoFaltante, DatosPerfil, PerfilFacturacion } from '@/services/facturacion.api'
import { NUEVO_PERFIL } from './useFacturacion'

const props = defineProps<{
  open: boolean
  perfiles: PerfilFacturacion[]
  perfilId: string
  faltantes: DatoFaltante[]
  consumidorFinal: boolean
  consumidorFinalPosible: boolean
  guardando: boolean
  validando: boolean
  /** Ya se puede emitir con el perfil elegido. */
  listo: boolean
  total: string
  casillero: string
}>()

const emit = defineEmits<{
  close: []
  elegir: [perfilId: string]
  guardar: [perfilId: string | null, datos: DatosPerfil]
  eliminar: [perfilId: string]
  'update:consumidorFinal': [value: boolean]
  continuar: []
}>()

const NUEVO = NUEVO_PERFIL

const form = reactive<DatosPerfil>({ etiqueta: '', razonSocial: '', identificacion: '', email: '', telefono: '', direccion: '' })
const seleccion = computed(() => (props.perfilId === NUEVO ? null : props.perfiles.find((p) => p.id === props.perfilId) ?? null))
const creando = computed(() => props.perfilId === NUEVO)

function cargarForm() {
  const p = seleccion.value
  Object.assign(form, p
    ? { etiqueta: p.etiqueta, razonSocial: p.razonSocial, identificacion: p.identificacion, email: p.email, telefono: p.telefono, direccion: p.direccion }
    : { etiqueta: '', razonSocial: '', identificacion: '', email: '', telefono: '', direccion: '' })
}
watch(() => [props.perfilId, props.perfiles, props.open], cargarForm, { immediate: true, deep: true })

const faltantePor = computed(() => Object.fromEntries(props.faltantes.map((f) => [f.campo, f])) as Partial<Record<DatoFaltante['campo'], DatoFaltante>>)
const requeridos = computed(() => props.faltantes.filter((f) => f.requerido))
const sinIdentificacion = computed(() => !String(seleccion.value?.identificacion ?? '').replace(/\D+/g, ''))
const ofreceConsumidorFinal = computed(() => !creando.value && sinIdentificacion.value && props.consumidorFinalPosible)

const cambios = computed(() => {
  const p = seleccion.value
  if (!p) return true
  return (['etiqueta', 'razonSocial', 'identificacion', 'email', 'telefono', 'direccion'] as const).some((k) => String(form[k] ?? '').trim() !== String(p[k] ?? '').trim())
})
const puedeGuardar = computed(() => Boolean(form.razonSocial.trim()) && cambios.value && !props.guardando)

function guardar() {
  if (!puedeGuardar.value) return
  emit('guardar', creando.value ? null : props.perfilId, { ...form, razonSocial: form.razonSocial.trim(), identificacion: form.identificacion.trim(), email: form.email.trim(), telefono: form.telefono.trim(), direccion: form.direccion.trim(), etiqueta: form.etiqueta.trim() })
}

function resumen(p: PerfilFacturacion) {
  return [p.identificacion || 'sin cédula/RUC', p.email || 'sin correo'].join(' · ')
}
</script>

<template>
  <AppOverlay :open="open" label="Datos de facturación" :persistent="guardando" @close="emit('close')">
    <div class="dfm" data-test="completar-modal">
      <div class="dfm__head">
        <div>
          <span class="eyebrow">Factura por {{ total }} · casillero {{ casillero }}</span>
          <h3>¿A nombre de quién sale la factura?</h3>
          <p>Elige los datos, complétalos si falta algo y guarda. Queda en el cliente para la próxima vez.</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" :disabled="guardando" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
      </div>

      <div class="dfm__body">
        <div class="perfiles">
          <button
            v-for="p in perfiles"
            :key="p.id"
            type="button"
            class="perfil"
            :class="{ selected: p.id === perfilId }"
            :data-test="`perfil-${p.id}`"
            @click="emit('elegir', p.id)"
          >
            <span class="perfil__radio" aria-hidden="true" />
            <span class="perfil__body">
              <strong>{{ p.razonSocial || 'Sin nombre' }} <small v-if="p.principal" class="tag">datos del cliente</small><small v-else-if="p.etiqueta" class="tag">{{ p.etiqueta }}</small></strong>
              <small>{{ resumen(p) }}</small>
            </span>
            <button v-if="!p.principal" type="button" class="link quitar" :data-test="`eliminar-${p.id}`" @click.stop="emit('eliminar', p.id)">Quitar</button>
          </button>
          <button type="button" class="perfil nuevo" :class="{ selected: creando }" data-test="perfil-nuevo" @click="emit('elegir', NUEVO)">
            <span class="perfil__plus"><i class="fa-solid fa-plus" aria-hidden="true" /></span>
            <span class="perfil__body"><strong>Agregar otros datos de facturación</strong><small>Su empresa, un familiar, otra cédula…</small></span>
          </button>
        </div>

        <ul v-if="!creando && requeridos.length && !consumidorFinal" class="faltan" data-test="faltan">
          <li v-for="f in requeridos" :key="f.campo" :data-test="`faltante-${f.campo}`"><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ f.mensaje }}</li>
        </ul>

        <label v-if="ofreceConsumidorFinal" class="cf" data-test="consumidor-final">
          <input type="checkbox" :checked="consumidorFinal" @change="emit('update:consumidorFinal', ($event.target as HTMLInputElement).checked)" />
          <span><strong>Facturar a consumidor final</strong><small>El SRI lo admite hasta $50. La factura sale a «Consumidor Final».</small></span>
        </label>

        <form class="grid" @submit.prevent="guardar">
          <label v-if="creando || !seleccion?.principal" class="field span-2">
            <span>Etiqueta (para reconocerlo)</span>
            <input v-model="form.etiqueta" type="text" placeholder="Mi empresa, mi mamá…" :disabled="guardando" data-test="input-etiqueta" />
          </label>
          <label class="field span-2" :class="{ falta: faltantePor.nombreOficial }">
            <span>Nombre o razón social *</span>
            <input v-model="form.razonSocial" type="text" placeholder="Como debe salir en la factura" :disabled="guardando" data-test="input-nombreOficial" />
          </label>
          <label class="field" :class="{ falta: faltantePor.cedulaRuc && !creando }">
            <span>Cédula o RUC *</span>
            <input v-model="form.identificacion" type="text" placeholder="0954227641 o 0993388549001" :disabled="guardando" data-test="input-cedulaRuc" />
          </label>
          <label class="field" :class="{ falta: faltantePor.email && !creando }">
            <span>Correo</span>
            <input v-model="form.email" type="email" placeholder="cliente@correo.com" :disabled="guardando" data-test="input-email" />
          </label>
          <label class="field">
            <span>Teléfono</span>
            <input v-model="form.telefono" type="tel" placeholder="09…" :disabled="guardando" data-test="input-telefono" />
          </label>
          <label class="field">
            <span>Dirección</span>
            <input v-model="form.direccion" type="text" placeholder="Calle y ciudad" :disabled="guardando" data-test="input-direccion" />
          </label>
          <div class="acciones span-2">
            <button type="submit" class="btn primary sm" :disabled="!puedeGuardar" data-test="guardar-cliente">
              <i class="fa-solid" :class="guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" />
              {{ guardando ? 'Guardando…' : creando ? 'Agregar y usar estos datos' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <div class="dfm__foot">
        <button type="button" class="btn ghost" :disabled="guardando" @click="emit('close')">Cerrar</button>
        <button type="button" class="btn primary" :disabled="!listo || guardando || validando || creando" data-test="continuar-emitir" @click="emit('continuar')">
          <i class="fa-solid" :class="validando ? 'fa-circle-notch fa-spin' : 'fa-file-invoice-dollar'" aria-hidden="true" />
          {{ validando ? 'Revisando…' : 'Continuar a emitir' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;

@include ui.buttons;
@include ui.fields;

.dfm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 680px); max-height: calc(100svh - 2rem); display: flex; flex-direction: column; overflow: hidden; }
.dfm__head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.05rem; } p { margin: 0; color: $ink-400; font-size: 0.85rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } }
}
.dfm__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.dfm__foot { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); @media (max-width: 560px) { flex-direction: column-reverse; } }

.perfiles { display: flex; flex-direction: column; gap: $space-2; }
.perfil {
  display: flex; align-items: center; gap: $space-3; width: 100%; padding: $space-3; border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.2); background: $ink-850; color: $ink-200; font: inherit; text-align: left; cursor: pointer;
  transition: border-color $dur-fast ease, background $dur-fast ease;
  &:hover { border-color: rgba($brand-orange, 0.4); }
  &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.1); .perfil__radio { border-color: $brand-orange; box-shadow: inset 0 0 0 4px $ink-900; background: $brand-orange; } }
  &.nuevo { border-style: dashed; }
  &__radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid $ink-500; flex: 0 0 auto; transition: all $dur-fast ease; }
  &__plus { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: rgba($brand-orange, 0.14); color: $brand-orange; flex: 0 0 auto; }
  &__body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; strong { color: $fg-dark; font-size: 0.9rem; } small { color: $ink-400; font-size: 0.76rem; } }
  .tag { font-size: 0.68rem; color: $brand-orange; font-weight: 600; margin-left: 6px; }
  .quitar { flex: 0 0 auto; color: $ink-400; &:hover { color: $signal-red; } }
}
.faltan { list-style: none; margin: 0; padding: $space-3 $space-4; border-radius: $radius-md; border: 1px solid rgba($signal-amber, 0.45); background: rgba($signal-amber, 0.07); color: $ink-100; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.3rem; li { display: flex; gap: $space-2; } i { color: $signal-amber; margin-top: 3px; } }
.cf { display: flex; gap: $space-3; align-items: flex-start; padding: $space-3; border-radius: $radius-md; border: 1px dashed rgba($brand-orange, 0.4); cursor: pointer;
  input { width: 20px; height: 20px; accent-color: $brand-orange; flex: 0 0 auto; margin-top: 2px; } strong { display: block; color: $fg-dark; font-size: 0.88rem; } small { color: $ink-400; font-size: 0.78rem; } }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 640px) { grid-template-columns: 1fr; } .span-2 { grid-column: 1 / -1; } .acciones { display: flex; justify-content: flex-end; } }
.field.falta input { border-color: rgba($signal-amber, 0.6); }
</style>
