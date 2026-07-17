import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

load_dotenv()

smtp_host = os.getenv("SMTP_HOST")
smtp_port = os.getenv("SMTP_PORT")
smtp_user = os.getenv("SMTP_USER")
smtp_password = os.getenv("SMTP_PASSWORD")
smtp_from = os.getenv("SMTP_FROM", smtp_user)

print("SMTP Configurations:")
print(f"Host: {smtp_host}")
print(f"Port: {smtp_port}")
print(f"User: {smtp_user}")
print(f"From: {smtp_from}")
print(f"Password set: {bool(smtp_password)}")

if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
    print("Error: Missing SMTP environment variables.")
    exit(1)

try:
    print("\nAttempting connection to SMTP server...")
    server = smtplib.SMTP(smtp_host, int(smtp_port), timeout=10)
    print("Connected! Starting TLS...")
    server.starttls()
    print("TLS started. Logging in...")
    server.login(smtp_user, smtp_password)
    print("Login successful! Constructing test email with attachment...")
    
    msg = MIMEMultipart('mixed')
    msg['From'] = smtp_from
    msg['To'] = smtp_user
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
            
    print(f"Sending test email with attachment to {smtp_user}...")
    server.sendmail(smtp_from, smtp_user, msg.as_string())
    server.quit()
    print("\n[SUCCESS] Diagnostic email with attachment sent successfully!")
except Exception as e:
    import traceback
    print("\n[FAILURE] SMTP verification failed:")
    traceback.print_exc()
