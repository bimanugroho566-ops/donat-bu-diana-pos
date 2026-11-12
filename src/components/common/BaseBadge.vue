<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'primary', 'success', 'warning', 'danger', 'info'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v)
  }
})
</script>

<template>
  <span
    class="inline-flex items-center font-semibold rounded-full uppercase tracking-wider"
    :class="[
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      variant === 'default' ? 'bg-[#f2eee7] text-[#66584b] border border-[#e3d8c7]' : '',
      variant === 'primary' ? 'bg-[#f2e6d1] text-[#644622] border border-[#e7d3b1]' : '',
      variant === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : '',
      variant === 'warning' ? 'bg-[#fbf2df] text-[#755527] border border-[#ead4aa]' : '',
      variant === 'danger' ? 'bg-rose-100 text-rose-800 border border-rose-200' : '',
      variant === 'info' ? 'bg-sky-100 text-sky-800 border border-sky-200' : ''
    ]"
  >
    <slot />
  </span>
</template>
