import requests
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
import boto3

def main_page(request):
    return render(request, 'main_page.html')

def books(request):
    return render(request, 'books.html')

def shows(request):
    query = request.GET.get('query', '')
    category = request.GET.get('category', 'popular')
    genre = request.GET.get('genre', '')

    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    if query:
        url = "https://api.themoviedb.org/3/search/movie"
        params = {'language': 'en-US', 'query': query}
        description = f'Results for "{query}"'
    elif genre:
        genre_id = get_genre_id(genre)
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {'language': 'en-US', 'with_genres': genre_id}
        description = f'Shows in the "{genre.capitalize()}" genre'
    else:
        if category == 'top_rated':
            url = "https://api.themoviedb.org/3/movie/top_rated"
            description = "Top Rated Shows"
        else:  # Default to 'popular'
            url = "https://api.themoviedb.org/3/movie/popular"
            description = "Popular Shows"
        params = {'language': 'en-US'}

    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    movies = data.get('results', [])

    context = {
        'movies': movies,
        'query': query,
        'category': category,
        'description': description
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
    return render(request, 'account.html')

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
        email = request.POST['email']
        password = request.POST['password']
        client = boto3.client('cognito-idp', region_name=settings.AWS_COGNITO_REGION)
        try:
            response = client.initiate_auth(
                ClientId=settings.AWS_COGNITO_APP_CLIENT_ID,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password,
                },
            )
            request.session['access_token'] = response['AuthenticationResult']['AccessToken']
            messages.success(request, 'Logged in successfully.')
            return redirect('main_page')
        except client.exceptions.NotAuthorizedException:
            messages.error(request, 'Invalid credentials.')
    return render(request, 'login.html')