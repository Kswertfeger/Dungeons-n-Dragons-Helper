from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from characters.models import Character, Spell, SpellSlot, InventoryItem, RollHistory
from DnDHelper.serializers import (
    RegisterSerializer, UserSerializer, CharacterSerializer,
    SpellSerializer, SpellSlotSerializer,
    InventoryItemSerializer, RollHistorySerializer,
)


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class UserViewset(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    class Meta:
        model = User


class CharacterViewSet(ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Character.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SpellViewSet(ModelViewSet):
    serializer_class = SpellSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Spell.objects.filter(
            character__pk=self.kwargs['character_pk'],
            character__user=self.request.user,
        )

    def perform_create(self, serializer):
        character = get_object_or_404(
            Character, pk=self.kwargs['character_pk'], user=self.request.user
        )
        serializer.save(character=character)


class SpellSlotViewSet(ModelViewSet):
    serializer_class = SpellSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SpellSlot.objects.filter(
            character__pk=self.kwargs['character_pk'],
            character__user=self.request.user,
        )

    def perform_create(self, serializer):
        character = get_object_or_404(
            Character, pk=self.kwargs['character_pk'], user=self.request.user
        )
        serializer.save(character=character)


class InventoryItemViewSet(ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(
            character__pk=self.kwargs['character_pk'],
            character__user=self.request.user,
        )

    def perform_create(self, serializer):
        character = get_object_or_404(
            Character, pk=self.kwargs['character_pk'], user=self.request.user
        )
        serializer.save(character=character)


class RollHistoryViewSet(ModelViewSet):
    serializer_class = RollHistorySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return RollHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
