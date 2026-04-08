from django.db import models
from django.contrib.auth.models import User


class Character(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    race = models.CharField(max_length=100)
    character_class = models.CharField(max_length=50)
    level = models.IntegerField(default=1)
    background = models.CharField(max_length=100, blank=True, default='')
    alignment = models.CharField(max_length=50, blank=True, default='')
    xp = models.IntegerField(default=0)

    # Health
    hp_max = models.IntegerField(default=1)
    hp_current = models.IntegerField(default=1)

    # Stats
    strength = models.IntegerField(default=10)
    dexterity = models.IntegerField(default=10)
    constitution = models.IntegerField(default=10)
    intelligence = models.IntegerField(default=10)
    wisdom = models.IntegerField(default=10)
    charisma = models.IntegerField(default=10)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.character_class} - Level {self.level})"

    @property
    def armor_class(self):
        return 10 + (self.dexterity - 10) // 2

    @property
    def strength_modifier(self):
        return (self.strength - 10) // 2

    @property
    def dexterity_modifier(self):
        return (self.dexterity - 10) // 2

    @property
    def constitution_modifier(self):
        return (self.constitution - 10) // 2

    @property
    def intelligence_modifier(self):
        return (self.intelligence - 10) // 2

    @property
    def wisdom_modifier(self):
        return (self.wisdom - 10) // 2

    @property
    def charisma_modifier(self):
        return (self.charisma - 10) // 2


class Spell(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='spells')
    name = models.CharField(max_length=100)
    level = models.IntegerField(default=0)  # 0 = cantrip
    casting_time = models.CharField(max_length=50, default='1 action')
    range = models.CharField(max_length=50, default='Self')
    components = models.CharField(max_length=100, default='V, S')
    duration = models.CharField(max_length=50, default='Instantaneous')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        label = 'Cantrip' if self.level == 0 else f'Level {self.level}'
        return f"{self.name} ({label})"


class SpellSlot(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='spell_slots')
    slot_level = models.IntegerField()  # 1-9
    total = models.IntegerField(default=0)
    used = models.IntegerField(default=0)

    class Meta:
        unique_together = ['character', 'slot_level']

    @property
    def remaining(self):
        return self.total - self.used

    def __str__(self):
        return f"Level {self.slot_level} slots ({self.remaining}/{self.total})"


class InventoryItem(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='inventory')
    name = models.CharField(max_length=100)
    weight = models.FloatField(default=0.0)
    quantity = models.IntegerField(default=1)
    equipped = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} x{self.quantity}"


ROLL_TYPE_CHOICES = [
    ('STR', 'Strength'),
    ('DEX', 'Dexterity'),
    ('CON', 'Constitution'),
    ('INT', 'Intelligence'),
    ('WIS', 'Wisdom'),
    ('CHA', 'Charisma'),
    ('CUSTOM', 'Custom'),
]


class RollHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roll_history')
    character = models.ForeignKey(
        Character, on_delete=models.SET_NULL,
        related_name='roll_history', null=True, blank=True
    )
    roll_type = models.CharField(max_length=10, choices=ROLL_TYPE_CHOICES, default='CUSTOM')
    dice_type = models.CharField(max_length=10, default='d20')
    num_dice = models.IntegerField(default=1)
    base_roll = models.IntegerField()
    modifier = models.IntegerField(default=0)
    total = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.roll_type} {self.dice_type}: {self.total}"
