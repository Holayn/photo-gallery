import { ref } from 'vue';

const DRAG_START_THRESHOLD = 50;

export function useLightboxGestures({ swiper, closeLightbox }) {
  const canSwipeToClose = ref(false);

  const dragDownDistance = ref(0);

  function dragHandler({ movement: [x, y], dragging, swipe: [swipeX, swipeY], last }) {
    if (swiper.value.zoom.scale > 1) {
      dragDownDistance.value = 0;
      return;
    }

    const draggingDown = dragging && y > DRAG_START_THRESHOLD;
    const swipedDown = last && swipeY === 1;
    if (swipedDown) {
      closeLightbox();
      dragDownDistance.value = 0;
      return;
    }

    if (draggingDown) {
      dragDownDistance.value = y;
    } else {
      if (dragDownDistance.value > (window.innerHeight / 2)) {
        closeLightbox();
      }
      dragDownDistance.value = 0;
    }
  }

  return {
    dragHandler,
    dragDownDistance,
  };
}