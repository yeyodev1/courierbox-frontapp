<script setup lang="ts">
/**
 * Resolves one manifest name: either link it to an existing master client or
 * create a brand-new one. Linking covers every package in the group at once.
 */
import { computed, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { ClienteMaster, PendienteGrupo } from '@/services/homologacion.api'
import {
  emptyNuevoCliente,
  pct,
  sugerenciaToCliente,
  useBusquedaClientes,
  type NuevoClienteForm,
  type Sugerencia,
} from './useHomologacion'

const props = defineProps<{ grupo: PendienteGrupo | null; guardando: boolean; sugerenciaInicial?: Sugerencia | null }>()

const emit = defineEmits<{
  close: []
  submit: [target: { masterClienteId: string } | { nuevoCliente: NuevoClienteForm }]
}>()

const modo = ref<'existente' | 'nuevo'>('nuevo')
const elegido = ref<ClienteMaster | null>(null)
const nuevo = ref<NuevoClienteForm>(emptyNuevoCliente())

const busqueda = useBusquedaClientes()

const puedeGuardar = computed(() => {
  if (modo.value === 'existente') return Boolean(elegido.value)
  return Boolean(nuevo.value.codigoCasillero.trim() && nuevo.value.nombreOficial.trim())
})

watch(
  () => props.grupo,
  (grupo) => {
    if (!grupo) return
    const sugerencia = props.sugerenciaInicial ?? null
    elegido.value = sugerencia ? sugerenciaToCliente(sugerencia) : null
    modo.value = sugerencia || grupo.sugerencias.length ? 'existente' : 'nuevo'
    busqueda.reset()
    nuevo.value = {
      ...emptyNuevoCliente(),
      // Pre-fill with the name we already read off the manifest.
      nombreOficial: grupo.nombre === 'SIN NOMBRE' ? '' : grupo.nombre,
    }
  },
  { immediate: true },
)

function submit() {
  if (!puedeGuardar.value) return
  emit(
    'submit',
    modo.value === 'existente' ? { masterClienteId: elegido.value!._id } : { nuevoCliente: { ...nuevo.value } },
  )
}
</script>

<template>
  <AppOverlay :open="!!grupo" label="Homologar cliente" :persistent="guardando" @close="emit('close')">
    <div v-if="grupo" class="homol-modal">
      <div class="hm-head">
        <div>
          <h3>Homologar “{{ grupo.nombre }}”</h3>
          <p>{{ grupo.totalPaquetes }} paquete(s) · {{ grupo.totalPesoLb.toFixed(2) }} lb</p>
        </div>
        <button type="button" class="close" :disabled="guardando" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div class="hm-body">
        <div class="tabs">
          <button type="button" :class="{ active: modo === 'existente' }" @click="modo = 'existente'">
            Vincular a cliente existente
          </button>
          <button type="button" :class="{ active: modo === 'nuevo' }" @click="modo = 'nuevo'">
            Crear cliente nuevo
          </button>
        </div>

        <template v-if="modo === 'existente'">
          <div v-if="grupo.sugerencias.length" class="sugerencias">
            <span class="label">Coincidencias probables</span>
            <button
              v-for="s in grupo.sugerencias"
              :key="s.masterId"
              type="button"
              class="sug-row"
              :class="{ selected: elegido?._id === s.masterId }"
              @click="elegido = sugerenciaToCliente(s)"
            >
              <span class="sug__score">{{ pct(s.score) }}</span>
              <span class="sug-row__body">
                <strong>{{ s.nombreOficial }}</strong>
                <small>{{ s.codigoCasillero }}<template v-if="s.cedulaRuc"> · {{ s.cedulaRuc }}</template></small>
              </span>
            </button>
          </div>

          <label class="field">
            <span>Buscar otro cliente</span>
            <input v-model="busqueda.busqueda.value" type="search" placeholder="Nombre, casillero o cédula…" />
          </label>

          <div v-if="busqueda.buscando.value" class="mini-loading"><AppSkeleton variant="text" :count="2" /></div>

          <ul v-else-if="busqueda.resultados.value.length" class="resultados">
            <li v-for="c in busqueda.resultados.value" :key="c._id">
              <button type="button" class="sug-row" :class="{ selected: elegido?._id === c._id }" @click="elegido = c">
                <span class="sug-row__body">
                  <strong>{{ c.nombreOficial }}</strong>
                  <small>{{ c.codigoCasillero }}<template v-if="c.cedulaRuc"> · {{ c.cedulaRuc }}</template></small>
                </span>
              </button>
            </li>
          </ul>

          <p v-if="elegido" class="elegido">
            <i class="fa-solid fa-circle-check" aria-hidden="true" />
            Se vincularán a <strong>{{ elegido.nombreOficial }}</strong> ({{ elegido.codigoCasillero }})
          </p>
        </template>

        <template v-else>
          <div class="grid-2">
            <label class="field">
              <span>Código de casillero *</span>
              <input v-model="nuevo.codigoCasillero" type="text" placeholder="SH123456" />
            </label>
            <label class="field">
              <span>Cédula / RUC</span>
              <input v-model="nuevo.cedulaRuc" type="text" placeholder="0102030405" />
            </label>
            <label class="field span-2">
              <span>Nombre oficial *</span>
              <input v-model="nuevo.nombreOficial" type="text" placeholder="Nombre como debe salir en la factura" />
            </label>
            <label class="field">
              <span>Correo</span>
              <input v-model="nuevo.email" type="email" placeholder="cliente@correo.com" />
            </label>
            <label class="field">
              <span>Teléfono</span>
              <input v-model="nuevo.telefono" type="text" placeholder="09..." />
            </label>
          </div>
          <p class="hint">
            <i class="fa-solid fa-circle-info" aria-hidden="true" />
            El casillero debe ser único. Si la cédula ya pertenece a otro cliente, el sistema lo bloquea
            y te pide vincular al existente.
          </p>
        </template>
      </div>

      <div class="hm-foot">
        <button type="button" class="btn ghost" :disabled="guardando" @click="emit('close')">Cancelar</button>
        <button type="button" class="btn primary" :disabled="guardando || !puedeGuardar" @click="submit">
          <i v-if="guardando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
          {{ guardando ? 'Vinculando…' : `Vincular ${grupo.totalPaquetes} paquete(s)` }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './homologacion-ui' as ui;

@include ui.buttons;
@include ui.suggestion;
@include ui.fields;

.homol-modal {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  width: min(100%, 640px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5;
  border-bottom: 1px solid rgba($ink-500, 0.15);

  h3 { margin: 0 0 2px; font-size: 1.05rem; }
  p { margin: 0; color: $ink-400; font-size: 0.85rem; }

  .close {
    width: 34px;
    height: 34px;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.2);
    background: rgba($ink-800, 0.8);
    color: $ink-300;
    cursor: pointer;
  }
}

.hm-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.hm-foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-top: 1px solid rgba($ink-500, 0.15);

  @media (max-width: 560px) { flex-direction: column-reverse; }
}

.tabs {
  display: flex;
  gap: $space-2;
  padding: 4px;
  border-radius: $radius-md;
  background: $ink-850;

  button {
    flex: 1;
    min-height: 38px;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: $ink-300;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;

    &.active { background: rgba($brand-orange, 0.15); color: $brand-orange; font-weight: 600; }
  }
}

.sugerencias { display: flex; flex-direction: column; gap: $space-2; }
.label { color: $ink-400; font-size: 0.78rem; }

.resultados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.mini-loading { padding: $space-2 0; }

.elegido {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  padding: $space-3;
  border-radius: $radius-md;
  background: rgba($signal-green, 0.1);
  border: 1px solid rgba($signal-green, 0.3);
  color: $ink-200;
  font-size: 0.85rem;

  i { color: $signal-green; }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;

  @media (max-width: 560px) { grid-template-columns: 1fr; }

  .span-2 { grid-column: 1 / -1; }
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin: 0;
  color: $ink-400;
  font-size: 0.8rem;
}
</style>
