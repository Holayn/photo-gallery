<template>
  <button
    class="relative shrink-0 h-10 rounded-sm"
    :class="[active ? 'w-12 md:w-16' : 'w-8 md:w-10', { 'border-2': active }]"
    @click.stop="$emit('click')"
  >
    <div v-if="error" class="h-full w-full rounded-sm bg-slate-700 flex items-center justify-center text-white text-xs">:(</div>
    <template v-else>
      <div v-if="!loaded" class="h-full w-full rounded-sm bg-slate-700 flex items-center justify-center">
        <Loading class="w-6 h-6"></Loading>
      </div>
      <img
        class="h-full w-full rounded-sm object-cover"
        :class="{ hidden: !loaded }"
        :src="photo.urls.view[PHOTO_SIZES.THUMB]"
        :alt="photo.metadata.fileName"
        @load="loaded = true"
        @error="error = true"
      >
    </template>
    <div v-if="photo.metadata.video" class="absolute bottom-0.5 right-0.5">
      <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
    </div>
  </button>
</template>

<script>
import Loading from './Loading.vue';
import { PHOTO_SIZES } from '../services/api';

export default {
  name: 'PhotoStripPhoto',
  components: {
    Loading,
  },
  props: {
    photo: {
      type: Object,
      required: true,
    },
    active: Boolean,
  },
  emits: ['click'],
  setup() {
    return { PHOTO_SIZES };
  },
  data() {
    return {
      loaded: false,
      error: false,
    };
  },
  methods: {
    // Lets the parent scroll the active thumbnail into view via a template ref.
    scrollIntoView(options) {
      this.$el.scrollIntoView(options);
    },
  },
}
</script>
