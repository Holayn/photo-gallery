<template>
  <div class="fixed z-50 top-0 w-screen h-screen flex items-center justify-center bg-black/75" @click="$emit('close')">
    <div class="m-4 bg-white">
      <div class="p-4 h-full">
        <div class="flex justify-end">
          <div>
            <svg class="cursor-pointer" @click="$emit('close')" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        </div>
        <div class="mt-4">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
}
</script>
