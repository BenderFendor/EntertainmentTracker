from django.contrib import admin
from django.urls import path
from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.main_page, name='main_page'),
    path('books/', views.books, name='books'),
    path('shows/', views.shows, name='shows'),
]