import { onBeforeUnmount, onMounted } from "vue";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;

export function useLenis() {
  onMounted(() => {
    if (typeof window === "undefined") return;
    if (lenisInstance) return;

    gsap.registerPlugin(ScrollTrigger);

    lenisInstance = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      touchMultiplier: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenisInstance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time: number) => lenisInstance?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add("lenis", "lenis-smooth");
  });

  onBeforeUnmount(() => {
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    }
  });

  return {
    scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => {
      lenisInstance?.scrollTo(target, options);
    },
    stop: () => lenisInstance?.stop(),
    start: () => lenisInstance?.start(),
  };
}

export function getLenis() {
  return lenisInstance;
}
