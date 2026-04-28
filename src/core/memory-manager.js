// Object URL and memory management for blobs
const memoryManager = {
  objectUrls: new Set(),
  thumbnailBlobUrls: new Set(),
  stats: { created: 0, revoked: 0, leaked: 0 },

  createObjectURL(blob) {
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    this.stats.created++;
    return url;
  },

  createThumbnailURL(blob) {
    const url = URL.createObjectURL(blob);
    this.thumbnailBlobUrls.add(url);
    this.stats.created++;
    return url;
  },

  revokeObjectURL(url) {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
      this.stats.revoked++;
    }
  },

  revokeThumbnailURL(url) {
    if (this.thumbnailBlobUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.thumbnailBlobUrls.delete(url);
      this.stats.revoked++;
    }
  },

  cleanup() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.thumbnailBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.stats.leaked = this.objectUrls.size + this.thumbnailBlobUrls.size;
    this.objectUrls.clear();
    this.thumbnailBlobUrls.clear();
    console.log('Memory manager stats:', this.stats);
  },

  getStats() {
    return { ...this.stats, active: this.objectUrls.size, activeThumbnailUrls: this.thumbnailBlobUrls.size };
  }
};

export default memoryManager;
