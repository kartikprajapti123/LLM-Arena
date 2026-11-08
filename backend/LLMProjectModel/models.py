from django.db import models

from project.models import ProjectModel
from LLMModel.models import LLMModelModel


class LLMProjectModelModel(models.Model):

    project = models.ForeignKey(
        ProjectModel,
        on_delete=models.CASCADE,
        related_name="llm_models"
    )

    llm_model = models.ForeignKey(
        LLMModelModel,
        on_delete=models.CASCADE,
        related_name="projects"
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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "llm_model"],
                name="unique_project_llm_model"
            )
        ]

    def __str__(self):
        return f"{self.project.name} - {self.llm_model.name}"