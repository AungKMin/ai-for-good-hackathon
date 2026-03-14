
import streamlit as st
import requests
from huggingface_hub import InferenceClient
from gtts import gTTS
import tempfile
import os
import json
from transformers import pipeline
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")

# Set your Hugging Face API key here or use environment variable
HF_API_KEY = os.getenv("HF_API_KEY")
client = InferenceClient(token=HF_API_KEY)

st.set_page_config(page_title="FactoryAssist - Visual Instruction Assistant")
st.title("FactoryAssist - Visual Instruction Assistant")

st.write("""
Enter a factory supervisor instruction. This app will break it down into simple steps with images and audio for easy understanding.
""")

# --- Functions ---
def generate_steps(instruction):
    """
    Sends the instruction to a Hugging Face LLM and returns steps in the required JSON format.
    """
    prompt = f"""
You are an assistant that helps convert factory supervisor instructions into simple steps for low literacy workers. 
Break the following instruction into simple steps. For each step, provide:
- step_instruction: a simple instruction sentence
- image_query: a short phrase to search for a relevant image
- audio_text: a simple spoken version of the instruction
Respond with only valid JSON and nothing else, in the following format:
{{
    "steps": [
        {{
            "step_instruction": "Put boxes on pallet",
            "image_query": "warehouse worker stacking boxes on pallet",
            "audio_text": "Put the boxes on the pallet"
        }},
        {{
            "step_instruction": "Move pallet to storage",
            "image_query": "worker moving pallet in warehouse",
            "audio_text": "Move the pallet to the storage area"
        }}
    ]
}}
Instruction: {instruction}
"""
    try:
        # Call local Ollama API
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": 500}
            },
            timeout=120
        )
        if response.status_code != 200:
            st.error(f"Ollama API error: {response.status_code} - {response.text}")
            return []
        result = response.json()
        content = result.get("response", "")
        # Try extracting a JSON object from it
        start = content.find("{")
        end = content.rfind("}") + 1
        if start == -1 or end == -1:
            st.error("Could not extract JSON — model response missing braces.")
            st.write(content)
            return []
        json_str = content[start:end]
        try:
            data = json.loads(json_str)
            return data.get("steps", [])
        except Exception as e:
            st.error(f"Error parsing JSON from Ollama: {e}")
            st.write("Raw model output:")
            st.code(content)
            return []
    except Exception as e:
        import traceback
        st.error(f"Error calling Ollama: {e}")
        st.write(traceback.format_exc())
        return []


# --- Pixabay API for image search ---
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")  # Set your Pixabay API key as an environment variable
print(PIXABAY_API_KEY)  # Debug: check if API key is loaded
def get_image(query):
    if not PIXABAY_API_KEY:
        print("Pixabay API key missing")
        return "https://via.placeholder.com/600x400?text=No+Image+Available"

    try:
        resp = requests.get(
            "https://pixabay.com/api/",
            params={
                "key": PIXABAY_API_KEY,
                "q": query,
                "image_type": "photo",
                "safesearch": "true",
                "per_page": 3
            },
            timeout=10
        )
        data = resp.json()
        print("Pixabay API response:", data)  # <- debug
        if data.get("hits"):
            return data["hits"][0]["webformatURL"]
        else:
            print(f"No images found for query: {query}")
            return "https://via.placeholder.com/600x400?text=No+Image+Found"
    except Exception as e:
        print("Pixabay API error:", e)
        return "https://via.placeholder.com/600x400?text=Image+Error"

def generate_audio(text):
    """
    Generates audio from text using gTTS and returns the file path.
    """
    tts = gTTS(text)
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    tts.save(tmp_file.name)
    return tmp_file.name

# --- UI ---
instruction = st.text_area("Enter factory instruction:", height=100)
if st.button("Generate Steps"):
    if not instruction.strip():
        st.warning("Please enter an instruction.")
    else:
        with st.spinner("Generating steps..."):
            steps = generate_steps(instruction)
        if not steps:
            st.error("No steps generated. Please try again.")
        else:
            # Only display steps that are dicts; skip malformed outputs silently
            for idx, step in enumerate([s for s in steps if isinstance(s, dict)], 1):
                st.markdown(f"### Step {idx}: {step.get('step_instruction', str(step))}")
                img_url = get_image(step.get('image_query', 'factory worker'))
                st.image(img_url, caption=step.get('image_query', ''), width=700)
                audio_file = generate_audio(step.get('audio_text', ''))
                with open(audio_file, "rb") as f:
                    st.audio(f.read(), format="audio/mp3")
                os.remove(audio_file)