<script setup lang="ts">
import { computed } from "vue";
import type { TrackingEvento } from "@/services/tracking";
import { sanitizeText } from "@/utils/sanitizeTracking";

const props = defineProps<{ eventos: TrackingEvento[] }>();

function tsOf(e: TrackingEvento): number {
  if (e.fecha) {
    const t = Date.parse(e.fecha);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

const sorted = computed(() => {
  const copy = [...props.eventos];
  copy.sort((a, b) => tsOf(b) - tsOf(a));
  return copy;
});

function fmt(e: TrackingEvento): { date: string; time: string | null } {
  if (e.fecha) {
    const d = new Date(e.fecha);
    if (!Number.isNaN(d.getTime())) {
      return {
        date: d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
      };
    }
  }
  return { date: e.fechaTexto || "—", time: null };
}

function cleanDescripcion(e: TrackingEvento): string {
  const accion = sanitizeText(e.accion ?? "", "") ?? "";
  const desc = sanitizeText(e.descripcion ?? "", "") ?? "";
  if (accion && desc.startsWith(accion)) {
    const tail = desc.slice(accion.length).replace(/^\s*[—-]\s*/, "").trim();
    if (!tail || tail === accion) return accion;
    return `${accion} — ${tail}`;
  }
  return desc || accion || "Actualización registrada";
}
</script>

<template>
  <ol class="timeline">
    <li
      v-for="(e, i) in sorted"
      :key="i"
      :class="['t-item', { 't-item--latest': i === 0 }]"
    >
      <div class="t-item__date">
        <span class="t-item__date-day">{{ fmt(e).date }}</span>
        <span v-if="fmt(e).time" class="t-item__date-time">{{ fmt(e).time }}</span>
      </div>

      <div class="t-item__rail" aria-hidden="true">
        <span class="t-item__dot" />
      </div>

      <div class="t-item__content">
        <p class="t-item__action">{{ cleanDescripcion(e) }}</p>
        <p v-if="e.ubicacion" class="t-item__user">
          <span class="t-item__user-tag">por</span>
          <span class="t-item__user-name">{{ e.ubicacion }}</span>
        </p>
      </div>
    </li>

    <li v-if="!sorted.length" class="t-empty">
      Sin eventos registrados todavía.
    </li>
  </ol>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0;
}

.t-item {
  display: grid;
  grid-template-columns: 110px 24px 1fr;
  gap: 1rem;
  padding-block: 1.1rem;
  border-bottom: 1px solid var(--border);
  align-items: start;

  @include md {
    grid-template-columns: 160px 24px 1fr;
    gap: 1.5rem;
  }

  &:last-child { border-bottom: 0; }

  &__date {
    display: grid;
    gap: 0.15rem;
    padding-top: 0.25rem;
  }

  &__date-day {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.78rem;
    color: var(--fg);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__date-time {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    color: var(--fg-faint);
    letter-spacing: 0.06em;
  }

  &__rail {
    position: relative;
    width: 24px;
    align-self: stretch;
    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 0;
      bottom: -1.1rem;
      width: 1px;
      background: linear-gradient(180deg, rgba($brand-orange, 0.5), rgba($ink-100, 0.06));
      transform: translateX(-50%);
    }
  }

  &:last-child .t-item__rail::before { background: rgba($ink-100, 0.06); }

  &__dot {
    position: absolute;
    top: 0.65rem;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 2px solid rgba($brand-orange, 0.5);
    z-index: 1;
  }

  &--latest .t-item__dot {
    background: $brand-orange;
    border-color: $brand-orange;
    box-shadow: 0 0 0 4px rgba($brand-orange, 0.18), 0 0 22px rgba($brand-orange, 0.5);
    animation: dotPulse 2.4s ease-in-out infinite;
  }

  &--latest .t-item__action {
    color: var(--fg);
    font-weight: 500;
  }

  &__content {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
  }

  &__action {
    color: var(--fg-muted);
    line-height: 1.5;
    word-wrap: break-word;
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--fg-faint);
  }

  &__user-tag { letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.7rem; }
  &__user-name {
    font-family: "JetBrains Mono", monospace;
    color: var(--fg-muted);
    text-transform: lowercase;
    border: 1px solid var(--border);
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
  }
}

.t-empty {
  color: var(--fg-muted);
  padding: 2.5rem 0;
  text-align: center;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(#F08A1F, 0.18), 0 0 22px rgba(#F08A1F, 0.5); }
  50%      { box-shadow: 0 0 0 7px rgba(#F08A1F, 0.10), 0 0 30px rgba(#F08A1F, 0.65); }
}

@media (prefers-reduced-motion: reduce) {
  .t-item--latest .t-item__dot { animation: none; }
}
</style>
