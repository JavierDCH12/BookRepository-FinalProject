from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string


def send_welcome_email(email, username):
    subject = "📚 ¡Bienvenido a BookShelf!"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [email]

    html_content = render_to_string('emails/welcome_email.html', {'username': username})

    email_message = EmailMultiAlternatives(subject, '', from_email, to)
    email_message.attach_alternative(html_content, "text/html")
    email_message.send()