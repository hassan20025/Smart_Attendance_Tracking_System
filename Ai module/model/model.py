import cv2
import os
import time
import pickle
import csv
import torch
import numpy as np
from PIL import Image, ImageFont, ImageDraw
from torchvision import transforms
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from scipy.spatial.distance import cosine
import logging
import yaml
import sys
import io
import csv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load YAML configuration
with open("D:/Graduation project/Attendace system Wesite/Ai module/model/config(avg).yaml", "r") as f:
    ## D:/Graduation project/Attendace system Wesite/Ai module/model/config(avg).yaml
    CONFIG = yaml.safe_load(f)

def hex_to_bgr(hex_color):
    """Convert hex color to BGR tuple"""
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return (b, g, r)

# Convert yolo_input_size list to tuple
CONFIG["yolo_input_size"] = tuple(CONFIG["yolo_input_size"])
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logging.info(f"Device: {device}")

def load_models():
    """Load YOLOv11 and FaceNet"""
    try:
        yolo = YOLO(CONFIG["model_paths"]["yolo"]).eval()
        facenet = InceptionResnetV1(pretrained='vggface2').eval()
        facenet.to(device)
        return yolo, facenet, device
    except Exception as e:
        logging.error(f"Error loading models: {e}")
        raise
def detect_faces(frame, model):
    """Detect faces using YOLO"""
    try:
        results = model(frame)
        boxes = []
        for result in results[0].boxes:
            x1, y1, x2, y2 = map(int, result.xyxy[0])
            conf = float(result.conf[0])
            cls = int(result.cls[0])
            if conf > CONFIG["detection_threshold"] and cls == 0:  # Class 0 = Person
                boxes.append((x1, y1, x2, y2))
        return boxes
    except Exception as e:
        logging.error(f"Error detecting faces: {e}")
        return []
def extract_embeddings(face_imgs, model, device):
    """Extract 512D embeddings from multiple face images (batch processing)"""
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((160, 160)),
        transforms.Normalize([0.5] * 3, [0.5] * 3)
    ])
    
    if not face_imgs:  # Handle empty face_imgs case
        logging.debug("No face images provided for embedding extraction")
        return np.array([])  # Return empty NumPy array
    
    try:
        tensors = torch.stack([transform(Image.fromarray(face_img)) for face_img in face_imgs]).to(device)
        with torch.no_grad():
            embs = model(tensors)
        embs = embs / embs.norm(p=2, dim=1, keepdim=True)
        return embs.cpu().numpy()  # Still return NumPy array for compatibility
    except Exception as e:
        logging.error(f"Error extracting embeddings: {e}")
        return np.array([])  # Return empty NumPy array on error
def get_similarity_scores(embedding, stored, device):
    """Compare new embedding with each person's stored embeddings using GPU"""
    similarities = {}
    embedding_tensor = torch.tensor(embedding, dtype=torch.float32, device=device)
    embedding_tensor = embedding_tensor / embedding_tensor.norm(p=2, dim=-1, keepdim=True)
    
    for name, embeds in stored.items():
        embeds_tensor = torch.tensor(embeds, dtype=torch.float32, device=device)
        embeds_tensor = embeds_tensor / embeds_tensor.norm(p=2, dim=-1, keepdim=True)
        scores = torch.matmul(embeds_tensor, embedding_tensor).cpu().numpy()
        similarities[name] = round(float(np.mean(scores)), 4)
    
    return similarities
def draw_image_box(frame, x1, y1, x2, y2, name, box_img):
    """Draw bounding box and label on frame"""
    box_width, box_height = x2 - x1, y2 - y1
    overlay_image_alpha(frame, box_img, x1, y1, (box_width, box_height))

    try:
        person_name, student_id = name.split("_", 1)
    except ValueError:
        person_name, student_id = name, "N/A"

    label = f"Name: {person_name}\nID: {student_id}"

    font_path = CONFIG["model_paths"].get("font_path", "")
    try:
        font = ImageFont.truetype(font_path, 20)
    except Exception:
        logging.warning("Font not found. Falling back to default.")
        font = ImageFont.load_default()

    img_pil = Image.fromarray(frame)
    draw = ImageDraw.Draw(img_pil)

    lines = label.split("\n")
    line_height = 25
    total_text_height = len(lines) * line_height
    label_x, label_y = x1, y1 - total_text_height - 1

    hex_color = CONFIG["label_color"]
    label_color = tuple(int(hex_color[i:i+2], 16) for i in (1, 3, 5))

    for i, line in enumerate(lines):
        draw.text((label_x, label_y + i * line_height), line, font=font, fill=label_color)

    return np.array(img_pil)
def overlay_image_alpha(background, overlay, x, y, overlay_size=None):
    """Draw image with transparency"""
    if overlay_size:
        overlay = cv2.resize(overlay, overlay_size)
    h, w = overlay.shape[:2]
    if y + h > background.shape[0] or x + w > background.shape[1]:
        return
    overlay_img = overlay[:, :, :3]
    mask = overlay[:, :, 3:] / 255.0
    background_crop = background[y:y+h, x:x+w]
    background[y:y+h, x:x+w] = (1 - mask) * background_crop + mask * overlay_img
def initialize_csv(stored_embeddings):
    """Create CSV with all students marked as Absent"""
    csv_data = []
    date = time.strftime("%Y-%m-%d")
    for name in stored_embeddings.keys():
        csv_data.append([name, "Absent", date, ""])
    return csv_data
def get_csv_filename():
    """Generate CSV filename based on session time"""
    now = time.localtime()
    hour = now.tm_hour
    if hour == 0:  # Midnight: belongs to previous day's 11PM-12:59AM block
        prev_day = time.localtime(time.mktime(now) - 86400)
        date_str = time.strftime("%Y-%m-%d", prev_day)
        start_hour = 23
    else:
        date_str = time.strftime("%Y-%m-%d", now)
        if hour % 2 == 0:
            start_hour = hour - 1
        else:
            start_hour = hour
    am_pm = "AM" if start_hour < 12 else "PM"
    display_hour = start_hour if start_hour <= 12 else start_hour - 12
    if display_hour == 0:
        display_hour = 12
    return f"{date_str}_session_{display_hour}{am_pm}.csv"
def log_attendance(name, attendance_logged, csv_data):
    """Mark student as present in CSV if not already marked"""
    if name == "Unknown":
        return
    if name in attendance_logged:
        return
    date, clock = time.strftime("%Y-%m-%d"), time.strftime("%H:%M:%S")
    for row in csv_data:
        if row[0] == name:
            row[1] = "Attend"
            row[2] = date
            row[3] = clock
    attendance_logged.add(name)
    logging.info(f"[{date} {clock}] Marked: {name}")


def save_csv(filename, csv_data):
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(csv_data)


def run_attendance_session():
    """Main function to run the attendance session with only camera feed and smaller FPS"""
    yolo, facenet, device = load_models()

    with open(CONFIG["model_paths"]["embeddings"], "rb") as f:
        stored_embeddings = pickle.load(f)

    box_img = cv2.imread(CONFIG["model_paths"]["box_img"], cv2.IMREAD_UNCHANGED)

    vote_tracker = {}
    attendance_logged = set()
    csv_data = initialize_csv(stored_embeddings)

    ### Hikvision
    """
    # Initialize RTSP camera
    rtsp_url = "rtsp://admin:Starthassan%402002@192.168.1.64/Streaming/Channels/101"
    cap = cv2.VideoCapture(rtsp_url)

    if not cap.isOpened():
        logging.error("Could not open camera. Check RTSP URL or camera connection.")
        return
    # Use native camera resolution
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 4)
    """
####

#### webcam
    cap = cv2.VideoCapture(0)  
    if not cap.isOpened():
        logging.error("Could not open webcam. Please check your device connection.")
        return
####

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    logging.info(f"Camera resolution: {width}x{height}")

    # Create window with normal size
    cv2.namedWindow("Face Attendance", cv2.WINDOW_NORMAL)

    # Optional: Set a fixed display size (uncomment to use)
    # display_width, display_height = 1280, 720
    # cv2.resizeWindow("Face Attendance", display_width, display_height)

    yolo_input_width, yolo_input_height = CONFIG["yolo_input_size"]
    session_start_time = time.time()
    logging.info("Press 'q' to end session.")

    try:
        while True:
            # Check session timeout
            elapsed_time = time.time() - session_start_time
            if elapsed_time > CONFIG["session_timeout"]:
                logging.info(f"Session timeout reached ({CONFIG['session_timeout']} seconds). Exiting session...")
                break

            # Capture frame
            ret, frame = cap.read()
            if not ret:
                logging.warning("Failed to read frame from camera")
                continue

            start_time = time.time()  # Start time for FPS calculation
            logging.debug(f"Frame shape: {frame.shape}")

            # Resize frame for YOLO while preserving aspect ratio
            orig_width, orig_height = frame.shape[1], frame.shape[0]
            yolo_frame = cv2.resize(frame, (yolo_input_width, yolo_input_height))

            # Detect faces on resized frame
            boxes = detect_faces(yolo_frame, yolo)

            # Scale bounding boxes back to original frame size
            scale_x = orig_width / yolo_input_width
            scale_y = orig_height / yolo_input_height
            boxes = [(int(x1 * scale_x), int(y1 * scale_y), int(x2 * scale_x), int(y2 * scale_y))
                     for x1, y1, x2, y2 in boxes]

            # Extract face images from original frame
            face_imgs = []
            for x1, y1, x2, y2 in boxes:
                face = frame[max(0, y1):y2, max(0, x1):x2]
                if face.size == 0:
                    continue
                face_imgs.append(face)

            # Extract embeddings
            embeddings = extract_embeddings(face_imgs, facenet, device)

            if len(embeddings) > 0:
                for i, (x1, y1, x2, y2) in enumerate(boxes):
                    embedding = embeddings[i]
                    similarities = get_similarity_scores(embedding, stored_embeddings, device)

                    logging.info("\n--- Face Detected ---")
                    for name, score in sorted(similarities.items(), key=lambda x: x[1], reverse=True):
                        logging.info(f"{name}: {score:.4f}")

                    best_match = max(similarities, key=similarities.get)
                    best_score = similarities[best_match]

                    if best_score >= CONFIG["similarity_threshold"]:
                        vote_tracker[best_match] = vote_tracker.get(best_match, 0) + 1
                        if vote_tracker[best_match] >= CONFIG["frame_threshold"]:
                            log_attendance(best_match, attendance_logged, csv_data)

                    name = best_match if best_score >= CONFIG["similarity_threshold"] else "Unknown"
                    frame = draw_image_box(frame, x1, y1, x2, y2, name, box_img)

            # Draw smaller FPS on the frame
            end_time = time.time()
            fps = 1 / (end_time - start_time)
            cv2.putText(frame, f"FPS: {fps:.2f}", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            #  Resize frame for display (uncomment )
            # frame = cv2.resize(frame, (display_width, display_height))

            # Display the raw camera feed with bounding boxes, labels, and FPS
            cv2.imshow("Face Attendance", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == ord('Q'):
                logging.info("Exit key 'Q' pressed. Exiting session...")
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()

        session_end_time = time.time()
        duration = time.strftime("%H:%M:%S", time.gmtime(session_end_time - session_start_time))
        csv_data.append(["Total Duration", "", "", "", duration])

        csv_file = get_csv_filename()
        with open(csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            data_rows = [row for row in csv_data if row[1] != "" and row[1] != "N/A"]
            footer_rows = [row for row in csv_data if row[1] == "" or row[1] == "N/A"]
            data_rows.sort(key=lambda x: x[1])
            writer.writerow(["Student Name", "ID", "Status", "Date", "Time"])
            for row in data_rows:
                name, student_id = row[0].split("_", 1) if "_" in row[0] else (row[0], "N/A")
                writer.writerow([name, student_id, row[1], row[2], row[3]])
            writer.writerows(footer_rows)
            
            if(output.getargvalues(frame) is None):
                output = io.StringIO()
                print(output.getvalue())  # send CSV data to stdout
            
        return output.getvalue()

        
        
if __name__ == "__main__":
    run_attendance_session()
