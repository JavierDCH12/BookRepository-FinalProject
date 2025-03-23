from django.urls import path
from django.views.decorators.cache import cache_page

from . import views
from .views import get_book_description, search_books, get_book_details

urlpatterns = [
    path('search/', search_books, name='search_books'),
    path('description/<str:book_key>/', get_book_description, name='get_book_description'),
    path('details/<str:book_key>/', get_book_details, name='get_book_details'),
]