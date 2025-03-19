from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import requests


@cache_page(60)
@api_view(['GET'])
@permission_classes([AllowAny])
def search_books(request):
    title = request.GET.get('title', '')
    author = request.GET.get('author', '')
    genre = request.GET.get('genre', '')

    if not (title or author or genre):
        return Response({"detail": "Debes proporcionar al menos un parámetro (title, author o genre)"},
                        status=status.HTTP_400_BAD_REQUEST)

    query_parts = []
    if title:
        query_parts.append(f"title:{title}")
    if author:
        query_parts.append(f"author:{author}")
    if genre:
        query_parts.append(f"subject:{genre}")

    query = "+".join(query_parts)
    url = f'https://openlibrary.org/search.json?q={query}'
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        resultados = []

        for book in data.get('docs', [])[:50]:
            title = book.get('title', 'Desconocido')
            author = ", ".join(book.get('author_name', ['Desconocido'])[:3])
            genres = [", ".join(book.get('subject', [])[:3])] if book.get('subject') else None

            # Extraer correctamente el book_key desde OpenLibrary
            openlibrary_key = book.get('key', '')
            if openlibrary_key.startswith("/works/"):
                book_key = openlibrary_key.replace("/works/", "")
            else:
                book_key = "UNKNOWN"

            book_info = {
                'title': title,
                'author': author,
                'first_publish_year': book.get('first_publish_year'),
                'isbn': book.get('isbn', [None])[0],
                'genres': genres,
                'book_key': book_key,
                'cover_url': f"https://covers.openlibrary.org/b/id/{book['cover_i']}-M.jpg" if book.get('cover_i') else None
            }
            resultados.append(book_info)

        return Response(resultados, status=status.HTTP_200_OK)

    return Response({"detail": "Error en la consulta a OpenLibrary"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@cache_page(60)
@api_view(['GET'])
def get_book_description(request, book_key):
    """
    Obtiene la descripción de un libro usando su `key` en Open Library.
    """
    url = f'https://openlibrary.org{book_key}.json'  # 🔥 Consultamos la API con el key
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        description = data.get('description', 'No description available')

        # Si la descripción es un diccionario, extraemos el texto
        if isinstance(description, dict):
            description = description.get('value', 'No description available')

        return Response({'description': description}, status=status.HTTP_200_OK)

    return Response({"detail": "No se encontró la descripción"}, status=status.HTTP_404_NOT_FOUND)
