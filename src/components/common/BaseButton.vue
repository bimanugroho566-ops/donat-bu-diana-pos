<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'success', 'outline', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
    :class="[
      // Size
      size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : '',
      size === 'md' ? 'px-4 py-2.5 text-sm gap-2' : '',
      size === 'lg' ? 'px-6 py-3 text-base gap-2.5 font-semibold' : '',
      
      // Variants
      variant === 'primary' ? 'bg-[#4b3022] hover:bg-[#352116] text-white shadow-md shadow-[#4b3022]/15 focus:ring-[#b38a50]' : '',
      variant === 'secondary' ? 'bg-[#f1e5d0] hover:bg-[#e8d7ba] text-[#533a29] focus:ring-[#c9a56d]' : '',
      variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 focus:ring-rose-500' : '',
      variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 focus:ring-emerald-500' : '',
      variant === 'outline' ? 'border border-[#d9cbb5] hover:bg-[#f8f3ea] text-[#58483b] focus:ring-[#c9a56d]' : '',
      variant === 'ghost' ? 'text-[#6f6053] hover:bg-[#f2ece2] focus:ring-[#c9a56d]' : ''
    ]"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
    <slot />
  </button>
</template>
