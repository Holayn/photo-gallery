class Loader {
  GALLERY_ROW_HEIGHT = 200;
  INFINITE_SCROLL_IMAGES_TO_LOAD = 20;

  media = [];
  album = '';

  currGalleryIndex = 0;

  constructor(album) {
    this.album = album;
  }

  init() {
    const initialContentToLoad = [];

    // Calculate how many images to show on page load
    const { innerWidth, innerHeight } = window;
    // Add on another row just in case
    const rows = innerHeight / this.GALLERY_ROW_HEIGHT + 1;

    let currWidth = 0;
    const totalWidth = innerWidth * rows;

    for (let i = 0; i < this.media.length; i++) {
      const { width, height } = this.media[i].meta;
      const thumbnailWidth = (width / height) * this.GALLERY_ROW_HEIGHT;

      if (currWidth >= totalWidth || currWidth + thumbnailWidth >= totalWidth) {
        break;
      }

      currWidth += thumbnailWidth;
      initialContentToLoad.push(this.media[i]);
      this.currGalleryIndex++;
    }

    // Load initial content
    initialContentToLoad.forEach((item, i) => {
      this.addMediaToGallery(item, i);
    });

    $('#media').justifiedGallery({
      rowHeight: this.GALLERY_ROW_HEIGHT,
    });

    this.handleInfiniteScroll();
  }

  addMedia(item) {
    this.media.push(item);
  }

  addMediaToGallery(item, index) {
    const image = document.createElement('img');
    image.setAttribute('id', `item${index}`);
    image.addEventListener('click', () => {
      this.openSlides(index);
    });
    image.setAttribute('src', this.getUrl(item.output.small.path));

    const anchor = document.createElement('a');
    anchor.setAttribute('href', item.isVideo ? this.getUrl(item.output.download.path) : this.getUrl(item.output.large.path));
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
    });
    anchor.append(image);

    if (item.isVideo) {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        z-index: 99;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      `;
      overlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      anchor.append(overlay);
    }

    document.querySelector('#media').append(anchor);
  }

  openSlides(at) {
    document.body.style.position = 'fixed';

    this.disableInfiniteScroll();

    const pswpElement = document.querySelectorAll('.pswp')[0];

    const items = this.media.map((item, i) => {
      if (item.isVideo) {
        return {
          html: `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <video id="video-slide-${i}" class="video-js" controls preload="auto" poster="${this.getUrl(item.output.large.path)}" style="height: 100%; width: 100%;">
                <source src="${this.getUrl(item.output.download.path)}" type="video/mp4"></source>
              </video>
            </div>
          `,
          videoSrc: this.getUrl(item.output.download.path),
        }
      }
      return {
        src: this.getUrl(item.output.large.path),
        w: item.meta.width,
        h: item.meta.height,
      }
    });

    const slides = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, {
      allowPanToNext: false,
      closeOnVerticalDrag: false,
      history: false,
      index: at ?? 0, // start at first slide
      shareButtons: [],
    });

    slides.init();

    window.slides = slides;

    slides.listen('beforeChange', () => {
      if (slides.getCurrentIndex() + this.INFINITE_SCROLL_IMAGES_TO_LOAD >= this.currGalleryIndex) {
        this.loadMoreImagesToGallery();
      }

      // Stop current video if any
      // The slide is already the next one...
      const indexToFind = slides.getCurrentIndex() - 1;
      document.querySelector(`#video-slide-${indexToFind}`)?.pause();
    });

    slides.listen('close', () => {
      document.body.style.height = '';
      document.body.style.position = 'initial';
      this.handleInfiniteScroll();

      // Stop current video if any
      const indexToFind = slides.getCurrentIndex();
      document.querySelector(`#video-slide-${indexToFind}`)?.pause();

      // https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling
      function isScrolledIntoView(el) {
        const rect = el.getBoundingClientRect();
        const elemTop = rect.top;
        const elemBottom = rect.bottom;

        const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
        return isVisible;
      }

      const galleryPhoto = document.querySelector(`#item${slides.getCurrentIndex()}`);
      if (!isScrolledIntoView(galleryPhoto)) {
        document.querySelector(`#item${slides.getCurrentIndex()}`).scrollIntoView();
        window.scrollBy(0, -window.innerHeight / 5);
      }
    });
  }

  handleInfiniteScroll() {
    this.infiniteScrollBound = this.infiniteScroll.bind(this);
    window.addEventListener('scroll', this.infiniteScrollBound);
  }

  disableInfiniteScroll() {
    window.removeEventListener('scroll', this.infiniteScrollBound);
  }

  infiniteScroll() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      this.loadMoreImagesToGallery();
    }
  }

  loadMoreImagesToGallery() {
    for (let i = this.currGalleryIndex, j = 0; i < this.media.length && j < this.INFINITE_SCROLL_IMAGES_TO_LOAD; i++, j++) {
      this.addMediaToGallery(this.media[i], i);
      this.currGalleryIndex++;
    }

    $('#media').justifiedGallery('norewind');
  }

  getUrl(path) {
    return `media/${this.album}/${path}`;
  }
}
