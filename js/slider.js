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

    this.isDragging = false;
    this.startX = 0;
    this.startScrollLeft = 0;
    this.velX = 0;
    this.lastX = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.init();
  }

  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scroll(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scroll(1));

    // Mouse
    this.track.addEventListener('mousedown', e => this.dragStart(e));
    window.addEventListener('mousemove', e => this.dragMove(e));
    window.addEventListener('mouseup', () => this.dragEnd());

    // Touch
    this.track.addEventListener('touchstart', e => this.dragStart(e.touches[0]), { passive: true });
    window.addEventListener('touchmove', e => this.dragMove(e.touches[0]), { passive: true }); // window вместо track
    window.addEventListener('touchend', () => this.dragEnd());
    // Dots
    this.track.addEventListener('scroll', () => this.updateDots(), { passive: true });

    this.buildDots();
    if (this.infinite) this.setupInfiniteScroll();
  }

  scroll(direction) {
    this.track.scrollBy({ left: direction * this.scrollAmount, behavior: 'smooth' });
  }

  dragStart(e) {
    cancelAnimationFrame(this.rafId);
    this.isDragging = true;
    this.startX = e.pageX;
    this.startScrollLeft = this.track.scrollLeft;
    this.velX = 0;
    this.lastX = e.pageX;
    this.lastTime = performance.now();
    this.track.style.cursor = 'grabbing';
    this.track.style.userSelect = 'none';
  }

  dragMove(e) {
    if (!this.isDragging) return;
    const now = performance.now();
    const dt = now - this.lastTime;

    if (dt > 0) {
      this.velX = (e.pageX - this.lastX) / dt;
    }

    this.lastX = e.pageX;
    this.lastTime = now;

    const walk = e.pageX - this.startX;
    this.track.scrollLeft = this.startScrollLeft - walk;
  }

  dragEnd() {
  if (!this.isDragging) return;
  this.isDragging = false;
  this.track.style.cursor = 'grab';
  this.track.style.userSelect = '';

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const multiplier = isTouchDevice ? -800 : -400; // добавить
  this.applyMomentum(this.velX * multiplier);
}

  applyMomentum(velocity) {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const friction = isTouchDevice ? 0.95 : 0.92; // было только 0.92

  const step = () => {
    if (Math.abs(velocity) < 0.5) return;
    this.track.scrollLeft += velocity;
    velocity *= friction;
    this.rafId = requestAnimationFrame(step);
  };

  this.rafId = requestAnimationFrame(step);
}

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
    scrollAmount: 1000,
    infinite: true,
  });

  new HorizontalSlider({
    trackSelector: '.conditions-slider',
    prevSelector: '#cond-prev',
    nextSelector: '#cond-next',
    dotsSelector: '.conditions-dots',
    cardSelector: '.condition-card',
    scrollAmount: 1000,
    infinite: false,
  });
});

