<script setup lang="ts">
import { useToastStore } from '@/stores/toast.store'
import type { useVentasProductos } from './useVentasProductos'

const props = defineProps<{ vp: ReturnType<typeof useVentasProductos> }>()
const toast = useToastStore()
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`

/** Margin per unit, so the operator prices without doing the math by hand. */
function margen(p: { precio: number; costo: number; comision: number }) {
  return (Number(p.precio) || 0) - (Number(p.costo) || 0) - (Number(p.comision) || 0)
}

async function guardar() {
  const f = props.vp.productoForm
  if (!f.nombre.trim()) return toast.showNotification('El producto necesita un nombre', 'error')
  try {
    await props.vp.crearProducto()
    toast.showNotification('Producto agregado al inventario', 'success')
  } catch (e: any) {
    toast.showNotification(e.message || 'Error al guardar', 'error')
  }
}

async function toggle(p: any) {
  try {
    await props.vp.toggleProducto(p)
  } catch (e: any) {
    toast.showNotification(e.message || 'Error', 'error')
  }
}
</script>

<template>
  <div class="inv-wrap">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3>Alimentar inventario</h3>
          <p>El precio y la comisión se usan automáticamente al registrar una venta.</p>
        </div>
      </div>

      <div class="form-grid">
        <label class="field full">
          <span>Producto</span>
          <input v-model="vp.productoForm.nombre" class="field-input" placeholder="Ej. iPhone 17 Pro Max 256GB" />
        </label>
        <label class="field">
          <span>Precio $</span>
          <input v-model.number="vp.productoForm.precio" type="number" min="0" step="0.01" class="field-input" />
        </label>
        <label class="field">
          <span>Precio mayorista $</span>
          <input v-model.number="vp.productoForm.precioMayorista" type="number" min="0" step="0.01" class="field-input" />
        </label>
        <label class="field">
          <span>Costo $</span>
          <input v-model.number="vp.productoForm.costo" type="number" min="0" step="0.01" class="field-input" />
        </label>
        <label class="field">
          <span>Comisión $</span>
          <input v-model.number="vp.productoForm.comision" type="number" min="0" step="0.01" class="field-input" />
        </label>
        <label class="field">
          <span>Stock</span>
          <input v-model.number="vp.productoForm.stock" type="number" step="1" class="field-input" />
        </label>
      </div>

      <footer class="form-footer">
        <span class="margen-chip">
          Margen por unidad
          <strong :class="{ negativo: margen(vp.productoForm) < 0 }">{{ money(margen(vp.productoForm)) }}</strong>
        </span>
        <button class="btn-primary" @click="guardar"><i class="fa-solid fa-plus" /> Agregar al inventario</button>
      </footer>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3>Inventario</h3>
          <p>{{ vp.inventario.length }} producto(s) registrados</p>
        </div>
      </div>

      <div v-if="!vp.loading && !vp.inventario.length" class="empty-state">
        <i class="fa-solid fa-box-open" />
        <strong>Aún no hay productos</strong>
        <p>Agrega el primero con el formulario de arriba.</p>
      </div>

      <div v-else class="table-scroll">
        <table class="inv-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Precio</th>
              <th class="num">Mayorista</th>
              <th class="num">Costo</th>
              <th class="num">Comisión</th>
              <th class="num">Margen</th>
              <th class="num">Stock</th>
              <th class="acciones"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in vp.inventario" :key="p._id" :class="{ inactivo: !p.activo }">
              <td>
                <strong>{{ p.nombre }}</strong>
                <span v-if="!p.activo" class="tag">Inactivo</span>
              </td>
              <td class="num money">{{ money(p.precio) }}</td>
              <td class="num">{{ money(p.precioMayorista) }}</td>
              <td class="num">{{ money(p.costo) }}</td>
              <td class="num">{{ money(p.comision) }}</td>
              <td class="num" :class="{ negativo: margen(p) < 0 }">{{ money(margen(p)) }}</td>
              <td class="num">
                <span class="stock" :class="{ bajo: p.stock <= 0 }">{{ p.stock }}</span>
              </td>
              <td class="acciones">
                <button class="link-btn" :class="{ danger: p.activo }" @click="toggle(p)">
                  {{ p.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './ventas-ui' as *;

@include panel;
@include fields;
@include buttons;
@include lists;

.inv-wrap { display: flex; flex-direction: column; gap: $space-5; }

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;
  margin-top: $space-5;
  padding-top: $space-4;
  border-top: 1px solid rgba($ink-500, 0.12);
  flex-wrap: wrap;
}
.margen-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $ink-400;

  strong {
    font-size: 1.15rem;
    color: $signal-green;
    text-transform: none;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;

    &.negativo { color: #ff8a8f; }
  }
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 14px;
}
.inv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  min-width: 720px;

  th {
    position: sticky;
    top: 0;
    text-align: left;
    padding: $space-3 $space-4;
    background: rgba($ink-1000, 0.6);
    color: $ink-400;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    padding: $space-3 $space-4;
    border-top: 1px solid rgba($ink-500, 0.08);
    vertical-align: middle;
  }

  tbody tr { transition: background 0.14s ease; }
  tbody tr:hover { background: rgba($ink-500, 0.06); }
  tr.inactivo { opacity: 0.5; }

  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .num.negativo { color: #ff8a8f; }
  .acciones { text-align: right; }

  td .tag { margin-left: $space-2; }

  .stock {
    display: inline-flex;
    min-width: 34px;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba($ink-500, 0.16);
    font-weight: 600;

    &.bajo { background: rgba($signal-red, 0.16); color: #ff8a8f; }
  }
}
</style>
