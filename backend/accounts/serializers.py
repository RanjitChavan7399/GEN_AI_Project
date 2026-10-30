from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from services.db_service import db_service

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    college = serializers.CharField(max_length=200, required=False, allow_blank=True)
    branch = serializers.CharField(max_length=150, required=False, allow_blank=True)
    graduation_year = serializers.CharField(max_length=10, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        email = validated_data['email']
        full_name = validated_data['full_name']
        password = validated_data['password']

        # Create Django User for auth
        username = email.split('@')[0] + "_" + str(User.objects.count() + 1)
        hashed_pw = make_password(password)
        user = User.objects.create(
            username=username,
            email=email,
            first_name=full_name.split()[0] if full_name else '',
            last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
            password=hashed_pw
        )

        # Store user account & credentials in MongoDB Atlas (users collection)
        account_doc = {
            "email": email,
            "full_name": full_name,
            "username": username,
            "password_hash": hashed_pw,
            "college": validated_data.get("college", ""),
            "branch": validated_data.get("branch", ""),
            "graduation_year": validated_data.get("graduation_year", "")
        }
        db_service.save_user_account(account_doc)

        # Store profile in MongoDB Atlas (student_profiles collection)
        profile_doc = {
            "email": email,
            "full_name": full_name,
            "college": validated_data.get("college", ""),
            "branch": validated_data.get("branch", ""),
            "graduation_year": validated_data.get("graduation_year", ""),
            "target_company": "Google",
            "target_role": "Software Engineer",
            "profile_completed": True
        }
        db_service.save_user_profile(profile_doc)

        return user

class UserProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(read_only=True)
    college = serializers.CharField(max_length=200, allow_blank=True, required=False)
    branch = serializers.CharField(max_length=150, allow_blank=True, required=False)
    graduation_year = serializers.CharField(max_length=10, allow_blank=True, required=False)
    target_company = serializers.CharField(max_length=100, allow_blank=True, required=False)
    target_role = serializers.CharField(max_length=100, allow_blank=True, required=False)
