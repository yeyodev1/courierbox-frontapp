<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useTrackingStore } from "@/stores/tracking";

import TrackingForm from "@/components/tracking/TrackingForm.vue";
import TrackingResultCard from "@/components/tracking/TrackingResultCard.vue";
import TrackingEmpty from "@/components/tracking/TrackingEmpty.vue";

const route = useRoute();
const router = useRouter();
const store = useTrackingStore();
const { data, loading, error, codigo, history } = storeToRefs(store);

function go(c: string) {
  const next = c.trim().toUpperCase();
  if (!next) return;
  if (route.params.codigo === next) {
    store.lookup(next);
  } else {
    router.push({ name: "TrackingDetail", params: { codigo: next } });
  }
}

function loadFromRoute() {
  const param = route.params.codigo;
  if (typeof param === "string" && param.length > 0) {
    codigo.value = param;
    store.lookup(param);
  }
}

onMounted(loadFromRoute);
watch(() => route.params.codigo, loadFromRoute);
</script>

<template>
  <main class="tracking-view">
    <div class="container tracking-view__inner">
      <header class="tracking-view__head" data-reveal-group>
        <span class="eyebrow" data-reveal>Rastreo</span>
        <h1 class="tracking-view__title" data-reveal>
          ¿Dónde está <em>tu paquete</em>?
        </h1>
        <p class="tracking-view__lead" data-reveal>
          Ingresa el número de guía. Lo consultamos en vivo en nuestro sistema.
        </p>
      </header>

      <TrackingForm v-model="codigo" :loading="loading" @submit="go" />

      <div v-if="history.length" class="tracking-view__history">
        <span>Recientes:</span>
        <button
          v-for="c in history"
          :key="c"
          type="button"
          class="chip"
          @click="go(c)"
        >
          {{ c }}
        </button>
      </div>

      <div class="tracking-view__body">
        <div v-if="loading" class="tracking-view__loading" aria-live="polite">
          <span class="bar" /> Consultando tu envío…
        </div>

        <TrackingEmpty
          v-else-if="error"
          :message="error"
          :codigo="codigo"
        />

        <TrackingResultCard
          v-else-if="data"
          :data="data"
        />

        <TrackingEmpty
          v-else
        />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.tracking-view {
  padding-top: clamp(7rem, 12vw, 10rem);
  padding-bottom: clamp(4rem, 8vw, 8rem);
  background:
    radial-gradient(60% 50% at 0% 0%, rgba($brand-orange, 0.12), transparent 60%),
    $ink-1000;
  min-height: 100vh;

  &__inner {
    display: grid;
    gap: 1.5rem;
    max-width: 920px;
  }

  &__head {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }

  &__lead { color: var(--fg-muted); max-width: 50ch; }

  &__history {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    color: var(--fg-faint);
    font-size: 0.85rem;
    .chip {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--fg-muted);
      background: var(--surface-2);
      transition: all 0.2s ease;
      &:hover { color: $brand-orange; border-color: $brand-orange; }
    }
  }

  &__loading {
    display: grid;
    place-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: var(--fg-muted);
    .bar {
      width: 100%;
      max-width: 320px;
      height: 3px;
      border-radius: 999px;
      background: rgba($ink-100, 0.08);
      position: relative;
      overflow: hidden;
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, $brand-orange, transparent);
        animation: slide 1.4s ease-in-out infinite;
      }
    }
  }

  &__body { margin-top: 1rem; }
}

@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
