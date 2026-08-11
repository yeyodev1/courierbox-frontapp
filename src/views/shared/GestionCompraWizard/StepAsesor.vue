<template>
  <div class="step-asesor">
    <h3 class="step__title">Seleccionar asesor</h3>
    <p class="step__desc">Elige el asesor responsable de esta gestión de compra.</p>

    <div v-if="loading" class="loading-msg" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="card" height="64px" :count="3" gap="0.6rem" />
    </div>
    <div v-else class="asesor-grid">
      <button
        v-for="u in asesores"
        :key="u._id"
        class="asesor-card"
        :class="{ selected: store.formData.asesorId === u._id }"
        @click="select(u)"
      >
        <span class="asesor-avatar">{{ initials(u.name) }}</span>
        <span class="asesor-name">{{ u.name }}</span>
        <span class="asesor-email">{{ u.email }}</span>
        <span v-if="store.formData.asesorId === u._id" class="check-badge">✓</span>
      </button>
    </div>
    <p v-if="!loading && !asesores.length" class="muted">No hay asesores disponibles.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import APIBase from '@/services/httpBase'

interface UserItem { _id: string; name: string; email: string; role: string }
class UsersAPI extends APIBase {
  async listAsesores(): Promise<UserItem[]> {
    const res = await this.get<{ users: UserItem[] }>('users')
    return (res.data.users ?? []).filter((u: UserItem) => u.role === 'asesor')
  }
}
const usersAPI = new UsersAPI()

const store = useGestionCompraFormStore()
const asesores = ref<UserItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    asesores.value = await usersAPI.listAsesores()
  } finally {
    loading.value = false
  }
})

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function select(u: UserItem) {
  store.setAsesor(u._id, u.name)
}

defineExpose({ isValid: () => !!store.formData.asesorId })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-asesor { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.loading-msg { color: $ink-400; }
.asesor-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: $space-3;
}
.asesor-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: $space-2;
  padding: $space-4 $space-3; background: $ink-900;
  border: 2px solid $ink-500; border-radius: 12px;
  cursor: pointer; color: $fg-dark; transition: all 0.18s;
  &:hover { border-color: $ink-300; }
  &.selected { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
}
.asesor-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: $brand-orange; color: #fff; font-weight: 700; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
}
.asesor-name { font-weight: 600; font-size: 0.9rem; text-align: center; }
.asesor-email { font-size: 0.75rem; color: $ink-300; text-align: center; word-break: break-all; }
.check-badge {
  position: absolute; top: 8px; right: 8px;
  background: $brand-orange; color: #fff;
  width: 20px; height: 20px; border-radius: 50%;
  font-size: 0.75rem; display: flex; align-items: center; justify-content: center;
}
.muted { color: $ink-400; }
</style>
