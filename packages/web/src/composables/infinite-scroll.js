import { ref } from 'vue';

export function useInfiniteScroll({ photos, loadMore }) {
  let onScrollBinding = null;
  let enabled = false;
  let container = null;

  const scrolling = ref(false);
  const scrollIndex = ref(0);

  async function onScroll() {
    if (enabled) {
      await scrollTry();
    }
  }

  async function scrollTry() {
    if (isPastBoundary()) {
      await scroll();
    }
  }

  function registerContainer(c) {
    container = c;
  }

  function isPastBoundary() {
    const boundaryOffset = container.getBoundingClientRect().height / 3;
    return container.scrollTop + container.getBoundingClientRect().height > container.scrollHeight - boundaryOffset;
  }

  function enable() {
    if (!enabled) {
      console.debug('infinite-scroll:: enabled.');
      if (!onScrollBinding) {
        onScrollBinding = onScroll.bind(this);
      }
      container.addEventListener('scroll', onScrollBinding);
      enabled = true;
    }
  }
  function disable() {
    console.debug('infinite-scroll:: disabled.');
    container.removeEventListener('scroll', onScrollBinding);
    enabled = false;
  }

  async function scroll() {
    console.debug('infinite-scroll:: scrolling...');
    disable();

    scrolling.value = true;

    const origScrollIndex = scrollIndex.value;

    if (scrollIndex.value === photos.value.length) {
      await loadMore();
    }

    scrollIndex.value = photos.value.length;

    console.debug(`scrolled ${scrollIndex.value - origScrollIndex} more images.`);

    scrolling.value = false;

    enable();
  }

  function reset() {
    scrollIndex.value = 0;
    scroll();
  }

  return {
    enable,
    disable,
    reset,
    scroll,
    scrollTry,
    scrolling,
    scrollIndex,
    registerContainer,
  }
}
