<script setup lang="ts">
/**
 * Ingresar cajas una a una, con las mismas columnas del manifiesto. Cada caja
 * agregada queda en una lista dentro del modal; «Ver en la lista» las manda a
 * la misma previsualización que el Excel.
 */
import { computed, reactive, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import type { CajaManual } from '@/services/ingreso_carga.api'
import { cajaManualVacia, validarCajaManual } from './useIngresoCarga'

const props = defineProps<{ open: boolean; cajas: CajaManual[] }>()
const emit = defineEmits<{ close: []; agregar: [caja: CajaManual]; quitar: [indice: number]; ver: [] }>()

const form = reactive<CajaManual>(cajaManualVacia())
const intento = ref(false)
const errores = computed(() => validarCajaManual(form))
const valida = computed(() => Object.keys(errores.value).length === 0)

watch(() => props.open, (o) => { if (o) { intento.value = false } })

function agregar(): boolean {
  intento.value = true
  if (!valida.value) return false
  emit('agregar', { ...form })
  // La siguiente caja suele ser del mismo vuelo: se conservan fecha, master, origen y agencia.
  Object.assign(form, { ...cajaManualVacia(), fecha: form.fecha, mg: form.mg, origen: form.origen, agencia: form.agencia })
  intento.value = false
  return true
}

function ver() {
  const hayForm = form.wr.trim() || form.cliente.trim() || String(form.peso).trim()
  if (hayForm && !agregar()) return
  if (!props.cajas.length && !hayForm) return
  emit('ver')
}

const err = (k: keyof CajaManual) => (intento.value ? errores.value[k] : undefined)
</script>

<template>
  <AppOverlay :open="open" label="Ingresar caja" @close="emit('close')">
    <div class="cmm" data-test="caja-manual-modal">
      <div class="cmm__head">
        <div>
          <span class="eyebrow">Ingreso de carga · una a una</span>
          <h3>Ingresar caja</h3>
          <p>Mismos datos que el manifiesto. Al terminar, «Ver en la lista» las revisa igual que el Excel.</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
      </div>

      <div class="cmm__body">
        <form class="grid" @submit.prevent="agregar">
          <label class="field" :class="{ mal: err('wr') }">
            <span>BOX ID (WR) *</span>
            <input v-model="form.wr" type="text" placeholder="WR839943" data-test="m-wr" />
            <em v-if="err('wr')">{{ err('wr') }}</em>
          </label>
          <label class="field" :class="{ mal: err('mg') }">
            <span>Master (MG)</span>
            <input v-model="form.mg" type="text" placeholder="MG002516" data-test="m-mg" />
            <em v-if="err('mg')">{{ err('mg') }}</em>
          </label>
          <label class="field" :class="{ mal: err('fecha') }">
            <span>Fecha de ingreso *</span>
            <input v-model="form.fecha" type="date" data-test="m-fecha" />
            <em v-if="err('fecha')">{{ err('fecha') }}</em>
          </label>
          <label class="field" :class="{ mal: err('peso') }">
            <span>Peso (lb) *</span>
            <input v-model="form.peso" type="number" min="0.01" step="0.01" placeholder="1.5" data-test="m-peso" />
            <em v-if="err('peso')">{{ err('peso') }}</em>
          </label>
          <label class="field span-2" :class="{ mal: err('cliente') }">
            <span>Cliente (como en el manifiesto) *</span>
            <input v-model="form.cliente" type="text" placeholder="MARIA ELIZABETH GILER" data-test="m-cliente" />
            <em v-if="err('cliente')">{{ err('cliente') }}</em>
          </label>
          <label class="field"><span>Agencia</span><input v-model="form.agencia" type="text" placeholder="COURIER BOX" data-test="m-agencia" /></label>
          <label class="field"><span>Origen</span><input v-model="form.origen" type="text" placeholder="FLORIDA" /></label>
          <label class="field span-2"><span>Descripción del contenido</span><input v-model="form.contenido" type="text" placeholder="3 cremas, 2 cosméticos" data-test="m-contenido" /></label>
          <label class="field"><span>Tracking</span><input v-model="form.tracking" type="text" placeholder="TBA333667816882" /></label>
          <label class="field"><span>Ciudad</span><input v-model="form.ciudad" type="text" placeholder="GUAYAQUIL" /></label>
          <label class="field span-2"><span>Dirección</span><input v-model="form.direccion" type="text" placeholder="Dirección de entrega" /></label>
          <label class="check span-2"><input v-model="form.reempaque" type="checkbox" :true-value="true" :false-value="false" /> <span>Reempaque</span></label>
          <div class="acciones span-2">
            <button type="submit" class="btn ghost" data-test="m-agregar"><i class="fa-solid fa-plus" aria-hidden="true" /> Agregar y seguir con otra</button>
          </div>
        </form>

        <div v-if="cajas.length" class="cola" data-test="m-cola">
          <span class="label">{{ cajas.length }} caja(s) por revisar</span>
          <ul>
            <li v-for="(c, i) in cajas" :key="`${c.wr}-${i}`">
              <strong>{{ c.wr }}</strong><small>{{ c.cliente }} · {{ c.peso }} lb<template v-if="c.contenido"> · {{ c.contenido }}</template></small>
              <button type="button" class="link" :data-test="`m-quitar-${i}`" @click="emit('quitar', i)">Quitar</button>
            </li>
          </ul>
        </div>
      </div>

      <div class="cmm__foot">
        <button type="button" class="btn ghost" @click="emit('close')">Cerrar</button>
        <button type="button" class="btn primary" :disabled="!cajas.length && !valida" data-test="m-ver" @click="ver"><i class="fa-solid fa-list-check" aria-hidden="true" /> Ver en la lista</button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '../Homologacion/homologacion-ui' as ui;
@include ui.buttons;
@include ui.fields;
.cmm { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 720px); max-height: calc(100svh - 2rem); display: flex; flex-direction: column; overflow: hidden; }
.cmm__head { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.1rem; } p { margin: 0; color: $ink-400; font-size: 0.85rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } } }
.cmm__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: $space-5; display: flex; flex-direction: column; gap: $space-5; }
.cmm__foot { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 640px) { grid-template-columns: 1fr; } .span-2 { grid-column: 1 / -1; } .acciones { display: flex; justify-content: flex-end; } }
.field em { color: $signal-amber; font-size: 0.76rem; font-style: normal; }
.field.mal input { border-color: rgba($signal-amber, 0.7); }
.check { display: flex; align-items: center; gap: $space-2; color: $ink-200; font-size: 0.9rem; input { width: 18px; height: 18px; accent-color: $brand-orange; } }
.cola { display: flex; flex-direction: column; gap: $space-2; .label { color: $ink-400; font-size: 0.78rem; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }
  li { display: flex; align-items: center; gap: $space-3; padding: $space-2 $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); strong { color: $fg-dark; } small { color: $ink-400; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } } }
</style>
