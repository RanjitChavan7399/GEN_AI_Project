import io
import pymupdf as fitz
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from services.resume_parser import parse_resume_file, validate_file_signature

class ResumeParserTestCase(TestCase):
    def test_pdf_signature_and_text_extraction(self):
        # Create a mock PDF document in-memory using PyMuPDF
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Education: B.Tech in Computer Science\nSkills: Python, Django, React, SQL\nProjects: Built full-stack web application.")
        pdf_bytes = doc.tobytes()
        doc.close()

        uploaded = SimpleUploadedFile("sample_resume.pdf", pdf_bytes, content_type="application/pdf")
        result = parse_resume_file(uploaded)

        self.assertIn("Python", result["text"])
        self.assertIn("B.Tech", result["text"])
        self.assertEqual(result["ocr_required"], False)
        self.assertIn("skills", result["sections"])

    def test_file_signature_validation_fails_for_fake_file(self):
        fake_bytes = b"This is fake text content pretending to be a PDF."
        with self.assertRaises(ValueError):
            validate_file_signature(fake_bytes, "fake.pdf")

    def test_empty_or_unreadable_pdf_raises_error(self):
        doc = fitz.open()
        doc.new_page() # blank page
        pdf_bytes = doc.tobytes()
        doc.close()

        uploaded = SimpleUploadedFile("empty.pdf", pdf_bytes, content_type="application/pdf")
        with self.assertRaises(ValueError):
            parse_resume_file(uploaded)
