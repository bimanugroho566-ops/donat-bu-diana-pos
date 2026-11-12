<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Package, 
  FileText, 
  Store, 
  Search, 
  LogOut, 
  UserCheck,
  Users
} from 'lucide-vue-next'
import BaseBadge from '../common/BaseBadge.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)
const currentRole = computed(() => authStore.currentRole)

async function handleLogout() {
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    window.alert(error.message)
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#fffdf9]/95 backdrop-blur-md border-b border-[#e7dccb] shadow-sm">
    <!-- Main Navigation Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4b3022] to-[#b18a53] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-white">
            <img src="/donut-icon.svg" alt="" class="w-8 h-8 object-contain" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-base font-extrabold text-slate-900 tracking-tight">Donat Bu Diana</span>
              <BaseBadge size="sm" :variant="currentRole === 'pemilik' ? 'primary' : (currentRole === 'kasir' ? 'success' : 'default')">
                {{ currentUser ? currentRole : 'Tamu' }}
              </BaseBadge>
            </div>
            <p class="text-[10px] text-slate-500 font-medium leading-none">Homemade Donuts & Coffee</p>
          </div>
        </router-link>

        <!-- Role Nav Links -->
        <nav class="hidden md:flex items-center gap-1">
          <!-- Role: Pemilik -->
          <template v-if="currentRole === 'pemilik'">
            <router-link
              to="/owner/dashboard"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/owner/dashboard' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <LayoutDashboard class="w-4 h-4" />
              Ringkasan
            </router-link>
            <router-link
              to="/owner/products"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/owner/products' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <Package class="w-4 h-4" />
              Master Donat
            </router-link>
            <router-link
              to="/owner/reports"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/owner/reports' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <FileText class="w-4 h-4" />
              Laporan Penjualan
            </router-link>
            <router-link
              to="/owner/customers"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/owner/customers' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <Users class="w-4 h-4" />
              Data Pelanggan
            </router-link>
          </template>

          <!-- Role: Kasir -->
          <template v-else-if="currentRole === 'kasir'">
            <router-link
              to="/cashier/pos"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/cashier/pos' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <Store class="w-4 h-4" />
              Kasir POS
            </router-link>
            <router-link
              to="/cashier/orders"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/cashier/orders' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <FileText class="w-4 h-4" />
              Daftar Pesanan
            </router-link>
          </template>

          <!-- Role: Pelanggan -->
          <template v-else>
            <router-link
              to="/catalog"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/catalog' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <ShoppingBag class="w-4 h-4" />
              Katalog Donat
            </router-link>
            <router-link
              to="/track"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              :class="$route.path === '/track' ? 'bg-[#f1e4ce] text-[#573a24]' : 'text-[#766557] hover:text-[#35251c] hover:bg-[#f5efe5]'"
            >
              <Search class="w-4 h-4" />
              Lacak Pesanan
            </router-link>
          </template>
        </nav>

        <!-- User Profile & Action -->
        <div class="flex items-center gap-3">
          <div v-if="currentUser" class="flex items-center gap-2.5">
            <img
              :src="currentUser.avatar"
              :alt="currentUser.name"
              class="w-9 h-9 rounded-full bg-amber-100 border border-amber-200"
            />
            <div class="hidden lg:block text-left">
              <p class="text-xs font-bold text-slate-800 leading-tight">{{ currentUser.name }}</p>
              <p class="text-[10px] text-slate-500 capitalize">{{ currentUser.role }}</p>
            </div>

            <button
              type="button"
              class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              title="Keluar / Ganti Akun"
              @click="handleLogout"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
          <div v-else>
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
            >
              <UserCheck class="w-4 h-4" />
              Masuk
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sub-Navigation -->
    <div class="md:hidden border-t border-[#e9dfd0] px-4 py-2 flex items-center justify-around bg-[#f8f3ea] text-xs">
      <template v-if="currentRole === 'pemilik'">
        <router-link to="/owner/dashboard" class="py-1 px-2 font-medium" :class="$route.path === '/owner/dashboard' ? 'text-amber-700 font-bold' : 'text-slate-600'">Ringkasan</router-link>
        <router-link to="/owner/products" class="py-1 px-2 font-medium" :class="$route.path === '/owner/products' ? 'text-amber-700 font-bold' : 'text-slate-600'">Master Donat</router-link>
        <router-link to="/owner/reports" class="py-1 px-2 font-medium" :class="$route.path === '/owner/reports' ? 'text-amber-700 font-bold' : 'text-slate-600'">Laporan</router-link>
        <router-link to="/owner/customers" class="py-1 px-2 font-medium" :class="$route.path === '/owner/customers' ? 'text-amber-700 font-bold' : 'text-slate-600'">Pelanggan</router-link>
      </template>
      <template v-else-if="currentRole === 'kasir'">
        <router-link to="/cashier/pos" class="py-1 px-2 font-medium" :class="$route.path === '/cashier/pos' ? 'text-amber-700 font-bold' : 'text-slate-600'">Kasir POS</router-link>
        <router-link to="/cashier/orders" class="py-1 px-2 font-medium" :class="$route.path === '/cashier/orders' ? 'text-amber-700 font-bold' : 'text-slate-600'">Daftar Pesanan</router-link>
      </template>
      <template v-else>
        <router-link to="/catalog" class="py-1 px-2 font-medium" :class="$route.path === '/catalog' ? 'text-amber-700 font-bold' : 'text-slate-600'">Katalog</router-link>
        <router-link to="/track" class="py-1 px-2 font-medium" :class="$route.path === '/track' ? 'text-amber-700 font-bold' : 'text-slate-600'">Lacak Nota</router-link>
      </template>
    </div>
  </header>
</template>
