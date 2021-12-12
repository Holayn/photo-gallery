(async () => {
  const params = (new URL(document.location)).searchParams;
  const albumParam = params.get('album');
  const { album } = await (await fetch(`/photos/config?album=${albumParam}`)).json();
  const { albums } = album;
  const content = albums[0].files;

  const loader = new Loader(albumParam);
  content.forEach((c) => {
    loader.addMedia(c);
  });

  loader.init();

  const { title } = await (await fetch(`/photos/title?album=${albumParam}`)).json();
  document.querySelector('#title').innerText = title;
  document.title = title;

  window.loader = loader;

  function download(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = '';
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  document.querySelector('#download').addEventListener('click', () => {
    download(window.slides.currItem.src || window.slides.currItem.videoSrc);
  });
})();