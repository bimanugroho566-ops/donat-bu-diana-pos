<script setup>
import { ref, computed } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Package, 
  CheckCircle2,
  DollarSign
} from 'lucide-vue-next'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseInput from '../../components/common/BaseInput.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseModal from '../../components/common/BaseModal.vue'

const productStore = useProductStore()

const searchQuery = ref('')
const selectedCategory = ref('Semua')

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const currentEditId = ref(null)
const formError = ref('')
const formSuccess = ref('')

const formData = ref({
  name: '',
  category: 'Classic',
  costPrice: 0,
  price: 0,
  stock: 0,
  minStock: 10,
  unit: 'pcs',
  image: '',
  description: '',
  isActive: true
})

const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  return productStore.allProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        p.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'Semua' || p.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

function openAddModal() {
  isEditing.value = false
  currentEditId.value = null
  formError.value = ''
  formSuccess.value = ''
  formData.value = {
    name: '',
    category: 'Classic',
    costPrice: 3000,
    price: 7000,
    stock: 20,
    minStock: 10,
    unit: 'pcs',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=60',
    description: '',
    isActive: true
  }
  isModalOpen.value = true
}

function openEditModal(prod) {
  isEditing.value = true
  currentEditId.value = prod.id
  formError.value = ''
  formSuccess.value = ''
  formData.value = {
    name: prod.name,
    category: prod.category,
    costPrice: prod.costPrice,
    price: prod.price,
    stock: prod.stock,
    minStock: prod.minStock,
    unit: prod.unit,
    image: prod.image,
    description: prod.description,
    isActive: prod.isActive
  }
  isModalOpen.value = true
}

async function handleSubmit() {
  formError.value = ''
  
  // Validasi Input (QA-04 Test Case: Menyimpan produk baru dengan harga 0 ditolak)
  if (!formData.value.name.trim()) {
    formError.value = 'Nama varian donat wajib diisi!'
    return
  }

  const priceNum = Number(formData.value.price)
  if (isNaN(priceNum) || priceNum <= 0) {
    formError.value = 'Harga jual tidak boleh Rp 0 atau bernilai minus! (Wajib lebih dari 0)'
    return
  }

  const stockNum = Number(formData.value.stock)
  if (isNaN(stockNum) || stockNum < 0) {
    formError.value = 'Jumlah stok tidak boleh kurang dari 0!'
    return
  }

  try {
    if (isEditing.value) {
      await productStore.updateProduct(currentEditId.value, formData.value)
    } else {
      await productStore.addProduct(formData.value)
    }
    isModalOpen.value = false
  } catch (error) {
    formError.value = error.message
  }
}

async function handleDelete(id, name) {
  if (confirm(`Apakah Anda yakin ingin menghapus "${name}"? Tindakan ini akan menghapus produk dari katalog bersama.`)) {
    try {
      await productStore.deleteProduct(id)
    } catch (error) {
      window.alert(error.message)
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Manajemen Data Master Donat</h1>
        <p class="text-xs text-slate-500 mt-1">Kelola daftar produk, harga modal, harga jual, stok, dan kategori donat.</p>
      </div>
      <BaseButton variant="primary" @click="openAddModal">
        <Plus class="w-4 h-4" />
        Tambah Varian Baru
      </BaseButton>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="w-full md:w-80">
        <BaseInput
          v-model="searchQuery"
          placeholder="Cari donat berdasarkan nama atau ID..."
        >
          <template #prefix>
            <Search class="w-4 h-4" />
          </template>
        </BaseInput>
      </div>

      <!-- Categories Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          :class="selectedCategory === cat ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
            <tr>
              <th class="py-4 px-4">Produk</th>
              <th class="py-4 px-3">Kategori</th>
              <th class="py-4 px-3">Modal (HPP)</th>
              <th class="py-4 px-3">Harga Jual</th>
              <th class="py-4 px-3">Margin Laba</th>
              <th class="py-4 px-3 text-center">Stok Sisa</th>
              <th class="py-4 px-3 text-center">Status</th>
              <th class="py-4 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredProducts.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <Package class="w-8 h-8 mx-auto mb-2 opacity-40" />
                Tidak ada varian donat yang sesuai dengan pencarian.
              </td>
            </tr>

            <tr
              v-for="prod in filteredProducts"
              :key="prod.id"
              class="hover:bg-amber-50/30 transition-colors"
            >
              <!-- Info Produk -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="prod.image"
                    :alt="prod.name"
                    class="w-12 h-12 rounded-xl object-cover bg-amber-50 border border-amber-100 shrink-0"
                  />
                  <div>
                    <span class="font-mono text-[10px] text-slate-400 font-bold block">{{ prod.id }}</span>
                    <span class="font-bold text-slate-900 text-xs block">{{ prod.name }}</span>
                    <span class="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{{ prod.description }}</span>
                  </div>
                </div>
              </td>

              <!-- Kategori -->
              <td class="py-3.5 px-3">
                <BaseBadge variant="primary" size="sm">{{ prod.category }}</BaseBadge>
              </td>

              <!-- Harga Modal -->
              <td class="py-3.5 px-3 font-medium text-slate-600">
                {{ formatRupiah(prod.costPrice) }}
              </td>

              <!-- Harga Jual -->
              <td class="py-3.5 px-3 font-bold text-slate-900">
                {{ formatRupiah(prod.price) }}
              </td>

              <!-- Margin -->
              <td class="py-3.5 px-3">
                <span class="text-emerald-700 font-bold">
                  +{{ formatRupiah(prod.price - prod.costPrice) }}
                </span>
                <span class="text-[10px] text-slate-400 block">
                  ({{ Math.round(((prod.price - prod.costPrice) / prod.price) * 100) }}%)
                </span>
              </td>

              <!-- Stok -->
              <td class="py-3.5 px-3 text-center">
                <span
                  class="font-black px-2.5 py-1 rounded-lg inline-block text-xs"
                  :class="prod.stock <= prod.minStock ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-800'"
                >
                  {{ prod.stock }} {{ prod.unit }}
                </span>
                <span v-if="prod.stock <= prod.minStock" class="text-[10px] text-rose-600 font-bold block mt-0.5">
                  Menipis!
                </span>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-3 text-center">
                <BaseBadge size="sm" :variant="prod.isActive ? 'success' : 'default'">
                  {{ prod.isActive ? 'Aktif' : 'Nonaktif' }}
                </BaseBadge>
              </td>

              <!-- Aksi -->
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Ubah Data"
                    @click="openEditModal(prod)"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Hapus Donat"
                    @click="handleDelete(prod.id, prod.name)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit Donat -->
    <BaseModal
      :show="isModalOpen"
      :title="isEditing ? 'Ubah Data Varian Donat' : 'Tambah Varian Donat Baru'"
      maxWidth="max-w-xl"
      @close="isModalOpen = false"
    >
      <!-- Error Alert in Modal -->
      <div
        v-if="formError"
        class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4 text-xs">
        <BaseInput
          v-model="formData.name"
          label="Nama Varian Donat"
          placeholder="Contoh: Donat Pandan Srikaya"
          required
        />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Kategori</label>
            <select
              v-model="formData.category"
              class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="Classic">Classic</option>
              <option value="Premium">Premium</option>
              <option value="Bomboloni">Bomboloni</option>
              <option value="Beverage">Beverage (Minuman)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Satuan</label>
            <select
              v-model="formData.unit"
              class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="pcs">pcs (buah)</option>
              <option value="cup">cup (gelas)</option>
              <option value="box">box (kotak)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput
            v-model.number="formData.costPrice"
            type="number"
            label="Harga Modal (HPP - Rp)"
            placeholder="3000"
            required
          />

          <BaseInput
            v-model.number="formData.price"
            type="number"
            label="Harga Jual (Rp)"
            placeholder="7000"
            required
            helpText="Wajib bernilai lebih dari 0"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput
            v-model.number="formData.stock"
            type="number"
            label="Jumlah Stok Awal"
            placeholder="25"
            required
          />

          <BaseInput
            v-model.number="formData.minStock"
            type="number"
            label="Batas Minimum Stok (Alert)"
            placeholder="10"
            required
          />
        </div>

        <BaseInput
          v-model="formData.image"
          label="URL Gambar Donat"
          placeholder="https://..."
          helpText="Gunakan URL gambar Unsplash atau tautan gambar langsung"
        />

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Deskripsi Produk</label>
          <textarea
            v-model="formData.description"
            rows="2"
            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="Keterangan rasa, isian atau topping..."
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input
            id="statusActive"
            type="checkbox"
            v-model="formData.isActive"
            class="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
          />
          <label for="statusActive" class="text-xs font-medium text-slate-700">Tampilkan di katalog kasir & menu publik (Aktif)</label>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" size="sm" @click="isModalOpen = false">Batal</BaseButton>
        <BaseButton variant="primary" size="sm" @click="handleSubmit">
          <CheckCircle2 class="w-4 h-4" />
          {{ isEditing ? 'Simpan Perubahan' : 'Tambahkan Donat' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
