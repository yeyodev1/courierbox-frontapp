import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShellSidebar from '../ShellSidebar.vue'

const groups = [
  {
    label: 'Privado',
    items: [
      { path: '/admin', label: 'Dashboard', icon: 'fa-solid fa-chart-line', match: (p: string) => p === '/admin' },
      { path: '/admin/caja', label: 'Caja', icon: 'fa-solid fa-coins', match: (p: string) => p.startsWith('/admin/caja') },
    ],
  },
]

function montar(expanded: boolean) {
  return mount(ShellSidebar, {
    props: {
      groups,
      currentPath: '/admin',
      expanded,
      mobileOpen: false,
      brandSubtitle: 'Admin',
      userDisplayName: 'Ana',
      userEmail: 'ana@x.com',
      userInitial: 'A',
    },
    global: { stubs: { BrandMark: true } },
  })
}

describe('ShellSidebar', () => {
  it('lleva la clase collapsed en el propio <aside> cuando no está expandida', () => {
    // El estado colapsado vive en el aside (no en el shell padre): con
    // :global(.sidebar-collapsed) & el compilador scoped tiraba el selector y la
    // barra se quedaba en 280px mientras el contenido quedaba en 0px de ancho.
    const w = montar(false)
    expect(w.get('aside.sidebar').classes()).toContain('collapsed')
    expect(w.get('.nav-label').attributes('style')).toContain('display: none')
    expect(w.get('.nav-item').attributes('title')).toBe('Dashboard')
  })

  it('sin la clase collapsed cuando está expandida, con etiquetas visibles', () => {
    const w = montar(true)
    expect(w.get('aside.sidebar').classes()).not.toContain('collapsed')
    expect(w.get('.nav-label').attributes('style') ?? '').not.toContain('display: none')
  })

  it('emite toggle al pulsar el botón de colapsar', async () => {
    const w = montar(true)
    await w.get('.collapse-btn').trigger('click')
    expect(w.emitted('toggle')).toHaveLength(1)
  })
})
