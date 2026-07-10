<template>
  <div class="page">
    <div class="page-header">
      <button class="btn-back" @click="$router.back()">← Volver</button>
      <h1 class="page-title">Nueva Gestión de Compra</h1>
    </div>
    <GestionCompraWizard />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import GestionCompraWizard from '@/views/shared/GestionCompraWizard/GestionCompraWizard.vue'

const auth = useAuthStore()
const store = useGestionCompraFormStore()

onMounted(() => {
  store.init({
    adminMode: true,
    defaultAsesorId: auth.currentUser?.id ?? '',
    defaultAsesorNombre: auth.currentUser?.name ?? '',
  })
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.page { display: flex; flex-direction: column; gap: $space-5; padding: $space-6; }
.page-header { display: flex; align-items: center; gap: $space-4; }
.page-title { color: $fg-dark; font-size: 1.5rem; font-weight: 700; margin: 0; }
.btn-back {
  background: none; border: none; color: $brand-orange; cursor: pointer;
  font-size: 0.9rem; padding: 0;
}
</style>
