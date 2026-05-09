import { onMounted, onBeforeUnmount, ref } from "vue";

export function useReducedMotion() {
  const prefersReduced = ref(false);
  let mql: MediaQueryList | null = null;
  const handler = (e: MediaQueryListEvent | MediaQueryList) => {
    prefersReduced.value = e.matches;
  };

  onMounted(() => {
    if (typeof window === "undefined") return;
    mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    handler(mql);
    mql.addEventListener("change", handler);
  });

  onBeforeUnmount(() => {
    mql?.removeEventListener("change", handler);
  });

  return { prefersReduced };
}
