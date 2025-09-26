const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Path to JSON submissions file
const submissionsFile = path.join(__dirname, "public", "data", "submissionsdata.json");

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve all public folder files

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

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: firstName, lastName, and email are required" 
      });
    }

    // Basic email validation
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
      fullData: req.body // Store all form data
    };

    // Read current submissions
    let submissions = [];
    try {
      const fileContent = fs.readFileSync(submissionsFile, 'utf8');
      submissions = JSON.parse(fileContent);
    } catch (readError) {
      console.log('Creating new submissions file...');
      submissions = [];
    }

    // Add new submission
    submissions.push(submission);

    // Write updated submissions
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));

    console.log('Form submitted successfully:', submission);

    res.status(200).json({ 
      success: true, 
      message: "Form submitted successfully", 
      submission: submission 
    });

  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error. Please try again." 
    });
  }
});

// GET endpoint to retrieve submissions
app.get("/get-submissions", (req, res) => {
  try {
    let submissions = [];
    if (fs.existsSync(submissionsFile)) {
      const fileContent = fs.readFileSync(submissionsFile, 'utf8');
      submissions = JSON.parse(fileContent);
    }
    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('Error reading submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error reading submissions" 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
