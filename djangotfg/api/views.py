from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from constants import SUCCESS_DEACTIVATE, ERROR_REGISTER, SUCCESS_UPDATE_PROFILE, ERROR_FETCHING_FAVS, \
    INFO_ALREADY_FAVS, INFO_BOOK_REMOVED_FAVS, ERROR_BOOK_NOT_FOUND_IN_FAVS, ERROR_UPLOAD_PHOTO, \
    SUCCESS_UPLOAD_PHOTO, ERROR_EMPTY, SUCCESS_SAVED_REVIEW, ERROR_INVALID_REVIEW, SUCCESS_UPDATE_REVIEW, \
    ERROR_USER_NOT_FOUND
from .models import FavoriteBook, WishlistBook
from .notifications.email import send_welcome_email
from .security.throttles import FavoriteRateThrottle, ProfileUpdateRateThrottle, RegisterRateThrottle
from .serializers import UserProfileSerializer, RegisterSerializer, FavoriteBookSerializer, PublicUserProfileSerializer, \
    WishlistBookSerializer
from django.contrib.auth import get_user_model
import logging
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
# Configuración de logs
logger = logging.getLogger(__name__)

User = get_user_model()


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


### PERFIL DE USUARIO (GET & DELETE)
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user

    if request.method == 'DELETE':
        user.is_active = False
        user.save()
        return Response({'detail': SUCCESS_DEACTIVATE}, status=status.HTTP_204_NO_CONTENT)

    elif request.method == 'GET':
        serializer = UserProfileSerializer(user, context={'request': request}) 
        return Response(serializer.data, status=status.HTTP_200_OK)


### REGISTRO DE USUARIO
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])

def register_user(request):
    """Registers a new user."""
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        send_welcome_email(request.data.get('email'), request.data.get('username'))
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    logger.error(ERROR_REGISTER, {serializer.errors})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



### UPDATE PROFILE
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@throttle_classes([ProfileUpdateRateThrottle])
def update_profile(request):
    user = request.user
    serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})  # 👈 CONTEXTO

    if serializer.is_valid():
        serializer.save()
        return Response({"message": SUCCESS_UPDATE_PROFILE, "user": serializer.data}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





### OBTENER FAVORITOS (GET) & AÑADIR FAVORITO (POST)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([FavoriteRateThrottle])
def manage_favorites(request):
    """Handles retrieving and adding favorite books."""
    user = request.user

    if request.method == 'GET':
        try:
            favorites = FavoriteBook.objects.filter(user=user)
            serializer = FavoriteBookSerializer(favorites, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching favorites: {str(e)}")
            return Response({"error": ERROR_FETCHING_FAVS}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        serializer = FavoriteBookSerializer(data=request.data)

        if serializer.is_valid():
            book_key = serializer.validated_data.get('book_key')

            #Verificar si ya existe el favorito
            if FavoriteBook.objects.filter(user=user, book_key=book_key).exists():
                logger.warning(f"⚠️ Book {book_key} is already in favorites for user {user.username}")
                return Response({'message': INFO_ALREADY_FAVS}, status=status.HTTP_400_BAD_REQUEST)

            serializer.save(user=user)
            logger.info(f"✅ Book {book_key} added to favorites for user {user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        logger.error(f"Error adding favorite: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


###ELIMINAR UN FAVORITO
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite(request, book_key):
    """Remove a favorite book from the user's list."""
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()
    print(f"🔎 Buscando favorito: user={user.username}, book_key={book_key}")


    if favorite:
        favorite.delete()
        logger.info(f"✅ Book {book_key} removed from favorites for user {user.username}")
        return Response({'message': INFO_BOOK_REMOVED_FAVS}, status=status.HTTP_204_NO_CONTENT)

    logger.warning(f"⚠️ Book {book_key} not found in favorites for user {user.username}")
    return Response({'message': ERROR_BOOK_NOT_FOUND_IN_FAVS}, status=status.HTTP_404_NOT_FOUND)



"""@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    user = request.user
    profile_picture_url = request.data.get('profile_picture')

    if not profile_picture_url:
        return Response({"error": "No se recibió URL de la foto de perfil."}, status=status.HTTP_400_BAD_REQUEST)

    # Validar que sea una URL válida
    validator = URLValidator()
    try:
        validator(profile_picture_url)
    except ValidationError:
        return Response({"error": "La URL proporcionada no es válida."}, status=status.HTTP_400_BAD_REQUEST)

    user.profile_picture = profile_picture_url
    user.save()

    return Response({
        "message": "Foto de perfil actualizada correctamente.",
        "profile_picture": user.profile_picture
    }, status=status.HTTP_200_OK)
"""

# CREAR O ACTUALIZAR RESEÑA
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def manage_review(request, book_key):
    """Crea o actualiza la reseña de un libro favorito"""
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()

    if not favorite:
        return Response({'error': ERROR_BOOK_NOT_FOUND_IN_FAVS}, status=status.HTTP_404_NOT_FOUND)

    review_text = request.data.get('review', '').strip()

    if not review_text:
        return Response({'error': ERROR_EMPTY}, status=status.HTTP_400_BAD_REQUEST)

    favorite.review = review_text  
    favorite.save()

    return Response({'message': SUCCESS_SAVED_REVIEW, 'review': favorite.review}, status=status.HTTP_200_OK)


### ACTUALIZAR VALORACIÓN
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_rating(request, book_key):
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()

    if not favorite:
        return Response({'error': ERROR_BOOK_NOT_FOUND_IN_FAVS}, status=status.HTTP_404_NOT_FOUND)

    rating_value = request.data.get('rating')
    try:
        rating_value = int(rating_value)
        if rating_value < 0 or rating_value > 5:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': ERROR_INVALID_REVIEW}, status=status.HTTP_400_BAD_REQUEST)

    favorite.rating = rating_value
    favorite.save()

    return Response({'message': SUCCESS_UPDATE_REVIEW, 'rating': favorite.rating})


## PERFIL PÚBLICO
@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile_view(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': ERROR_USER_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

    serializer = PublicUserProfileSerializer(user, context={'request': request})  
    return Response(serializer.data, status=status.HTTP_200_OK)


## PERFIL PÚBLICO (SIN CAMPOS PRIVADOS)
@api_view(['GET'])
@permission_classes([AllowAny])
def public_user_profile(request, username):
    user = get_object_or_404(User, username=username)
    serializer = UserProfileSerializer(user)

    public_data = {
        "username": serializer.data.get("username"),
        "email": serializer.data.get("email"),  
        "register_date": serializer.data.get("register_date"),
        "profile_picture": serializer.data.get("profile_picture"),
        "first_name": serializer.data.get("first_name"),
        "last_name": serializer.data.get("last_name"),
    }

    favorites = FavoriteBook.objects.filter(user=user)
    public_data["favorites"] = [
        {
            "book_key": fav.book_key,
            "title": fav.title,
            "author": fav.author,
            "cover_url": fav.cover_url,
            "rating": fav.rating,
            "review": fav.review
        }
        for fav in favorites
    ]

    return Response(public_data, status=status.HTTP_200_OK)



## LIBROS POPULARES
@api_view(['GET'])
@permission_classes([AllowAny])
def popular_books(request):
    """Devuelve los libros más populares basados en favoritos de usuarios"""
    top_books = (
        FavoriteBook.objects.values(
            'book_key', 'title', 'author', 'cover_url', 'first_publish_year'
        )
        .annotate(favorites_count=Count('id'))
        .order_by('-favorites_count')[:20]
    )

    return Response(list(top_books), status=status.HTTP_200_OK)

## GESTIONAR LISTA DE DESEOS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_wishlist(request):
    if request.method == 'GET':
        wishlist = WishlistBook.objects.filter(user=request.user)
        serializer = WishlistBookSerializer(wishlist, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = WishlistBookSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

## ELIMINAR DE LA LISTA DE DESEOS
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_from_wishlist(request, book_key):
    try:
        wishlist_item = WishlistBook.objects.get(user=request.user, book_key=book_key)
    except WishlistBook.DoesNotExist:
        return Response({'detail': 'Book not found in wishlist.'}, status=status.HTTP_404_NOT_FOUND)

    wishlist_item.delete()
    return Response({'detail': 'Book removed from wishlist.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_reviews_by_book(request, book_key):
    """Devuelve todas las reseñas públicas de un libro concreto."""
    try:
        reviews = FavoriteBook.objects.filter(book_key=book_key)\
            .exclude(review__isnull=True)\
            .exclude(review__exact='')

        data = []
        for fav in reviews:
            user = fav.user

            if not user or not hasattr(user, 'username'):
                continue

            data.append({
                'username': user.username,
                'review': fav.review,
                'rating': fav.rating,
                'cover_url': fav.cover_url
            })

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f" Error en public_reviews_by_book: {str(e)}")
        return Response({"detail": "Error interno al obtener reseñas."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
