from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.main_page, name='main_page'),
    path('books/', views.books, name='books'),
    path('shows/', views.shows, name='shows'),
    path('account/', views.account, name='account'), # not added yet
    path('create-account/', views.create_account, name='create_account'), # same here
    path('login/', views.login_view, name='login'),
    path('movie/<int:movie_id>/', views.movie_detail, name='movie_detail'),
    path('animanga/', views.animanga, name='animanga'),  # Keep only the main animanga route
    path('animanga/<int:anime_id>/', views.animanga_detail, name='anime_detail'),
    path('<str:media_type>/<int:show_id>/', views.movie_detail, name='movie_detail'),
    path('api/trending-posters', views.get_trending_posters, name='trending-posters'),
    path('api/trending-anime', views.get_trending_anime, name='trending-anime'),
    path('api/watchlist/', views.get_watchlist, name='get_watchlist'),
    path('api/watchlist/add/', views.add_to_watchlist, name='add_to_watchlist'),
    path('api/watchlist/update/', views.update_watchlist, name='update_watchlist'),
    path('api/watchlist/delete/<int:item_id>/', views.delete_from_watchlist, name='delete_from_watchlist'),
    path('watchlist/', views.watchlist, name='watchlist'),
]