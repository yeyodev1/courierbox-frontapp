import { computed, reactive, ref } from 'vue'
import { adminApi } from '@/services/admin.api'

export interface ProductoInventario {
  _id: string
  nombre: string
  precio: number
  precioMayorista: number
  costo: number
  comision: number
  stock: number
  activo: boolean
}

export interface ClienteLite {
  _id: string
  nombreOficial: string
  codigoCasillero?: string
  email?: string
  telefono?: string
}

export interface NuevoClientePayload {
  nombreOficial: string
  cedulaRuc?: string
  email?: string
  telefono?: string
  codigoCasillero?: string
}

export interface Vendedor {
  _id: string
  name?: string
  email: string
}

export interface Cuota {
  fecha: string
  monto: number
}

export function nuevoProductoForm() {
  return { nombre: '', precio: 0, precioMayorista: 0, costo: 0, comision: 0, stock: 0 }
}

export function nuevaVentaForm() {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    vendedorNombre: '',
    vendedorId: '',
    clienteId: '',
    clienteNombre: '',
    clienteEmail: '',
    productoId: '',
    cantidad: 1,
    precioModo: 'automatico' as 'automatico' | 'manual',
    precioUnitario: 0,
    metodoEntrega: 'retiro_oficina' as 'retiro_oficina' | 'envio',
    valorEnvio: 0,
    metodoPago: '',
    pagoConfirmado: false,
    esCredito: false,
    abono: 0,
    cuotas: [] as Cuota[],
    observacion: '',
  }
}

export function useVentasProductos() {
  const inventario = ref<ProductoInventario[]>([])
  const ventas = ref<any[]>([])
  const recordatorios = ref<any[]>([])
  const vendedores = ref<Vendedor[]>([])
  const clientesResultados = ref<ClienteLite[]>([])
  const loading = ref(false)
  const buscandoCliente = ref(false)

  const productoForm = reactive(nuevoProductoForm())
  const ventaForm = reactive(nuevaVentaForm())

  const productoSel = computed(() => inventario.value.find((p) => p._id === ventaForm.productoId) || null)

  /** Applied unit price: from inventory when automatic, typed when manual. */
  const precioAplicado = computed(() => {
    if (ventaForm.precioModo === 'manual') return Number(ventaForm.precioUnitario) || 0
    return Number(productoSel.value?.precio) || 0
  })
  const subtotal = computed(() => precioAplicado.value * (Number(ventaForm.cantidad) || 0))
  const envioAplica = computed(() => ventaForm.metodoEntrega === 'envio')
  const total = computed(() => subtotal.value + (envioAplica.value ? Number(ventaForm.valorEnvio) || 0 : 0))
  const saldoCredito = computed(() =>
    ventaForm.esCredito ? Math.max(total.value - (Number(ventaForm.abono) || 0), 0) : 0,
  )
  const cuotasSuman = computed(() => ventaForm.cuotas.reduce((a, c) => a + (Number(c.monto) || 0), 0))

  async function loadAll() {
    loading.value = true
    try {
      const [inv, vts, rec, us] = await Promise.all([
        adminApi.getData('v1/ventas-productos/inventario'),
        adminApi.getData('v1/ventas-productos?limit=50'),
        adminApi.getData('v1/ventas-productos/recordatorios?dias=30'),
        adminApi.getUsers().catch(() => ({ users: [] })),
      ])
      inventario.value = inv.items || []
      ventas.value = vts.items || []
      recordatorios.value = rec.items || []
      vendedores.value = us.users || us || []
    } finally {
      loading.value = false
    }
  }

  let clienteTimer: ReturnType<typeof setTimeout> | null = null
  function buscarCliente(q: string) {
    if (clienteTimer) clearTimeout(clienteTimer)
    if (!q || q.trim().length < 2) {
      clientesResultados.value = []
      buscandoCliente.value = false
      return
    }
    // Flagged before the debounce so the form does not flash "sin resultados"
    // while the request is still pending.
    buscandoCliente.value = true
    clienteTimer = setTimeout(async () => {
      try {
        const res = await adminApi.getData(`v1/ventas-productos/clientes?q=${encodeURIComponent(q.trim())}`)
        clientesResultados.value = res.clientes || []
      } finally {
        buscandoCliente.value = false
      }
    }, 300)
  }

  /** Register a master client from the sale form and return it ready to select. */
  async function crearCliente(payload: NuevoClientePayload): Promise<ClienteLite> {
    const res = await adminApi.postData('v1/ventas-productos/clientes', payload)
    const cliente = res.cliente as ClienteLite
    clientesResultados.value = [cliente]
    return cliente
  }

  async function crearProducto() {
    const res = await adminApi.postData('v1/ventas-productos/inventario', { ...productoForm })
    if (res.item) inventario.value.push(res.item)
    Object.assign(productoForm, nuevoProductoForm())
  }

  async function toggleProducto(p: ProductoInventario) {
    const res = await adminApi.patchData(`v1/ventas-productos/inventario/${p._id}`, { activo: !p.activo })
    if (res.item) p.activo = res.item.activo
  }

  async function crearVenta() {
    const payload = {
      ...ventaForm,
      precioUnitario: precioAplicado.value,
      abono: ventaForm.esCredito ? Number(ventaForm.abono) || 0 : 0,
      cuotas: ventaForm.esCredito ? ventaForm.cuotas : [],
    }
    const res = await adminApi.postData('v1/ventas-productos', payload)
    Object.assign(ventaForm, nuevaVentaForm())
    clientesResultados.value = []
    await loadAll()
    return res
  }

  // Wrapped in reactive() so that when the whole object is handed to child
  // components as a single prop, its refs and computeds auto-unwrap in their
  // templates (nested refs on a plain prop object would not).
  return reactive({
    inventario, ventas, recordatorios, vendedores, clientesResultados,
    loading, buscandoCliente, productoForm, ventaForm, productoSel,
    precioAplicado, subtotal, envioAplica, total, saldoCredito, cuotasSuman,
    loadAll, buscarCliente, crearCliente, crearProducto, toggleProducto, crearVenta,
  })
}
