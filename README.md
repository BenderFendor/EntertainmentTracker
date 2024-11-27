# EntertainmentTracker

## Installation and Setup Guide

### Prerequisites
- Python 3.6 or higher
- pip (Python package installer)
- Git
- API Keys for:
  - TMDB (The Movie Database)
  - Google Books
  - AWS Cognito (for user authentication)

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/EntertainmentTracker.git
    cd EntertainmentTracker
    ```

2. **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3. **Activate the virtual environment:**
    - On Windows:
      ```bash
      .\venv\Scripts\activate
      ```
    - On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```

4. **Install the required packages:**
    ```bash
    pip install -r requirements.txt
    ```

### Setup

1. **Create a `.env` file in the root directory with the following environment variables:**
    ```
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    TMDB_API_KEY=your_tmdb_api_key
    GOOGLE_BOOKS_API_KEY=your_google_books_api_key
    AWS_COGNITO_USER_POOL_ID=your_cognito_user_pool_id
    AWS_COGNITO_APP_CLIENT_ID=your_cognito_app_client_id
    AWS_COGNITO_REGION=your_cognito_region
    ```

2. **Add the application to INSTALLED_APPS:**
   Make sure 'enterainmentdjango' is in your INSTALLED_APPS in settings.py

3. **Apply database migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

### Running the Application

1. **Start the development server:**
    ```bash
    python manage.py runserver
    ```

2. **Access the application at:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

### Features
- Movies and TV shows tracking with TMDB integration
- Anime/Manga tracking with AniList integration
- Books tracking with Google Books integration
- Personal watchlist management
- Status tracking (watching, plan to watch, completed)
- Rating system
- Progress tracking for series