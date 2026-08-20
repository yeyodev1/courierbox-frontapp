<script setup lang="ts">
/** Purchases the warehouse is waiting on, and the reception that notifies the client. */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { GestionCompra } from '@/services/gestiones_compra.api'
import RecibirModal from './Compras/RecibirModal.vue'
import ConfirmarRecepcionModal from './Compras/ConfirmarRecepcionModal.vue'
import {
  RANGE_PRESETS,
  asesorNombre,
  clienteEmail,
  clienteNombre,
  formatDate,
  isRecibido,
  money,
  useCompras,
} from './Compras/useCompras'
import { useRecepcion } from './Compras/useRecepcion'

const router = useRouter()
const c = useCompras()
const r = useRecepcion(c.load)

const confirmAsk = ref(false)

function onValidate() {
  if (r.validate()) confirmAsk.value = true
}

async function onConfirmar() {
  const ok = await r.confirmar()
  confirmAsk.value = false
  return ok
}

onMounted(c.load)
</script>

<template>
  <div class="bodega-compras">
    <header class="head">
      <div>
        <h1>Compras</h1>
        <p>
          Marca cuando el producto llegue a bodega: sube una foto y el cliente recibe el aviso de
          que ya lo tenemos.
        </p>
      </div>
    </header>

    <section class="filters">
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input v-model="c.q.value" placeholder="Buscar cliente o tienda..." />
      </div>

      <div class="presets">
        <button
          v-for="p in RANGE_PRESETS"
          :key="p.key"
          :class="{ active: c.rangePreset.value === p.key }"
          @click="c.setPreset(p.key)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="range">
        <label>Desde <input v-model="c.desde.value" type="date" @change="c.rangePreset.value = 'custom'" /></label>
        <label>Hasta <input v-model="c.hasta.value" type="date" @change="c.rangePreset.value = 'custom'" /></label>
      </div>

      <div class="estado-filter">
        <button :class="{ active: c.estadoFiltro.value === 'todos' }" @click="c.estadoFiltro.value = 'todos'">Todos</button>
        <button :class="{ active: c.estadoFiltro.value === 'por_recibir' }" @click="c.estadoFiltro.value = 'por_recibir'">Por recibir</button>
        <button :class="{ active: c.estadoFiltro.value === 'en_bodega' }" @click="c.estadoFiltro.value = 'en_bodega'">En bodega</button>
      </div>
    </section>

    <div v-if="c.loading.value" class="skeletons">
      <div v-for="i in 4" :key="i" class="sk" />
    </div>

    <p v-else-if="!c.filtered.value.length" class="empty">No hay compras que coincidan con el filtro.</p>

    <div v-else class="grid">
      <article v-for="g in c.filtered.value" :key="g._id" class="card" :class="{ recibido: isRecibido(g) }">
        <div class="card-head">
          <strong>{{ clienteNombre(g) }}</strong>
          <span class="badge" :class="isRecibido(g) ? 'ok' : 'wait'">
            <i class="fa-solid" :class="isRecibido(g) ? 'fa-circle-check' : 'fa-clock'" />
            {{ isRecibido(g) ? 'En bodega' : 'Por recibir' }}
          </span>
        </div>

        <p class="tienda">{{ g.paginaCompra || '—' }}</p>

        <div class="card-foot">
          <span>{{ asesorNombre(g) }} · {{ formatDate(g.createdAt) }}</span>
          <span class="valor">${{ money(g.valorTotal) }}</span>
        </div>

        <div class="card-actions">
          <button class="btn ghost sm" @click="router.push(`/bodega/compras/${g._id}`)">
            <i class="fa-solid fa-eye" /> Ver / vista previa
          </button>
          <button v-if="!isRecibido(g)" class="btn primary sm" @click="r.open(g as GestionCompra)">
            <i class="fa-solid fa-box-open" /> Marcar recibido
          </button>
          <span v-else class="recibido-note">
            <i class="fa-solid fa-envelope-circle-check" /> Cliente avisado
          </span>
        </div>
      </article>
    </div>

    <RecibirModal
      v-model:nota="r.nota.value"
      v-model:eta="r.eta.value"
      :gestion="r.gestion.value"
      :fotos="r.queue.items.value"
      :saving="r.saving.value"
      :error="r.error.value"
      @close="r.close"
      @add-files="r.addFiles"
      @remove-foto="r.queue.remove"
      @validate="onValidate"
    />

    <ConfirmarRecepcionModal
      :open="confirmAsk"
      :saving="r.saving.value"
      :email="clienteEmail(r.gestion.value)"
      :sending-msg="r.sendingMsg.value"
      :items="r.queue.items.value"
      :done="r.queue.doneCount.value"
      :failed="r.queue.failedCount.value"
      :pending="r.queue.pendingCount.value"
      :percent="r.queue.percent.value"
      @close="confirmAsk = false"
      @confirmar="onConfirmar"
      @retry="r.reintentar"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.bodega-compras {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head {
  h1 { margin: 0 0 4px; color: $fg-dark; font-size: 1.5rem; }
  p { margin: 0; color: $ink-300; max-width: 680px; }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  align-items: center;
}

.search {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex: 1 1 260px;
  padding: 0 $space-3;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.3);
  background: $ink-900;

  > i { color: $ink-400; }

  input {
    flex: 1;
    min-height: 42px;
    border: none;
    background: transparent;
    color: $fg-dark;
    font: inherit;
    outline: none;
  }
}

.presets,
.estado-filter {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;

  button {
    border: 1px solid rgba($ink-500, 0.35);
    background: transparent;
    color: $ink-300;
    border-radius: 999px;
    padding: 6px 14px;
    font-family: inherit;
    font-size: 0.82rem;
    cursor: pointer;

    &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.1); color: $brand-orange; }
  }
}

.range {
  display: flex;
  gap: $space-3;
  flex-wrap: wrap;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: $ink-400;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input {
    background: $ink-1000;
    border: 1px solid $ink-500;
    border-radius: 10px;
    color: $fg-dark;
    padding: 6px 10px;
    font-family: inherit;
    color-scheme: dark;
  }
}

.grid,
.skeletons {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.card {
  flex: 1 1 300px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  border-radius: 16px;
  border: 1px solid rgba($ink-500, 0.2);
  background: $ink-900;

  &.recibido { border-color: rgba($signal-green, 0.28); }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;

  strong { color: $fg-dark; }
}

.tienda { margin: 0; color: $ink-300; font-size: 0.85rem; word-break: break-word; }

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $ink-400;
  font-size: 0.8rem;
}

.valor { color: $brand-orange; font-weight: 800; }

.card-actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
  border-top: 1px solid $ink-700;
  padding-top: $space-3;
  margin-top: $space-1;
}

.recibido-note {
  color: $signal-green;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;

  &.ok { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.wait { background: rgba($brand-orange, 0.14); color: $brand-orange; }
}

.empty { color: $ink-400; text-align: center; padding: $space-6 0; }

.sk {
  flex: 1 1 300px;
  max-width: 420px;
  height: 150px;
  border-radius: 16px;
  background: $ink-800;
  animation: pulse 1.4s infinite;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: $space-2 $space-3;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid transparent;

  &.sm { font-size: 0.82rem; }
  &.primary { background: $brand-orange; color: $ink-1000; }
  &.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }
}

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>
