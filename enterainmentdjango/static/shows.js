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
            // Get initial values from data attributes and URL params
            const body = document.body;
            const urlParams = new URLSearchParams(window.location.search);
            
            this.totalPages = parseInt(body.dataset.totalPages) || 1;
            this.page = parseInt(body.dataset.currentPage) || 1;
            this.mediaType = urlParams.get('media_type') || 'movie';
            this.category = urlParams.get('category') || 'popular';
            this.genre = urlParams.get('genre') || '';
            this.searchQuery = urlParams.get('query') || '';
            
            console.log('Initial state:', {
                totalPages: this.totalPages,
                currentPage: this.page,
                mediaType: this.mediaType,
                category: this.category,
                genre: this.genre,
                searchQuery: this.searchQuery
            });

            this.setupInfiniteScroll();
            // Force GPU acceleration for animations
            document.querySelector('.movie-list').style.transform = 'translate3d(0,0,0)';
            
            // Enable passive event listeners for better scroll performance
            this.updateDescriptions();
            
            // Initialize lazy loading for images
            this.setupLazyLoading();
        },

        /**
         * Sets up infinite scroll with enhanced debugging
         */
        setupInfiniteScroll() {
            // Add initial debug log
            console.log('🔄 Infinite scroll initialized with:', {
                initialPage: this.page,
                totalPages: this.totalPages
            });
            
            const handleScroll = throttle(() => {
                // Get scroll position values
                const scrollPosition = window.innerHeight + window.pageYOffset;
                const bottomThreshold = document.documentElement.scrollHeight - 100;
                
                // Debug every scroll event
                console.log('📜 Scroll detected:', {
                    scrollPosition,
                    bottomThreshold,
                    reachedBottom: scrollPosition >= bottomThreshold,
                    currentPage: this.page,
                    isLoading: this.isLoading
                });

                if (scrollPosition >= bottomThreshold) {
                    console.log('⚡ Bottom threshold reached!');
                    if (!this.isLoading && this.page < this.totalPages) {
                        console.log('🔄 Triggering loadMore()');
                        this.loadMore();
                    } else {
                        console.log('⏸️ Load skipped:', {
                            isLoading: this.isLoading,
                            currentPage: this.page,
                            totalPages: this.totalPages
                        });
                    }
                }
            }, 150); // Reduced throttle time for better responsiveness

            // Add scroll listener with passive option for better performance
            window.addEventListener('scroll', handleScroll, { passive: true });
            console.log('🎯 Scroll listener attached');

            // Store the handler for cleanup
            this._scrollHandler = handleScroll;
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
         * Initialize lazy loading for images
         * Uses IntersectionObserver for better performance
         */
        // Should include cleanup:
        setupLazyLoading() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.transform = 'translate3d(0, 0, 0)';
                        entry.target.style.opacity = '1';
                    }
                });
            }, { threshold: 0.1 });
            this.observedImages = new WeakSet();
            
            document.querySelectorAll('img').forEach(img => {
                this.observer.observe(img);
                this.observedImages.add(img);
            });
        },

        cleanup() {
            if (this.observer) {
                this.observedImages.forEach(img => {
                    this.observer.unobserve(img);
                });
                this.observer.disconnect();
            }
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

            window.location.href = `/shows/?${params.toString()}`;
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
                            `/shows/?query=${encodeURIComponent(this.searchQuery)}`,
                            { signal: controller.signal }
                        );
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        requestAnimationFrame(() => {
                            const movieList = this.$refs.movieList;
                            if (movieList && doc.querySelector('.movie-list')) {
                                // Get the new movie items
                                const newMovies = doc.querySelector('.movie-list').children;

                                // Append each new item to the existing list
                                Array.from(newMovies).forEach(movie => {
                                    movieList.appendChild(movie);
                                });
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

        /**
         * Enhanced loadMore with detailed logging
         */
        async loadMore() {
            const loadStartTime = performance.now();
            console.log('📥 loadMore started:', {
                currentPage: this.page,
                totalPages: this.totalPages,
                isLoading: this.isLoading,
                mediaType: this.mediaType,
                category: this.category
            });

            if (this.isLoading || this.page >= this.totalPages) {
                console.log('🚫 loadMore cancelled - already loading or at end');
                return;
            }

            this.isLoading = true;
            
            try {
                const nextPage = this.page + 1;
                const params = new URLSearchParams({
                    page: nextPage.toString(),
                    media_type: this.mediaType,
                    category: this.category
                });

                if (this.searchQuery) params.append('query', this.searchQuery);
                if (this.genre) params.append('genre', this.genre);

                const url = `/shows/?${params.toString()}`; // Added leading slash
                console.log('🌐 Fetching:', url);
                
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMovies = doc.querySelector('.movie-list');
                const movieList = this.$refs.movieList;

                if (newMovies && movieList) {
                    const newItemCount = newMovies.children.length;
                    console.log(`➕ Adding ${newItemCount} new items to the list`);
                    
                    // Append each new item to the existing list
                    Array.from(newMovies.children).forEach(movie => {
                        movieList.appendChild(movie);
                    });
                    this.page = nextPage;
                    this.setupLazyLoading();
                    
                    const loadTime = (performance.now() - loadStartTime).toFixed(2);
                    console.log(`✨ Page ${nextPage} loaded in ${loadTime}ms`);
                }
            } catch (error) {
                console.error('❌ Error in loadMore:', error);
                this.showNotification('Failed to load more content', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        showNotification(message, type = 'success') {
            window.dispatchEvent(new CustomEvent('show-notification', {
                detail: {
                    message,
                    type,
                    id: Date.now()
                }
            }));
        },

        isInWatchlist(mediaId) {
            return this.watchlistItems.includes(mediaId);
        },

        async addToWatchlist(item) {
            if (this.isAddingToWatchlist) return;
            this.isAddingToWatchlist = true;
        
            try {
                const token = document.querySelector('[name=csrfmiddlewaretoken]').value;
                // Add trailing slash to URL
                const response = await fetch('/api/watchlist/add/', {  // Changed from /add to /add/
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': token
                    },
                    body: JSON.stringify({
                        media_id: item.media_id,
                        media_type: item.media_type,
                        title: item.title,
                        poster_path: item.poster_path,
                        genres: item.genres || [],
                        creator: item.creator || 'Unknown',
                        year: item.year || '',
                        total_episodes: item.total_episodes || null,
                        status: 'plan_to_watch',
                        rating: 0,
                        progress: 0
                    })
                });
        
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
        
                if (result.status === 'success') {
                    this.watchlistItems.push(item.media_id);
                    this.showNotification(`Added "${item.title}" to watchlist`);
                }
            } catch (error) {
                console.error('Error adding to watchlist:', error);
                this.showNotification('Error adding to watchlist', 'error');
            } finally {
                this.isAddingToWatchlist = false;
            }
        },
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