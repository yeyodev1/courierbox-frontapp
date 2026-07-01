<script setup lang="ts">
defineEmits<{
  (e: 'create'): void
}>()
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Costos y Gastos</h1>
      <p class="page-subtitle">Registra costos operacionales, logísticos y de envío</p>
    </div>
    <button class="btn-primary" @click="$emit('create')">
      <i class="fa-solid fa-plus" /> Nuevo gasto
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (max-width: 640px) {
    gap: $space-2;

    > div {
      display: none;
    }

    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.page-subtitle {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.6rem 1.25rem;
  background: $brand-orange;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: darken($brand-orange, 8%); }
}
</style>
