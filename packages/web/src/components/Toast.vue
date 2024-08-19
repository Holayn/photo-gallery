<template>
  <div v-if="showToast" class="fixed bottom-0 right-0 z-[99]">
    <div ref="toast" class="mr-16 mb-16 bg-white py-4 px-8 rounded-md shadow-lg">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toast',
  data() {
    return {
      showToast: false,
      toastMessage: '',
    }
  },
  mounted() {
    window.addEventListener('show-toast', async e => {
      this.toastMessage = e.detail.message;
      this.showToast = true;
      await this.$nextTick();
      this.$refs.toast.animate([
        {
          transform: 'translateY(100%)',
        },
        {
          transform: 'translateY(0)',
        }
      ], { duration: 100, easing: 'ease-in' })
    });
    window.addEventListener('hide-toast', () => {
      this.toastMessage = '';
      this.showToast = false;
    });
  },
}
</script>
