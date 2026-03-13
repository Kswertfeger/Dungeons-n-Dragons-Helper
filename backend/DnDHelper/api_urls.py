from django.conf.urls import  include
from django.urls import path, re_path
from rest_framework.routers import DefaultRouter

from backend.DnDHelper.viewsets import *


router = DefaultRouter()
router.register("users",)