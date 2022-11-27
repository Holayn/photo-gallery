<template>
  <div>
    <div>
      <header>
        <div style="display: grid; grid-template-columns: auto 1fr auto; align-items: center;">
          <div class="ml-4 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
          <div class="p-12 text-5xl">
            <div v-if="loadingAlbums">(loading...)</div>
            <div v-else>{{ title }}</div>
          </div>
          <div class="mr-4 cursor-pointer">
            <svg @click="toggleHelp(true)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
        </div>
      </header>
      
      <div>
        <div v-if="loadingAlbums">Loading albums...</div>
        {{ albums }}
      </div>

      <Gallery ref="gallery" :album-id="albumId" :title="'Photos'" @showLightbox="onShowLightbox()"></Gallery>
    </div>


    <Lightbox ref="lightbox" v-show="showLightbox" :title="'Photos'" @close="onLightboxClose"></Lightbox>
    <div v-if="showHelp" @click="toggleHelp(false)" style="display: flex; align-items: center; justify-content: center; position: fixed; z-index: 99; top: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5);">
      <div style="background-color: white; margin: 1rem;">
        <div style="height: 100%; padding: 1rem;">
          <div style="display: flex; justify-content: flex-end;">
            <div>
              <svg @click="toggleHelp(false)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <ul>
              <li>
                click or tap to view an image
                <ul>
                  <li>swipe or use arrow keys to view more images</li>
                </ul>
              </li>
              <li>
                downloading images:
                <ul>
                  <li>
                    on mobile: open the image, then tap and hold down on an image
                    <img style="width: 50%;" src="./assets/photo-gallery-help-mobile-save.gif"/>
                  </li>
                  <li>on desktop: open the image, then right-click + save image as...</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Gallery from './components/Gallery.vue'
import Lightbox from './components/Lightbox.vue'
import { getAlbums } from './services/api';

export default {
  name: 'App',
  components: {
    Gallery,
    Lightbox,
  },
  data() {
    return {
      albumId: null,
      albums: [],
      loadingAlbums: false,
      scrollPosition: 0,
      showLightbox: false,
      showHelp: false,
    };
  },
  computed: {
    title() {
      return this.albumId ? this.albums.find(a => a.id === this.albumId)?.name : 'All Photos';
    },
  },
  watch: {
    showLightbox() {
      if (this.showLightbox) {
        document.body.style.overflow = 'hidden';
        this.$refs.lightbox.open();
      }
      else {
        document.body.style.overflow = '';
      }
    }
  },
  created() {
    const params = (new URL(document.location)).searchParams;
    const albumIdParam = params.get('albumId');
    if (albumIdParam) {
      this.albumId = parseInt(albumIdParam);
    }
  },
  async mounted() {
    this.loadingAlbums = true;
    this.albums = await getAlbums();
    this.loadingAlbums = false;
    document.title = this.title;
  },
  methods: {
    onShowLightbox() {
      this.scrollPosition = window.pageYOffset;
      this.showLightbox = true;
    },
    onLightboxClose() {
      this.showLightbox = false;
      this.$nextTick(() => {
        window.scrollTo(0, this.scrollPosition);
        setTimeout(() => {
          this.$refs.gallery.scrollCurrentImageIntoView();
        });
      });
    },
    toggleHelp(show) {
      this.showHelp = show;
    },
  },
}
</script>
