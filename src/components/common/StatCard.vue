<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtext: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'amber',
    validator: (v) => ['amber', 'emerald', 'blue', 'rose', 'purple'].includes(v)
  }
})
</script>

<template>
  <div class="bg-[#fffdf9] rounded-2xl p-5 border border-[#e9dfd0] shadow-[0_10px_28px_rgba(70,49,32,0.06)] hover:shadow-[0_14px_32px_rgba(70,49,32,0.1)] transition-shadow">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ title }}</p>
        <h4 class="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">{{ value }}</h4>
        <p v-if="subtext" class="mt-1 text-xs text-slate-500">{{ subtext }}</p>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        :class="[
          color === 'amber' ? 'bg-amber-100 text-amber-700' : '',
          color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : '',
          color === 'blue' ? 'bg-sky-100 text-sky-700' : '',
          color === 'rose' ? 'bg-rose-100 text-rose-700' : '',
          color === 'purple' ? 'bg-purple-100 text-purple-700' : ''
        ]"
      >
        <slot name="icon" />
      </div>
    </div>
  </div>
</template>
