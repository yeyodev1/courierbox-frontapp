<script setup lang="ts">
// Hero Section Logic
const whatsappMessage = encodeURIComponent('Hola! Necesito información sobre sus servicios de courier y tecnología.');
const whatsappUrl = `https://wa.me/593985099796?text=${whatsappMessage}`;
import logoImage from '@/assets/logo/image.png';
</script>

<template>
  <section class="hero-section">
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title">
          Tu socio logístico y 
          <span class="highlight">tecnológico</span>
        </h1>
        <p class="hero-subtitle">
          Expertos en Courier Internacional, venta de ecosistema Apple y Servicio Técnico especializado.
        </p>
        <div class="hero-actions">
          <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="btn-primary">
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>
      <div class="hero-image">
        <img :src="logoImage" alt="Courier Box Logistics Logo" class="main-logo" />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 4rem 2rem;
  background-color: $primary-light;
  overflow: hidden;
  position: relative;
  
  // Subtle background gradient for a premium feel
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 80%;
    height: 150%;
    background: radial-gradient(circle, rgba($primary, 0.05) 0%, rgba($primary-light, 0) 70%);
    z-index: 0;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  max-width: 1200px;
  width: 100%;
  align-items: center;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-title {
  font-family: $font-principal;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  color: $primary-dark;
  
  .highlight {
    color: $primary;
    display: block;
  }
}

.hero-subtitle {
  font-family: $font-secondary;
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  color: $text-secondary;
  max-width: 600px;
}

.hero-actions {
  display: flex;
  margin-top: 1rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  background-color: $secondary;
  color: $white;
  font-family: $font-secondary;
  font-weight: 600;
  font-size: 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba($secondary, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($secondary, 0.4);
    background-color: darken($secondary, 5%);
  }
}

.hero-image {
  display: none;
  justify-content: center;
  align-items: center;
  position: relative;

  @media (min-width: 768px) {
    display: flex;
  }
}

.main-logo {
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.1));
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
</style>
