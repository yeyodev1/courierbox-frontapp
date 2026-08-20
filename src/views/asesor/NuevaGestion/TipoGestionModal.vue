<script setup lang="ts">
/** Step 1: is the sale a full purchase on the client's behalf, or courier only? */
import AppOverlay from '@/components/ui/AppOverlay.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; select: [type: 'logistica' | 'compra_total'] }>()

const CHOICES = [
  {
    type: 'compra_total' as const,
    icon: 'fa-solid fa-cart-shopping',
    title: 'Compra total',
    desc: 'Nosotros compramos por el cliente y luego gestionamos el envío.',
    tag: 'Hay monto + foto/comprobante',
  },
  {
    type: 'logistica' as const,
    icon: 'fa-solid fa-truck-fast',
    title: 'Solo courier',
    desc: 'El cliente ya compró y solo manejamos el traslado.',
    tag: 'Ya está comprado',
  },
]
</script>

<template>
  <AppOverlay :open="open" label="Elige el tipo de gestión" @close="emit('close')">
    <div class="card type-modal">
      <div class="tm-head">
        <div>
          <span class="eyebrow"><i class="fa-solid fa-compass" aria-hidden="true" /> Paso 1</span>
          <h2>Elige el tipo de gestión</h2>
        </div>
        <button class="tm-close" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div class="service-list">
        <button v-for="c in CHOICES" :key="c.type" class="service-choice" @click="emit('select', c.type)">
          <span class="service-choice__icon"><i :class="c.icon" aria-hidden="true" /></span>
          <span class="service-choice__body">
            <span class="service-choice__title">{{ c.title }}</span>
            <span class="service-choice__desc">{{ c.desc }}</span>
            <span class="service-choice__tag">{{ c.tag }}</span>
          </span>
          <i class="fa-solid fa-chevron-right service-choice__arrow" aria-hidden="true" />
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.type-modal {
  width: min(560px, 100%);
  background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.18);
  border-radius: 24px;
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-5;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.tm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;

  h2 { margin: 0; font-size: 1.4rem; color: $fg-dark; }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: $brand-orange;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.tm-close {
  background: transparent;
  border: 1px solid rgba($brand-orange, 0.25);
  color: $brand-orange;
  border-radius: 12px;
  padding: $space-2 $space-3;
  cursor: pointer;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.service-choice {
  display: flex;
  align-items: center;
  gap: $space-4;
  text-align: left;
  padding: $space-4 $space-5;
  border-radius: 18px;
  border: 2px solid $ink-500;
  background: $ink-900;
  color: $fg-dark;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.16s;

  &:hover { border-color: $brand-orange; transform: translateY(-1px); }

  &__icon {
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  &__body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  &__title { font-weight: 800; font-size: 1rem; }
  &__desc { color: $ink-300; font-size: 0.85rem; line-height: 1.45; }

  &__tag {
    align-self: flex-start;
    margin-top: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: $brand-orange;
    background: rgba($brand-orange, 0.12);
    border-radius: 999px;
    padding: 3px 10px;
  }

  &__arrow { color: $ink-400; }
}

@media (prefers-reduced-motion: reduce) {
  .service-choice { transition: none; }
  .service-choice:hover { transform: none; }
}
</style>
