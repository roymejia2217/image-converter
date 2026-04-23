// Lazy loading of heavy dependencies
let imageCompression = null;

const lazyLoader = {
  async loadImageCompression() {
    if (!imageCompression) {
      const module = await import('browser-image-compression');
      imageCompression = module.default;
    }
    return imageCompression;
  }
};

export default lazyLoader;
