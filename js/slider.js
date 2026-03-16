/**
 * slider.js
 * Drag-to-scroll + arrow navigation for horizontal sliders
 * Used for both Works and Conditions sections
 */

class HorizontalSlider {
  constructor(options) {
    this.track = document.querySelector(options.trackSelector);
    this.prevBtn = document.querySelector(options.prevSelector);
    this.nextBtn = document.querySelector(options.nextSelector);
    this.dotsContainer = document.querySelector(options.dotsSelector);
    this.cardSelector = options.cardSelector;
    this.scrollAmount = options.scrollAmount || 340;

    if (!this.track) return;

    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;

    this.init();
  }

  init() {
    // Arrow buttons
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scroll(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scroll(1));

    // Drag to scroll
    this.track.addEventListener('mousedown', e => this.dragStart(e));
    this.track.addEventListener('mousemove', e => this.dragMove(e));
    this.track.addEventListener('mouseup', () => this.dragEnd());
    this.track.addEventListener('mouseleave', () => this.dragEnd());

    // Touch support
    this.track.addEventListener('touchstart', e => this.dragStart(e.touches[0]), { passive: true });
    this.track.addEventListener('touchmove', e => this.dragMove(e.touches[0]), { passive: true });
    this.track.addEventListener('touchend', () => this.dragEnd());

    // Scroll → update dots
    this.track.addEventListener('scroll', () => this.updateDots(), { passive: true });

    // Build dots
    this.buildDots();
  }

  scroll(direction) {
    this.track.scrollBy({ left: direction * this.scrollAmount, behavior: 'smooth' });
  }

  dragStart(e) {
    this.isDragging = true;
    this.startX = e.pageX - this.track.offsetLeft;
    this.scrollLeft = this.track.scrollLeft;
    this.track.style.cursor = 'grabbing';
    this.track.style.userSelect = 'none';
  }

  dragMove(e) {
    if (!this.isDragging) return;
    const x = e.pageX - this.track.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    this.track.scrollLeft = this.scrollLeft - walk;
  }

  dragEnd() {
    this.isDragging = false;
    this.track.style.cursor = 'grab';
    this.track.style.userSelect = '';
  }

  buildDots() {
    if (!this.dotsContainer) return;
    const cards = this.track.querySelectorAll(this.cardSelector);
    if (cards.length === 0) return;

    // Считаем сколько карточек видно одновременно
    const trackWidth = this.track.clientWidth;
    const cardWidth = cards[0].offsetWidth + 20; // 20 = gap
    const visibleCount = Math.floor(trackWidth / cardWidth);
    const totalDots = Math.max(1, cards.length - visibleCount + 1);

    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'works-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Перейти к ${i + 1}`);
      dot.addEventListener('click', () => this.scrollToCard(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  scrollToCard(index) {
    const cards = this.track.querySelectorAll(this.cardSelector);
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }

  updateDots() {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll('[class*="-dot"]');
    const cards = this.track.querySelectorAll(this.cardSelector);
    if (cards.length === 0 || dots.length === 0) return;

    const cardWidth = cards[0].offsetWidth + 20;
    const index = Math.min(
      Math.round(this.track.scrollLeft / cardWidth),
      dots.length - 1
    );

    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new HorizontalSlider({
    trackSelector: '.works-carousel',
    prevSelector: '#works-prev',
    nextSelector: '#works-next',
    dotsSelector: '.works-dots',
    cardSelector: '.work-card',
    scrollAmount: 320,
  });

  new HorizontalSlider({
    trackSelector: '.conditions-slider',
    prevSelector: '#cond-prev',
    nextSelector: '#cond-next',
    dotsSelector: '.conditions-dots',
    cardSelector: '.condition-card',
    scrollAmount: 380,
  });
});
