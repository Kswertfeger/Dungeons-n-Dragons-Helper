from rest_framework import serializers

from django.contrib.auth.models import User
from characters.models import Character

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        fields = ["username", "email", "is_staff"]
        model = User

class CharacterSerializer(serializers.ModelSerializer):

    class Meta:
        exclude = ["user", "id"]
        model = Character
