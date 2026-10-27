import { Injectable, signal, computed } from '@angular/core';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface PhotoInteraction {
  liked: boolean;
  likeCount: number;
  comments: Comment[];
}

export interface Photo {
  id: string;
  album: string;
  url: string;
  title: string;
  caption?: string;
  date?: string;
  location?: string;
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly pageSize = 24;
  private readonly storageKey = 'photo_interactions_v1';

  photos = signal<Photo[]>([]);
  selectedAlbum = signal<string>('All');
  selectedIndex = signal<number | null>(null);
  visibleCount = signal<number>(this.pageSize);

  // Key-value store: { [photoId: string]: PhotoInteraction }
  interactions = signal<Record<string, PhotoInteraction>>(this.loadInteractions());

  private loadInteractions(): Record<string, PhotoInteraction> {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  private saveInteractions(data: Record<string, PhotoInteraction>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  async loadManifest(): Promise<void> {
    try {
      const res = await fetch('/photos.json');
      const data: Photo[] = await res.json();
      this.photos.set(data);
    } catch (err) {
      console.error('Failed to load photos.json:', err);
    }
  }

  albums = computed(() => {
    const list = this.photos().map(p => p.album);
    return ['All', ...Array.from(new Set(list))];
  });

  filteredPhotos = computed(() => {
    const album = this.selectedAlbum();
    return album === 'All' 
      ? this.photos() 
      : this.photos().filter(p => p.album === album);
  });

  visiblePhotos = computed(() => {
    return this.filteredPhotos().slice(0, this.visibleCount());
  });

  currentPhoto = computed(() => {
    const idx = this.selectedIndex();
    return idx !== null ? this.filteredPhotos()[idx] ?? null : null;
  });

  // Returns interaction record for the currently opened photo
  currentInteraction = computed(() => {
    const photo = this.currentPhoto();
    if (!photo) return { liked: false, likeCount: 0, comments: [] };
    return this.interactions()[photo.id] ?? { liked: false, likeCount: 0, comments: [] };
  });

  // Action: Toggle Like
  toggleLike(photoId: string): void {
    const currentMap = { ...this.interactions() };
    const current = currentMap[photoId] ?? { liked: false, likeCount: 0, comments: [] };

    const newLiked = !current.liked;
    const newCount = newLiked ? current.likeCount + 1 : Math.max(0, current.likeCount - 1);

    currentMap[photoId] = {
      ...current,
      liked: newLiked,
      likeCount: newCount
    };

    this.interactions.set(currentMap);
    this.saveInteractions(currentMap);
  }

  // Action: Add Comment
  addComment(photoId: string, author: string, text: string): void {
    if (!text.trim()) return;

    const currentMap = { ...this.interactions() };
    const current = currentMap[photoId] ?? { liked: false, likeCount: 0, comments: [] };

    const newComment: Comment = {
      id: Date.now().toString(),
      author: author.trim() || 'Guest',
      text: text.trim(),
      timestamp: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    currentMap[photoId] = {
      ...current,
      comments: [newComment, ...current.comments]
    };

    this.interactions.set(currentMap);
    this.saveInteractions(currentMap);
  }

  selectAlbum(album: string): void {
    this.selectedAlbum.set(album);
    this.visibleCount.set(this.pageSize);
  }

  loadMore(): void {
    this.visibleCount.update(n => n + this.pageSize);
  }

  openPhoto(index: number): void {
    this.selectedIndex.set(index);
  }

  closePhoto(): void {
    this.selectedIndex.set(null);
  }

  nextPhoto(): void {
    const current = this.selectedIndex();
    if (current === null) return;
    this.selectedIndex.set((current + 1) % this.filteredPhotos().length);
  }

  prevPhoto(): void {
    const current = this.selectedIndex();
    if (current === null) return;
    const len = this.filteredPhotos().length;
    this.selectedIndex.set((current - 1 + len) % len);
  }
}