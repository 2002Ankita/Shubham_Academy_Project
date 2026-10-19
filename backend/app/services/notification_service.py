import os
import re
import json
import asyncio
import urllib.request
import urllib.error
from typing import Dict, Any

class NotificationProviderService:
    def __init__(self):
        # Environment variables for WhatsApp & SMS providers
        self.whatsapp_api_key = os.getenv("WHATSAPP_API_KEY", "").strip()
        self.whatsapp_api_url = os.getenv("WHATSAPP_API_URL", "").strip()
        self.whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()

        self.sms_api_key = os.getenv("SMS_API_KEY", "").strip()
        self.sms_api_url = os.getenv("SMS_API_URL", "").strip()
        self.sms_sender_id = os.getenv("SMS_SENDER_ID", "SHUBACAD").strip()

    @staticmethod
    def mask_phone(phone: str) -> str:
        if not phone:
            return "Not available"
        digits = re.sub(r"\D", "", str(phone))
        if len(digits) >= 4:
            return f"{'*' * (len(digits) - 4)}{digits[-4:]}"
        return "****"

    @staticmethod
    def build_marks_message(
        student_name: str,
        marks_obtained: float,
        max_marks: float,
        subject: str,
        exam_name: str,
        percentage: float,
        roll_number: str = "",
        grade: str = "",
        remarks: str = ""
    ) -> str:
        marks_str = f"{int(marks_obtained) if marks_obtained.is_integer() else marks_obtained}"
        max_str = f"{int(max_marks) if max_marks.is_integer() else max_marks}"
        pct_val = int(percentage) if float(percentage).is_integer() else round(float(percentage), 1)
        pct_str = f"{pct_val}%"
        roll_part = f" (Roll No: {roll_number})" if roll_number else ""
        grade_line = f"\nGrade: {grade}" if grade else ""
        remarks_line = f"\nRemarks: {remarks}" if remarks else ""
        
        return (
            f"Dear Parent/Guardian,\n\n"
            f"Your ward {student_name}{roll_part} has received {marks_str}/{max_str} in {subject} for {exam_name}.\n\n"
            f"Percentage: {pct_str}"
            f"{grade_line}"
            f"{remarks_line}\n\n"
            f"Regards,\n"
            f"Shubham Academy"
        )

    @staticmethod
    def build_teacher_marks_alert(teacher_name: str, exam_name: str, subject: str, total_students: int, channel: str) -> str:
        return (
            f"Dear {teacher_name},\n\n"
            f"Marks notifications for examination '{exam_name}' ({subject}) have been dispatched via {channel.upper()} to parents of {total_students} students.\n\n"
            f"Regards,\n"
            f"Shubham Academy"
        )

    @staticmethod
    def build_teacher_exam_schedule_alert(teacher_name: str, exam_name: str, subject: str, standard: str, date_str: str) -> str:
        return (
            f"Dear {teacher_name},\n\n"
            f"A new examination '{exam_name}' for {subject} ({standard}) has been scheduled on {date_str}. Review timetable and student roster in Teacher Portal.\n\n"
            f"Regards,\n"
            f"Shubham Academy"
        )

    def _sync_http_post(self, url: str, data: dict, headers: dict) -> Dict[str, Any]:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                return {"status_code": response.status, "body": response.read().decode("utf-8")}
        except urllib.error.HTTPError as e:
            return {"status_code": e.code, "error": str(e)}
        except Exception as e:
            return {"status_code": 0, "error": str(e)}

    async def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        if not phone:
            return {"success": False, "status": "missing_phone", "message": "Parent mobile number not available"}

        digits = re.sub(r"\D", "", phone)
        if len(digits) < 10:
            return {"success": False, "status": "failed", "message": "Invalid phone number format"}

        # If provider credentials are not configured, return unconfigured so fake sent count is never shown
        if not self.whatsapp_api_key or not self.whatsapp_api_url:
            return {
                "success": False,
                "status": "unconfigured",
                "message": "WhatsApp provider credentials not configured in backend environment variables"
            }

        headers = {
            "Authorization": f"Bearer {self.whatsapp_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": f"91{digits[-10:]}",
            "type": "text",
            "text": {"body": message}
        }
        url = self.whatsapp_api_url
        if self.whatsapp_phone_number_id and "{PHONE_NUMBER_ID}" in url:
            url = url.replace("{PHONE_NUMBER_ID}", self.whatsapp_phone_number_id)

        res = await asyncio.to_thread(self._sync_http_post, url, payload, headers)
        if res.get("status_code") in (200, 201):
            return {"success": True, "status": "sent", "message": "WhatsApp message delivered"}
        return {"success": False, "status": "failed", "message": f"Provider error: {res.get('error') or res.get('status_code')}"}

    async def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        if not phone:
            return {"success": False, "status": "missing_phone", "message": "Parent mobile number not available"}

        digits = re.sub(r"\D", "", phone)
        if len(digits) < 10:
            return {"success": False, "status": "failed", "message": "Invalid phone number format"}

        # If provider credentials are not configured, return unconfigured so fake sent count is never shown
        if not self.sms_api_key or not self.sms_api_url:
            return {
                "success": False,
                "status": "unconfigured",
                "message": "SMS gateway credentials not configured in backend environment variables"
            }

        headers = {
            "Authorization": f"Bearer {self.sms_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "sender": self.sms_sender_id,
            "recipient": f"91{digits[-10:]}",
            "message": message
        }

        res = await asyncio.to_thread(self._sync_http_post, self.sms_api_url, payload, headers)
        if res.get("status_code") in (200, 201):
            return {"success": True, "status": "sent", "message": "SMS message delivered"}
        return {"success": False, "status": "failed", "message": f"Provider error: {res.get('error') or res.get('status_code')}"}

notification_service = NotificationProviderService()
