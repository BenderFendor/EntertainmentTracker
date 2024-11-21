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
    api_key = settings.TMDB_API_KEY
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    if query:
        url = f"https://api.themoviedb.org/3/search/movie?query={query}&language=en-US&page=1"
    else:
        url = "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1"
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        movies = data.get('results', [])[:20]  # Get the first 20 movies
    else:
        movies = []
        # Optionally, handle the error or display a message
    return render(request, 'shows.html', {'movies': movies, 'query': query})

def movie_detail(request, movie_id):
    api_key = settings.TMDB_API_KEY
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?language=en-US"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        movie = response.json()
    else:
        movie = {}
        messages.error(request, 'Failed to retrieve movie details.')
    return render(request, 'infopage.html', {'movie': movie})

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