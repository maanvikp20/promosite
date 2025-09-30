const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = 5000;

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

const submissionsFile = path.join(
  __dirname,
  "public",
  "data",
  "submissionsdata.json"
);
const approvedFile = path.join(__dirname, "public", "data", "approved.json");

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Ensure JSON files exist
async function ensureFilesExist() {
  try {
    await fs.access(submissionsFile);
  } catch {
    await fs.writeFile(submissionsFile, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(approvedFile);
  } catch {
    await fs.writeFile(approvedFile, JSON.stringify([], null, 2));
  }
}
ensureFilesExist();

// Async file operations
async function loadSubmissions() {
  try {
    const content = await fs.readFile(submissionsFile, "utf8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

async function saveSubmissions(data) {
  await fs.writeFile(submissionsFile, JSON.stringify(data, null, 2));
}

async function loadApproved() {
  try {
    const content = await fs.readFile(approvedFile, "utf8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

async function saveApproved(data) {
  await fs.writeFile(approvedFile, JSON.stringify(data, null, 2));
}

// Admin session middleware
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) next();
  else res.status(401).json({ success: false, message: "Unauthorized" });
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/submit-form", async (req, res) => {
  try {
    const { firstName, lastName, email, updates } = req.body;
    if (!firstName || !lastName || !email)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ success: false, message: "Invalid email" });

    const submission = {
      id: crypto.randomUUID(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      interest: updates ? "Newsletter" : "More Information",
      date: new Date().toISOString(),
      status: "pending",
      fullData: req.body,
    };

    const submissions = await loadSubmissions();
    submissions.push(submission);
    await saveSubmissions(submissions);

    res
      .status(200)
      .json({
        success: true,
        message: "Form submitted successfully",
        submission,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true;
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false });
    res.status(200).json({ success: true });
  });
});

app.get("/wiglet", (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
  } else {
    res.redirect("/login");
  }
});

// ---------------- Admin API ----------------
app.get("/admin/api/submissions", requireAdmin, async (req, res) => {
  try {
    let subs = await loadSubmissions();
    const { email, interest, startDate, endDate } = req.query;

    if (email)
      subs = subs.filter((s) =>
        s.email.toLowerCase().includes(email.toLowerCase())
      );
    if (interest) subs = subs.filter((s) => s.interest === interest);
    if (startDate)
      subs = subs.filter((s) => new Date(s.date) >= new Date(startDate));
    if (endDate)
      subs = subs.filter((s) => new Date(s.date) <= new Date(endDate));

    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

app.patch("/admin/api/submissions/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const subs = await loadSubmissions();
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1)
      return res.status(404).json({ error: "Submission not found" });

    if (status === "approved") {
      const approved = await loadApproved();
      approved.push(subs[index]);
      await saveApproved(approved);

      subs.splice(index, 1);
      await saveSubmissions(subs);

      return res.json({ success: true, message: "Approved" });
    } else {
      subs[index].status = status || subs[index].status || "pending";
      await saveSubmissions(subs);
      return res.json({ success: true, submission: subs[index] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

app.delete("/admin/api/submissions/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const subs = await loadSubmissions();
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1)
      return res.status(404).json({ error: "Submission not found" });

    subs.splice(index, 1);
    await saveSubmissions(subs);

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
