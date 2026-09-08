<script setup lang="ts">
/**
 * Se abre al pulsar «Emitir factura» cuando al cliente le falta algo que el SRI
 * exige. El counter completa y guarda ahí mismo, y sigue a emitir sin salir.
 */
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { DatoFaltante } from '@/services/facturacion.api'
import DatosFaltantes from './DatosFaltantes.vue'
import type { FormularioCliente } from './useFacturacion'

defineProps<{
  open: boolean
  cliente: { nombre: string; identificacion: string; email: string; telefono: string; direccion: string; casillero: string }
  faltantes: DatoFaltante[]
  consumidorFinal: boolean
  consumidorFinalPosible: boolean
  guardando: boolean
  validando: boolean
  /** Ya se puede emitir: todo lo obligatorio está resuelto. */
  listo: boolean
  total: string
}>()

const emit = defineEmits<{
  close: []
  guardar: [datos: Partial<FormularioCliente>]
  'update:consumidorFinal': [value: boolean]
  continuar: []
}>()
</script>

<template>
  <AppOverlay :open="open" label="Completar datos del cliente" :persistent="guardando" @close="emit('close')">
    <div class="ccm" data-test="completar-modal">
      <div class="ccm__head">
        <div>
          <span class="eyebrow">Antes de emitir · {{ total }}</span>
          <h3>Datos de {{ cliente.nombre || 'el cliente' }}</h3>
          <p>Casillero {{ cliente.casillero }}. Lo que guardes queda en el cliente para las próximas facturas.</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" :disabled="guardando" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div class="ccm__body">
        <DatosFaltantes
          v-if="faltantes.length"
          :cliente="cliente"
          :faltantes="faltantes"
          :consumidor-final="consumidorFinal"
          :consumidor-final-posible="consumidorFinalPosible"
          :guardando="guardando"
          @guardar="(d) => emit('guardar', d)"
          @update:consumidor-final="(v) => emit('update:consumidorFinal', v)"
        />
        <p v-else class="ok"><i class="fa-solid fa-circle-check" aria-hidden="true" /> El cliente tiene todo lo que el SRI necesita.</p>
      </div>

      <div class="ccm__foot">
        <button type="button" class="btn ghost" :disabled="guardando" @click="emit('close')">Cancelar</button>
        <button type="button" class="btn primary" :disabled="!listo || guardando || validando" data-test="continuar-emitir" @click="emit('continuar')">
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

.ccm {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  width: min(100%, 640px);
  max-height: calc(100svh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ccm__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4;
  padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.05rem; }
  p { margin: 0; color: $ink-400; font-size: 0.85rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; transition: color $dur-fast ease; &:hover { color: $fg-dark; } }
}
.ccm__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: $space-5; }
.ccm__foot { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); @media (max-width: 560px) { flex-direction: column-reverse; } }
.ok { display: flex; align-items: center; gap: $space-2; margin: 0; color: $signal-green; }
</style>
