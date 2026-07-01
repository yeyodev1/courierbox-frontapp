<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi } from '@/services/admin.api';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  try {
    const res = await adminApi.login(email.value, password.value);
    authStore.setToken(res.token);
    const role = res.user?.role;
    if (role === 'asesor') router.push({ name: 'AsesorDashboard' });
    else if (role === 'superadmin') router.push({ name: 'SuperadminDashboard' });
    else router.push({ name: 'AdminDashboard' });
  } catch (err: any) {
    error.value = err.message || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="login-layout">
    <div class="login-wrapper">
      <div class="glass-card">
        <header class="login-header">
          <div class="brand-logo">
            <span class="logo-box">C</span>
            <h2>Courier Box</h2>
          </div>
          <p class="subtitle">Accede al panel de administración</p>
        </header>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <div class="input-wrapper">
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                required 
                placeholder="ejemplo@courierbox.com"
                autocomplete="username"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                required 
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
              />
            </div>
          </div>

          <transition name="fade">
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </transition>

          <button type="submit" :disabled="loading" class="login-btn">
            <span v-if="!loading">Ingresar</span>
            <span v-else class="loader"></span>
          </button>
        </form>
      </div>
    </div>
    
    <!-- Background Decorators -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;

.login-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $ink-1000;
  overflow: hidden;
}

/* Background gradient shapes */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.6;
}
.shape-1 {
  width: 400px;
  height: 400px;
  background: $brand-orange-glow;
  top: -100px;
  right: -100px;
}
.shape-2 {
  width: 500px;
  height: 500px;
  background: rgba($brand-orange, 0.15);
  bottom: -200px;
  left: -200px;
}

.login-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  padding: 1.5rem;
}

.glass-card {
  background: rgba($ink-900, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;

  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .logo-box {
      background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
      color: $ink-1000;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      font-weight: 800;
      font-size: 1.25rem;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: $fg-dark;
      margin: 0;
      letter-spacing: -0.02em;
    }
  }

  .subtitle {
    color: $muted-dark;
    font-size: 0.95rem;
    margin: 0;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: $ink-200;
    letter-spacing: 0.01em;
  }

  .input-wrapper {
    position: relative;

    input {
      width: 100%;
      background: rgba($ink-1000, 0.5);
      border: 1px solid rgba($ink-400, 0.4);
      color: $fg-dark;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: all 0.3s ease;

      &::placeholder {
        color: $ink-500;
      }

      &:focus {
        outline: none;
        border-color: $brand-orange;
        box-shadow: 0 0 0 4px rgba($brand-orange, 0.15);
        background: rgba($ink-1000, 0.8);
      }
    }
  }
}

.error-message {
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  padding: 0.875rem;
  border-radius: 10px;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 1.5rem;
  border: 1px solid rgba($signal-red, 0.2);
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
  color: $ink-1000;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba($brand-orange, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loader {
    width: 20px;
    height: 20px;
    border: 3px solid rgba($ink-1000, 0.3);
    border-bottom-color: $ink-1000;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
