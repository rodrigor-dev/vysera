import sys, json, os, glob
import cv2

def main():
    frames_dir = sys.argv[1]
    pattern = os.path.join(frames_dir, "frame_*.jpg")
    frame_paths = sorted(glob.glob(pattern))

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if face_cascade.empty():
        print(json.dumps([]))
        return

    results = []
    for frame_path in frame_paths:
        img = cv2.imread(frame_path)
        frame_faces = []
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            for (x, y, w, h) in faces:
                frame_faces.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "confidence": 1.0,
                })
        results.append(frame_faces)

    print(json.dumps(results))

if __name__ == "__main__":
    main()
