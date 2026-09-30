<template>
  <div class="px-6 py-4">
    <h1 class="mt-4 md:mt-0 mb-4 text-2xl">Albums</h1>
    <div>
      <Loading v-if="loading" class="m-auto w-24 h-24"></Loading>
      <div v-else-if="error" class="text-red-500">Failed to load albums</div>
      <div v-else>
        <div v-for="section in sections" :key="section.title" class="mb-24">
          <h2 class="text-lg font-medium mb-2">{{ section.title }}</h2>

          <div v-if="section.albums.length" class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <div v-for="album in section.albums" :key="album.id" class="sm:w-60">
              <CollectionTile :covers="albumCovers[album.id]?.items" :error="!!albumCovers[album.id]?.error" @click="openAlbum(album)">
                <div class="h-full flex text-left">
                  <div class="flex-auto flex flex-col">
                    <div class="line-clamp-2 break-word text-sm text-gray-800">{{ album.name }}</div>
                    <div class="flex items-center gap-1">
                      <div class="flex gap-1">
                        <div class="text-xs text-gray-500">{{ album.fileCount }} {{ album.fileCount === 1 ? 'item' : 'items' }}</div>
                        <div v-if="album.users.length">
                          <div class="text-xs text-gray-500">&bull;</div>
                        </div>
                      </div>
                      <div v-if="album.users.length" class="flex items-center gap-1">
                        <div class="flex items-center gap-1 text-xs text-gray-500">
                          <sl-icon name="people"></sl-icon>
                          {{ album.users.length }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-center" @click.stop>
                    <sl-dropdown>
                      <sl-icon-button slot="trigger" name="three-dots" label="Options"></sl-icon-button>
                      <sl-menu @sl-select="onMenuSelect($event, album)">
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
          <div v-else class="text-gray-500">None</div>
        </div>
      </div>
    </div>

    <AlbumUsersModal
      v-if="selectedAlbum"
      :album="selectedAlbum"
      @close="selectedAlbum = null"
      @users-updated="onAlbumUsersUpdated"
    />
  </div>
</template>

<script>
import CollectionTile from '../components/CollectionTile.vue';
import Loading from '../components/Loading.vue';
import AlbumUsersModal from '../components/AlbumUsersModal.vue';

import { getAlbums, getAlbumCover } from '../services/api';

export default {
  name: 'Albums',
  components: {
    CollectionTile,
    Loading,
    AlbumUsersModal,
  },
  data() {
    return {
      albums: [],
      albumCovers: {},
      loading: true,
      error: false,
      selectedAlbum: null,
    };
  },
  computed: {
    sections() {
      return [
        { title: 'Mine', albums: this.albums.filter(a => a.isMine) },
        { title: "Others", albums: this.albums.filter(a => !a.isMine) },
      ];
    },
  },
  async mounted() {
    try {
      this.albums = await getAlbums();
    } catch (e) {
      this.error = true;
    } finally {
      this.loading = false;
    }

    await Promise.all(this.albums.map(async (album) => {
      this.albumCovers[album.id] = {
        loading: true,
      };

      try {
        const { photos } = await getAlbumCover(album.id);
        this.albumCovers[album.id].items = photos;
      } catch (e) {
        this.albumCovers[album.id].error = true;
      }
    }));
  },
  methods: {
    openAlbum(album) {
      this.$router.push({ name: 'album', params: { albumId: album.id } });
    },
    openUsersModal(album) {
      this.selectedAlbum = album;
    },
    onMenuSelect(event, album) {
      const value = event.detail.item.value;
      if (value === 'manage-users') {
        this.openUsersModal(album);
      }
    },
    onAlbumUsersUpdated({ albumId, users }) {
      const album = this.albums.find((a) => a.id === albumId);
      if (album) {
        album.users = users;
      }
    },
  },
}
</script>
