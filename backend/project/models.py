from django.db import models
from django.conf import settings

from workspace.models import WorkspaceModel


class ProjectModel(models.Model):
    name = models.CharField(max_length=100)

    workspace = models.ForeignKey(
        WorkspaceModel,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    description = models.TextField(
        null=True,
        blank=True
    )

    image = models.ImageField(
        upload_to="project/",
        null=True,
        blank=True
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name