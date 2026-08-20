<script setup lang="ts">
/** One unresolved manifest name, its likely matches and a sample of its packages. */
import type { PendienteGrupo } from '@/services/homologacion.api'
import { pct, type Sugerencia } from './useHomologacion'

defineProps<{ grupo: PendienteGrupo; expandido: boolean }>()

const emit = defineEmits<{
  toggle: []
  homologar: [sugerencia?: Sugerencia]
}>()
</script>

<template>
  <li class="grupo">
    <div class="grupo__main">
      <div class="grupo__id">
        <strong>{{ grupo.nombre }}</strong>
        <span>{{ grupo.totalPaquetes }} paquete(s) · {{ grupo.totalPesoLb.toFixed(2) }} lb</span>
      </div>

      <div class="grupo__sug">
        <template v-if="grupo.sugerencias.length">
          <button
            v-for="s in grupo.sugerencias.slice(0, 3)"
            :key="s.masterId"
            type="button"
            class="sug"
            :title="`Vincular a ${s.nombreOficial}`"
            @click="emit('homologar', s)"
          >
            <span class="sug__score">{{ pct(s.score) }}</span>
            <span class="sug__name">{{ s.nombreOficial }}</span>
          </button>
        </template>
        <span v-else class="sin-sug">Sin coincidencias</span>
      </div>

      <div class="grupo__actions">
        <button type="button" class="link" @click="emit('toggle')">
          {{ expandido ? 'Ocultar' : 'Ver paquetes' }}
        </button>
        <button type="button" class="btn primary sm" @click="emit('homologar')">Homologar</button>
      </div>
    </div>

    <div v-if="expandido" class="grupo__detalle">
      <p class="muestra-nota">
        Muestra de {{ grupo.paquetes.length }} de {{ grupo.totalPaquetes }} paquete(s).
        Al homologar se vinculan <strong>todos</strong>.
      </p>
      <table>
        <thead>
          <tr><th>WR</th><th>Casillero</th><th>Contenido</th><th class="num">Peso</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in grupo.paquetes" :key="p._id">
            <td class="mono">{{ p.wr }}</td>
            <td class="mono">{{ p.sh }}</td>
            <td>{{ p.contenido || '—' }}</td>
            <td class="num">{{ p.pesoLb.toFixed(2) }} lb</td>
          </tr>
        </tbody>
      </table>
    </div>
  </li>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './homologacion-ui' as ui;

@include ui.buttons;
@include ui.suggestion;

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

.grupo__sug {
  flex: 2 1 300px;
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

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

.sug__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sin-sug { color: $ink-500; font-size: 0.8rem; align-self: center; }

.grupo__actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: $space-3;
}

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
</style>
