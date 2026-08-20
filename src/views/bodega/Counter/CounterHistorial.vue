<script setup lang="ts">
/** Recent pickups, with the receipt PDF and the option to void one. */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { RetiroCounter } from '@/services/retiros_counter.api'
import { folio, formatDate } from './useCounter'

defineProps<{ historial: RetiroCounter[]; loading: boolean }>()
const emit = defineEmits<{ refrescar: []; anular: [retiro: RetiroCounter] }>()
</script>

<template>
  <section class="panel">
    <div class="panel__head">
      <h2>Retiros recientes</h2>
      <button type="button" class="link" @click="emit('refrescar')">Actualizar</button>
    </div>

    <div v-if="loading" aria-busy="true">
      <AppSkeleton variant="card" height="70px" :count="4" gap="0.6rem" />
    </div>

    <p v-else-if="!historial.length" class="empty">
      <i class="fa-solid fa-clock-rotate-left" aria-hidden="true" />
      Todavía no hay retiros registrados.
    </p>

    <ul v-else class="historial">
      <li v-for="r in historial" :key="r._id" :class="{ anulado: r.estado === 'anulado' }">
        <div class="historial__main">
          <strong>#{{ folio(r._id) }} · {{ r.clienteNombre }}</strong>
          <span>{{ r.totalPaquetes }} paquete(s) · {{ r.totalPesoLb.toFixed(2) }} lb · {{ formatDate(r.firmadoEn) }}</span>
          <span class="historial__by">Atendió {{ r.atendidoPorNombre || '—' }}</span>
        </div>
        <div class="historial__actions">
          <span v-if="r.estado === 'anulado'" class="tag danger">Anulado</span>
          <a v-if="r.comprobanteUrl" :href="r.comprobanteUrl" target="_blank" rel="noopener" class="link">
            <i class="fa-solid fa-file-pdf" aria-hidden="true" /> PDF
          </a>
          <button v-if="r.estado === 'firmado'" type="button" class="link danger" @click="emit('anular', r)">
            Anular
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './counter-ui' as ui;

@include ui.panel;
@include ui.link;
@include ui.empty;

.historial {
  @include ui.plain-list;

  li {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    border: 1px solid rgba($ink-500, 0.18);
    background: $ink-850;

    &.anulado { opacity: 0.6; }
  }
}

.historial__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span { font-size: 0.82rem; color: $ink-400; }
}

.historial__by { color: $ink-500 !important; }

.historial__actions {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.tag {
  padding: 2px $space-2;
  border-radius: $radius-pill;
  font-size: 0.72rem;

  &.danger { background: rgba($signal-red, 0.15); color: #ff8a8f; }
}
</style>
