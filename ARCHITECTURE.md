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
            B --> C[Dashboards <br/>(Player / Coach)];
        end

        subgraph "Backend (Server Logic)"
            direction TB
            style Backend fill:#e6f9e6,stroke:#b3e6b3
            D[Next.js Server Actions] --> E{Business Logic <br/>- Auth Checks<br/>- Database CRUD<br/>- AI Flow Triggers};
        end

        subgraph "AI Engine"
            direction TB
            style AI fill:#f2e6ff,stroke:#d9b3ff
            F[Genkit AI Flows] --> G[Google Gemini Models];
            G --> H[Structured JSON Output];
        end

        subgraph "Data Persistence"
            direction TB
            style Data fill:#fff0e6,stroke:#ffccb3
            I[Firebase Authentication];
            J[Cloud Firestore <br/>- Users<br/>- Workouts<br/>- Invites<br/>- Conversations<br/>- Posts];
        end
    end

    B -- "User Interaction" --> D;
    E -- "Database Operations" --> J;
    E -- "Authentication" --> I;
    E -- "Trigger AI Analysis" --> F;
    H -- "AI Response" --> E;
    D -- "Data Response" --> B;

```

## System Flow Explained

1.  **User Interaction (Frontend → Backend):**
    *   The user interacts with the **Next.js/React UI**.
    *   Actions on the dashboard (e.g., logging a workout, scouting a player) trigger a call to a specific **Next.js Server Action**.

2.  **Processing (Backend Logic):**
    *   The **Server Action** contains the core business logic. It validates input and orchestrates calls to other services.
    *   For standard operations, it interacts directly with **Firebase Authentication** for user verification and **Cloud Firestore** for data storage (CRUD operations).
    *   For intelligent features, it triggers an appropriate **Genkit AI Flow**.

3.  **AI Analysis (AI Engine):**
    *   The **Genkit Flow** constructs a detailed prompt using the user's data and predefined schemas.
    *   It sends the request to a **Google Gemini Model** for processing.
    *   The model returns a **Structured JSON Output**, which is validated against the schema and passed back to the Server Action.

4.  **Data Response (Backend → Frontend):**
    *   The Server Action receives the data (either from the database or the AI Engine) and securely returns a serialized response.
    *   The **React UI** updates dynamically to display the new information to the user.
