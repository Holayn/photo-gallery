<template>
  <div class="px-8">
    <h1 class="text-5xl">Sources</h1>
    <div class="mt-4">
      <Loading v-if="loading" class="w-16 h-16"></Loading>
      <div v-else-if="error" class="text-red-500">Failed to load sources</div>
      <div v-else class="flex flex-wrap gap-2">
        <div v-for="source in sources" :key="source.id" class="min-w-32 max-w-60" style="width: calc(50% - 0.5rem);">
          <div class="p-1 bg-slate-100 rounded-md w-full">
            <button class="w-full" @click="openSource(source)">
              <div>
                <div v-if="sourceCovers[source.id]" class="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                  <div v-for="photo in sourceCovers[source.id]" :key="photo" class="relative">
                    <div v-if="errorImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                      <div>:(</div>
                    </div>
                    <div v-else-if="!loadedImages[photo]" class="flex justify-center items-center w-full h-full py-4">
                      <Loading class="w-8 h-8"></Loading>
                    </div>
                    <img class="rounded-sm w-full object-cover" :class="{ 'hidden': !loadedImages[photo] }" :src="photo" style="aspect-ratio: 1/1;" @load="imgLoad(photo)" @error="imgError(photo)">
                  </div>
                </div>
                <div v-else-if="errorSources[source.id]" class="flex h-full items-center justify-center">
                  <div class="px-2 text-red-500">Failed to load cover</div>
                </div>
                <div v-else class="flex h-full items-center justify-center">
                  <Loading class="w-8 h-8 my-4"></Loading>
                </div>
              </div>
              <div class="flex items-center">
                <div class="flex-auto text-left break-all px-2">{{ source.alias }}</div>
                <div class="flex justify-center" @click.stop>
                  <sl-dropdown>
                    <sl-icon-button slot="trigger" name="three-dots" label="Options"></sl-icon-button>
                    <sl-menu @sl-select="onMenuSelect($event, source)">
                      <sl-menu-item value="manage-users">
                        <sl-icon slot="prefix" name="people"></sl-icon>
                        Manage Users
                      </sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <SourceUsersModal 
      v-if="selectedSource" 
      :source="selectedSource" 
      @close="selectedSource = null"
    />
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';
import SourceUsersModal from '../components/SourceUsersModal.vue';

import { getSources, getSourceCover, PHOTO_SIZES } from '../services/api';

export default {
  name: 'Sources',
  components: {
    Loading,
    SourceUsersModal,
  },
  data() {
    return {
      sources: [],
      sourceCovers: {},
      loading: true,
      loadedImages: {},
      error: false,
      errorImages: {},
      errorSources: {},
      selectedSource: null,
    };
  },
  async mounted() {
    try {
      this.sources = await getSources();
      this.sources.sort((a, b) => b.alias.localeCompare(a.alias));
      
      await Promise.all(this.sources.map(async (source) => {
        try {
          const { photos } = await getSourceCover(source.id);
          this.sourceCovers[source.id] = photos.map(photo => photo.urls.view[PHOTO_SIZES.THUMB]);
        } catch (e) {
          this.errorSources[source.id] = true;
        }
      }));
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }
    
  },
  methods: {
    openSource(source, directory) {
      if (directory) {
        this.$router.push({ name: 'sourceDirectories', params: { sourceId: source.id } });
      } else {
        this.$router.push({ name: 'source', params: { sourceId: source.id } });
      }
    },
    openUsersModal(source) {
      this.selectedSource = source;
    },
    onMenuSelect(event, source) {
      const value = event.detail.item.value;
      if (value === 'manage-users') {
        this.openUsersModal(source);
      }
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
