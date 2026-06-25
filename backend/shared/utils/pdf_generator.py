import os
from fpdf import FPDF
import base64
from tempfile import NamedTemporaryFile
from datetime import datetime

class PDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 15)
        self.cell(0, 10, "Consent Form", align="C")
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def generate_consent_pdf(title: str, body_text: str, signature_data: str, patient_name: str) -> str:
    """
    Generates a PDF from the given consent data and returns the path to the saved PDF.
    signature_data is a base64 string starting with 'data:image/png;base64,...'
    """
    pdf = PDF()
    pdf.add_page()
    
    # Title
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, title, ln=True)
    pdf.ln(5)
    
    # Body
    pdf.set_font("helvetica", "", 12)
    pdf.multi_cell(0, 10, body_text)
    pdf.ln(10)
    
    # Signatures section
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, f"Signed by: {patient_name}", ln=True)
    pdf.cell(0, 10, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    
    # Handle signature image
    if signature_data and signature_data.startswith('data:image'):
        try:
            # Extract base64 part
            header, encoded = signature_data.split(",", 1)
            img_data = base64.b64decode(encoded)
            
            # Save temporarily
            with NamedTemporaryFile(delete=False, suffix=".png") as temp_img:
                temp_img.write(img_data)
                temp_img_path = temp_img.name
            
            # Add to PDF
            pdf.image(temp_img_path, w=100)
            
            # Clean up temp image
            os.remove(temp_img_path)
        except Exception as e:
            print(f"Failed to parse signature image: {e}")
            pdf.cell(0, 10, "[Signature Image Error]", ln=True)

    # Make sure pdfs directory exists
    os.makedirs("data/pdfs", exist_ok=True)
    
    file_name = f"data/pdfs/consent_{datetime.now().strftime('%Y%m%d%H%M%S')}_{patient_name.replace(' ', '_')}.pdf"
    pdf.output(file_name)
    
    return file_name
