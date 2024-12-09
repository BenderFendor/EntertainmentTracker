// anime.js
function animeApp() {
    return {
        searchQuery: '',
        isSearching: false,
        isSearchOpen: false,
        isLoading: false,
        mediaType: 'ANIME', // or 'MANGA'
        currentPage: 1,
        hasNextPage: true,
        description: 'Trending Anime',
        subDescription: 'Discover the most popular anime this season',
        isAddingToWatchlist: false,
        categories: ['TRENDING', 'POPULAR', 'TOP_RATED'],
        genres: [
            'Action',
            'Adventure',
            'Comedy',
            'Drama',
            'Fantasy',
            'Horror',
            'Mecha',
            'Mystery',
            'Psychological',
            'Romance',
            'Sci-Fi',
            'Slice of Life',
            'Sports',
            'Supernatural',
            'Thriller'
        ],
        watchlist: [],
        isLoadingMore: false,

        init() {
            this.loadWatchlist();
            this.setupInfiniteScroll();
            this.updateDescriptionFromUrl();
        },

        async loadWatchlist() {
            try {
                const response = await fetch('/api/watchlist/');
                if (response.ok) {
                    const data = await response.json();
                    this.watchlist = data.items || [];
                }
            } catch (error) {
                console.error('Error loading watchlist:', error);
            }
        },

        isInWatchlist(mediaId) {
            return this.watchlist.some(item => item.media_id === mediaId);
        },

        setupInfiniteScroll() {
            let lastScrollPosition = 0;
            let scrollTimeout;

            const scrollHandler = () => {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                scrollTimeout = setTimeout(() => {
                    const currentScroll = window.scrollY;
                    const windowHeight = window.innerHeight;
                    const documentHeight = document.documentElement.scrollHeight;
                    const scrolledToBottom = (windowHeight + currentScroll) >= (documentHeight - 100);

                    if (scrolledToBottom && !this.isLoadingMore && this.hasNextPage) {
                        this.isLoadingMore = true;
                        this.showLoadingIndicator(); // Show loading state
                        this.loadMore().finally(() => {
                            this.isLoadingMore = false;
                            this.hideLoadingIndicator(); // Hide loading state
                        });
                    }
                    lastScrollPosition = currentScroll;
                }, 200); // Debounce time
            };

            window.addEventListener('scroll', scrollHandler, { passive: true });

            // Cleanup event listener on component unmount
            this.$cleanup = () => {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                window.removeEventListener('scroll', scrollHandler);
            };
        },

        showLoadingIndicator() {
            // Implement loading indicator logic
            this.isLoading = true;
        },

        hideLoadingIndicator() {
            // Implement loading indicator logic
            this.isLoading = false;
        },

        updateDescriptionFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const genre = urlParams.get('genre');
            
            if (genre) {
                this.description = `${genre} Anime`;
                this.subDescription = `Browse ${genre.toLowerCase()} anime`;
            } else if (category) {
                switch (category.toUpperCase()) {
                    case 'POPULAR':
                        this.description = 'Popular Anime';
                        this.subDescription = 'Most popular anime of all time';
                        break;
                    case 'TOP_RATED':
                        this.description = 'Top Rated Anime';
                        this.subDescription = 'Highest rated anime series';
                        break;
                    default:
                        this.description = 'Trending Anime';
                        this.subDescription = 'Discover the most popular anime this season';
                }
            }
        },

        async searchAnime() {
            if (this.searchQuery.length < 3) return;
            
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(async () => {
                this.isSearching = true;
                const params = new URLSearchParams({
                    query: this.searchQuery,
                    type: this.mediaType
                });

                try {
                    const response = await fetch(`/api/anime/search/?${params}`);
                    if (response.ok) {
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        this.$refs.animeList.innerHTML = doc.querySelector('.anime-list').innerHTML;
                        
                        this.description = `Search Results for "${this.searchQuery}"`;
                        this.subDescription = 'Found anime matching your search';
                        this.currentPage = 1;
                        this.hasNextPage = doc.querySelector('[data-has-next]')?.dataset.hasNext === 'true';
                    }
                } catch (error) {
                    console.error('Error searching anime:', error);
                    this.showNotification('Error searching anime', 'error');
                } finally {
                    this.isSearching = false;
                }
            }, 300);
        },

        async loadMore() {
            if (this.isLoading) return;
            
            this.isLoading = true;
            const nextPage = this.currentPage + 1;
            
            try {
                const params = new URLSearchParams(window.location.search);
                params.set('page', nextPage);
                const response = await fetch(`?${params}`);
                
                if (!response.ok) throw new Error('Failed to fetch more items');
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newContent = doc.querySelector('.anime-list').innerHTML;
                
                // Only update if we got new content
                if (newContent.trim()) {
                    this.$refs.animeList.insertAdjacentHTML('beforeend', newContent);
                    this.currentPage = nextPage;
                    this.hasNextPage = doc.querySelector('[data-has-next]')?.dataset.hasNext === 'true';
                } else {
                    this.hasNextPage = false;
                }
            } catch (error) {
                console.error('Error loading more anime:', error);
                this.showNotification('Error loading more content', 'error');
                this.hasNextPage = false;
            } finally {
                this.isLoading = false;
            }
        },

        async switchMediaType(type) {
            this.mediaType = type;
            const params = new URLSearchParams({ type });
            
            try {
                const response = await fetch(`/api/anime/?${params}`);
                if (response.ok) {
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    this.$refs.animeList.innerHTML = doc.querySelector('.anime-list').innerHTML;
                    
                    this.description = `${type === 'ANIME' ? 'Trending Anime' : 'Popular Manga'}`;
                    this.subDescription = `Discover the most popular ${type.toLowerCase()}`;
                    this.currentPage = 1;
                    this.hasNextPage = doc.querySelector('[data-has-next]')?.dataset.hasNext === 'true';
                }
            } catch (error) {
                console.error('Error switching media type:', error);
                this.showNotification('Error switching media type', 'error');
            }
        },

        async navigateToCategory(category) {
            window.location.href = `/anime/?category=${category.toLowerCase()}`;
        },

        async navigateToGenre(genre) {
            window.location.href = `/anime/?genre=${genre.toLowerCase()}`;
        },

        async addToWatchlist(item) {
            if (this.isAddingToWatchlist) return;
            
            this.isAddingToWatchlist = true;
            const button = event.currentTarget;
            button.classList.add('adding');
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            try {
                const response = await fetch('/api/watchlist/add/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(item)
                });

                if (response.ok) {
                    this.watchlist.push(item);
                    button.classList.add('in-watchlist');
                    this.showNotification('Added to watchlist successfully', 'success');
                } else {
                    throw new Error('Failed to add to watchlist');
                }
            } catch (error) {
                console.error('Error adding to watchlist:', error);
                this.showNotification('Error adding to watchlist', 'error');
            } finally {
                this.isAddingToWatchlist = false;
                button.classList.remove('adding');
            }
        },

        showNotification(message, type = 'success') {
            const id = Date.now();
            window.dispatchEvent(new CustomEvent('show-notification', {
                detail: {
                    message,
                    type,
                    id
                }
            const tooltip = event.target.querySelector('.tooltip');
            }));
            return id;
        }
    };
}
            if (tooltip) {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            }
        },

        hideTooltip(event) {
            const tooltip = event.target.querySelector('.tooltip');
            if (tooltip) {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }
        }
    };
}