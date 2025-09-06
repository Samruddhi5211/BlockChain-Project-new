import json
import cv2
import numpy as np
import mediapipe as mp
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load Aadhaar data
aadhaar_file = "aadhaarData.json"
if not os.path.exists(aadhaar_file):
    with open(aadhaar_file, "w") as f:
        json.dump({}, f)

with open(aadhaar_file, "r") as f:
    aadhaar_data = json.load(f)

# Initialize MediaPipe Face Mesh for iris detection
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, refine_landmarks=True, max_num_faces=1)

# Function to extract iris features
def extract_iris(image):
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)

    if not results.multi_face_landmarks:
        print("⚠️ No face detected in the image.")
        return None  # No face detected

    face_landmarks = results.multi_face_landmarks[0]
    num_landmarks = len(face_landmarks.landmark)

    print(f"✅ Detected {num_landmarks} face landmarks.")

    # Use landmarks that exist in all MediaPipe versions
    left_iris_center = 468 if num_landmarks > 468 else None
    left_iris_side = 473 if num_landmarks > 473 else None
    right_iris_center = 474 if num_landmarks > 474 else None  # Alternative to 476
    right_iris_side = 475 if num_landmarks > 475 else None    # Alternative to 481

    if None in [left_iris_center, left_iris_side, right_iris_center, right_iris_side]:
        print(f"❌ Not enough iris landmarks detected. Only {num_landmarks} landmarks found.")
        return None

    try:
        # Extract available iris landmarks
        iris_points = [
            face_landmarks.landmark[left_iris_center],  # Left iris center
            face_landmarks.landmark[left_iris_side],    # Left iris side
            face_landmarks.landmark[right_iris_center], # Right iris center (alternative to 476)
            face_landmarks.landmark[right_iris_side]    # Right iris side (alternative to 481)
        ]

        iris_features = [(p.x, p.y) for p in iris_points]
        print(f"✅ Extracted iris features: {iris_features}")
        return np.array(iris_features).flatten().tolist()

    except IndexError as e:
        print(f"❌ Index error in extracting iris: {e}")
        return None

# Function to decode base64 image
def decode_base64_image(base64_string):
    try:
        image_data = base64.b64decode(base64_string.split(",")[1])  # Remove prefix
        np_arr = np.frombuffer(image_data, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print("Error decoding image:", e)
        return None

# Register Iris Route
@app.route("/register-iris", methods=["POST"])
def register_iris():
    try:
        data = request.get_json()
        aadhaar = data.get("aadhaar")
        image_base64 = data.get("irisImage")

        if not aadhaar or not image_base64:
            return jsonify({"error": "Missing Aadhaar number or iris image"}), 400

        print("Decoding image...")
        image = decode_base64_image(image_base64)
        if image is None:
            return jsonify({"error": "Invalid image format"}), 400

        print("Extracting iris features...")
        iris_features = extract_iris(image)

        if not iris_features:
            return jsonify({"error": "Iris scan failed"}), 400

        if aadhaar in aadhaar_data:
            stored_iris = aadhaar_data[aadhaar]["irisData"]

            # Compare extracted iris with stored iris data (with a tolerance of 0.05)
            if np.allclose(iris_features, stored_iris, atol=0.05):
                print("✅ Iris data matches with stored data. Registration successful!")
                return jsonify({"message": "Iris registration successful!"}), 200
            else:
                print("❌ Iris data does not match stored data. Registration failed!")
                return jsonify({"error": "Iris data does not match stored records"}), 400
        else:
            print("❌ Aadhaar number not found in the database.")
            return jsonify({"error": "Aadhaar number not found"}), 400

    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500

# Login Iris Route
@app.route("/login-iris", methods=["POST"])
def login_iris():
    try:
        data = request.get_json()
        aadhaar = data.get("aadhaar")
        image_base64 = data.get("irisImage")

        if aadhaar not in aadhaar_data:
            return jsonify({"error": "Invalid Aadhaar number"}), 400

        image = decode_base64_image(image_base64)
        if image is None:
            return jsonify({"error": "Invalid image format"}), 400

        iris_features = extract_iris(image)
        if not iris_features:
            return jsonify({"error": "Iris scan failed"}), 400

        stored_iris = aadhaar_data[aadhaar]["irisData"]
        print(f"Stored iris data for Aadhaar {aadhaar}: {stored_iris}")
        print(f"Extracted iris data: {iris_features}")
        # Compare extracted iris with stored iris data (with a tolerance of 0.05)
        if np.allclose(iris_features, stored_iris, atol=0.09):
            print("✅ Login successful! Iris matches stored data.")
            return jsonify({"message": "Login successful!"}), 200
        else:
            print("❌ Login failed! Iris does not match stored data.")
            return jsonify({"error": "Iris scan failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)
