import requests
import json
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
import boto3
from django.core.paginator import Paginator
import os
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.views.decorators.http import require_http_methods
from .models import WatchlistItem
import logging

logger = logging.getLogger(__name__)

# TODO: Add proper user authentication system
# For now, using a dummy user ID for development

def iteminfo(item):
    if item['media_type'] == 'movie' or item['media_type'] == 'tv':
        # Get info from TMDB API
        api_key = settings.TMDB_API_KEY
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        url = f"https://api.themoviedb.org/3/{item['media_type']}/{item['media_id']}"
        try:
            response = requests.get(url, headers=headers)
            data = response.json()
            
            # For movies, fetch director from crew
            director = 'Unknown'
            if item['media_type'] == 'movie':
                # Get credits
                credits_url = f"https://api.themoviedb.org/3/movie/{item['media_id']}/credits"
                credits_response = requests.get(credits_url, headers=headers)
                credits_data = credits_response.json()
                # Find director in crew
                directors = [crew['name'] for crew in credits_data.get('crew', []) if crew['job'] == 'Director']
                director = directors[0] if directors else 'Unknown'
            
            return {
                'genres': [genre['name'] for genre in data.get('genres', [])],
                'creator': director if item['media_type'] == 'movie' else data.get('created_by', [{'name': 'Unknown'}])[0]['name'],
                'year': data.get('release_date', '')[:4] if item['media_type'] == 'movie' else data.get('first_air_date', '')[:4],
                'rating': data.get('vote_average', 0),
                'total_episodes': data.get('number_of_episodes') if item['media_type'] == 'tv' else None
            }
        except Exception as e:
            logger.error(f"Error fetching TMDB data: {str(e)}")
            return {}
            
    elif item['media_type'] == 'anime' or item['media_type'] == 'manga':
        # TODO: Implement Anilist API integration
        # Use GraphQL query to fetch anime/manga details
        return {}
        
    elif item['media_type'] == 'book':
        # TODO: Implement Google Books API integration
        # Use item['media_id'] to fetch book details
        return {}
        
    return {}

def watchlist(request):
    items = WatchlistItem.objects.filter(user='dummy_user')
    return render(request, 'watchlist.html', {'items': items})

@require_http_methods(['GET'])
def get_watchlist(request):
    try:
        items = list(WatchlistItem.objects.filter(user='dummy_user').values())
        # Process each item to include additional info
        for item in items:
            if item['media_type'] in ['movie', 'tv']:
                info = iteminfo(item)
                item.update({
                    'genres': info.get('genres', []),
                    'creator': info.get('creator', 'Unknown'),
                    'year': info.get('year', ''),
                    'rating': info.get('rating', 0),
                    'total_episodes': info.get('total_episodes')
                })
        return JsonResponse(items, safe=False)
    except Exception as e:
        logger.error(f"Error in get_watchlist: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(['POST'])
def update_watchlist(request):
    data = json.loads(request.body)
    try:
        item = WatchlistItem.objects.get(id=data['id'], user='dummy_user')
        item.status = data['status']
        item.progress = data['progress']
        item.save()
        return JsonResponse({'status': 'success'})
    except WatchlistItem.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Item not found.'}, status=404)

@require_http_methods(['DELETE'])
def delete_from_watchlist(request, item_id):
    logger.debug(f'Attempting to delete item {item_id} from watchlist')
    try:
        item = WatchlistItem.objects.get(id=item_id, user='dummy_user')
        title = item.title
        item.delete()
        logger.debug(f'Successfully deleted item {item_id} ({title}) from watchlist')
        return JsonResponse({'status': 'success', 'message': f'Successfully deleted {title}'})
    except WatchlistItem.DoesNotExist:
        logger.error(f'Item {item_id} not found in watchlist')
        return JsonResponse({'status': 'error', 'message': 'Item not found'}, status=404)
    except Exception as e:
        logger.error(f'Error deleting item {item_id}: {str(e)}', exc_info=True)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(['POST'])
def add_to_watchlist(request):
    logger.debug('Adding to watchlist for dummy user')
    try:
        data = json.loads(request.body)
        logger.debug('Received data: %s', data)
        
        # Extract genres from the incoming data or fetch from API
        genres = data.get('genres', [])
        creator = data.get('creator', 'Unknown')
        year = data.get('year', '')
        
        item, created = WatchlistItem.objects.get_or_create(
            user='dummy_user',
            media_id=data['media_id'],
            defaults={
                'media_type': data['media_type'],
                'title': data['title'],
                'poster_path': data['poster_path'],
                'status': 'plan_to_watch',
                'progress': 0,
                'total_episodes': data.get('total_episodes'),
                'genres': genres,  # Store genres if your model supports it
                'creator': creator,
                'year': year,
                'rating': 0
            }
        )
        logger.debug('Item %s: %s', 'created' if created else 'updated', item.id)
        return JsonResponse({'status': 'success', 'item_id': item.id})
    except Exception as e:
        logger.error('Error adding to watchlist: %s', str(e), exc_info=True)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

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
    query = request.GET.get('q', '')
    page = int(request.GET.get('page', 1))
    max_results = 20
    start_index = (page - 1) * max_results

    try:
        # Base URL for Google Books API
        base_url = "https://www.googleapis.com/books/v1/volumes"
        
        if (query):
            # Search query
            search_query = query
        else:
            # Default query for trending/popular books
            search_query = 'subject:fiction'
            
        # Parameters for the API request
        params = {
            'q': search_query,
            'startIndex': start_index,
            'maxResults': max_results,
            'key': settings.GOOGLE_BOOKS_API_KEY,
            'orderBy': 'relevance',
            'printType': 'books',
            'langRestrict': 'en'
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        books = []
        for item in data.get('items', []):
            volume_info = item.get('volumeInfo', {})
            books.append({
                'id': item.get('id'),
                'title': volume_info.get('title', 'Unknown Title'),
                'authors': volume_info.get('authors', []),
                'description': volume_info.get('description', ''),
                'thumbnail': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                'info_link': volume_info.get('infoLink', ''),
                'published_date': volume_info.get('publishedDate', ''),
                'categories': volume_info.get('categories', []),
                'average_rating': volume_info.get('averageRating', 0),
                'ratings_count': volume_info.get('ratingsCount', 0)
            })

        total_items = data.get('totalItems', 0)
        total_pages = (total_items + max_results - 1) // max_results

        context = {
            'books': books,
            'query': query,
            'current_page': page,
            'total_pages': min(total_pages, 100),  # Google Books API limit
            'has_next': page * max_results < min(total_items, 2000),  # API limit of 2000 items
            'has_previous': page > 1
        }

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(context)
        return render(request, 'books.html', context)

    except requests.RequestException as e:
        error_message = f"Error fetching books: {str(e)}"
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'error': error_message}, status=500)
        return render(request, 'books.html', {
            'error': error_message,
            'books': [],
            'query': query
        })

def shows(request):
    query = request.GET.get('query', '')
    category = request.GET.get('category', 'popular')
    genre = request.GET.get('genre', '')
    page = request.GET.get('page', 1)
    media_type = request.GET.get('media_type', 'movie')  # Default to 'movie'

    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    if query:
        url = f"https://api.themoviedb.org/3/search/{media_type}"
        params = {
            'language': 'en-US', 
            'query': query, 
            'page': page,
            'include_adult': 'false'  # Add adult content filter
        }
    elif genre:
        genre_id = get_genre_id(genre)
        url = f"https://api.themoviedb.org/3/discover/{media_type}"
        params = {
            'language': 'en-US', 
            'with_genres': genre_id, 
            'page': page,
            'include_adult': 'false'  # Add adult content filter
        }
    else:
        url = f"https://api.themoviedb.org/3/{media_type}/{category}"
        params = {
            'language': 'en-US', 
            'page': page,
            'include_adult': 'false'  # Add adult content filter
        }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    total_pages = data.get('total_pages', 1)
    if total_pages > 500:  # TMDB limits to 500 pages
        total_pages = 500

    results = []
    for item in data.get('results', []):
        # Get additional details for each item
        if adult_content := item.get('adult', False):
            # Skip adult content
            continue
        processed_item = {
            'id': item.get('id'),
            'title': item.get('title') if media_type == 'movie' else item.get('name'),
            'release_date': item.get('release_date') if media_type == 'movie' else item.get('first_air_date'),
            'poster_path': item.get('poster_path'),
            'overview': item.get('overview'),
            'media_type': media_type,
        }
        results.append(processed_item)

    context = {
        'media_items': results,
        'media_type': media_type,
        'query': query,
        'category': category,
        'genre': genre,
        'current_page': int(page),
        'total_pages': total_pages,
        'has_next': int(page) < total_pages,
        'has_previous': int(page) > 1,
        'previous_page': int(page) - 1,
        'next_page': int(page) + 1,
    }
    return render(request, 'shows.html', context)

def get_genre_id(genre_name, media_type='movie'):
    # Updated genre mappings for both movies and TV shows
    genre_mappings = {
        'movie': {
            'action': 28,
            'comedy': 35,
            'drama': 18,
            'fantasy': 14,
            'horror': 27,
            'romance': 10749,
            'sci-fi': 878,
            'thriller': 53,
        },
        'tv': {
            'action': 10759,  # Action & Adventure
            'comedy': 35,
            'drama': 18,
            'fantasy': 10765,  # Sci-Fi & Fantasy
            'horror': 9648,    # Mystery
            'romance': 10749,
            'sci-fi': 10765,   # Sci-Fi & Fantasy
            'thriller': 80,    # Crime
        }
    }
    return genre_mappings.get(media_type, {}).get(genre_name.lower(), '')

def movie_detail(request, movie_id):
    # Validate 'id' parameter
    try:
        movie_id
    except (ValueError, TypeError):
        return HttpResponseBadRequest("Invalid movie ID.")

    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    try:
        # Get movie details
        show_url = f"https://api.themoviedb.org/3/movie/{movie_id}?language=en-US&append_to_response=credits,videos,similar"
        response = requests.get(show_url, headers=headers)
        response.raise_for_status()
        
        show = response.json()
        credits = show.get('credits', {})
        creators = [crew for crew in credits.get('crew', []) if crew['job'] == 'Director']
        
        context = {
            'movie': show,
            'directors': creators,
            'cast': credits.get('cast', [])[:10],
            'similar_movies': show.get('similar', {}).get('results', [])[:6],
            'genres': [genre['name'] for genre in show.get('genres', [])]
        }
        
        return render(request, 'showsinfo.html', context)
        
    except requests.RequestException as e:
        logger.error(f"Error fetching movie details: {str(e)}")
        return render(request, 'showsinfo.html', {'error': 'Failed to load movie details'})

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
    page = request.GET.get('page', 1)
    
    query_string = '''
    query ($page: Int = 1) {
        Page(page: $page, perPage: 50) {
            pageInfo {
                hasNextPage
                currentPage
            }
            media(type: ANIME, sort: TRENDING_DESC) {
                id
                episodes
                status
                format
                genres
                coverImage {
                    large
                }
                nextAiringEpisode {
                    episode
                }
                title {
                    english
                    romaji
                }
            }
        }
    }
    '''
    
    variables = {
        'page': int(page)
    }

    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Entertainment Tracker/1.0'
        }
        response = requests.post(
            'https://graphql.anilist.co',
            json={
                'query': query_string,
                'variables': variables
            },
            headers=headers
        )
        
        response.raise_for_status()
        data = response.json()
        
        if 'errors' in data:
            return render(request, 'animanga.html', {
                'error': data['errors'][0]['message'],
                'animanga_list': [],
                'has_next': False,
                'current_page': int(page)
            })

        page_data = data['data']['Page']
        context = {
            'animanga_list': page_data.get('media', []),
            'has_next': page_data.get('pageInfo', {}).get('hasNextPage', False),
            'current_page': int(page)
        }
    except requests.RequestException as e:
        return render(request, 'animanga.html', {
            'error': f"Failed to fetch anime: {str(e)}",
            'animanga_list': [],
            'has_next': False,
            'current_page': int(page)
        })

    return render(request, 'animanga.html', context)

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
    return render(request, 'animanga.html')

def animanga_detail(request, anime_id):
    query_string = '''
    query ($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        title {
        romaji
        english
        native
        }
        description
        startDate {
        year
        month
        day
        }
        endDate {
        year
        month
        day
        }
        season
        seasonYear
        episodes
        duration
        status
        averageScore
        meanScore
        popularity
        favourites
        format
        genres
        tags {
        name
        description
        category
        rank
        isGeneralSpoiler
        isMediaSpoiler
        isAdult
        }
        studios {
        edges {
            node {
            id
            name
            siteUrl
            }
            isMain
        }
        }
        staff {
        edges {
            node {
            id
            name {
                full
                native
            }
            language
            primaryOccupations
            image {
                large
            }
            siteUrl
            }
            role
        }
        }
        characters {
        edges {
            node {
            id
            name {
                full
                native
            }
            image {
                large
            }
            description
            siteUrl
            }
            role
            voiceActors(language: JAPANESE) {
            id
            name {
                full
                native
            }
            language
            image {
                large
            }
            siteUrl
            }
        }
        }
        relations {
        edges {
            node {
            id
            title {
                romaji
                english
            }
            type
            format
            status
            coverImage {
                large
            }
            siteUrl
            }
            relationType
        }
        }
        recommendations {
        edges {
            node {
            mediaRecommendation {
                id
                title {
                romaji
                english
                }
                format
                status
                averageScore
                popularity
                coverImage {
                large
                }
                siteUrl
            }
            rating
            userRating
            }
        }
        }
        trailer {
        id
        site
        thumbnail
        }
        siteUrl
        nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
        }
        streamingEpisodes {
        title
        thumbnail
        url
        site
        }
        reviews {
        nodes {
            id
            summary
            rating
            ratingAmount
            user {
            id
            name
            avatar {
                large
            }
            siteUrl
            }
            siteUrl
        }
        }
        rankings {
        id
        rank
        type
        format
        year
        season
        allTime
        context
        }
        coverImage {
        extraLarge
        }
        bannerImage
        externalLinks {
        id
        site
        url
        type
        language
        color
        icon
        notes
        isDisabled
        }
        source
        hashtag
        updatedAt
    }
    }
    '''
    
    variables = {
        'id': anime_id
    }

    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Entertainment Tracker/1.0'
        }
        response = requests.post(
            'https://graphql.anilist.co',
            json={
                'query': query_string,
                'variables': variables
            },
            headers=headers
        )
        
        response.raise_for_status()
        data = response.json()
        
        if 'errors' in data:
            return render(request, 'showsinfo.html', {
                'error': data['errors'][0]['message']
            })

        context = {
            'Media': data['data']['Media']
        }

    except requests.RequestException as e:
        return render(request, 'animangainfo.html', {
            'error': f"Failed to fetch anime: {str(e)}"
        })

    return render(request, 'animangainfo.html', context)

def get_trending_anime(request):
    query_string = '''
    query {
        Page(page: 1, perPage: 10) {
            media(type: ANIME, sort: TRENDING_DESC) {
                coverImage {
                    extraLarge
                }
            }
        }
    }
    '''
    
    try:
        response = requests.post(
            'https://graphql.anilist.co',
            json={'query': query_string},
            headers={'Accept': 'application/json'}
        )
        data = response.json()
        posters = [
            {"image_url": item["coverImage"]["extraLarge"]}
            for item in data["data"]["Page"]["media"]
            if item["coverImage"]["extraLarge"]
        ]
        return JsonResponse(posters, safe=False)
    except Exception:
        return JsonResponse([], safe=False)

def get_trending_posters(request):
    # Update existing function to return image_url format
    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    url = "https://api.themoviedb.org/3/trending/movie/week"
    response = requests.get(url, headers=headers)
    data = response.json()
    
    posters = [

        {"image_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}"} 
        for movie in data.get("results", [])[:10] 
        if movie.get("poster_path")
    ]
    
    return JsonResponse(posters, safe=False)
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def update_watchlist_progress(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            progress = data.get('progress')

            # Validate data
            if not item_id or progress is None:
                return JsonResponse({'success': False, 'error': 'Invalid data.'})

            # Update the watchlist item
            item = WatchlistItem.objects.get(id=item_id, user=request.user)
            item.progress = progress
            item.save()

            return JsonResponse({'success': True})
        except Exception as e:
            logger.error(f"Error updating watchlist progress: {e}")
            return JsonResponse({'success': False, 'error': 'An error occurred.'})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method.'})