class HorizontalSlider {
  constructor(options) {
    this.track = document.querySelector(options.trackSelector);
    this.prevBtn = document.querySelector(options.prevSelector);
    this.nextBtn = document.querySelector(options.nextSelector);
    this.dotsContainer = document.querySelector(options.dotsSelector);
    this.cardSelector = options.cardSelector;
    this.scrollAmount = options.scrollAmount || 340;
    this.infinite = options.infinite !== false;

    if (!this.track) return;

    // Убираем все свойства для drag
    this.init();
  }

  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scroll(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scroll(1));

    // Убираем все mouse/touch события для перетаскивания!
    // Оставляем только скролл для обновления точек
    
    // Dots
    this.track.addEventListener('scroll', () => this.updateDots(), { passive: true });

    this.buildDots();
    if (this.infinite) this.setupInfiniteScroll();
  }

  scroll(direction) {
    this.track.scrollBy({ left: direction * this.scrollAmount, behavior: 'smooth' });
  }

  // Удаляем dragStart, dragMove, dragEnd, applyMomentum полностью!

  buildDots() {
    if (!this.dotsContainer) return;
    const cards = this.track.querySelectorAll(this.cardSelector + ':not([aria-hidden])');
    if (cards.length === 0) return;

    const trackWidth = this.track.clientWidth;
    const cardWidth = cards[0].offsetWidth + 20;
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
    const cards = this.track.querySelectorAll(this.cardSelector + ':not([aria-hidden])');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }

  updateDots() {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll('[class*="-dot"]');
    const cards = this.track.querySelectorAll(this.cardSelector + ':not([aria-hidden])');
    if (cards.length === 0 || dots.length === 0) return;

    const cardWidth = cards[0].offsetWidth + 20;

    let index;
    if (this.infinite) {
      const realOffset = this.track.scrollLeft - cardWidth * cards.length;
      index = Math.min(Math.max(0, Math.round(realOffset / cardWidth)), dots.length - 1);
    } else {
      index = Math.min(Math.round(this.track.scrollLeft / cardWidth), dots.length - 1);
    }

    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  setupInfiniteScroll() {
    const cards = Array.from(this.track.querySelectorAll(this.cardSelector));
    if (cards.length < 2) return;

    cards.forEach(card => {
      const cloneEnd = card.cloneNode(true);
      cloneEnd.setAttribute('aria-hidden', 'true');
      this.track.appendChild(cloneEnd);
    });

    cards.slice().reverse().forEach(card => {
      const cloneStart = card.cloneNode(true);
      cloneStart.setAttribute('aria-hidden', 'true');
      this.track.insertBefore(cloneStart, this.track.firstChild);
    });

    const cardWidth = cards[0].offsetWidth + 20;
    const offset = cardWidth * cards.length;
    this.track.scrollLeft = offset;

    this.track.addEventListener('scroll', () => {
      const total = cardWidth * cards.length;
      const sl = this.track.scrollLeft;

      if (sl < cardWidth * 0.5) {
        this.track.style.scrollBehavior = 'auto';
        this.track.scrollLeft = sl + total;
        this.track.style.scrollBehavior = '';
      }

      if (sl > total * 2 - cardWidth * 0.5) {
        this.track.style.scrollBehavior = 'auto';
        this.track.scrollLeft = sl - total;
        this.track.style.scrollBehavior = '';
      }
    }, { passive: true });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new HorizontalSlider({
    trackSelector: '.works-carousel',
    prevSelector: '#works-prev',
    nextSelector: '#works-next',
    dotsSelector: '.works-dots',
    cardSelector: '.work-card',
    scrollAmount: 300,
    infinite: true,
  });

  new HorizontalSlider({
    trackSelector: '.conditions-slider',
    prevSelector: '#cond-prev',
    nextSelector: '#cond-next',
    dotsSelector: '.conditions-dots',
    cardSelector: '.condition-card',
    scrollAmount: 300,
    infinite: false,
  });
});

