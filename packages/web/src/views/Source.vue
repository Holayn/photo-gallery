<template>
  <div v-if="loadingSourceInfo" class="flex justify-center px-8">
    <Loading class="w-24 h-24"></Loading>
  </div>
  <div v-else-if="source && !source.processed" class="py-2 px-8">
    <h1 class="text-xl md:text-2xl">{{ title }}</h1>
    <div v-if="processing" class="flex flex-col items-center gap-2 py-8">
      <Loading class="w-24 h-24"></Loading>
      <div>Source is processing...</div>
    </div>
    <div v-else class="py-8">
      Source is processing, come back later.
    </div>
  </div>
  <Gallery v-else :id="sourceId" :show-lightbox="showLightbox" :photos="photos" @date="onDateUpdate($event)" @reset="photos = []">
    <template #heading>
      <h1 class="text-xl md:text-2xl">
        <div class="flex items-center gap-2">
          <span>{{ title }}</span>
          <span v-if="source?.processing" class="flex items-center gap-2 text-sm font-normal text-gray-500">
            <Loading class="w-6 h-6"></Loading>
            Source processing
          </span>
          <sl-dropdown v-if="source">
            <sl-icon-button slot="trigger" name="three-dots" label="Options"></sl-icon-button>
            <sl-menu @sl-select="onMenuSelect">
              <sl-menu-item :disabled="!source.filesPath || source.processing" value="process">
                <sl-icon slot="prefix" name="arrow-repeat"></sl-icon>
                Run photo processessing
              </sl-menu-item>
              <sl-menu-item type="checkbox" :checked="source.continuous" :disabled="!source.filesPath" value="continuous">
                <sl-icon slot="prefix" name="eye"></sl-icon>
                Continuous Processing
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
        </div>
        <div v-if="directory" class="text-xl mt-1">({{ directory }})</div>
      </h1>
    </template>
    <template v-if="loadingPhotoInfo" #loading>
      <div class="flex flex-col items-center justify-center pb-4">
        <Loading class="w-24 h-24"></Loading>
        <div>Retrieving photo info</div>
      </div>
    </template>
  </Gallery>
</template>

<script>
import Loading from '../components/Loading.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromSource, getSource, processSource, setSourceContinuous, subscribeToSourceCreation } from '../services/api';
import {  setDocumentTitle } from '../utils';

export default {
  name: 'Source',
  components: {
    Gallery,
    Loading,
  },
  props: {
    directory: String,
    showLightbox: {
      type: Boolean,
      default: false,
    },
    sourceId: String,
  },
  data() {
    return {
      loadingPhotoInfo: false,
      loadingSourceInfo: false,

      processing: false,
      eventSource: null,
      processingPollInterval: null,

      date: null,
      source: null,
      photos: [],
    };
  },
  computed: {
    title() {
      return this.source?.alias;
    },
  },
  async mounted() {
    await this.loadSourceInfo();
  },
  beforeUnmount() {
    this.closeEventSource();
    this.stopPollingProcessing();
  },
  watch: {
    sourceId() {
      this.closeEventSource();
      this.stopPollingProcessing();
      this.photos = [];
      this.source = null;
      this.date = null;
      this.loadSourceInfo();
    },
  },
  methods: {
    async loadSourceInfo() {
      try {
        this.loadingSourceInfo = true;
        this.source = await getSource(this.sourceId);
        setDocumentTitle(this.directory ? `${this.source.alias} (${this.directory})` : this.source.alias);

        if (this.source.processed) {
          this.loadPhotoInfo();

          if (this.source.processing) {
            this.startPollingProcessing();
          }
        } else {
          this.subscribeToProcessing();
        }
      } catch(e) {
        alert(`Error loading source: ${e.message}`);
        throw e;
      } finally {
        this.loadingSourceInfo = false;
      }
    },
    onMenuSelect(event) {
      const value = event.detail.item.value;
      if (value === 'process') {
        this.triggerProcessing();
      } else if (value === 'continuous') {
        this.toggleContinuous();
      }
    },
    async triggerProcessing() {
      try {
        await processSource(this.sourceId);
        this.source.processing = true;
        this.startPollingProcessing();
      } catch (e) {
        alert(`Error processing source: ${e.message}`);
      }
    },
    async toggleContinuous() {
      const next = !this.source.continuous;
      try {
        await setSourceContinuous(this.sourceId, next);
        this.source.continuous = next;
      } catch (e) {
        alert(`Error updating continuous processing: ${e.message}`);
      }
    },
    startPollingProcessing() {
      if (this.processingPollInterval) {
        return;
      }

      this.processingPollInterval = setInterval(async () => {
        try {
          const updated = await getSource(this.sourceId);
          this.source.processing = updated.processing;

          if (!updated.processing) {
            this.stopPollingProcessing();
            this.loadPhotoInfo();
          }
        } catch (e) {
          this.stopPollingProcessing();
        }
      }, 5000);
    },
    stopPollingProcessing() {
      if (this.processingPollInterval) {
        clearInterval(this.processingPollInterval);
        this.processingPollInterval = null;
      }
    },
    subscribeToProcessing() {
      this.processing = true;

      try {
        this.eventSource = subscribeToSourceCreation(this.sourceId);
      } catch (e) {
        alert('Failed to subscribe to source creation');
        this.processing = false;
        return;
      }

      this.eventSource.addEventListener('done', (event) => {
        this.closeEventSource();
        this.processing = false;

        const result = JSON.parse(event.data);
        if (result.success) {
          this.loadSourceInfo();
        } else {
          alert('Source processing failed.');
        }
      });
      this.eventSource.onerror = () => {
        this.closeEventSource();
        this.processing = false;
      };
    },
    closeEventSource() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    },
    async loadPhotoInfo() {
      try {
        this.loadingPhotoInfo = true;
        const { photos } = await getPhotosFromSource(
          this.sourceId,
          this.date,
          this.directory
        );
        this.loadingPhotoInfo = false;

        this.photos = photos;
      } catch(e) {
        alert(`Error loading photos: ${e.message}`);
        throw e;
      } finally {
        this.loadingPhotoInfo = false;
      }
    },
    onDateUpdate(date) {
      this.date = date;
      this.loadPhotoInfo();
    },
  }
}
</script>
