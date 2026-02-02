# Real-Time Stock Market System

A real-time stock market monitoring and portfolio management system built with Node.js, Express, and Supabase.

## Project Structure

- `/backend`: Node.js/Express server and business logic.
- `/frontend`: Static HTML/JS/CSS frontend.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure the `.env` file in the root directory is correctly configured with your Supabase credentials.

### 2. Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```
2. The server will start on `http://localhost:5000`.
3. You can verify the backend is running by visiting `http://localhost:5000/api/health`.

### 3. Frontend

The frontend consists of static files in the `/frontend` directory. You can serve them using any static web server (e.g., `live-server`, `serve`, or just opening `index.html` in a browser).

## Architecture

- **Express.js**: Web framework for the API.
- **Supabase**: Backend-as-a-Service for Authentication and Database.
- **Middleware**: Custom authentication and Role-Based Access Control (RBAC).

## Phase 1 Complete

- [x] Project structure initialized.
- [x] Backend server configured.
- [x] Supabase integration established.
- [x] Authentication and Role middleware placeholders created.
- [x] Basic frontend structure set up.
