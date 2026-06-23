import sys, json
import cv2

def main():
    image_path = sys.argv[1]
    img = cv2.imread(image_path)
    if img is None:
        print(json.dumps([]))
        return

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    results = []
    for (x, y, w, h) in faces:
        results.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "confidence": 1.0,
        })

    print(json.dumps(results))

if __name__ == "__main__":
    main()
