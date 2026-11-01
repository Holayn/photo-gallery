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
              <sl-menu-item value="skipVideoDateRanges">
                <sl-icon slot="prefix" name="calendar-x"></sl-icon>
                Skip video conversion dates<template v-if="source.skipVideoDateRanges?.length"> ({{ source.skipVideoDateRanges.length }})</template>
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
        </div>
        <div v-if="directory" class="text-xl mt-1">({{ directory }})</div>
      </h1>

      <Modal v-if="showSkipVideoDateRanges" size="md" @close="showSkipVideoDateRanges = false">
        <h2 class="text-lg">Skip video conversion dates</h2>
        <p class="mt-1 text-sm text-gray-600">Videos captured within these dates (inclusive) are left preview-only during processing, until converted manually.</p>

        <div class="mt-4 flex flex-col gap-2">
          <div v-if="!editedSkipVideoDateRanges.length" class="text-sm text-gray-500">No dates set.</div>
          <div v-for="(range, i) in editedSkipVideoDateRanges" :key="i" class="flex items-center gap-2">
            <input v-model="range.start" type="date" class="border px-1 min-w-0" aria-label="Start date">
            <span>to</span>
            <input v-model="range.end" type="date" class="border px-1 min-w-0" aria-label="End date">
            <button aria-label="Remove range" @click="editedSkipVideoDateRanges.splice(i, 1)">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button class="btn px-2 py-1" @click="editedSkipVideoDateRanges.push({ start: '', end: '' })">Add range</button>
          <button class="btn px-2 py-1" :disabled="savingSkipVideoDateRanges" @click="saveSkipVideoDateRanges()">Save</button>
          <Loading v-if="savingSkipVideoDateRanges" class="w-8 h-8"></Loading>
        </div>
      </Modal>
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
import Modal from '../components/Modal.vue';
import Gallery from './Gallery.vue';

import { getPhotosFromSource, getSource, processSource, setSourceContinuous, setSourceSkipVideoDateRanges, subscribeToSourceCreation } from '../services/api';
import {  setDocumentTitle } from '../utils';

export default {
  name: 'Source',
  components: {
    Gallery,
    Loading,
    Modal,
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

      showSkipVideoDateRanges: false,
      editedSkipVideoDateRanges: [],
      savingSkipVideoDateRanges: false,
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
      } else if (value === 'skipVideoDateRanges') {
        this.openSkipVideoDateRanges();
      }
    },
    openSkipVideoDateRanges() {
      this.editedSkipVideoDateRanges = (this.source.skipVideoDateRanges ?? []).map((range) => {
        const [start, end] = range.split(':');
        return { start, end };
      });
      this.showSkipVideoDateRanges = true;
    },
    async saveSkipVideoDateRanges() {
      const ranges = this.editedSkipVideoDateRanges;
      if (ranges.some(({ start, end }) => !start || !end)) {
        alert('Every range needs both a start and an end date.');
        return;
      }
      // <input type="date"> values are YYYY-MM-DD, so they compare correctly as strings.
      if (ranges.some(({ start, end }) => start > end)) {
        alert('A range\'s start date must not be after its end date.');
        return;
      }

      this.savingSkipVideoDateRanges = true;
      try {
        const { skipVideoDateRanges } = await setSourceSkipVideoDateRanges(
          this.sourceId,
          ranges.map(({ start, end }) => `${start}:${end}`)
        );
        this.source.skipVideoDateRanges = skipVideoDateRanges;
        this.showSkipVideoDateRanges = false;
      } catch (e) {
        alert(`Error saving dates: ${e.message}`);
      } finally {
        this.savingSkipVideoDateRanges = false;
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
