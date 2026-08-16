<template>
  <div class="px-6 py-4">
    <div class="mt-4 md:mt-0 mb-4 flex items-center justify-between">
      <h1 class="text-2xl">Sources</h1>
      <button class="btn px-3 py-1" @click="showCreateSource = true">Create</button>
    </div>
    <div>
      <Loading v-if="loading" class="m-auto w-24 h-24"></Loading>
      <div v-else-if="error" class="text-red-500">Failed to load sources</div>
      <div v-else class="flex flex-wrap gap-2">
        <div v-for="source in sources" :key="source.id" class="min-w-32 max-w-60" style="width: calc(50% - 0.5rem);">
          <CollectionTile :covers="sourceCovers[source.id]?.items" :error="!!sourceCovers[source.id]?.error" @click="openSource(source)">
            <div class="h-full flex">
              <div class="flex-auto flex flex-col">
                <div class="line-clamp-2 break-word text-left text-sm text-gray-800">{{ source.alias }}</div>
                <div class="text-left text-xs text-gray-500">{{ source.fileCount }} {{ source.fileCount === 1 ? 'item' : 'items' }}</div>
              </div>
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
          </CollectionTile>
        </div>
      </div>
    </div>

    <SourceUsersModal
      v-if="selectedSource"
      :source="selectedSource"
      @close="selectedSource = null"
    />

    <CreateSourceModal
      v-if="showCreateSource"
      @close="showCreateSource = false"
      @created="onSourceCreated"
    />
  </div>
</template>

<script>
import CollectionTile from '../components/CollectionTile.vue';
import Loading from '../components/Loading.vue';
import SourceUsersModal from '../components/SourceUsersModal.vue';
import CreateSourceModal from '../components/CreateSourceModal.vue';

import { getSources, getSourceCover } from '../services/api';

export default {
  name: 'Sources',
  components: {
    CollectionTile,
    Loading,
    SourceUsersModal,
    CreateSourceModal,
  },
  data() {
    return {
      sources: [],
      sourceCovers: {},
      loading: true,
      error: false,
      selectedSource: null,
      showCreateSource: false,
    };
  },
  async mounted() {
    try {
      this.sources = await getSources();
      this.sources.sort((a, b) => b.alias.localeCompare(a.alias));
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }

    await Promise.all(this.sources.map(async (source) => {
      this.sourceCovers[source.id] = {
        loading: true,
      };

      try {
        const { photos } = await getSourceCover(source.id);
        this.sourceCovers[source.id].items = photos;
      } catch (e) {
        this.sourceCovers[source.id].error = true
      }
    }));
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
    onSourceCreated({ id }) {
      this.showCreateSource = false;
      this.$router.push({ name: 'source', params: { sourceId: id } });
    },
    onMenuSelect(event, source) {
      const value = event.detail.item.value;
      if (value === 'manage-users') {
        this.openUsersModal(source);
      }
    },
  },
}
</script>
