from rest_framework.viewsets import ModelViewSet
from backend.users.models import User

class UserViewset(ModelViewSet):
    queryset = User.objects.all()

    class Meta:
        model = User
