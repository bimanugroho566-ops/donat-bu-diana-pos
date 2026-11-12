<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { 
  LogIn, 
  AlertCircle, 
  UserPlus, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Phone,
  Mail,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Sparkles
} from 'lucide-vue-next'
import BaseButton from '../../components/common/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Tab aktif: 'login' atau 'register'
const activeTab = ref('login')

// Form Login State
const loginEmail = ref('')
const loginPassword = ref('')
const showLoginPassword = ref(false)

// Form Register Pelanggan State
const regName = ref('')
const regPhone = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const showRegPassword = ref(false)

// Feedback State
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const currentUser = computed(() => authStore.currentUser)
const isAuthenticated = computed(() => authStore.isAuthenticated)

async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!loginEmail.value.trim() || !loginPassword.value.trim()) {
    errorMessage.value = 'Silakan masukkan email dan kata sandi Anda!'
    return
  }

  isLoading.value = true
  try {
    const res = await authStore.login(loginEmail.value, loginPassword.value)
    if (res.success) {
      redirectUser(res.user.role)
    } else {
      errorMessage.value = res.message
    }
  } catch (error) {
    errorMessage.value = error.message || 'Login gagal. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!regName.value.trim() || !regEmail.value.trim() || !regPassword.value.trim()) {
    errorMessage.value = 'Nama lengkap, email, dan kata sandi wajib diisi!'
    return
  }

  if ((regPhone.value.match(/\d/g) || []).length < 8) {
    errorMessage.value = 'Nomor telepon minimal 8 digit agar pesanan dapat dilacak.'
    return
  }

  if (regPassword.value !== regConfirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok! Silakan periksa kembali.'
    return
  }

  if (regPassword.value.length < 6) {
    errorMessage.value = 'Kata sandi minimal 6 karakter!'
    return
  }

  isLoading.value = true
  try {
    const res = await authStore.register({
      name: regName.value,
      phone: regPhone.value,
      email: regEmail.value,
      password: regPassword.value
    })

    if (res.success) {
      successMessage.value = res.confirmationRequired
        ? `Pendaftaran berhasil. Buka email ${res.user.email} untuk konfirmasi akun, lalu masuk.`
        : `Pendaftaran berhasil! Akun ${res.user.name} telah terdaftar. Silakan masuk.`
      loginEmail.value = res.user.email
      loginPassword.value = ''
      regName.value = ''
      regPhone.value = ''
      regEmail.value = ''
      regPassword.value = ''
      regConfirmPassword.value = ''
      activeTab.value = 'login'
    } else {
      errorMessage.value = res.message
    }
  } catch (error) {
    errorMessage.value = error.message || 'Pendaftaran gagal. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

function redirectUser(role) {
  const redirect = route.query.redirect
  if (redirect) {
    router.push(redirect)
  } else if (role === 'pemilik') {
    router.push('/owner/dashboard')
  } else if (role === 'kasir') {
    router.push('/cashier/pos')
  } else {
    router.push('/catalog')
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
    loginEmail.value = ''
    loginPassword.value = ''
  } catch (error) {
    errorMessage.value = error.message
  }
}
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-lg">
      <!-- Jika Pengguna Sudah Login Saat Membuka Halaman Login -->
      <div
        v-if="isAuthenticated && currentUser"
        class="bg-[#fffdf9] rounded-3xl p-8 border border-[#e7dccb] shadow-[0_24px_70px_rgba(70,49,32,0.12)] text-center space-y-6"
      >
        <div class="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto text-3xl">
          👋
        </div>
        <div>
          <span class="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">Sesi Aktif</span>
          <h2 class="text-2xl font-black text-slate-900">Halo, {{ currentUser.name }}!</h2>
          <p class="text-xs text-slate-500 mt-1">
            Anda saat ini sedang masuk ke sistem dengan hak akses role
            <strong class="text-amber-800 uppercase font-extrabold">[{{ currentUser.role }}]</strong>.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <BaseButton variant="primary" class="w-full sm:w-auto" @click="redirectUser(currentUser.role)">
            Lanjutkan ke Halaman Saya
            <ArrowRight class="w-4 h-4" />
          </BaseButton>

          <BaseButton variant="outline" class="w-full sm:w-auto text-rose-600 hover:bg-rose-50 border-rose-200" @click="handleLogout">
            <LogOut class="w-4 h-4" />
            Keluar / Ganti Akun Lain
          </BaseButton>
        </div>
      </div>

      <!-- Kartu Formulir Login & Register Utama -->
      <div v-else class="bg-[#fffdf9] rounded-3xl p-6 sm:p-10 border border-[#e7dccb] shadow-[0_24px_70px_rgba(70,49,32,0.12)] space-y-6">
        <!-- Logo & Judul -->
        <div class="text-center space-y-2">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#4b3022] via-[#79502f] to-[#c19a5c] mx-auto flex items-center justify-center text-3xl shadow-xl shadow-[#8f6936]/20 text-white transform hover:scale-105 transition-transform">
            <img src="/donut-icon.svg" alt="Logo Donat Bu Diana" class="w-12 h-12 object-contain" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Donat Bu Diana
          </h2>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Sistem Informasi Manajemen, Kasir POS & Pemesanan Donat Kentang
          </p>
        </div>

        <!-- Tab Toggle: Masuk vs Daftar Pelanggan -->
        <div class="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="activeTab = 'login'; errorMessage = ''; successMessage = ''"
          >
            <LogIn class="w-4 h-4" />
            Masuk (Login)
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="activeTab = 'register'; errorMessage = ''; successMessage = ''"
          >
            <UserPlus class="w-4 h-4" />
            Daftar Pelanggan Baru
          </button>
        </div>

        <!-- Alert Sukses -->
        <div
          v-if="successMessage"
          class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs font-semibold"
        >
          <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Alert Error (QA-02) -->
        <div
          v-if="errorMessage"
          class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold animate-bounce"
        >
          <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-bold">Perhatian!</p>
            <p class="text-rose-600 font-normal mt-0.5">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- TAB 1: FORM LOGIN -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="loginEmail"
                type="email"
                placeholder="nama@email.com"
                required
                class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
              />
            </div>
          </div>

          <!-- Password Input with Toggle Eye -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="loginPassword"
                :type="showLoginPassword ? 'text' : 'password'"
                placeholder="Masukkan kata sandi Anda"
                required
                class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                @click="showLoginPassword = !showLoginPassword"
              >
                <EyeOff v-if="showLoginPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              class="w-full shadow-lg shadow-amber-600/20"
              :loading="isLoading"
            >
              <LogIn class="w-4 h-4" />
              Masuk ke Sistem
            </BaseButton>
          </div>

        </form>

        <!-- TAB 2: FORM REGISTER PELANGGAN -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <!-- Nama Lengkap -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nama Lengkap <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User class="w-4 h-4" />
              </div>
              <input
                v-model="regName"
                type="text"
                placeholder="Contoh: Budi Santoso"
                required
                class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
              />
            </div>
          </div>

          <!-- Nomor WhatsApp / HP -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nomor WhatsApp / HP <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone class="w-4 h-4" />
              </div>
              <input
                v-model="regPhone"
                type="text"
                placeholder="Contoh: 081234567890"
                required
                class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="regEmail"
                type="email"
                placeholder="nama@email.com"
                required
                class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
              />
            </div>
          </div>

          <!-- Password & Confirm Password -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  v-model="regPassword"
                  :type="showRegPassword ? 'text' : 'password'"
                  placeholder="Minimal 6 karakter"
                  required
                  class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  @click="showRegPassword = !showRegPassword"
                >
                  <EyeOff v-if="showRegPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Konfirmasi Sandi <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  v-model="regConfirmPassword"
                  :type="showRegPassword ? 'text' : 'password'"
                  placeholder="Ulangi sandi"
                  required
                  class="block w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors font-medium"
                />
              </div>
            </div>
          </div>

          <!-- Submit Button Register -->
          <div class="pt-2">
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              class="w-full shadow-lg shadow-amber-600/20"
              :loading="isLoading"
            >
              <UserPlus class="w-4 h-4" />
              Daftar Sekarang
            </BaseButton>
          </div>
        </form>

        <!-- Footer Alternative: Tamu / Pelanggan -->
        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Ingin melihat donat tanpa login?</span>
          <router-link
            to="/catalog"
            class="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
          >
            Buka Katalog Menu Donat <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
