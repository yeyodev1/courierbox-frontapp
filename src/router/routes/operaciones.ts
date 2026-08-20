import type { RouteRecordRaw } from "vue-router";

/** Field and warehouse shells: motorizado and bodega. */
export const operacionesRoutes: RouteRecordRaw[] = [
  {
    path: "/motorizado",
    component: () => import("@/views/motorizado/MotorizadoLayout.vue"),
    meta: { requiresAuth: true, requiresMotorizado: true, hideNavigation: true },
    children: [
      {
        path: "",
        name: "MotorizadoEntregas",
        component: () => import("@/views/motorizado/MotorizadoEntregasView.vue"),
        meta: { title: "Mis Entregas · Courier Box" },
      },
      {
        path: "entregas/:id",
        name: "MotorizadoEntregaDetail",
        component: () => import("@/views/motorizado/MotorizadoEntregaDetailView.vue"),
        meta: { title: "Entrega · Courier Box" },
      },
    ],
  },
  {
    path: "/bodega",
    component: () => import("@/views/bodega/BodegaLayout.vue"),
    meta: { requiresAuth: true, requiresBodega: true, hideNavigation: true },
    children: [
      {
        path: "",
        name: "BodegaCompras",
        component: () => import("@/views/bodega/BodegaComprasView.vue"),
        meta: { title: "Bodega · Compras · Courier Box" },
      },
      {
        path: "compras/:id",
        name: "BodegaCompraDetail",
        component: () => import("@/views/bodega/BodegaCompraDetailView.vue"),
        meta: { title: "Recepción · Courier Box" },
      },
      {
        path: "counter",
        name: "BodegaCounter",
        component: () => import("@/views/bodega/BodegaCounterView.vue"),
        meta: { title: "Counter digital · Courier Box" },
      },
      {
        path: "facturacion",
        name: "BodegaFacturacion",
        component: () => import("@/views/bodega/BodegaFacturacionView.vue"),
        meta: { title: "Facturación · Courier Box" },
      },
      {
        path: "envios",
        name: "BodegaEnvios",
        component: () => import("@/views/bodega/BodegaEnviosView.vue"),
        meta: { title: "Bodega · Envíos · Courier Box" },
      },
      {
        path: "motorizados",
        name: "BodegaMotorizados",
        component: () => import("@/views/bodega/BodegaMotorizadosView.vue"),
        meta: { title: "Bodega · Motorizados · Courier Box" },
      },
    ],
  },
];
