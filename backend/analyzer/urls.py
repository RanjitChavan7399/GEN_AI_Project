from django.urls import path
from .views import (
    AnalyzeResumeView,
    CompanyPrepOverviewView,
    GenerateCompanyRoadmapView,
    CompanyQuestionsView,
    StartMockInterviewView,
    EvaluateAnswerTurnView,
    FinishMockInterviewView,
    MockInterviewReportsView,
    AnalysisHistoryView,
    AnalysisDetailView,
    DeleteAnalysisView,
    InterviewExperienceView,
    ApproveExperienceView,
    DeleteExperienceView,
    FlagExperienceView,
    UpvoteExperienceView,
    AudioTranscribeView,
    ConceptExplainView
)

urlpatterns = [
    path('analyze/', AnalyzeResumeView.as_view(), name='analyze_resume'),
    path('prep/overview/', CompanyPrepOverviewView.as_view(), name='prep_overview'),
    path('generate-roadmap/', GenerateCompanyRoadmapView.as_view(), name='generate_roadmap'),
    path('roadmaps/', GenerateCompanyRoadmapView.as_view(), name='saved_roadmaps'),
    path('prep/questions/', CompanyQuestionsView.as_view(), name='prep_questions'),
    path('prep/explain-concept/', ConceptExplainView.as_view(), name='explain_concept'),
    
    # Mock Interview & Voice Evaluation Endpoints
    path('mock-interview/start/', StartMockInterviewView.as_view(), name='mock_start'),
    path('mock-interview/evaluate/', EvaluateAnswerTurnView.as_view(), name='mock_evaluate'),
    path('mock-interview/transcribe/', AudioTranscribeView.as_view(), name='mock_transcribe'),
    path('mock-interview/<str:session_id>/finish/', FinishMockInterviewView.as_view(), name='mock_finish'),
    path('mock-interview/reports/', MockInterviewReportsView.as_view(), name='mock_reports'),
    
    # History & Experience Endpoints
    path('history/', AnalysisHistoryView.as_view(), name='analysis_history'),
    path('history/<str:analysis_id>/', AnalysisDetailView.as_view(), name='analysis_detail'),
    path('history/<str:analysis_id>/delete/', DeleteAnalysisView.as_view(), name='analysis_delete'),
    path('experiences/', InterviewExperienceView.as_view(), name='interview_experiences'),
    path('experiences/<str:exp_id>/approve/', ApproveExperienceView.as_view(), name='approve_experience'),
    path('experiences/<str:exp_id>/delete/', DeleteExperienceView.as_view(), name='delete_experience'),
    path('experiences/<str:exp_id>/flag/', FlagExperienceView.as_view(), name='flag_experience'),
    path('experiences/<str:exp_id>/upvote/', UpvoteExperienceView.as_view(), name='upvote_experience'),
]
