function watchlistApp() {
    return {
        currentTab: 'watching',
        items: [],
        sortBy: 'title',
        
        init() {
            this.loadWatchlist();
        },
        
        get filteredItems() {
            return this.items.filter(item => item.status === this.currentTab);
        },
        
        async loadWatchlist() {
            console.log('Loading watchlist...');
            try {
                const response = await fetch('/api/watchlist');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                this.items = await response.json();
                console.log('Watchlist loaded:', this.items);
            } catch (error) {
                console.error('Error loading watchlist:', error);
            }
        },
        
        async updateStatus(item) {
            console.log('Updating status:', item);
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
                
                const response = await fetch('/api/watchlist/add', {
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
            item.rating = rating;
            await this.updateItem(item);
        },

        async updateNotes(item) {
            await this.updateItem(item);
        },

        async deleteItem(item) {
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            try {
                const response = await fetch(`/api/watchlist/delete/${item.id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                this.items = this.items.filter(i => i.id !== item.id);
                this.showNotification(`Removed "${item.title}" from watchlist`);
            } catch (error) {
                console.error('Error deleting item:', error);
                this.showNotification('Error deleting item', 'error');
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