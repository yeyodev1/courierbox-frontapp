<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from "vue";

const props = defineProps<{ images: string[] }>();
const active = ref<number | null>(null);

const open = (i: number) => { active.value = i; document.body.style.overflow = "hidden"; };
const close = () => { active.value = null; document.body.style.overflow = ""; };
const prev = () => { if (active.value == null) return; active.value = (active.value - 1 + props.images.length) % props.images.length; };
const next = () => { if (active.value == null) return; active.value = (active.value + 1) % props.images.length; };

const onKey = (e: KeyboardEvent) => {
  if (active.value == null) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowLeft") prev();
  if (e.key === "ArrowRight") next();
};
window.addEventListener("keydown", onKey);
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});

watch(active, (v) => { if (v == null) document.body.style.overflow = ""; });
</script>

<template>
  <div v-if="images.length" class="gallery">
    <div class="gallery__grid">
      <button
        v-for="(src, i) in images"
        :key="src"
        type="button"
        class="gallery__thumb"
        :style="{ animationDelay: `${i * 80}ms` }"
        @click="open(i)"
      >
        <img :src="src" :alt="`Foto ${i + 1}`" loading="lazy" />
        <span class="gallery__zoom" aria-hidden="true">↗</span>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="lb">
        <div
          v-if="active != null"
          class="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de fotos"
          @click.self="close"
        >
          <button class="lightbox__close" type="button" aria-label="Cerrar" @click="close">×</button>
          <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Anterior" @click="prev">‹</button>
          <img :src="images[active]" :alt="`Foto ${active + 1} de ${images.length}`" />
          <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Siguiente" @click="next">›</button>
          <span class="lightbox__count">{{ active + 1 }} / {{ images.length }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;

.gallery {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
    @include md { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  }

  &__thumb {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: var(--surface);
    cursor: pointer;
    padding: 0;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
    animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &:hover {
      border-color: $brand-orange;
      img { transform: scale(1.05); }
      .gallery__zoom { opacity: 1; transform: scale(1); }
    }
  }

  &__zoom {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: $brand-orange;
    color: $ink-1000;
    display: grid;
    place-items: center;
    font-weight: 700;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s ease;
  }
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba($ink-1000, 0.96);
  backdrop-filter: blur(20px);
  display: grid;
  place-items: center;
  padding: 4rem 2rem;

  img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  }

  &__close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgba($ink-100, 0.06);
    color: var(--fg);
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover { background: $brand-orange; color: $ink-1000; transform: rotate(90deg); }
  }

  &__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 56px;
    height: 56px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgba($ink-100, 0.06);
    color: var(--fg);
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease;
    &--prev { left: 1.5rem; }
    &--next { right: 1.5rem; }
    &:hover { background: $brand-orange; color: $ink-1000; }
  }

  &__count {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: "JetBrains Mono", monospace;
    font-size: 0.85rem;
    color: var(--fg-muted);
    letter-spacing: 0.18em;
  }
}

.lb-enter-active, .lb-leave-active { transition: opacity 0.3s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .gallery__thumb, .lb-enter-active, .lb-leave-active { animation: none; transition: none; }
}
</style>
