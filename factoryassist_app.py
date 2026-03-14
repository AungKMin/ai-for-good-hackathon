
import streamlit as st
from huggingface_hub import InferenceClient
from gtts import gTTS
import tempfile
import os
import json
from transformers import pipeline

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
Return the result as a JSON object with a 'steps' key, as in this example:
{{
 "steps":[
  {{
   "step_instruction":"Put boxes on pallet",
   "image_query":"warehouse worker stacking boxes on pallet",
   "audio_text":"Put the boxes on the pallet"
  }},
  {{
   "step_instruction":"Move pallet to storage",
   "image_query":"worker moving pallet in warehouse",
   "audio_text":"Move the pallet to the storage area"
  }}
 ]
}}
Instruction: {instruction}
"""
    try:
        # Use the chat/conversational API
        response = client.chat(
            pipe = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.2"),
            response = pipe(prompt, max_new_tokens=300),
            messages=[{"role": "user", "content": prompt}],
            max_new_tokens=300,
        )
        # Extract generated text
        content = response.generated_text

        # Extract JSON from response
        start = content.find("{")
        end = content.rfind("}") + 1
        if start == -1 or end == -1:
            st.error("Could not extract JSON — model response missing braces.")
            st.write(content)
            return []

        json_str = content[start:end]
        data = json.loads(json_str)
        return data.get("steps", [])

    except Exception as e:
        import traceback
        st.error(f"Hugging Face API error: {e}")
        st.write(traceback.format_exc())
        return []

def get_image(query):
    """
    Returns Unsplash image URL for the given query.
    """
    return f"https://source.unsplash.com/600x400/?{query}"

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
            for idx, step in enumerate(steps, 1):
                st.markdown(f"### Step {idx}: {step['step_instruction']}")
                img_url = get_image(step['image_query'])
                st.image(img_url, caption=step['image_query'], use_column_width=True)
                audio_file = generate_audio(step['audio_text'])
                with open(audio_file, "rb") as f:
                    st.audio(f.read(), format="audio/mp3")
                os.remove(audio_file)