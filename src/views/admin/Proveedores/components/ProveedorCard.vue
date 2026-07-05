<script setup lang="ts">
import type { Proveedor } from '@/services/proveedores.api'

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}

defineProps<{
  proveedor: Proveedor
  gastoMesActual?: number
  gastoHistorico?: number
}>()

defineEmits<{
  detail: [proveedor: Proveedor]
  edit: [proveedor: Proveedor]
  toggle: [proveedor: Proveedor]
  remove: [proveedor: Proveedor]
}>()
</script>

<template>
  <article class="provider-card">
    <div class="provider-top">
      <div>
        <h3>{{ proveedor.nombre }}</h3>
        <p>{{ proveedor.tipo || 'General' }} · {{ proveedor.pais || 'Sin país' }} · {{ proveedor.ciudad || 'Sin ciudad' }}</p>
      </div>
      <span class="status" :class="{ active: proveedor.activo }">{{ proveedor.activo ? 'Activo' : 'Inactivo' }}</span>
    </div>

    <div class="provider-meta">
      <div><span>Contacto</span><strong>{{ proveedor.contacto || '—' }}</strong></div>
      <div><span>Teléfono</span><strong>{{ proveedor.telefono || '—' }}</strong></div>
      <div><span>Email</span><strong>{{ proveedor.email || '—' }}</strong></div>
    </div>

    <p class="notes">{{ proveedor.notas || 'Sin notas' }}</p>

    <div class="cost-band">
      <div>
        <span>Este mes</span>
        <strong>{{ formatCurrency(gastoMesActual || 0) }}</strong>
      </div>
      <div>
        <span>Histórico</span>
        <strong>{{ formatCurrency(gastoHistorico || 0) }}</strong>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-ghost" type="button" @click="$emit('detail', proveedor)"><i class="fa-solid fa-coins" /> Ver costos</button>
      <button class="btn-ghost" type="button" @click="$emit('edit', proveedor)"><i class="fa-solid fa-pen" /> Editar</button>
      <button class="btn-ghost" type="button" @click="$emit('toggle', proveedor)">{{ proveedor.activo ? 'Desactivar' : 'Activar' }}</button>
      <button class="btn-danger" type="button" @click="$emit('remove', proveedor)"><i class="fa-solid fa-trash-can" /></button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.provider-card {
  background: linear-gradient(180deg, rgba($ink-900, 0.96), rgba($ink-900, 0.86));
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-5;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($brand-orange, 0.18);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
  }
}

.provider-top {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  align-items: flex-start;

  h3 {
    margin: 0 0 $space-1;
    font-size: 1.02rem;
  }

  p {
    margin: 0;
    color: $ink-400;
    font-size: 0.85rem;
  }
}

.status {
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: rgba($signal-red, 0.12);
  color: #ff8a8f;
  font-size: 0.75rem;
  font-weight: 700;

  &.active {
    background: rgba($signal-green, 0.12);
    color: $signal-green;
  }
}

.provider-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-3;
  margin: $space-4 0;

  span {
    color: $ink-400;
    font-size: 0.78rem;
  }

  strong {
    display: block;
    color: $fg-dark;
    font-size: 0.92rem;
    margin-top: 0.2rem;
    word-break: break-word;
  }
}

.notes {
  margin: 0 0 $space-4;
  min-height: 48px;
  color: $ink-300;
}

.cost-band {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  margin: 0 0 $space-4;
  padding: $space-3 $space-4;
  border-radius: 14px;
  background: rgba($ink-800, 0.55);
  border: 1px solid rgba($ink-500, 0.1);

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  span {
    color: $ink-400;
    font-size: 0.75rem;
  }

  strong {
    font-size: 0.95rem;
  }
}

.card-actions {
  display: flex;
  gap: $space-3;
  align-items: center;
  flex-wrap: wrap;
}

.btn-ghost,
.btn-danger {
  border: none;
  cursor: pointer;
  font-family: inherit;
  border-radius: 12px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
}

.btn-ghost {
  background: rgba($ink-700, 0.82);
  color: $fg-dark;
}

.btn-danger {
  background: rgba($signal-red, 0.12);
  color: #ff8a8f;
}

@media (max-width: 900px) {
  .provider-meta {
    grid-template-columns: 1fr;
  }

  .provider-top,
  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .status {
    align-self: flex-start;
  }

  .cost-band {
    flex-direction: column;
  }
}
</style>
