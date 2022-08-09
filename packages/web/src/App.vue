<template>
  <div>
    <div>
      <header>
        <div style="display: grid; grid-template-columns: 1fr auto; align-items: center;">
          <div class="title" style="margin: 3rem;">{{title}}</div>
          <div style="margin: auto 1rem;">
            <svg @click="toggleHelp(true)" style="cursor: pointer; width: 1.5rem;" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
        </div>
      </header>
      <Gallery ref="gallery" :title="albumParam" @showLightbox="onShowLightbox()"></Gallery>
    </div>
    <Lightbox ref="lightbox" v-show="showLightbox" :title="albumParam" @close="onLightboxClose"></Lightbox>
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

export default {
  name: 'App',
  components: {
    Gallery,
    Lightbox,
  },
  data() {
    return {
      showLightbox: false,
      showHelp: false,
      title: 'All Photos',
    };
  },
  computed: {
    albumParam() {
      const params = (new URL(document.location)).searchParams;
      const albumParam = params.get('album');
      return albumParam;
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
  async mounted() {
    document.title = this.title;
  },
  methods: {
    onShowLightbox() {
      this.showLightbox = true;
    },
    onLightboxClose() {
      this.showLightbox = false;
      this.$nextTick(() => {
        this.$refs.gallery.scrollCurrentImageIntoView();
      });
    },
    toggleHelp(show) {
      this.showHelp = show;
    },
  },
}
</script>

<style>
  @media (max-width: 600px) {
    .title {
      font-size: 1.5rem;
    }
  }

  @media (min-width: 600px) {
    .title {
      font-size: 3rem;
    }
  }

  .title {
    font-family: 'Roboto';
  }
</style>
