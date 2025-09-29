const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
require('dotenv').config();

const app = express();
const PORT = 5000;

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

// Path to JSON submissions file
const submissionsFile = path.join(__dirname, "public", "data", "submissionsdata.json");

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Session middleware (must be before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if using HTTPS
}));

// Ensure submissions file exists
if (!fs.existsSync(submissionsFile)) {
  fs.writeFileSync(submissionsFile, JSON.stringify([], null, 2));
}

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// POST endpoint for form submission
app.post("/submit-form", (req, res) => {
  try {
    const { firstName, lastName, email, updates } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: firstName, lastName, and email are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const submission = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      interest: updates ? "Newsletter" : "More Information",
      date: new Date().toISOString(),
      fullData: req.body
    };

    let submissions = [];
    try {
      const fileContent = fs.readFileSync(submissionsFile, 'utf8');
      submissions = JSON.parse(fileContent);
    } catch {
      submissions = [];
    }

    submissions.push(submission);
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));

    console.log('Form submitted successfully:', submission);

    res.status(200).json({ success: true, message: "Form submitted successfully", submission });

  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
});

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/login'); // redirect if not logged in
  }
}

// GET endpoint to retrieve submissions (protected)
app.get("/get-submissions", requireAdmin, (req, res) => {
  try {
    let submissions = [];
    if (fs.existsSync(submissionsFile)) {
      const fileContent = fs.readFileSync(submissionsFile, 'utf8');
      submissions = JSON.parse(fileContent);
    }
    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('Error reading submissions:', error);
    res.status(500).json({ success: false, message: "Error reading submissions" });
  }
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// POST login route (sets session)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true; // save session
    res.status(200).json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Admin page (protected)
app.get("/wiglet", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: "Logout failed" });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});