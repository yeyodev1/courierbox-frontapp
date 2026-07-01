# Courier Box — Web

Sitio público de Courier Box. Vue 3 + Vite + SCSS + GSAP + Lenis. Mobile-first, dark editorial.

## Stack
- Vue 3.5, Vite 7, Pinia, vue-router 4
- SCSS (tokens + mixins en `src/styles`)
- GSAP + ScrollTrigger (reveals, contadores)
- Lenis (smooth scroll global)
- Axios (`src/services/httpBase.ts`)
- @fontsource: Fraunces · Inter Tight · JetBrains Mono

## Setup
```bash
pnpm install
cp .env.example .env.local      # apunta a la API
pnpm dev                        # http://localhost:5173
pnpm build && pnpm preview
```

## Variables
| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8101/api` | Endpoint del API Node |

## Estructura
```
src/
├─ assets/logo/                 SVGs del monograma + wordmark
├─ components/
│  ├─ ui/                       primitives (AppButton, AppInput, AppCard, AppBadge, RevealText, Marquee, BrandMark)
│  ├─ sections/                 Hero, Services, Process, Coverage, Trust, CtaFinal, FooterEditorial
│  └─ tracking/                 Form, Timeline, ResultCard, Empty
├─ composables/                 useLenis, useGsapReveal, useReducedMotion
├─ layout/SiteNav.vue           navbar fixed con blur
├─ services/                    httpBase + tracking
├─ stores/tracking.ts           Pinia store con historial localStorage
├─ styles/
│  ├─ tokens/                   colors, type, motion, space
│  ├─ mixins/                   responsive, typography
│  ├─ base/                     reset, global
│  └─ main.scss                 entry global
└─ views/                       Home, Tracking, Services, About, Contact
```

## Rutas
- `/` — Home
- `/servicios`
- `/rastrear` y `/rastrear/:codigo`
- `/nosotros`
- `/contacto`

## Notas de copy
Toda referencia a tercerización/partners se eliminó. Tono en primera persona plural: "nuestra red", "nuestro equipo", "operamos cada eslabón".

## Accesibilidad
- `prefers-reduced-motion` desactiva animaciones GSAP/Lenis y transiciones de página.
- Touch targets ≥ 44×44 px.
- Foco visible respetado, contraste WCAG AA en texto sobre `#06060A`.
