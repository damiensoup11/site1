/**
 * cherry.js
 * Анимация падающих вишен в hero-секции.
 * Использует растровое изображение из images/cherry.png
 *
 * КАК ДОБАВИТЬ ИЗОБРАЖЕНИЕ:
 * Положите файл вишни в папку images/ с именем cherry.png
 * Рекомендуемый размер: 64×64px или 128×128px (квадрат, PNG с прозрачностью)
 */

(function () {
    const IMAGE_SRC = 'images/cherry.png'; // ← путь к изображению
    const PETAL_COUNT = 14;                   // ← количество вишен на экране

    const hero = document.getElementById('hero');
    if (!hero) return;

    /* ── Canvas ── */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
        'position:absolute',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:1',
        'image-rendering:auto',
    ].join(';');
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ── Загрузка изображения ── */
    const img = new Image();
    img.src = IMAGE_SRC;
    img.onerror = () => {
        console.warn('[cherry.js] Изображение не найдено:', IMAGE_SRC);
    };

    /* ── Создание частицы ── */
    function createPetal() {
        return {
            x: Math.random() * (canvas.width || window.innerWidth),
            y: Math.random() * (canvas.height || window.innerHeight),
            size: Math.random() * 44 + 18,   // итоговый размер в px
            speedY: Math.random() + 0.9,
            speedX: Math.random() * 0.4 - 0.15,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.018,
            opacity: Math.random() * 0.45 + 0.35,
            sway: Math.random() * 0.35 + 0.1,
            swayOffset: Math.random() * Math.PI * 2,
        };
    }

    const petals = Array.from({ length: PETAL_COUNT }, createPetal);

    /* ── Анимация ── */
    let tick = 0;
    let rafId = null;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        tick += 0.008;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'; // 'low', 'medium', 'high'
        if (img.complete && img.naturalWidth > 0) {
            petals.forEach(p => {
                // движение
                p.y += p.speedY;
                p.x += p.speedX + Math.sin(tick + p.swayOffset) * p.sway;
                p.angle += p.rotSpeed;

                // переброс при выходе за нижний край
                if (p.y > canvas.height + p.size) {
                    p.y = -p.size;
                    p.x = Math.random() * canvas.width;
                }
                // горизонтальные границы
                if (p.x > canvas.width + p.size) p.x = -p.size;
                if (p.x < -p.size) p.x = canvas.width + p.size;

                // отрисовка
                ctx.save();

                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
        }

        rafId = requestAnimationFrame(animate);
    }

    animate();

    /* ── Оптимизация: пауза когда hero не виден ── */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!rafId) animate();
                } else {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            });
        }, { threshold: 0 }).observe(hero);
    }

})();