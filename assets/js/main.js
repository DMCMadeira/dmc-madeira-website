/**
 * DMC Madeira - Main JavaScript
 * Handles all interactive functionality for the website
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initHeader();
    initMobileMenu();
    initCookieBanner();
    initExperiencesCarousel();
    // initWhyChooseCarousel(); // Handled by inline script in index.html
    initSmoothScroll();
});

/**
 * Header scroll behavior
 */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });

    // Initial check
    updateHeader();
}

/**
 * Mobile menu functionality
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.header__menu-btn');
    const mobileNav = document.querySelector('.header__mobile-nav');
    const closeBtn = document.querySelector('.header__mobile-close');
    const body = document.body;

    if (!menuBtn || !mobileNav) return;

    function openMenu() {
        mobileNav.classList.add('active');
        body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileNav.classList.remove('active');
        body.style.overflow = '';
    }

    menuBtn.addEventListener('click', openMenu);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMenu();
        }
    });

    // Close when clicking outside
    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) {
            closeMenu();
        }
    });
}

/**
 * Cookie banner functionality
 */
function initCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    const acceptBtn = document.querySelector('.cookie-banner__btn--accept');
    const rejectBtn = document.querySelector('.cookie-banner__btn--reject');
    const whatsappFloat = document.querySelector('.whatsapp-float');

    if (!banner) return;

    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('dmc-cookie-choice');

    if (!cookieChoice) {
        // Show banner after a short delay
        setTimeout(() => {
            banner.classList.add('active');
            if (whatsappFloat) {
                whatsappFloat.classList.add('cookie-visible');
            }
        }, 1000);
    }

    function hideBanner(choice) {
        localStorage.setItem('dmc-cookie-choice', choice);
        banner.classList.remove('active');
        
        setTimeout(() => {
            banner.classList.add('hidden');
            if (whatsappFloat) {
                whatsappFloat.classList.remove('cookie-visible');
            }
        }, 500);
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => hideBanner('accepted'));
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => hideBanner('rejected'));
    }
}

/**
 * Experiences carousel initialization
 */
function initExperiencesCarousel() {
    const carouselContainer = document.querySelector('.experiences__carousel-wrapper');
    
    if (!carouselContainer || typeof DMCCarousel === 'undefined') return;

    new DMCCarousel(carouselContainer, {
        slidesPerView: 4,
        gap: 24,
        autoplay: false,
        infinite: false,
        breakpoints: {
            1200: { slidesPerView: 3 },
            900: { slidesPerView: 2 },
            600: { slidesPerView: 1.2, gap: 16 }
        }
    });
}

/**
 * Why Choose carousel initialization (mobile only)
 */
function initWhyChooseCarousel() {
    const carouselContainer = document.querySelector('.why-choose__carousel-wrapper');
    
    if (!carouselContainer || typeof DMCCarousel === 'undefined') return;

    let carouselInstance = null;

    function createCarousel() {
        // Only initialize if visible (container has width)
        if (carouselContainer.offsetWidth > 0 && !carouselInstance) {
            carouselInstance = new DMCCarousel(carouselContainer, {
                slidesPerView: 1.2,
                gap: 16,
                autoplay: false,
                infinite: false
            });
        }
    }

    // Try to initialize immediately
    createCarousel();

    // Also try on resize (for when switching to mobile view)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!carouselInstance && carouselContainer.offsetWidth > 0) {
                createCarousel();
            } else if (carouselInstance) {
                // Recalculate dimensions on resize
                carouselInstance.calculateDimensions();
                carouselInstance.goTo(carouselInstance.currentIndex, true);
            }
        }, 200);
    });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

