
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv
import requests
import tempfile
import base64
import os

# Load API keys
load_dotenv()

app = Flask(__name__)
CORS(app)

# API clients
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MURF_API_KEY = os.getenv("MURF_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing in Environment settings")

client = genai.Client(api_key=GEMINI_API_KEY)

print("Gemini key loaded:", bool(GEMINI_API_KEY))

# Frontend folder path
FRONTEND_FOLDER = os.path.abspath("../Frontend")


# Prompts for historical descriptions
PROMPTS = {
    "Summary": """
You are a professional tourist guide.

Provide a high-level overview of "{place}" in {language}.

Focus on:
- Historical significance
- Why the place is famous
- Architectural and cultural highlights

Keep the explanation concise and easy to understand.
Limit the response to around 200 words.
Respond ONLY in {language}.
""",

    "Detailed": """
You are a professional tourist guide.

Provide a detailed explanation of "{place}" in {language}.

Cover:
- Historical background and timeline
- Architectural design and unique features
- Cultural importance and notable events
- Interesting facts and visitor information

Explain everything clearly in a storytelling style.
Limit the response to around 400 words.
Respond ONLY in {language}.
"""
}


# Home page
@app.route("/")
def home():
    return send_from_directory(
        FRONTEND_FOLDER,
        "index.html"
    )


# JavaScript file
@app.route("/index.js")
def javascript():
    return send_from_directory(
        FRONTEND_FOLDER,
        "index.js"
    )


# Generate historical description using Gemini
def generate_description(place, answer_type, language):

    if answer_type not in PROMPTS:
        answer_type = "Summary"

    prompt = PROMPTS[answer_type].format(
        place=place,
        language=language
    )

    
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt
    )


    if not response.text:
        raise Exception("Gemini did not return a description.")

    return response.text


# Generate speech using Murf AI Falcon
def generate_speech(text, voice_id, locale):

    url = "https://global.api.murf.ai/v1/speech/stream"

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "voice_id": voice_id,
        "text": text,
        "locale": locale,
        "model": "FALCON",
        "format": "MP3",
        "sampleRate": 24000,
        "channelType": "MONO"
    }

    response = requests.post(
        url,
        headers=headers,
        json=data,
        stream=True,
        timeout=120
    )

    if response.status_code != 200:
        error_message = response.text
        response.close()
        raise Exception(
            f"Murf API error {response.status_code}: "
            f"{error_message}"
        )

    temp_audio = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )

    try:
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                temp_audio.write(chunk)
    finally:
        temp_audio.close()
        response.close()

    return temp_audio.name


# Main API: generate text and audio
@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():

    audio_path = None

    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "error": "Please send valid JSON data."
            }), 400

        place = data.get("place", "").strip()
        answer_type = data.get("answerType", "Summary")
        language = data.get("language", "English")
        voice_id = data.get("voiceId")
        locale = data.get("locale")

        if not place:
            return jsonify({
                "error": "Please select a destination."
            }), 400

        if not voice_id or not locale:
            return jsonify({
                "error": "Voice ID or language locale is missing."
            }), 400

        # Step 1: Generate historical text
        text_description = generate_description(
            place,
            answer_type,
            language
        )

        # Step 2: Convert text to audio
        audio_path = generate_speech(
            text_description,
            voice_id,
            locale
        )

        # Step 3: Read audio file
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        # Step 4: Encode audio as Base64
        encoded_audio = base64.b64encode(
            audio_bytes
        ).decode("utf-8")

        # Step 5: Return text and audio to frontend
        return jsonify({
            "description": text_description,
            "audioBase64": encoded_audio,
            "place": place,
            "answerType": answer_type,
            "language": language
        })

    except Exception as e:
        print("Generation error:", str(e))

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except OSError:
                pass


# Run Flask
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        debug=False
    )