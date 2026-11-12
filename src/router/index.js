import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import LoginView from '../views/auth/LoginView.vue'
import OwnerDashboardView from '../views/owner/OwnerDashboardView.vue'
import OwnerProductsView from '../views/owner/OwnerProductsView.vue'
import OwnerReportsView from '../views/owner/OwnerReportsView.vue'
import OwnerCustomersView from '../views/owner/OwnerCustomersView.vue'
import CashierPosView from '../views/cashier/CashierPosView.vue'
import CashierOrdersView from '../views/cashier/CashierOrdersView.vue'
import CustomerCatalogView from '../views/customer/CustomerCatalogView.vue'
import CustomerTrackView from '../views/customer/CustomerTrackView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: () => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return '/login'
      if (authStore.currentRole === 'pemilik') return '/owner/dashboard'
      if (authStore.currentRole === 'kasir') return '/cashier/pos'
      return '/catalog'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Masuk - Donat Bu Diana' }
  },

  // Role: Pelanggan & Publik
  {
    path: '/catalog',
    name: 'CustomerCatalog',
    component: CustomerCatalogView,
    meta: { title: 'Katalog Donat - Donat Bu Diana' }
  },
  {
    path: '/track',
    name: 'CustomerTrack',
    component: CustomerTrackView,
    meta: { title: 'Lacak Pesanan - Donat Bu Diana' }
  },

  // Role: Pemilik (Owner / Admin)
  {
    path: '/owner/dashboard',
    name: 'OwnerDashboard',
    component: OwnerDashboardView,
    meta: { requiresAuth: true, roles: ['pemilik'], title: 'Ringkasan Pemilik - Donat Bu Diana' }
  },
  {
    path: '/owner/products',
    name: 'OwnerProducts',
    component: OwnerProductsView,
    meta: { requiresAuth: true, roles: ['pemilik'], title: 'Master Donat - Donat Bu Diana' }
  },
  {
    path: '/owner/reports',
    name: 'OwnerReports',
    component: OwnerReportsView,
    meta: { requiresAuth: true, roles: ['pemilik'], title: 'Laporan Penjualan - Donat Bu Diana' }
  },
  {
    path: '/owner/customers',
    name: 'OwnerCustomers',
    component: OwnerCustomersView,
    meta: { requiresAuth: true, roles: ['pemilik'], title: 'Data Pelanggan - Donat Bu Diana' }
  },

  // Role: Kasir
  {
    path: '/cashier/pos',
    name: 'CashierPos',
    component: CashierPosView,
    meta: { requiresAuth: true, roles: ['kasir', 'pemilik'], title: 'Kasir POS - Donat Bu Diana' }
  },
  {
    path: '/cashier/orders',
    name: 'CashierOrders',
    component: CashierOrdersView,
    meta: { requiresAuth: true, roles: ['kasir', 'pemilik'], title: 'Daftar Pesanan - Donat Bu Diana' }
  },

  // 404 Catch All
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { title: '404 - Halaman Tidak Ditemukan' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard (Role-based access control - Rubrik A3 & QA-03)
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  try {
    await authStore.initialize()
  } catch (error) {
    console.error(error)
    window.alert(error.message || 'Gagal memulihkan sesi akun.')
    return '/login'
  }

  if (to.meta.title) document.title = to.meta.title

  if (to.path === '/login' && authStore.isAuthenticated) {
    if (authStore.currentRole === 'pemilik') return '/owner/dashboard'
    if (authStore.currentRole === 'kasir') return '/cashier/pos'
    return '/catalog'
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles?.length && !to.meta.roles.includes(authStore.currentRole)) {
    const userRole = authStore.currentRole
    window.alert(`Akses ditolak. Role ${userRole} tidak memiliki izin membuka halaman ${to.path}.`)
    if (userRole === 'kasir') return '/cashier/pos'
    if (userRole === 'pemilik') return '/owner/dashboard'
    return '/catalog'
  }

  return true
})

export default router
