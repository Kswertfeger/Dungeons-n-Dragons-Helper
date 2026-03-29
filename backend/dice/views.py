from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from pipeline import run_pipeline


class AnalyzeDiceView(APIView):
    pass

    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = run_pipeline(request.FILES['image'])
        except FileNotFoundError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(result)
