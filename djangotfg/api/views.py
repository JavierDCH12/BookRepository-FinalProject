from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from sympy.codegen.fnodes import use_rename

from .models import FavoriteBook
from .notifications.email import send_welcome_email
from .serializers import UserProfileSerializer, RegisterSerializer, FavoriteBookSerializer
from django.contrib.auth import get_user_model
import logging

# Configuración de logs
logger = logging.getLogger(__name__)

User = get_user_model()


### ✅ OBTENER TODOS LOS USUARIOS (Solo si es necesario)
@cache_page(60)  # Cache de 1 minuto
@api_view(['GET'])
def get_all_users(request):
    """Retrieve all users."""
    users = User.objects.all()
    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


### ✅ PERFIL DE USUARIO (GET & DELETE)
@api_view(['GET', 'DELETE'])
@cache_page(60)
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Retrieve or deactivate user profile."""
    user = request.user

    if request.method == 'DELETE':
        user.is_active = False
        user.save()
        return Response({'detail': 'Cuenta desactivada con éxito'}, status=status.HTTP_204_NO_CONTENT)

    elif request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


### ✅ REGISTRO DE USUARIO
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Registers a new user."""
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        send_welcome_email(request.data.get('email'), request.data.get('username'))

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    logger.error(f"❌ Error al registrar el usuario: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



### UPDATE PROFILE

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Permite a los usuarios actualizar su perfil (nombre, apellidos, contraseña)."""
    user = request.user
    serializer = UserProfileSerializer(user, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Perfil actualizado con éxito", "user": serializer.data}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





### ✅ OBTENER FAVORITOS (GET) & AÑADIR FAVORITO (POST)
@api_view(['GET', 'POST'])
@cache_page(60)
@permission_classes([IsAuthenticated])
def manage_favorites(request):
    """Handles retrieving and adding favorite books."""
    user = request.user

    if request.method == 'GET':
        try:
            favorites = FavoriteBook.objects.filter(user=user)
            serializer = FavoriteBookSerializer(favorites, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"❌ Error fetching favorites: {str(e)}")
            return Response({"error": "Failed to retrieve favorites"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        serializer = FavoriteBookSerializer(data=request.data)

        if serializer.is_valid():
            book_key = serializer.validated_data.get('book_key')

            # ✅ Verificar si ya existe el favorito
            if FavoriteBook.objects.filter(user=user, book_key=book_key).exists():
                logger.warning(f"⚠️ Book {book_key} is already in favorites for user {user.username}")
                return Response({'message': 'Book is already in favorites'}, status=status.HTTP_400_BAD_REQUEST)

            serializer.save(user=user)
            logger.info(f"✅ Book {book_key} added to favorites for user {user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        logger.error(f"❌ Error adding favorite: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


### ✅ ELIMINAR UN FAVORITO
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite(request, book_key):
    """Remove a favorite book from the user's list."""
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()

    if favorite:
        favorite.delete()
        logger.info(f"✅ Book {book_key} removed from favorites for user {user.username}")
        return Response({'message': 'Book removed from favorites'}, status=status.HTTP_204_NO_CONTENT)

    logger.warning(f"⚠️ Book {book_key} not found in favorites for user {user.username}")
    return Response({'message': 'Book not found in favorites'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Subir o actualizar la foto de perfil del usuario"""
    user = request.user

    if 'profile_picture' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    user.profile_picture = request.FILES['profile_picture']
    user.save()

    return Response(
        {
            "message": "Profile picture updated successfully!",
            "profile_picture": user.profile_picture.url
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def manage_review(request, book_key):
    """Crea o actualiza la reseña de un libro favorito"""
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()

    if not favorite:
        return Response({'error': 'Book not found in favorites'}, status=status.HTTP_404_NOT_FOUND)

    review_text = request.data.get('review', '').strip()

    if not review_text:
        return Response({'error': 'Review cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

    favorite.review = review_text  # Si es nuevo, lo asigna; si ya existe, lo sobrescribe.
    favorite.save()

    return Response({'message': 'Review saved successfully', 'review': favorite.review}, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_rating(request, book_key):
    user = request.user
    favorite = FavoriteBook.objects.filter(user=user, book_key=book_key).first()

    if not favorite:
        return Response({'error': 'Book not found in favorites'}, status=status.HTTP_404_NOT_FOUND)

    rating_value = request.data.get('rating')
    try:
        rating_value = int(rating_value)
        if rating_value < 0 or rating_value > 5:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': 'Invalid rating value (must be between 0 and 5)'}, status=status.HTTP_400_BAD_REQUEST)

    favorite.rating = rating_value
    favorite.save()

    return Response({'message': 'Rating updated successfully', 'rating': favorite.rating})
