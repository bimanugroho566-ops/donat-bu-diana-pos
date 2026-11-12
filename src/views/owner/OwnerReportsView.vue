<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../../stores/transactionStore'
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Receipt,
  Download,
  Trash2
} from 'lucide-vue-next'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import StatCard from '../../components/common/StatCard.vue'

const transactionStore = useTransactionStore()

const searchInvoice = ref('')
const selectedPeriod = ref('month') // all, today, week, month
const selectedStatus = ref('all') // all, completed, processing, cancelled

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

// Filter Logic
const filteredTransactions = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  return transactionStore.allTransactions.filter(t => {
    // Search
    const matchSearch = !searchInvoice.value || 
      (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchInvoice.value.toLowerCase())) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchInvoice.value.toLowerCase())) ||
      (t.cashierName && t.cashierName.toLowerCase().includes(searchInvoice.value.toLowerCase()))

    // Status
    const matchStatus = selectedStatus.value === 'all' || t.status === selectedStatus.value

    // Period
    let matchPeriod = true
    const txDate = new Date(t.createdAt)
    if (selectedPeriod.value === 'today') {
      matchPeriod = (t.createdAt || '').slice(0, 10) === todayStr
    } else if (selectedPeriod.value === 'week') {
      const diffDays = (now - txDate) / (1000 * 3600 * 24)
      matchPeriod = diffDays <= 7
    } else if (selectedPeriod.value === 'month') {
      matchPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
    }

    return matchSearch && matchStatus && matchPeriod
  })
})

// Metrics for current filtered set
const summaryMetrics = computed(() => {
  const valid = filteredTransactions.value.filter(t => t.status !== 'cancelled')
  const revenue = valid.reduce((sum, t) => sum + Number(t.grandTotal || 0), 0)
  const cost = valid.reduce((sum, t) => sum + Number(t.totalCost || 0), 0)
  const profit = valid.reduce((sum, t) => sum + Number(t.netProfit || 0), 0)
  const count = valid.length
  const aov = count > 0 ? Math.round(revenue / count) : 0

  return { revenue, cost, profit, count, aov }
})

// Export CSV
function exportCSV() {
  const headers = ['No Nota', 'Waktu', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Total Item', 'Omset (Rp)', 'Modal (Rp)', 'Laba Bersih (Rp)', 'Status']
  const rows = filteredTransactions.value.map(t => [
    t.invoiceNo,
    formatDate(t.createdAt),
    t.cashierName,
    t.customerName,
    t.paymentMethod,
    t.totalItems,
    t.grandTotal,
    t.totalCost,
    t.netProfit,
    t.status
  ])

  const escapeCSV = (value) => {
    let text = String(value ?? '')
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }

  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(';'))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', downloadUrl)
  link.setAttribute('download', `Laporan_DonatBuDiana_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

function printReport() {
  window.print()
}

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
  <div id="printable-report" class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan & Transaksi</h1>
        <p class="text-xs text-slate-500 mt-1">Audit rincian arus kas, margin laba bersih penjualan donat, dan unduh rekapan transaksi.</p>
      </div>
      <div class="no-print flex items-center gap-2">
        <BaseButton variant="outline" size="sm" @click="printReport">
          <Printer class="w-4 h-4" />
          Cetak Halaman
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="exportCSV">
          <Download class="w-4 h-4" />
          Ekspor CSV untuk Excel
        </BaseButton>
      </div>
    </div>

    <!-- Filter Control Bar -->
    <div class="no-print bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="w-full md:w-72">
        <BaseInput
          v-model="searchInvoice"
          placeholder="Cari no nota atau nama pelanggan..."
        >
          <template #prefix><Search class="w-4 h-4" /></template>
        </BaseInput>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <!-- Period Filter -->
        <div class="flex items-center gap-1.5 text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Periode:</span>
          <select
            v-model="selectedPeriod"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini Saja</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Berjalan</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-1.5 text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status:</span>
          <select
            v-model="selectedStatus"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="processing">Diproses</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Financial KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Omset Penjualan"
        :value="formatRupiah(summaryMetrics.revenue)"
        :subtext="`${summaryMetrics.count} transaksi terfilter`"
        color="amber"
      >
        <template #icon><DollarSign class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Total Beban Modal (HPP)"
        :value="formatRupiah(summaryMetrics.cost)"
        subtext="Estimasi biaya bahan baku donat"
        color="rose"
      >
        <template #icon><Receipt class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Laba Bersih (Net Profit)"
        :value="formatRupiah(summaryMetrics.profit)"
        :subtext="`Margin Laba: ${summaryMetrics.revenue ? Math.round((summaryMetrics.profit / summaryMetrics.revenue) * 100) : 0}%`"
        color="emerald"
      >
        <template #icon><TrendingUp class="w-6 h-6" /></template>
      </StatCard>

      <StatCard
        title="Rata-rata Nilai Belanja"
        :value="formatRupiah(summaryMetrics.aov)"
        subtext="Nilai transaksi per pelanggan"
        color="purple"
      >
        <template #icon><FileSpreadsheet class="w-6 h-6" /></template>
      </StatCard>
    </div>

    <!-- Transactions Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
            <tr>
              <th class="py-4 px-4">No. Nota</th>
              <th class="py-4 px-3">Waktu & Tanggal</th>
              <th class="py-4 px-3">Kasir</th>
              <th class="py-4 px-3">Pelanggan</th>
              <th class="py-4 px-3">Rincian Item</th>
              <th class="py-4 px-3">Metode</th>
              <th class="py-4 px-3 text-right">Omset (Rp)</th>
              <th class="py-4 px-3 text-right">Laba Bersih</th>
              <th class="py-4 px-4 text-center">Status</th>
              <th class="no-print py-4 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="10" class="py-12 text-center text-slate-400">
                Tidak ada riwayat transaksi pada filter periode ini.
              </td>
            </tr>

            <tr
              v-for="tx in filteredTransactions"
              :key="tx.id"
              class="hover:bg-amber-50/30 transition-colors"
            >
              <td class="py-3.5 px-4 font-mono font-bold text-slate-900">{{ tx.invoiceNo }}</td>
              <td class="py-3.5 px-3 text-slate-500 whitespace-nowrap">{{ formatDate(tx.createdAt) }}</td>
              <td class="py-3.5 px-3 font-medium text-slate-700">{{ tx.cashierName }}</td>
              <td class="py-3.5 px-3 font-medium text-slate-800">{{ tx.customerName }}</td>
              <td class="py-3.5 px-3">
                <span class="text-slate-600 block line-clamp-1 max-w-xs">
                  {{ tx.items.map(it => `${it.productName} (${it.quantity})`).join(', ') }}
                </span>
                <span class="text-[10px] text-slate-400 font-semibold">{{ tx.totalItems }} pcs donat</span>
              </td>
              <td class="py-3.5 px-3 uppercase font-bold text-slate-600">{{ tx.paymentMethod }}</td>
              <td class="py-3.5 px-3 text-right font-black text-slate-900">{{ formatRupiah(tx.grandTotal) }}</td>
              <td class="py-3.5 px-3 text-right font-bold text-emerald-700">+{{ formatRupiah(tx.netProfit) }}</td>
              <td class="py-3.5 px-4 text-center">
                <BaseBadge
                  size="sm"
                  :variant="tx.status === 'completed' ? 'success' : (tx.status === 'processing' ? 'warning' : 'danger')"
                >
                  {{ tx.status === 'completed' ? 'Selesai' : (tx.status === 'processing' ? 'Diproses' : 'Batal') }}
                </BaseBadge>
              </td>
              <td class="no-print py-3.5 px-3 text-right">
                <button
                  v-if="tx.status === 'completed'"
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus data transaksi selesai ini"
                  @click="handleDeleteTransaction(tx.id, tx.invoiceNo)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
                <span v-else class="text-[11px] text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
