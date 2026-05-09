<script setup lang="ts">
import type { TrackingEvento } from "@/services/tracking";

defineProps<{ eventos: TrackingEvento[] }>();

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
</script>

<template>
  <ol class="timeline">
    <li
      v-for="(e, i) in eventos"
      :key="i"
      :class="['timeline__item', { 'timeline__item--latest': i === 0 }]"
    >
      <span class="timeline__dot" aria-hidden="true" />
      <div class="timeline__content">
        <time class="timeline__date">{{ fmtDate(e.fecha) }}</time>
        <p class="timeline__desc">{{ e.descripcion }}</p>
        <p v-if="e.ubicacion" class="timeline__loc">{{ e.ubicacion }}</p>
      </div>
    </li>
    <li v-if="!eventos.length" class="timeline__empty">
      Sin eventos registrados todavía. Vuelve a consultar en unos minutos.
    </li>
  </ol>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;

.timeline {
  position: relative;
  padding-left: 1.5rem;

  &::before {
    content: "";
    position: absolute;
    left: 0.5rem;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 1px;
    background: linear-gradient($brand-orange, transparent);
    opacity: 0.5;
  }

  &__item {
    position: relative;
    padding-block: 1rem;
    border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: 0; }
  }

  &__dot {
    position: absolute;
    left: -1.5rem;
    top: 1.4rem;
    width: 13px; height: 13px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 2px solid $brand-orange;
  }

  &__item--latest .timeline__dot {
    background: $brand-orange;
    box-shadow: 0 0 0 4px rgba($brand-orange, 0.18);
  }

  &__date {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--fg-faint);
  }

  &__desc {
    margin-top: 0.25rem;
    color: var(--fg);
    line-height: 1.5;
  }
  &__loc {
    margin-top: 0.25rem;
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
  &__empty {
    color: var(--fg-muted);
    padding: 2rem 0;
    text-align: center;
  }
}
</style>
