from django.contrib import admin
from django.urls import path
from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.main_page, name='main_page'),
    path('books/', views.books, name='books'),
    path('shows/', views.shows, name='shows'),
    path('account/', views.account, name='account'),
    path('create-account/', views.create_account, name='create_account'),
    path('login/', views.login_view, name='login'),
    path('movie/<int:movie_id>/', views.movie_detail, name='movie_detail'),
]