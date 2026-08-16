<template>
  <button class="h-full w-full rounded-md flex flex-col" @click="$emit('click')">
    <div class="flex-auto p-1 bg-slate-100">
      <div v-if="error" class="h-full flex items-center justify-center">
        <div class="text-red-500 px-2">Failed to load cover</div>
      </div>
      <div v-else-if="covers" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
        <div v-for="photo in covers" :key="photo" class="relative">
          <div v-if="errorImages[photo]" class="flex justify-center items-center w-full h-full py-4">
            <div>:(</div>
          </div>
          <div v-else-if="!loadedImages[photo]" class="flex justify-center items-center w-full h-full py-4">
            <Loading class="w-8 h-8"></Loading>
          </div>
          <img class="rounded-sm w-full object-cover" :class="{ 'hidden': !loadedImages[photo] }" :src="photo" style="aspect-ratio: 1/1;" @load="imgLoad(photo)" @error="imgError(photo)">
        </div>
      </div>
      <div v-else class="flex h-full items-center justify-center">
        <Loading class="w-8 h-8 my-4"></Loading>
      </div>
    </div>

    <div class="h-16 p-1 w-full">
      <slot></slot>
    </div>
  </button>
</template>

<script>
import Loading from './Loading.vue';

export default {
  name: 'CollectionTile',
  components: {
    Loading,
  },
  props: {
    covers: {
      type: Array,
      default: null,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  data() {
    return {
      loadedImages: {},
      errorImages: {},
    };
  },
  methods: {
    imgLoad(photo) {
      this.loadedImages[photo] = true;
    },
    imgError(photo) {
      this.errorImages[photo] = true;
    },
  },
}
</script>
