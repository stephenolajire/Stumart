from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.cloud import dialogflow_v2
from django.conf import settings
import json

class ChatbotView(APIView):
    def post(self, request):
        try:
            # Get the message from request
            message = request.data.get('message')
            session_id = request.data.get('session_id')  # User's session ID

            if not message:
                return Response(
                    {'error': 'No message provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a session client
            session_client = dialogflow_v2.SessionsClient()
            session = session_client.session_path(
                settings.DIALOGFLOW_PROJECT_ID, 
                session_id
            )

            # Create the text input
            text_input = dialogflow_v2.TextInput(
                text=message, 
                language_code="en"
            )
            query_input = dialogflow_v2.QueryInput(text=text_input)

            # Detect intent
            response = session_client.detect_intent(
                request={"session": session, "query_input": query_input}
            )

            return Response({
                'response': response.query_result.fulfillment_text,
                'intent': response.query_result.intent.display_name,
                'confidence': response.query_result.intent_detection_confidence
            })

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )