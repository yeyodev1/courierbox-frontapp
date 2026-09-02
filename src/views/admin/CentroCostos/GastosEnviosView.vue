<script setup lang="ts">
import GastosSection from './GastosSection.vue'
</script>

<template>
  <GastosSection
    seccion="envios"
    tipo="envio"
    titulo="gasto de envío"
    descripcion="Transporte, combustible, devoluciones y todo lo que cuesta mover un paquete."
    empty-label="No hay gastos por envíos en este período"
  />
</template>
