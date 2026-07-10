import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { authAPI } from "@/services/auth.api";

export const useAuthStore = defineStore("auth", () => {
  const savedToken = localStorage.getItem("admin_token");
  const token = ref<string | null>(savedToken && savedToken !== "null" ? savedToken : null);
  const profile = ref<{ userId: string; email: string; name: string; role: string } | null>(null);
  const router = useRouter();

  const clearSession = () => {
    token.value = null;
    profile.value = null;
    localStorage.removeItem("admin_token");
  };

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem("admin_token", newToken);
  };

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  const bootstrap = async () => {
    if (!token.value) return null;

    try {
      const user = await authAPI.me();
      profile.value = { userId: user.id, email: user.email, name: user.name, role: user.role };
      return profile.value;
    } catch {
      clearSession();
      return null;
    }
  };

  const isAuthenticated = () => {
    return token.value !== null;
  };

  const currentUser = computed(() => {
    if (profile.value) return profile.value;
    if (!token.value) return null;
    try {
      const payload = token.value.split(".")[1];
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch (e) {
      return profile.value;
    }
  });

  const userRole = computed(() => (currentUser.value?.role as string | undefined) || null);
  const isAdmin = computed(() => userRole.value === "admin");
  const isAsesor = computed(() => userRole.value === "asesor");
  const isGerencia = computed(() => userRole.value === "gerencia");
  const isSuperadmin = computed(() => userRole.value === "superadmin");

  return {
    token,
    profile,
    setToken,
    bootstrap,
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
