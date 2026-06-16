class VideoStorage {
  constructor() {
    this.storageKey = 'university_videos';
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}));
    }
  }

  getVideos() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  saveVideo(id, videoData) {
    const videos = this.getVideos();
    videos[id] = videoData;
    localStorage.setItem(this.storageKey, JSON.stringify(videos));
  }

  getVideo(id) {
    const videos = this.getVideos();
    return videos[id] || null;
  }

  deleteVideo(id) {
    const videos = this.getVideos();
    delete videos[id];
    localStorage.setItem(this.storageKey, JSON.stringify(videos));
  }
}

const universityVideoStorage = new VideoStorage();