# EntertainmentTracker

## Installation and Setup Guide

### Prerequisites
- Python 3.6 or higher
- pip (Python package installer)
- Git

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

1. **Create a `.env` file in the root directory and add the following environment variables:**
    ```
    SECRET_KEY=your_secret_key
    DEBUG=True
    DATABASE_URL=your_database_url
    ```

2. **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```

### Running the Application

1. **Start the development server:**
    ```bash
    python manage.py runserver
    ```

2. **Access the application at:** [http://127.0.0.1:8000](http://127.0.0.1:8000)