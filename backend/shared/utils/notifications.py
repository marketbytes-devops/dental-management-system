# notifications.py - shared notification sender utility
def send_system_notification(recipient_id: str, title: str, message: str):
    print(f"Sending system notification to {recipient_id}: {title} - {message}")
    return True
