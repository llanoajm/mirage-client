// Web Worker to prevent tab suspension
let keepAliveInterval;

self.onmessage = function(e) {
  if (e.data === 'start') {
    console.log('Starting keep-alive worker');
    keepAliveInterval = setInterval(() => {
      // Send heartbeat to main thread
      self.postMessage('heartbeat');
    }, 1000);
  } else if (e.data === 'stop') {
    console.log('Stopping keep-alive worker');
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
  }
};