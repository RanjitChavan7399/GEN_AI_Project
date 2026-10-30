from rest_framework import serializers

class ResumeAnalysisRequestSerializer(serializers.Serializer):
    resume = serializers.FileField(required=True)
    job_description = serializers.CharField(required=True, min_length=20)
    company_name = serializers.CharField(required=False, default="Target Company", allow_blank=True)
    job_role = serializers.CharField(required=False, default="Software Engineer", allow_blank=True)

    def validate_resume(self, file_obj):
        name = file_obj.name.lower()
        if not (name.endswith('.pdf') or name.endswith('.docx') or name.endswith('.doc')):
            raise serializers.ValidationError("Unsupported file extension. Only PDF and DOCX files are allowed.")
        if file_obj.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size exceeds 10MB limit.")
        return file_obj


class CompanyRoadmapRequestSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=True, min_length=2)
    job_role = serializers.CharField(required=True, min_length=2)
    drive_date = serializers.CharField(required=False, allow_blank=True)
    days_remaining = serializers.IntegerField(required=False, default=7, min_value=1, max_value=30)
    job_description = serializers.CharField(required=False, allow_blank=True, default="")


class CompanyPrepOverviewSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=True, min_length=2)
    job_role = serializers.CharField(required=True, min_length=2)
    job_description = serializers.CharField(required=False, allow_blank=True, default="")


class CompanyQuestionsRequestSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=True, min_length=2)
    job_role = serializers.CharField(required=True, min_length=2)
    category = serializers.CharField(required=False, default="all")


class InterviewExperienceSerializer(serializers.Serializer):
    student_name = serializers.CharField(required=True, max_length=150)
    college = serializers.CharField(required=False, allow_blank=True, max_length=200)
    company_name = serializers.CharField(required=True, max_length=150)
    job_role = serializers.CharField(required=True, max_length=150)
    placement_year = serializers.CharField(required=False, allow_blank=True, max_length=50, default="2025 Placement")
    rounds_conducted = serializers.CharField(required=False, allow_blank=True, max_length=100, default="3 Rounds")
    status = serializers.CharField(required=False, allow_blank=True, max_length=100, default="Selected / Offered")
    difficulty = serializers.CharField(required=False, allow_blank=True, max_length=50, default="Medium")
    questions = serializers.CharField(required=False, allow_blank=True, default="")
    topics = serializers.CharField(required=False, allow_blank=True, default="")
    summary = serializers.CharField(required=True, min_length=20)


class StartMockInterviewSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=False, default="Target Company")
    job_role = serializers.CharField(required=False, default="Software Engineer")
    interview_type = serializers.CharField(required=False, default="Technical")
    difficulty = serializers.CharField(required=False, default="Medium")
    question_count = serializers.IntegerField(required=False, default=5, min_value=1, max_value=10)


class EvaluateAnswerTurnSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=True)
    question_id = serializers.CharField(required=True)
    question_text = serializers.CharField(required=True)
    transcribed_answer = serializers.CharField(required=True, min_length=2)


class AudioTranscribeSerializer(serializers.Serializer):
    audio = serializers.FileField(required=True)


class ConceptExplainSerializer(serializers.Serializer):
    concept = serializers.CharField(required=True, min_length=2)
    company_name = serializers.CharField(required=False, default="Target Company")
    job_role = serializers.CharField(required=False, default="Software Engineer")

