<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../../stores/transactionStore'
import { useAuthStore } from '../../stores/authStore'
import { 
  FileText, 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Trash2
} from 'lucide-vue-next'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseModal from '../../components/common/BaseModal.vue'

const transactionStore = useTransactionStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const statusFilter = ref('all')

const selectedTx = ref(null)
const showDetailModal = ref(false)

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

const filteredOrders = computed(() => {
  return transactionStore.allTransactions.filter(t => {
    const matchSearch = !searchQuery.value ||
      (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchStatus = statusFilter.value === 'all' || t.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

function viewReceipt(tx) {
  selectedTx.value = tx
  showDetailModal.value = true
}

async function updateOrderStatus(id, newStatus) {
  try {
    await transactionStore.updateStatus(id, newStatus)
    if (selectedTx.value && selectedTx.value.id === id) {
      selectedTx.value.status = newStatus
    }
  } catch (error) {
    window.alert(error.message)
  }
}

function getPaymentStatus(order) {
  return order.paymentStatus || (order.paymentMethod === 'cash' ? 'paid' : 'pending')
}

async function confirmPayment(order) {
  if (!confirm(`Pastikan pembayaran ${order.invoiceNo} sudah diterima di aplikasi merchant sebelum dikonfirmasi.`)) return
  try {
    const updated = await transactionStore.updatePaymentStatus(order.id, 'paid')
    if (updated && selectedTx.value && selectedTx.value.id === order.id) {
      selectedTx.value.paymentStatus = updated.paymentStatus
    }
  } catch (error) {
    window.alert(error.message)
  }
}

async function deleteOrder(id, invoiceNo) {
  if (confirm(`Apakah Anda yakin ingin menghapus pesanan ${invoiceNo}? Data pesanan ini akan dihapus permanen.`)) {
    try {
      await transactionStore.deleteTransaction(id)
    } catch (error) {
      window.alert(error.message)
    }
  }
}

function printReceipt() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Daftar Antrean & Riwayat Pesanan Kasir</h1>
        <p class="text-xs text-slate-500 mt-1">Perbarui status pengerjaan pesanan donat dan cetak ulang nota pelanggan.</p>
      </div>
      <div class="flex items-center gap-2">
        <BaseBadge variant="warning" size="md">
          {{ filteredOrders.filter(o => o.status === 'processing').length }} Pesanan Sedang Diproses
        </BaseBadge>
      </div>
    </div>

    <!-- Filter Control -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="w-full md:w-80">
        <BaseInput
          v-model="searchQuery"
          placeholder="Cari no nota atau nama pelanggan..."
        >
          <template #prefix><Search class="w-4 h-4" /></template>
        </BaseInput>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          :class="statusFilter === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="statusFilter = 'all'"
        >
          Semua
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          :class="statusFilter === 'processing' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="statusFilter = 'processing'"
        >
          Diproses
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          :class="statusFilter === 'completed' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="statusFilter = 'completed'"
        >
          Selesai
        </button>
      </div>
    </div>

    <!-- Orders Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all space-y-4"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="font-mono text-xs font-bold text-amber-800">{{ order.invoiceNo }}</span>
              <h4 class="text-sm font-extrabold text-slate-900 mt-0.5">{{ order.customerName }}</h4>
              <p class="text-[10px] text-slate-400">{{ formatDate(order.createdAt) }}</p>
            </div>
            <BaseBadge
              size="sm"
              :variant="order.status === 'completed' ? 'success' : (order.status === 'processing' ? 'warning' : 'danger')"
            >
              {{ order.status === 'completed' ? 'Selesai' : (order.status === 'processing' ? 'Diproses' : 'Batal') }}
            </BaseBadge>
          </div>

          <!-- Items list -->
          <div class="pt-3 space-y-1.5 text-xs">
            <div
              v-for="item in order.items"
              :key="item.productId"
              class="flex justify-between text-slate-600"
            >
              <span class="truncate pr-2">{{ item.quantity }}x {{ item.productName }}</span>
              <span class="font-medium shrink-0">{{ formatRupiah(item.subtotal) }}</span>
            </div>
          </div>

          <!-- Notes -->
          <p v-if="order.notes" class="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
            📝 <em>{{ order.notes }}</em>
          </p>
        </div>

        <!-- Card Footer -->
        <div class="pt-3 border-t border-slate-100 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 uppercase font-semibold text-[10px]">Total Bayar ({{ order.paymentMethod === 'cash_on_pickup' ? 'Tunai saat ambil' : order.paymentMethod }}):</span>
            <span class="text-sm font-black text-slate-900">{{ formatRupiah(order.grandTotal) }}</span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-slate-500">Pembayaran:</span>
            <span :class="getPaymentStatus(order) === 'paid' ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'">
              {{ getPaymentStatus(order) === 'paid' ? 'Lunas' : 'Menunggu pembayaran' }}
            </span>
          </div>
          <BaseButton
            v-if="getPaymentStatus(order) !== 'paid' && order.status !== 'cancelled'"
            variant="success"
            size="sm"
            class="w-full"
            @click="confirmPayment(order)"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            Konfirmasi Pembayaran Diterima
          </BaseButton>

          <div class="flex items-center justify-between gap-2 pt-1">
            <BaseButton variant="outline" size="sm" class="flex-1" @click="viewReceipt(order)">
              <Eye class="w-3.5 h-3.5" />
              Lihat Struk
            </BaseButton>

            <BaseButton
              v-if="order.status === 'processing'"
              variant="success"
              size="sm"
              class="flex-1"
              @click="updateOrderStatus(order.id, 'completed')"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              Selesaikan
            </BaseButton>

            <BaseButton
              v-else-if="order.status === 'completed' && authStore.isOwner"
              variant="danger"
              size="sm"
              class="px-3 text-xs"
              title="Hapus pesanan yang sudah selesai ini"
              @click="deleteOrder(order.id, order.invoiceNo)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Hapus
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <BaseModal
      :show="showDetailModal"
      title="Rincian Nota Transaksi"
      maxWidth="max-w-md"
      @close="showDetailModal = false"
    >
      <div v-if="selectedTx" id="printable-receipt" class="p-4 bg-white text-slate-800 font-mono text-xs space-y-4">
        <!-- Store Header -->
        <div class="text-center border-b border-dashed border-slate-300 pb-3">
          <img src="/donut-icon.svg" alt="" class="w-9 h-9 mx-auto mb-1 object-contain" />
          <h2 class="text-base font-black tracking-tight uppercase">Donat Bu Diana</h2>
          <p class="text-[11px] text-slate-500">Langgam, Jl. Cendana Rt 003/ Rw 004</p>
        </div>

        <div class="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
          <div class="flex justify-between">
            <span class="text-slate-500">No. Nota:</span>
            <span class="font-bold">{{ selectedTx.invoiceNo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Waktu:</span>
            <span>{{ formatDate(selectedTx.createdAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Kasir:</span>
            <span>{{ selectedTx.cashierName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Pelanggan:</span>
            <span>{{ selectedTx.customerName }}</span>
          </div>
        </div>

        <div class="space-y-2 border-b border-dashed border-slate-300 pb-3">
          <div
            v-for="it in selectedTx.items"
            :key="it.productId"
            class="flex justify-between items-start text-[11px]"
          >
            <div>
              <p class="font-bold">{{ it.productName }}</p>
              <p class="text-[10px] text-slate-500">{{ it.quantity }} x {{ formatRupiah(it.price) }}</p>
            </div>
            <span class="font-bold">{{ formatRupiah(it.subtotal) }}</span>
          </div>
        </div>

        <div class="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>{{ formatRupiah(selectedTx.subtotal) }}</span>
          </div>
          <div v-if="selectedTx.discount > 0" class="flex justify-between text-rose-600">
            <span>Diskon:</span>
            <span>-{{ formatRupiah(selectedTx.discount) }}</span>
          </div>
          <div class="flex justify-between text-xs font-black pt-1 border-t border-slate-200">
            <span>TOTAL:</span>
            <span>{{ formatRupiah(selectedTx.grandTotal) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" size="sm" @click="showDetailModal = false">Tutup</BaseButton>
        <BaseButton variant="primary" size="sm" @click="printReceipt">
          <Printer class="w-4 h-4" />
          Cetak Nota
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
