import os
import io
import re
import logging
import pymupdf as fitz
import docx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", 5))
MAX_FILE_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Default 5 MB

# Standard Resume Section Headers Patterns
SECTION_PATTERNS = {
    "education": r"(?i)\b(education|academic|qualification|academics|educational)\b",
    "skills": r"(?i)\b(skills|technical skills|key skills|technologies|expertise|proficiencies|core competencies)\b",
    "projects": r"(?i)\b(projects|key projects|academic projects|personal projects|capstone project)\b",
    "experience": r"(?i)\b(experience|work experience|employment|internships|internship|professional experience)\b",
    "certifications": r"(?i)\b(certifications|certificates|licenses|achievements|awards|accomplishments)\b"
}

def validate_file_signature(file_bytes: bytes, filename: str):
    """Validate file magic bytes to prevent fake or executable file uploads."""
    fn = filename.lower()
    if fn.endswith('.pdf'):
        if not file_bytes.startswith(b'%PDF-'):
            raise ValueError("Invalid PDF file signature. File header does not match standard PDF format.")
    elif fn.endswith('.docx') or fn.endswith('.doc'):
        if not (file_bytes.startswith(b'PK\x03\x04') or file_bytes.startswith(b'\xd0\xcf\x11\xe0')):
            raise ValueError("Invalid DOCX file signature. File header does not match standard Word document format.")
    else:
        raise ValueError("Unsupported file extension. Only PDF and DOCX files are accepted.")

def extract_sections_from_text(text: str) -> dict:
    """Identify presence and text snippets of standard resume sections."""
    sections_found = {}
    lines = text.split('\n')
    current_section = "general"
    sections_found[current_section] = []

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue
        
        # Check if line acts as a section header (short line matching pattern)
        is_header = False
        if len(cleaned_line) < 40:
            for sec_name, pattern in SECTION_PATTERNS.items():
                if re.search(pattern, cleaned_line):
                    current_section = sec_name
                    if current_section not in sections_found:
                        sections_found[current_section] = []
                    is_header = True
                    break
        
        if not is_header:
            sections_found[current_section].append(cleaned_line)

    # Join lines per section
    result_sections = {sec: "\n".join(lines_list) for sec, lines_list in sections_found.items() if lines_list}
    return result_sections

def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    """Extract text from PDF using PyMuPDF page by page."""
    text_chunks = []
    page_count = 0
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(pdf_document)
        for page_num in range(page_count):
            page = pdf_document[page_num]
            chunk = page.get_text("text")
            if chunk:
                text_chunks.append(chunk.strip())
        pdf_document.close()
    except Exception as e:
        logger.error(f"PyMuPDF error: {e}")
        raise ValueError(f"Failed to read PDF document: {str(e)}")

    full_text = "\n".join(text_chunks).strip()
    return full_text, page_count

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX document using python-docx."""
    text_chunks = []
    try:
        doc_stream = io.BytesIO(file_bytes)
        doc = docx.Document(doc_stream)
        for paragraph in doc.paragraphs:
            if paragraph.text and paragraph.text.strip():
                text_chunks.append(paragraph.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    text_chunks.append(" | ".join(row_text))
    except Exception as e:
        logger.error(f"docx error: {e}")
        raise ValueError(f"Failed to read DOCX document: {str(e)}")

    full_text = "\n".join(text_chunks).strip()
    return full_text

def parse_resume_file(uploaded_file) -> dict:
    """Validate uploaded file size, signature, extract text, and detect sections."""
    if uploaded_file.size > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum allowed limit of {MAX_UPLOAD_SIZE_MB}MB.")

    filename = uploaded_file.name
    file_bytes = uploaded_file.read()
    uploaded_file.seek(0)  # Reset stream position

    # Validate Magic Bytes Signature
    validate_file_signature(file_bytes, filename)

    page_count = 1
    if filename.lower().endswith('.pdf'):
        text, page_count = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_docx(file_bytes)

    # Check for empty or scanned PDF without extractable text
    ocr_required = False
    if not text or len(text.strip()) < 30:
        ocr_required = True
        raise ValueError("Could not extract text from document. If this is a scanned PDF, OCR text extraction is required.")

    sections = extract_sections_from_text(text)

    return {
        "text": text,
        "sections": sections,
        "page_count": page_count,
        "char_count": len(text),
        "ocr_required": ocr_required,
        "filename": filename
    }
