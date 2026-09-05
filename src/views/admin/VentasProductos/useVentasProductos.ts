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
  pagada?: boolean
}

export type VentaEstadoPago = 'pendiente' | 'parcial' | 'pagado'

export const METODOS_ABONO = ['efectivo', 'transferencia', 'tarjeta', 'deposito', 'otro'] as const
export type MetodoAbono = (typeof METODOS_ABONO)[number]

/** One payment against a sale, as the API returns it. */
export interface Abono {
  _id: string
  monto: number
  fecha: string
  metodo: MetodoAbono
  referencia: string
  notas: string
  registradoPorNombre: string
  createdAt: string
}

export interface Venta {
  _id: string
  fecha: string
  clienteNombre: string
  productoNombre: string
  cantidad: number
  metodoPago: string
  total: number
  valorPagado: number
  saldo: number
  estadoPago: VentaEstadoPago
  esCredito: boolean
  abonos: Abono[]
  cuotas: Cuota[]
  vendedorNombre: string
}

/** Totals for the whole filtered set, not just the page of rows on screen. */
export interface ResumenVentas {
  ventas: number
  total: number
  cobrado: number
  pendiente: number
  conSaldo: number
}

export type FiltroCobro = 'todas' | 'con_saldo' | 'pagado'

export function nuevoAbonoForm() {
  return {
    monto: 0,
    fecha: new Date().toISOString().slice(0, 10),
    metodo: 'efectivo' as MetodoAbono,
    referencia: '',
    notas: '',
  }
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
  const ventas = ref<Venta[]>([])
  const resumen = ref<ResumenVentas>({ ventas: 0, total: 0, cobrado: 0, pendiente: 0, conSaldo: 0 })
  const filtroCobro = ref<FiltroCobro>('todas')
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

  function queryFiltro() {
    if (filtroCobro.value === 'con_saldo') return '&estadoPago=con_saldo'
    if (filtroCobro.value === 'pagado') return '&estadoPago=pagado'
    return ''
  }

  /** Reload only the sales list — a payment does not change stock or sellers. */
  async function recargarVentas() {
    const vts = await adminApi.getData(`v1/ventas-productos?limit=50${queryFiltro()}`)
    ventas.value = vts.items || []
    resumen.value = vts.resumen || resumen.value
  }

  async function setFiltroCobro(valor: FiltroCobro) {
    filtroCobro.value = valor
    await recargarVentas()
  }

  async function loadAll() {
    loading.value = true
    try {
      const [inv, vts, rec, us] = await Promise.all([
        adminApi.getData('v1/ventas-productos/inventario'),
        adminApi.getData(`v1/ventas-productos?limit=50${queryFiltro()}`),
        adminApi.getData('v1/ventas-productos/recordatorios?dias=30'),
        adminApi.getUsers().catch(() => ({ users: [] })),
      ])
      inventario.value = inv.items || []
      ventas.value = vts.items || []
      resumen.value = vts.resumen || resumen.value
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

  /**
   * Record money received against a sale. The reminders list is refreshed too:
   * settling a balance is exactly what should take a client off the chase list.
   */
  async function registrarAbono(ventaId: string, payload: ReturnType<typeof nuevoAbonoForm>) {
    const res = await adminApi.postData(`v1/ventas-productos/${ventaId}/abonos`, payload)
    await loadAll()
    return res.item as Venta
  }

  /** Undo a payment entered wrong — the correction half of editing pagos. */
  async function eliminarAbono(ventaId: string, abonoId: string) {
    const res = await adminApi.deleteData(`v1/ventas-productos/${ventaId}/abonos/${abonoId}`)
    await loadAll()
    return res.item as Venta
  }

  // Wrapped in reactive() so that when the whole object is handed to child
  // components as a single prop, its refs and computeds auto-unwrap in their
  // templates (nested refs on a plain prop object would not).
  return reactive({
    inventario, ventas, resumen, filtroCobro, recordatorios, vendedores, clientesResultados,
    loading, buscandoCliente, productoForm, ventaForm, productoSel,
    precioAplicado, subtotal, envioAplica, total, saldoCredito, cuotasSuman,
    loadAll, recargarVentas, setFiltroCobro, buscarCliente, crearCliente, crearProducto,
    toggleProducto, crearVenta, registrarAbono, eliminarAbono,
  })
}
