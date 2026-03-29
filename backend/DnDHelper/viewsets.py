from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth.models import User
from characters.models import Character
from DnDHelper.serializers import CharacterSerializer, UserSerializer

class UserViewset(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    class Meta:
        model = User

class CharacterViewSet(ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return characters belonging to the logged-in user
        return Character.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the logged-in user on create
        serializer.save(user=self.request.user)