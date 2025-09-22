const express = require('express')
const path = require('path')
const app = express()


// Middleware to serve static files ()
// Middleware is a function that sits between the request from the client and the response from the server.
// Think of it as a gatekeeper or pipeline every request passes through a chain of middleware functions before reaching the final route


app.use(express.static(path.join(__dirname, 'public')))


app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


app.listen(5000, ()=>{console.log(`Server is running on http://localhost:5000`)})
