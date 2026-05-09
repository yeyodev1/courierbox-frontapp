<script setup lang="ts">
defineProps<{ message?: string; codigo?: string }>();
</script>

<template>
  <div class="empty">
    <div class="empty__icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="56" height="56">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#F08A1F" stroke-width="1.5" stroke-dasharray="3 4" />
        <path d="M22 32 L42 32 M32 22 L32 42" stroke="#F08A1F" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>
    <h3 class="empty__title">{{ message ?? "Aún no encontramos esta guía" }}</h3>
    <p class="empty__body">
      <template v-if="codigo">
        Verifica que <code>{{ codigo }}</code> esté escrito tal como lo recibiste.
      </template>
      <template v-else>
        Ingresa tu número de guía arriba para ver el estado en tiempo real.
      </template>
    </p>
  </div>
</template>

<style scoped lang="scss">
.empty {
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: 24px;
  background: var(--surface-2);

  &__title { font-size: 1.25rem; color: var(--fg); }
  &__body {
    color: var(--fg-muted);
    max-width: 40ch;
    code {
      font-family: "JetBrains Mono", monospace;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.05rem 0.35rem;
      border-radius: 4px;
    }
  }
}
</style>
