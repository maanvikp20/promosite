const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const morgan = require("morgan");

const app = express();
const PORT = 5000;

// Path to submissiondata.json
const database = path.join(__dirname, "public/data/submissiondata.json");

// --- Middleware ---
// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan("dev"));

// Serve static files (your website in /public)
app.use(express.static(path.join(__dirname, "public")));

// --- Helper functions ---
async function readDB() {
  try {
    const rawData = await fs.readFile(database, "utf-8");
    return JSON.parse(rawData);
  } catch (err) {
    return []; // Start fresh if file missing/empty
  }
}

async function writeDB(data) {
  const text = JSON.stringify(data, null, 2);
  await fs.writeFile(database, text, "utf-8");
}

// --- Form submission route ---
// This matches your form’s action="/submit"
app.post("/submit", async (req, res) => {
  try {
    const students = await readDB();

    // Grab everything from the form dynamically
    const newEntry = {
      id: Date.now().toString(), // auto-generate unique ID
      ...req.body,              // save all form fields
    };

    students.push(newEntry);
    await writeDB(students);

    // Redirect back to homepage (or show thank-you page)
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to save submission");
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
