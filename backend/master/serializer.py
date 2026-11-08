from rest_framework import serializers
from master.models import Country, State, City


class CountrySerializer(serializers.ModelSerializer):

    class Meta:
        model = Country
        fields = ["id", "name", "created_at"]

    def validate(self, attrs):
        country_name = attrs.get("name")
        if country_name:
            if self.instance:
                country_instance = (
                    Country.objects.filter(name=country_name)
                    .exclude(id=self.instance.id)
                    .first()
                )
                if country_instance:
                    raise serializers.ValidationError(
                        "country with this name already exists"
                    )

            else:
                country_instance = Country.objects.filter(name=country_name).first()
                if country_instance:
                    raise serializers.ValidationError(
                        "country with this name already exists"
                    )

        else:
            raise serializers.ValidationError("State name is required")

        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class StateSerializer(serializers.ModelSerializer):
    country_name = serializers.SerializerMethodField()

    class Meta:
        model = State
        fields = ["id", "name", "country", "country_name", "created_at"]

    def validate(self, attrs):
        name = attrs.get("name")
        country = attrs.get("country")

        if name:
            if self.instance:
                state_instance = (
                    State.objects.filter(name=name, country=country)
                    .exclude(id=self.instance.id)
                    .first()
                )
                if state_instance:
                    raise serializers.ValidationError("State name is already exists")
            else:
                state_instance = State.objects.filter(
                    name=name, country=country
                ).first()
                if state_instance:
                    raise serializers.ValidationError("State name is already exists")
        else:
            raise serializers.ValidationError("State name is required")

        country = attrs.get("country")
        if not country:
            raise serializers.ValidationError("Country is required")

        return super().validate(attrs)

    def get_country_name(self, obj):
        if obj.country:
            return obj.country.name
        return None

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class CitySerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", required=False,read_only=True)
    country_name = serializers.CharField(source="state.country", required=False,read_only=True)
    
    country = serializers.CharField(source="state.country.name", required=False,read_only=True)
    
    class Meta:
        model = City
        fields = [
            "id",
            "state",
            "state_name",
            "country",
            "country_name",
            "name",
            "created_at",
        ]

    def validate(self, attrs):
        city_name = attrs.get("name")

        if not city_name:
            raise serializers.ValidationError("City name is required")

        if self.instance:
            city_exists = (
                City.objects.filter(name=city_name)
                .exclude(pk=self.instance.pk)
                .exists()
            )

            if city_exists:
                raise serializers.ValidationError("City name already exists")

        else:
            city_exists = City.objects.filter(name=city_name).exists()

            if city_exists:
                raise serializers.ValidationError("City name already exists")

        return attrs
