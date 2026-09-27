import { ref, computed } from 'vue';

const DRAG_START_THRESHOLD = 50;

export function useLightboxGestures({ swiper, closeLightbox, showMetadata, metadataHeight }) {
  const canSwipeToClose = ref(false);

  const dragCloseDistance = ref(0);
  const dragMetadataOpenDistance = ref(0);
  const dragMetadataCloseDistance = ref(0);
  const dragging = ref(false);
  const draggingClose = ref(false);
  const draggingMetadataOpen = ref(false);
  const draggingMetadataClose = ref(false);
  const draggingMetadata = computed(() => draggingMetadataOpen.value || draggingMetadataClose.value);
  const revealedMetadataHeight = computed(() => {
    if (draggingMetadataOpen.value) {
       return Math.min(dragMetadataOpenDistance.value, metadataHeight.value);
    } else if (draggingMetadataClose.value) {
      return Math.min(metadataHeight.value - dragMetadataCloseDistance.value, metadataHeight.value);
    }
    return null;
  });

  function resetDrag() {
    dragCloseDistance.value = 0;
    dragMetadataOpenDistance.value = 0;
    dragMetadataCloseDistance.value = 0;
  }

  function dragHandler({ movement: [x, y], dragging: _dragging, swipe: [swipeX, swipeY], last }) {
    if (swiper.value.zoom.scale > 1) {
      resetDrag();
      return;
    }

    dragging.value = _dragging && y !== 0;

    // Swipe handling
    const swipedDown = last && swipeY === 1;
    if (swipedDown) {
      if (showMetadata.value) {
        showMetadata.value = false;
      } else {
        closeLightbox();
      }
      
      resetDrag();
      return;
    }

    const draggingDown = _dragging && y > DRAG_START_THRESHOLD;
    const draggingUp = _dragging && y < (-1 * DRAG_START_THRESHOLD);

    if (draggingDown && !draggingMetadataOpen.value) {
      if (showMetadata.value) {
        draggingMetadataClose.value = true;
      } else {
        draggingClose.value = true;
      }
    }

    if (draggingUp && !draggingClose.value) {
      draggingMetadataOpen.value = true;
    }

    if (draggingMetadataOpen.value) {
      if (!last) {
        dragMetadataOpenDistance.value = Math.max(0, -1 * y);
        showMetadata.value = true;
      } else {
        if (dragMetadataOpenDistance.value && dragMetadataOpenDistance.value < (Math.min((metadataHeight.value / 3), window.innerHeight / 2))) {
          showMetadata.value = false;
        }
        draggingMetadataOpen.value = false;
        resetDrag();
      }
    } else if (draggingMetadataClose.value) {
      if (!last) {
        dragMetadataCloseDistance.value = Math.max(0, y);
      } else {
        if (dragMetadataCloseDistance.value && dragMetadataCloseDistance.value > (Math.min((metadataHeight.value / 3), window.innerHeight / 2))) {
          showMetadata.value = false;
        }
        draggingMetadataClose.value = false;
        resetDrag();
      }
    } else if (draggingClose.value) {
      if (!last) {
        dragCloseDistance.value = Math.max(0, y);
      } else {
        if (dragCloseDistance.value > (window.innerHeight / 2)) {
          closeLightbox();
        }
        draggingClose.value = false;
        resetDrag();
      }
    }
  }

  return {
    dragHandler,
    dragging,
    draggingMetadata,
    draggingMetadataOpen,
    dragCloseDistance,
    dragMetadataOpenDistance,
    dragMetadataCloseDistance,
    revealedMetadataHeight,
  };
}