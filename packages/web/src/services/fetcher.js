const fetcher = {
  fetch(url, options) {
    return window.fetch(url, options)
      .then(res => {
        if (res.status === 500) {
          throw new Error('Server Error');
        }
        if (res.status === 403) {
          throw new Error('Access denied');
        }
        return res;
      })
      .then(res => res.json());
  }
}

export default fetcher;