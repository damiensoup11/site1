class HorizontalSlider {
  constructor(options) {
    this.track = document.querySelector(options.trackSelector);
    this.prevBtn = document.querySelector(options.prevSelector);
    this.nextBtn = document.querySelector(options.nextSelector);
    this.dotsContainer = document.querySelector(options.dotsSelector);
    this.cardSelector = options.cardSelector;
    this.scrollAmount = options.scrollAmount || 340;
    this.infinite = options.infinite !== false;
    this.isScrolling = false; // Флаг для предотвращения множественных срабатываний

    if (!this.track) return;

    this.init();
  }

  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scroll(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scroll(1));
    
    this.track.addEventListener('scroll', () => {
      if (!this.isScrolling) {
        window.requestAnimationFrame(() => {
          this.updateDots();
          if (this.infinite) this.handleInfiniteScroll();
          this.isScrolling = false;
        });
        this.isScrolling = true;
      }
    }, { passive: true });

    this.buildDots();
    if (this.infinite) this.setupInfiniteScroll();
  }

  scroll(direction) {
    if (!this.track) return;
    
    const cardWidth = this.getCardWidth();
    const scrollLeft = this.track.scrollLeft;
    const targetScroll = scrollLeft + (direction * cardWidth);
    
    this.track.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  getCardWidth() {
    const firstCard = this.track.querySelector(this.cardSelector);
    if (!firstCard) return this.scrollAmount;
    
    const style = window.getComputedStyle(firstCard);
    const marginRight = parseInt(style.marginRight) || 0;
    const marginLeft = parseInt(style.marginLeft) || 0;
    
    return firstCard.offsetWidth + marginRight + marginLeft;
  }

  buildDots() {
    if (!this.dotsContainer) return;
    const cards = this.getVisibleCards();
    if (cards.length === 0) return;

    const trackWidth = this.track.clientWidth;
    const cardWidth = this.getCardWidth();
    const visibleCount = Math.max(1, Math.floor(trackWidth / cardWidth));
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
    const cards = this.getVisibleCards();
    if (!cards[index]) return;
    
    const cardWidth = this.getCardWidth();
    let targetScroll;
    
    if (this.infinite) {
      const originalCards = this.track.querySelectorAll(this.cardSelector + ':not([aria-hidden])');
      targetScroll = (index * cardWidth) + (cardWidth * originalCards.length);
    } else {
      targetScroll = index * cardWidth;
    }
    
    this.track.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  getVisibleCards() {
    return this.track.querySelectorAll(this.cardSelector + ':not([aria-hidden])');
  }

  updateDots() {
    if (!this.dotsContainer) return;
    
    const dots = this.dotsContainer.querySelectorAll('[class*="-dot"]');
    const cards = this.getVisibleCards();
    if (cards.length === 0 || dots.length === 0) return;

    const cardWidth = this.getCardWidth();
    const trackWidth = this.track.clientWidth;
    const visibleCount = Math.floor(trackWidth / cardWidth);
    const totalDots = cards.length - visibleCount + 1;

    let currentIndex;
    
    if (this.infinite) {
      const originalCardsCount = cards.length;
      const scrollPosition = this.track.scrollLeft - (cardWidth * originalCardsCount);
      currentIndex = Math.round(scrollPosition / cardWidth);
      
      // Ограничиваем индекс допустимыми пределами
      currentIndex = Math.max(0, Math.min(currentIndex, totalDots - 1));
    } else {
      currentIndex = Math.min(
        Math.floor(this.track.scrollLeft / cardWidth),
        totalDots - 1
      );
    }

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  setupInfiniteScroll() {
    const originalCards = Array.from(this.getVisibleCards());
    if (originalCards.length < 2) return;

    // Клонируем карточки для бесконечности
    originalCards.forEach(card => {
      const cloneEnd = card.cloneNode(true);
      cloneEnd.setAttribute('aria-hidden', 'true');
      this.track.appendChild(cloneEnd);
    });

    originalCards.slice().reverse().forEach(card => {
      const cloneStart = card.cloneNode(true);
      cloneStart.setAttribute('aria-hidden', 'true');
      this.track.insertBefore(cloneStart, this.track.firstChild);
    });

    const cardWidth = this.getCardWidth();
    const offset = cardWidth * originalCards.length;
    
    // Устанавливаем начальную позицию без анимации
    this.track.style.scrollBehavior = 'auto';
    this.track.scrollLeft = offset;
    this.track.style.scrollBehavior = '';
  }

  handleInfiniteScroll() {
    const cards = this.getVisibleCards();
    if (cards.length === 0) return;
    
    const cardWidth = this.getCardWidth();
    const totalWidth = cardWidth * cards.length;
    const currentScroll = this.track.scrollLeft;
    
    // Увеличиваем буферную зону для более плавного перехода
    const bufferZone = cardWidth * 0.2;
    
    // Левая граница
    if (currentScroll < cardWidth - bufferZone) {
      this.resetScrollPosition(currentScroll + totalWidth);
    }
    
    // Правая граница
    if (currentScroll > totalWidth * 2 - cardWidth + bufferZone) {
      this.resetScrollPosition(currentScroll - totalWidth);
    }
  }

  resetScrollPosition(newPosition) {
    // Отключаем плавную прокрутку для мгновенного сброса позиции
    this.track.style.scrollBehavior = 'auto';
    this.track.scrollLeft = newPosition;
    this.track.style.scrollBehavior = '';
    
    // Принудительно обновляем точки
    this.updateDots();
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