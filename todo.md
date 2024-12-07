# Entertainment Tracker Project TODO

## Authentication & User Management (Priority)
- Implement AWS Cognito Integration:
  - Set up AWS Cognito User Pool and configure settings
  - Install required dependencies (boto3, aws-amplify-sdk)
  - Create basic authentication flows (signup, login, password reset)
  - Implement token management and session handling
  - Add social login options
  - Create middleware for Cognito token validation
- Develop Account Page Features:
  - User profile information display
  - Account settings management
  - Password change functionality
  - Email preferences
  - Connected social accounts management

## Watchlist Enhancement
### Core Functionality
- Add detailed information to watchlist items:
  - Include genre and ratings
  - Store only IDs during initial add
  - Implement lazy loading for detailed information
- Implement progress tracking for watchlist items
- Add review and notes system
- Create batch actions functionality
- Implement share functionality

### UI/UX Improvements
- Implement sorting and filtering
- Add search functionality
- Create notification system for watchlist actions
- Optimize watchlist loading:
  - Implement data streaming approach
  - Show posters and names first
  - Add loading indicators
  - Stream additional information progressively
- Add watchlist display to account page

## Performance Optimization
### Frontend
- Fix speed issues in shows.html:
  - Implement lazy loading
  - Use virtual scrolling for long lists
  - Optimize image loading
  - Fix Loading For Pagination RN doesn't work.
- Replace JavaScript animations with CSS animations
- Implement proper loading states
- Add error boundaries | What does that even mean?

### Backend
- Database Optimization:
  - Add proper indexing to WatchlistItem model
  - Implement database caching
  - Optimize queries to reduce N+1 problems
- API Optimization:
  - Implement request batching
  - Add response caching
  - Implement rate limiting
  - Add request throttling

## Code Structure & Organization
### State Management
- Create centralized state management system
- Consolidate watchlist logic into single service
- Implement proper error handling

### Code Quality
- Move duplicate code into shared utilities
- Create reusable components
- Standardize error handling and notifications
- Fix memory leaks:
  - Clean up event listeners
  - Implement proper garbage collection
  - Use WeakMap/WeakSet for DOM references

### Styling
- Create uniform styling across pages
- Split style.css into page-specific files
- Standardize component structure
- Ensure mobile-responsive layouts

## Feature Additions
- Update book page functionality
- Add filtering for highest-rated anime/movies
- Add director/actor-based filtering
- Implement advanced search features

## Testing & Documentation
- Add unit tests for core functionality
- Create integration tests for API endpoints
- Document AWS Cognito integration
- Create user documentation for new features