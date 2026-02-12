# Passkeys Web Sample

A minimal sample application to demonstrate how to implement passkey (WebAuthn) authentication in a web application. This project uses Node.js and Express.

This repository is intended for local development and testing purposes to help you understand the end-to-end flow of passkey sign-up and sign-in.

## Features

-   **Sign-up:** Register a new user with a passkey.
-   **Sign-in:** Authenticate a user with their existing passkey.
-   **Backend:** A simple Express server to handle WebAuthn registration and authentication ceremonies.
-   **Frontend:** A basic HTML/JavaScript client to interact with the browser's WebAuthn API (`navigator.credentials`).

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   A browser that supports passkeys (e.g., Chrome, Firefox, Safari)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/otoyo/passkeys-web-sample.git
    cd passkeys-web-sample
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    node app.js
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:3000`. You can now test the sign-up and sign-in functionality.

## Screenshots

<img width="908" height="425" alt="Image" src="https://github.com/user-attachments/assets/ca00b163-04b5-4207-ad5f-180a7b794451" />

<img width="896" height="338" alt="Image" src="https://github.com/user-attachments/assets/f5b274b8-69e6-47b0-8236-0ceb7237e1cd" />

## How It Works

The server runs on `http://localhost:3000` by default. It exposes a few endpoints to handle the WebAuthn flow:
-   `GET /registrationOptions`: Generates challenges and options for creating a new passkey.
-   `POST /signup`: Verifies the attestation response and registers the new passkey.
-   `GET /authenticationOptions`: Generates challenges for an authentication ceremony.
-   `POST /login`: Verifies the assertion response and signs the user in.

This sample stores user and credential data in a local JSON file (`db.json`) for simplicity. For production use, you would replace this with a proper database.

## Disclaimer

This is a sample project and is **not intended for production use**. It lacks many security features, proper error handling, and a persistent database that a real-world application would require. Use it as a learning tool.
