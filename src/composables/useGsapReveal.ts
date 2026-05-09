import { onMounted, onBeforeUnmount } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface RevealOptions {
  selector?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  start?: string;
}

export function useGsapReveal(options: RevealOptions = {}) {
  const {
    selector = "[data-reveal]",
    stagger = 0.08,
    y = 28,
    duration = 0.9,
    start = "top 85%",
  } = options;

  const triggers: ScrollTrigger[] = [];

  onMounted(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(selector, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const groups = new Map<HTMLElement, HTMLElement[]>();
    for (const el of els) {
      const parent = (el.closest<HTMLElement>("[data-reveal-group]") ?? el.parentElement) as HTMLElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(el);
    }

    groups.forEach((items, parent) => {
      const tl = gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "expo.out",
          scrollTrigger: {
            trigger: parent,
            start,
            toggleActions: "play none none none",
          },
        }
      );
      const st = (tl.scrollTrigger as ScrollTrigger | undefined);
      if (st) triggers.push(st);
    });
  });

  onBeforeUnmount(() => {
    triggers.forEach((t) => t.kill());
  });
}
