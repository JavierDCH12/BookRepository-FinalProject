from django.urls import path
from django.views.decorators.cache import cache_page

from . import views
from .views import get_book_description, search_books

urlpatterns = [
    path('search/book', search_books, name='search_books'),
    path('books-api/description/<str:book_key>/', get_book_description, name='get_book_description'),
]
