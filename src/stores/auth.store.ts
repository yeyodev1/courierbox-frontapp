import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const savedToken = localStorage.getItem("admin_token");
  const token = ref<string | null>(savedToken && savedToken !== "null" ? savedToken : null);
  const router = useRouter();

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem("admin_token", newToken);
  };

  const logout = () => {
    token.value = null;
    localStorage.removeItem("admin_token");
    router.push("/login");
  };

  const isAuthenticated = () => {
    return token.value !== null;
  };

  const currentUser = computed(() => {
    if (!token.value) return null;
    try {
      const payload = token.value.split(".")[1];
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  });

  const userRole = computed(() => (currentUser.value?.role as string | undefined) || null);
  const isAdmin = computed(() => userRole.value === "admin");
  const isAsesor = computed(() => userRole.value === "asesor");
  const isGerencia = computed(() => userRole.value === "gerencia");
  const isSuperadmin = computed(() => userRole.value === "superadmin");

  return {
    token,
    setToken,
    logout,
    isAuthenticated,
    currentUser,
    userRole,
    isAdmin,
    isAsesor,
    isGerencia,
    isSuperadmin,
  };
});
