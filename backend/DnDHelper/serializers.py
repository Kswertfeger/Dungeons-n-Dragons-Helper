from rest_framework import serializers

from backend.users import models

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        fields = ["full_name", "email"]
        model = models.User
