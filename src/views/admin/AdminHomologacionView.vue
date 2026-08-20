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
import { onMounted, ref } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { PendienteGrupo } from '@/services/homologacion.api'
import HomologacionGrupo from './Homologacion/HomologacionGrupo.vue'
import HomologarModal from './Homologacion/HomologarModal.vue'
import { useHomologacion, type NuevoClienteForm, type Sugerencia } from './Homologacion/useHomologacion'

const h = useHomologacion()

const expandido = ref<string | null>(null)
const modalGrupo = ref<PendienteGrupo | null>(null)
const sugerenciaInicial = ref<Sugerencia | null>(null)

function abrir(grupo: PendienteGrupo, sugerencia?: Sugerencia) {
  sugerenciaInicial.value = sugerencia ?? null
  modalGrupo.value = grupo
}

async function onSubmit(target: { masterClienteId: string } | { nuevoCliente: NuevoClienteForm }) {
  if (!modalGrupo.value) return
  if (await h.homologar(modalGrupo.value.nombre, target)) modalGrupo.value = null
}

onMounted(h.cargar)
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
      <button type="button" class="btn ghost" :disabled="h.loading.value" @click="h.cargar">
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': h.loading.value }" aria-hidden="true" /> Actualizar
      </button>
    </header>

    <section class="stats">
      <article class="stat" :class="{ 'is-alert': h.totalPendientes.value > 0 }">
        <span>Paquetes sin cliente</span>
        <strong>{{ h.totalPendientes.value.toLocaleString('es-EC') }}</strong>
        <small>No se pueden facturar ni entregar</small>
      </article>
      <article class="stat">
        <span>Clientes registrados</span>
        <strong>{{ h.totalClientes.value.toLocaleString('es-EC') }}</strong>
        <small>Casilleros únicos</small>
      </article>
      <article class="stat">
        <span>Nombres por resolver</span>
        <strong>{{ h.grupos.value.length }}</strong>
        <small>Mostrando los de mayor volumen</small>
      </article>
    </section>

    <div v-if="h.loading.value" aria-busy="true">
      <AppSkeleton variant="card" height="92px" :count="6" gap="0.75rem" />
    </div>

    <p v-else-if="!h.grupos.value.length" class="empty">
      <i class="fa-solid fa-circle-check" aria-hidden="true" />
      Todo homologado. No hay paquetes sin cliente.
    </p>

    <ul v-else class="grupos">
      <HomologacionGrupo
        v-for="g in h.grupos.value"
        :key="g.nombre"
        :grupo="g"
        :expandido="expandido === g.nombre"
        @toggle="expandido = expandido === g.nombre ? null : g.nombre"
        @homologar="(s) => abrir(g, s)"
      />
    </ul>

    <HomologarModal
      :grupo="modalGrupo"
      :guardando="h.guardando.value"
      :sugerencia-inicial="sugerenciaInicial"
      @close="modalGrupo = null"
      @submit="onSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './Homologacion/homologacion-ui' as ui;

@include ui.buttons;

.homol {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;

  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 62ch; }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: $space-3;
}

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

.grupos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

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
</style>
