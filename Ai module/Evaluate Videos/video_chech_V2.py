import cv2
import numpy as np
import sys
sys.stdout.reconfigure(encoding='utf-8')

import sys
import tempfile

# === Thresholds ===
BRIGHTNESS_MIN = 100
BRIGHTNESS_MAX = 200
CONTRAST_MIN = 40
CONTRAST_MAX = 140
MIN_FACE_RATIO = 0.05  # ~5% of frame
MAX_FACE_RATIO = 0.5   # ~50% of frame
MIN_RES_WIDTH = 848    # Minimum resolution width (720p standard width)
MIN_RES_HEIGHT = 480   # Minimum resolution height (720p standard height)

# === Load Haar Cascade for Face Detection ===
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# === Load Video ===
video_data = sys.stdin.buffer.read()
with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
    f.write(video_data)
    video_path = f.name
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("❌ Error: Could not open video.")
    exit()

# === Get frame size ===
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# === Check resolution with flexible orientation ===
if max(frame_width, frame_height) < MIN_RES_WIDTH or min(frame_width, frame_height) < MIN_RES_HEIGHT:
    resolution_status = f"❌ Resolution too low ({frame_width}x{frame_height})"
else:
    resolution_status = f"✔️ Resolution is acceptable ({frame_width}x{frame_height})"

# === Prepare accumulators ===
brightness_values = []
contrast_values = []
face_detected = False
face_counts = []
face_ratios = []

# === Process video frames ===
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

# === Calculate averages ===
avg_brightness = np.mean(brightness_values) if brightness_values else 0
avg_contrast = np.mean(contrast_values) if contrast_values else 0

brightness_status = "Good" if BRIGHTNESS_MIN <= avg_brightness <= BRIGHTNESS_MAX else "Not Accepted"
contrast_status = "Good" if CONTRAST_MIN <= avg_contrast <= CONTRAST_MAX else "Not Accepted"

# === Face count check ===
multiple_face_frames = sum(1 for count in face_counts if count > 1)
total_frames = len(face_counts)

if total_frames == 0 or all(count == 0 for count in face_counts):
    face_count_status = "❌ No face detected in video"
elif multiple_face_frames / total_frames > 0.1:
    face_count_status = "❌ Multiple faces detected in too many frames"
else:
    face_count_status = "✔️ Only one face detected consistently"

# === Face size check ===
if face_ratios:
    avg_face_ratio = np.mean(face_ratios)
    if MIN_FACE_RATIO <= avg_face_ratio <= MAX_FACE_RATIO:
        face_size_status = f"✔️ Face size is acceptable ({avg_face_ratio:.2%})"
    else:
        face_size_status = f"❌ Face size out of range ({avg_face_ratio:.2%})"
else:
    face_size_status = "❌ No valid face size detected"

# === Final Output ===
issues = []

if not face_detected:
    issues.append("no face was detected")

if "❌" in face_count_status:
    issues.append("more than one face was detected in too many frames")

if "❌" in face_size_status:
    issues.append("face size is not within the acceptable range")

if "❌" in resolution_status:
    issues.append("video resolution is too low")

if brightness_status != "Good":
    issues.append('''brightness is not good .
                  Try to record in natural or well-lit environments for clear videos.''')

if contrast_status != "Good":
    issues.append("contrast is not good")

# === Final Verdict ===
if not issues:
    print("🎉 Video Accepted!")
else:
    print(f"❌ Video Not Accepted because {issues[0]}.")
