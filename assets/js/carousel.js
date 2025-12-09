/**
 * DMC Madeira - Universal Carousel System
 * A reusable carousel implementation for all carousels across the website.
 * 
 * Usage:
 * const carousel = new DMCCarousel(element, options);
 * 
 * Options:
 * - slidesPerView: Number of slides visible (default: 4)
 * - gap: Gap between slides in pixels (default: 24)
 * - autoplay: Enable autoplay (default: false)
 * - autoplaySpeed: Autoplay interval in ms (default: 5000)
 * - infinite: Enable infinite scroll (default: false)
 * - breakpoints: Object with responsive settings
 */

class DMCCarousel {
    constructor(element, options = {}) {
        this.container = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!this.container) {
            console.warn('DMCCarousel: Container element not found');
            return;
        }

        this.track = this.container.querySelector('[data-carousel-track]');
        this.slides = Array.from(this.track?.children || []);
        this.prevBtn = this.container.querySelector('[data-carousel-prev]');
        this.nextBtn = this.container.querySelector('[data-carousel-next]');
        this.progressBar = this.container.querySelector('[data-carousel-progress]');
        
        if (!this.track || this.slides.length === 0) {
            console.warn('DMCCarousel: Track or slides not found');
            return;
        }

        // Default options
        this.options = {
            slidesPerView: 4,
            gap: 24,
            autoplay: false,
            autoplaySpeed: 5000,
            infinite: false,
            breakpoints: {},
            ...options
        };

        this.currentIndex = 0;
        this.autoplayInterval = null;
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.init();
    }

    init() {
        this.calculateDimensions();
        this.bindEvents();
        this.updateControls();
        this.updateProgress();
        
        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }

    calculateDimensions() {
        const containerWidth = this.container.offsetWidth;
        const currentOptions = this.getResponsiveOptions();
        const { slidesPerView, gap } = currentOptions;

        // Calculate slide width
        this.slideWidth = (containerWidth - (gap * (slidesPerView - 1))) / slidesPerView;
        this.maxIndex = Math.max(0, this.slides.length - slidesPerView);

        // Apply styles to slides
        this.slides.forEach(slide => {
            slide.style.flex = `0 0 ${this.slideWidth}px`;
            slide.style.minWidth = `${this.slideWidth}px`;
        });

        // Set gap on track
        this.track.style.gap = `${gap}px`;
    }

    getResponsiveOptions() {
        const windowWidth = window.innerWidth;
        let options = { ...this.options };

        // Sort breakpoints by key (max-width) in descending order
        const sortedBreakpoints = Object.keys(this.options.breakpoints || {})
            .map(Number)
            .sort((a, b) => b - a);

        for (const breakpoint of sortedBreakpoints) {
            if (windowWidth <= breakpoint) {
                options = { ...options, ...this.options.breakpoints[breakpoint] };
            }
        }

        return options;
    }

    bindEvents() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }

        // Window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.calculateDimensions();
                this.goTo(Math.min(this.currentIndex, this.maxIndex));
            }, 100);
        });

        // Touch events for mobile swipe
        this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.track.addEventListener('touchend', () => this.handleTouchEnd());

        // Pause autoplay on hover
        if (this.options.autoplay) {
            this.container.addEventListener('mouseenter', () => this.stopAutoplay());
            this.container.addEventListener('mouseleave', () => this.startAutoplay());
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
    }

    handleTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }

    prev() {
        if (this.isAnimating) return;
        
        if (this.currentIndex > 0) {
            this.goTo(this.currentIndex - 1);
        } else if (this.options.infinite) {
            this.goTo(this.maxIndex);
        }
    }

    next() {
        if (this.isAnimating) return;
        
        if (this.currentIndex < this.maxIndex) {
            this.goTo(this.currentIndex + 1);
        } else if (this.options.infinite) {
            this.goTo(0);
        }
    }

    goTo(index) {
        if (this.isAnimating || index === this.currentIndex) return;

        this.isAnimating = true;
        this.currentIndex = Math.max(0, Math.min(index, this.maxIndex));

        const currentOptions = this.getResponsiveOptions();
        const translateX = this.currentIndex * (this.slideWidth + currentOptions.gap);

        this.track.style.transform = `translateX(-${translateX}px)`;

        this.updateControls();
        this.updateProgress();

        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    updateControls() {
        if (this.prevBtn) {
            this.prevBtn.disabled = !this.options.infinite && this.currentIndex === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = !this.options.infinite && this.currentIndex >= this.maxIndex;
        }
    }

    updateProgress() {
        if (this.progressBar) {
            const progress = this.maxIndex > 0 
                ? ((this.currentIndex + 1) / (this.maxIndex + 1)) * 100 
                : 100;
            this.progressBar.style.width = `${progress}%`;
        }
    }

    startAutoplay() {
        if (this.autoplayInterval) return;
        
        this.autoplayInterval = setInterval(() => {
            if (this.currentIndex >= this.maxIndex) {
                if (this.options.infinite) {
                    this.goTo(0);
                }
            } else {
                this.next();
            }
        }, this.options.autoplaySpeed);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    destroy() {
        this.stopAutoplay();
        // Remove event listeners if needed
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DMCCarousel;
}

