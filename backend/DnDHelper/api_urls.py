from django.urls import path, include
from rest_framework.routers import DefaultRouter

from DnDHelper.viewsets import (
    UserViewset, CharacterViewSet,
    SpellViewSet, SpellSlotViewSet,
    InventoryItemViewSet, RollHistoryViewSet,
    ProfileView,
)

router = DefaultRouter()
router.register('users', UserViewset, 'users')
router.register('characters', CharacterViewSet, 'characters')

char_router = DefaultRouter()
char_router.register('spells', SpellViewSet, 'character-spells')
char_router.register('spell-slots', SpellSlotViewSet, 'character-spell-slots')
char_router.register('inventory', InventoryItemViewSet, 'character-inventory')
char_router.register('rolls', RollHistoryViewSet, 'character-rolls')

urlpatterns = router.urls + [
    path('characters/<int:character_pk>/', include(char_router.urls)),
    path('profile/', ProfileView.as_view(), name='profile'),
]
