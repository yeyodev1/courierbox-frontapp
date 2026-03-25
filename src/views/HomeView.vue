<script setup lang="ts">
import HeroSection from '@/components/HeroSection.vue';
import FooterSection from '@/components/FooterSection.vue';
</script>

<template>
  <div class="home-view">
    <main>
      <HeroSection />
    </main>
    <FooterSection />
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  main {
    flex: 1;
  }
}
</style>
