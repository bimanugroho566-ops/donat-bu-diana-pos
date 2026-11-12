<script setup>
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'
import BaseButton from '../components/common/BaseButton.vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center text-center px-4">
    <div class="space-y-4 max-w-md">
      <img src="/donut-icon.svg" alt="" class="w-20 h-20 mx-auto object-contain" />
      <h1 class="text-3xl font-black text-slate-900">404 - Halaman Tidak Ditemukan</h1>
      <p class="text-xs text-slate-500">
        Halaman yang Anda tuju mungkin telah dipindahkan atau Anda tidak memiliki hak akses role ke URL tersebut.
      </p>
      <div class="pt-4">
        <BaseButton variant="primary" @click="router.push('/')">
          <Home class="w-4 h-4" />
          Kembali ke Beranda
        </BaseButton>
      </div>
    </div>
  </div>
</template>
