from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

from dice.views import AnalyzeDiceView
from DnDHelper.viewsets import RegisterView
from DnDHelper.api_urls import urlpatterns as api_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_urlpatterns)),
    path('api/token/', obtain_auth_token),
    path('api/register/', RegisterView.as_view()),
    path('analyze/', AnalyzeDiceView.as_view()),
]
