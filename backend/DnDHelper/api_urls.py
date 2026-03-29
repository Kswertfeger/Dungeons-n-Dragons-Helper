from django.conf.urls import  include
from django.urls import path, re_path
from rest_framework.routers import DefaultRouter

from DnDHelper.viewsets import *
from dice.views import AnalyzeDiceView


router = DefaultRouter()
router.register("users", UserViewset, "users")
router.register("characters", CharacterViewSet, "characters")
