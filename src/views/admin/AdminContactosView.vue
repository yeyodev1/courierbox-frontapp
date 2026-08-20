<script setup lang="ts">
/** Client directory: search a contact and review its order history. */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import ContactoDetalle from './Contactos/ContactoDetalle.vue'
import { formatMoney, useContactos } from './Contactos/useContactos'

const router = useRouter()
const c = useContactos()

onMounted(c.load)
</script>

<template>
  <div class="contactos-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Contactos</h1>
        <p class="page-subtitle">Busca clientes, revisa sus órdenes y el historial de gestión</p>
      </div>
      <div class="search-bar">
        <i class="fa-solid fa-search" />
        <input
          v-model="c.searchQuery.value"
          class="search-input"
          placeholder="Buscar por nombre, email o teléfono..."
          @keyup.enter="c.load"
        />
        <button class="btn-search" @click="c.load">Buscar</button>
      </div>
    </div>

    <div v-if="c.loading.value" class="loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="card" height="76px" :count="6" gap="0.75rem" />
    </div>

    <div v-else-if="!c.contactos.value.length" class="empty">
      <i class="fa-solid fa-address-book" />
      <p>No se encontraron contactos</p>
    </div>

    <div v-else class="contactos-layout">
      <div class="contactos-list">
        <div class="contactos-count">
          {{ c.total.value }} contacto{{ c.total.value !== 1 ? 's' : '' }}
        </div>
        <div
          v-for="contacto in c.contactos.value"
          :key="contacto._id"
          class="contacto-card"
          :class="{ active: c.selected.value?.contacto.clientName === contacto.clientName }"
          @click="c.open(contacto)"
        >
          <div class="contacto-avatar">{{ contacto.clientName.charAt(0).toUpperCase() }}</div>
          <div class="contacto-info">
            <strong>{{ contacto.clientName }}</strong>
            <span v-if="contacto.clientEmail" class="contacto-email">{{ contacto.clientEmail }}</span>
            <span v-if="contacto.clientPhone" class="contacto-phone">{{ contacto.clientPhone }}</span>
          </div>
          <div class="contacto-meta">
            <span class="contacto-orders">{{ contacto.totalOrders }} órdenes</span>
            <span class="contacto-total">{{ formatMoney(contacto.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <ContactoDetalle
        :detalle="c.selected.value"
        :loading="c.loadingDetail.value"
        @close="c.selected.value = null"
        @open-order="router.push"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.contactos-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
}

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 $space-1; }
.page-subtitle { margin: 0; color: $ink-400; font-size: 0.9rem; }

.search-bar {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 12px;
  padding: $space-1 $space-3;

  > i { color: $ink-400; }
}

.search-input {
  min-width: 260px;
  background: transparent;
  border: none;
  padding: $space-2;
  color: $fg-dark;
  font-family: inherit;
  outline: none;
}

.btn-search {
  border: none;
  border-radius: 10px;
  padding: $space-2 $space-4;
  background: $brand-orange;
  color: $ink-1000;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

.loading,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;

  i { font-size: 1.5rem; }
}

.loading { flex-direction: column; align-items: stretch; padding: 0; }

.contactos-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: $space-4;
  min-height: 60vh;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.contactos-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.contactos-count {
  font-size: 0.8rem;
  color: $ink-400;
  padding: $space-1 0;
}

.contacto-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba($brand-orange, 0.2); background: rgba($brand-orange, 0.03); }
  &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.06); }
}

.contacto-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba($brand-orange, 0.15);
  color: $brand-orange;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.contacto-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;

  strong { font-size: 0.9rem; color: $fg-dark; }

  .contacto-email,
  .contacto-phone {
    font-size: 0.75rem;
    color: $ink-400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.contacto-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.contacto-orders { font-size: 0.75rem; color: $ink-400; }
.contacto-total { font-size: 0.85rem; color: $brand-orange; font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .contacto-card { transition: none; }
}
</style>
