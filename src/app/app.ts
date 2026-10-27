import { Component, inject, OnInit } from '@angular/core';
import { PhotoService } from './photo.service';
import { LightboxComponent } from './lightbox.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LightboxComponent],
  template: `
    <main class="gallery-container">
      <header class="gallery-header">
        <div>
          <h1>Photo Gallery</h1>
          <p>{{ photoService.filteredPhotos().length }} photos in {{ photoService.selectedAlbum() }}</p>
        </div>

        <nav class="album-filter">
          @for (album of photoService.albums(); track album) {
            <button 
              class="tab-btn" 
              [class.active]="photoService.selectedAlbum() === album"
              (click)="photoService.selectAlbum(album)">
              {{ album }}
            </button>
          }
        </nav>
      </header>

      <div class="photo-grid">
        @for (photo of photoService.visiblePhotos(); track photo.id; let i = $index) {
          <div class="photo-card" (click)="photoService.openPhoto(i)">
            <img [src]="photo.url" [alt]="photo.title" loading="lazy" decoding="async" />
            <div class="photo-info">
              <span class="badge">{{ photo.album }}</span>
              <h3>{{ photo.title }}</h3>
            </div>
          </div>
        }
      </div>

      @if (photoService.visibleCount() < photoService.filteredPhotos().length) {
        <div class="load-more-container">
          <button class="load-more-btn" (click)="photoService.loadMore()">
            Load More ({{ photoService.filteredPhotos().length - photoService.visibleCount() }} remaining)
          </button>
        </div>
      }

      <app-lightbox />
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      box-sizing: border-box;
    }
    .gallery-container { max-width: 1400px; margin: 0 auto; }
    .gallery-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 1.5rem;
    }
    @media (min-width: 640px) {
      .gallery-header { flex-direction: row; justify-content: space-between; align-items: flex-end; }
    }
    .album-filter { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tab-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .photo-card {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      background: #1e293b;
      aspect-ratio: 4 / 3;
      cursor: pointer;
      transition: transform 0.2s ease;
      content-visibility: auto;
    contain-intrinsic-size: 300px 225px;
    }
    .photo-card:hover { transform: translateY(-4px); }
    .photo-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-info {
      position: absolute;
      inset: auto 0 0 0;
      padding: 0.75rem 1rem;
      background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
    }
    .photo-info h3 { margin: 0; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.8);
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }
    .load-more-container { text-align: center; margin-top: 3rem; }
    .load-more-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
  `]
})
export class App implements OnInit {
  photoService = inject(PhotoService);

  ngOnInit() {
    this.photoService.loadManifest();
  }
}