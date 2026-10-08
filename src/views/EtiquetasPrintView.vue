<script setup lang="ts">
/**
 * Hoja de impresión de etiquetas 4×6. Se abre en otra pestaña desde
 * Warehouses o Ingreso de carga con `?ids=a,b,c`; cada caja sale en su propia
 * página para la impresora térmica.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EtiquetaPaquete from '@/components/etiquetas/EtiquetaPaquete.vue'
import { formatoPorAgencia } from '@/components/etiquetas/etiqueta-formatos'
import { useFormatosEtiqueta } from '@/components/etiquetas/useFormatosEtiqueta'
import { paquetesApi, type Warehouse } from '@/services/paquetes.api'

const route = useRoute()
const { formatos, listo } = useFormatosEtiqueta()
const activos = computed(() => formatos.value.filter((f) => f.activo !== false))
const paquetes = ref<Warehouse[]>([])
const cargando = ref(true)
const error = ref('')
/** "auto" respeta la agencia de cada caja; cualquier otro valor fuerza ese formato en todas. */
const formato = ref<string>('auto')

const ids = computed(() =>
  String(route.query.ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

const formatoDe = (p: Warehouse) => (formato.value === 'auto' ? formatoPorAgencia(p.agencia, formatos.value) : formato.value)

onMounted(async () => {
  if (typeof route.query.formato === 'string') formato.value = route.query.formato
  if (!ids.value.length) {
    error.value = 'No hay cajas seleccionadas para imprimir.'
    cargando.value = false
    return
  }
  try {
    // El catálogo de Aliados llega en paralelo; si falla, salen los formatos de siempre.
    const [lista] = await Promise.all([paquetesApi.etiquetas(ids.value), listo])
    paquetes.value = lista
    if (!paquetes.value.length) error.value = 'Esas cajas ya no existen.'
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'No se pudieron cargar las etiquetas.'
  } finally {
    cargando.value = false
  }
})

function imprimir() {
  window.print()
}
</script>

<template>
  <div class="hoja">
    <div class="barra no-print">
      <div class="barra__info">
        <strong>Etiquetas 4×6</strong>
        <span v-if="!cargando">{{ paquetes.length }} caja(s) · una por página</span>
      </div>
      <label class="barra__formato">
        <span>Formato</span>
        <select v-model="formato" data-test="formato-etiqueta">
          <option value="auto">Según la agencia de cada caja</option>
          <option v-for="f in activos" :key="f.id" :value="f.id">{{ f.nombre }}</option>
        </select>
      </label>
      <button type="button" class="barra__btn" :disabled="cargando || !paquetes.length" data-test="imprimir" @click="imprimir">
        <i class="fa-solid fa-print" aria-hidden="true" /> Imprimir
      </button>
    </div>

    <p v-if="cargando" class="aviso no-print">Cargando etiquetas…</p>
    <p v-else-if="error" class="aviso aviso--error no-print">{{ error }}</p>

    <div class="etiquetas">
      <EtiquetaPaquete v-for="p in paquetes" :key="p._id" :paquete="p" :formato="formatoDe(p)" :formatos="formatos" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.hoja { min-height: 100vh; background: #e9e9ec; padding-bottom: 32px; }

.barra {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #111;
  color: #fff;
  font-family: Arial, Helvetica, sans-serif;

  &__info { display: flex; flex-direction: column; flex: 1 1 200px; span { color: #bbb; font-size: 0.85rem; } }
  &__formato { display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
    select { min-height: 40px; padding: 0 10px; border-radius: 8px; border: 1px solid #444; background: #222; color: #fff; font: inherit; } }
  &__btn { min-height: 44px; padding: 0 20px; border: none; border-radius: 8px; background: #ff9400; color: #111; font-weight: 700; font-size: 0.95rem; cursor: pointer;
    display: inline-flex; gap: 8px; align-items: center;
    &:disabled { opacity: 0.5; cursor: not-allowed; } }
}

.aviso { padding: 24px 16px; text-align: center; font-family: Arial, Helvetica, sans-serif; color: #333; &--error { color: #b00020; } }

.etiquetas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  padding: 16px;

  :deep(.etq) { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15); }
}

@media print {
  .no-print { display: none !important; }
  .hoja { background: #fff; padding: 0; min-height: 0; }
  .etiquetas { display: block; padding: 0; :deep(.etq) { box-shadow: none; } }
}
</style>

<style>
/*
 * La impresora recibe páginas del tamaño exacto de la etiqueta, sin márgenes.
 * Página con nombre: este CSS queda cargado al navegar, y así no cambia el
 * tamaño de lo que se imprima desde otras pantallas.
 */
@page etiqueta-4x6 { size: 4in 6in; margin: 0; }
@media print { .etq { page: etiqueta-4x6; } }
</style>
