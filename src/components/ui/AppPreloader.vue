<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BrandMark from "@/components/ui/BrandMark.vue";

const isLoaded = ref(false);

onMounted(() => {
  // Wait a bit to let the reveal animation finish and fake loading
  setTimeout(() => {
    isLoaded.value = true;
  }, 2200);
});
</script>

<template>
  <div class="preloader-curtain" :class="{ 'is-loaded': isLoaded }">
    <div class="curtain-panel curtain-left"></div>
    <div class="curtain-panel curtain-right"></div>
    
    <div class="preloader-content">
      <div class="logo-wrapper">
        <div class="brand-logo-container">
           <BrandMark :size="72" with-word />
        </div>
        
        <div class="loading-status">
          <div class="loading-text">Cargando experiencia...</div>
          <div class="progress-line">
            <div class="progress-line-inner"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preloader-curtain {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.curtain-panel {
  position: absolute;
  top: 0;
  width: 50vw;
  height: 100vh;
  background: #09090b;
  transition: transform 1s cubic-bezier(0.77, 0, 0.175, 1);
  pointer-events: auto;
  will-change: transform;
}

.curtain-left {
  left: 0;
  transform-origin: left;
}

.curtain-right {
  right: 0;
  transform-origin: right;
  border-left: 1px solid rgba(255, 255, 255, 0.03);
}

.preloader-content {
  position: relative;
  z-index: 2;
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.brand-logo-container {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  animation: revealLogo 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards, pulseGlow 2.5s infinite ease-in-out;
  transform-origin: center;
}

.loading-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  animation: fadeIn 0.8s ease 0.6s forwards;
  opacity: 0;
}

.loading-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.35em;
  font-weight: 500;
}

.progress-line {
  width: 220px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  border-radius: 4px;
}

.progress-line-inner {
  height: 100%;
  width: 100%;
  background: #ff5e00; // brand orange
  transform-origin: left;
  animation: progressAnim 2.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

// When loaded
.is-loaded {
  .curtain-left {
    transform: translateX(-100%);
  }
  .curtain-right {
    transform: translateX(100%);
  }
  
  .preloader-content {
    opacity: 0;
    transform: scale(0.92);
  }
}

@keyframes revealLogo {
  0% { transform: translateY(40px) scale(0.95); opacity: 0; clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0% 100%); }
  100% { transform: translateY(0) scale(1); opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes progressAnim {
  0% { transform: scaleX(0); }
  20% { transform: scaleX(0.25); }
  60% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); }
}

@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 94, 0, 0.15)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 94, 0, 0.5)); }
}
</style>
