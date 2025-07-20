const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();

// To read form data
app.use(bodyParser.urlencoded({ extended: true }));

// To serve the HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Route for form submission
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  console.log('Form received:');
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Message: ${message}`);

  // For now, just show a thank you message
  res.send(`<h2>Thank you, ${name}! We got your message.</h2>`);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
``