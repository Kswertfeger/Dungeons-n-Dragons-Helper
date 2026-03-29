from django.contrib import admin
from characters.models import Character

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ("name", "race", "character_class", "level", "user")
    list_filter = ["user"]