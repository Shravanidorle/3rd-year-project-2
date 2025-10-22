from flask import Flask, render_template, Response
import tensorflow as tf
import cv2
import numpy as np
from flask_socketio import SocketIO, emit
import atexit # Added for cleanup
import time # Added to track time for duration limit

# --- CONFIGURATION CONSTANTS ---
# Set the maximum duration for the video stream (in seconds)
STREAM_DURATION_SECONDS = 30 
# -------------------------------

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app)

# Load the trained model
model = None
try:
    # Ensure the model is loaded when the script starts
    model = tf.keras.models.load_model('fall_detection_model.h5')
    print("Model loaded successfully!")
    # Check model output shape for debugging
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Please make sure 'fall_detection_model.h5' is in the same directory and is a valid Keras model.")

# Class labels for the model's output
# Since you are using round(prediction[0][0]), this implies a single output neuron (binary classification)
CLASS_LABELS = ['Fall', 'No Fall'] # ASSUMPTION: 'Fall' = 0, 'No Fall' = 1 (if model output is 0 or 1)
# If your model output is the probability of 'No Fall', then:
# CLASS_LABELS = ['No Fall', 'Fall'] # 'No Fall' = 0, 'Fall' = 1

# Persistence check variables
fall_detected_frames = 0
FALL_PERSISTENCE_THRESHOLD = 5  # Number of consecutive frames to confirm a fall

# Video capture from webcam
camera = cv2.VideoCapture(0)
if not camera.isOpened():
    print("Error: Could not open camera.")

# Cleanup function (BEST PRACTICE)
@atexit.register
def shutdown_camera():
    if camera and camera.isOpened():
        camera.release()
        print("Camera released on shutdown.")

def generate_frames():
    """Generator function to capture frames and perform real-time prediction."""
    global fall_detected_frames
    
    # --- START TIMER ---
    start_time = time.time()
    
    while True:
        
        # --- DURATION CHECK ---
        if time.time() - start_time > STREAM_DURATION_SECONDS:
            print(f"Stream duration limit of {STREAM_DURATION_SECONDS} seconds reached. Stopping stream.")
            break
        # ----------------------
        
        success, frame = camera.read()
        if not success:
            break
        else:
            try:
                # --- Preprocessing (Must match training data exactly) ---
                frame_resized = cv2.resize(frame, (150, 150))
                frame_normalized = frame_resized / 255.0
                frame_expanded = np.expand_dims(frame_normalized, axis=0)
                
                # Make prediction
                prediction = model.predict(frame_expanded, verbose=0)
                
                # Assuming single output neuron (e.g., probability of class 1)
                # The raw output is prediction[0][0]
                raw_confidence = prediction[0][0]
                
                # Determine predicted index and label
                # Since you are using round(), we assume anything > 0.5 rounds to 1, and <= 0.5 rounds to 0
                predicted_index = int(round(raw_confidence))
                prediction_label = CLASS_LABELS[predicted_index]
                
                # --- DEBUGGING OUTPUT ---
                print(f"RAW PREDICTION: {raw_confidence:.4f} | LABEL: {prediction_label} | ROUNDED INDEX: {predicted_index}")
                # ------------------------
                
                # Persistence check for falls
                
                # TEMPORARY LOGIC CHANGE: Check for ANY prediction to the 'Fall' label
                if predicted_index == 0: # This means the model predicted 'Fall' based on the round() function
                    
                    fall_detected_frames += 1

                    if fall_detected_frames >= FALL_PERSISTENCE_THRESHOLD:
                        # Draw a red box and text on the frame
                        cv2.rectangle(frame, (50, 50), (450, 120), (0, 0, 255), -1)
                        cv2.putText(frame, f'FALL DETECTED! ({raw_confidence:.2f})', (70, 95),
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                        
                        # Emit a WebSocket event to the frontend
                        # FIX: Removed broadcast=True and namespace='/' to fix the keyword argument error
                        socketio.emit('fall_alert', {'message': 'Fall detected in Room 101!'})
                        
                    # Keep the persistence counter running, do not reset it until a 'No Fall' is seen
                else:
                    fall_detected_frames = 0
                        
            except Exception as e:
                # IMPORTANT: Print the actual error object to the console, not a static string
                print(f"Error during prediction: {e}")
                
            # Encode the frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            
            yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    # RENDER THE INDEX FILE
    return render_template('index.html')

@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/services.html')
def services():
    return render_template('services.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# We must run the socketio app on the main thread for the cleanup function to work reliably.
# You need to manually handle SocketIO in your local environment.
# The flask run or python app.py should execute socketio.run(app, debug=True)
if __name__ == '__main__':
    socketio.run(app, debug=True)
