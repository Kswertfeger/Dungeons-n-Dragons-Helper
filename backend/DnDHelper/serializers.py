from rest_framework import serializers
from django.contrib.auth.models import User
from characters.models import Character, Spell, SpellSlot, InventoryItem, RollHistory, Profile


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

    def validate_slot_level(self, value):
        character = self.context.get('character')
        if character is not None:
            qs = SpellSlot.objects.filter(character=character, slot_level=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f"Level {value} slots already exist for this character."
                )
        return value


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        exclude = ['character']


class RollHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RollHistory
        exclude = ['user', 'character']
        read_only_fields = ['created_at']


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['active_character']

    def validate_active_character(self, value):
        request = self.context.get('request')
        if value is not None and request is not None and value.user != request.user:
            raise serializers.ValidationError("Character not found.")
        return value
