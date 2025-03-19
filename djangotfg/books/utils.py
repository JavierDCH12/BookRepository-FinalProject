from transformers import pipeline

def descripcion_libro(book):
    author = ", ".join(book.get('author_name', ['Desconocido']))
    title = book.get('title', 'Desconocido')
    return f"El libro '{title}' del autor {author} trata sobre {', '.join(book.get('subject', [])[:5])}."


def generate_summary(title, author):
    summarizer = pipeline('summarization', model="facebook/bart-large-cnn")
    text = f"{title} por {author}: "
    resumen = summarizer(text, max_length=128, min_length=60, do_sample=False)

    return resumen[0]['summary_text']

generate_summary("the lord of the rings", "tolkien")