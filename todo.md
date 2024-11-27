- Make account page
- Add login for users
- Make it so that the watchlist items have the genre and the ratings. I would do this by getting the more detailed information in each watchlist and just when adding to a watchlist give the id. That way the make shows.html doesn't have to look up a lot of information and slow the page down.
- Update book page to work
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
- Fix speed and loading with shows.html
- Have a more uniform styling
- Split up the style.css into more page specific .CSS files
- For everything but the main loading page use CSS for animation instead of java script to speed up website.
-Standardize component structure

State Management:
Create a centralized state management system instead of scattered state across components
Move watchlist logic from multiple files into a single service
Implement proper error boundaries and loading states

API Optimization:
Batch API requests where possible
Implement proper caching for API responses
Add rate limiting and request throttling consistently
Database Optimization:

Database Optimization:
Add proper indexing to WatchlistItem model
Implement database caching
Optimize database queries to reduce N+1 problems

Code Organization:
Move duplicate code into shared utilities
Create reusable components for common UI elements
Standardize error handling and notifications

Memory Management:
Fix memory leaks from event listeners not being cleaned up
Implement proper garbage collection for removed elements
Use WeakMap/WeakSet for DOM references


- Fix watchlist to be not as slow maybe with data streaming so like the poster and name first then having a loading bar or stream for information that takes a second and having a loading for the loading watchlist and not having it just be blank