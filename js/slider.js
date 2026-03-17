/**
 * slider.js — Premium Slider
 * - Бесконечный слайдер для works
 * - Конечный слайдер для conditions
 * - Mouse drag, touch, кнопки, инерция — для обоих
 */

class Slider {
  constructor(options) {
    this.track = document.querySelector(options.trackSelector);
    this.prevBtn = document.querySelector(options.prevSelector);
    this.nextBtn = document.querySelector(options.nextSelector);
    this.dotsContainer = document.querySelector(options.dotsSelector);
    this.cardSelector = options.cardSelector;
    this.stepSize = options.stepSize || 340;
    this.infinite = options.infinite || false;

    if (!this.track) return;

    this.isDown = false;
    this.startX = 0;
    this.startScroll = 0;
    this.velX = 0;
    this.lastX = 0;
    this.lastT = 0;
    this.rafId = null;
    this.moved = false;

    this.init();
  }

  init() {
    if (this.infinite) this.cloneCards();

    this.bindDrag();
    this.bindButtons();
    this.bindScroll();
    this.buildDots();

    if (this.infinite) this.jumpToCenter();

    window.addEventListener('resize', () => {
      if (this.infinite) this.jumpToCenter();
      this.buildDots();
    }, { passive: true });
  }

  /* ─── INFINITE: клонирование ─── */

  cloneCards() {
    const originals = Array.from(this.track.querySelectorAll(this.cardSelector));
    if (originals.length < 2) return;

    originals.forEach(card => {
      const c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('_clone');
      this.track.appendChild(c);
    });

    originals.slice().reverse().forEach(card => {
      const c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('_clone');
      this.track.insertBefore(c, this.track.firstChild);
    });
  }

  jumpToCenter() {
    const originals = this.track.querySelectorAll(this.cardSelector + ':not(._clone)');
    if (!originals.length) return;
    const gap = this.getGap();
    const cardW = originals[0].offsetWidth + gap;
    this.track.scrollLeft = cardW * originals.length;
  }

  /* ─── DRAG — работает для обоих слайдеров ─── */

  bindDrag() {
    const t = this.track;

    t.addEventListener('mousedown', e => this.onDown(e.clientX));
    window.addEventListener('mousemove', e => {
      if (this.isDown) this.onMove(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      if (this.isDown) this.onUp();
    });

    t.addEventListener('touchstart', e => {
      this.onDown(e.touches[0].clientX);
    }, { passive: true });

    t.addEventListener('touchmove', e => {
      if (this.isDown) this.onMove(e.touches[0].clientX);
    }, { passive: true });

    t.addEventListener('touchend', () => {
      if (this.isDown) this.onUp();
    });

    // Блокируем клик если было движение
    t.addEventListener('click', e => {
      if (this.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  onDown(x) {
    cancelAnimationFrame(this.rafId);
    this.isDown = true;
    this.moved = false;
    this.startX = x;
    this.startScroll = this.track.scrollLeft;
    this.velX = 0;
    this.lastX = x;
    this.lastT = performance.now();
    this.track.style.cursor = 'grabbing';
  }

  onMove(x) {
    if (!this.isDown) return;
    const dx = x - this.startX;
    if (Math.abs(dx) > 4) this.moved = true;

    const now = performance.now();
    const dt = now - this.lastT;
    if (dt > 0) this.velX = (x - this.lastX) / dt;
    this.lastX = x;
    this.lastT = now;

    this.track.scrollLeft = this.startScroll - dx;
  }

  onUp() {
    this.isDown = false;
    this.track.style.cursor = 'grab';

    let vel = -this.velX * 18;
    const friction = 0.88;

    const step = () => {
      if (Math.abs(vel) < 0.4) {
        setTimeout(() => { this.moved = false; }, 50);
        return;
      }
      this.track.scrollLeft += vel;
      vel *= friction;
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  /* ─── КНОПКИ ─── */

  bindButtons() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.step(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.step(1));
  }

  step(dir) {
    cancelAnimationFrame(this.rafId);
    const target = this.track.scrollLeft + dir * this.stepSize;
    this.smoothScrollTo(target);
  }

  smoothScrollTo(target) {
    const start = this.track.scrollLeft;
    const dist = target - start;
    const duration = 420;
    const startT = performance.now();
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (now) => {
      const progress = Math.min((now - startT) / duration, 1);
      this.track.scrollLeft = start + dist * ease(progress);
      if (progress < 1) this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  /* ─── INFINITE LOOP ─── */

  loopCheck() {
    const originals = this.track.querySelectorAll(this.cardSelector + ':not(._clone)');
    if (!originals.length) return;
    const gap = this.getGap();
    const cardW = originals[0].offsetWidth + gap;
    const total = cardW * originals.length;
    const sl = this.track.scrollLeft;

    if (sl < cardW * 0.5) {
      this.track.style.cssText += ';scroll-behavior:auto!important';
      this.track.scrollLeft = sl + total;
      requestAnimationFrame(() => {
        this.track.style.cssText = this.track.style.cssText.replace(';scroll-behavior:auto!important', '');
      });
    } else if (sl > total * 2 - cardW * 0.5) {
      this.track.style.cssText += ';scroll-behavior:auto!important';
      this.track.scrollLeft = sl - total;
      requestAnimationFrame(() => {
        this.track.style.cssText = this.track.style.cssText.replace(';scroll-behavior:auto!important', '');
      });
    }
  }

  /* ─── SCROLL ─── */

  bindScroll() {
    this.track.addEventListener('scroll', () => {
      if (this.infinite) this.loopCheck();
      this.updateDots();
    }, { passive: true });
  }

  /* ─── DOTS ─── */

  buildDots() {
    if (!this.dotsContainer) return;
    const cards = this.track.querySelectorAll(this.cardSelector + ':not(._clone)');
    if (!cards.length) return;

    const trackW = this.track.clientWidth;
    const gap = this.getGap();
    const cardW = cards[0].offsetWidth + gap;
    const visible = Math.floor(trackW / cardW);
    const total = Math.max(1, cards.length - visible + 1);

    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const btn = document.createElement('button');
      btn.className = 'works-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Слайд ${i + 1}`);
      btn.addEventListener('click', () => {
        const offset = this.infinite
          ? cardW * cards.length + cardW * i
          : cardW * i;
        this.smoothScrollTo(offset);
      });
      this.dotsContainer.appendChild(btn);
    }
  }

  updateDots() {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll('.works-dot');
    const cards = this.track.querySelectorAll(this.cardSelector + ':not(._clone)');
    if (!dots.length || !cards.length) return;

    const gap = this.getGap();
    const cardW = cards[0].offsetWidth + gap;

    let raw;
    if (this.infinite) {
      raw = (this.track.scrollLeft - cardW * cards.length) / cardW;
    } else {
      raw = this.track.scrollLeft / cardW;
    }

    const index = Math.min(Math.max(0, Math.round(raw)), dots.length - 1);
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  /* ─── HELPERS ─── */

  getGap() {
    const style = window.getComputedStyle(this.track);
    return parseInt(style.gap || style.columnGap || '20') || 20;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Slider({
    trackSelector: '.works-carousel',
    prevSelector: '#works-prev',
    nextSelector: '#works-next',
    dotsSelector: '.works-dots',
    cardSelector: '.work-card',
    stepSize: 320,
    infinite: true,
  });

  new Slider({
    trackSelector: '.conditions-slider',
    prevSelector: '#cond-prev',
    nextSelector: '#cond-next',
    dotsSelector: '.conditions-dots',
    cardSelector: '.condition-card',
    stepSize: 380,
    infinite: false,
  });
});