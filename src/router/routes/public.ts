import type { RouteRecordRaw } from "vue-router";

/** Marketing site, tracking and the public payment portal. */
export const publicRoutes: RouteRecordRaw[] = [
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
    path: "/comprar-por-mi",
    name: "PersonalShopper",
    component: () => import("@/views/PersonalShopperView.vue"),
    meta: { title: "Personal Shopper · Nosotros te lo compramos · Courier Box" },
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
    path: "/compra/:token",
    name: "SeguirCompra",
    component: () => import("@/views/SeguirCompraView.vue"),
    meta: { title: "Mi Compra · Courier Box", hideNavigation: true },
  },
];
