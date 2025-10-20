from flask import Flask, render_template, Response
import tensorflow as tf
import cv2
import numpy as np
from flask_socketio import SocketIO, emit

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app)

# Load the trained model
model = None
try:
    model = tf.keras.models.load_model('fall_detection_model.h5')
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Please make sure 'fall_detection_model.h5' is in the same directory and is a valid Keras model.")

# Class labels for the model's output
CLASS_LABELS = ['Fall', 'No Fall']

# Persistence check variables
fall_detected_frames = 0
FALL_PERSISTENCE_THRESHOLD = 5  # Number of consecutive frames to confirm a fall

# Video capture from webcam
camera = cv2.VideoCapture(0)
if not camera.isOpened():
    print("Error: Could not open camera.")

def generate_frames():
    """Generator function to capture frames and perform real-time prediction."""
    global fall_detected_frames
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            try:
                # Preprocess the frame for the model
                frame_resized = cv2.resize(frame, (150, 150))
                frame_normalized = frame_resized / 255.0
                frame_expanded = np.expand_dims(frame_normalized, axis=0)
                
                # Make prediction
                prediction = model.predict(frame_expanded)
                prediction_label = CLASS_LABELS[int(round(prediction[0][0]))]
                confidence = prediction[0][0]
                
                # Persistence check for falls
                if prediction_label == 'Fall' and confidence > 0.8: # Adjust confidence as needed
                    fall_detected_frames += 1
                    if fall_detected_frames >= FALL_PERSISTENCE_THRESHOLD:
                        # Draw a red box and text on the frame
                        cv2.rectangle(frame, (5, 5), (300, 70), (0, 0, 255), -1)
                        cv2.putText(frame, 'FALL DETECTED!', (15, 45),
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
                        
                        # Emit a WebSocket event to the frontend
                        socketio.emit('fall_alert', {'message': 'Fall detected!'})
                        
                else:
                    fall_detected_frames = 0
                    
            except Exception as e:
                print(f"Error during prediction: {e}")
                
            # Encode the frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, debug=True)
