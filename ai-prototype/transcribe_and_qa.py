#!/usr/bin/env python3
import os
import requests
import subprocess
import tempfile
import json
from datetime import datetime

class VideoTester:
    def __init__(self):
        # API key is read from the environment — never hard-code it.
        # Export AI_API_KEY, or copy .env.example to .env and load it before running.
        self.api_key = os.environ.get("AI_API_KEY", "")
        self.base_url = "https://api.mistral.ai/v1"
        self.transcript = ""
        if not self.api_key:
            print("⚠️  AI_API_KEY is not set. See README / .env.example.")
        
    def extract_audio(self, video_path):
        print(f"🎵 Extracting audio from: {video_path}")
        audio_path = tempfile.mktemp(suffix=".mp3")
        cmd = ["ffmpeg", "-i", video_path, "-vn", "-acodec", "mp3", "-ar", "16000", "-y", audio_path]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ FFmpeg error: {result.stderr}")
            return None
            
        if os.path.exists(audio_path):
            file_size = os.path.getsize(audio_path)
            print(f"✅ Audio extracted: {file_size/1024/1024:.1f}MB")
            return audio_path
        else:
            print("❌ Audio file not created")
            return None
    
    def transcribe(self, audio_path):
        print("🎤 Transcribing with Voxtral...")
        
        # Try different model names in order of preference
        models_to_try = [
            'voxtral-mini-2507',      # Transcription optimized
            'voxtral-small',          # Alternative name
            'voxtral-mini',           # Short name
            'whisper-large-v3'        # Fallback
        ]
        
        for model_name in models_to_try:
            print(f"🔄 Trying model: {model_name}")
            
            try:
                with open(audio_path, 'rb') as f:
                    files = {
                        'file': (os.path.basename(audio_path), f, 'audio/mpeg'),
                        'model': (None, model_name),
                        'language': (None, 'ar'),
                        'response_format': (None, 'json')
                    }
                
                    response = requests.post(
                        f"{self.base_url}/audio/transcriptions",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        files=files,
                        timeout=300
                    )
                
                print(f"📡 API Response: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    transcript = result.get('text', '').strip()
                    
                    if transcript:
                        print(f"✅ Success with {model_name}! Length: {len(transcript)} chars")
                        return transcript
                    else:
                        print(f"❌ Empty transcript with {model_name}")
                        continue
                        
                elif response.status_code == 400:
                    error_data = response.json()
                    print(f"❌ Model {model_name} error: {error_data.get('message', 'Unknown error')}")
                    continue  # Try next model
                    
                else:
                    print(f"❌ API Error {response.status_code} with {model_name}")
                    print(f"Response: {response.text}")
                    continue  # Try next model
                    
            except Exception as e:
                print(f"❌ Error with {model_name}: {str(e)}")
                continue  # Try next model
        
        print("❌ All models failed")
        return ""
    
    def save_transcript(self, video_path, transcript):
        # Create JSON file with transcript
        data = {
            "video_file": os.path.basename(video_path),
            "timestamp": datetime.now().isoformat(),
            "transcript_length": len(transcript),
            "transcript": transcript
        }
        
        json_filename = f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Transcript saved to: {json_filename}")
        return json_filename
    
    def ask(self, question):
        if not self.transcript:
            return "❌ No transcript available"
            
        print("🤔 Thinking...")
        
        try:
            data = {
                "model": "mistral-large-latest",
                "messages": [
                    {
                        "role": "system", 
                        "content": "أنت مساعد ذكي. أجب على الأسئلة بناءً فقط على النص المرفق. لا تضيف معلومات من خارج النص. إذا كان السؤال عن قوانين أو معادلات، اذكر فقط ما قيل بالضبط في النص - سواء كان بالعربية أو الإنجليزية كما ذُكر."
                    },
                    {
                        "role": "user", 
                        "content": f"النص الكامل للفيديو:\n{self.transcript}\n\nالسؤال: {question}\n\nمهم جداً: أجب فقط بناءً على ما ذُكر في النص أعلاه. لا تضيف معلومات أو قوانين من مصادر أخرى."
                    }
                ],
                "temperature": 0.3  # Lower temperature for more accurate responses
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}", 
                    "Content-Type": "application/json"
                },
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                return f"❌ API Error: {response.status_code}"
                
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    def process(self, video_path):
        # Check if video file exists
        if not os.path.exists(video_path):
            print(f"❌ Video file not found: {video_path}")
            return False
            
        # Extract audio
        audio_path = self.extract_audio(video_path)
        if not audio_path:
            print("❌ Failed to extract audio")
            return False
            
        # Transcribe
        self.transcript = self.transcribe(audio_path)
        
        # Clean up audio file
        try:
            os.remove(audio_path)
            print("🗑️ Temporary audio file deleted")
        except:
            pass
        
        if self.transcript:
            print("\n" + "="*60)
            print("📝 FULL TRANSCRIPT:")
            print("="*60)
            print(self.transcript)
            print("="*60)
            
            # Save to JSON
            json_file = self.save_transcript(video_path, self.transcript)
            
            print(f"\n✅ Processing complete!")
            print(f"📊 Stats: {len(self.transcript)} chars, {len(self.transcript.split())} words")
            
            return True
        else:
            print("❌ No transcript generated")
            return False

def main():
    print("🤖 Voxtral Video Tester")
    print("="*40)
    
    tester = VideoTester()
    
    video_path = input("📹 Enter video file path: ").strip().strip('"\'')
    
    if not video_path:
        print("❌ No video path provided")
        return
    
    print(f"\n🚀 Processing: {os.path.basename(video_path)}")
    
    if tester.process(video_path):
        print(f"\n💬 Ask questions about the video (type 'quit' to exit):")
        
        while True:
            try:
                question = input(f"\n❓ Your question: ").strip()
                
                if not question:
                    continue
                    
                if question.lower() in ['quit', 'exit', 'q', 'خروج']:
                    print("👋 Goodbye!")
                    break
                
                answer = tester.ask(question)
                print(f"\n🤖 Answer:\n{answer}")
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    else:
        print("❌ Processing failed")

if __name__ == "__main__":
    main()