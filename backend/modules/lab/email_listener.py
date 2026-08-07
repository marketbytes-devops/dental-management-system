import os
import time
import threading
import imaplib
import email
from email.header import decode_header
import re
from database import SessionLocal

def fetch_and_process_imap_emails():
    imap_host = os.getenv("IMAP_HOST", "imap.gmail.com")
    try:
        imap_port = int(os.getenv("IMAP_PORT", "993"))
    except (ValueError, TypeError):
        imap_port = 993

    lab_email = os.getenv("LAB_EMAIL")
    lab_password = os.getenv("LAB_EMAIL_APP_PASSWORD")

    if not lab_email or not lab_password:
        return

    mail = None
    try:
        mail = imaplib.IMAP4_SSL(imap_host, imap_port)
        mail.login(lab_email, lab_password)
        mail.select("INBOX")

        status, response = mail.search(None, '(UNSEEN)')
        if status != "OK" or not response or not response[0]:
            mail.logout()
            return

        msg_ids = response[0].split()
        if not msg_ids:
            mail.logout()
            return

        print(f"[IMAP LISTENER] Found {len(msg_ids)} unread email(s) in INBOX for {lab_email}", flush=True)

        from modules.lab.router import process_completion_email_text

        for msg_id in msg_ids:
            res, msg_data = mail.fetch(msg_id, '(RFC822)')
            if res != "OK":
                continue

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])

                    # Extract Subject
                    subject = ""
                    raw_subject = msg.get("Subject")
                    if raw_subject:
                        decoded = decode_header(raw_subject)
                        for content, encoding in decoded:
                            if isinstance(content, bytes):
                                subject += content.decode(encoding or "utf-8", errors="replace")
                            else:
                                subject += str(content)

                    # Extract Sender
                    sender = msg.get("From", "external-lab@dentalvendor.com")

                    # Extract Body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition") or "")
                            if content_type == "text/plain" and "attachment" not in content_disposition:
                                try:
                                    body += part.get_payload(decode=True).decode("utf-8", errors="replace")
                                except Exception:
                                    pass
                            elif content_type == "text/html" and not body and "attachment" not in content_disposition:
                                try:
                                    html_payload = part.get_payload(decode=True).decode("utf-8", errors="replace")
                                    text_stripped = re.sub(r'<[^>]+>', ' ', html_payload)
                                    body += text_stripped
                                except Exception:
                                    pass
                    else:
                        try:
                            body = msg.get_payload(decode=True).decode("utf-8", errors="replace")
                        except Exception:
                            body = str(msg.get_payload())

                    if body and body.strip():
                        db = SessionLocal()
                        try:
                            result = process_completion_email_text(
                                raw_text=body,
                                sender_email=sender,
                                subject=subject,
                                db=db
                            )
                            print(f"[IMAP LISTENER SUCCESS] Processed email from '{sender}'. Result: {result.get('status')}", flush=True)
                        except Exception as e:
                            print(f"[IMAP LISTENER ERROR] Failed processing email body: {e}", flush=True)
                        finally:
                            db.close()

                    # Mark email as Seen (read)
                    mail.store(msg_id, '+FLAGS', '\\Seen')

        mail.logout()
    except Exception as e:
        # Expected logging during development if credentials aren't live SMTP/IMAP
        print(f"[IMAP LISTENER LOG] Poll cycle info: {e}", flush=True)
        if mail:
            try:
                mail.logout()
            except Exception:
                pass


from datetime import date

def check_delivery_delays():
    """
    Delivery Monitoring Check (Section 6):
    If Current Date > Expected Return Date and Item has not been received:
    - Status becomes 'Delivery Delayed'
    - Sends automatic reminder email to external lab
    - Displays warning badge & lab notification
    """
    db = SessionLocal()
    try:
        from modules.lab.models import LabOrderModel, LabNotificationModel, LabVendorModel
        from modules.lab.router import send_smtp_email

        today_str = date.today().isoformat()
        
        delayed_orders = db.query(LabOrderModel).filter(
            LabOrderModel.status.in_(["Sent to External Lab", "Accepted by External Lab", "Order Sent to Lab"]),
            LabOrderModel.expected_return_date.isnot(None),
            LabOrderModel.expected_return_date < today_str
        ).all()

        for order in delayed_orders:
            order.status = "Delivery Delayed"
            
            notif = LabNotificationModel(
                title=f"⚠️ Delivery Delayed: Case #{order.id}",
                desc=f"Expected return date ({order.expected_return_date}) has passed for patient {order.patient_name}.",
                order_id=order.id
            )
            db.add(notif)
            
            vendor_email = None
            if order.vendor_id:
                vendor = db.query(LabVendorModel).filter(LabVendorModel.id == order.vendor_id).first()
                if vendor:
                    vendor_email = vendor.email

            if vendor_email:
                subject = f"URGENT: Delivery Delayed Reminder - Case #{order.id}"
                body = f"""
                <div style="font-family:sans-serif; padding:20px; color:#1e293b;">
                    <h2 style="color:#e11d48;">SmileCare Dental CRM - Case Delivery Reminder</h2>
                    <p>This is an automated reminder regarding Dental Case <strong>#{order.id}</strong> (Patient: {order.patient_name}).</p>
                    <p>The expected return date for this case was <strong>{order.expected_return_date}</strong>. Our clinic has not yet received this restoration item.</p>
                    <p>Please reply to this email with updated tracking or courier dispatch details as soon as possible.</p>
                </div>
                """
                send_smtp_email(vendor_email, subject, body, is_html=True)
                print(f"[DELIVERY MONITOR] Delivery delayed reminder email sent to {vendor_email} for case #{order.id}", flush=True)

        db.commit()
    except Exception as e:
        print(f"[DELIVERY MONITOR ERROR] {e}", flush=True)
    finally:
        db.close()


_listener_thread = None
_listener_running = False

def start_email_listener():
    global _listener_thread, _listener_running
    if _listener_running:
        return

    try:
        poll_interval = int(os.getenv("EMAIL_POLL_INTERVAL", "30"))
    except (ValueError, TypeError):
        poll_interval = 30

    lab_email = os.getenv("LAB_EMAIL")
    if not lab_email:
        print("[IMAP LISTENER] LAB_EMAIL not set in environment. Background IMAP listener will stand by.", flush=True)
        return

    _listener_running = True

    def loop():
        print(f"[IMAP LISTENER] Background listener active for {lab_email} (Polling every {poll_interval}s)", flush=True)
        while _listener_running:
            try:
                fetch_and_process_imap_emails()
                check_delivery_delays()
            except Exception as e:
                print(f"[IMAP LISTENER EXCEPTION] {e}", flush=True)
            time.sleep(poll_interval)

    _listener_thread = threading.Thread(target=loop, daemon=True)
    _listener_thread.start()

def stop_email_listener():
    global _listener_running
    _listener_running = False
