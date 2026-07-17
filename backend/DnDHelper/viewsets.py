from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from characters.models import Character, Spell, SpellSlot, InventoryItem, RollHistory, Profile
from DnDHelper.serializers import (
    RegisterSerializer, UserSerializer, CharacterSerializer,
    SpellSerializer, SpellSlotSerializer,
    InventoryItemSerializer, RollHistorySerializer, ProfileSerializer,
)


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        Profile.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(
            profile, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['character'] = get_object_or_404(
            Character, pk=self.kwargs['character_pk'], user=self.request.user
        )
        return context

    def perform_create(self, serializer):
        serializer.save(character=self.get_serializer_context()['character'])


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
        return RollHistory.objects.filter(
            character__pk=self.kwargs['character_pk'],
            character__user=self.request.user,
        )

    def perform_create(self, serializer):
        character = get_object_or_404(
            Character, pk=self.kwargs['character_pk'], user=self.request.user
        )
        serializer.save(user=self.request.user, character=character)

    @action(detail=False, methods=['delete'])
    def clear(self, request, character_pk=None):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
