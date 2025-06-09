import sys
import tempfile
import cv2
import numpy as np

# === Thresholds ===
BRIGHTNESS_MIN = 100
BRIGHTNESS_MAX = 200
CONTRAST_MIN = 40
CONTRAST_MAX = 140
MIN_FACE_RATIO = 0.05
MAX_FACE_RATIO = 0.5
MIN_RES_WIDTH = 848
MIN_RES_HEIGHT = 480

# === Load Haar Cascade ===
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# === Read binary video from stdin and save to temp file ===
video_data = sys.stdin.buffer.read()
with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
    f.write(video_data)
    video_path = f.name

# === Load Video ===
cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video.")
    sys.exit()

frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
if max(frame_width, frame_height) < MIN_RES_WIDTH or min(frame_width, frame_height) < MIN_RES_HEIGHT:
    resolution_status = f"Resolution too low ({frame_width}x{frame_height})"
else:
    resolution_status = f"Resolution is acceptable ({frame_width}x{frame_height})"

brightness_values = []
contrast_values = []
face_detected = False
face_counts = []
face_ratios = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness_values.append(np.mean(gray))
    contrast_values.append(np.std(gray))

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    face_counts.append(len(faces))

    if len(faces) == 1:
        face_detected = True
        (x, y, w, h) = faces[0]
        face_area = w * h
        frame_area = frame_width * frame_height
        face_ratio = face_area / frame_area
        face_ratios.append(face_ratio)

cap.release()

avg_brightness = np.mean(brightness_values) if brightness_values else 0
avg_contrast = np.mean(contrast_values) if contrast_values else 0

brightness_status = "Good" if BRIGHTNESS_MIN <= avg_brightness <= BRIGHTNESS_MAX else "Not Accepted"
contrast_status = "Good" if CONTRAST_MIN <= avg_contrast <= CONTRAST_MAX else "Not Accepted"

multiple_face_frames = sum(1 for count in face_counts if count > 1)
total_frames = len(face_counts)

if total_frames == 0 or all(count == 0 for count in face_counts):
    face_count_status = "No face detected in video"
elif multiple_face_frames / total_frames > 0.1:
    face_count_status = "Multiple faces detected in too many frames"
else:
    face_count_status = "Only one face detected consistently"

if face_ratios:
    avg_face_ratio = np.mean(face_ratios)
    if MIN_FACE_RATIO <= avg_face_ratio <= MAX_FACE_RATIO:
        face_size_status = f"Face size is acceptable ({avg_face_ratio:.2%})"
    else:
        face_size_status = f"Face size out of range ({avg_face_ratio:.2%})"
else:
    face_size_status = "No valid face size detected"

print("Final Video Quality Report")
print(f"Face Detected: {'Yes' if face_detected else 'No'}")
print(f"Face Count Check: {face_count_status}")
print(f"Face Size Ratio Check: {face_size_status}")
print(f"Resolution Check: {resolution_status}")
print(f"Average Brightness: {avg_brightness:.2f} → {brightness_status}")
print(f"Average Contrast: {avg_contrast:.2f} → {contrast_status}")
