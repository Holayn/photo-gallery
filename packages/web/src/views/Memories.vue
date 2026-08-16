<template>
  <div class="px-6 py-4">
    <h1 class="mt-4 md:mt-0 mb-4 text-2xl">Memories</h1>
    <MemoriesList layout="grid"></MemoriesList>
  </div>
</template>

<script>
import MemoriesList from '../components/MemoriesList.vue';

export default {
  name: 'Memories',
  components: {
    MemoriesList,
  },
}
</script>
