from django.shortcuts import render
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
            session_id = request.data.get('session_id')

            if not message:
                return Response(
                    {'error': 'No message provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"Processing message: {message} for session: {session_id}")
            print(f"Using project ID: {settings.DIALOGFLOW_PROJECT_ID}")

            # Use the new client function instead of relying on environment variable
            try:
                session_client = settings.get_dialogflow_client()
                print("Successfully created Dialogflow client")
            except Exception as client_error:
                print(f"Failed to create Dialogflow client: {str(client_error)}")
                # Fallback to original method if function fails
                session_client = dialogflow_v2.SessionsClient()
                print("Using fallback Dialogflow client")

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

            print(f"Got response: {response.query_result.fulfillment_text}")

            return Response({
                'response': response.query_result.fulfillment_text,
                'intent': response.query_result.intent.display_name,
                'confidence': response.query_result.intent_detection_confidence,
                'session_id': session_id
            })

        except Exception as e:
            print(f"Error in ChatbotView: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )