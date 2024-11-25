/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - Throttled function
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Main application component for the shows page
 * Uses hardware acceleration where possible through transform3d
 * @returns {Object} Alpine.js component configuration
 */
function showsApp() {
    // Use WeakMap for better memory management with DOM references
    const elements = new WeakMap();
    
    // Create IntersectionObserver for better scroll performance
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transform = 'translate3d(0, 0, 0)';
                    entry.target.style.opacity = '1';
                }
            });
        },
        { threshold: 0.1 }
    );

    return {
        mediaType: '',
        isAnyItemHovered: false,
        mouseX: 0,
        mouseY: 0,
        searchQuery: '',
        isSearchOpen: false,
        isSearching: false,
        isLoading: false,
        debounceTimeout: null,
        description: '',
        subDescription: '',
        category: '',
        genre: '',
        page: 1,
        totalPages: 1,
        genres: [],
        isAddingToWatchlist: false,
        watchlistItems: [],

        /**
         * Initialize the component
         * Sets up performance optimizations and initial state
         */
        init() {
            // Force GPU acceleration for animations
            document.querySelector('.frost-glow').style.transform = 'translate3d(0,0,0)';
            document.querySelector('.movie-list').style.transform = 'translate3d(0,0,0)';
            
            // Enable passive event listeners for better scroll performance
            this.setupEventListeners();
            this.updateDescriptions();
            
            // Initialize lazy loading for images
            this.setupLazyLoading();
        },

        /**
         * Optimized scroll handler using RequestAnimationFrame
         * Implements infinite scrolling with performance optimizations
         */
        handleScroll() {
            const scrollPos = window.scrollY + window.innerHeight;
            const threshold = document.documentElement.scrollHeight - 200;
            
            if (scrollPos >= threshold) {
                if (!this.isLoading && this.page < this.totalPages) {
                    requestAnimationFrame(() => this.loadMore());
                }
            }
        },

        /**
         * Set up optimized event listeners with passive option
         * Uses requestAnimationFrame for smooth animations
         */
        setupEventListeners() {
            // Optimize scroll performance
            const throttledScroll = throttle(() => {
                requestAnimationFrame(() => this.handleScroll());
            }, 100);

            window.addEventListener('scroll', throttledScroll, { passive: true });

            // Optimize hover effects with hardware acceleration
            document.querySelectorAll('.movie-item').forEach(item => {
                item.style.transform = 'translate3d(0,0,0)';
                item.addEventListener('mouseenter', () => {
                    requestAnimationFrame(() => {
                        this.isAnyItemHovered = true;
                        item.style.transform = 'translate3d(0,0,1px) scale(1.02)';
                    });
                });
                item.addEventListener('mouseleave', () => {
                    requestAnimationFrame(() => {
                        this.isAnyItemHovered = false;
                        item.style.transform = 'translate3d(0,0,0) scale(1)';
                    });
                });
            });
        },

        /**
         * Initialize lazy loading for images
         * Uses IntersectionObserver for better performance
         */
        setupLazyLoading() {
            document.querySelectorAll('.movie-image-container img').forEach(img => {
                img.loading = 'lazy';
                observer.observe(img);
            });
        },

        updateDescriptions() {
            if (this.searchQuery) {
                this.description = `Search Results for '${this.searchQuery}'`;
                this.subDescription = 'Showing results for your search';
            } else if (this.genre) {
                this.description = `${this.mediaType === 'movie' ? 'Movies' : 'TV Shows'} in '${this.genre.charAt(0).toUpperCase() + this.genre.slice(1)}'`;
                this.subDescription = `Discover ${this.mediaType === 'movie' ? 'movies' : 'TV shows'} in the ${this.genre} genre`;
            } else {
                this.description = this.category === 'top_rated' ? 
                    `Top Rated ${this.mediaType === 'movie' ? 'Movies' : 'TV Shows'}` : 
                    `Popular ${this.mediaType === 'movie' ? 'Movies' : 'TV Shows'}`;
                this.subDescription = `Discover the latest and most ${this.category === 'top_rated' ? 'top rated' : 'popular'} ${this.mediaType === 'movie' ? 'movies' : 'TV shows'} to watch.`;
            }
        },

        switchMediaType(type) {
            this.mediaType = type;
            this.navigateToPage(1);
        },

        navigateToCategory(category) {
            this.category = category;
            this.searchQuery = '';
            this.genre = '';
            this.navigateToPage(1);
        },

        navigateToGenre(genreName) {
            this.genre = genreName.toLowerCase();
            this.searchQuery = '';
            this.category = '';
            this.navigateToPage(1);
        },

        navigateToPage(page) {
            const params = new URLSearchParams({
                media_type: this.mediaType,
                page: page.toString()
            });

            if (this.searchQuery) params.append('query', this.searchQuery);
            if (this.genre) params.append('genre', this.genre);
            if (this.category) params.append('category', this.category);

            window.location.href = `/shows?${params.toString()}`;
        },

        /**
         * Optimized mouse position tracking for glow effect
         * Uses RequestAnimationFrame for smooth animation
         */
        updateMousePosition(event) {
            if (this.isAnyItemHovered) {
                requestAnimationFrame(() => {
                    this.mouseX = event.clientX;
                    this.mouseY = event.clientY;
                    this.updateGlowPosition();
                });
            }
        },

        /**
         * Update glow effect position with hardware acceleration
         */
        updateGlowPosition() {
            const glow = document.querySelector('.frost-glow');
            if (glow) {
                glow.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`;
            }
        },

        /**
         * Optimized search functionality with debouncing
         * Uses AbortController for request cancellation
         */
        async searchShows() {
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            
            this.debounceTimeout = setTimeout(async () => {
                if (this.searchQuery.length > 2) {
                    this.isSearching = true;
                    const controller = new AbortController();
                    
                    try {
                        const response = await fetch(
                            `/shows?query=${encodeURIComponent(this.searchQuery)}`,
                            { signal: controller.signal }
                        );
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        requestAnimationFrame(() => {
                            const movieList = this.$refs.movieList;
                            if (movieList && doc.querySelector('.movie-list')) {
                                movieList.innerHTML = doc.querySelector('.movie-list').innerHTML;
                                this.setupLazyLoading();
                            }
                        });
                    } catch (error) {
                        if (error.name === 'AbortError') return;
                        console.error('Search error:', error);
                    } finally {
                        this.isSearching = false;
                    }
                }
            }, 300);
        },

        async loadMore() {
            if (this.isLoading || this.page >= this.totalPages) return;
            
            this.isLoading = true;
            try {
                const nextPage = this.page + 1;
                const params = new URLSearchParams({
                    page: nextPage.toString(),
                    query: this.searchQuery || '',
                    category: this.category || '',
                    genre: this.genre || ''
                });
                
                const response = await fetch(`/shows?${params.toString()}`);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMovies = doc.querySelector('.movie-list');
                const movieList = this.$refs.movieList;
                
                if (newMovies && movieList) {
                    movieList.insertAdjacentHTML('beforeend', newMovies.innerHTML);
                    this.page = nextPage;
                    this.setupLazyLoading();
                }
            } catch (error) {
                console.error('Error loading more movies:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async addToWatchlist(item) {
            console.log('Starting addToWatchlist:', item);
            this.isAddingToWatchlist = true;

            try {
                const response = await fetch('/api/watchlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(item)
                });

                console.log('API Response status:', response.status);
                const responseText = await response.text();
                console.log('API Response text:', responseText);

                const result = JSON.parse(responseText);
                console.log('Parsed result:', result);

                if (result.status === 'success') {
                    console.log('Showing success notification for:', item.title);
                    this.showNotification(`Added "${item.title}" to watchlist`);
                    this.watchlistItems.push(item.media_id);
                }
            } catch (error) {
                console.error('Error in addToWatchlist:', error);
                this.showNotification('Error adding to watchlist', 'error');
            } finally {
                this.isAddingToWatchlist = false;
            }
        },

        showNotification(message, type = 'success') {
            console.log('showNotification called:', { message, type });
            const event = new CustomEvent('show-notification', {
                detail: {
                    message,
                    id: Date.now(),
                    type
                }
            });
            console.log('Dispatching event:', event);
            window.dispatchEvent(event);
        },

        isInWatchlist(mediaId) {
            return this.watchlistItems.includes(mediaId);
        }
    };
}

// Initialize Alpine.js with performance monitoring
document.addEventListener('alpine:init', () => {
    Alpine.data('showsApp', showsApp);
    
    // Monitor performance
    if (window.performance) {
        const navigation = performance.getEntriesByType("navigation")[0];
        console.log(`Page load time: ${navigation.loadEventEnd - navigation.startTime}ms`);
    }
});