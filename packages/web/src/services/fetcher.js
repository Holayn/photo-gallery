function getError(status) {
  switch (status) {
    case 500:
      return 'Server Error';
    case 401:
      return 'Unauthorized';
    default:
      return null;
  }
}

const fetcher = {
  fetch(url, options) {
    return window.fetch(url, options)
      .then(async res => {
        if (res.ok) {
          if (res.headers.get('Content-Type').includes('json')) {
            return {
              data: await res.json(),
              status: res.status,
            }
          } else {
            return {
              data: true,
              status: res.status,
            }
          }
        } else {
          if (res.status === 401) {
            window.dispatchEvent(new CustomEvent('unauthorized'));
          }
          return {
            error: {
              message: getError(res.status),
              status: res.status,
            }
          }
        }
      });
  }
}

export default fetcher;