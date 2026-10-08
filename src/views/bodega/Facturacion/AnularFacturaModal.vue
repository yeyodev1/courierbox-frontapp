<script setup lang="ts">
/**
 * Anular una factura: pide el motivo y avisa lo que no hace. El sistema libera
 * las cajas, pero en el SRI la factura sigue emitida hasta anularla allá.
 */
import { computed, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { FacturaHistorial } from '@/services/facturacion.api'
import { money } from './useFacturacion'

const props = defineProps<{ factura: FacturaHistorial | null; anulando: boolean }>()
const emit = defineEmits<{ close: []; confirmar: [motivo: string] }>()

const motivo = ref('')
watch(() => props.factura?._id, () => (motivo.value = ''))

const valido = computed(() => motivo.value.trim().length >= 5)
const autorizada = computed(() => props.factura?.estadoSri === 'autorizado')
</script>

<template>
  <AppOverlay :open="!!factura" label="Anular factura" @close="!anulando && emit('close')">
    <form v-if="factura" class="anm" data-test="anular-modal" @submit.prevent="valido && emit('confirmar', motivo.trim())">
      <div class="anm__head">
        <span class="eyebrow">Anular factura</span>
        <h3>{{ factura.numeroFactura }} · {{ money(factura.totalGeneral) }}</h3>
        <p>{{ factura.facturadoA?.razonSocial || factura.masterClienteId?.nombreOficial }} · {{ factura.paquetes.length }} caja(s)</p>
      </div>
      <div class="anm__body">
        <p class="nota">Las cajas vuelven a «Por facturar» y la factura pasa a «Anuladas».</p>
        <p v-if="autorizada" class="aviso" role="note">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          Esta factura está autorizada en el SRI. Aquí sólo se anula en el sistema: anúlala también en el portal del SRI o en Contifico.
        </p>
        <label class="campo">
          <span>Motivo</span>
          <textarea v-model="motivo" rows="3" maxlength="300" placeholder="Ej.: se facturó a otro cliente, peso equivocado…" data-test="anular-motivo" />
        </label>
      </div>
      <div class="anm__foot">
        <button type="button" class="btn ghost" :disabled="anulando" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn danger" :disabled="!valido || anulando" data-test="anular-confirmar">
          <i class="fa-solid" :class="anulando ? 'fa-circle-notch fa-spin' : 'fa-ban'" aria-hidden="true" />
          {{ anulando ? 'Anulando…' : 'Anular factura' }}
        </button>
      </div>
    </form>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;
.anm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 520px); display: flex; flex-direction: column; overflow: hidden; }
.anm__head { padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $signal-red; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.15rem; } p { margin: 0; color: $ink-400; font-size: 0.86rem; } }
.anm__body { padding: $space-5; display: flex; flex-direction: column; gap: $space-3; }
.nota { margin: 0; color: $ink-300; font-size: 0.88rem; }
.aviso { margin: 0; display: flex; gap: $space-2; padding: $space-3; border-radius: $radius-md; background: rgba($signal-amber, 0.1); border: 1px solid rgba($signal-amber, 0.35); color: $ink-200; font-size: 0.85rem; i { color: $signal-amber; margin-top: 2px; } }
.campo { display: flex; flex-direction: column; gap: 6px; span { color: $ink-400; font-size: 0.78rem; }
  textarea { resize: vertical; min-height: 84px; padding: $space-3; border-radius: $radius-md; border: 1px solid rgba($ink-500, 0.3); background: $ink-850; color: $fg-dark; font: inherit; outline: none; &:focus { border-color: rgba($brand-orange, 0.5); } } }
.anm__foot { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); }
.btn.danger { background: $signal-red; color: #fff; border-color: transparent; &:disabled { opacity: 0.5; cursor: not-allowed; } }
</style>
