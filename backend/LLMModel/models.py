from django.db import models
from LLMProvider.models import LLMProviderModel


class LLMModelModel(models.Model):

    provider = models.ForeignKey(
        LLMProviderModel,
        on_delete=models.CASCADE,
        related_name="llm_models"
    )

    name = models.CharField(
        max_length=100
    )

    model_identifier = models.CharField(
        max_length=150,
        unique=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    context_window = models.PositiveIntegerField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.provider.name} - {self.name}"