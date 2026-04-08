from rest_framework import serializers
from django.contrib.auth.models import User
from characters.models import Character, Spell, SpellSlot, InventoryItem, RollHistory


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ['id', 'username', 'email', 'is_staff']
        model = User


class CharacterSerializer(serializers.ModelSerializer):
    armor_class = serializers.ReadOnlyField()
    strength_modifier = serializers.ReadOnlyField()
    dexterity_modifier = serializers.ReadOnlyField()
    constitution_modifier = serializers.ReadOnlyField()
    intelligence_modifier = serializers.ReadOnlyField()
    wisdom_modifier = serializers.ReadOnlyField()
    charisma_modifier = serializers.ReadOnlyField()

    class Meta:
        model = Character
        exclude = ['user']


class SpellSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spell
        exclude = ['character']


class SpellSlotSerializer(serializers.ModelSerializer):
    remaining = serializers.ReadOnlyField()

    class Meta:
        model = SpellSlot
        exclude = ['character']


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        exclude = ['character']


class RollHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RollHistory
        exclude = ['user', 'character']
        read_only_fields = ['created_at']
