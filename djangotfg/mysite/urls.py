from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from mysite import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Para endpoints de usuario, auth, etc.
    path('api/books/', include('books.urls')),  # Para endpoints de libros
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
