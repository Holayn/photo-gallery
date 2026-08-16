<template>
  <div class="px-6 py-4">
    <div class="mb-2">
      <button class="text-lg flex items-center gap-1" @click="$router.push({ name: 'memories' })">
        Memories
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <MemoriesList layout="row"></MemoriesList>
  </div>
</template>

<script>
import MemoriesList from '../components/MemoriesList.vue';

export default {
  name: 'Photos',
  components: {
    MemoriesList,
  },
}
</script>
