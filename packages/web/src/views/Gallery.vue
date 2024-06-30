<template>
  <div ref="gallery" class="absolute inset-0 overflow-auto py-12" style="top: var(--header-height);">
    <div class="px-4 md:px-8 md:flex md:gap-8 items-center">
      <div class="flex-auto break-all">
        <slot name="heading"></slot>
      </div>
      <Teleport to="#headerAdditionalControls">
        <div v-if="$store.state.isAdmin" class="flex gap-4 justify-end">
          <div v-if="isSelectionMode" class="flex flex-col md:flex-row items-end md:items-center gap-2">
            <div>Selected: {{ Object.keys(selected).length }}</div>
            <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="showAlbumSelection()">Add to Existing Album</button>
            <div class="relative">
              <button class="btn px-2 py-1" :disabled="!Object.keys(selected).length" @click="createAlbumFromSelected()">Create Album</button>
              <div class="absolute top-0 left-0 flex justify-center w-full">
                <Loading v-if="loadingCreateAlbum" class="h-8 w-8"></Loading>
              </div>
            </div>
            <button @click="toggleSelect()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div v-else class="flex items-center"> 
            <div v-if="showDateSelection" class="mr-8"> 
              <input v-model="date" type="date" @blur="onDateBlur">
            </div>
            <button @click="toggleSelect()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </button>
          </div>
          <slot name="controls"></slot>
        </div>
      </Teleport>
    </div>

    <div ref="photos" class="mt-4 relative" :style="{ height: `${layout?.containerHeight}px` }">
      <div 
        v-if="layout" 
        v-for="(photo, i) in renderPhotos" 
        :ref="setGalleryImageRef"
        :key="photo.id" 
        :data-photo-id="photo.id"
        style="position: absolute;" 
        :style="{ 
          top: layout.boxes[i + renderPhotosStart].top + 'px', 
          left: layout.boxes[i + renderPhotosStart].left + 'px', 
          width: layout.boxes[i + renderPhotosStart].width + 'px', 
          height: layout.boxes[i + renderPhotosStart].height + 'px',
        }"
      >
        <div v-if="!loadedImages[photo.id]" class="flex justify-center items-center w-full h-full">
          <Loading class="w-8 h-8"></Loading>
        </div>
        <button @click="isSelectionMode ? select(photo) : openLightbox(photo)">
          <img 
            :src="getPhotoUrl(photo)"
            :style="{
              width: layout.boxes[i + renderPhotosStart].width + 'px', 
              height: layout.boxes[i + renderPhotosStart].height + 'px',
              opacity: loadedImages[photo.id] ? 1 : 0,
            }"
            style="transition: opacity 500ms linear;"
            @load="imgLoad(photo)"
          >
        </button>
        <div v-if="photo.metadata.video" class="overlay">
          <div class="text-white text-xs md:text-base md:mb-1 mr-1 md:mr-2">{{ photo.metadata.duration }}</div>
          <svg class="w-4 h-4 md:w-6 md:h-6 md:mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
        <div v-if="isSelectionMode" class="overlay p-2 justify-end items-start" :class="{ 'bg-white/25': !selected[photo.id], 'bg-white/75': selected[photo.id] }">
          <div v-if="selected[photo.id]" class="text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div v-else class="text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          </div>
        </div>
      </div>
    </div>

    <div v-if="$slots.loading" class="mt-8"></div>
    <slot name="loading"></slot>
    <div v-if="isNoPhotos" class="text-center">No photos found.</div>
    
    <Lightbox v-if="isShowLightbox" @close="closeLightbox()"></Lightbox>

    <Modal v-if="showAddToExistingAlbum" @close="showAddToExistingAlbum = false">
      <div class="w-[500px] max-w-full">
        <div v-if="loadingAlbums" class="flex justify-center">
          <Loading class="w-16 h-16"></Loading>
        </div>
        <div v-else class="grid gap-2">
          <button v-for="album in albums" :key="album.id" class="py-2 px-4 bg-slate-50 flex w-full text-left" @click="addToAlbumFromSelected(album.id)">
            <div class="flex-auto">{{ album.name }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import justifiedLayout from 'justified-layout';

import { getAlbums, createAlbum, addToAlbum } from '../services/api';
import { debounce, getMobileGalleryImageHeight, isMobileScreen, getGalleryPhotoSize, isElementFullyInView } from '../utils';

import Lightbox from '../components/Lightbox.vue'
import Loading from '../components/Loading.vue';
import Modal from '../components/Modal.vue';
import { useInfiniteScroll } from '../composables/infinite-scroll';

export default {
  name: 'Gallery',
  components: {
    Lightbox,
    Loading,
    Modal,
  },
  props: {
    hasMorePhotos: Boolean,
    loadMore: Function,
    showDateSelection: Boolean,
    showLightbox: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const store = useStore();

    const { 
      enable,
      disable,
      reset,
      registerContainer,
      scroll,
      scrollTry,
      scrolling,
      scrollIndex,
    } = useInfiniteScroll({
      photos: computed(() => store.state.photos),
      canLoadMore: props.hasMorePhotos,
      loadMore: props.loadMore,
    });

    return { 
      infiniteScrollEnable: enable,
      infiniteScrollDisable: disable,
      infiniteScrollReset: reset,
      scroll,
      scrollTry,
      scrolling,
      scrollIndex,
      registerScrollContainer: registerContainer,
    };
  },
  data() {
    return {
      date: null,

      galleryImageRefs: [],

      albums: [],
      loadingCreateAlbum: false,
      loadingAlbums: false,
      showAddToExistingAlbum: false,

      renderPhotosStart: 0,
      renderPhotosEnd: 0,
      loadedImages: {},
      layout: null,

      isSelectionMode: false,
      selected: {},

      isShowLightbox: false,
    };
  },
  computed: {
    lightboxIndex() {
      return this.$store.state.lightbox.photoIndex;
    },
    isNoPhotos() {
      return !this.scrolling && this.$store.state.photos.length === 0;
    },
    token() {
      return this.$store.state.token;
    },
    photos() {
      return this.$store.state.photos;
    },
    renderPhotos() {
      return this.photos.slice(this.renderPhotosStart, this.renderPhotosEnd);
    },
    container() {
      return this.$refs.gallery;
    }
  },
  watch: {
    async lightboxIndex() {
      await this.scrollLightboxImageIntoView();

      // Handling for navigating the lightbox past loaded gallery thumbnails.
      if (this.lightboxIndex + 1 >= this.scrollIndex) {
        await this.scroll();
      } else {
        await this.scrollTry();
      }

      this.updateRenderPhotos();
    },
    showLightbox() {
      if (this.showLightbox) {
        this.openLightbox();
      } else {
        this.closeLightbox(false);
      }
    },
    isShowLightbox() {
      this.updateLightboxQueryParam();
    },
    scrolling() {
      if (!this.scrolling) {
        this.updateRenderPhotos();
      }
    },
  },
  created() {
    // Ensure the page isn't loaded with this query parameter set.
    this.removeLightboxParam(true);
  },
  async mounted() {
    this.registerScrollContainer(this.$refs.gallery);
    await this.scroll();
    
    const onScroll = debounce(() => this.updateRenderPhotos());
    this.$refs.gallery.addEventListener('scroll', onScroll);

    this.updateRenderPhotos();

    // Scrollbar may show now, so re-update layout to accommodate for that.
    await this.$nextTick();
    this.updateLayout();

    this.infiniteScrollEnable();
  },
  beforeUpdate() {
    this.galleryImageRefs = [];
  },
  beforeUnmount() {
    this.infiniteScrollDisable();
  },
  methods: {
    updateLayout() {
      this.layout = justifiedLayout([...this.photos.map(p => ({
        width: isMobileScreen() ? getMobileGalleryImageHeight() : p.metadata.width,
        height: isMobileScreen() ? getMobileGalleryImageHeight() : p.metadata.height,
      }))], {
        containerPadding: 0,
        containerWidth: this.$refs.photos?.getBoundingClientRect().width,
        targetRowHeight: getMobileGalleryImageHeight(),
        boxSpacing: 2,
      });
    },
    async imgLoad(photo) {
      this.loadedImages[photo.id] = true;
    },
    updateRenderPhotos() {
      this.updateLayout();
      let start = null;
      let end = null;
      for (let i = 0; i < this.layout.boxes.length; i++) {
        const box = this.layout.boxes[i];
        if ((box.top + box.height + 128 > this.$refs.gallery.scrollTop) && (box.top < this.$refs.gallery.scrollTop + this.$refs.gallery.getBoundingClientRect().height)) {
          if (start === null) {
            start = i;
          }
        } else {
          if (start !== null) {
            end = i;
            break;
          }
        }
      }
      if (end === null) {
        end = this.layout.boxes.length;
      }
      this.renderPhotosStart = start;
      this.renderPhotosEnd = end;
    },
    
    getPhotoUrl(photo) {
      return photo.urls[getGalleryPhotoSize()];
    },
    
    async scrollLightboxImageIntoView() {
      const ref = this.getGalleryImageRefForLightboxPhoto();
      const fullyInView = await isElementFullyInView(ref.el);
      if (ref && !fullyInView) {
        ref.el.scrollIntoView();
      }
    },
    setGalleryImageRef(el) {
      if (el) {
        this.galleryImageRefs.push({
          el,
          photo: this.photos.find(photo => photo.id === el.dataset.photoId),
        });
      }
    },
    getGalleryImageRefForLightboxPhoto() {
      const lightboxPhoto = this.photos[this.lightboxIndex];
      const galleryPhotoRef = this.galleryImageRefs.find(ref => ref.photo === lightboxPhoto);
      if (!galleryPhotoRef) {
        throw new Error('Could not find gallery photo to scroll to.');
      }
      return galleryPhotoRef;
    },

    openLightbox(photo) {
      if (!this.isShowLightbox) {
        this.isShowLightbox = true;
        this.infiniteScrollDisable();

        if (photo) {
          this.$store.state.lightbox.photoIndex = this.photos.findIndex(p => p === photo);
        }
      }
    },
    closeLightbox(showTransition = true) {
      if (this.isShowLightbox) {
        this.isShowLightbox = false;

        // Helps to show which photo was just being viewed in the lightbox.
        if (showTransition) {
          const ref = this.getGalleryImageRefForLightboxPhoto();
          ref.el.style.transform = 'scale(3)';
          ref.el.style.zIndex = '1';
          setTimeout(() => {
            ref.el.style.transition = 'transform 0.1s linear';
            ref.el.style.transform = 'scale(1)';
            setTimeout(() => {
              ref.el.style.transition = '';
              ref.el.style.zIndex = '';
            }, 100);
          });
        }
        
        this.infiniteScrollEnable();
      }
    },
    updateLightboxQueryParam() {
      if (this.isShowLightbox && !this.$route.query.showLightbox) {
        this.$router.push({ path: this.$route.path, query: { ...this.$route.query, showLightbox: true } });
      } else if (!this.isShowLightbox) {
        this.removeLightboxParam();
      }
    },
    removeLightboxParam(replace) {
      const queryParams = { ...this.$route.query };
      delete queryParams.showLightbox;
      if (replace) {
        this.$router.replace({ path: this.$route.path, query: queryParams });
      } else {
        this.$router.push({ path: this.$route.path, query: queryParams });
      }
    },

    toggleSelect() {
      this.isSelectionMode = !this.isSelectionMode;
    },
    select({ id, sourceId, sourceFileId }) {
      if (this.selected[id]) {
        delete this.selected[id];
      } else {
        this.selected[id] = {
          sourceId,
          sourceFileId,
        };
      }
    },

    async showAlbumSelection() {
      this.showAddToExistingAlbum = true;
      this.loadingAlbums = true;
      this.albums = await getAlbums();
      this.loadingAlbums = false;
    },
    async addToAlbumFromSelected(albumId) {
      this.loadingAlbums = true;

      try {
        await addToAlbum(albumId, Object.values(this.selected));
        alert(`Album updated.`);
        this.selected = {};
        this.isSelectionMode = false;
        this.showAddToExistingAlbum = false;
      } catch (e) {
        alert(e);
      }
      
      this.loadingAlbums = false;
    },
    async createAlbumFromSelected() {
      this.loadingCreateAlbum = true;
      const albumName = prompt('Enter album name');
      if (!albumName) {
        alert('Album name required.');
      } else {
        try {
          await createAlbum(albumName, Object.values(this.selected));
          alert(`Album "${albumName}" created.`);
          this.selected = {};
          this.isSelectionMode = false;
        } catch (e) {
          alert(e);
        }
      }

      this.loadingCreateAlbum = false;
    },

    onDateBlur() {
      this.$emit('date', this.date);
      this.reset();
    },

    reset() {
      this.$store.dispatch('clearPhotos');
      this.infiniteScrollReset();
    },
  },
}
</script>

<style scoped>
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    pointer-events: none;
  }
</style>
