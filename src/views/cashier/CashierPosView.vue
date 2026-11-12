<script setup>
import { ref, computed, watch } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useTransactionStore } from '../../stores/transactionStore'
import { useAuthStore } from '../../stores/authStore'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  User,
  Coffee,
  X
} from 'lucide-vue-next'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseModal from '../../components/common/BaseModal.vue'

const productStore = useProductStore()
const transactionStore = useTransactionStore()
const authStore = useAuthStore()

// State POS
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const cart = ref([])

// Form Pembayaran
const customerName = ref('Pelanggan Walk-in')
const customerPhone = ref('')
const orderNotes = ref('')
const paymentMethod = ref('cash')
const discountAmount = ref(0)
const cashPaid = ref(0)
const qrisPaymentConfirmed = ref(false)

// Modal Struk Sukses
const showReceiptModal = ref(false)
const lastTransaction = ref(null)
const isSubmitting = ref(false)

const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  return productStore.activeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        p.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = selectedCategory.value === 'Semua' || p.category === selectedCategory.value
    return matchSearch && matchCat
  })
})

const cartTotalItems = computed(() => {
  return cart.value.reduce((sum, it) => sum + it.quantity, 0)
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, it) => sum + (it.price * it.quantity), 0)
})

const cartGrandTotal = computed(() => {
  return Math.max(0, cartSubtotal.value - Number(discountAmount.value || 0))
})

const cashChange = computed(() => {
  if (paymentMethod.value !== 'cash') return 0
  return Math.max(0, Number(cashPaid.value || 0) - cartGrandTotal.value)
})

watch(cartGrandTotal, () => {
  qrisPaymentConfirmed.value = false
})

const isPaymentValid = computed(() => {
  if (cart.value.length === 0) return false
  if (paymentMethod.value === 'cash') {
    return Number(cashPaid.value || 0) >= cartGrandTotal.value
  }
  if (paymentMethod.value === 'qris') {
    return qrisPaymentConfirmed.value
  }
  return true
})

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

// Cart Methods
function addToCart(product) {
  if (product.stock <= 0) return

  const existing = cart.value.find(it => it.productId === product.id)
  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity++
      existing.subtotal = existing.quantity * existing.price
    }
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      costPrice: product.costPrice,
      quantity: 1,
      unit: product.unit,
      subtotal: product.price,
      maxStock: product.stock
    })
  }

  // Set default cash paid to exact grand total
  if (paymentMethod.value === 'cash' && cashPaid.value === 0) {
    cashPaid.value = cartGrandTotal.value
  }
}

function updateQty(item, delta) {
  const prod = productStore.getProductById(item.productId)
  const maxStock = prod ? prod.stock : 999

  const newQty = item.quantity + delta
  if (newQty <= 0) {
    removeFromCart(item.productId)
  } else if (newQty <= maxStock) {
    item.quantity = newQty
    item.subtotal = item.quantity * item.price
  }
}

function removeFromCart(productId) {
  cart.value = cart.value.filter(it => it.productId !== productId)
}

function clearCart() {
  cart.value = []
  discountAmount.value = 0
  cashPaid.value = 0
  qrisPaymentConfirmed.value = false
  orderNotes.value = ''
  customerName.value = 'Pelanggan Walk-in'
}

function selectPaymentMethod(method) {
  paymentMethod.value = method
  qrisPaymentConfirmed.value = false
}

function setQuickCash(amount) {
  if (amount === 'exact') {
    cashPaid.value = cartGrandTotal.value
  } else {
    cashPaid.value = amount
  }
}

// Checkout Process
async function handleCheckout() {
  if (!isPaymentValid.value || isSubmitting.value) return
  isSubmitting.value = true

  const payload = {
    customerName: customerName.value.trim() || 'Pelanggan Walk-in',
    customerPhone: customerPhone.value.trim() || '-',
    cashierId: authStore.currentUser ? authStore.currentUser.id : 'USR-002',
    cashierName: authStore.currentUser ? authStore.currentUser.name : 'Diana Herawati',
    items: [...cart.value],
    subtotal: cartSubtotal.value,
    discount: Number(discountAmount.value || 0),
    grandTotal: cartGrandTotal.value,
    paymentMethod: paymentMethod.value,
    paymentStatus: paymentMethod.value === 'cash' || (paymentMethod.value === 'qris' && qrisPaymentConfirmed.value)
      ? 'paid'
      : 'pending',
    cashPaid: paymentMethod.value === 'cash' ? Number(cashPaid.value) : cartGrandTotal.value,
    cashChange: cashChange.value,
    status: 'completed',
    notes: orderNotes.value.trim()
  }

  try {
    const createdTx = await transactionStore.createPosTransaction(payload)
    if (createdTx.refreshWarning) window.alert(createdTx.refreshWarning)
    lastTransaction.value = createdTx
    showReceiptModal.value = true
    clearCart()
  } catch (error) {
    window.alert(error.message)
  } finally {
    isSubmitting.value = false
  }
}

function triggerPrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-amber-700">Transaksi baru</p>
        <h1 class="text-2xl font-black tracking-tight text-slate-900">Kasir POS</h1>
        <p class="text-sm text-slate-500 mt-1">Pilih donat, atur jumlah, lalu selesaikan pembayaran.</p>
      </div>
      <BaseBadge variant="primary" size="md">{{ cartTotalItems }} item di keranjang</BaseBadge>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-4">
    <!-- LEFT COLUMN: DONUT PRODUCT CATALOG -->
    <div class="min-w-0 min-h-[36rem] flex flex-col bg-white rounded-3xl p-5 border border-slate-100 shadow-sm overflow-hidden">
      <!-- Search & Filters -->
      <div class="space-y-3 pb-4 border-b border-slate-100">
        <div class="flex items-center justify-between gap-3">
          <div class="flex-1">
            <BaseInput
              v-model="searchQuery"
              placeholder="Cari donat lezat (nama atau ID)..."
            >
              <template #prefix><Search class="w-4 h-4" /></template>
            </BaseInput>
          </div>
          <BaseBadge variant="primary" size="md">
            {{ filteredProducts.length }} Varian Tersedia
          </BaseBadge>
        </div>

        <!-- Category Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            :class="selectedCategory === cat ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="flex-1 overflow-y-auto pt-4 pr-1">
        <div class="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3.5">
          <div
            v-for="prod in filteredProducts"
            :key="prod.id"
            class="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-2.5 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer select-none"
            :class="prod.stock <= 0 ? 'opacity-50 pointer-events-none' : ''"
            @click="addToCart(prod)"
          >
            <div>
              <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-amber-50 mb-2">
                <img
                  :src="prod.image"
                  :alt="prod.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span
                  class="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black text-white shadow"
                  :class="prod.stock <= prod.minStock ? 'bg-rose-500' : 'bg-slate-900/80'"
                >
                  Sisa: {{ prod.stock }}
                </span>
              </div>
              <h4 class="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-amber-800">
                {{ prod.name }}
              </h4>
              <p class="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{{ prod.description }}</p>
            </div>

            <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
              <span class="text-xs font-black text-amber-700">{{ formatRupiah(prod.price) }}</span>
              <button
                type="button"
                class="w-7 h-7 rounded-lg bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-900 flex items-center justify-center transition-colors shadow-sm"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: INTERACTIVE CART & CHECKOUT (40%) -->
    <div class="min-w-0 min-h-[40rem] lg:min-h-[36rem] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Cart Header -->
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <ShoppingCart class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Keranjang Transaksi</h3>
            <p class="text-[10px] text-slate-500">{{ cartTotalItems }} pcs donat terpilih</p>
          </div>
        </div>
        <button
          v-if="cart.length > 0"
          type="button"
          class="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
          @click="clearCart"
        >
          Kosongkan
        </button>
      </div>

      <!-- Customer Info & Notes -->
      <div class="p-3.5 border-b border-slate-100 bg-slate-50/40 grid grid-cols-2 gap-2 text-xs">
        <BaseInput
          v-model="customerName"
          label="Nama Pelanggan"
          placeholder="Walk-in / Nama"
        />
        <BaseInput
          v-model="customerPhone"
          label="No. WA (Opsional)"
          placeholder="08..."
        />
      </div>

      <!-- Cart Items List -->
      <div class="flex-1 min-h-40 overflow-y-auto p-3.5 divide-y divide-slate-100">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center py-10 text-slate-400 text-center">
          <ShoppingCart class="w-10 h-10 mb-2 opacity-30 text-amber-600" />
          <p class="text-xs font-bold text-slate-600">Keranjang Masih Kosong</p>
          <p class="text-[11px] text-slate-400 mt-1 max-w-[200px]">Klik donat pada katalog sebelah kiri untuk menambahkan pesanan.</p>
        </div>

        <div
          v-for="item in cart"
          :key="item.productId"
          class="py-2.5 flex items-center justify-between gap-3 text-xs"
        >
          <div class="flex-1 min-w-0">
            <h5 class="font-bold text-slate-800 truncate">{{ item.productName }}</h5>
            <p class="text-[11px] text-slate-500 font-medium">
              {{ formatRupiah(item.price) }} / {{ item.unit }}
            </p>
          </div>

          <!-- Quantity Stepper -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              @click="updateQty(item, -1)"
            >
              <Minus class="w-3 h-3" />
            </button>
            <span class="w-7 text-center font-black text-slate-900 text-xs">{{ item.quantity }}</span>
            <button
              type="button"
              class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              @click="updateQty(item, 1)"
            >
              <Plus class="w-3 h-3" />
            </button>
          </div>

          <div class="text-right min-w-[70px]">
            <span class="font-black text-slate-900">{{ formatRupiah(item.subtotal) }}</span>
          </div>

          <button
            type="button"
            class="text-slate-400 hover:text-rose-600 p-1 transition-colors"
            @click="removeFromCart(item.productId)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Checkout & Payment Panel -->
      <div class="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
        <!-- Subtotal & Discount -->
        <div class="space-y-1.5 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal ({{ cartTotalItems }} pcs):</span>
            <span class="font-bold text-slate-800">{{ formatRupiah(cartSubtotal) }}</span>
          </div>

          <div class="flex items-center justify-between text-slate-600">
            <span class="text-[11px]">Diskon Promo (Rp):</span>
            <input
              v-model.number="discountAmount"
              type="number"
              min="0"
              class="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 focus:outline-none focus:border-amber-500"
              placeholder="0"
            />
          </div>

          <div class="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
            <span>Total Tagihan:</span>
            <span class="text-amber-700 text-base">{{ formatRupiah(cartGrandTotal) }}</span>
          </div>
        </div>

        <!-- Payment Method Tabs -->
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Metode Bayar</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              class="py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center"
              :class="paymentMethod === 'cash' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
              @click="selectPaymentMethod('cash')"
            >
              💵 Tunai
            </button>
            <button
              type="button"
              class="py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center"
              :class="paymentMethod === 'qris' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
              @click="selectPaymentMethod('qris')"
            >
              📱 QRIS
            </button>
          </div>
        </div>

        <div v-if="paymentMethod === 'qris'" class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <img
            src="/qris-donat-bu-diana.png"
            alt="Kode QRIS Donat Bu Diana"
            class="mx-auto max-h-48 w-auto max-w-full rounded-lg object-contain"
          />
          <p class="text-xs font-bold text-slate-800">Tagih {{ formatRupiah(cartGrandTotal) }} melalui QRIS</p>
          <label class="flex items-start gap-2 text-left text-[11px] text-slate-700">
            <input v-model="qrisPaymentConfirmed" type="checkbox" class="mt-0.5 rounded text-amber-600 focus:ring-amber-500" />
            <span>Saya sudah memastikan pembayaran berhasil masuk di aplikasi merchant.</span>
          </label>
        </div>

        <!-- Cash Details (If Tunai) -->
        <div v-if="paymentMethod === 'cash'" class="space-y-2 pt-1 text-xs">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold text-slate-700">Uang Diterima:</span>
            <input
              v-model.number="cashPaid"
              type="number"
              class="w-32 text-right px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="0"
            />
          </div>

          <!-- Quick Cash Presets -->
          <div class="flex items-center gap-1.5 justify-end">
            <button
              type="button"
              class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold hover:bg-amber-50 hover:text-amber-800"
              @click="setQuickCash('exact')"
            >
              Uang Pas
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold hover:bg-amber-50 hover:text-amber-800"
              @click="setQuickCash(50000)"
            >
              50k
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold hover:bg-amber-50 hover:text-amber-800"
              @click="setQuickCash(100000)"
            >
              100k
            </button>
          </div>

          <!-- Kembalian -->
          <div class="flex justify-between items-center p-2 rounded-xl bg-amber-100/60 border border-amber-200">
            <span class="text-xs font-bold text-amber-900">Kembalian:</span>
            <span class="text-sm font-black text-amber-900">{{ formatRupiah(cashChange) }}</span>
          </div>
        </div>

        <!-- Submit Button -->
        <BaseButton
          variant="primary"
          size="lg"
          class="w-full"
          :disabled="!isPaymentValid"
          :loading="isSubmitting"
          @click="handleCheckout"
        >
          <Receipt class="w-5 h-5" />
          Simpan & Cetak Struk
        </BaseButton>
      </div>
    </div>

    </div>

    <!-- MODAL STRUK PEMBAYARAN NOTA (PRINTABLE) -->
    <BaseModal
      :show="showReceiptModal"
      title="Struk Pembayaran Transaksi"
      maxWidth="max-w-md"
      @close="showReceiptModal = false"
    >
      <div v-if="lastTransaction" id="printable-receipt" class="p-4 bg-white text-slate-800 font-mono text-xs space-y-4">
        <!-- Store Header -->
        <div class="text-center border-b border-dashed border-slate-300 pb-3">
          <img src="/donut-icon.svg" alt="" class="w-9 h-9 mx-auto mb-1 object-contain" />
          <h2 class="text-base font-black tracking-tight uppercase">Donat Bu Diana</h2>
          <p class="text-[11px] text-slate-500">Langgam, Jl. Cendana Rt 003/ Rw 004</p>
          <p class="text-[10px] text-slate-500">WhatsApp: 0812-3456-7890</p>
        </div>

        <!-- Transaction Meta -->
        <div class="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
          <div class="flex justify-between">
            <span class="text-slate-500">No. Nota:</span>
            <span class="font-bold">{{ lastTransaction.invoiceNo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Waktu:</span>
            <span>{{ formatDate(lastTransaction.createdAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Kasir:</span>
            <span>{{ lastTransaction.cashierName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Pelanggan:</span>
            <span>{{ lastTransaction.customerName }}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="space-y-2 border-b border-dashed border-slate-300 pb-3">
          <div
            v-for="it in lastTransaction.items"
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

        <!-- Totals & Payment -->
        <div class="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>{{ formatRupiah(lastTransaction.subtotal) }}</span>
          </div>
          <div v-if="lastTransaction.discount > 0" class="flex justify-between text-rose-600">
            <span>Diskon:</span>
            <span>-{{ formatRupiah(lastTransaction.discount) }}</span>
          </div>
          <div class="flex justify-between text-xs font-black pt-1 border-t border-slate-200">
            <span>TOTAL:</span>
            <span>{{ formatRupiah(lastTransaction.grandTotal) }}</span>
          </div>
          <div class="flex justify-between pt-1">
            <span class="uppercase">Bayar ({{ lastTransaction.paymentMethod }}):</span>
            <span>{{ formatRupiah(lastTransaction.cashPaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Kembalian:</span>
            <span>{{ formatRupiah(lastTransaction.cashChange) }}</span>
          </div>
        </div>

        <!-- Footer Thank You -->
        <div class="text-center text-[10px] text-slate-500 pt-2 space-y-1">
          <p class="font-bold">Terima kasih atas kunjungan Anda!</p>
          <p>Donat empuk istimewa dibuat dengan cinta setiap hari.</p>
          <p class="font-mono text-[9px] mt-2">www.donatbudiana.com</p>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" size="sm" @click="showReceiptModal = false">
          Tutup
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="triggerPrint">
          <Printer class="w-4 h-4" />
          Cetak Nota (Print)
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
