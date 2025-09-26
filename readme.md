# Promotional Site

This project is a simple **Node.js/Express** application that handles form submissions, stores them in a JSON file, and allows retrieval of submissions. It also serves static files and uses middleware like `body-parser` and `cors`.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Middleware Testing](#middleware-testing)
- [Postman Testing](#postman-testing)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- Postman for API testing

## Installation

1. Clone the repository or copy the project files.
2. Open a terminal in the project folder.
3. Install required packages:

```bash
npm install express body-parser cors
```

4. (Optional) Install **nodemon** for automatic server restart during development:

```bash
npm install -g nodemon
```

## Project Structure

```
project-root/
│
├─ public/
│   ├─ index.html
│   ├─ style.css
│   └─ data/
│       └─ submissionsdata.json
│
├─ app.js
└─ README.md
```

- **app.js** → Main server file
- **submissionsdata.json** → Stores form submissions
- **public/** → Static files (HTML, CSS, images, etc.)

## Running the Server

To start the server:

```bash
node app.js
```

Or, if using nodemon:

```bash
nodemon app.js
```

The server will run on:

```
http://localhost:5000
```

## API Endpoints

### 1. POST /submit-form

Submit a form with JSON data.

**Request Body Example:**

```json
{
  "firstName": "Maanvik",
  "lastName": "Poddar",
  "email": "maanvik@example.com",
  "updates": true
}
```

**Response Example (Success):**

```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submission": {
    "name": "Maanvik Poddar",
    "email": "maanvik@example.com",
    "interest": "Newsletter",
    "date": "2025-09-25T21:45:00.000Z",
    "fullData": { ... }
  }
}
```

**Response Example (Validation Error):**

```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName, and email are required"
}
```

### 2. GET /get-submissions

Retrieve all stored submissions.

**Response Example:**

```json
{
  "success": true,
  "submissions": [
    {
      "name": "Maanvik Poddar",
      "email": "maanvik@example.com",
      "interest": "Newsletter",
      "date": "2025-09-25T21:45:00.000Z",
      "fullData": { ... }
    }
  ]
}
```

## Middleware Testing

The project uses the following middleware:

1. `body-parser.json()` → Parses incoming JSON requests.
2. `cors()` → Allows cross-origin requests.
3. `express.static()` → Serves static files from the `public/` folder.

**How to test middleware:**

- **JSON Parsing:** Send POST requests with valid/invalid JSON to `/submit-form`.
- **CORS:** Send GET/POST requests from another domain or check headers for `Access-Control-Allow-Origin`.
- **Static Files:** Access `http://localhost:5000/index.html` to verify file serving.

## Postman Testing

### 1. POST /submit-form

- **Method:** POST
- **URL:** `http://localhost:5000/submit-form`
- **Body:** Raw → JSON

**Example Test Cases:**

| Test Case | Body | Expected Result |
|-----------|------|----------------|
| Valid Submission | `{ "firstName": "Maanvik", "lastName": "Poddar", "email": "maanvik@example.com" }` | 200 OK, success: true |
| Missing Fields | `{ "firstName": "Maanvik" }` | 400 Bad Request, Missing required fields |
| Invalid Email | `{ "firstName": "Maanvik", "lastName": "Poddar", "email": "maanvik@.com" }` | 400 Bad Request, Invalid email format |

### 2. GET /get-submissions

- **Method:** GET
- **URL:** `http://localhost:5000/get-submissions`

**Check:**
- Response returns all submissions in JSON.
- CORS headers exist (`Access-Control-Allow-Origin: *`).

### 3. Static File Test

- **Method:** GET
- **URL:** `http://localhost:5000/index.html`
- Should return your HTML content.
