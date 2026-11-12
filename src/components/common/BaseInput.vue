<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: () => 'input-' + Math.random().toString(36).substring(2, 9)
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-xs font-semibold uppercase tracking-wider text-[#5b493b] mb-1.5">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>
    
    <div class="relative rounded-xl">
      <div v-if="$slots.prefix" class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9b8872]">
        <slot name="prefix" />
      </div>

      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="block w-full rounded-xl border border-[#e3d8c7] bg-[#fffdf9] px-3.5 py-2.5 text-sm text-[#37271f] placeholder-[#a99b8b] transition-colors focus:border-[#b38a50] focus:outline-none focus:ring-2 focus:ring-[#ead9ba] disabled:bg-[#f2eee7] disabled:text-[#a99b8b]"
        :class="[
          $slots.prefix ? 'pl-10' : '',
          $slots.suffix ? 'pr-10' : '',
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#9b8872]">
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="error" class="mt-1.5 text-xs text-rose-600 font-medium">{{ error }}</p>
    <p v-else-if="helpText" class="mt-1.5 text-xs text-slate-500">{{ helpText }}</p>
  </div>
</template>
