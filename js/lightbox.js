/**
 * lightbox.js
 * Opens clicked work card images in a fullscreen lightbox
 * with prev/next navigation and keyboard support
 */

class Lightbox {
  constructor() {
    this.el = document.getElementById('lightbox');
    this.img = this.el.querySelector('.lightbox-img');
    this.closeBtn = this.el.querySelector('.lightbox-close');
    this.prevBtn = this.el.querySelector('.lightbox-prev');
    this.nextBtn = this.el.querySelector('.lightbox-next');

    this.images = [];
    this.currentIndex = 0;

    this.init();
  }

  init() {
    // Collect all work cards
    this.bindCards();

    // Controls
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.navigate(-1));
    this.nextBtn.addEventListener('click', () => this.navigate(1));

    // Click backdrop to close
    this.el.addEventListener('click', e => {
      if (e.target === this.el) this.close();
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (!this.el.classList.contains('open')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });

    // Touch swipe
    let touchStartX = 0;
    this.el.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    this.el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) this.navigate(dx < 0 ? 1 : -1);
    });
  }

  bindCards() {
    const cards = document.querySelectorAll('.work-card');
    this.images = Array.from(cards).map(card => card.querySelector('img')?.src).filter(Boolean);

    cards.forEach((card, index) => {
      card.addEventListener('click', () => this.open(index));
    });
  }

  open(index) {
    this.currentIndex = index;
    this.img.src = this.images[index];
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.updateNavVisibility();
  }

  close() {
    this.el.classList.remove('open');
    document.body.style.overflow = '';
    // Clear src after animation
    setTimeout(() => { this.img.src = ''; }, 350);
  }

  navigate(direction) {
    const total = this.images.length;
    this.currentIndex = (this.currentIndex + direction + total) % total;
    this.img.style.opacity = '0';
    this.img.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.img.src = this.images[this.currentIndex];
      this.img.style.opacity = '';
      this.img.style.transform = '';
    }, 180);
    this.updateNavVisibility();
  }

  updateNavVisibility() {
    const show = this.images.length > 1;
    this.prevBtn.style.display = show ? '' : 'none';
    this.nextBtn.style.display = show ? '' : 'none';
  }

  // Call after dynamically adding new cards
  refresh() {
    this.bindCards();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lightbox = new Lightbox();
});
