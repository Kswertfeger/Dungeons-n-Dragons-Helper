from django.db import models
from django.contrib.auth.models import User


class Character(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    race = models.CharField(max_length=100)
    character_class = models.CharField(max_length=50)
    level = models.IntegerField(default=1)

    # Health
    hp_max = models.IntegerField(default=1)
    hp_current = models.IntegerField(default=1)


    # Stats
    strength = models.IntegerField(default=1)
    dexterity = models.IntegerField(default=1)
    constitution = models.IntegerField(default=1)
    intelligence = models.IntegerField(default=1)
    wisdom = models.IntegerField(default=1)
    charisma = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.character_class} - Level {self.level})"