/*

We use JSOn 'data stores' for simplicity, in production you will a flat file or cloudbased data storage like MongoDB

This server will demonstrate the HTTp request/response cycle:
-- Client sends the HTTP request: METHOD + URL + HEADERS + (optional) BODY
-- Server processes it, then sends an HTTP response STATUS CODE + HEADERS + (optional) BODY

Middleware is a function that runs between the clients request and the your final route/handler/response.

It can read/modify req, res stop the request by sending its own response or pass control to the next function using next()

Usecases:
--body parsing (json data, cookies, sessions)
-- logging data or unique ips using libraries like morgan
-- authentication & permissions
-- data validation
-- static files
-- rate limiting (only so many requests from one ip...etc)
*/

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const morgan = require("morgan");
const { BADFAMILY } = require("dns");

const app = express();
const PORT = 5000;

// Path the student.json file
const database = path.join(__dirname, "./data/submissiondata.json");

// Middleware
// Part 1: Parse JSON request body when the client send Content-Type: application.json
app.use(express.json());

// Part 2: Request Logger through morgan
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// Part 3: Tiny custom logger but when we use middleware we must also use the next(), this tells the server that when the middleware has completed its task it should continue the process
app.use((req, res, next) => {
  //Log the core request parts
  console.log("\n--- Incoming Request ---");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  // After the response is sent we log the status code
  res.on("finish", () => {
    console.log("--- Outgoing Response ---");
    console.log("Status:", res.statusCode);
    console.log("------------------------\n");
  });

  next();
  // Continue to the next middleware or route handler
});

// Helper functions to read/write the submissionsdata.json file

async function readDB() {
  const rawData = await fs.readFile(database, "utf-8");
  return JSON.parse(rawData);
}

async function writeDB(data) {
  const text = JSON.stringify(data, null, 2);
  await fs.writeFile(database, text, "utf-8");
}

//ROUTES
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Student API is Running",
    endpoints: [
      "/students (GET, POST)",
      "/students/:id (GET, POST, PUT, DELETE)",
    ],
  });
});


// FIX FROM HERE


/**
 * GET /students
 * Purpose: Read all students
 * METHOD: GET
 * URL: /students
 * REQUEST HEADERS: may include Accept: application/json
 * REQUEST BODY: none
 * RESPONSE: 200 OK + JSON Array
 */
app.get("/students", async (req, res) => {
  try {
    const students = await readDB();
    res.status(200).json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Failed to read all students" });
  }
});

/**
 * GET /students/:id
 * PurposeL Read a single student id
 * METHOD: GET
 * URL PARAM: id
 * RESPONSE: 200 ok + JSON Object or 404
 */

app.get("/students/:id", async (req, res) => {
  try {
    const students = await readDB();
    const student = students.find((s) => s.id == req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server failed to read students" });
  }
});

/**
 * POST /students
 * Purpose: Create a new students (add to file)
 * METHOD: POST (create a new resource)
 * URL: /students
 * REQUEST HEADERS: Content-Type: application/json
 * REQUEST BODY: JSON with required fields for (id, firstName, lastName, year)
 * RESPONSE: 201 Created + JSON of created student
 */
app.post("/students", async (req, res) => {
  try {
    const { id, firstName, lastName, year } = req.body;

    // Validate the information (idiot proofing)
    if (!id || !firstName || !lastName || !year) {
      return res.status(400).json({
        error: "Invalid Body. Required: ID, firstName, lastName, year (number)",
      });
    }
    const students = await readDB();
    if (students.some((s) => s.id == id)) {
      return res.status(409).json({
        error: "ID already exists",
      });
    }

    const newStudent = { id, firstName, lastName, year };
    students.push(newStudent);
    await writeDB(students);

    res.status(201).json(newStudent);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server Cannot add Student",
    });
  }
});

/**
 * PUT /students/:id
 * Purpose: Update an exisitng student by id (replace fields)
 * METHOD: PUT (idemptotent - multiple identical requests result in same state)
 * URL: /students/:id
 * REQUEST BODY: JSON with fields to update (firstName, lastName, year)
 * RESPONSE: 200 OK + JSON of updated student, or 404 Not Found
 */
app.put("/students/:id", async (req, res) => {
  try {
    const { firstName, lastName, year } = req.body;
    const students = await readDB();
    const idx = students.findIndex((s) => s.id == req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (firstName !== undefined) students[idx].firstName = firstName;
    if (lastName !== undefined) students[idx].lastName = lastName;
    if (year !== undefined) students[idx].year = year;

    await writeDB(students);
    res.status(200).json(students[idx]); // 200 OK
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server failed to update student" }); // 500
  }
});

/**
 * DELETE /students/:id
 * Purpose: Delete an existing student by id
 * METHOD: DELETE
 * URL: /students/:id
 * REQUEST BODY: none
 * RESPONSE: 200 OK + JSON of deleted student, or 404 Not Found
 */
app.delete("/students/:id", async (req, res) => {
  try {
    const students = await readDB();
    const idx = students.findIndex((s) => s.id == req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    students.splice(idx, 1);
    await writeDB(students);
    res.status(200).json({ message: "Student deleted successfully" }); // 200 OK

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server failed to delete student" }); // 500
  }
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});