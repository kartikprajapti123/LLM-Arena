from rest_framework import serializers
from project.models import ProjectModel
from decouple import config

class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(
        source="owner.username",
        read_only=True
    )

    owner_profile_image = serializers.CharField(
        source="owner.profile_image",
        read_only=True
    )

    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    class Meta:
        model = ProjectModel

        fields = [
            "id",
            "name",
            "description",
            "image",
            "workspace",
            "workspace_name",
            "owner",
            "owner_username",
            "owner_profile_image",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]

    
    
    def validate(self, attrs):
        name = attrs.get(
            "name",
            getattr(self.instance, "name", None)
        )

        workspace = attrs.get(
            "workspace",
            getattr(self.instance, "workspace", None)
        )

        if name and workspace:
            queryset = ProjectModel.objects.filter(
                name=name,
                workspace=workspace
            )

            if self.instance:
                queryset = queryset.exclude(
                    id=self.instance.id
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    "A project with this name already exists in this workspace."
                )

        return attrs
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
    
        backendurl = config("BACKEND_URL")
    
        if instance.image:
            data["image"] = backendurl + "/media/" + str(instance.image)
    
        if instance.owner and instance.owner.profile_image:
            data["owner_profile_image"] = (
                backendurl + "/media/" + str(instance.owner.profile_image)
            )
    
        return data
    
    def update(self, instance, validated_data):
        if "image" in validated_data:
            image = validated_data.pop("image")

            if instance.image:
                instance.image.delete(save=False)

            instance.image = image

        return super().update(instance, validated_data)