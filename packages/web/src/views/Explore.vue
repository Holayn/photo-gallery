<template>
  <Modal v-if="loading" size="md" @close="onExploreLoadClose">
    <div class="flex flex-col items-center gap-4 py-4">
      <Loading class="w-16 h-16"></Loading>
      <div>Loading Explore...</div>
    </div>
  </Modal>
  <Lightbox 
    v-if="showLightbox" 
    :photos="photos" 
    :index="photosIdx"
    :preview-size="PHOTO_SIZES.SMALL"
    @index-update="onLightboxIndexUpdate"
    @close="onLightboxClose" 
  >
    <template #additionalHeaderControls>
      <Loading v-if="loadingNext" class="w-8 h-8 ml-4"></Loading>
      <sl-dropdown>
        <sl-icon-button slot="trigger" name="three-dots-vertical" label="Options" style="color: white;"></sl-icon-button>
        <sl-menu @sl-select="onMenuSelect">
          <sl-menu-item value="clear-history">Clear explore history</sl-menu-item>
        </sl-menu>
      </sl-dropdown>
    </template>
  </Lightbox>
</template>

<script>
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import { getExploreNext, getSources, PHOTO_SIZES, clearExploreHistory } from '../services/api';
import Lightbox from '../components/Lightbox.vue';
import Photo from '../model/photo';

export default {
  name: 'Explore',
  components: {
    Loading,
    Modal,
    Lightbox,
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      loadingNext: false,
      showLightbox: false,

      photos: [],
      photosIdx: 0,
      sources: null,
      
      PHOTO_SIZES,
    };
  },
  async mounted() {
    this.startExplore();
  },
  methods: {
    async startExplore() {
      this.loading = true;

      try {
        const [currentPhoto, nextPhoto, sources] = await Promise.all([
          getExploreNext(),
          getExploreNext(),
          getSources(),
        ]);

        if (!currentPhoto) {
          alert('No photos available for Explore.');
          return;
        }

        this.photos.push(new Photo({ ...currentPhoto, source: sources.find(s => s.id === currentPhoto.sourceId) }));
        if (nextPhoto) {
          this.photos.push(new Photo({ ...nextPhoto, source: sources.find(s => s.id === nextPhoto.sourceId) }));
        }
        this.sources = sources;

        this.showLightbox = true;
      } catch (e) {
        console.error('Error loading photos:', e);
        alert('Error loading Explore. Please try again later.');
        this.$emit('close');
      } finally {
        this.loading = false;
      }
    },
    async loadNextPhoto() {
      try {
        const response = await getExploreNext();
        if (!response) {
          alert('No more photos available for Explore.');
          return;
        }

        this.photos.push(new Photo({ ...response, source: this.sources.find(s => s.id === response.sourceId) }));
      } catch (e) {
        console.error('Error loading next photo:', e);
        alert('Error loading next photo.');
      }
    },

    onMenuSelect(event) {
      const value = event.detail.item.value;
      if (value === 'clear-history') {
        this.clearHistory();
      }
    },
    async clearHistory() {
      if (!confirm('Clear all explore history? You will start seeing photos from the beginning again.')) return;
      try {
        await clearExploreHistory();
        this.$emit('restart');
      } catch (e) {
        console.error('Error clearing explore history:', e);
        alert('Failed to clear explore history.');
      }
    },
    onExploreLoadClose() {
      if (this.loading) {
        this.$emit('close');
      }
    },

    onLightboxClose() {
      this.$emit('close');
    },

    async onLightboxIndexUpdate(index) {
      this.photosIdx = index;

      if (this.photosIdx === this.photos.length - 1) {
        this.loadingNext = true;
        await this.loadNextPhoto();
        this.loadingNext = false;
      }
    },
  },
};
</script>
