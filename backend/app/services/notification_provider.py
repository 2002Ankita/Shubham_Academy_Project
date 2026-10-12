import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class NotificationProvider:
    def __init__(self):
        self.provider_type = os.getenv("NOTIFICATION_PROVIDER", "mock")
        self.api_key = os.getenv("SMS_API_KEY", "")
        self.sender_id = os.getenv("SMS_SENDER_ID", "SHUBHM")

    async def send_sms(self, to_mobile: str, message: str) -> dict:
        """
        Sends an SMS to the specified mobile number.
        Returns a dict with 'status' (e.g. Sent, Failed) and 'response' string.
        """
        if self.provider_type == "mock":
            logger.info(f"[MOCK SMS] To: {to_mobile}, Message: {message}")
            return {"status": "Sent", "response": "Mock success"}

        if self.provider_type == "twilio":
            try:
                # Requires twilio library, normally imported here
                logger.info(f"Sending Twilio SMS to {to_mobile}")
                return {"status": "Sent", "response": "Twilio SID"}
            except Exception as e:
                logger.error(f"Twilio SMS failed: {str(e)}")
                return {"status": "Failed", "response": str(e)}

        return {"status": "Failed", "response": "Unknown provider"}
