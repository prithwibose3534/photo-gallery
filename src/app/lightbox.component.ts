import { Component, inject, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhotoService } from './photo.service';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (photoService.currentPhoto(); as photo) {
      <div class="modal-backdrop" (click)="photoService.closePhoto()">
        <!-- Close Button -->
        <button class="modal-btn close-btn" (click)="photoService.closePhoto()" aria-label="Close">✕</button>

        <!-- Counter Indicator -->
        <div class="modal-counter">
          {{ photoService.selectedIndex()! + 1 }} / {{ photoService.filteredPhotos().length }}
        </div>

        <!-- Previous Button -->
        <button class="modal-btn nav-btn prev-btn" (click)="$event.stopPropagation(); photoService.prevPhoto()" aria-label="Previous">
          &#10094;
        </button>

        <!-- Lightbox Container (Split Grid) -->
        <div class="lightbox-shell" (click)="$event.stopPropagation()">
          
          <!-- Left: Image Canvas -->
          <div class="image-area">
            <img [src]="photo.url" [alt]="photo.title" class="modal-img" />
          </div>

          <!-- Right: Interaction & Details Sidebar -->
          <aside class="sidebar-area">
            <div class="photo-header">
              <span class="badge">{{ photo.album }}</span>
              <h2>{{ photo.title }}</h2>
              @if (photo.location) {
                <p class="location-text">📍 {{ photo.location }}</p>
              }
            </div>

            <!-- Like & Counter Bar -->
            <div class="action-bar">
              <button 
                class="like-btn" 
                [class.liked]="photoService.currentInteraction().liked"
                (click)="photoService.toggleLike(photo.id)">
                <span class="heart-icon">{{ photoService.currentInteraction().liked ? '❤️' : '🤍' }}</span>
                <span>{{ photoService.currentInteraction().likeCount }} Likes</span>
              </button>
              <span class="comment-count-label">
                {{ photoService.currentInteraction().comments.length }} comments
              </span>
            </div>

            <hr class="divider" />

            <!-- Add Comment Form -->
            <form class="comment-form" (submit)="submitComment(photo.id, $event)">
              <input 
                type="text" 
                placeholder="Your name (optional)" 
                [value]="authorInput()" 
                (input)="authorInput.set($any($event.target).value)" 
                class="input-author" 
              />
              <div class="comment-box">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  [value]="textInput()" 
                  (input)="textInput.set($any($event.target).value)" 
                  class="input-comment" 
                  required 
                />
                <button type="submit" class="submit-btn" [disabled]="!textInput().trim()">
                  Post
                </button>
              </div>
            </form>

            <!-- Comments Feed -->
            <div class="comments-list">
              @for (comment of photoService.currentInteraction().comments; track comment.id) {
                <div class="comment-bubble">
                  <div class="comment-meta">
                    <span class="comment-author">{{ comment.author }}</span>
                    <span class="comment-time">{{ comment.timestamp }}</span>
                  </div>
                  <p class="comment-body">{{ comment.text }}</p>
                </div>
              } @empty {
                <div class="empty-comments">No comments yet. Say something!</div>
              }
            </div>
          </aside>
        </div>

        <!-- Next Button -->
        <button class="modal-btn nav-btn next-btn" (click)="$event.stopPropagation(); photoService.nextPhoto()" aria-label="Next">
          &#10095;
        </button>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(8, 11, 19, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .lightbox-shell {
      display: flex;
      flex-direction: row;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      width: 90vw;
      max-width: 1300px;
      height: 85vh;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
    }

    .image-area {
      flex: 1;
      background: #030712;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 1rem;
    }

    .modal-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      user-select: none;
    }

    .sidebar-area {
      width: 360px;
      background: #111827;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #1f2937;
      padding: 1.5rem;
      box-sizing: border-box;
    }

    .photo-header h2 {
      margin: 0.5rem 0 0.25rem;
      font-size: 1.25rem;
      color: #f9fafb;
    }

    .location-text {
      margin: 0;
      font-size: 0.85rem;
      color: #9ca3af;
    }

    .badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.8);
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
      color: white;
    }

    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.25rem;
    }

    .like-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #1f2937;
      border: 1px solid #374151;
      color: #e5e7eb;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .like-btn.liked {
      background: #371b26;
      border-color: #ef4444;
      color: #f87171;
    }

    .comment-count-label {
      font-size: 0.85rem;
      color: #9ca3af;
    }

    .divider {
      border: 0;
      height: 1px;
      background: #1f2937;
      margin: 1rem 0;
    }

    .comment-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .input-author, .input-comment {
      background: #1f2937;
      border: 1px solid #374151;
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .input-author:focus, .input-comment:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .comment-box {
      display: flex;
      gap: 0.5rem;
    }

    .comment-box .input-comment {
      flex: 1;
    }

    .submit-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .submit-btn:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }

    .comments-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-right: 0.25rem;
    }

    .comment-bubble {
      background: #1f2937;
      padding: 0.6rem 0.75rem;
      border-radius: 6px;
    }

    .comment-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .comment-author {
      font-weight: 600;
      color: #60a5fa;
    }

    .comment-time {
      color: #6b7280;
    }

    .comment-body {
      margin: 0;
      font-size: 0.85rem;
      color: #d1d5db;
      word-break: break-word;
    }

    .empty-comments {
      text-align: center;
      color: #6b7280;
      font-size: 0.85rem;
      margin-top: 2rem;
    }

    /* Modal controls */
    .modal-counter { position: absolute; top: 1.5rem; left: 2rem; color: #94a3b8; font-size: 0.9rem; }
    .modal-btn {
      position: absolute;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-btn:hover { background: rgba(51, 65, 85, 0.9); }
    .close-btn { top: 1.5rem; right: 2rem; width: 40px; height: 40px; font-size: 1.1rem; }
    .nav-btn { top: 50%; transform: translateY(-50%); width: 48px; height: 48px; font-size: 1.4rem; }
    .prev-btn { left: 1.5rem; }
    .next-btn { right: 1.5rem; }

    /* Responsive: Stack vertically on mobile screens */
    @media (max-width: 900px) {
      .lightbox-shell {
        flex-direction: column;
        height: 92vh;
      }
      .sidebar-area {
        width: 100%;
        max-height: 40vh;
        border-left: none;
        border-top: 1px solid #1f2937;
      }
      .prev-btn { left: 0.5rem; }
      .next-btn { right: 0.5rem; }
    }
  `]
})
export class LightboxComponent {
  photoService = inject(PhotoService);

  authorInput = signal<string>('');
  textInput = signal<string>('');

  submitComment(photoId: string, event: Event): void {
    event.preventDefault();
    if (!this.textInput().trim()) return;

    this.photoService.addComment(photoId, this.authorInput(), this.textInput());
    this.textInput.set(''); // Clear only the comment box so the author name remains
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.photoService.selectedIndex() === null) return;
    
    // Ignore keyboard arrow shortcuts if user is typing inside the comment input
    const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') return;

    if (event.key === 'Escape') this.photoService.closePhoto();
    if (event.key === 'ArrowRight') this.photoService.nextPhoto();
    if (event.key === 'ArrowLeft') this.photoService.prevPhoto();
  }
}