import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

load_dotenv()

smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
smtp_port = os.getenv("SMTP_PORT", "587")
lab_email = os.getenv("LAB_EMAIL")
lab_password = os.getenv("LAB_EMAIL_APP_PASSWORD")

print("SMTP & Email Configurations:")
print(f"Host: {smtp_host}")
print(f"Port: {smtp_port}")
print(f"Lab Email: {lab_email}")
print(f"App Password set: {bool(lab_password)}")

if not all([smtp_host, smtp_port, lab_email, lab_password]):
    print("Error: Missing LAB_EMAIL or LAB_EMAIL_APP_PASSWORD environment variables in .env")
    exit(1)

try:
    print("\nAttempting connection to SMTP server...")
    server = smtplib.SMTP(smtp_host, int(smtp_port), timeout=10)
    print("Connected! Starting TLS...")
    server.starttls()
    print("TLS started. Logging in...")
    server.login(lab_email, lab_password)
    print("Login successful! Constructing test email with attachment...")
    
    msg = MIMEMultipart('mixed')
    msg['From'] = lab_email
    msg['To'] = lab_email
    msg['Subject'] = "SmileCare SMTP Attachment Diagnostics"
    
    # Attach body
    msg.attach(MIMEText("This is a diagnostic email from your SmileCare installation verifying SMTP file attachments.", 'plain', 'utf-8'))
    
    # Attach this script itself as a test!
    file_path = "check_smtp.py"
    if os.path.exists(file_path):
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=filename)
            msg.attach(part)
            print(f"Attached file: {file_path}")
            
    print(f"Sending test email with attachment to {lab_email}...")
    server.sendmail(lab_email, lab_email, msg.as_string())
    server.quit()
    print("\n[SUCCESS] Diagnostic email with attachment sent successfully!")
except Exception as e:
    import traceback
    print("\n[FAILURE] SMTP verification failed:")
    traceback.print_exc()
