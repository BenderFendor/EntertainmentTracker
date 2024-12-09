function watchlistApp() {
    return {
        currentTab: 'watching',
        items: [],
        sortBy: 'title',
        searchQuery: '', // Add this
        filterOption: 'all', // Add this
        
        init() {
            this.loadWatchlist();
        },
        
        // Add these new methods
        searchWatchlist() {
            // The filtering is handled automatically by the filteredItems getter
            console.log('Searching:', this.searchQuery);
        },

        filterWatchlist() {
            // The filtering is handled automatically by the filteredItems getter
            console.log('Filtering by:', this.filterOption);
        },

        // Update filteredItems getter to include search and filter
        get filteredItems() {
            return this.items
                .filter(item => {
                    // First filter by status
                    const statusMatch = item.status === this.currentTab;
                    
                    // Then filter by search query
                    const searchMatch = !this.searchQuery || 
                        item.title.toLowerCase().includes(this.searchQuery.toLowerCase());
                    
                    // Then filter by media type
                    const typeMatch = this.filterOption === 'all' || 
                        (this.filterOption === 'anime' && item.media_type === 'anime') ||
                        (this.filterOption === 'movies' && item.media_type === 'movie') ||
                        (this.filterOption === 'shows' && item.media_type === 'tv');
                    
                    return statusMatch && searchMatch && typeMatch;
                })
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
                    total_episodes: item.total_episodes || '?',
                    originalStatus: item.status // Add this line
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

        normalizeRating(item, rating) {
            // Convert ratings to consistent internal format
            return item.media_type === 'anime' ? rating : rating * 10;
        },

        denormalizeRating(item, rating) {
            // Convert internal rating to display format
            return item.media_type === 'anime' ? rating : rating / 10;
        },

        async updateRating(item, rating) {
            const normalizedRating = this.normalizeRating(item, rating);
            
            try {
                const response = await fetch('/api/watchlist/update/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        id: item.id,
                        rating: normalizedRating
                    })
                });

                if (!response.ok) throw new Error('Failed to update rating');
                
                // Update local state
                item.rating = normalizedRating;
                this.showNotification('Rating updated');
            } catch (error) {
                this.showNotification('Failed to update rating', 'error');
            }
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
        },

        updateProgress(itemId, progress) {
            // Implement API call to update progress
            fetch(`/api/watchlist/update_progress/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({ item_id: itemId, progress: progress })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update progress in UI
                    this.watchlistItems.forEach(item => {
                        if (item.id === itemId) {
                            item.progress = progress;
                        }
                    });
                    this.showNotification('Progress updated successfully', 'success');
                } else {
                    this.showNotification('Error updating progress', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating progress:', error);
                this.showNotification('Error updating progress', 'error');
            });
        },

        getCreatorText(item) {
            return item.creator || 'Unknown';
        },

        async changeStatus(item) {
            if (item.status === item.originalStatus) return;
            
            try {
                const response = await fetch('/api/watchlist/update_status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        id: item.id,
                        status: item.status
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                // Update was successful
                item.originalStatus = item.status;
                this.currentTab = item.status;
                this.showNotification(`Moved "${item.title}" to ${item.status.replace('_', ' ')}`);
                
            } catch (error) {
                console.error('Error changing status:', error);
                // Revert the status change
                item.status = item.originalStatus;
                this.showNotification('Error updating status', 'error');
            }
        },

        getCreatorDisplay(item) {
            if (item.media_type === 'anime') {
                return { label: 'Creator', value: item.creator || 'Unknown' };
            }
            return { label: 'Director', value: item.director || 'Unknown' };
        },

        handleStatusChange(item) {
            // Don't automatically update, wait for button click
            console.log('Status changed to:', item.status);
        },

        async handleStatusChange(item, newStatus) {
            // Don't do anything if status hasn't changed
            if (newStatus === item.originalStatus) return;
            
            // Update local state optimistically
            const oldStatus = item.status;
            item.status = newStatus;

            try {
                const response = await fetch('/api/watchlist/update_status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        id: item.id,
                        status: newStatus
                    })
                });

                if (!response.ok) throw new Error('Failed to update status');

                // Update was successful
                item.originalStatus = newStatus;
                
                // Switch tabs if we're on the old status tab
                if (this.currentTab === oldStatus) {
                    this.currentTab = newStatus;
                }

                this.showNotification(`Moved "${item.title}" to ${newStatus.replace('_', ' ')}`);
            } catch (error) {
                // Revert on failure
                item.status = oldStatus;
                this.showNotification('Failed to update status', 'error');
            }
        },

        async updateItemStatus(item) {
            const oldStatus = item.originalStatus;
            const newStatus = item.status;

            try {
                const response = await fetch('/api/watchlist/update_status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        id: item.id,
                        status: newStatus
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                // Update was successful
                item.originalStatus = newStatus;
                
                // Switch to new tab if item was in current view
                if (this.currentTab === oldStatus) {
                    this.currentTab = newStatus;
                }
                
                this.showNotification(`Moved "${item.title}" to ${newStatus.replace('_', ' ')}`);
            } catch (error) {
                console.error('Error updating status:', error);
                // Revert the status change
                item.status = oldStatus;
                this.showNotification('Error updating status', 'error');
            }
        }
    };
}