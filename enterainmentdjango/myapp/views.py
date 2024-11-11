from django.shortcuts import render

def main_page(request):
    return render(request, 'main_page.html')

def books(request):
    return render(request, 'books.html')

def shows(request):
    return render(request, 'shows.html')