from rest_framework import serializers
from .models import User, FavoriteBook, WishlistBook
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# Login personalizado
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        print("📥 Intento de login con:", attrs)
        data = super().validate(attrs)
        data['username'] = self.user.username
        print("✅ Login exitoso:", data)
        return data


# SERIALIZER DE PERFIL PRIVADO (incluirá la URL absoluta de la imagen)
class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=5)
    profile_picture = serializers.SerializerMethodField()  # 👈 Personalizado

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
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

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


# SERIALIZER DE REGISTRO
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=5,
        error_messages={"min_length": "La contraseña debe tener al menos 5 caracteres."}
    )
    username = serializers.CharField(
        min_length=5,
        error_messages={"min_length": "El nombre de usuario debe tener al menos 5 caracteres."}
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


# FAVORITE BOOK
class FavoriteBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteBook
        fields = [
            'id', 'book_key', 'title', 'author', 'isbn',
            'genres', 'first_publish_year', 'added_date',
            'cover_url', 'review', 'rating'
        ]


# FAVORITE BOOK (PÚBLICO)
class PublicFavoriteBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteBook
        fields = ['book_key', 'title', 'author', 'cover_url', 'rating', 'review']


# PERFIL PÚBLICO DE USUARIO (también incluye URL absoluta de imagen)
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

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_favorites(self, obj):
        favorites = obj.favorites.all()
        return PublicFavoriteBookSerializer(favorites, many=True).data


# WISHLIST
class WishlistBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistBook
        fields = '__all__'
        read_only_fields = ['user', 'added_at']
