<script setup>
import { onMounted, ref, watch } from 'vue'
import AppNavbar from './components/layout/AppNavbar.vue'
import { useAuthStore } from './stores/authStore'
import { useProductStore } from './stores/productStore'
import { useTransactionStore } from './stores/transactionStore'

const authStore = useAuthStore()
const productStore = useProductStore()
const transactionStore = useTransactionStore()
const isLoading = ref(true)
const loadError = ref('')

async function loadAppData() {
  loadError.value = ''
  isLoading.value = true
  try {
    await productStore.loadProducts()
    if (authStore.currentUser) await transactionStore.loadTransactions()
  } catch (error) {
    loadError.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAppData)

watch(() => authStore.currentUser?.id, async (userId, previousId) => {
  if (!userId && previousId) {
    transactionStore.transactions = []
    transactionStore.isLoaded = false
    loadError.value = ''
    return
  }
  if (isLoading.value) return
  if (userId && userId !== previousId) {
    try {
      await transactionStore.loadTransactions()
      loadError.value = ''
    } catch (error) {
      loadError.value = error.message
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#f7f3ec] text-[#37271f]">
    <!-- Top Navigation Bar -->
    <AppNavbar />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="isLoading || loadError" class="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p v-if="isLoading" class="font-semibold text-slate-600">Memuat katalog dan data aplikasi...</p>
        <template v-else>
          <p class="font-semibold text-rose-700">{{ loadError }}</p>
          <button type="button" class="mt-4 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white" @click="loadAppData">
            Coba lagi
          </button>
        </template>
      </div>
      <router-view v-else v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="mt-8 bg-[#33231b] border-t border-[#4b3629] py-5 text-center text-xs text-[#d7c8b3]">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <img src="/donut-icon.svg" alt="" class="w-6 h-6 object-contain" />
          <span class="font-bold text-[#fffaf2]">Donat Bu Diana</span>
          <span class="text-[#bba990]">&copy; {{ new Date().getFullYear() }} · Dibuat segar setiap hari</span>
        </div>
        <span class="text-[11px] text-[#bba990]">Homemade Donuts & Coffee</span>
      </div>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
