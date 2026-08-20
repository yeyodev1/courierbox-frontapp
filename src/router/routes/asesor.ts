import type { RouteRecordRaw } from "vue-router";

/** Sales advisor workspace. */
export const asesorRoutes: RouteRecordRaw[] = [
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
        path: "solicitudes",
        name: "AsesorSolicitudes",
        component: () => import("@/views/asesor/AsesorSolicitudesView.vue"),
        meta: { title: "Solicitudes de compra · Courier Box" },
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
        redirect: { name: "AsesorVentas" },
        meta: { title: "Nueva Gestión · Courier Box" },
      },
      {
        path: "ordenes/:id",
        name: "AsesorOrderDetail",
        component: () => import("@/views/asesor/AsesorOrderDetailView.vue"),
        meta: { title: "Detalle de Orden · Courier Box" },
      },
      // --- Gestiones de Compra (asesor) ---
      {
        path: "gestiones-compra",
        name: "AsesorGestionesCompra",
        component: () => import("@/views/asesor/AsesorGestionesCompraView.vue"),
        meta: { title: "Mis Gestiones · Courier Box" },
      },
      {
        path: "gestiones-compra/nueva",
        name: "AsesorNuevaGestion",
        component: () => import("@/views/asesor/AsesorNuevaGestionView.vue"),
        meta: { title: "Nueva Gestión · Courier Box" },
      },
      {
        path: "ventas",
        name: "AsesorVentas",
        component: () => import("@/views/asesor/AsesorNuevaGestionView.vue"),
        meta: { title: "Ventas · Courier Box" },
      },
      {
        path: "contactos",
        name: "AsesorContactos",
        component: () => import("@/views/asesor/AsesorContactosView.vue"),
        meta: { title: "Contactos · Courier Box" },
      },
      {
        path: "contactos/:key",
        name: "AsesorContactoDetail",
        component: () => import("@/views/asesor/AsesorContactoDetailView.vue"),
        meta: { title: "Detalle de Contacto · Courier Box" },
      },
      {
        path: "gestiones-compra/:id",
        name: "AsesorGestionDetail",
        component: () => import("@/views/asesor/AsesorGestionCompraDetailView.vue"),
        meta: { title: "Detalle Gestión · Courier Box" },
      },
    ],
  },
];
