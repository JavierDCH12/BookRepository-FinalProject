from django.test import TestCase

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import FavoriteBook, WishlistBook

User = get_user_model()

class APITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.client.force_authenticate(user=self.user)

    def test_get_user_profile(self):
        res = self.client.get(reverse('user_profile'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_user_profile(self):
        res = self.client.delete(reverse('user_profile'))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_register_user(self):
        self.client.logout()
        res = self.client.post(reverse('register_user'), {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '12345'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_update_profile(self):
        res = self.client.put(reverse('update_profile'), {'first_name': 'Test'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['first_name'], 'Test')

    def test_add_favorite(self):
        data = {
            "book_key": "key123",
            "title": "Book Title",
            "author": "Author Name"
        }
        res = self.client.post(reverse('manage_favorites'), data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_get_favorites(self):
        res = self.client.get(reverse('manage_favorites'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_remove_favorite(self):
        FavoriteBook.objects.create(user=self.user, book_key="key123", title="Book")
        res = self.client.delete(reverse('remove_favorite', args=['key123']))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_manage_review(self):
        fav = FavoriteBook.objects.create(user=self.user, book_key="key123", title="Book")
        res = self.client.patch(reverse('manage_review', args=['key123']), {"review": "Excelente"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_rating(self):
        fav = FavoriteBook.objects.create(user=self.user, book_key="key123", title="Book")
        res = self.client.patch(reverse('update_rating', args=['key123']), {"rating": 4})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_public_profile_view(self):
        self.client.logout()
        res = self.client.get(reverse('public_profile_view', args=[self.user.username]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_popular_books(self):
        res = self.client.get(reverse('popular_books'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_manage_wishlist(self):
        post = self.client.post(reverse('manage_wishlist'), {
            "book_key": "wkey",
            "title": "Wishlist Book"
        })
        self.assertEqual(post.status_code, status.HTTP_201_CREATED)

        get = self.client.get(reverse('manage_wishlist'))
        self.assertEqual(get.status_code, status.HTTP_200_OK)

    def test_delete_from_wishlist(self):
        WishlistBook.objects.create(user=self.user, book_key="wkey", title="Book")
        res = self.client.delete(reverse('delete_from_wishlist', args=['wkey']))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
