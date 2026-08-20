<script setup lang="ts">
/** Search available packages and pick the ones the client is taking today. */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { PaqueteDisponible } from '@/services/retiros_counter.api'

defineProps<{
  searching: boolean
  searched: boolean
  disponibles: PaqueteDisponible[]
  selectedIds: Set<string>
}>()

const query = defineModel<string>('query', { required: true })

const emit = defineEmits<{ toggle: [id: string]; 'select-all': []; clear: [] }>()
</script>

<template>
  <section class="panel">
    <div class="search">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
      <input
        v-model="query"
        type="search"
        placeholder="Busca por casillero, WR, tracking o nombre del cliente…"
        aria-label="Buscar paquetes disponibles"
      />
      <span v-if="searching" class="search__spin"><i class="fa-solid fa-circle-notch fa-spin" /></span>
    </div>

    <div v-if="searching" class="results" aria-busy="true">
      <AppSkeleton variant="card" height="64px" :count="4" gap="0.6rem" />
    </div>

    <p v-else-if="searched && !disponibles.length" class="empty">
      <i class="fa-solid fa-box-open" aria-hidden="true" />
      No hay paquetes disponibles para retiro con ese criterio.
    </p>

    <template v-else-if="disponibles.length">
      <div class="results-head">
        <span>{{ disponibles.length }} paquete(s) disponible(s)</span>
        <div>
          <button type="button" class="link" @click="emit('select-all')">Seleccionar todos</button>
          <button type="button" class="link" @click="emit('clear')">Limpiar</button>
        </div>
      </div>

      <ul class="results">
        <li v-for="p in disponibles" :key="p._id">
          <label class="pkg" :class="{ selected: selectedIds.has(p._id) }">
            <input type="checkbox" :checked="selectedIds.has(p._id)" @change="emit('toggle', p._id)" />
            <span class="pkg__body">
              <strong>{{ p.wr || p.sh || p.trackingOriginal }}</strong>
              <span class="pkg__desc">{{ p.contenido || 'Sin descripción' }}</span>
              <span class="pkg__meta">
                {{ p.masterClienteId?.nombre || p.consigneeLimpio || p.consigneeNombre }}
                <template v-if="p.masterClienteId?.codigoCasillero"> · {{ p.masterClienteId.codigoCasillero }}</template>
              </span>
            </span>
            <span class="pkg__peso">{{ (Number(p.pesoLb) || 0).toFixed(2) }} lb</span>
          </label>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use './counter-ui' as ui;

@include ui.panel;
@include ui.link;
@include ui.empty;

.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.25);
  background: $ink-850;

  > i { color: $ink-400; }

  input {
    flex: 1;
    min-height: 48px;
    border: none;
    background: transparent;
    color: $fg-dark;
    font: inherit;
    outline: none;
  }

  &:focus-within { border-color: rgba($brand-orange, 0.5); }
}

.search__spin { color: $brand-orange; }

.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: $ink-400;

  div { display: flex; gap: $space-3; }
}

.results { @include ui.plain-list; }

.pkg {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.2);
  background: $ink-850;
  cursor: pointer;
  transition: border-color $dur-fast ease, background $dur-fast ease;

  &:hover { border-color: rgba($brand-orange, 0.35); }

  &.selected {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.08);
  }

  input {
    width: 20px;
    height: 20px;
    accent-color: $brand-orange;
    flex: 0 0 auto;
  }
}

.pkg__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pkg__desc,
.pkg__meta {
  font-size: 0.8rem;
  color: $ink-400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pkg__peso {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  color: $ink-300;
  font-size: 0.85rem;
}
</style>
