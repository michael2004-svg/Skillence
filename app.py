from flask import Flask, request, jsonify
import requests, base64, datetime, os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

@app.route('/api/stkpush', methods=['POST'])
def stk_push():
    """
    Endpoint for initiating Daraja STK Push
    """
    data = request.get_json()
    phone = data.get('phone')
    amount = data.get('amount', 999)  # Default to 999 if not provided

    if not phone:
        return jsonify({"status": "error", "message": "Phone number is required"}), 400

    try:
        # 1️⃣ Generate access token
        consumer_key = os.getenv("DARAJA_KEY")
        consumer_secret = os.getenv("DARAJA_SECRET")

        auth = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        token_res = requests.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {auth}"}
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return jsonify({"status": "error", "message": "Failed to get access token"}), 500

        # 2️⃣ Generate password and timestamp
        shortcode = os.getenv("SHORTCODE")
        passkey = os.getenv("PASSKEY")
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

        # 3️⃣ Make STK Push request
        stk_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": shortcode,
            "PhoneNumber": phone,
            "CallBackURL": "https://skillence.top/api/stkpush/callback",  # Change this to your real callback URL
            "AccountReference": "ProfXPremium",
            "TransactionDesc": "ProfX Premium Membership"
        }

        stk_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        response = requests.post(stk_url, json=payload, headers=stk_headers)
        result = response.json()

        if "ResponseCode" in result and result["ResponseCode"] == "0":
            return jsonify({"status": "success", "message": "STK Push initiated successfully", "data": result})
        else:
            return jsonify({"status": "error", "message": result.get("errorMessage", "Failed to initiate payment")})

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ✅ Callback URL to receive Daraja payment confirmation
@app.route('/api/stkpush/callback', methods=['POST'])
def stk_callback():
    callback_data = request.get_json()
    print("📩 Callback Received:", callback_data)

    # You can save this data to a database or confirm payment status here
    return jsonify({"ResultCode": 0, "ResultDesc": "Callback received successfully"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)