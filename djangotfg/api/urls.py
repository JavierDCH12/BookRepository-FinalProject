from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import UserProfileSerializer, RegisterSerializer, FavoriteBookSerializer, BookSerializer

urlpatterns = [
    # 🟢 USERS
    path('users/', views.get_all_users, name='get_all_users'),
    path('users/register/', views.register_user, name='register'),
    path('users/login/', TokenObtainPairView.as_view(), name='login'),
    path('users/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('users/profile/', views.user_profile, name='user_profile'),

    # 🟢 FAVORITES (Unificamos GET y POST en un solo endpoint)
    path('users/favorites/', views.manage_favorites, name='manage_favorites'),
    path('users/favorites/<str:book_key>/', views.remove_favorite, name='remove_favorite'),
    path('users/upload-profile-picture/', views.upload_profile_picture, name='upload-profile-picture'),
    path('users/profile/update-profile/', views.update_profile, name='upload-profile'),
    path('users/favorites/<str:book_key>/review/', views.manage_review, name='manage_review'),
    path('users/favorites/<str:book_key>/rating/', views.update_rating, name='update_rating'),
    path('users/public-profile/<str:username>/', views.public_profile_view, name='public-profile'),
    path('books/popular/', views.popular_books, name='popular-books'),
    path('wishlist/', views.manage_wishlist, name='manage-wishlist'),
    path('wishlist/<str:book_key>/', views.delete_from_wishlist, name='wishlist-delete'),

]
