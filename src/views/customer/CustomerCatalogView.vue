<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/productStore'
import { useTransactionStore } from '../../stores/transactionStore'
import { useAuthStore } from '../../stores/authStore'
import {
  Search, ShoppingBag, MessageCircle, Sparkles,
  Plus, Minus, Trash2, ShoppingCart, CheckCircle2, X, ClipboardList
} from 'lucide-vue-next'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseModal from '../../components/common/BaseModal.vue'

const productStore = useProductStore()
const transactionStore = useTransactionStore()
const authStore = useAuthStore()
const router = useRouter()

// --- Filter & Search ---
const searchQuery = ref('')
const selectedCategory = ref('Semua')

const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  return productStore.activeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = selectedCategory.value === 'Semua' || p.category === selectedCategory.value
    return matchSearch && matchCat
  })
})

// --- Cart ---
const savedCart = JSON.parse(sessionStorage.getItem('customer-order-cart') || '[]')
const cart = ref(savedCart.map(item => {
  const product = productStore.getProductById(item.productId)
  return product ? { product, quantity: Math.min(item.quantity, product.stock) } : null
}).filter(item => item && item.quantity > 0))
watch(cart, items => {
  sessionStorage.setItem('customer-order-cart', JSON.stringify(items.map(item => ({
    productId: item.product.id,
    quantity: item.quantity
  }))))
}, { deep: true })

const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const showCart = ref(false)

function addToCart(product) {
  if (product.stock <= 0) return
  const existing = cart.value.find(i => i.product.id === product.id)
  if (existing) {
    if (existing.quantity < product.stock) existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

function removeFromCart(productId) {
  cart.value = cart.value.filter(i => i.product.id !== productId)
}

function decreaseQty(productId) {
  const item = cart.value.find(i => i.product.id === productId)
  if (!item) return
  if (item.quantity <= 1) {
    removeFromCart(productId)
  } else {
    item.quantity--
  }
}

function increaseQty(productId) {
  const item = cart.value.find(i => i.product.id === productId)
  if (!item) return
  if (item.quantity < item.product.stock) item.quantity++
}

function getCartQty(productId) {
  return cart.value.find(i => i.product.id === productId)?.quantity || 0
}

// --- Checkout ---
const showCheckout = ref(false)
const checkoutNotes = ref('')
const paymentMethod = ref('cash_on_pickup')
const isSubmitting = ref(false)

const customerName = computed(() => authStore.currentUser?.name || '')
const customerPhone = computed(() => authStore.currentUser?.phone || '-')

function openCheckout() {
  if (cart.value.length === 0) return
  if (!authStore.isCustomer) {
    router.push('/login')
    return
  }
  if ((customerPhone.value.match(/\d/g) || []).length < 8) {
    window.alert('Tambahkan nomor telepon minimal 8 digit pada akun Anda sebelum membuat pesanan.')
    return
  }
  showCart.value = false
  showCheckout.value = true
}

// --- Success Modal ---
const showSuccess = ref(false)
const lastOrder = ref(null)

async function submitOrder() {
  if (cart.value.length === 0 || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const result = await transactionStore.createCustomerOrder({
      items: cart.value.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      paymentMethod: paymentMethod.value,
      notes: checkoutNotes.value
    })
    lastOrder.value = result
    if (result.refreshWarning) window.alert(result.refreshWarning)
    cart.value = []
    checkoutNotes.value = ''
    showCheckout.value = false
    showSuccess.value = true
  } catch (error) {
    window.alert(error.message)
  } finally {
    isSubmitting.value = false
  }
}

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}
</script>

<template>
  <div class="space-y-8">

    <!-- Hero Banner -->
    <div class="relative bg-gradient-to-br from-[#332119] via-[#543723] to-[#947044] rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-[#4b3022]/15 overflow-hidden">
      <div class="relative z-10 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#f1dfbf] text-xs font-bold mb-4 border border-white/10">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Donat Kentang Homemade Fresh Setiap Pagi</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Sensasi Lembutnya Donat Bu Diana
        </h1>
        <p class="text-amber-100/90 text-sm sm:text-base mt-3 leading-relaxed">
          Dibuat dari kentang asli berkualitas dengan beragam topping glaze lumer premium dan racikan kopi susu gula aren segar.
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="https://wa.me/6281234567890?text=Halo%20Bu%20Diana,%20saya%20ingin%20pesan%20donat"
            target="_blank"
            class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <MessageCircle class="w-4 h-4" />
            Pesan via WhatsApp
          </a>
          <router-link
            to="/track"
            class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all"
          >
            <Search class="w-4 h-4" />
            Lacak Pesanan Saya
          </router-link>
        </div>
      </div>
      <div class="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Filter & Search + Cart Button -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="w-full md:w-80">
        <BaseInput v-model="searchQuery" placeholder="Cari varian donat favoritmu...">
          <template #prefix><Search class="w-4 h-4" /></template>
        </BaseInput>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            :class="selectedCategory === cat ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="selectedCategory = cat"
          >{{ cat }}</button>
        </div>

        <!-- Cart FAB -->
        <button
          type="button"
          @click="showCart = true"
          class="relative ml-auto flex-shrink-0 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
        >
          <ShoppingCart class="w-4 h-4" />
          <span class="hidden sm:inline">Keranjang</span>
          <span
            v-if="cartCount > 0"
            class="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >{{ cartCount }}</span>
        </button>
      </div>
    </div>

    <!-- Menu Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="prod in filteredProducts"
        :key="prod.id"
        class="bg-white rounded-3xl border border-slate-100 hover:border-amber-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
      >
        <div>
          <!-- Photo -->
          <div class="relative w-full h-48 bg-amber-50 overflow-hidden">
            <img :src="prod.image" :alt="prod.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <span class="absolute top-3 left-3">
              <BaseBadge variant="primary" size="sm">{{ prod.category }}</BaseBadge>
            </span>
            <span
              class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow"
              :class="prod.stock > 0 ? 'bg-emerald-600' : 'bg-slate-600'"
            >
              {{ prod.stock > 0 ? `Tersedia (${prod.stock})` : 'Habis' }}
            </span>
          </div>

          <!-- Content -->
          <div class="p-5 space-y-2">
            <h3 class="text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors">{{ prod.name }}</h3>
            <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">{{ prod.description }}</p>
          </div>
        </div>

        <!-- Footer Price + Add to Cart -->
        <div class="p-5 pt-0 border-t border-slate-50 mt-3 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga</span>
              <span class="text-lg font-black text-amber-700">{{ formatRupiah(prod.price) }}</span>
            </div>
            <span class="text-xs font-semibold text-slate-400">/ {{ prod.unit }}</span>
          </div>

          <!-- Qty control kalau sudah ada di cart, atau tombol tambah -->
          <div v-if="getCartQty(prod.id) > 0" class="flex items-center gap-2">
            <button
              type="button"
              @click="decreaseQty(prod.id)"
              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
            ><Minus class="w-3.5 h-3.5" /></button>
            <span class="flex-1 text-center font-black text-slate-800 text-sm">{{ getCartQty(prod.id) }}</span>
            <button
              type="button"
              @click="addToCart(prod)"
              :disabled="getCartQty(prod.id) >= prod.stock"
              class="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition-colors disabled:opacity-40"
            ><Plus class="w-3.5 h-3.5" /></button>
          </div>
          <button
            v-else
            type="button"
            @click="addToCart(prod)"
            :disabled="prod.stock <= 0"
            class="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95"
          >
            <Plus class="w-3.5 h-3.5" />
            {{ prod.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredProducts.length === 0" class="text-center py-16 text-slate-400">
      <ShoppingBag class="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p class="font-bold text-lg">Produk tidak ditemukan</p>
    </div>

    <!-- ===================== CART MODAL ===================== -->
    <BaseModal :show="showCart" title="Keranjang Belanja" @close="showCart = false">
      <div v-if="cart.length === 0" class="text-center py-10 text-slate-400">
        <ShoppingCart class="w-14 h-14 mx-auto mb-3 opacity-30" />
        <p class="font-semibold">Keranjangmu masih kosong</p>
        <p class="text-xs mt-1">Tambahkan donat favoritmu dulu!</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in cart"
          :key="item.product.id"
          class="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl"
        >
          <img :src="item.product.image" :alt="item.product.name" class="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm text-slate-800 truncate">{{ item.product.name }}</p>
            <p class="text-xs text-amber-700 font-semibold">{{ formatRupiah(item.product.price) }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="decreaseQty(item.product.id)" class="w-7 h-7 bg-white rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm">
              <Minus class="w-3 h-3" />
            </button>
            <span class="w-6 text-center font-black text-sm">{{ item.quantity }}</span>
            <button @click="addToCart(item.product)" :disabled="item.quantity >= item.product.stock" class="w-7 h-7 bg-white rounded-lg flex items-center justify-center hover:bg-amber-50 text-amber-700 transition-colors shadow-sm disabled:opacity-40">
              <Plus class="w-3 h-3" />
            </button>
            <button @click="removeFromCart(item.product.id)" class="w-7 h-7 bg-white rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm ml-1">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Total -->
        <div class="border-t border-amber-200 pt-3 flex items-center justify-between">
          <span class="font-bold text-slate-700">Total Bayar</span>
          <span class="text-xl font-black text-amber-700">{{ formatRupiah(cartTotal) }}</span>
        </div>

        <BaseButton variant="primary" class="w-full" @click="openCheckout">
          <ShoppingBag class="w-4 h-4 mr-2" />
          Lanjut Pesan ({{ cartCount }} item)
        </BaseButton>
      </div>
    </BaseModal>

    <!-- ===================== CHECKOUT MODAL ===================== -->
    <BaseModal :show="showCheckout" title="Konfirmasi Pesanan" @close="showCheckout = false">
      <div class="space-y-4">

        <!-- Info Pelanggan (auto dari akun) -->
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
          <p class="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Info Pemesan</p>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-xs text-slate-500">Nama</span>
              <p class="font-bold text-slate-800">{{ customerName }}</p>
            </div>
            <div>
              <span class="text-xs text-slate-500">Kontak</span>
              <p class="font-bold text-slate-800">{{ customerPhone }}</p>
            </div>
          </div>
        </div>

        <!-- Ringkasan Pesanan -->
        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ringkasan Pesanan</p>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <div
              v-for="item in cart"
              :key="item.product.id"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-700">{{ item.product.name }} <span class="text-slate-400">x{{ item.quantity }}</span></span>
              <span class="font-semibold text-slate-800">{{ formatRupiah(item.product.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="border-t pt-2 flex justify-between font-black">
            <span>Total</span>
            <span class="text-amber-700 text-lg">{{ formatRupiah(cartTotal) }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Metode Pembayaran</p>
          <label
            class="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer"
            :class="paymentMethod === 'cash_on_pickup' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'"
          >
            <input v-model="paymentMethod" type="radio" value="cash_on_pickup" class="text-amber-600 focus:ring-amber-500" />
            <span class="text-sm font-semibold text-slate-800">Tunai di kasir saat mengambil pesanan</span>
          </label>
          <label
            class="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer"
            :class="paymentMethod === 'qris' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'"
          >
            <input v-model="paymentMethod" type="radio" value="qris" class="text-amber-600 focus:ring-amber-500" />
            <span class="text-sm font-semibold text-slate-800">QRIS — bayar sebelum pesanan diproses</span>
          </label>
          <div v-if="paymentMethod === 'qris'" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center space-y-2">
            <img
              src="/qris-donat-bu-diana.png"
              alt="Kode QRIS Donat Bu Diana"
              class="mx-auto max-h-72 w-auto max-w-full rounded-lg object-contain"
            />
            <p class="text-sm font-bold text-slate-800">Bayar tepat {{ formatRupiah(cartTotal) }}</p>
            <p class="text-xs text-slate-600">
              Scan QRIS dari perangkat lain. Pesanan menunggu kasir memeriksa pembayaran di aplikasi merchant.
            </p>
          </div>
        </div>

        <!-- Catatan -->
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Catatan (opsional)</label>
          <textarea
            v-model="checkoutNotes"
            rows="2"
            placeholder="Contoh: tanpa gula, tambah topping, dll."
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          ></textarea>
        </div>

        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="showCheckout = false">Batal</BaseButton>
          <BaseButton variant="primary" class="flex-1" :loading="isSubmitting" @click="submitOrder">
            <ClipboardList class="w-4 h-4 mr-2" />
            Konfirmasi Pesanan
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- ===================== SUCCESS MODAL ===================== -->
    <BaseModal :show="showSuccess" title="Pesanan Berhasil!" @close="showSuccess = false">
      <div class="text-center space-y-4 py-4">
        <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <p class="text-slate-600 text-sm">Pesananmu sedang diproses oleh kasir.</p>
          <p class="text-slate-600 text-sm mt-1">Simpan nomor invoice berikut untuk melacak pesanan:</p>
        </div>
        <div class="bg-amber-50 border-2 border-amber-300 border-dashed rounded-2xl p-4">
          <p class="text-xs text-amber-600 font-bold uppercase tracking-wider">No. Invoice</p>
          <p class="text-2xl font-black text-amber-800 tracking-widest mt-1">{{ lastOrder.invoiceNo }}</p>
        </div>
        <div class="text-left bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600">Rincian Tagihan</h3>
          <div
            v-for="item in lastOrder.items"
            :key="item.productId"
            class="flex justify-between gap-3 text-xs text-slate-700"
          >
            <span>{{ item.productName }} × {{ item.quantity }}</span>
            <span class="font-semibold shrink-0">{{ formatRupiah(item.subtotal) }}</span>
          </div>
          <div class="border-t border-slate-200 pt-3 flex justify-between items-center">
            <span class="font-bold text-slate-700">Total tagihan</span>
            <span class="text-lg font-black text-amber-700">{{ formatRupiah(lastOrder.grandTotal) }}</span>
          </div>
          <p class="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">
            Pembayaran:
            {{ lastOrder.paymentMethod === 'cash_on_pickup' ? 'tunai di kasir saat mengambil pesanan' : 'QRIS — menunggu verifikasi kasir' }}.
          </p>
          <div v-if="lastOrder.paymentMethod === 'qris'" class="text-center rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
            <img
              src="/qris-donat-bu-diana.png"
              alt="Kode QRIS Donat Bu Diana"
              class="mx-auto max-h-72 w-auto max-w-full rounded-lg object-contain"
            />
            <p class="text-sm font-bold text-slate-800">Bayar {{ formatRupiah(lastOrder.grandTotal) }}</p>
            <p class="text-xs text-slate-600">Simpan bukti pembayaran. Kasir akan memeriksa pembayaran sebelum pesanan diselesaikan.</p>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <router-link
            to="/track"
            class="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 rounded-xl transition-all"
            @click="showSuccess = false"
          >
            <Search class="w-4 h-4" />
            Lacak Pesanan
          </router-link>
          <BaseButton variant="secondary" class="flex-1" @click="showSuccess = false">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
