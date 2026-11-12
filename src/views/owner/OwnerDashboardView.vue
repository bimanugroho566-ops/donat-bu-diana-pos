<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/productStore'
import { useTransactionStore } from '../../stores/transactionStore'
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Package, 
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Trash2
} from 'lucide-vue-next'
import StatCard from '../../components/common/StatCard.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseButton from '../../components/common/BaseButton.vue'

const router = useRouter()
const productStore = useProductStore()
const transactionStore = useTransactionStore()

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (isoStr) => {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const totalRevenue = computed(() => transactionStore.totalRevenue)
const totalProfit = computed(() => transactionStore.totalProfit)
const totalOrders = computed(() => transactionStore.totalOrders)
const totalProducts = computed(() => productStore.totalProducts)
const lowStockProducts = computed(() => productStore.lowStockProducts)
const topProducts = computed(() => transactionStore.topSellingProducts)
const recentTransactions = computed(() => transactionStore.allTransactions.slice(0, 5))

async function handleDeleteTransaction(id, invoiceNo) {
  if (confirm(`Apakah Anda yakin ingin menghapus data transaksi ${invoiceNo} yang sudah selesai ini?`)) {
    try {
      await transactionStore.deleteTransaction(id)
    } catch (error) {
      window.alert(error.message)
    }
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero -->
    <div class="bg-gradient-to-br from-[#332119] via-[#4b3022] to-[#7c5a35] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#4b3022]/15 relative overflow-hidden">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f1dfbf] text-xs font-semibold mb-3 border border-white/10">
            <span>👑 Panel Pemilik Usaha</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Ringkasan Kinerja Donat Bu Diana</h1>
          <p class="text-amber-200/90 text-sm mt-1 max-w-xl">
            Pantau arus pendapatan, keuntungan bersih harian, status stok bahan, serta tren varian donat favorit pelanggan secara real-time.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <BaseButton variant="secondary" size="sm" @click="router.push('/owner/products')">
            <PlusCircle class="w-4 h-4" />
            Kelola Donat
          </BaseButton>
          <BaseButton variant="outline" size="sm" class="bg-white/10 text-white border-white/20 hover:bg-white/20" @click="router.push('/owner/reports')">
            <FileSpreadsheet class="w-4 h-4" />
            Laporan
          </BaseButton>
        </div>
      </div>
      <!-- Decorative circles -->
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-600/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>

    <!-- Alert Stok Menipis (Jika Ada) -->
    <div
      v-if="lowStockProducts.length > 0"
      class="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold">Peringatan: {{ lowStockProducts.length }} Varian Donat Mendekati Batas Minimum Stok!</h4>
          <p class="text-xs text-rose-700 mt-0.5">
            {{ lowStockProducts.map(p => `${p.name} (sisa ${p.stock} ${p.unit})`).join(', ') }}.
          </p>
        </div>
      </div>
      <BaseButton variant="danger" size="sm" class="shrink-0" @click="router.push('/owner/products')">
        Restok Sekarang
      </BaseButton>
    </div>

    <!-- Summary KPI Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard
        title="Total Pendapatan Kotor"
        :value="formatRupiah(totalRevenue)"
        subtext="Akumulasi omset penjualan"
        color="amber"
      >
        <template #icon><DollarSign class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Estimasi Laba Bersih"
        :value="formatRupiah(totalProfit)"
        subtext="Omset dikurangi modal (HPP)"
        color="emerald"
      >
        <template #icon><TrendingUp class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Total Transaksi Sukses"
        :value="totalOrders + ' Pesanan'"
        subtext="Jumlah nota transaksi"
        color="blue"
      >
        <template #icon><ShoppingBag class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Total Varian Menu"
        :value="totalProducts + ' Produk'"
        :subtext="lowStockProducts.length + ' varian stok kritis'"
        color="purple"
      >
        <template #icon><Package class="w-6 h-6" /></template>
      </StatCard>
    </div>

    <!-- Dual Column: Top Selling & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Top Selling Donuts (1 col) -->
      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Varian Terlaris</h3>
            <p class="text-xs text-slate-500">Berdasarkan total pcs terjual</p>
          </div>
          <span class="text-lg">🔥</span>
        </div>

        <div v-if="topProducts.length === 0" class="py-8 text-center text-xs text-slate-400">
          Belum ada data penjualan tercatat.
        </div>

        <div v-else class="space-y-3.5">
          <div
            v-for="(prod, idx) in topProducts"
            :key="prod.id"
            class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-100"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                {{ idx + 1 }}
              </span>
              <div>
                <p class="text-xs font-bold text-slate-800 line-clamp-1">{{ prod.name }}</p>
                <p class="text-[11px] text-slate-500">{{ formatRupiah(prod.totalRevenue) }}</p>
              </div>
            </div>
            <BaseBadge variant="warning" size="sm">
              {{ prod.totalQty }} pcs
            </BaseBadge>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Table (2 cols) -->
      <div class="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Aktivitas Transaksi Terkini</h3>
            <p class="text-xs text-slate-500">5 transaksi pesanan donat terakhir</p>
          </div>
          <router-link
            to="/owner/reports"
            class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            Lihat Semua <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th class="py-3 px-2">No. Nota</th>
                <th class="py-3 px-2">Waktu</th>
                <th class="py-3 px-2">Pelanggan</th>
                <th class="py-3 px-2">Metode</th>
                <th class="py-3 px-2 text-right">Total</th>
                <th class="py-3 px-2 text-center">Status</th>
                <th class="py-3 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="tx in recentTransactions" :key="tx.id" class="hover:bg-amber-50/40 transition-colors">
                <td class="py-3 px-2 font-mono font-bold text-slate-900">{{ tx.invoiceNo }}</td>
                <td class="py-3 px-2 text-slate-500">{{ formatDate(tx.createdAt) }}</td>
                <td class="py-3 px-2 font-medium text-slate-800">{{ tx.customerName }}</td>
                <td class="py-3 px-2 uppercase font-semibold text-slate-600">{{ tx.paymentMethod }}</td>
                <td class="py-3 px-2 font-bold text-slate-900 text-right">{{ formatRupiah(tx.grandTotal) }}</td>
                <td class="py-3 px-2 text-center">
                  <BaseBadge
                    size="sm"
                    :variant="tx.status === 'completed' ? 'success' : (tx.status === 'processing' ? 'warning' : 'danger')"
                  >
                    {{ tx.status === 'completed' ? 'Selesai' : (tx.status === 'processing' ? 'Diproses' : 'Batal') }}
                  </BaseBadge>
                </td>
                <td class="py-3 px-2 text-right">
                  <button
                    v-if="tx.status === 'completed'"
                    type="button"
                    class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus transaksi selesai"
                    @click="handleDeleteTransaction(tx.id, tx.invoiceNo)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  <span v-else class="text-[10px] text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
