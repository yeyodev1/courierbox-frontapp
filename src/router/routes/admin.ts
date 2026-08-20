import type { RouteRecordRaw } from "vue-router";

/** Admin panel and the superadmin subset, behind the admin shell. */
export const adminRoutes: RouteRecordRaw[] = [
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
        meta: { title: "Histórico de Órdenes · Courier Box" },
      },
      {
        path: "costos",
        name: "AdminCostos",
        component: () => import("@/views/admin/Costos/CostosIndex.vue"),
        meta: { title: "Costos y Gastos · Courier Box" },
      },
      {
        path: "proveedores",
        name: "AdminProveedores",
        component: () => import("@/views/admin/AdminProveedoresView.vue"),
        meta: { title: "Proveedores · Courier Box" },
      },
      {
        path: "caja",
        name: "AdminCaja",
        component: () => import("@/views/admin/AdminCajaView.vue"),
        meta: { title: "Caja · Courier Box" },
      },
      {
        path: "produccion",
        name: "AdminProduccion",
        component: () => import("@/views/admin/AdminProduccionView.vue"),
        meta: { title: "Ventas diarias · Courier Box" },
      },
      {
        path: "reportes",
        name: "AdminReportes",
        component: () => import("@/views/admin/AdminReportesView.vue"),
        meta: { title: "Reportes · Courier Box" },
      },
      {
        path: "envios",
        name: "AdminEnvios",
        component: () => import("@/views/admin/AdminEnviosView.vue"),
        meta: { title: "Envíos a Domicilio · Courier Box" },
      },
      {
        path: "homologacion",
        name: "AdminHomologacion",
        component: () => import("@/views/admin/AdminHomologacionView.vue"),
        meta: { title: "Homologación de clientes · Courier Box" },
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
      // --- Gestiones de Compra ---
      {
        path: "gestiones-compra",
        name: "AdminGestionesCompra",
        component: () => import("@/views/admin/GestionesCompra/AdminGestionesCompraView.vue"),
        meta: { title: "Gestiones de Compra · Courier Box" },
      },
      {
        path: "gestiones-compra/nueva",
        name: "AdminNuevaGestion",
        component: () => import("@/views/admin/GestionesCompra/AdminNuevaGestionView.vue"),
        meta: { title: "Nueva Gestión · Courier Box" },
      },
      {
        path: "gestiones-compra/:id",
        name: "AdminGestionDetail",
        component: () => import("@/views/admin/GestionesCompra/AdminGestionCompraDetailView.vue"),
        meta: { title: "Detalle Gestión · Courier Box" },
      },
      {
        path: "cuentas-bancarias",
        name: "AdminCuentasBancarias",
        component: () => import("@/views/admin/AdminCuentasBancariasView.vue"),
        meta: { title: "Cuentas Bancarias · Courier Box" },
      },
      {
        path: "notificaciones",
        name: "AdminNotificaciones",
        component: () => import("@/views/admin/AdminNotificacionesView.vue"),
        meta: { title: "Notificaciones · Courier Box" },
      },
    ],
  },
  {
    path: "/superadmin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresSuperadmin: true, hideNavigation: true },
    children: [
      {
        path: "",
        name: "SuperadminDashboard",
        component: () => import("@/views/admin/SuperadminDashboardView.vue"),
        meta: { title: "Superadmin · Courier Box" },
      },
      {
        path: "reportes",
        name: "SuperadminReportes",
        component: () => import("@/views/admin/AdminReportesView.vue"),
        meta: { title: "Estado de Resultados · Courier Box" },
      },
      {
        path: "produccion",
        name: "SuperadminProduccion",
        component: () => import("@/views/admin/AdminProduccionView.vue"),
        meta: { title: "Ventas diarias · Courier Box" },
      },
      {
        path: "caja",
        name: "SuperadminCaja",
        component: () => import("@/views/admin/AdminCajaView.vue"),
        meta: { title: "Caja · Courier Box" },
      },
    ],
  },
];
