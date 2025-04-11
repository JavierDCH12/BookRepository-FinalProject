from rest_framework import serializers

from mysite import settings
from .models import User, FavoriteBook, WishlistBook

# Los serializadores son clases que convierten los modelos de Django en JSON



#USER SERIALIZER
class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=5)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'date_joined',  
            'profile_picture',
            'password',
        ]

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return '/media/profile_pics/default_avatar.jpg'

    def validate_username(self, value):
        if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

#REGISTER SERIALIZER
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=5,
        error_messages={
            "min_length": "La contraseña debe tener al menos 5 caracteres."
        }
    )
    username = serializers.CharField(
        min_length=5,
        error_messages={
            "min_length": "El nombre de usuario debe tener al menos 5 caracteres."
        }
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"]
        )
        user.set_password(validated_data["password"])
        user.save()
        return user




#FAVORITEBOOK SERIALIZER
class FavoriteBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteBook
        fields = [
            'id', 'book_key', 'title', 'author', 'isbn',
            'genres', 'first_publish_year', 'added_date',
            'cover_url', 'review', 'rating'
        ]






##PUBLIC FAVORITEBOOK SERIALIZER
class PublicFavoriteBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteBook
        fields = ['book_key', 'title', 'author', 'cover_url', 'rating', 'review']





#PUBLIC USER PROFILE SERIALIZER
class PublicUserProfileSerializer(serializers.ModelSerializer):
    favorites = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'date_joined',
            'profile_picture',
            'first_name',
            'last_name',
            'favorites',
        ]

    def get_favorites(self, obj):
        favorites = obj.favorites.all()
        return PublicFavoriteBookSerializer(favorites, many=True).data

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return '/media/profile_pics/default_avatar.jpg'




#WISHLISTBOOK SERIALIZER
class WishlistBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistBook
        fields = '__all__'
        read_only_fields = ['user', 'added_at']



