function watchlistApp() {
    return {
        currentTab: 'watching',
        items: [],
        sortBy: 'title',
        
        init() {
            this.loadWatchlist();
        },
        
        get filteredItems() {
            // Add default values and handle undefined properties
            return this.items
                .filter(item => item.status === this.currentTab)
                .map(item => ({
                    ...item,
                    genres: item.genres || [],
                    rating: item.rating || 0,
                    progress: item.progress || 0,
                    creator: item.creator || 'Unknown',
                    year: item.year || '',
                    total_episodes: item.total_episodes || '?'
                }));
        },
        
        async loadWatchlist() {
            console.log('Loading watchlist...');
            try {
                const response = await fetch('/api/watchlist/');  // Add trailing slash
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                // Ensure each item has required properties
                this.items = data.map(item => ({
                    ...item,
                    genres: item.genres || [],
                    rating: item.rating || 0,
                    progress: item.progress || 0,
                    creator: item.creator || 'Unknown',
                    year: item.year || '',
                    total_episodes: item.total_episodes || '?'
                }));
                console.log('Watchlist loaded:', this.items);
            } catch (error) {
                console.error('Error loading watchlist:', error);
                this.items = [];
            }
        },
        
        async updateStatus(item) {
            console.log('Updating status:', item);
            try {
                const response = await fetch('/api/watchlist/update/', {  // Add trailing slash
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify(item)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                console.log('Update result:', result);
            } catch (error) {
                console.error('Error updating status:', error);
            }
        },

        async addToWatchlist(item) {
            console.log('Adding to watchlist:', item);
            try {
                const token = document.querySelector('[name=csrfmiddlewaretoken]').value;
                console.log('CSRF Token:', token);
                
                const response = await fetch('/api/watchlist/add/', {  // Add trailing slash
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': token
                    },
                    body: JSON.stringify(item)
                });
                
                console.log('Response status:', response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const result = await response.json();
                console.log('Add result:', result);

                if (result.status === 'success') {
                    await this.loadWatchlist();
                    this.showNotification(`Added "${item.title}" to watchlist`);
                }
            } catch (error) {
                console.error('Error adding to watchlist:', error);
                this.showNotification('Error adding to watchlist', 'error');
            }
        },

        async updateRating(item, rating) {
            if (!item) return;
            item.rating = rating;
            await this.updateItem(item);
        },

        async updateNotes(item) {
            await this.updateItem(item);
        },

        async deleteItem(item) {
            if (!item?.id) {
                this.showNotification('Invalid item to delete', 'error');
                return;
            }
        
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            try {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }
        
                const response = await fetch(`/api/watchlist/delete/${item.id}/`, {  // Ensure trailing slash
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || `Server error: ${response.status}`);
                }
                
                // Remove item from local state only after successful deletion
                this.items = this.items.filter(i => i.id !== item.id);
                this.showNotification(data.message || 'Item successfully deleted');
                
            } catch (error) {
                console.error('Error deleting item:', error);
                this.showNotification(`Error deleting item: ${error.message}`, 'error');
                throw error;
            }
        },

        async updateItem(item) {
            try {
                const response = await fetch('/api/watchlist/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify(item)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                console.error('Error updating item:', error);
                this.showNotification('Error updating item', 'error');
            }
        },

        sortItems() {
            this.items.sort((a, b) => {
                switch(this.sortBy) {
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'rating':
                        return (b.rating || 0) - (a.rating || 0);
                    case 'dateAdded':
                        return new Date(b.dateAdded) - new Date(a.dateAdded);
                    default:
                        return 0;
                }
            });
        },

        shareItem(item) {
            if (!item) return;
            // Implement share functionality
            console.log('Sharing item:', item);
        },

        showInfo(item) {
            if (!item) return;
            
            switch (item.media_type) {
                case 'movie':
                case 'tv':
                    window.location.href = `/media/${item.media_type}/${item.media_id}`;
                    break;
                case 'anime':
                case 'manga':
                    // TODO: Implement anime/manga detail view
                    console.log('Anime/Manga detail view not yet implemented');
                    break;
                case 'book':
                    // TODO: Implement book detail view
                    console.log('Book detail view not yet implemented');
                    break;
                default:
                    console.warn('Unknown media type:', item.media_type);
            }
        },

        getItemDetailUrl(item) {
            if (!item) return '#';
            
            switch (item.media_type) {
                case 'movie':
                case 'tv':
                    return `/media/${item.media_type}/${item.media_id}`;
                case 'anime':
                case 'manga':
                    return `/animanga/${item.media_id}`;
                case 'book':
                    return `/books/${item.media_id}`;
                default:
                    return '#';
            }
        },

        showNotification(message, type = 'success') {
            console.log('Showing notification:', message, type);
            window.dispatchEvent(new CustomEvent('show-notification', {
                detail: {
                    message,
                    id: Date.now(),
                    type
                }
            }));
        }
    };
}