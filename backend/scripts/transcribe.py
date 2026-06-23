import sys, json
from faster_whisper import WhisperModel

def main():
    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None

    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path, language=language, word_timestamps=True)

    result = []
    word_count = 0
    for seg in segments:
        words = []
        if seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "confidence": round(w.probability, 3) if w.probability else 0,
                })
                word_count += 1
        if not words:
            words.append({
                "word": seg.text.strip(),
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "confidence": round(seg.avg_logprob or 0, 3),
            })
        result.append({
            "index": seg.id if hasattr(seg, "id") else len(result),
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
            "words": words,
        })

    print(json.dumps(result))

if __name__ == "__main__":
    main()
