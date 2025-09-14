# OptiFit AI - System Architecture

This document outlines the modern system architecture for the OptiFit AI application. It is designed to be clean, minimal, and clearly illustrate the flow of data between the major components.

```mermaid
graph TD
    subgraph " "
        direction LR
        subgraph "Frontend (Client)"
            direction TB
            style Frontend fill:#e6f0ff,stroke:#b3d1ff
            A[User] --> B{Next.js / React UI};
            B --> C[Feature-Rich Dashboards <br/>- Performance Logging<br/>- Video Analysis<br/>- Messaging & Community];
        end

        subgraph "Backend (Server Logic)"
            direction TB
            style Backend fill:#e6f9e6,stroke:#b3e6b3
            D[Next.js Server Actions] --> E{Business Logic <br/>- Auth Checks<br/>- Realtime Database CRUD<br/>- AI Flow Triggers};
        end

        subgraph "AI Engine"
            direction TB
            style AI fill:#f2e6ff,stroke:#d9b3ff
            F[Genkit AI Flows] --> G[Google Gemini Models <br/>(incl. 1.5 Flash for Vision)];
            G --> H[Structured JSON Output];
        end

        subgraph "Data Persistence"
            direction TB
            style Data fill:#fff0e6,stroke:#ffccb3
            I[Firebase Authentication];
            J[Cloud Firestore <br/>- Users, Workouts, Invites<br/>- Conversations, Messages<br/>- Community Posts & Comments];
        end
    end

    B -- "User Interaction (e.g., Log Workout, Send Message)" --> D;
    E -- "Realtime Database Operations" --> J;
    E -- "User Verification" --> I;
    E -- "Trigger AI Analysis (e.g., Scout Player, Analyze Video)" --> F;
    H -- "AI Response" --> E;
    D -- "Data Response" --> B;

```

## System Flow Explained

1.  **User Interaction (Frontend → Backend):**
    *   The user interacts with the **Next.js/React UI**.
    *   Actions on the dashboard (e.g., logging a workout, sending a message, uploading a video, scouting a player) trigger a call to a specific **Next.js Server Action**.

2.  **Processing (Backend Logic):**
    *   The **Server Action** contains the core business logic. It validates input and orchestrates calls to other services.
    *   For standard operations, it interacts directly with **Firebase Authentication** for user verification and **Cloud Firestore** for real-time data storage (CRUD operations for workouts, messages, posts, etc.).
    *   For intelligent features, it triggers an appropriate **Genkit AI Flow**.

3.  **AI Analysis (AI Engine):**
    *   The **Genkit Flow** constructs a detailed prompt using the user's data (e.g., performance metrics, video data URI) and predefined schemas.
    *   It sends the request to a **Google Gemini Model** for processing. This includes using multimodal models like Gemini 1.5 Flash for video analysis tasks.
    *   The model returns a **Structured JSON Output**, which is validated against the schema and passed back to the Server Action.

4.  **Data Response (Backend → Frontend):**
    *   The Server Action receives the data (either from the database or the AI Engine) and securely returns a serialized response.
    *   The **React UI**, leveraging real-time listeners with Firestore where applicable, updates dynamically to display the new information to the user.

## Technology Stack

*   **AI & Algorithm Development:**
    *   **Genkit & Google Gemini** – Core technologies used for developing all AI-powered features, including the Sports Performance Analysis, workout video analysis, and personalized recommendations.

*   **Computer Vision & Motion Tracking:**
    *   **Google Gemini 1.5 Flash** – The multimodal foundation model used for extracting key metrics, counting reps, and analyzing form from user-submitted workout videos.

*   **Web & Backend Development:**
    *   **Next.js Server Actions & Cloud Firestore** – Backend server logic is handled through modern Next.js Server Actions, with all application data (users, workouts, etc.) stored and managed in a secure, real-time Firestore database.

*   **Frontend Application:**
    *   **Next.js, React & TypeScript** – The user interface is built as a modern, type-safe, and performant web application for interacting with and visualizing performance analytics.
    *   **ShadCN UI & Tailwind CSS** - For building a consistent and responsive design system.

*   **Authentication & Security:**
    *   **Firebase Authentication** – Manages all user authentication (Email/Password and Google OAuth), providing secure and reliable sign-in processes. Data transfer is secured via HTTPS.