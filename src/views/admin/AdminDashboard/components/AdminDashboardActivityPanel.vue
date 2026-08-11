<script setup lang="ts">
import DashboardPanelShell from './DashboardPanelShell.vue'
import { formatCount } from '@/utils/format'

/**
 * A bar is only drawn when `of` gives it a denominator, because a bar's whole
 * point is "this part of that whole". The panel used to divide every metric by
 * the sum of all of them, which put users, packages and invoices on one scale
 * they never shared — packages took 99% of the width and everything else
 * collapsed into an identical stub. Counts without a whole are shown as plain
 * figures instead.
 */
export interface OperationalStat {
  label: string
  /** null means the request failed — rendered as "—", never as a real zero. */
  value: number | null
  /** The whole this value is part of. Omit when there isn't one. */
  of?: number
  hint: string
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal'
  /** Marks a backlog that needs someone to act, not just a number to read. */
  alert?: boolean
  route?: string
}

const props = defineProps<{ stats: OperationalStat[] }>()
const emit = defineEmits<{ navigate: [route: string] }>()

function ratio(stat: OperationalStat): number | null {
  if (stat.value === null || !stat.of) return null
  return Math.min(100, Math.round((stat.value / stat.of) * 100))
}

const figure = formatCount

function activate(stat: OperationalStat) {
  if (stat.route) emit('navigate', stat.route)
}
</script>

<template>
  <DashboardPanelShell
    title="Estado operativo"
    subtitle="Qué está pendiente ahora"
    ariaLabel="Estado operativo"
    :main="true"
  >
    <ul class="stat-list">
      <li
        v-for="stat in props.stats"
        :key="stat.label"
        class="stat-row"
        :class="{ 'is-alert': stat.alert, 'is-missing': stat.value === null, clickable: !!stat.route }"
        :tabindex="stat.route ? 0 : undefined"
        :role="stat.route ? 'link' : undefined"
        @click="activate(stat)"
        @keydown.enter="activate(stat)"
        @keydown.space.prevent="activate(stat)"
      >
        <div class="stat-head">
          <span class="stat-label">
            <i v-if="stat.alert" class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            {{ stat.label }}
          </span>
          <span class="stat-figure">
            <strong>{{ figure(stat.value) }}</strong>
            <small v-if="stat.of !== undefined && stat.value !== null">
              de {{ formatCount(stat.of) }}
            </small>
          </span>
        </div>

        <div v-if="ratio(stat) !== null" class="track" :aria-hidden="true">
          <div class="bar" :class="stat.tone" :style="{ width: `${Math.max(2, ratio(stat)!)}%` }" />
        </div>

        <p class="stat-hint">
          <span v-if="stat.value === null">No se pudo cargar este dato</span>
          <span v-else-if="ratio(stat) !== null">{{ ratio(stat) }}% · {{ stat.hint }}</span>
          <span v-else>{{ stat.hint }}</span>
          <i v-if="stat.route" class="fa-solid fa-arrow-right go" aria-hidden="true" />
        </p>
      </li>
    </ul>
  </DashboardPanelShell>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.stat-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;

  &.clickable {
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: rgba($ink-500, 0.08);
      border-color: rgba($ink-500, 0.16);
    }

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 2px;
    }
  }

  // A backlog that needs someone to act reads differently from a number that is
  // merely large.
  &.is-alert {
    background: rgba($brand-orange, 0.07);
    border-color: rgba($brand-orange, 0.22);

    .stat-label i { color: $brand-orange; }
    .stat-figure strong { color: $brand-orange; }
  }

  &.is-missing .stat-figure strong { color: $ink-500; }
}

.stat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-3;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 0;
}

.stat-figure {
  display: flex;
  align-items: baseline;
  gap: $space-2;
  white-space: nowrap;

  strong {
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums; // figures line up down the column
  }

  small {
    font-size: 0.78rem;
    color: $ink-400;
    font-variant-numeric: tabular-nums;
  }
}

.track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba($ink-700, 0.75);
}

.bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &.purple { background: linear-gradient(90deg, rgba(#6db6ff, 0.65), #6db6ff); }
  &.orange { background: linear-gradient(90deg, rgba($brand-orange, 0.55), $brand-orange); }
  &.green  { background: linear-gradient(90deg, rgba($signal-green, 0.55), $signal-green); }
  &.blue   { background: linear-gradient(90deg, rgba(#60a5fa, 0.55), #60a5fa); }
  &.teal   { background: linear-gradient(90deg, rgba(#5eead4, 0.55), #5eead4); }
}

.stat-hint {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  font-size: 0.78rem;
  color: $ink-400;

  .go { font-size: 0.7rem; }
}

@media (prefers-reduced-motion: reduce) {
  .bar { transition: none; }
}
</style>
