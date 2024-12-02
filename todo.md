- Make account page
- Add login for users
- Add genre and ratings to watchlist items by fetching detailed information when adding to the watchlist. This will prevent shows.html from slowing down due to multiple lookups.
- Update book page functionality
- Add Watchlist to account page
- Add progress tracking functionality to watchlist items
- Implement sorting and filtering in watchlist view
- Add notification system for watchlist actions
- Implement share functionality for watchlist items
- Add review/notes system for watchlist items
- Create mobile-responsive layouts for all pages
- Implement search functionality in watchlist
- Add batch actions for watchlist items
- Create user settings page
- Fix speed and loading issues with shows.html
- Ensure uniform styling across the site
- Split style.css into more page-specific CSS files
- Use CSS for animations instead of JavaScript for all pages except the main loading page to improve website speed
- Standardize component structure

### State Management
- Create a centralized state management system
- Consolidate watchlist logic into a single service
- Implement proper error boundaries and loading states

### API Optimization
- Batch API requests where possible
- Implement proper caching for API responses
- Add rate limiting and request throttling consistently

### Database Optimization
- Add proper indexing to WatchlistItem model
- Implement database caching
- Optimize database queries to reduce N+1 problems

### Code Organization
- Move duplicate code into shared utilities
- Create reusable components for common UI elements
- Standardize error handling and notifications

### Memory Management
- Fix memory leaks from event listeners not being cleaned up
- Implement proper garbage collection for removed elements
- Use WeakMap/WeakSet for DOM references

- Fix watchlist performance issues, possibly with data streaming (e.g., load poster and name first, then stream additional information with a loading bar)
- Add a way to view the highest-rated anime movies or movies by a director or actor
- Add a way to order the watchlist using a priority system
- Add functionality to import a document of movies to watch and add them to the site
