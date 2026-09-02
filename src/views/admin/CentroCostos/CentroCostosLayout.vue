<script setup lang="ts">
/**
 * Cost Centre: the master module that separates what the business spends from
 * what the warehouse receives. Expenses and receptions used to be filed on one
 * screen through one form, so pounds received and money spent sat in the same
 * list. Three tabs, three forms, three sets of totals.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

/**
 * Taken from the route rather than the role: the module is mounted under `/admin`,
 * and a base guessed from the signed-in role would point a superadmin's tabs at
 * `/superadmin/centro-costos`, which does not exist.
 */
const base = computed(() => route.path.split('/centro-costos')[0] + '/centro-costos')

const tabs = computed(() => [
  {
    to: `${base.value}/gastos-generales`,
    label: 'Gastos Generales',
    icon: 'fa-solid fa-building-columns',
    hint: 'Renta, sueldos, insumos y todo lo que no es carga ni envío',
  },
  {
    to: `${base.value}/gastos-envios`,
    label: 'Gastos por Envíos',
    icon: 'fa-solid fa-truck-fast',
    hint: 'Transporte, combustible y devoluciones de última milla',
  },
  {
    to: `${base.value}/recepciones`,
    label: 'Ingreso de Recepciones',
    icon: 'fa-solid fa-weight-hanging',
    hint: 'Las libras que entran y lo que pagas por cada una',
  },
])

const activeTab = computed(() => tabs.value.find((tab) => route.path.startsWith(tab.to)))
</script>

<template>
  <div class="centro-costos">
    <header class="cc-header">
      <div>
        <h1 class="cc-title">Centro de Costos</h1>
        <p class="cc-sub">{{ activeTab?.hint || 'Gastos, envíos y recepciones, cada uno por su lado' }}</p>
      </div>
    </header>

    <nav class="cc-tabs" aria-label="Secciones del centro de costos">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="cc-tab"
        :class="{ active: route.path.startsWith(tab.to) }"
      >
        <i :class="tab.icon" aria-hidden="true" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.centro-costos {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  @media (max-width: 640px) {
    gap: $space-3;
  }
}

.cc-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.cc-sub {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.cc-tabs {
  display: flex;
  gap: $space-2;
  border-bottom: 1px solid rgba($ink-500, 0.16);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.cc-tab {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.7rem 1.1rem;
  white-space: nowrap;
  color: $ink-400;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  border-radius: 10px 10px 0 0;
  transition: color 160ms ease, border-color 160ms ease, background 160ms ease;

  &:hover {
    color: $ink-100;
    background: rgba($ink-500, 0.08);
  }

  &.active {
    color: $brand-orange;
    border-bottom-color: $brand-orange;
  }

  i {
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    padding: 0.6rem 0.8rem;
    font-size: 0.82rem;

    span {
      display: none;
    }

    i {
      font-size: 1rem;
    }
  }
}
</style>
