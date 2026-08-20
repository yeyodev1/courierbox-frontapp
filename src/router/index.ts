import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import { asesorRoutes } from "./routes/asesor";
import { operacionesRoutes } from "./routes/operaciones";

// The catch-all stays last: it has to lose to every real route above it.
const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...adminRoutes,
  ...asesorRoutes,
  ...operacionesRoutes,
  {
    // A silent redirect to "/" reads as a broken site; say what happened instead.
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { title: "Página no encontrada · Courier Box", hideNavigation: true },
  },
];

import { useAuthStore } from "@/stores/auth.store";

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    // Back/forward: put the reader back where they were.
    if (saved) return saved;

    // Same screen, only the query or hash moved — a filter, a tab, a page of a
    // table. Yanking the reader to the top there loses their place for nothing.
    if (to.path === from.path) return false;

    // A different screen does start at its top.
    return { left: 0, top: 0, behavior: "instant" as ScrollBehavior };
  },
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated();
  const role = authStore.userRole;

  const homeForRole = (r: string | null | undefined) => {
    if (r === "asesor") return { name: "AsesorDashboard" };
    if (r === "superadmin") return { name: "SuperadminDashboard" };
    if (r === "motorizado") return { name: "MotorizadoEntregas" };
    if (r === "bodega") return { name: "BodegaCompras" };
    if (["admin", "gerencia"].includes(String(r || ""))) return { name: "AdminDashboard" };
    return { name: "Home" };
  };

  if (to.name === "AdminLogin" && isAuthenticated) {
    next(homeForRole(role));
    return;
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "AdminLogin" });
    return;
  }

  if (to.meta.requiresAdmin && !["admin", "gerencia", "superadmin"].includes(String(role || ""))) {
    next(homeForRole(role));
    return;
  }

  if ((to.meta as any).requiresMotorizado && role !== "motorizado") {
    next(homeForRole(role));
    return;
  }

  if ((to.meta as any).requiresBodega && role !== "bodega") {
    next(homeForRole(role));
    return;
  }

  if ((to.meta as any).requiresSuperadmin && role !== "superadmin") {
    next({ name: role === "admin" ? "AdminDashboard" : role === "asesor" ? "AsesorDashboard" : "Home" });
    return;
  }

  if (to.meta.requiresAsesor && role !== "asesor") {
    next({ name: role === "admin" ? "AdminDashboard" : "Home" });
    return;
  }

  next();
});

router.afterEach((to) => {
  if (typeof document !== "undefined") {
    const title = (to.meta?.title as string) || "Courier Box";
    document.title = title;
  }
});

export default router;
