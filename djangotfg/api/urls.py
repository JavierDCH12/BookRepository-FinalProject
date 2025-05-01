from django.urls import path
from .views import (
    public_reviews_by_book,
    register_user,
    user_profile,
    manage_favorites,
    remove_favorite,
    update_profile,
    manage_review,
    update_rating,
    public_profile_view,
    popular_books,
    manage_wishlist,
    delete_from_wishlist,
    CustomLoginView,  # Nuestra vista de login personalizada
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
   
   # 
    path('users/register/', register_user, name='register'),
    path('users/login/', CustomLoginView.as_view(), name='login'),
    path('users/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('users/profile/', user_profile, name='user_profile'),
    
    path('users/favorites/', manage_favorites, name='manage_favorites'),
    path('users/favorites/<str:book_key>/', remove_favorite, name='remove_favorite'),
    path('users/profile/update-profile/', update_profile, name='upload-profile'),
    path('users/favorites/<str:book_key>/review/', manage_review, name='manage_review'),
    path('users/favorites/<str:book_key>/rating/', update_rating, name='update_rating'),
    path('users/public-profile/<str:username>/', public_profile_view, name='public-profile'),
    path('books/popular/', popular_books, name='popular-books'),
    path('wishlist/', manage_wishlist, name='manage-wishlist'),
    path('wishlist/<str:book_key>/', delete_from_wishlist, name='wishlist-delete'),
    path('books/<str:book_key>/reviews/', public_reviews_by_book, name='public_reviews_by_book'),


]
