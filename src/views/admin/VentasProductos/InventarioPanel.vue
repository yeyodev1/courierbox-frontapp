<script setup lang="ts">
import { useToastStore } from '@/stores/toast.store'
import type { useVentasProductos } from './useVentasProductos'

const props = defineProps<{ vp: ReturnType<typeof useVentasProductos> }>()
const toast = useToastStore()
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`

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
      <h3>Alimentar inventario</h3>
      <div class="form-grid">
        <label class="full"><span>Producto</span><input v-model="vp.productoForm.nombre" class="field-input" placeholder="Nombre del producto" /></label>
        <label><span>Precio $</span><input v-model.number="vp.productoForm.precio" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Precio mayorista $</span><input v-model.number="vp.productoForm.precioMayorista" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Costo $</span><input v-model.number="vp.productoForm.costo" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Comisión $</span><input v-model.number="vp.productoForm.comision" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Stock</span><input v-model.number="vp.productoForm.stock" type="number" step="1" class="field-input" /></label>
      </div>
      <div class="form-footer">
        <button class="btn-primary" @click="guardar">Agregar al inventario</button>
      </div>
    </section>

    <section class="panel">
      <h3>Inventario</h3>
      <p v-if="!vp.loading && !vp.inventario.length" class="empty">Aún no hay productos.</p>
      <div class="table-scroll">
        <table class="inv-table">
          <thead>
            <tr><th>Producto</th><th>Precio</th><th>Mayorista</th><th>Costo</th><th>Comisión</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in vp.inventario" :key="p._id" :class="{ inactivo: !p.activo }">
              <td>{{ p.nombre }}</td>
              <td>{{ money(p.precio) }}</td>
              <td>{{ money(p.precioMayorista) }}</td>
              <td>{{ money(p.costo) }}</td>
              <td>{{ money(p.comision) }}</td>
              <td>{{ p.stock }}</td>
              <td><button class="link-btn" @click="toggle(p)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button></td>
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

.inv-wrap { display: flex; flex-direction: column; gap: $space-5; }
.panel { background: rgba($ink-900, .7); border: 1px solid rgba($ink-500, .12); border-radius: 20px; padding: $space-5; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-3; margin: $space-4 0; }
.full { grid-column: 1 / -1; }
.form-footer { display: flex; justify-content: flex-end; }
.table-scroll { overflow-x: auto; }
.inv-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.inv-table th { text-align: left; color: $ink-400; font-weight: 600; padding: $space-2 $space-3; border-bottom: 1px solid rgba($ink-500, .15); }
.inv-table td { padding: $space-2 $space-3; border-bottom: 1px solid rgba($ink-500, .08); }
.inv-table tr.inactivo { opacity: .45; }
.link-btn { background: none; border: none; color: $brand-orange; cursor: pointer; font-size: .82rem; }
.empty { color: $ink-400; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
