import requests
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
import boto3
from django.core.paginator import Paginator
import os

def get_genre_id(genre_name):
    genre_mapping = {
        'action': 28,
        'comedy': 35,
        'drama': 18,
        'fantasy': 14,
        'horror': 27,
        'romance': 10749,
        'sci-fi': 878,
        'thriller': 53,
    }
    return genre_mapping.get(genre_name.lower(), '')

def main_page(request):
    return render(request, 'main_page.html')

def books(request):
    query = request.GET.get('query', '')
    page = request.GET.get('page', 1)
    limit = 20

    try:
        if query:
            # Search for books with specific fields to reduce payload
            url = "https://openlibrary.org/search.json"
            params = {
                'q': query,
                'page': page,
                'limit': limit,
                'fields': 'key,title,author_name,edition_key,availability'  # Reduced fields
            }
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raise error for bad responses
            data = response.json()
            
            books = [{
                'title': doc.get('title', 'Unknown Title'),
                'authors': doc.get('author_name', []),
                'olid': doc.get('edition_key', [''])[0] if doc.get('edition_key') else '',
                'key': doc.get('key', '')
            } for doc in data.get('docs', [])]

        else:
            # Get trending books with specific fields
            url = 'https://openlibrary.org/trending/now.json'
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            books = [{
                'title': work.get('title', 'Unknown Title'),
                'authors': [author.get('name', '') for author in work.get('authors', [])],
                'olid': work.get('availability', {}).get('openlibrary_edition', ''),
                'key': work.get('key', '')
            } for work in data.get('works', [])[:limit]]  # Limit results

    except requests.RequestException as e:
        print(f"Error fetching books: {e}")
        books = []

    return render(request, 'books.html', {
        'books': books,
        'query': query,
        'page': page
    })

def shows(request):
    query = request.GET.get('query', '')
    category = request.GET.get('category', 'popular')
    genre = request.GET.get('genre', '')
    page = request.GET.get('page', 1)

    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    if query:
        url = "https://api.themoviedb.org/3/search/movie"
        params = {'language': 'en-US', 'query': query, 'page': page}
        description = f'Results for "{query}"'
    elif genre:
        genre_id = get_genre_id(genre)  # Ensure this function is defined elsewhere in your code
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {'language': 'en-US', 'with_genres': genre_id, 'page': page}
        description = f'Shows in the "{genre.capitalize()}" genre'
    else:
        if category == 'top_rated':
            url = "https://api.themoviedb.org/3/movie/top_rated"
            description = "Top Rated Shows"
        else:  # Default to 'popular'
            url = "https://api.themoviedb.org/3/movie/popular"
            description = "Popular Shows"
        params = {'language': 'en-US', 'page': page}

    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    total_pages = data.get('total_pages', 1)
    if total_pages > 500:  # TMDB limits to 500 pages
        total_pages = 500

    context = {
        'movies': data.get('results', []),
        'query': query,
        'category': category,
        'description': description,
        'current_page': int(page),
        'total_pages': total_pages,
        'has_next': int(page) < total_pages,
        'has_previous': int(page) > 1,
        'previous_page': int(page) - 1,
        'next_page': int(page) + 1,
    }
    return render(request, 'shows.html', context)

def movie_detail(request, movie_id):
    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # Get movie details
    movie_url = f"https://api.themoviedb.org/3/movie/{movie_id}?language=en-US&append_to_response=credits,videos,similar"
    response = requests.get(movie_url, headers=headers)
    
    if response.status_code == 200:
        movie = response.json()
        
        # Process credits data
        credits = movie.get('credits', {})
        
        # Get director
        directors = [crew for crew in credits.get('crew', []) if crew['job'] == 'Director']
        
        # Get main cast (limit to top 6)
        cast = credits.get('cast', [])[:6]
        
        # Format genres
        genres = [genre['name'] for genre in movie.get('genres', [])]
        
        context = {
            'movie': movie,
            'directors': directors,
            'cast': cast,
            'genres': genres,
            'similar_movies': movie.get('similar', {}).get('results', [])[:4]
        }
    else:
        context = {}
        messages.error(request, 'Failed to retrieve movie details.')
    
    return render(request, 'infopage.html', context)

def account(request):
    return render(request, 'account')

def create_account(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        client = boto3.client('cognito-idp', region_name=settings.AWS_COGNITO_REGION)
        try:
            client.sign_up(
                ClientId=settings.AWS_COGNITO_APP_CLIENT_ID,
                Username=email,
                Password=password,
            )
            messages.success(request, 'Account created successfully. Please verify your email.')
            return redirect('login')
        except client.exceptions.UsernameExistsException:
            messages.error(request, 'Email already exists.')
    return render(request, 'create_account.html')

def login_view(request):
    if request.method == 'POST':
        # Process login form data
        email = request.POST['email']
        password = request.POST['password']
        # Add authentication logic here
        return redirect('main_page')
    return render(request, 'login.html')

def animanga(request):
    query = request.GET.get('query', '')
    page = request.GET.get('page', 1)
    format_type = request.GET.get('format', '')
    sort_by = request.GET.get('sort', 'POPULARITY_DESC')
    
    query_string = '''
    query ($page: Int, $perPage: Int, $search: String, $type: MediaType, $format: MediaFormat, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
            pageInfo {
                total
                currentPage
                lastPage
                hasNextPage
            }
            media(type: ANIME, search: $search, format: $format, sort: $sort) {
                id
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                }
                description(asHtml: true)
                genres
                averageScore
                episodes
                format
                status
                startDate {
                    year
                }
            }
        }
    }
    '''
    
    variables = {
        'search': query,
        'page': int(page),
        'perPage': 20,
        'type': 'ANIME',
        'format': format_type if format_type else None,
        'sort': [sort_by]
    }

    try:
        response = requests.post(
            'https://graphql.anilist.co',
            json={
                'query': query_string,
                'variables': variables
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        )
        response.raise_for_status()
        data = response.json()

        if 'errors' in data:
            print("API Errors:", data['errors'])
            return render(request, 'animanga.html', {
                'error': data['errors'][0]['message'],
                'anime_list': [],
                'page_info': {},
                'filters': get_anime_filters()  # Add filter options even when there's an error
            })

        anime_data = data.get('data', {}).get('Page', {})
        
        context = {
            'anime_list': anime_data.get('media', []),
            'page_info': anime_data.get('pageInfo', {}),
            'query': query,
            'format': format_type,
            'sort': sort_by,
            'filters': get_anime_filters()
        }
        return render(request, 'animanga.html', context)
        
    except requests.RequestException as e:
        print(f"Request error: {e}")
        return render(request, 'animanga.html', {
            'error': f"Failed to fetch anime: {str(e)}",
            'anime_list': [],
            'page_info': {},
            'filters': get_anime_filters()
        })

def get_anime_filters():
    return {
        'formats': ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'],
        'sorts': [
            ('POPULARITY_DESC', 'Popular'),
            ('SCORE_DESC', 'Highest Rated'),
            ('TRENDING_DESC', 'Trending'),
            ('START_DATE_DESC', 'Newest')
        ]
    }

def animanga_view(request):
    # ...existing code...
    return render(request, 'animanga.html')