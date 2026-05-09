<script setup lang="ts">
import HeroAwwwards from "@/components/sections/HeroAwwwards.vue";
import ServicesSection from "@/components/sections/ServicesSection.vue";
import ProcessSection from "@/components/sections/ProcessSection.vue";
import CoverageSection from "@/components/sections/CoverageSection.vue";
import TrustSection from "@/components/sections/TrustSection.vue";
import CtaFinal from "@/components/sections/CtaFinal.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";

useGsapReveal();
</script>

<template>
  <main class="home">
    <HeroAwwwards />
    <ServicesSection />
    <ProcessSection />
    <CoverageSection />
    <TrustSection />
    <CtaFinal />
  </main>
</template>

<style scoped lang="scss">
.home {
  position: relative;
}
</style>
