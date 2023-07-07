const express = require('express');
const app = express();
const cors = require('cors')
const connectDB = require('./connect')
const Contact = require('./models/contactform')
const User = require('./models/User');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use(express.static('views'));

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
  const token = req.cookies.token; // Assuming token is stored in a cookie
 
  if (token) {
    jwt.verify(token, 'bhavya123!', (err, decodedToken) => {
      if (err) {
        // Invalid token
        return res.status(401).json({ message: 'Invalid token' });
      }
      // Token is valid, store the decoded token in the request object
      req.user = decodedToken;
      next();
    });
  } else {
    // No token found
    return res.status(401).json({ message: 'No token found' });
  }
}

// View Engine
app.set('view engine', 'ejs');

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Find the user in the database by username
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Compare the provided password with the stored password
      if (password === user.password) {
        // Authentication successful
        // Here, you can generate a token or session for the logged-in user

        const token = jwt.sign({ userId: user._id, username: username }, 'bhavya123!');
        // Set the token as a cookie
        res.cookie('token', token, {
          httpOnly: false,
          sameSite:  'None'
        });
        res.json({ message: 'Login successful', token: token });
      
      } else {
        // Password mismatch, authentication failed
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    })
    .catch((error) => {
      console.log(error);
      // Handle error cases and return an appropriate JSON response
      res.status(500).json({ message: 'Internal server error' });
    });
});


// User Registration
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
  
    // Perform validation checks on the input (e.g., check for required fields)
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      User.findOne({ username })
      .then((existingUser) => {
        if (existingUser) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
  
        // Create a new user instance
        const newUser = new User({
          username,
          password,
        });
  
        // Save the user to the database
        newUser
          .save()
          .then(() => {
            // Registration successful, return a success response or appropriate JSON response
            res.json({ message: 'Registration successful' });
          })
          .catch((error) => {
            console.log(error);
            // Handle error cases and return an appropriate JSON response
            res.status(500).json({ message: 'Internal server error' });
          });
      })
      .catch((error) => {
        console.log(error);
        // Handle error cases and return an appropriate JSON response
        res.status(500).json({ message: 'Internal server error' });
      });
  });


// Logout
app.get('/api/logout', authenticateToken, (req, res) => {
  // Clear the authentication token
  res.clearCookie('token'); // Assuming 'token' is the name of the cookie

  // Redirect the user to the login page
  res.redirect('http://localhost:5173/login');
});


app.get('/api/data', authenticateToken, (req, res) => {
    console.log(req.user)
    Contact.find()
    .then((data) => {
        res.render('dashboard', {username: req.user.username , contacts: data})
        // res.json(data);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Error Retrieving Data' });
        // res.status(500).send('Error Retrieving Data');
    })

  });

app.post('/api/data', (req, res) => {
    const { name, email, message } = req.body;

    // Create a new instance of the Contact model with the received data
    const newContact = new Contact({
        name,
        email, 
        message
    })

    newContact.save()
    .then(() => {
        res.status(200).send('Contact saved Successfully')
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error Saving Contact')
    })
    
  })


//   Edit Contact

app.get('/api/data/:id/edit', (req, res) => {
    const contactId = req.params.id;
  
    // Retrieve the contact document from the database based on the provided ID
    Contact.findById(contactId)
      .then((contact) => {
        if (!contact) {
          // Handle case when the contact is not found
          res.status(404).send('Contact not found');
        } else {
          // Render the edit page with the contact data
          res.render('edit-contact', { contact });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error retrieving contact');
      });
  });
  

//Updating Contact

app.post('/api/data/:id/update', (req, res) => {
    const contactId = req.params.id;
    const { name, email, message } = req.body;
  
    // Find the contact document by ID and update its data
    Contact.findByIdAndUpdate(contactId, { name, email, message }, { new: true })
      .then((updatedContact) => {
        if (!updatedContact) {
          // Handle case when the contact is not found
          res.status(404).send('Contact not found');
        } else {
          // Redirect to the data table or show a success message
          res.redirect('/api/data');
          // res.send('Contact updated successfully');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error updating contact');
      });
  });

  
//   Deleting a Contact

app.get('/api/data/:id/delete', (req, res) => {
    const contactId = req.params.id;
    const { name, email, message } = req.body;
  
    // Find the contact document by ID and update its data
    Contact.findByIdAndDelete(contactId)
      .then(() => {
        res.redirect('/api/data')
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error Deleting contact');
      });
  });

// Connect to MongoDB
connectDB();

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
