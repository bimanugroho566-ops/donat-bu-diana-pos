import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSupabaseClient } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const supabase = getSupabaseClient()
  const users = ref([])
  const currentUser = ref(null)
  const initialized = ref(false)
  let authSubscription

  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed(() => currentUser.value?.role || 'guest')
  const isOwner = computed(() => currentRole.value === 'pemilik')
  const isCashier = computed(() => currentRole.value === 'kasir')
  const isCustomer = computed(() => currentRole.value === 'pelanggan')
  const allCustomers = computed(() => users.value)

  function toAppUser(authUser, profile) {
    const name = profile.full_name || authUser.email || 'Pelanggan'
    return {
      id: authUser.id,
      email: authUser.email || profile.email || '',
      name,
      phone: profile.phone || '',
      role: profile.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
    }
  }

  async function loadProfile(authUser) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role')
      .eq('id', authUser.id)
      .single()

    if (error) throw new Error(`Gagal memuat profil: ${error.message}`)
    if (!data) throw new Error('Profil akun belum tersedia. Hubungi pemilik untuk memeriksa akun Supabase.')

    currentUser.value = toAppUser(authUser, data)
    return currentUser.value
  }

  async function initialize() {
    if (initialized.value) return

    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(`Gagal memulihkan sesi Supabase: ${error.message}`)

    if (data.session?.user) {
      await loadProfile(data.session.user)
    }

    if (!authSubscription) {
      const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) currentUser.value = null
      })
      authSubscription = subscriptionData.subscription
    }

    initialized.value = true
  }

  async function loadCustomers() {
    if (!isOwner.value) {
      throw new Error('Hanya pemilik yang dapat melihat daftar pelanggan.')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role')
      .eq('role', 'pelanggan')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Gagal memuat pelanggan: ${error.message}`)
    users.value = data.map(profile => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.full_name,
      phone: profile.phone || '',
      role: profile.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.full_name)}`
    }))
    return users.value
  }

  async function login(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Email dan kata sandi wajib diisi.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) return { success: false, message: error.message }

    try {
      const user = await loadProfile(data.user)
      return { success: true, user }
    } catch (profileLoadError) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) console.error('Gagal mengakhiri sesi tanpa profil:', signOutError)
      return { success: false, message: profileLoadError.message }
    }
  }

  async function register(payload) {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.phone?.trim() || !payload.password) {
      return { success: false, message: 'Nama, email, nomor telepon, dan kata sandi wajib diisi.' }
    }
    if ((payload.phone.match(/\d/g) || []).length < 8) {
      return { success: false, message: 'Nomor telepon minimal 8 digit.' }
    }
    if (payload.password.length < 6) {
      return { success: false, message: 'Kata sandi minimal 6 karakter.' }
    }

    const email = payload.email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: payload.name.trim(),
          phone: payload.phone?.trim() || ''
        }
      }
    })

    if (error) return { success: false, message: error.message }

    if (data.session && data.user) {
      await loadProfile(data.user)
    }

    return {
      success: true,
      confirmationRequired: !data.session,
      user: {
        id: data.user?.id,
        email,
        name: payload.name.trim()
      }
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(`Gagal keluar dari akun: ${error.message}`)
    currentUser.value = null
    users.value = []
  }

  return {
    users,
    currentUser,
    initialized,
    isAuthenticated,
    currentRole,
    isOwner,
    isCashier,
    isCustomer,
    allCustomers,
    initialize,
    loadCustomers,
    login,
    register,
    logout
  }
})
