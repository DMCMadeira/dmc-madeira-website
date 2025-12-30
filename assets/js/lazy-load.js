/**
 * DMC Madeira - Image Lazy Loading
 * Implements lazy loading for images using Intersection Observer API
 * 
 * Usage:
 * - All images with data-src attribute will be lazy loaded
 * - Add class "no-lazy" to exclude images from lazy loading
 * - Hero/above-the-fold images should use "no-lazy" class
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.01,         // Trigger when 1% of image is visible
        fadeInDuration: 400      // Fade-in animation duration in ms
    };

    // CSS for lazy loading effects
    const lazyStyles = `
        .lazy-image {
            opacity: 0;
            transition: opacity ${config.fadeInDuration}ms ease-in-out;
        }
        .lazy-image.loaded {
            opacity: 1;
        }
        .lazy-image.error {
            opacity: 0.5;
        }
    `;

    // Inject styles
    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = lazyStyles;
        document.head.appendChild(styleSheet);
    }

    // Check if native lazy loading is supported
    const supportsNativeLazyLoading = 'loading' in HTMLImageElement.prototype;

    // Initialize lazy loading
    function initLazyLoading() {
        injectStyles();

        // Get all images that should be lazy loaded
        const images = document.querySelectorAll('img:not(.no-lazy):not([data-lazy-processed])');
        const sources = document.querySelectorAll('source:not([data-lazy-processed])');

        // Skip if no images found
        if (images.length === 0 && sources.length === 0) return;

        // Process sources in picture elements first
        sources.forEach(source => {
            const picture = source.closest('picture');
            const img = picture ? picture.querySelector('img') : null;
            
            // Skip if the associated image has no-lazy class
            if (img && img.classList.contains('no-lazy')) {
                source.setAttribute('data-lazy-processed', 'true');
                return;
            }

            // Store original srcset and remove it
            if (source.srcset) {
                source.setAttribute('data-srcset', source.srcset);
                source.removeAttribute('srcset');
            }
            source.setAttribute('data-lazy-processed', 'true');
        });

        // Process images
        const lazyImages = [];
        images.forEach(img => {
            // Skip already processed or excluded images
            if (img.classList.contains('no-lazy')) {
                img.setAttribute('data-lazy-processed', 'true');
                return;
            }

            // Store original src and srcset
            if (img.src) {
                img.setAttribute('data-src', img.src);
                // Use a transparent placeholder
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
            }
            if (img.srcset) {
                img.setAttribute('data-srcset', img.srcset);
                img.removeAttribute('srcset');
            }

            img.classList.add('lazy-image');
            img.setAttribute('data-lazy-processed', 'true');
            lazyImages.push(img);
        });

        // Use Intersection Observer if supported
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: config.rootMargin,
                threshold: config.threshold
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers - load all images immediately
            lazyImages.forEach(img => loadImage(img));
        }
    }

    // Load a single image
    function loadImage(img) {
        const picture = img.closest('picture');

        // Load sources first (for picture element)
        if (picture) {
            const sources = picture.querySelectorAll('source[data-srcset]');
            sources.forEach(source => {
                source.srcset = source.getAttribute('data-srcset');
                source.removeAttribute('data-srcset');
            });
        }

        // Create a temporary image to preload
        const tempImg = new Image();
        
        tempImg.onload = function() {
            // Restore srcset first
            if (img.hasAttribute('data-srcset')) {
                img.srcset = img.getAttribute('data-srcset');
                img.removeAttribute('data-srcset');
            }
            // Then restore src
            if (img.hasAttribute('data-src')) {
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
        };

        tempImg.onerror = function() {
            // On error, still try to load the image
            if (img.hasAttribute('data-src')) {
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
            }
            img.classList.add('loaded', 'error');
        };

        // Start loading
        if (img.hasAttribute('data-srcset')) {
            tempImg.srcset = img.getAttribute('data-srcset');
        }
        if (img.hasAttribute('data-src')) {
            tempImg.src = img.getAttribute('data-src');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLazyLoading);
    } else {
        // DOM is already ready
        initLazyLoading();
    }

    // Also handle dynamically added images
    // Re-run initialization after page is fully loaded (for any late additions)
    window.addEventListener('load', function() {
        setTimeout(initLazyLoading, 100);
    });

    // Expose a global function to manually trigger lazy loading on new content
    window.DMCLazyLoad = {
        refresh: initLazyLoading
    };

})();

