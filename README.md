# OptiFit AI

This is a Next.js application built with Firebase, Genkit, and ShadCN UI.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Servers:**
    You need to run two servers concurrently in separate terminals.

    *   **Next.js Frontend:**
        ```bash
        npm run dev
        ```
        This will start the web application, typically on `http://localhost:9002`.

    *   **Genkit AI Flows:**
        ```bash
        npm run genkit:dev
        ```
        This starts the Genkit development UI, allowing you to inspect and test your AI flows, typically at `http://localhost:4000`.

## ⭐️ Important: Setting Up API Keys

To use the AI features, you must have a `.env` file in the root of your project with the necessary Google AI API keys.

Create a file named `.env` and add the following keys:

```
WORKOUT_AI_API_KEY=YOUR_API_KEY_HERE
SCOUT_AI_API_KEY=YOUR_API_KEY_HERE
PHYSIQUE_AI_API_KEY=YOUR_API_KEY_HERE
GENERAL_AI_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with the actual keys you have generated.

## 🚀 Deployment Configuration (Firebase App Hosting)

When you deploy your application, the `.env` file is **not** included for security reasons. You must securely store your API keys as **secrets** in your hosting environment.

**To fix errors like "Analysis Failed" in your deployed app, follow these steps:**

1.  **Go to the Google Cloud Secret Manager:**
    *   Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Ensure you have selected the correct Firebase project from the dropdown at the top.
    *   In the search bar, type "**Secret Manager**" and go to that page.

2.  **Create Secrets for Each API Key:**
    You need to create a separate secret for each key in your `.env` file.

    *   Click **"+ CREATE SECRET"**.
    *   For the **Name**, enter one of the following:
        *   `WORKOUT_AI_API_KEY`
        *   `SCOUT_AI_API_KEY`
        *   `PHYSIQUE_AI_API_KEY`
        *   `GENERAL_AI_API_KEY`
    *   In the **Secret value** field, paste the corresponding API key.
    *   Leave the other settings as default and click **"Create secret"**.
    *   **Repeat this process for all four API keys.**

3.  **Grant Access to the Service Account:**
    Your App Hosting environment needs permission to access these secrets.
    *   On the Secret Manager page, find one of the secrets you just created and click on its name.
    *   Go to the **"Permissions"** tab.
    *   Click **"+ GRANT ACCESS"**.
    *   In the **"New principals"** field, enter the service account ID for App Hosting. It typically looks like this:
        `service-[PROJECT_NUMBER]@gcp-sa-apphosting.iam.gserviceaccount.com`
        (Replace `[PROJECT_NUMBER]` with your actual Google Cloud project number).
    *   For the **"Role"**, select **"Secret Manager Secret Accessor"**.
    *   Click **"Save"**.
    *   **Repeat this for the other three secrets.**

After completing these steps, your deployed application will be able to securely access the API keys and all AI features will function correctly.
