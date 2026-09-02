<script setup lang="ts">
import GastosSection from './GastosSection.vue'
</script>

<template>
  <GastosSection
    seccion="generales"
    tipo="operacional"
    titulo="gasto"
    descripcion="Renta, sueldos, insumos y todo lo que no es carga recibida ni envío."
    empty-label="No hay gastos generales en este período"
  />
</template>
