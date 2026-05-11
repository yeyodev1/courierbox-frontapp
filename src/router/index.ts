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
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, saved) {
    if (saved) return saved;
    return { left: 0, top: 0, behavior: "instant" as ScrollBehavior };
  },
});

router.afterEach((to) => {
  if (typeof document !== "undefined") {
    const title = (to.meta?.title as string) || "Courier Box";
    document.title = title;
  }
});

export default router;
