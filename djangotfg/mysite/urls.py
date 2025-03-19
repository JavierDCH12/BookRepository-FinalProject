from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from mysite import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/books-api/', include('books.urls')),
    # ✅ API routes
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
