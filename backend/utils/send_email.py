from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def send_template_email(
    subject,
    template_name,
    context,
    recipient_list,
):
    html_content = render_to_string(template_name, context)

    email = EmailMultiAlternatives(
        subject=subject,
        body="",
        from_email=settings.EMAIL_HOST_USER,
        to=recipient_list,
    )

    email.attach_alternative(html_content, "text/html")
    email.send()