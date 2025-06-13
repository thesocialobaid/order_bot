from pyexpat import model
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load API Key
load_dotenv()


#Configuring the Gemini API Client 
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env file. Please set it.")
    genai.configure(api_key=api_key)
except Exception as e:
    # This will stop the server from starting if the key is missing or invalid
    print(f"FATAL ERROR: Could not configure Google Gemini API: {e}")
    exit()


app = FastAPI()

#Your CORS middleware is correct and allows the frontend to connect 
app.add_middleware( 
    CORSMiddleware, 
    allow_origins=["*"],
    allow_credentials = True,
    allow_methods =["*"], 
    allow_headers=["*"], 
)

# Initializing the Gemini Pro Model 
def convert_messages_for_gemini(messages):
    """
    Converts a list of messages from the standard {'role': 'user'/'assistant', 'content': '...'}
    format to Gemini's format. Gemini expects roles to be 'user' and 'model'.
    """
    gemini_history = []
    for msg in messages:
        # Gemini uses 'model' for the assistant's role.
        role = 'model' if msg['role'] == 'assistant' else msg['role']
        gemini_history.append({'role': role, 'parts': [msg['content']]})
    return gemini_history

@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        messages = data.get("messages")
        
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")

        # Start a chat session with the converted history
        # The history must have an even number of messages for the final user query
        history_for_gemini = convert_messages_for_gemini(messages[:-1]) # All messages except the last one
        chat_session = model.start_chat(history=history_for_gemini)
        
        # The last message is the new prompt
        last_user_message = messages[-1]['content']

        # Send the message to Gemini
        response = chat_session.send_message(last_user_message)
        
        # Extract the text content from the response
        bot_response = response.text
        
        return {"response": bot_response}
    
    except Exception as e:
        print(f"An error occurred in the /chat endpoint: {e}")
        # Be careful not to expose sensitive error details to the client
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@app.get("/")
async def root():
    return {"message": "Gemini Chatbot API is running correctly."}


if __name__ == "__main__":
    import uvicorn
    # CRITICAL: Use host="0.0.0.0" to make the server accessible in Codespaces
    uvicorn.run(app, host="0.0.0.0", port=8000)

