from django.db import models
from backend.users.models import User


class Character(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    race = models.CharField(max_length=100)
    char_class = models.CharField(max_length=50)
    level = models.IntegerField(default=1)

    # Stats
