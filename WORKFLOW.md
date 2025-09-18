# OptiFit AI - Developer Workflow & Guide

This document provides a comprehensive overview of the project's tech stack, structure, and the standard workflow for adding new features.

---

## 1. Technology Stack

This project is built on a modern, server-centric web stack designed for performance, scalability, and powerful AI integration.

| Technology          | Role & Purpose                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Next.js (App Router)** | The core web framework. We use the App Router for server-side rendering, API-less logic with Server Actions, and routing. |
| **React & TypeScript**  | Used to build the user interface with reusable, type-safe components.                                       |
| **Firebase**            | The backend-as-a-service platform. We use **Firestore** for our real-time database and **Firebase Authentication** for user management. |
| **Genkit**              | The AI framework used to create, manage, and deploy all generative AI flows that connect to Google's Gemini models. |
| **ShadCN UI**           | Our component library. It provides beautiful, accessible, and unstyled base components that we build upon. |
| **Tailwind CSS**        | A utility-first CSS framework for rapidly styling the application and ensuring a consistent design system. |

---

## 2. Project Structure

The codebase is organized to separate concerns, making it easier to navigate and maintain.

```
/
├── src/
│   ├── ai/
│   │   ├── flows/       # Core Genkit AI flows (e.g., player scouting, physique analysis)
│   │   └── genkit.ts    # Genkit initialization and configuration
│   ├── app/
│   │   ├── dashboard/   # Main application dashboard pages and settings
│   │   ├── actions.ts   # All Next.js Server Actions (our "backend" logic)
│   │   ├── page.tsx     # The login page
│   │   └── layout.tsx   # The root layout of the application
│   ├── components/
│   │   ├── features/    # High-level feature components (e.g., PlayerScouting, PhysiqueRater)
│   │   └── ui/          # Reusable, low-level UI components from ShadCN (Button, Card, etc.)
│   ├── hooks/
│   │   └── use-toast.ts # Custom hook for displaying notifications
│   └── lib/
│       ├── firebase.ts  # Firebase client-side initialization
│       └── utils.ts     # Utility functions (e.g., `cn` for Tailwind classes)
├── package.json         # Project dependencies and scripts
└── WORKFLOW.md          # This file
```

---

## 3. Development Workflow

Here is the typical process for adding a new feature to the OptiFit AI dashboard.

**Example Scenario: Adding a "Nutrition Plan Generator"**

1.  **Create the AI Logic (The "Brain"):**
    *   Go to `src/ai/flows/`.
    *   Create a new file, `generate-nutrition-plan.ts`.
    *   Inside, define your Genkit flow using `ai.defineFlow`. This includes defining the input schema (e.g., user's goals, dietary restrictions) and the output schema (e.g., a structured meal plan).
    *   Export the main function that will be called from your server action.

2.  **Create the Server Action (The "Connector"):**
    *   Open `src/app/actions.ts`.
    *   Add a new `export async function` that will serve as the bridge between your UI and the AI flow.
    *   This function will take input from the client, call the Genkit flow you created in step 1, and may interact with Firestore (e.g., save the generated plan). It then returns the result to the client.

3.  **Build the UI Component (The "Face"):**
    *   Go to `src/components/features/`.
    *   Create a new file, `nutrition-planner.tsx`.
    *   Build the React component with the necessary forms (e.g., for user goals) and display areas for the results.
    *   Use ShadCN components from `src/components/ui/` to build the UI.
    *   When the user submits the form, call the new server action you created in step 2.

4.  **Integrate into the Dashboard (The "Home"):**
    *   Open `src/app/dashboard/page.tsx`.
    *   Add a new `TabsTrigger` for "Nutrition".
    *   Add a corresponding `TabsContent` section and place your new `<NutritionPlanner />` component inside it.
    *   Pass any necessary props, like the `userId`.

---

## 4. Essential Commands

These are the primary commands you will use from your terminal in the project's root directory.

| Command               | Description                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm install`         | Installs all the project dependencies listed in `package.json`. Run this first.                         |
| `npm run dev`         | Starts the Next.js development server for the frontend. You can access the app at `http://localhost:9002`. |
| `npm run genkit:dev`  | Starts the Genkit development server. This allows you to test your AI flows locally via a UI at `http://localhost:4000`. |
| `npm run build`       | Compiles and optimizes the application for production.                                                  |
| `npm run start`       | Starts the production server after you have run `npm run build`.                                        |
| `npm run lint`        | Runs the linter to check for code quality and style issues.                                             |
