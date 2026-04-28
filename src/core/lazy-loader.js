const loadedElements = new WeakSet();
let observer = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        if (loadedElements.has(img)) continue;
        loadedElements.add(img);
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    },
    { rootMargin: '50px' }
  );
  return observer;
}

const lazyLoader = {
  observe(element) {
    if (typeof IntersectionObserver === 'undefined') {
      if (!loadedElements.has(element)) {
        loadedElements.add(element);
        element.src = element.dataset.src;
        element.classList.add('loaded');
      }
      return;
    }
    getObserver().observe(element);
  },

  unobserve(element) {
    if (observer) {
      observer.unobserve(element);
    }
  },

  disconnect() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  },
};

export default lazyLoader;
