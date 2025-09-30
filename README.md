# 🧠 Mental Health Chatbot with 3D Avatar

This project is a web application featuring a 3D avatar that interacts with users, providing mental health support and resources. It combines a React frontend with a Node.js backend to deliver a unique and engaging experience. The chatbot leverages the Groq API for natural language processing and the ElevenLabs API for generating realistic speech, creating a supportive and interactive environment.

## 🚀 Key Features

- **Interactive 3D Avatar:** A customizable 3D avatar provides a visual representation and enhances user engagement.
- **AI-Powered Chatbot:** Utilizes the Groq API to provide intelligent and context-aware responses based on a mental health knowledge base.
- **Realistic Text-to-Speech:** Employs the ElevenLabs API to generate natural-sounding speech for the chatbot's responses.
- **Lip-Syncing Animation:** The avatar's lip movements are synchronized with the chatbot's speech, creating a more immersive experience.
- **Facial Expressions:** The avatar displays various facial expressions to convey emotions and enhance communication.
- **Real-time Chat Interface:** A user-friendly chat interface allows users to interact with the chatbot in real-time.
- **Camera Controls:** Users can zoom in and out on the 3D scene for a closer look at the avatar.
- **Loading Indicator:** A loading animation is displayed while the chatbot is processing requests.
- **Mental Health Knowledge Base:** Includes a comprehensive knowledge base with information and resources related to mental health support.
- **Health Check Endpoint:** Provides a health check endpoint to monitor the status of the server and its dependencies.

## 🛠️ Tech Stack

*   **Frontend:**
    *   React: JavaScript library for building user interfaces
    *   @react-three/fiber: React renderer for Three.js
    *   @react-three/drei: Collection of useful helpers and abstractions for React Three Fiber
    *   leva: UI library for creating tweakable UI elements
    *   Vite: Build tool for fast development
    *   CSS: Styling
*   **Backend:**
    *   Node.js: JavaScript runtime environment
    *   Express.js: Web framework for Node.js
    *   Groq API: For natural language processing
    *   ElevenLabs API: For text-to-speech
    *   dotenv: For managing environment variables
    *   cors: For enabling Cross-Origin Resource Sharing
*   **Other:**
    *   Three.js: JavaScript 3D library
    *   GLTF: 3D model format

## 📦 Getting Started / Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Vite
- Groq API key
- ElevenLabs API key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend
    npm install # or yarn install
    ```

3.  **Configure backend environment variables:**

    *   Create a `.env` file in the `backend` directory.
    *   Add the following environment variables, replacing the placeholders with your actual API keys:

        ```
        GROQ_API_KEY=<your_groq_api_key>
        ELEVENLABS_API_KEY=<your_elevenlabs_api_key>
        ```

4.  **Install frontend dependencies:**

    ```bash
    cd ../frontend
    npm install # or yarn install
    ```

### Running Locally

1.  **Start the backend server:**

    ```bash
    cd backend
    npm run dev # or yarn dev
    ```

    The backend server will start on port 3000 (or the port specified in your `.env` file).

2.  **Start the frontend development server:**

    ```bash
    cd ../frontend
    npm run dev # or yarn dev
    ```

    The frontend development server will start on port 5173 (or the default port for Vite).

3.  **Access the application in your browser:**

    Open your web browser and navigate to `http://localhost:5173`.

## 📂 Project Structure

```
├── backend/
│   ├── index.js              # Main backend server file
│   ├── mental_health_knowledge_base.js  # Knowledge base for the chatbot
│   ├── package.json          # Backend dependencies and scripts
│   └── .env                  # Environment variables (API keys)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Entry point for React application
│   │   ├── index.css         # Global styles
│   │   ├── components/
│   │   │   ├── UI.jsx        # User interface components
│   │   │   ├── Avatar.jsx    # 3D avatar component
│   │   │   ├── Experience.jsx # 3D scene component
│   │   ├── hooks/
│   │   │   ├── useChat.jsx   # Custom hook for managing chat state
│   │   └── assets/           # Static assets (e.g., 3D models, textures)
│   ├── vite.config.js        # Vite configuration file
│   ├── package.json          # Frontend dependencies and scripts
├── README.md               # Project documentation
```


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Push your changes to your fork.
5.  Submit a pull request to the main repository.



