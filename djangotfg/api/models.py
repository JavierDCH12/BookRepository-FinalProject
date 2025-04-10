from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.conf import settings


# Modelos de la aplicación

def default_profile_picture():
    return 'profile_pics/default_avatar.jpg'



class User(AbstractUser):
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=125, unique=True)
    register_date = models.DateTimeField(auto_now_add=True)
    profile_picture=models.ImageField(upload_to='profile_pics/', null=True, blank=True, default=default_profile_picture())

    def __str__(self):
        return self.username


class WishlistBook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlist")
    book_key = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    isbn = models.CharField(max_length=20, blank=True, null=True)
    cover_url = models.URLField(blank=True, null=True)
    genres = models.JSONField(default=list, blank=True)
    first_publish_year = models.IntegerField(blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book_key')


class FavoriteBook(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, null=True, blank=True)
    isbn = models.CharField(max_length=30, null=True, blank=True)
    genres = models.CharField(max_length=255, null=True, blank=True)
    first_publish_year = models.IntegerField(null=True, blank=True)
    number_of_pages = models.IntegerField(null=True, blank=True)
    language = models.CharField(max_length=10, null=True, blank=True)
    cover_url = models.URLField(null=True, blank=True)
    added_date = models.DateTimeField(auto_now_add=True)
    book_key = models.CharField(max_length=255, default="UNKNOWN")
    review=models.CharField(null=True, blank=True, max_length=255)
    rating = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])  # ✅ Campo rating



    class Meta:
        unique_together = ('user', 'book_key')
        indexes = [
            models.Index(fields=['user', 'book_key']),
            models.Index(fields=['book_key']),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"
