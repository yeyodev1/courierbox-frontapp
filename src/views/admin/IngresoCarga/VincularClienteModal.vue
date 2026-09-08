<script setup lang="ts">
/**
 * Decide a mano a quién pertenece una caja cuando el nombre del manifiesto no
 * cuadró solo: elegir uno de los parecidos, buscar cualquier otro cliente, o
 * insistir en crear uno nuevo con ese nombre.
 */
import { computed, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { ClienteMaster } from '@/services/homologacion.api'
import type { FilaIngreso } from '@/services/ingreso_carga.api'
import { pct, useBusquedaClientes } from '../Homologacion/useHomologacion'
import { sugerenciaToCliente } from './useIngresoCarga'

const props = defineProps<{ fila: FilaIngreso | null }>()

const emit = defineEmits<{
  close: []
  vincular: [cliente: ClienteMaster]
  crear: []
}>()

type Eleccion = { tipo: 'cliente'; cliente: ClienteMaster } | { tipo: 'nuevo' } | null

const eleccion = ref<Eleccion>(null)
const busqueda = useBusquedaClientes()

const nombreNuevo = computed(() => props.fila?.clienteNombreOficial || props.fila?.cliente || '')
const sugerencias = computed(() => props.fila?.sugerencias ?? [])
const elegidoId = computed(() => (eleccion.value?.tipo === 'cliente' ? eleccion.value.cliente._id : null))

watch(
  () => props.fila,
  (fila) => {
    busqueda.reset()
    if (!fila) {
      eleccion.value = null
      return
    }
    // Arranca con lo que el sistema ya propuso, para que confirmar sea un clic.
    // Una fila ya vinculada a mano se abre sin elección: el operador viene a cambiarla.
    const primera = fila.sugerencias?.[0]
    if (fila.accion === 'aproximado' && primera) {
      eleccion.value = { tipo: 'cliente', cliente: sugerenciaToCliente(primera) }
    } else {
      eleccion.value = null
    }
  },
  { immediate: true },
)

function elegir(cliente: ClienteMaster) {
  eleccion.value = { tipo: 'cliente', cliente }
}

function confirmar() {
  if (!eleccion.value) return
  if (eleccion.value.tipo === 'nuevo') emit('crear')
  else emit('vincular', eleccion.value.cliente)
}
</script>

<template>
  <AppOverlay :open="!!fila" label="Vincular caja a un cliente" layer="modal" @close="emit('close')">
    <div v-if="fila" class="vincular" data-test="vincular-modal">
      <div class="vm-head">
        <div>
          <span class="eyebrow">Caja {{ fila.wr }}</span>
          <h3>¿A quién pertenece «{{ fila.cliente || 'sin nombre' }}»?</h3>
          <p>{{ fila.contenido || 'Sin descripción' }} · {{ fila.pesoLb }} lb</p>
        </div>
        <button type="button" class="close" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div class="vm-body">
        <section v-if="sugerencias.length" class="bloque">
          <span class="label">Clientes parecidos</span>
          <TransitionGroup name="lista" tag="div" class="lista">
            <button
              v-for="s in sugerencias"
              :key="s.masterId"
              type="button"
              class="sug-row"
              :class="{ selected: elegidoId === s.masterId }"
              :data-test="`sugerencia-${s.masterId}`"
              @click="elegir(sugerenciaToCliente(s))"
            >
              <span class="sug__score">{{ pct(s.score) }}</span>
              <span class="sug-row__body">
                <strong>{{ s.nombreOficial }}</strong>
                <small>{{ s.casillero }}</small>
              </span>
              <i v-if="elegidoId === s.masterId" class="fa-solid fa-circle-check check" aria-hidden="true" />
            </button>
          </TransitionGroup>
        </section>

        <section class="bloque">
          <label class="field">
            <span>{{ sugerencias.length ? 'Buscar otro cliente' : 'Buscar cliente' }}</span>
            <input v-model="busqueda.busqueda.value" type="search" placeholder="Nombre, casillero o cédula…" data-test="buscar" />
          </label>

          <div v-if="busqueda.buscando.value" class="mini-loading"><AppSkeleton variant="text" :count="2" /></div>

          <TransitionGroup v-else-if="busqueda.resultados.value.length" name="lista" tag="div" class="lista">
            <button
              v-for="c in busqueda.resultados.value"
              :key="c._id"
              type="button"
              class="sug-row"
              :class="{ selected: elegidoId === c._id }"
              :data-test="`resultado-${c._id}`"
              @click="elegir(c)"
            >
              <span class="sug-row__body">
                <strong>{{ c.nombreOficial }}</strong>
                <small>{{ c.codigoCasillero }}<template v-if="c.cedulaRuc"> · {{ c.cedulaRuc }}</template></small>
              </span>
              <i v-if="elegidoId === c._id" class="fa-solid fa-circle-check check" aria-hidden="true" />
            </button>
          </TransitionGroup>

          <p v-else-if="busqueda.hasQuery.value" class="nada">Ningún cliente coincide con esa búsqueda.</p>
        </section>

        <section class="bloque">
          <span class="label">O bien</span>
          <button
            type="button"
            class="sug-row nuevo"
            :class="{ selected: eleccion?.tipo === 'nuevo' }"
            data-test="crear-nuevo"
            @click="eleccion = { tipo: 'nuevo' }"
          >
            <span class="sug__plus"><i class="fa-solid fa-user-plus" aria-hidden="true" /></span>
            <span class="sug-row__body">
              <strong>Crear cliente nuevo: {{ nombreNuevo }}</strong>
              <small>Se le asigna un casillero al confirmar el ingreso</small>
            </span>
            <i v-if="eleccion?.tipo === 'nuevo'" class="fa-solid fa-circle-check check" aria-hidden="true" />
          </button>
        </section>

        <Transition name="fade-up">
          <p v-if="eleccion" class="elegido" data-test="eleccion">
            <i class="fa-solid fa-circle-check" aria-hidden="true" />
            <template v-if="eleccion.tipo === 'nuevo'">
              La caja quedará en un cliente <strong>nuevo</strong> llamado {{ nombreNuevo }}.
            </template>
            <template v-else>
              La caja quedará en <strong>{{ eleccion.cliente.nombreOficial }}</strong> ({{ eleccion.cliente.codigoCasillero }}).
            </template>
          </p>
        </Transition>
      </div>

      <div class="vm-foot">
        <button type="button" class="btn ghost" @click="emit('close')">Cancelar</button>
        <button type="button" class="btn primary" :disabled="!eleccion" data-test="confirmar-vinculo" @click="confirmar">
          <i class="fa-solid fa-link" aria-hidden="true" />
          {{ eleccion?.tipo === 'nuevo' ? 'Crear nuevo' : 'Vincular' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use '../Homologacion/homologacion-ui' as ui;

@include ui.buttons;
@include ui.suggestion;
@include ui.fields;

.vincular {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  width: min(100%, 600px);
  max-height: calc(100svh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5;
  border-bottom: 1px solid rgba($ink-500, 0.15);

  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0 0 2px; font-size: 1.05rem; text-wrap: balance; }
  p { margin: 0; color: $ink-400; font-size: 0.85rem; }

  .close {
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.2);
    background: rgba($ink-800, 0.8);
    color: $ink-300;
    cursor: pointer;
    transition: color $dur-fast ease, border-color $dur-fast ease;
    &:hover { color: $fg-dark; border-color: rgba($signal-red, 0.35); }
  }
}

.vm-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.vm-foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-top: 1px solid rgba($ink-500, 0.15);
  @media (max-width: 560px) { flex-direction: column-reverse; }
}

.bloque { display: flex; flex-direction: column; gap: $space-2; }
.label { color: $ink-400; font-size: 0.78rem; }
.lista { display: flex; flex-direction: column; gap: $space-2; }
.mini-loading { padding: $space-2 0; }
.nada { margin: 0; color: $ink-500; font-size: 0.82rem; }

.sug-row {
  position: relative;
  transition: border-color $dur-fast ease, background $dur-fast ease, transform $dur-fast ease;
  &:active { transform: scale(0.995); }
  .check { margin-left: auto; color: $signal-green; flex: 0 0 auto; }
  &.nuevo { border-style: dashed; }
  &.nuevo.selected { border-style: solid; }
}

.sug__plus {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba($brand-orange, 0.14);
  color: $brand-orange;
}

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

// Las listas entran escalonadas y el resumen elegido sube al aparecer.
.lista-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.lista-leave-active { transition: opacity $dur-fast ease; position: absolute; }
.lista-enter-from { opacity: 0; transform: translateY(6px); }
.lista-leave-to { opacity: 0; }
.fade-up-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.fade-up-leave-active { transition: opacity $dur-fast ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }

@media (prefers-reduced-motion: reduce) {
  .lista-enter-active, .lista-leave-active, .fade-up-enter-active, .fade-up-leave-active, .sug-row { transition: none; }
}
</style>
