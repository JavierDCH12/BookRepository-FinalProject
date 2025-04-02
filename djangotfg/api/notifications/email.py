from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string

import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string

import constants

# Configure the logger
logger = logging.getLogger(__name__)

def send_welcome_email(email, username): # Enviar email de bienvenida
    subject = constants.EMAIL_WELCOME_SUBJECT
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [email]

    try:
        html_content = render_to_string('emails/welcome-email.html', {'username': username})

        email_message = EmailMultiAlternatives(subject, '', from_email, to)
        email_message.attach_alternative(html_content, "text/html")
        email_message.send()
        logger.info(f"Welcome email sent to {email}")

    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")