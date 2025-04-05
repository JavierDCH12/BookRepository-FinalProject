from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from mysite import settings
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.http import JsonResponse

schema_view = get_schema_view(
    openapi.Info(
        title="Book API",
        default_version='v1',
        description="API para gestión de usuarios, favoritos y libros populares.",
        contact=openapi.Contact(name="API Support", email="javierdch12devtest@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("", lambda request: JsonResponse({"status": "BookFinder API online ✅"})), 
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/books/', include('books.urls')),

    # Swagger y Redoc
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Archivos media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
