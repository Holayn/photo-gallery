<template>
  <div>
    <div>
      <header>
        <div id="title" style="margin: 3rem; font-family: 'Roboto'; font-size: 3rem;">{{title}}</div>
      </header>
      <Gallery ref="gallery" :title="albumParam" @showLightbox="onShowLightbox()"></Gallery>
    </div>
    <Lightbox ref="lightbox" v-show="showLightbox" :title="albumParam" @close="onLightboxClose"></Lightbox>
  </div>
</template>

<script>
import Gallery from './components/Gallery.vue'
import Lightbox from './components/Lightbox.vue'
import { fetchGalleryTitle } from './services/fetch';

export default {
  name: 'App',
  components: {
    Gallery,
    Lightbox,
  },
  data() {
    return {
      showLightbox: false,
      title: '',
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
    this.title = await fetchGalleryTitle(this.albumParam);
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
    }
  },
}
</script>

<style>
</style>
