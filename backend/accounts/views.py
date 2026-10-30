from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .serializers import RegisterSerializer, UserProfileSerializer
from services.db_service import db_service

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # Log registration & login event in MongoDB Atlas
            full_name = request.data.get("full_name", user.username)
            client_ip = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT')
            db_service.save_user_login_event(
                email=user.email,
                full_name=full_name,
                status="REGISTER_AND_LOGIN",
                ip=client_ip,
                user_agent=user_agent
            )

            profile = db_service.get_user_profile(user.email) or {
                "email": user.email,
                "full_name": full_name
            }

            return Response({
                "message": "User registered successfully!",
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                },
                "user": profile
            }, status=status.HTTP_201_CREATED)

        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        client_ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            db_service.save_user_login_event(
                email=email,
                status="FAILED_INVALID_EMAIL",
                ip=client_ip,
                user_agent=user_agent
            )
            return Response({"error": "Invalid email or password credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            db_service.save_user_login_event(
                email=email,
                full_name=user_obj.get_full_name() or user_obj.username,
                status="FAILED_INVALID_PASSWORD",
                ip=client_ip,
                user_agent=user_agent
            )
            return Response({"error": "Invalid email or password credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # Log successful login in MongoDB Atlas
        full_name = user.get_full_name() or user.username
        db_service.save_user_login_event(
            email=email,
            full_name=full_name,
            status="LOGIN_SUCCESS",
            ip=client_ip,
            user_agent=user_agent
        )

        refresh = RefreshToken.for_user(user)
        profile = db_service.get_user_profile(email) or {
            "email": email,
            "full_name": full_name
        }

        return Response({
            "message": "Login successful!",
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            },
            "user": profile
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = request.user.email
        profile = db_service.get_user_profile(email) or {
            "email": email,
            "full_name": request.user.get_full_name() or request.user.username,
            "college": "",
            "branch": "",
            "graduation_year": "",
            "target_company": "Google",
            "target_role": "Software Engineer"
        }
        return Response(profile, status=status.HTTP_200_OK)

    def put(self, request):
        email = request.user.email
        data = request.data.copy()
        data["email"] = email

        serializer = UserProfileSerializer(data=data)
        if serializer.is_valid():
            db_service.save_user_profile(serializer.validated_data)
            return Response({"message": "Profile updated successfully!", "profile": serializer.validated_data}, status=status.HTTP_200_OK)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
