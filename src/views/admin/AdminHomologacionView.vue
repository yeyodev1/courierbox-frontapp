<script setup lang="ts">
/**
 * Homologation queue — Module 1 of the proposal.
 *
 * The importer can only match names it has seen before, so on a fresh database
 * every package lands here unassigned. Resolving a name once links all of its
 * packages and stores an alias, which is what makes later imports match on
 * their own. Nothing downstream (invoicing, counter pickup) can run until a
 * package has an owner.
 */
import { computed, onMounted, ref, watch } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import {
  homologacionApi,
  type ClienteMaster,
  type PendienteGrupo,
} from '@/services/homologacion.api'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()

const grupos = ref<PendienteGrupo[]>([])
const totalPendientes = ref(0)
const totalClientes = ref(0)
const loading = ref(true)
const expandido = ref<string | null>(null)

const modalGrupo = ref<PendienteGrupo | null>(null)
const modo = ref<'existente' | 'nuevo'>('nuevo')
const guardando = ref(false)

const busqueda = ref('')
const buscando = ref(false)
const resultados = ref<ClienteMaster[]>([])
const clienteElegido = ref<ClienteMaster | null>(null)

const nuevo = ref({ codigoCasillero: '', nombreOficial: '', cedulaRuc: '', email: '', telefono: '' })

const puedeGuardar = computed(() => {
  if (modo.value === 'existente') return Boolean(clienteElegido.value)
  return Boolean(nuevo.value.codigoCasillero.trim() && nuevo.value.nombreOficial.trim())
})

let timer: number | undefined
watch(busqueda, (value) => {
  window.clearTimeout(timer)
  if (value.trim().length < 2) {
    resultados.value = []
    return
  }
  timer = window.setTimeout(async () => {
    buscando.value = true
    try {
      resultados.value = await homologacionApi.buscarClientes(value.trim())
    } catch (e: any) {
      toast.showNotification(e.message || 'No se pudo buscar clientes', 'error')
    } finally {
      buscando.value = false
    }
  }, 300)
})

async function cargar() {
  loading.value = true
  try {
    const data = await homologacionApi.pendientes(40)
    grupos.value = data.grupos
    totalPendientes.value = data.totalPendientes
    totalClientes.value = data.totalClientes
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo cargar la cola', 'error')
  } finally {
    loading.value = false
  }
}

function abrir(grupo: PendienteGrupo, sugerencia?: ClienteMaster) {
  modalGrupo.value = grupo
  clienteElegido.value = sugerencia ?? null
  modo.value = sugerencia ? 'existente' : grupo.sugerencias.length ? 'existente' : 'nuevo'
  busqueda.value = ''
  resultados.value = []
  nuevo.value = {
    codigoCasillero: '',
    // Pre-fill with the name we already read off the manifest.
    nombreOficial: grupo.nombre === 'SIN NOMBRE' ? '' : grupo.nombre,
    cedulaRuc: '',
    email: '',
    telefono: '',
  }
}

function elegirSugerencia(s: PendienteGrupo['sugerencias'][number]) {
  clienteElegido.value = {
    _id: s.masterId,
    nombreOficial: s.nombreOficial,
    codigoCasillero: s.codigoCasillero,
    cedulaRuc: s.cedulaRuc,
  }
  modo.value = 'existente'
}

async function guardar() {
  if (!modalGrupo.value) return
  guardando.value = true
  try {
    const res = await homologacionApi.homologar({
      nombre: modalGrupo.value.nombre,
      ...(modo.value === 'existente'
        ? { masterClienteId: clienteElegido.value!._id }
        : { nuevoCliente: { ...nuevo.value } }),
    })
    toast.showNotification(
      `${res.homologados} paquete(s) vinculados a ${res.cliente?.nombreOficial ?? 'el cliente'}.`,
      'success',
    )
    modalGrupo.value = null
    await cargar()
  } catch (e: any) {
    toast.showNotification(e.data?.error || e.message || 'No se pudo homologar', 'error')
  } finally {
    guardando.value = false
  }
}

function pct(score: number) {
  return `${Math.round(score * 100)}%`
}

onMounted(cargar)
</script>

<template>
  <div class="homol">
    <header class="head">
      <div>
        <h1>Homologación de clientes</h1>
        <p>
          Vincula cada nombre del manifiesto con un cliente. Al resolverlo una vez, las
          importaciones siguientes lo reconocen solas.
        </p>
      </div>
      <button type="button" class="btn ghost" :disabled="loading" @click="cargar">
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }" aria-hidden="true" /> Actualizar
      </button>
    </header>

    <section class="stats">
      <article class="stat" :class="{ 'is-alert': totalPendientes > 0 }">
        <span>Paquetes sin cliente</span>
        <strong>{{ totalPendientes.toLocaleString('es-EC') }}</strong>
        <small>No se pueden facturar ni entregar</small>
      </article>
      <article class="stat">
        <span>Clientes registrados</span>
        <strong>{{ totalClientes.toLocaleString('es-EC') }}</strong>
        <small>Casilleros únicos</small>
      </article>
      <article class="stat">
        <span>Nombres por resolver</span>
        <strong>{{ grupos.length }}</strong>
        <small>Mostrando los de mayor volumen</small>
      </article>
    </section>

    <div v-if="loading" aria-busy="true">
      <AppSkeleton variant="card" height="92px" :count="6" gap="0.75rem" />
    </div>

    <p v-else-if="!grupos.length" class="empty">
      <i class="fa-solid fa-circle-check" aria-hidden="true" />
      Todo homologado. No hay paquetes sin cliente.
    </p>

    <ul v-else class="grupos">
      <li v-for="g in grupos" :key="g.nombre" class="grupo">
        <div class="grupo__main">
          <div class="grupo__id">
            <strong>{{ g.nombre }}</strong>
            <span>{{ g.totalPaquetes }} paquete(s) · {{ g.totalPesoLb.toFixed(2) }} lb</span>
          </div>

          <div class="grupo__sug">
            <template v-if="g.sugerencias.length">
              <button
                v-for="s in g.sugerencias.slice(0, 3)"
                :key="s.masterId"
                type="button"
                class="sug"
                :title="`Vincular a ${s.nombreOficial}`"
                @click="abrir(g, { _id: s.masterId, nombreOficial: s.nombreOficial, codigoCasillero: s.codigoCasillero, cedulaRuc: s.cedulaRuc })"
              >
                <span class="sug__score">{{ pct(s.score) }}</span>
                <span class="sug__name">{{ s.nombreOficial }}</span>
              </button>
            </template>
            <span v-else class="sin-sug">Sin coincidencias</span>
          </div>

          <div class="grupo__actions">
            <button type="button" class="link" @click="expandido = expandido === g.nombre ? null : g.nombre">
              {{ expandido === g.nombre ? 'Ocultar' : 'Ver paquetes' }}
            </button>
            <button type="button" class="btn primary sm" @click="abrir(g)">Homologar</button>
          </div>
        </div>

        <div v-if="expandido === g.nombre" class="grupo__detalle">
          <p class="muestra-nota">
            Muestra de {{ g.paquetes.length }} de {{ g.totalPaquetes }} paquete(s).
            Al homologar se vinculan <strong>todos</strong>.
          </p>
          <table>
            <thead>
              <tr><th>WR</th><th>Casillero</th><th>Contenido</th><th class="num">Peso</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in g.paquetes" :key="p._id">
                <td class="mono">{{ p.wr }}</td>
                <td class="mono">{{ p.sh }}</td>
                <td>{{ p.contenido || '—' }}</td>
                <td class="num">{{ p.pesoLb.toFixed(2) }} lb</td>
              </tr>
            </tbody>
          </table>
        </div>
      </li>
    </ul>

    <!-- Modal de homologación -->
    <AppOverlay
      :open="!!modalGrupo"
      label="Homologar cliente"
      :persistent="guardando"
      @close="modalGrupo = null"
    >
      <div v-if="modalGrupo" class="modal-card wide homol-modal">
        <div class="hm-head">
          <div>
            <h3>Homologar “{{ modalGrupo.nombre }}”</h3>
            <p>{{ modalGrupo.totalPaquetes }} paquete(s) · {{ modalGrupo.totalPesoLb.toFixed(2) }} lb</p>
          </div>
          <button type="button" class="close" :disabled="guardando" @click="modalGrupo = null">
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

          <!-- Existente -->
          <template v-if="modo === 'existente'">
            <div v-if="modalGrupo.sugerencias.length" class="sugerencias">
              <span class="label">Coincidencias probables</span>
              <button
                v-for="s in modalGrupo.sugerencias"
                :key="s.masterId"
                type="button"
                class="sug-row"
                :class="{ selected: clienteElegido?._id === s.masterId }"
                @click="elegirSugerencia(s)"
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
              <input v-model="busqueda" type="search" placeholder="Nombre, casillero o cédula…" />
            </label>

            <div v-if="buscando" class="mini-loading"><AppSkeleton variant="text" :count="2" /></div>

            <ul v-else-if="resultados.length" class="resultados">
              <li v-for="c in resultados" :key="c._id">
                <button
                  type="button"
                  class="sug-row"
                  :class="{ selected: clienteElegido?._id === c._id }"
                  @click="clienteElegido = c"
                >
                  <span class="sug-row__body">
                    <strong>{{ c.nombreOficial }}</strong>
                    <small>{{ c.codigoCasillero }}<template v-if="c.cedulaRuc"> · {{ c.cedulaRuc }}</template></small>
                  </span>
                </button>
              </li>
            </ul>

            <p v-if="clienteElegido" class="elegido">
              <i class="fa-solid fa-circle-check" aria-hidden="true" />
              Se vincularán a <strong>{{ clienteElegido.nombreOficial }}</strong> ({{ clienteElegido.codigoCasillero }})
            </p>
          </template>

          <!-- Nuevo -->
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
          <button type="button" class="btn ghost" :disabled="guardando" @click="modalGrupo = null">Cancelar</button>
          <button type="button" class="btn primary" :disabled="guardando || !puedeGuardar" @click="guardar">
            <i v-if="guardando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            {{ guardando ? 'Vinculando…' : `Vincular ${modalGrupo.totalPaquetes} paquete(s)` }}
          </button>
        </div>
      </div>
    </AppOverlay>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.homol { display: flex; flex-direction: column; gap: $space-5; }

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;

  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 62ch; }
}

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: $space-3; }

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-4;
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;

  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.7rem; color: $fg-dark; font-variant-numeric: tabular-nums; }
  small { color: $ink-500; font-size: 0.76rem; }

  &.is-alert {
    border-color: rgba($signal-amber, 0.4);
    strong { color: $signal-amber; }
  }
}

.grupos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }

.grupo {
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
  overflow: hidden;
}

.grupo__main {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  flex-wrap: wrap;
}

.grupo__id {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong { color: $fg-dark; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.grupo__sug { flex: 2 1 300px; display: flex; gap: $space-2; flex-wrap: wrap; }

.sug {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  max-width: 100%;
  padding: $space-2 $space-3;
  border-radius: $radius-pill;
  border: 1px solid rgba($signal-green, 0.3);
  background: rgba($signal-green, 0.08);
  color: $ink-200;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;

  &:hover { border-color: rgba($signal-green, 0.6); }
}

.sug__score { color: $signal-green; font-weight: 700; flex: 0 0 auto; }
.sug__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sin-sug { color: $ink-500; font-size: 0.8rem; align-self: center; }

.grupo__actions { flex: 0 0 auto; display: flex; align-items: center; gap: $space-3; }

.grupo__detalle {
  border-top: 1px solid rgba($ink-500, 0.15);
  padding: $space-4;
  background: $ink-850;
  overflow-x: auto;

  table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  th {
    text-align: left;
    padding: $space-2;
    color: $ink-400;
    font-size: 0.7rem;
    text-transform: uppercase;
    border-bottom: 1px solid rgba($ink-500, 0.2);
  }
  td { padding: $space-2; border-bottom: 1px solid rgba($ink-500, 0.1); color: $ink-200; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: ui-monospace, monospace; color: $brand-orange; }
}

.muestra-nota { margin: 0 0 $space-3; color: $ink-400; font-size: 0.8rem; }

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-10;
  margin: 0;
  color: $signal-green;
  font-size: 0.9rem;
}

/* ── modal ── */
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
    width: 34px; height: 34px;
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

.sug-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  width: 100%;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.2);
  background: $ink-850;
  color: $ink-200;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover { border-color: rgba($brand-orange, 0.4); }
  &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.1); }
}

.sug-row__body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sug-row__body strong { color: $fg-dark; font-size: 0.88rem; }
.sug-row__body small { color: $ink-400; font-size: 0.76rem; }

.resultados { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }
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

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span { font-size: 0.8rem; color: $ink-400; }

  input {
    min-height: 42px;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.25);
    background: $ink-850;
    color: $fg-dark;
    font: inherit;
    outline: none;

    &:focus { border-color: rgba($brand-orange, 0.5); }
  }
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin: 0;
  color: $ink-400;
  font-size: 0.8rem;
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: $brand-orange;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 44px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.primary { background: $brand-orange; color: $ink-1000; }
  &.ghost { background: rgba($ink-700, 0.8); border-color: rgba($ink-500, 0.25); color: $ink-200; }
  &.sm { min-height: 36px; padding: 0 $space-4; font-size: 0.82rem; }
}
</style>
