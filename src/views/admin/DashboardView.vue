<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import { adminApi } from '@/services/admin.api';

const authStore = useAuthStore();
const toastStore = useToastStore();
const activeTab = ref<'payments' | 'users'>('payments');

// Payments State
const payments = ref<any[]>([]);
const loadingPayments = ref(false);
const creatingPayment = ref(false);
const errorPayment = ref('');

const paymentForm = ref({
  amount: 0,
  amountWithoutTax: 0,
  amountWithTax: 0,
  tax: 0,
  reference: '',
  customerName: '',
  customerEmail: '',
});

const displayAmount = ref<number | null>(null);

// Users State
const users = ref<any[]>([]);
const loadingUsers = ref(false);
const creatingUser = ref(false);
const errorUser = ref('');

const userForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'admin',
});

const showEditUserModal = ref(false);
const editingUserId = ref<string | null>(null);
const editUserForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'admin',
});
const updatingUser = ref(false);
const updateSuccess = ref(false);

const showDeleteModal = ref(false);
const userToDelete = ref<any>(null);

// Calculate total payment
const calculateTotals = () => {
  const total = displayAmount.value || 0;
  const cents = Math.round(total * 100);

  // Payphone expects these in cents
  paymentForm.value.amount = cents;
  paymentForm.value.amountWithoutTax = cents;
  paymentForm.value.amountWithTax = 0;
  paymentForm.value.tax = 0;
};

// API Calls - Payments
const fetchPayments = async () => {
  loadingPayments.value = true;
  try {
    const data = await adminApi.getPayments();
    payments.value = data.payments || [];
  } catch (err: any) {
    errorPayment.value = err.message || 'Error al cargar los pagos';
  } finally {
    loadingPayments.value = false;
  }
};

const handleGenerateLink = async () => {
  calculateTotals();
  creatingPayment.value = true;
  errorPayment.value = '';
  try {
    await adminApi.generateLink({ ...paymentForm.value });
    paymentForm.value = {
      amount: 0,
      amountWithoutTax: 0,
      amountWithTax: 0,
      tax: 0,
      reference: '',
      customerName: '',
      customerEmail: '',
    };
    displayAmount.value = null;
    await fetchPayments();
    toastStore.showNotification('Link de pago generado exitosamente', 'success');
  } catch (err: any) {
    errorPayment.value = err.message || 'Error al generar el link';
  } finally {
    creatingPayment.value = false;
  }
};

const showDeletePaymentModal = ref(false);
const paymentToDelete = ref<any>(null);

const confirmDeletePayment = (payment: any) => {
  if (payment.status === 'paid' || payment.status === 'approved') {
    toastStore.showNotification('No se puede eliminar un link de pago que ya está pagado.', 'warning');
    return;
  }
  paymentToDelete.value = payment;
  showDeletePaymentModal.value = true;
};

const executeDeletePayment = async () => {
  if (!paymentToDelete.value) return;
  try {
    await adminApi.deletePayment(paymentToDelete.value._id);
    showDeletePaymentModal.value = false;
    paymentToDelete.value = null;
    await fetchPayments();
    toastStore.showNotification('Link de pago eliminado exitosamente', 'success');
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al eliminar el link de pago', 'error');
  }
};


// API Calls - Users
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const data = await adminApi.getUsers();
    users.value = data.users || [];
  } catch (err: any) {
    errorUser.value = err.message || 'Error al cargar los usuarios';
  } finally {
    loadingUsers.value = false;
  }
};

const handleSaveUser = async () => {
  creatingUser.value = true;
  errorUser.value = '';
  try {
    await adminApi.createUser({ ...userForm.value });
    toastStore.showNotification('Usuario creado exitosamente', 'success');
    userForm.value = { name: '', email: '', password: '', role: 'admin' };
    await fetchUsers();
  } catch (err: any) {
    errorUser.value = err.message || 'Error al crear el usuario';
  } finally {
    creatingUser.value = false;
  }
};

const handleUpdateUser = async () => {
  if (!editingUserId.value) return;
  updatingUser.value = true;
  try {
    const payload: any = { ...editUserForm.value };
    if (!payload.password) delete payload.password;
    await adminApi.updateUser(editingUserId.value, payload);

    toastStore.showNotification(`Datos de ${editUserForm.value.name} guardados correctamente.`, 'success');
    updateSuccess.value = true;
    await fetchUsers();

    setTimeout(() => {
      updateSuccess.value = false;
      cancelEditUser();
    }, 1500);
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al actualizar', 'error');
  } finally {
    updatingUser.value = false;
  }
};

const startEditUser = (user: any) => {
  editingUserId.value = user._id;
  editUserForm.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
  };
  showEditUserModal.value = true;
};

const cancelEditUser = () => {
  showEditUserModal.value = false;
  editingUserId.value = null;
  editUserForm.value = { name: '', email: '', password: '', role: 'admin' };
};

const confirmDeleteUser = (user: any) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const executeDeleteUser = async () => {
  if (!userToDelete.value) return;
  try {
    await adminApi.deleteUser(userToDelete.value._id);
    showDeleteModal.value = false;
    userToDelete.value = null;
    await fetchUsers();
    toastStore.showNotification('Usuario eliminado exitosamente', 'success');
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al eliminar el usuario', 'error');
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toastStore.showNotification('Link copiado al portapapeles', 'success');
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

onMounted(() => {
  fetchPayments();
  fetchUsers();
});
</script>

<template>
  <div class="dashboard-layout">
    <!-- Background Decorators -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="dashboard-content">
      <header class="dashboard-header glass-panel">
        <div class="brand">
          <span class="logo-box">C</span>
          <div>
            <h1>Panel de Administración</h1>
            <p class="subtitle">Courier Box</p>
          </div>
        </div>
        <button @click="authStore.logout" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </button>
      </header>

      <main class="dashboard-main">
        <div class="tabs glass-panel">
          <button 
            :class="['tab-btn', { active: activeTab === 'payments' }]" 
            @click="activeTab = 'payments'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Links de Pago
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'users' }]" 
            @click="activeTab = 'users'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Gestión de Usuarios
          </button>
        </div>

        <div class="tab-wrapper">
          <transition name="fade" mode="out-in">
            <!-- PAYMENTS TAB -->
            <div v-if="activeTab === 'payments'" key="payments" class="tab-content">
              <div class="grid-layout">
                <!-- Generador -->
                <section class="glass-card generator-section">
                  <div class="card-header">
                    <div class="icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <h2>Generar Nuevo Link</h2>
                  </div>
                  
                  <form @submit.prevent="handleGenerateLink" class="premium-form">
                    <div class="form-row">
                      <div class="form-group">
                        <label>Referencia de Pago *</label>
                        <input type="text" v-model="paymentForm.reference" required placeholder="Ej. WR12345" />
                      </div>
                      <div class="form-group">
                        <label>Monto Total ($) *</label>
                        <div class="input-with-icon">
                          <span>$</span>
                          <input type="number" v-model.number="displayAmount" min="0.01" step="0.01" required placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                    <div class="divider"></div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Nombre del Cliente</label>
                        <input type="text" v-model="paymentForm.customerName" placeholder="Opcional" />
                      </div>
                      <div class="form-group">
                        <label>Correo del Cliente</label>
                        <input type="email" v-model="paymentForm.customerEmail" placeholder="Opcional" />
                      </div>
                    </div>

                    <div v-if="errorPayment" class="error-message">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      {{ errorPayment }}
                    </div>

                    <button type="submit" :disabled="creatingPayment || !displayAmount || displayAmount <= 0" class="submit-btn">
                      <span v-if="!creatingPayment">Crear Link de Pago por ${{ (displayAmount || 0).toFixed(2) }}</span>
                      <span v-else class="loader"></span>
                    </button>
                  </form>
                </section>

                <!-- Historial -->
                <section class="glass-card history-section">
                  <div class="card-header">
                    <div class="icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <h2>Historial Reciente</h2>
                  </div>
                  
                  <div class="table-container">
                    <div v-if="loadingPayments" class="loading-state">
                      <span class="loader"></span>
                      <p>Cargando datos...</p>
                    </div>
                    <div v-else-if="payments.length === 0" class="empty-state">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <p>No hay links generados aún.</p>
                    </div>
                    <table v-else class="premium-table">
                      <thead>
                        <tr>
                          <th>Referencia</th>
                          <th>Cliente / Creado Por</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th class="text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="payment in payments" :key="payment._id">
                          <td>
                            <div class="cell-title">{{ payment.reference }}</div>
                            <div class="cell-subtitle">{{ new Date(payment.createdAt).toLocaleDateString() }}</div>
                          </td>
                          <td>
                            <div class="cell-title">{{ payment.customerName || 'N/A' }}</div>
                            <div class="cell-subtitle">Por: {{ payment.createdBy?.name || 'Sistema' }}</div>
                          </td>
                          <td class="amount">${{ (payment.amount / 100).toFixed(2) }}</td>
                          <td><span :class="['status-badge', payment.status === 'paid' || payment.status === 'approved' ? 'paid' : payment.status]">{{ payment.status === 'paid' || payment.status === 'approved' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : payment.status === 'canceled' ? 'Cancelado' : payment.status }}</span></td>
                          <td class="actions">
                            <a :href="payment.paymentLink" target="_blank" class="action-btn" title="Abrir Link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                            <button @click="copyToClipboard(payment.paymentLink)" class="action-btn copy" title="Copiar Link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                            <button v-if="payment.status !== 'paid' && payment.status !== 'approved'" @click="confirmDeletePayment(payment)" class="action-btn delete-btn" title="Eliminar Link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <!-- USERS TAB -->
            <div v-else-if="activeTab === 'users'" key="users" class="tab-content">
              <div class="grid-layout">
                <!-- Creador de usuarios -->
                <section class="glass-card generator-section">
                  <div class="card-header">
                    <div class="icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                    <h2>Registrar Miembro</h2>
                  </div>
                  
                  <form @submit.prevent="handleSaveUser" class="premium-form">
                    <div class="form-group full-width">
                      <label>Nombre Completo <span class="required-tag">*</span></label>
                      <input type="text" v-model="userForm.name" required placeholder="Ej. Ana Lucía" />
                    </div>
                    
                    <div class="form-row">
                      <div class="form-group">
                        <label>Correo Electrónico <span class="required-tag">*</span></label>
                        <input type="email" v-model="userForm.email" required placeholder="ejemplo@courierbox.com" />
                      </div>
                      
                      <div class="form-group">
                        <label>Contraseña <span class="required-tag">*</span></label>
                        <input type="password" v-model="userForm.password" required placeholder="********" />
                      </div>
                    </div>

                    <div class="form-group full-width">
                      <label>Rol en el Sistema</label>
                      <div class="select-wrapper">
                        <select v-model="userForm.role" class="custom-select">
                          <option value="admin">Administrador Total</option>
                          <option value="user">Usuario Regular</option>
                        </select>
                        <div class="select-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                      </div>
                    </div>

                    <div v-if="errorUser" class="error-message">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      {{ errorUser }}
                    </div>

                    <div class="form-actions-row">
                      <button type="submit" :disabled="creatingUser" class="submit-btn flex-1">
                        <span v-if="!creatingUser">Crear Usuario</span>
                        <span v-else class="loader"></span>
                      </button>
                    </div>
                  </form>
                </section>

                <!-- Historial de Usuarios -->
                <section class="glass-card history-section">
                  <div class="card-header">
                    <div class="icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <h2>Equipo Registrado</h2>
                  </div>

                  <div class="table-container">
                    <div v-if="loadingUsers" class="loading-state">
                      <span class="loader"></span>
                      <p>Cargando datos...</p>
                    </div>
                    <div v-else-if="users.length === 0" class="empty-state">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <p>No hay usuarios registrados aún.</p>
                    </div>
                    <table v-else class="premium-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Rol</th>
                          <th class="date-col">Registro</th>
                          <th class="text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="user in users" :key="user._id">
                          <td>
                            <div class="user-info">
                              <div class="avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                              <div>
                                <div class="cell-title">{{ user.name }}</div>
                                <div class="cell-subtitle">{{ user.email }}</div>
                              </div>
                            </div>
                          </td>
                          <td><span :class="['role-badge', user.role]">{{ user.role === 'admin' ? 'Admin' : 'Usuario' }}</span></td>
                          <td class="date-col">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
                          <td class="actions">
                            <button @click="startEditUser(user)" class="action-btn" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button v-if="user._id !== authStore.currentUser?.userId" @click="confirmDeleteUser(user)" class="action-btn delete-btn" title="Eliminar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </transition>
        </div>
      </main>
    </div>

    <!-- Modal de Confirmación -->
    <transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-content glass-card">
          <div class="modal-icon warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3>Confirmar Eliminación</h3>
          <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ userToDelete?.name }}</strong>? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button @click="showDeleteModal = false" class="cancel-btn">Cancelar</button>
            <button @click="executeDeleteUser" class="delete-confirm-btn">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal de Confirmación para Pago -->
    <transition name="fade">
      <div v-if="showDeletePaymentModal" class="modal-overlay">
        <div class="modal-content glass-card">
          <div class="modal-icon warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3>Confirmar Eliminación</h3>
          <p>¿Estás seguro de que deseas eliminar el link de pago <strong>{{ paymentToDelete?.reference }}</strong>? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button @click="showDeletePaymentModal = false" class="cancel-btn">Cancelar</button>
            <button @click="executeDeletePayment" class="delete-confirm-btn">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal para Editar Usuario -->
    <transition name="fade">
      <div v-if="showEditUserModal" class="modal-overlay">
        <div class="modal-content glass-card form-modal">
          <div class="modal-header with-subtitle">
            <div class="header-titles">
              <h3>Actualizar Perfil</h3>
              <p class="modal-subtitle">Modifica la información y accesos del miembro.</p>
            </div>
            <button @click="cancelEditUser" class="close-btn">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form @submit.prevent="handleUpdateUser" class="premium-form text-left">
            <div class="form-group full-width">
              <label>Nombres Completos <span class="required-tag">*</span></label>
              <div class="input-with-icon">
                <i class="fa-solid fa-user input-icon"></i>
                <input type="text" v-model="editUserForm.name" required placeholder="Ej. Ana Lucía" />
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>Correo de Acceso <span class="required-tag">*</span></label>
              <div class="input-with-icon">
                <i class="fa-solid fa-envelope input-icon"></i>
                <input type="email" v-model="editUserForm.email" required placeholder="ejemplo@courierbox.com" />
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>Nueva Contraseña <span class="optional-tag">Opcional</span></label>
              <div class="input-with-icon">
                <i class="fa-solid fa-lock input-icon"></i>
                <input type="password" v-model="editUserForm.password" placeholder="Solo si deseas cambiarla..." />
              </div>
            </div>

            <div class="form-group full-width">
              <label>Privilegios del Sistema</label>
              <div class="select-wrapper">
                <select v-model="editUserForm.role" class="custom-select">
                  <option value="admin">Administrador Total</option>
                  <option value="user">Usuario Regular</option>
                </select>
                <div class="select-icon">
                  <i class="fa-solid fa-chevron-down"></i>
                </div>
              </div>
            </div>

            <div class="form-actions-row">
              <button type="button" @click="cancelEditUser" class="cancel-btn">Cancelar</button>
              <button type="submit" :disabled="updatingUser || updateSuccess" :class="['submit-btn flex-1', { 'success-state': updateSuccess }]">
                <span v-if="updateSuccess"><i class="fa-solid fa-check"></i> ¡Guardado!</span>
                <span v-else-if="!updatingUser">Guardar Cambios</span>
                <span v-else class="loader"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;

/* Layout & Background */
.dashboard-layout {
  position: relative;
  min-height: 100vh;
  background-color: $ink-1000;
  color: $fg-dark;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.bg-shape {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;
}

.shape-1 {
  width: 500px;
  height: 500px;
  background: $brand-orange-glow;
  top: -150px;
  right: -150px;
}

.shape-2 {
  width: 600px;
  height: 600px;
  background: rgba(#16223D, 0.6);
  bottom: -200px;
  left: -200px;
}

.shape-3 {
  width: 300px;
  height: 300px;
  background: rgba($brand-orange, 0.1);
  top: 40%;
  left: 30%;
}

/* Common Panels */
.glass-panel {
  background: rgba($ink-900, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba($ink-400, 0.2);
}

.glass-card {
  background: rgba($ink-900, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* Header */
.dashboard-header {
  padding: 1.25rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 24px 24px;
  border-top: none;
  margin-bottom: 2rem;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;

    .logo-box {
      background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
      color: $ink-1000;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.25rem;
    }

    h1 {
      font-size: 1.15rem;
      color: $fg-dark;
      margin: 0 0 0.15rem 0;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .subtitle {
      font-size: 0.8rem;
      color: $muted-dark;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  .logout-btn {
    background: rgba($signal-red, 0.1);
    color: #ff8a8f;
    border: 1px solid rgba($signal-red, 0.2);
    padding: 0.6rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($signal-red, 0.2);
      transform: translateY(-1px);
    }
  }
}

/* Main Area */
.dashboard-main {
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Tabs */
.tabs {
  display: inline-flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 16px;
  align-self: center;

  .tab-btn {
    background: transparent;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: $muted-dark;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;

    svg {
      opacity: 0.7;
    }

    &:hover {
      color: $fg-dark;
      background: rgba($ink-500, 0.15);
    }

    &.active {
      background: rgba($brand-orange, 0.15);
      color: $brand-orange;
      border: 1px solid rgba($brand-orange, 0.3);

      svg {
        opacity: 1;
        stroke: $brand-orange;
      }
    }
  }
}

.tab-wrapper {
  position: relative;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba($ink-400, 0.2);
  padding-bottom: 1rem;

  .icon-wrapper {
    background: rgba($brand-orange, 0.15);
    color: $brand-orange;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h2 {
    font-size: 1.15rem;
    margin: 0;
    font-weight: 600;
  }
}

/* Forms */
.premium-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;

    label {
      font-size: 0.85rem;
      font-weight: 500;
      color: $ink-200;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .optional-tag {
        font-size: 0.7rem;
        background: rgba($ink-500, 0.2);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        color: $ink-400;
        font-weight: 600;
      }

      .required-tag {
        color: $signal-red;
        font-weight: bold;
        margin-left: 0.25rem;
      }
    }

    input,
    .custom-select {
      background: rgba($ink-1000, 0.5);
      border: 1px solid rgba($ink-400, 0.4);
      color: $fg-dark;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      width: 100%;

      &::placeholder {
        color: $ink-500;
      }

      &:focus {
        outline: none;
        border-color: $brand-orange;
        box-shadow: 0 0 0 3px rgba($brand-orange, 0.15);
        background: rgba($ink-1000, 0.8);
      }
    }

    .disabled-input {
      background: rgba($ink-800, 0.4);
      color: $brand-orange;
      font-weight: 700;
      border-color: rgba($brand-orange, 0.3);
      cursor: not-allowed;
    }

    .input-with-icon {
      position: relative;

      span,
      .input-icon,
      i.input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: $ink-400;
        font-size: 1rem;
        font-weight: 600;
        transition: color 0.3s ease;
      }

      input {
        padding-left: 2.75rem;

        &:focus+.input-icon,
        &:focus~.input-icon {
          color: $brand-orange;
        }
      }
    }

    small {
      margin-top: 0.4rem;
      font-size: 0.75rem;
      color: $ink-400;
    }
  }

  .select-wrapper {
    position: relative;

    .custom-select {
      appearance: none;
      padding-right: 2.5rem;
      cursor: pointer;
    }

    .select-icon {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: $ink-400;
    }
  }

  .divider {
    height: 1px;
    background: rgba($ink-400, 0.2);
    margin: 0.5rem 0;
  }
}

/* Buttons */
.submit-btn {
  background: $brand-orange;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 44px;

  &:hover:not(:disabled) {
    background: lighten($brand-orange, 5%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &.success-state {
    background: #2BBB92;
    /* Verde éxito */
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(#2BBB92, 0.3);

    i {
      margin-right: 0.5rem;
      font-size: 1.1rem;
    }
  }

  .loader {
    width: 20px;
    height: 20px;
    border: 3px solid rgba($ink-1000, 0.3);
    border-bottom-color: $ink-1000;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }
}

/* Tables */
.table-container {
  overflow-x: auto;
  margin: 0 -1rem;
  padding: 0 1rem;
}

.premium-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba($ink-400, 0.15);
  }

  th {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $ink-400;
    font-weight: 600;
  }

  .text-right {
    text-align: right;
  }

  .cell-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: $fg-dark;
    margin-bottom: 0.2rem;
  }

  .cell-subtitle {
    font-size: 0.8rem;
    color: $ink-400;
  }

  .amount {
    font-weight: 700;
    color: $fg-dark;
  }

  .date-col {
    font-size: 0.85rem;
    color: $ink-300;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

/* Badges */
.status-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;

  &.pending {
    background: rgba(#FFB347, 0.15);
    color: #FFB347;
    border: 1px solid rgba(#FFB347, 0.3);
  }

  &.paid {
    background: rgba(#2BBB92, 0.15);
    color: #2BBB92;
    border: 1px solid rgba(#2BBB92, 0.3);
  }

  &.canceled {
    background: rgba(#E5484D, 0.15);
    color: #E5484D;
    border: 1px solid rgba(#E5484D, 0.3);
  }
}

.role-badge {
  @extend .status-badge;
  background: rgba($ink-400, 0.2);
  color: $ink-200;
  border: 1px solid rgba($ink-400, 0.3);

  &.admin {
    background: rgba($signal-blue, 0.15);
    color: #6db6ff;
    border-color: rgba($signal-blue, 0.3);
  }
}

/* User Info Layout */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, $ink-500, $ink-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $fg-dark;
  }
}

/* Action Buttons */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  background: rgba($ink-500, 0.2);
  border: 1px solid rgba($ink-500, 0.3);
  color: $ink-200;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  &:hover {
    background: rgba($ink-400, 0.3);
    color: $fg-dark;
  }

  &.copy {
    background: rgba($brand-orange, 0.15);
    border-color: rgba($brand-orange, 0.3);
    color: $brand-orange;

    &:hover {
      background: rgba($brand-orange, 0.25);
      color: $brand-orange-soft;
    }
  }
}

/* States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: $ink-400;

  svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  padding: 0.875rem;
  border-radius: 10px;
  font-size: 0.85rem;
  border: 1px solid rgba($signal-red, 0.2);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Modals & New Utilities */
.form-actions-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.flex-1 {
  flex: 1;
}

.cancel-btn {
  background: transparent;
  color: $ink-300;
  border: 1px solid rgba($ink-400, 0.4);
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($ink-500, 0.2);
    color: $fg-dark;
  }
}

.action-btn.delete-btn {
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border-color: rgba($signal-red, 0.2);

  &:hover {
    background: rgba($signal-red, 0.2);
    color: #ffb3b6;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($ink-1000, 0.8);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  max-width: 400px;
  width: 100%;
  text-align: center;
  padding: 2.5rem 2rem;

  &.form-modal {
    max-width: 500px;
    padding: 2rem;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    &.with-subtitle {
      align-items: flex-start;

      .header-titles {
        text-align: left;
      }
    }

    h3 {
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: $ink-400;
      margin: 0.25rem 0 0 0;
      font-weight: 400;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: $ink-400;
    cursor: pointer;
    font-size: 1.25rem;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: $fg-dark;
    }
  }

  h3 {
    margin: 1rem 0 0.5rem;
    font-size: 1.25rem;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 2rem;
  }
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  &.warning {
    background: rgba($signal-red, 0.15);
    color: #ff8a8f;
  }
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  .delete-confirm-btn {
    background: $signal-red;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: darken($signal-red, 10%);
    }
  }
}
</style>
