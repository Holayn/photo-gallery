import { ref } from 'vue';
import { estimateNumImagesFitOnPage } from '../utils'

export function useInfiniteScroll({ photos, canLoadMore, loadMore }) {
  let onScrollBinding = null;
  let infiniteScrollEnabled = false;
  const scrolling = ref(false);
  const scrollIndex = ref(0);

  const numImagesToScroll = estimateNumImagesFitOnPage();

  async function onScroll() {
    if (infiniteScrollEnabled) {
      const boundaryOffset = window.innerHeight / 3;
      const boundary = window.document.documentElement.scrollHeight - boundaryOffset;
      const viewingWindowBottom = window.scrollY + window.innerHeight;
      const isPastBoundary = viewingWindowBottom > boundary;
      if (isPastBoundary) {
        infiniteScrollEnabled = false;
        await scroll();
      }
    }
  }

  function enableInfiniteScroll() {
    if (!infiniteScrollEnabled) {
      console.debug('infinite-scroll:: enabled.');
      if (!onScrollBinding) {
        onScrollBinding = onScroll.bind(this);
      }
      window.addEventListener('scroll', onScrollBinding);
      infiniteScrollEnabled = true;
    }
  }
  function disableInfiniteScroll() {
    console.debug('infinite-scroll:: disabled.');
    window.removeEventListener('scroll', onScrollBinding);
    infiniteScrollEnabled = false;
  }

  async function scroll() {
    console.debug('infinite-scroll:: scrolling...');
    disableInfiniteScroll();

    scrolling.value = true;

    const origScrollIndex = scrollIndex.value;

    if (scrollIndex.value === photos.value.length && canLoadMore) {
      await loadMore();
    }

    // TODO: actually calculate numImagesToScroll using photos.metadata.width/height
    for (let i = scrollIndex.value, j = 0; i < photos.value.length && j < numImagesToScroll; i++, j++) {
      scrollIndex.value += 1;

      // If we haven't reached numImagesToScroll but there are no more photos, we need to load the next page from the server.
      if (scrollIndex.value === photos.value.length && j < numImagesToScroll - 1) {
        await loadMore();
      }
    }

    console.debug(`scrolled ${scrollIndex.value - origScrollIndex} more images.`);

    scrolling.value = false;
  }

  function reset() {
    scrollIndex.value = 0;
    scroll();
  }

  return {
    enable: enableInfiniteScroll,
    disable: disableInfiniteScroll,
    reset,
    scroll,
    scrolling,
    scrollIndex,
  }
}
