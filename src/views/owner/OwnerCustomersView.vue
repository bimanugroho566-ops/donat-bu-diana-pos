<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useTransactionStore } from '../../stores/transactionStore'
import { 
  Users, 
  Search, 
  Phone, 
  MessageCircle, 
  Calendar, 
  ShoppingBag,
  UserCheck,
  ShieldAlert
} from 'lucide-vue-next'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import StatCard from '../../components/common/StatCard.vue'

const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const loadError = ref('')

onMounted(async () => {
  try {
    await authStore.loadCustomers()
  } catch (error) {
    loadError.value = error.message
  }
})

const searchQuery = ref('')

const customers = computed(() => authStore.allCustomers)

const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    return c.name.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           (c.phone && c.phone.includes(q))
  })
})

function getCustomerOrderCount(customerId) {
  return transactionStore.allTransactions.filter(
    transaction => transaction.customerId === customerId
  ).length
}

function cleanPhoneForWa(phone) {
  if (!phone) return ''
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}
</script>

<template>
  <div class="space-y-6">
    <p v-if="loadError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      {{ loadError }}
    </p>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Data Pelanggan Terdaftar</h1>
        <p class="text-xs text-slate-500 mt-1">Daftar konsumen yang telah mendaftar akun di Donat Bu Diana.</p>
      </div>
      <BaseBadge variant="primary" size="md">
        {{ customers.length }} Akun Pelanggan Aktif
      </BaseBadge>
    </div>

    <!-- KPI Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Total Pelanggan Terdaftar"
        :value="customers.length + ' Orang'"
        subtext="Konsumen berakun member"
        color="amber"
      >
        <template #icon><Users class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Dengan Kontak WhatsApp"
        :value="customers.filter(c => c.phone && c.phone !== '-').length + ' Nomor'"
        subtext="Siap dikirimkan promo donat"
        color="emerald"
      >
        <template #icon><Phone class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Akses Mandiri"
        value="Aktif"
        subtext="Bisa cek katalog & lacak nota"
        color="blue"
      >
        <template #icon><UserCheck class="w-6 h-6" /></template>
      </StatCard>
    </div>

    <!-- Search Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
      <div class="w-full md:w-80">
        <BaseInput
          v-model="searchQuery"
          placeholder="Cari nama, email, atau no HP..."
        >
          <template #prefix><Search class="w-4 h-4" /></template>
        </BaseInput>
      </div>
    </div>

    <!-- Customers Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
            <tr>
              <th class="py-4 px-4">Pelanggan</th>
              <th class="py-4 px-3">Email</th>
              <th class="py-4 px-3">Nomor Kontak / WA</th>
              <th class="py-4 px-3 text-center">Riwayat Belanja</th>
              <th class="py-4 px-3 text-center">Status Role</th>
              <th class="py-4 px-4 text-right">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-400">
                <Users class="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p class="font-bold">Belum Ada Pelanggan yang Mendaftar</p>
                <p class="text-[11px] mt-1">Pelanggan baru dapat mendaftar melalui form di halaman login.</p>
              </td>
            </tr>

            <tr
              v-for="cust in filteredCustomers"
              :key="cust.id"
              class="hover:bg-amber-50/30 transition-colors"
            >
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="cust.avatar"
                    :alt="cust.name"
                    class="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 shrink-0"
                  />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block">{{ cust.name }}</span>
                    <span class="font-mono text-[10px] text-slate-400">{{ cust.id }}</span>
                  </div>
                </div>
              </td>

              <td class="py-3.5 px-3 font-mono font-medium text-slate-700">
                {{ cust.email }}
              </td>

              <td class="py-3.5 px-3 text-slate-700 font-medium">
                {{ cust.phone && cust.phone !== '-' ? cust.phone : 'Belum ditambahkan' }}
              </td>

              <td class="py-3.5 px-3 text-center">
                <span class="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <ShoppingBag class="w-3 h-3 text-amber-600" />
                  {{ getCustomerOrderCount(cust.id) }} pesanan
                </span>
              </td>

              <td class="py-3.5 px-3 text-center">
                <BaseBadge size="sm" variant="success">Pelanggan</BaseBadge>
              </td>

              <td class="py-3.5 px-4 text-right">
                <a
                  v-if="cust.phone && cust.phone !== '-'"
                  :href="`https://wa.me/${cleanPhoneForWa(cust.phone)}?text=Halo%20kak%20${encodeURIComponent(cust.name)},%20terima%20kasih%20telah%20menjadi%20pelanggan%20Donat%20Bu%20Diana!`"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition-colors"
                >
                  <MessageCircle class="w-3.5 h-3.5" />
                  Kirim WA Promo
                </a>
                <span v-else class="text-[11px] text-slate-400 italic">Tanpa WA</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
