<script setup lang="ts">
/**
 * Signature capture for the counter. Pointer events cover mouse, finger and
 * stylus with one code path, so the same component works on the desktop at the
 * counter and on a tablet handed to the client.
 *
 * Strokes are kept as point arrays rather than baked into the canvas, so undo
 * and DPR-aware resizes just replay them.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** CSS height of the drawing surface. */
    height?: string
    penColor?: string
    lineWidth?: number
    disabled?: boolean
    label?: string
  }>(),
  {
    height: '220px',
    penColor: '#111111',
    lineWidth: 2.4,
    disabled: false,
    label: 'Firma del cliente',
  }
)

const emit = defineEmits<{
  /** Fires on every change: a PNG data URL, or '' once cleared. */
  change: [dataUrl: string]
}>()

type Point = { x: number; y: number }

const canvasRef = ref<HTMLCanvasElement | null>(null)
const strokes = ref<Point[][]>([])
const current = ref<Point[]>([])
const drawing = ref(false)

const isEmpty = computed(() => strokes.value.length === 0)

let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null

function setupContext() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = props.penColor
  ctx.lineWidth = props.lineWidth
  redraw()
}

function redraw() {
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
  ctx.strokeStyle = props.penColor
  ctx.lineWidth = props.lineWidth

  for (const stroke of [...strokes.value, current.value]) {
    if (stroke.length === 0) continue
    ctx.beginPath()
    if (stroke.length === 1) {
      // A tap still leaves a mark — a dot on the i, a period, a short flourish.
      const p = stroke[0]!
      ctx.arc(p.x, p.y, props.lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = props.penColor
      ctx.fill()
      continue
    }
    ctx.moveTo(stroke[0]!.x, stroke[0]!.y)
    for (let i = 1; i < stroke.length; i += 1) {
      ctx.lineTo(stroke[i]!.x, stroke[i]!.y)
    }
    ctx.stroke()
  }
}

function pointFrom(event: PointerEvent): Point {
  const rect = canvasRef.value!.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return
  canvasRef.value?.setPointerCapture(event.pointerId)
  drawing.value = true
  current.value = [pointFrom(event)]
  redraw()
}

function onPointerMove(event: PointerEvent) {
  if (!drawing.value || props.disabled) return
  event.preventDefault()
  current.value.push(pointFrom(event))
  redraw()
}

function onPointerUp(event: PointerEvent) {
  if (!drawing.value) return
  canvasRef.value?.releasePointerCapture?.(event.pointerId)
  drawing.value = false
  if (current.value.length > 0) strokes.value.push(current.value)
  current.value = []
  redraw()
  emitChange()
}

function emitChange() {
  if (isEmpty.value) {
    emit('change', '')
    return
  }
  emit('change', exportPng())
}

/** Flattens the canvas onto white — a transparent PNG is unreadable in a PDF. */
function exportPng(): string {
  const source = canvasRef.value
  if (!source) return ''
  const flattened = document.createElement('canvas')
  flattened.width = source.width
  flattened.height = source.height
  const fctx = flattened.getContext('2d')
  if (!fctx) return source.toDataURL('image/png')
  fctx.fillStyle = '#ffffff'
  fctx.fillRect(0, 0, flattened.width, flattened.height)
  fctx.drawImage(source, 0, 0)
  return flattened.toDataURL('image/png')
}

function undo() {
  if (props.disabled) return
  strokes.value.pop()
  redraw()
  emitChange()
}

function clear() {
  if (props.disabled) return
  strokes.value = []
  current.value = []
  redraw()
  emitChange()
}

watch(() => [props.penColor, props.lineWidth], redraw)

onMounted(() => {
  setupContext()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObserver = new ResizeObserver(() => setupContext())
    resizeObserver.observe(canvasRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

defineExpose({ clear, undo, isEmpty, exportPng })
</script>

<template>
  <div class="sig" :class="{ 'is-disabled': disabled }">
    <div class="sig__head">
      <span class="sig__label">{{ label }}</span>
      <div class="sig__tools">
        <button type="button" :disabled="disabled || isEmpty" @click="undo">
          <i class="fa-solid fa-rotate-left" aria-hidden="true" /> Deshacer
        </button>
        <button type="button" :disabled="disabled || isEmpty" @click="clear">
          <i class="fa-solid fa-eraser" aria-hidden="true" /> Limpiar
        </button>
      </div>
    </div>

    <div class="sig__surface" :style="{ height }">
      <canvas
        ref="canvasRef"
        class="sig__canvas"
        :aria-label="label"
        role="img"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerleave="onPointerUp"
      />
      <div v-if="isEmpty" class="sig__hint">
        <i class="fa-solid fa-pen-nib" aria-hidden="true" />
        <span>Firma aquí con el dedo o el mouse</span>
      </div>
      <div class="sig__baseline" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.sig {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.sig__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  flex-wrap: wrap;
}

.sig__label {
  font-size: 0.85rem;
  color: $ink-300;
}

.sig__tools {
  display: flex;
  gap: $space-2;

  button {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    min-height: 32px;
    padding: 0 $space-3;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.3);
    background: rgba($ink-700, 0.8);
    color: $ink-200;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background $dur-fast ease, color $dur-fast ease;

    &:hover:not(:disabled) {
      background: rgba($ink-600, 0.95);
      color: $fg-dark;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.sig__surface {
  position: relative;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.3);
  /* White surface: a signature has to look like ink on paper, and it is
     exported onto white for the PDF anyway. */
  background: #fff;
  overflow: hidden;
}

.sig__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Stops the browser from scrolling the page while the client signs. */
  touch-action: none;
  cursor: crosshair;
}

.sig__hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  pointer-events: none;
  color: #b9b9b9;
  font-size: 0.85rem;

  i {
    font-size: 1.3rem;
  }
}

.sig__baseline {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 22%;
  border-bottom: 1px dashed #d5d5d5;
  pointer-events: none;
}
</style>
