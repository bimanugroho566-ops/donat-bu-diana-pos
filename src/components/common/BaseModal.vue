<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'max-w-lg',
    validator: (v) => ['max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-4xl'].includes(v)
  }
})

const emit = defineEmits(['close'])

function handleKeydown(e) {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241811]/65 backdrop-blur-sm overflow-y-auto"
        @click.self="emit('close')"
      >
        <div
          class="w-full bg-[#fffdf9] rounded-2xl shadow-2xl border border-[#e7dccb] overflow-hidden transform transition-all my-8"
          :class="maxWidth"
        >
          <!-- Header -->
          <div class="px-6 py-4.5 border-b border-[#e9dfd0] flex items-center justify-between bg-[#f8f3ea]">
            <h3 class="text-base font-bold text-[#37271f]">
              <slot name="title">{{ title }}</slot>
            </h3>
            <button
              type="button"
              class="p-1 rounded-lg text-[#9b8872] hover:text-[#4b3022] hover:bg-[#efe6d9] transition-colors"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 max-h-[75vh] overflow-y-auto">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-[#e9dfd0] bg-[#f8f3ea] flex items-center justify-end gap-2.5">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
