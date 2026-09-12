const queue = [];
let running = false;

function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    drain();
  });
}

async function drain() {
  if (running) {
    return;
  }

  const next = queue.shift();
  if (!next) {
    return;
  }

  running = true;

  const { task, resolve, reject } = next;

  try {
    resolve(await task());
  } catch (e) {
    reject(e);
  } finally {
    running = false;
    drain();
  }
}

module.exports = {
  enqueue,
};
