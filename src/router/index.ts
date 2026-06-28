import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
    meta: { title: "Courier Box · Tú pides, nosotros del resto" },
  },
  {
    path: "/servicios",
    name: "Services",
    component: () => import("@/views/ServicesView.vue"),
    meta: { title: "Servicios · Courier Box" },
  },
  {
    path: "/cotizar",
    name: "Quote",
    component: () => import("@/views/QuoteView.vue"),
    meta: { title: "Cotizar envío · Courier Box" },
  },
  {
    path: "/rastrear",
    name: "Tracking",
    component: () => import("@/views/TrackingView.vue"),
    meta: { title: "Rastrear envío · Courier Box" },
  },
  {
    path: "/rastrear/:codigo",
    name: "TrackingDetail",
    component: () => import("@/views/TrackingView.vue"),
    meta: { title: "Rastrear envío · Courier Box" },
  },
  {
    path: "/nosotros",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
    meta: { title: "Nosotros · Courier Box" },
  },
  {
    path: "/contacto",
    name: "Contact",
    component: () => import("@/views/ContactView.vue"),
    meta: { title: "Contacto · Courier Box" },
  },
  {
    path: "/login",
    name: "AdminLogin",
    component: () => import("@/views/admin/LoginView.vue"),
    meta: { title: "Admin Login · Courier Box", hideNavigation: true },
  },
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresAdmin: true, hideNavigation: true },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: () => import("@/views/admin/AdminDashboardView.vue"),
        meta: { title: "Admin Dashboard · Courier Box" },
      },
      {
        path: "payments",
        name: "AdminPayments",
        component: () => import("@/views/admin/AdminPaymentsView.vue"),
        meta: { title: "Links de Pago · Courier Box" },
      },
      {
        path: "users",
        name: "AdminUsers",
        component: () => import("@/views/admin/AdminUsersView.vue"),
        meta: { title: "Usuarios · Courier Box" },
      },
      {
        path: "tracking",
        name: "AdminTracking",
        component: () => import("@/views/admin/AdminTrackingView.vue"),
        meta: { title: "Tracking · Courier Box" },
      },
      {
        path: "fee-config",
        name: "AdminFeeConfig",
        component: () => import("@/views/admin/AdminFeeConfigView.vue"),
        meta: { title: "Tarifas · Courier Box" },
      },
      {
        path: "purchase-orders",
        name: "AdminPurchaseOrders",
        component: () => import("@/views/admin/AdminPurchaseOrdersView.vue"),
        meta: { title: "Pendientes de Compra · Courier Box" },
      },
      {
        path: "costos",
        name: "AdminCostos",
        component: () => import("@/views/admin/AdminCostosView.vue"),
        meta: { title: "Costos y Gastos · Courier Box" },
      },
      {
        path: "envios",
        name: "AdminEnvios",
        component: () => import("@/views/admin/AdminEnviosView.vue"),
        meta: { title: "Envíos a Domicilio · Courier Box" },
      },
      {
        path: "contactos",
        name: "AdminContactos",
        component: () => import("@/views/admin/AdminContactosView.vue"),
        meta: { title: "Contactos · Courier Box" },
      },
      {
        path: "conciliacion",
        name: "AdminConciliacion",
        component: () => import("@/views/admin/ConciliacionView.vue"),
        meta: { title: "Conciliación · Courier Box" },
      },
      {
        path: "metrics",
        name: "AdminMetrics",
        component: () => import("@/views/admin/MetricsView.vue"),
        meta: { title: "Métricas GHL · Courier Box" },
      },
    ],
  },
  {
    path: "/asesor",
    component: () => import("@/views/asesor/AsesorLayout.vue"),
    meta: { requiresAuth: true, requiresAsesor: true, hideNavigation: true },
    children: [
      {
        path: "",
        name: "AsesorDashboard",
        component: () => import("@/views/asesor/AsesorDashboardView.vue"),
        meta: { title: "Dashboard Asesor · Courier Box" },
      },
      {
        path: "calculadora",
        name: "AsesorCalculator",
        component: () => import("@/views/asesor/AsesorCalculatorView.vue"),
        meta: { title: "Calculadora · Courier Box" },
      },
      {
        path: "ordenes",
        name: "AsesorOrders",
        component: () => import("@/views/asesor/AsesorOrdersView.vue"),
        meta: { title: "Mis Órdenes · Courier Box" },
      },
      {
        path: "ordenes/nueva",
        name: "AsesorNewOrder",
        component: () => import("@/views/asesor/AsesorNewOrderView.vue"),
        meta: { title: "Nueva Orden · Courier Box" },
      },
      {
        path: "ordenes/:id",
        name: "AsesorOrderDetail",
        component: () => import("@/views/asesor/AsesorOrderDetailView.vue"),
        meta: { title: "Detalle de Orden · Courier Box" },
      },
    ],
  },
  {
    path: "/pagos",
    name: "PaymentPortal",
    component: () => import("@/views/PaymentPortalView.vue"),
    meta: { title: "Mis Pagos · Courier Box" },
  },
  {
    path: "/seguir/:token",
    name: "SeguirPedido",
    component: () => import("@/views/SeguirPedidoView.vue"),
    meta: { title: "Seguir Pedido · Courier Box", hideNavigation: true },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

import { useAuthStore } from "@/stores/auth.store";

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, saved) {
    if (saved) return saved;
    return { left: 0, top: 0, behavior: "instant" as ScrollBehavior };
  },
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated();
  const role = authStore.userRole;

  if (to.name === "AdminLogin" && isAuthenticated) {
    next({ name: role === "asesor" ? "AsesorDashboard" : "AdminDashboard" });
    return;
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "AdminLogin" });
    return;
  }

  if (to.meta.requiresAdmin && role !== "admin") {
    next({ name: role === "asesor" ? "AsesorDashboard" : "Home" });
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
