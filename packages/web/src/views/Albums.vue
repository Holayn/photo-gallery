<template>
  <div class="px-8">
    <h1 class="text-5xl">Albums</h1>
    <div class="mt-4">
      <Loading v-if="loading" class="w-16 h-16"></Loading>
      <div v-else-if="error" class="text-red-500">Failed to load albums</div>
      <div v-else class="flex flex-wrap gap-2">
        <div v-for="album in albums" :key="album.id" class="min-w-32 max-w-60" style="width: calc(50% - 0.5rem);">
          <button class="p-1 bg-slate-100 rounded-md w-full" @click="openAlbum(album)">
            <div>
              <div v-if="albumCovers[album.id]" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                <div v-for="photo in albumCovers[album.id]" :key="photo" class="relative">
                  <div v-if="errorImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                    <div>:(</div>
                  </div>
                  <div v-else-if="!loadedImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                    <Loading class="w-8 h-8"></Loading>
                  </div>
                  <img class="rounded-sm w-full object-cover" :class="{ 'hidden': !loadedImages[photo] }" :src="photo" style="aspect-ratio: 1/1;" @load="imgLoad(photo)" @error="imgError(photo)">
                </div>
              </div>
              <div v-else-if="errorAlbums[album.id]" class="flex h-full items-center justify-center">
                <div class="text-red-500">Failed to load cover</div>
              </div>
              <div v-else class="flex h-full items-center justify-center">
                <Loading class="w-8 h-8 my-4"></Loading>
              </div>
            </div>
            <div class="break-all">{{ album.name }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

import { getAlbums, getAlbumCover, PHOTO_SIZES } from '../services/api';

export default {
  name: 'Albums',
  components: {
    Loading,
  },
  data() {
    return {
      albums: [],
      albumCovers: {},
      loading: true,
      loadedImages: {},
      error: false,
      errorImages: {},
      errorAlbums: {},
    };
  },
  async mounted() {
    try {
      this.albums = await getAlbums();
      
      await Promise.all(this.albums.map(async (album) => {
        try {
          const { photos } = await getAlbumCover(album.id);
          this.albumCovers[album.id] = photos.map(photo => photo.urls.view[PHOTO_SIZES.THUMB]);
        } catch (e) {
          this.errorAlbums[album.id] = true;
        }
      }));
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
    imgLoad(photo) {
      this.loadedImages[photo] = true;
    },
    imgError(photo) {
      this.errorImages[photo] = true;
    },
  },
}
</script>
