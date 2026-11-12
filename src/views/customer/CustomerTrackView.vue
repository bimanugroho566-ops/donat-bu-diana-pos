<script setup>
import { ref } from 'vue'
import { useTransactionStore } from '../../stores/transactionStore'
import { Search, CheckCircle, Clock, AlertCircle, ShoppingBag, Store, MapPin } from 'lucide-vue-next'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'

const transactionStore = useTransactionStore()

const searchInput = ref('')
const phoneInput = ref('')
const searchResult = ref(null)
const hasSearched = ref(false)
const searchError = ref('')
const isSearching = ref(false)

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

async function handleSearch() {
  searchError.value = ''
  if (!searchInput.value.trim() || !phoneInput.value.trim()) {
    searchError.value = 'Nomor nota dan nomor telepon wajib diisi.'
    return
  }
  isSearching.value = true
  hasSearched.value = true
  try {
    searchResult.value = await transactionStore.trackCustomerOrder(searchInput.value, phoneInput.value)
  } catch (error) {
    searchError.value = error.message
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8 py-4">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl shadow-sm">
        🔍
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Lacak Status Pesanan Donat</h1>
      <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
        Masukkan nomor nota dan nomor telepon yang digunakan saat memesan.
      </p>
    </div>

    <!-- Search Box -->
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
      <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row items-center gap-3">
        <div class="flex-1 w-full">
          <BaseInput
            v-model="searchInput"
            placeholder="Nomor nota"
          >
            <template #prefix><Search class="w-4 h-4" /></template>
          </BaseInput>
        </div>
        <div class="flex-1 w-full">
          <BaseInput v-model="phoneInput" type="tel" placeholder="Nomor telepon pemesan" />
        </div>
        <BaseButton type="submit" variant="primary" class="w-full sm:w-auto" :loading="isSearching">
          Cari Status Pesanan
        </BaseButton>
      </form>
      <p v-if="searchError" class="mt-3 text-sm text-rose-600">{{ searchError }}</p>
    </div>

    <!-- Result Display -->
    <div v-if="hasSearched && searchResult" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md space-y-8">
      <!-- Order Meta -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
        <div>
          <span class="text-xs font-mono font-bold text-amber-800">{{ searchResult.invoiceNo }}</span>
          <h3 class="text-lg font-black text-slate-900 mt-0.5">{{ searchResult.customerName }}</h3>
          <p class="text-xs text-slate-400">Dipesan pada: {{ formatDate(searchResult.createdAt) }}</p>
        </div>
        <div>
          <BaseBadge
            size="md"
            :variant="searchResult.status === 'completed' ? 'success' : (searchResult.status === 'processing' ? 'warning' : 'danger')"
          >
            {{ searchResult.status === 'completed' ? 'Siap Diambil / Selesai' : (searchResult.status === 'processing' ? 'Sedang Dibuat Fresh' : 'Dibatalkan') }}
          </BaseBadge>
        </div>
      </div>

      <!-- Stepper Progress Tracker -->
      <div>
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Progres Pengerjaan</h4>
        <div class="relative flex items-center justify-between max-w-md mx-auto">
          <!-- Connecting Line -->
          <div class="absolute left-6 right-6 top-5 h-1 bg-slate-200 -z-0">
            <div
              class="h-full bg-emerald-500 transition-all duration-500"
              :style="{ width: searchResult.status === 'completed' ? '100%' : (searchResult.status === 'processing' ? '50%' : '0%') }"
            ></div>
          </div>

          <!-- Step 1: Diterima -->
          <div class="flex flex-col items-center relative z-10">
            <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
              ✓
            </div>
            <span class="text-[11px] font-bold text-slate-800 mt-2">Diterima Kasir</span>
          </div>

          <!-- Step 2: Sedang Dibuat -->
          <div class="flex flex-col items-center relative z-10">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors"
              :class="searchResult.status === 'completed' || searchResult.status === 'processing' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'"
            >
              {{ searchResult.status === 'completed' ? '✓' : '2' }}
            </div>
            <span class="text-[11px] font-bold text-slate-800 mt-2">Sedang Disiapkan</span>
          </div>

          <!-- Step 3: Siap Diambil -->
          <div class="flex flex-col items-center relative z-10">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors"
              :class="searchResult.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'"
            >
              {{ searchResult.status === 'completed' ? '✓' : '3' }}
            </div>
            <span class="text-[11px] font-bold text-slate-800 mt-2">Siap Diambil</span>
          </div>
        </div>
      </div>

      <!-- Items Summary -->
      <div class="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 space-y-3">
        <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Varian Donat Yang Dipesan</h5>
        <div class="space-y-2 divide-y divide-amber-100">
          <div
            v-for="it in searchResult.items"
            :key="it.productId"
            class="pt-2 first:pt-0 flex justify-between items-center text-xs text-slate-700"
          >
            <div>
              <span class="font-bold text-slate-900">{{ it.productName }}</span>
              <span class="text-[11px] text-slate-500 block">Jumlah: {{ it.quantity }} pcs</span>
            </div>
            <span class="font-bold text-slate-900">{{ formatRupiah(it.subtotal) }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-amber-200 flex justify-between items-center text-xs">
          <span class="font-bold text-slate-700">Total Pembayaran:</span>
          <span class="text-base font-black text-amber-800">{{ formatRupiah(searchResult.grandTotal) }}</span>
        </div>
      </div>

      <!-- Pickup Instructions -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
        <MapPin class="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p class="font-bold text-slate-900">Lokasi Pengambilan Donat:</p>
          <p>Langgam, Jl. Cendana Rt 003/ Rw 004</p>
          <p class="text-[11px] text-slate-500 mt-1">Tunjukkan nomor nota ini ke kasir saat mengambil pesanan Anda.</p>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else-if="hasSearched && !searchResult && !searchError" class="bg-white rounded-3xl p-10 border border-slate-100 shadow-md text-center space-y-3">
      <AlertCircle class="w-12 h-12 text-rose-500 mx-auto" />
      <h3 class="text-base font-bold text-slate-900">Nota Transaksi Tidak Ditemukan</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Pastikan nomor nota dan nomor telepon sama dengan yang digunakan saat memesan.
      </p>
    </div>
  </div>
</template>
