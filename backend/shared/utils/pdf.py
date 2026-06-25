import os
import base64
import tempfile
from fpdf import FPDF
from datetime import datetime

def generate_consent_pdf(patient_name: str, patient_token: str, title: str, content: str, signature_data: str, signature_method: str, output_path: str):
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Initialize FPDF
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "SmileCare Dental CRM", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, "Patient Treatment Consent Form", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    
    # Metadata Box
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(40, 7, "Patient Name:", new_x="RIGHT", new_y="LAST")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(60, 7, patient_name, new_x="RIGHT", new_y="LAST")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(40, 7, "Patient Token:", new_x="RIGHT", new_y="LAST")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 7, patient_token, new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(40, 7, "Form Title:", new_x="RIGHT", new_y="LAST")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(60, 7, title, new_x="RIGHT", new_y="LAST")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(40, 7, "Date Signed:", new_x="RIGHT", new_y="LAST")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 7, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    
    # Content body
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "Disclosure & Acknowledgment", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    
    pdf.set_font("helvetica", "", 10)
    # Support multi-line disclosure text
    pdf.multi_cell(0, 6, content)
    pdf.ln(10)
    
    # Signature Section
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "Patient Digital Signature", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    
    if signature_method == "draw" and signature_data:
        try:
            # Handle base64 image data
            # Format usually: "data:image/png;base64,iVBORw0KGgo..."
            img_data = signature_data
            if "," in img_data:
                img_data = img_data.split(",")[1]
            
            decoded = base64.b64decode(img_data)
            
            # Write to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_img:
                temp_img.write(decoded)
                temp_path = temp_img.name
            
            # Place signature image in PDF
            pdf.image(temp_path, x=20, y=pdf.get_y(), w=60)
            pdf.ln(20)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        except Exception as e:
            # Fallback text signature if image rendering fails
            print(f"Error rendering signature image in PDF: {e}")
            pdf.set_font("times", "I", 14)
            pdf.cell(0, 10, f"Signed digitally: {patient_name}", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(10)
    else:
        # Typed signature
        pdf.set_font("times", "I", 16)
        typed_sig = signature_data if signature_data else patient_name
        pdf.cell(0, 10, f"/{typed_sig}/", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("helvetica", "I", 8)
        pdf.cell(0, 5, "(Digital Typed Signature)", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(10)
        
    # Signature under-line
    pdf.set_font("helvetica", "", 8)
    pdf.cell(0, 5, "__________________________________________________", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, f"Legal signature of {patient_name} ({patient_token})", new_x="LMARGIN", new_y="NEXT")
    
    # Save output
    pdf.output(output_path)
    print(f"PDF generated successfully at: {output_path}")
