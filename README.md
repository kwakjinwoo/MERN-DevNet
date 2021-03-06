# MERN Stack | DevNet

#### These are my notes as I took my first MERN stack experience on Udemy.



### Extensions for VSCode

ES7 React/Redux/GraphQL...

Live Server

Node.js Modules Intellisense

Prettier

Bracket Pair Colorizer



### Startup | Backend API using 

1. `npm init` to create the package.json

2. `npm i express mongoose passport passport-jwt jsonwebtoken body-parser bcryptjs validator`

   to download all the modules we need

3. `npm i -D nodemon` *NOTE `-D` is `--save-dev`

   **nodemon** looks at node application and updates for us

4. `node server` to run server (`server` can be replaced with any other file name)

#### Adding a Script | package.json

1. in `package.json` go to `"scripts"` and replace with these two lines

    `"start": "node server.js",` changes `npm start` to run that `node server.js`

    `"server": "nodemon server.js"` new script to run nodemon with `npm run server`



### Connecting to MongoDB with Mongoose

1. create a `keys.js` file inside `config` directory and stick in the MongoDB URI from **mLab** to keys.js

   ```javascript
   //make this obj available outside this file
   module.exports = {
     mongoURI:
       "mongodb://username:password@ds117545.mlab.com:17545/react-social-network"
   };
   ```

2. add `const mongoose = require("mongoose");` and then add to `server.js`

   ```javascript
   //DB Config
   const db = require("./config/keys").mongoURI;
   
   // Connect to MongoDB thru Mongoose
   mongoose
     .connect(db)
     //.then = if it connects successfully
     .then(() => console.log("MongoDB Connected"))
     //catches if login had error (wrong pw in keys.js or something)
     .catch(err => console.log(err));
   ```



### Routing Files with Express Router

Separate routes for each of our resources

1. new `routes` folder, make new `api` folder and make
   1. `users.js` takes care of authentication (username, email, authentic)
   2. `profile.js` (location, bio, experience, network length)
   3. `posts.js` for user posts and comments

2. add them into `server.js`

   ```javascript
   const users = require("./routes/api/users");
   const profile = require("./routes/api/profile");
   const posts = require("./routes/api/posts");
   ```

3. use the routes with `app.use`

   ```javascript
   // Use Routes
   app.use('/api/users', users);
   app.use('/api/profile', profile);
   app.use('/api/posts', posts);
   ```

   will get error cause routes haven't been set

4. `users.js` `profile.js` `posts.js`

   ```javascript
   const express = require("express");
   const router = express.Router();
   
   router.get("/test", (req, res) => res.json({msg: "<Route> Works Fine"}));
   
   module.exports = router;
   ```

5. `http://localhost:5000/api/<Routes>/test` to see the message on browser

   *SIDE NOTE: `rm -rf .git` to undo git repo*



### Creating User Model: Authentication, JSON webtokens, Register, Login

1. create `models` directory and then `User.js` (caps is convention)

2. inside `User.js`

   ```javascript
   const mongoose = require("mongoose"); 	//mongoose dependencies
   const Schema = mongoose.Schema;			//using Schema to create model
   
   //Create Schema
   const UserSchema = new Schema({
     //name email password avatar date
     name: {
       type: String,
       required: true
     },
     email: {
       type: String,
       required: true
     },
     password: {
       type: String,
       required: true
     },
     avatar: {
       type: String,
       required: true
     },
     date: {
       type: Date,
       default: Date.now //current timestamp
     }
   });
   
   module.exports = User = mongoose.model("users", UserSchema);
   ```


### User Registration w/ Postman

1. `users.js` and create a route

   ```javascript
   // @route   GET api/users/register
   // @desc    Register user
   // @access  Public
   router.post("/register", (req, res) => {
     //use mongoose to first find if email exists (line 4 Load User Model)
     User.findOne({ email: req.body.email });
   });
   ```

   `req.body.email` requires us to add body-parser to `server.js`

   ```javascript
   //add these
   
   //require module
   const bodyParser = require('body-parser');
   
   //Body parser middleware
   app.use(bodyParser.urlencoded({extended: false}));
   app.use(bodyParser.json());
   ```

2. installed `npm i gravatar` to pull the avatar out the email

   ```javascript
   const gravatar = require("gravatar");
   
   User.findOne({ email: req.body.email }).then(user => {
       if (user) {
         return res.status(400).json({ email: "Email already exists" });
       } else {
         const avatar = gravatar.url(req.body.email, {
           s: "200", //size
           r: "pg", //Rating
           d: "mm" //default
         });
   
          //create a new user with all these fields
         const newUser = new User({
           name: req.body.name,
           email: req.body.email,
           avatar,
           password: req.body.password
         });
   ```

3. installed `bcryptjs` for password hashing

```javascript
      
const bcrypt = require("bcryptjs");
      
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
```



### Email & Password Login (tokens)

add the login functionality

1. `users.js` added this before module.exports

   ```javascript
   // @route   GET api/users/login
   // @desc    Login User / Returning JWT (token)
   // @access  Public
   router.post("/login", (req, res) => {
     const email = req.body.email;
     const password = req.body.password;
   
     //Find the user by email
     //by using User model
     User.findOne({ email }).then(user => {
       //Check for user
       if (!user) {
         return res.status(404).json({ email: "User not found" });
       }
   
       //If user is good, check password
       //use bcrypt to compare pw and hashed
       bcrypt.compare(password, user.password).then(isMatch => {
         if (isMatch) {
           //if User passed, generate the token
           res.json({ msg: "Successful Login" });
         } else {
           return res.status(400).json({ password: "Incorrect Password" });
         }
       });
     });
   });
   ```


### Creating the JSON Webtoken (JWT) for login

our current logic only says stuff like message success

1. create JWT by importing dependencies and declaring a payload, and then `jwt.sign` to sign the token

   `users.js` (below)

   ```javascript
   //add to header
   const jwt = require("jsonwebtoken");
   
   ..
   ..
   ..
   
   bcrypt.compare(password, user.password).then(isMatch => {
         if (isMatch) {
           //if User passed, generate the token
   
           //Create JWT payload for next step
           const payload = { id: user.id, name: user.name, avatar: user.avatar };
   
           //Sign the token takes payload (userinfo), secret (key), expiration (in seconds), callback
           jwt.sign(
             payload,
             keys.secretOrKey,
             { expiresIn: 3600 },
   
             (err, token) => {
               res.json({
                 success: true,
                 token: "Bearer " + token
               });
             }
           );
         } else {
           return res.status(400).json({ password: "Incorrect Password" });
         }
       }
   ```

2. the key is declared inside the `config` folder's `keys.js`

   ```javascript
   secretOrKey: "secret"
   ```

   and then import it into `users.js`

   ```javascript
   const keys = require("../../config/keys");
   ```

3. reload to see token generated in **Postman**



### Implement Passport for JWT Authentication

verifies token we made in previous step

1. start by including `passport` in server.js

2. add these lines to initialize passport, and then link it to the new `passport.js` file we will create

   ```javascript
   //request and response object
   //app.get("/", (req, res) => res.send("Hello Me"));
   
   //Passport middleware
   app.use(passport.initialize());
   
   //Passport Config
   require('./config/passport')(passport);
   
   // Use Routes
   //app.use("/api/users", users);
   //app.use("/api/profile", profile);
   //app.use("/api/posts", posts);
   ```

3. create `passport.js` in config and write

   ```javascript
   const JwtStrategy = require("passport-jwt").Strategy;
   const ExtractJwt = require("passport-jwt").ExtractJwt;
   //For user info
   const mongoose = require("mongoose");
   const User = mongoose.model("users");
   //This contains our secret to validate request
   const keys = require("../config/keys");
   
   
   
   const opts = {};
   opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
   opts.secretOrKey = keys.secretOrKey;
   
   module.exports = passport => {
     passport.use(
       new JwtStrategy(opts, (jwt_payload, done) => {
         console.log(jwt_payload);
       })
     );
   };
   
   ```

4. Update `users.js` and add a route

   ```javascript
   ...
   //To create protected route for user
   const passport = require("passport");
   
   ...
   ...
   ...
   
   // @route   GET api/users/current
   // @desc    Return current user (who holds token)
   // @access  Private
   router.get(
     "/current",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       res.json({ msg: "Success" });
     }
   );
   
   module.exports = router;
   ```

   

5. Postman now shows that we are not authenticated to access `http://localhost:5000/api/users/currents`

6. To fix this, POST request to **Postman** a login, and copy the JWT token (Bearer) and then go back to update `passport.js`

   ```javascript
   ...
   ...
   
   ...
   
   module.exports = passport => {
     passport.use(
       new JwtStrategy(opts, (jwt_payload, done) => {
         User.findById(jwt_payload.id)
           .then(user => {
             if (user) {
               return done(null, user);
             }
             return done(null, false);
           })
           .catch(err => console.log(err));
       })
     );
   };
   ```

   

7. Now, do a GET request on Postman to step 5. and pass in the token as a **Header**

8. Works

9. update `users.js`to only return what we want

   ```javascript
   // @route   GET api/users/current
   // @desc    Return current user (who holds token)
   // @access  Private
   router.get(
     "/current",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       res.json({
         id: req.user.id,
         name: req.user.name,
         email: req.user.email
       });
     }
   );
   ```



### Validation

to make sure that login info throws the correct errors if needed

1. using `validator.js` for a bunch of good stuff

2. in `register.js`

   ```javascript
   const Validator = require("validator");
   
   module.exports = function validateRegisterInput(data) {
     let errors = {};
   
     if(!Validator.isLength(data.name, { min: 2, max: 30 })){
         errors.name = 'Name must be between 2 and 30 characters';
     }
   
     return {
         errors,
         isValid: errors
     }
   };
   ```

3. we need isValid to work, so we make `is-empty.js`

   to check for any empty ANYTHING

   `is-empty.js`

   ```javascript
   function isEmpty(value) {
     return (
       value === undefined ||
       value === null ||
       (typeof value === "object" && Object.keys(value).length === 0) ||
       (typeof value === "string" && value.trim().length === 0)
     );
   }
   module.exports = isEmpty;
   
   or
   
   const isEmpty = value =>
     value === undefined ||
     value === null ||
     (typeof value === "object" && Object.keys(value).length === 0) ||
     (typeof value === "string" && value.trim().length === 0);
   
   module.exports = isEmpty;
   
   ```

4. go to `users.js` and add

   ```javascript
   // Load Input Validation
   const validateRegisterInput = require('../../validation/register');
   
   and
   
   
   // @route   GET api/users/register
   // @desc    Register user
   // @access  Public
   router.post("/register", (req, res) => {
     //using destructuring to get the error message from isValid, from register.js
     const { errors, isValid } = validateRegisterInput(req.body);
   
     // Check validation, if not valid, return a 400 error
     if (!isValid) {
       return res.status(400).json(errors);
     }
   ```

5. Now any invalid username can't be registered on Postman

6. We want to make sure register fields look correct, modify `register.js`

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validateRegisterInput(data) {
     let errors = {};
   
     // gets tested as an empty string
     data.name = !isEmpty(data.name) ? data.name : "";
     data.email = !isEmpty(data.email) ? data.email : "";
     data.password = !isEmpty(data.password) ? data.password : "";
     // the confirm password
     data.password2 = !isEmpty(data.password2) ? data.password2 : "";
   
     if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
       errors.name = "Name must be between 2 and 30 characters";
     }
   
     if (Validator.isEmpty(data.name)) {
       errors.name = "Name field is required";
     }
   
     if (Validator.isEmpty(data.email)) {
       errors.email = "Email field is required";
     }
   
     if (!Validator.isEmail(data.email)) {
       errors.email = "Invalid Email";
     }
   
     if (Validator.isEmpty(data.password)) {
       errors.password = "Password field is required";
     }
   
     if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
       errors.password = "Password must be at least 6 characters";
     }
   
     if (Validator.isEmpty(data.password2)) {
       errors.password2 = "Retype your password";
     }
   
     if (!Validator.equals(data.password, data.password2)) {
       errors.password2 = "Passwords must match";
     }
   
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   
   ```

7. fill `login.js` with

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validateLoginInput(data) {
     let errors = {};
   
     // gets tested as an empty string
     data.email = !isEmpty(data.email) ? data.email : "";
     data.password = !isEmpty(data.password) ? data.password : "";
   
     if (!Validator.isEmail(data.email)) {
       errors.email = "Invalid Email";
     }
   
     if (Validator.isEmpty(data.password)) {
       errors.password = "Password field is required";
     }
   
      //the order of checking matters
     if (Validator.isEmpty(data.email)) {
       errors.email = "Email field is required";
     }
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   ```

   exclude the options we don't need, and then add this file to `users.js`

   ```javascript
   const express = require("express");
   const router = express.Router();
   const gravatar = require("gravatar");
   const bcrypt = require("bcryptjs");
   const jwt = require("jsonwebtoken");
   const keys = require("../../config/keys");
   //To create protected route for user
   const passport = require("passport");
   
   // Load Input Validation
   const validateRegisterInput = require("../../validation/register");
   const validateLoginInput = require("../../validation/login");
   
   // Load User Model
   const User = require("../../models/User");
   
   // @route   GET api/users/test
   // @desc    Tests users route
   // @access  Public
   router.get("/test", (req, res) => res.json({ msg: "Users Works Fine" }));
   
   ...
   ...
   ...
   ```



### Profile API Routes

Creating the models for our profiles with mongoose and schema

1. new `Profile.js` file inside `models`

   ```javascript
   const mongoose = require("mongoose");
   const Schema = mongoose.Schema;
   
   // Create Schema
   const ProfileSchema = new Schema({
     user: {
       type: Schema.Types.ObjectId,
       ref: "users"
     },
     handle: {
       type: String,
       required: true,
       max: 40
     },
     comapny: {
       type: String,
       required: false
     },
     website: {
       type: String,
       required: false
     },
     location: {
       type: String
     },
     status: {
       type: String,
       required: true
     },
     skills: {
       //array of strings declaration
       type: [String],
       required: true
     },
     bio: {
       type: String,
       required: false
     },
     githubusername: {
       type: String
     },
     experience: [
       {
         title: {
           type: String,
           required: true
         },
         company: {
           type: String,
           required: true
         },
         location: {
           type: String
         },
         from: {
           type: Date,
           required: true
         },
         to: {
           type: Date
         },
         current: {
           type: Boolean,
           default: false
         },
         description: {
           type: String
         }
       }
     ],
     education: [
       {
         school: {
           type: String,
           required: true
         },
         degree: {
           type: String,
           required: true
         },
         fieldofstudy: {
           type: String,
           required: true
         },
         from: {
           type: Date,
           required: true
         },
         to: {
           type: Date
         },
         current: {
           type: Boolean,
           default: false
         },
         description: {
           type: String
         }
       }
     ],
     social: {
       youtube: {
         type: String
       },
       twitter: {
         type: String
       },
       facebook: {
         type: String
       },
       linkedin: {
         type: String
       },
       instagram: {
         type: String
       }
     },
     date: {
       type: Date,
       default: Date.now
     }
   });
   
   //export this as a Mongoose model, add the Profile Schema
   module.exports = Profile = mongoose.model("profile", ProfileSchema);
   ```



### Route the Profile Models

1. go to `profile.js` route current user profile
2. bring in mongoose, passport, profile models, and user models

```javascript
//Bringing these in to route the Profile models
const mongoose = require("mongoose");
const passport = require("passport");
//Load profile Models
const Profile = requre('../../models/Profile');
//Load User Models
const User = require('../../models/User');
```

3. make get request to get current user profile

   ```javascript
   // @route   GET api/profile
   // @desc    Get current user profile
   // @access  Private
   router.get(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //We want errors to be stored into objects, before we pass the into .json
       const errors = {};
   
       Profile.findOne({ user: req.user.id })
         .then(profile => {
           if (!profile) {
             //Create the error
             errors.noprofile = "There is no profile for this user";
             //Pass it into Json
             return res.status(404).json(errors);
           }
           res.json(profile);
         })
         .catch(err => res.status(404).json(err));
     }
   );
   ```

4. Postman -> login -> post -> login with user -> get token -> `http://localhost:5000/api/profile` and see that profiles work



### Create & Update Profile Routes

make a post route to create a profile

1. in `profile.js`

   ```javascript
   // @route   POST api/profile
   // @desc    Create / Edit user profile
   // @access  Private
   router.post(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       // Get fields
       const profileFields = {};
       profileFields.user = req.user.id;
   
       //check to see if the field we are looking for has been sent it, and then set it as profileFields
       if (req.body.handle) profileFields.handle = req.body.handle;
       if (req.body.company) profileFields.company = req.body.company;
       if (req.body.website) profileFields.website = req.body.website;
       if (req.body.location) profileFields.location = req.body.location;
       if (req.body.bio) profileFields.bio = req.body.bio;
       if (req.body.status) profileFields.status = req.body.status;
       if (req.body.githubusername)
         profileFields.githubusername = req.body.githubusername;
   
       //Skills - split into array (it comes in as csv)
       if (typeof req.body.skills !== "undefined") {
         profileFields.skills = req.body.skills.split(",");
       }
   
       //Social - also an array of objects
       profileFields.social = {};
       if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
       if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
       if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
       if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
       if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
   
       //Look for the user before updating stuff
       Profile.findOne({ user: req.user.id }).then(profile => {
         if (profile) {
           //Update the profile, since one exists
           Profile.findOneAndUpdate(
             //who to update
             { user: req.user.id },
             //the other fields we have req.body'ed for before
             { $set: profileFields },
             { new: true }
           )
             //respond WITH that profile
             .then(profile => res.json(profile));
         } else {
           //Create a user since one does not exist
   
           //Check to see if handle exists
           Profile.findOne({ handle: profileFiends.handle }).then(profile => {
             if (profile) {
               errors.handle = "That handle already exists";
               //error
               res.status(400).json(errors);
             }
             //other wise
             //Save Profile
             new Profile(profileFields).save().then(profile => res.json(profile));
           });
         }
       });
     }
   );
   ```



### Profile Field Validations

1. create a new `profile.js` inside `validation`directory and 

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validateLoginInput(data) {
     let errors = {};
   
     // gets tested as an empty string
     data.handle = !isEmpty(data.handle) ? data.handle : "";
     data.status = !isEmpty(data.status) ? data.status : "";
     data.skills = !isEmpty(data.skills) ? data.skills : "";
   
     if (!Validator.isLength(data.handle, { min: 2, max: 40 })) {
       errors.handle = "Handle needs to be at least 2 characters";
     }
     if (Validator.isEmpty(data.handle)) {
       errors.handle = "Profile handle is required";
     }
     if (Validator.isEmpty(data.status)) {
       errors.status = "Status field is required";
     }
     if (Validator.isEmpty(data.skills)) {
       errors.skills = "Skills field is required";
     }
   
     if (!isEmpty(data.website)) {
       if (!Validator.isURL(data.website)) {
         errors.website = "Not a valid URL";
       }
     }
     if (!isEmpty(data.youtube)) {
       if (!Validator.isURL(data.youtube)) {
         errors.youtube = "Not a valid URL";
       }
     }
     if (!isEmpty(data.twitter)) {
       if (!Validator.isURL(data.twitter)) {
         errors.twitter = "Not a valid URL";
       }
     }
     if (!isEmpty(data.facebook)) {
       if (!Validator.isURL(data.facebook)) {
         errors.facebook = "Not a valid URL";
       }
     }
     if (!isEmpty(data.linkedin)) {
       if (!Validator.isURL(data.linkedin)) {
         errors.linkedin = "Not a valid URL";
       }
     }
     if (!isEmpty(data.instagram)) {
       if (!Validator.isURL(data.instagram)) {
         errors.instagram = "Not a valid URL";
       }
     }
   
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   ```

2. go to `/api/profile.js` and add the validateProfileInput line

   ```javascript
   // @route   POST api/profile
   // @desc    Create / Edit user profile
   // @access  Private
   router.post(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       const { errors, isValid } = validateProfileInput(req.body);
   
       //Check Validation
       if (!isValid) {
         //Return any error with 400 status
         return res.status(400).json(errors);
       }
   ```

3. add dependency on header

   ```javascript
   //Load Validation
   const validateProfileInput = require("../../validation/profile");
   ```

4. On postman  POST `http://localhost:5000/api/profile`

   - login with the authentication key
   - I can now add fields onto my profile
   - handle, status, skills, company, website, facebook, linked etc..

5. go back to `api/profile.js` and add this line to bring the name and avatar to the front

   ```javascript
   
   // @route   GET api/profile
   // @desc    Get current user profile
   // @access  Private
   router.get(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //We want errors to be stored into objects, before we pass the into .json
       const errors = {};
   
       Profile.findOne({ user: req.user.id })
   
         //Used to bring avatar to profile
         .populate("user", ["name", "avatar"])
   
         .then(profile => {
   ```

6. now we can POST req on Postman `api/profile` with key and we see our gravatar on our profile



### More Profile Routes

getting profile by handle, by id, and to fetch all profiles

1. `api/profile.js` make a new get request before `api/profile` GET request, this one to grab profile by handle

   ```javascript
   // @route   GET api/profile/handle/:handle
   // @desc    Get profile by handle
   // @access  Public
   router.get("/handle/:handle", (req, res) => {
     const errors = {};
   
     //grabs handle from the URL
     Profile.findOne({ handle: req.params.handle })
       .populate("user", ["name", "avatar"])
       .then(profile => {
         //check to see if there is no profile
         if (!profile) {
           errors.noprofile = "There is no profile for this user";
           res.status(404).json(errors);
         }
         //if there is profile found
         res.json(profile);
       })
       .catch(err => res.status(404).json(errors));
   });
   ```

2. make another one, except this one to fetch profile by ID

   ```javascript
   // @route   GET api/profile/user/:user_id
   // @desc    Get profile by user id
   // @access  Public
   router.get("/user/:user_id", (req, res) => {
       const errors = {};
     
       //grabs handle from the URL
       Profile.findOne({ user: req.params.user_id })
         .populate("user", ["name", "avatar"])
         .then(profile => {
           //check to see if there is no profile
           if (!profile) {
             errors.noprofile = "There is no profile for this user";
             res.status(404).json(errors);
           }
           //if there is profile found
           res.json(profile);
         })
         .catch(err => res.status(404).json(errors));
     });
   ```



### Add Experience & Education Routes

1. in `api/profile.js` add a new POST request

   ```javascript
   // @route   GET api/profile/experience
   // @desc    Add experience to profile
   // @access  Private
   router.post(
     "/experience",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //let's find a user by id
       Profile.findOne({ user: req.user.id }).then(profile => {
         //new Experience object
         const newExp = {
           title: req.body.title,
           company: req.body.company,
           location: req.body.location,
           from: req.body.from,
           to: req.body.to,
           current: req.body.current,
           description: req.body.description
         };
   
         //Add to experience array
         profile.experience.unshift(newExp);
         //now save existing profile, which returns a promise
         profile.save().then(profile => res.json(profile));
       });
     }
   );
   ```

2. Now we go to `validation` to create a new `experience.js`

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validateExperienceInput(data) {
     let errors = {};
   
     // gets tested as undef or null and gets turned into an expty string
     data.title = !isEmpty(data.title) ? data.title : "";
     data.company = !isEmpty(data.company) ? data.company : "";
     data.from = !isEmpty(data.from) ? data.from : "";
   
     if (Validator.isEmpty(data.title)) {
       errors.title = "Job title field is required";
     }
   
     if (Validator.isEmpty(data.Company)) {
       errors.Company = "Company field is required";
     }
   
     if (Validator.isEmpty(data.from)) {
       errors.from = "From date field is required";
     }
   
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   
   ```

3. add this to `profile.js` routes

   `const validateExperienceInput = require("../../validation/experience");`

4. and update the POST route to check for validation

   ```javascript
   // @route   GET api/profile/experience
   // @desc    Add experience to profile
   // @access  Private
   router.post(
     "/experience",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //create the valid check variable
       const { errors, isValid } = validateExperienceInput(req.body);
   
       //Check Validation
       if (!isValid) {
         //Return any error with 400 status
         return res.status(400).json(errors);
       }
       //let's find a user by id
       Profile.findOne({ user: req.user.id }).then(profile => {
         //new Experience object
         const newExp = {
           title: req.body.title,
           company: req.body.company,
           location: req.body.location,
           from: req.body.from,
           to: req.body.to,
           current: req.body.current,
           description: req.body.description
         };
   
         //Add to experience array
         profile.experience.unshift(newExp);
         //now save existing profile, which returns a promise
         profile.save().then(profile => res.json(profile));
       });
     }
   );
   ```

5. now let's add the Education Routes, copy over the route we made and rename to education

   ```javascript
   // @route   GET api/profile/education
   // @desc    Add education to profile
   // @access  Private
   router.post(
     "/education",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //create the valid check variable
       const { errors, isValid } = validateEducationInput(req.body);
   
       //Check Validation
       if (!isValid) {
         //Return any error with 400 status
         return res.status(400).json(errors);
       }
       //let's find a user by id
       Profile.findOne({ user: req.user.id }).then(profile => {
         //new Education object
         const newEdu = {
           school: req.body.school,
           degree: req.body.degree,
           fieldofstudy: req.body.fieldofstudy,
           from: req.body.from,
           to: req.body.to,
           current: req.body.current,
           description: req.body.description
         };
   
         //Add to Education array
         profile.education.unshift(newEdu);
         //now save existing profile, which returns a promise
         profile.save().then(profile => res.json(profile));
       });
     }
   );
   ```

   and add the header

   `const validateEducationInput = require("../../validation/education");`

6. add an `education.js` file to `validation` directory and make a similar clone to `experience.js`

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validateExperienceInput(data) {
     let errors = {};
   
     // gets tested as undef or null and gets turned into an expty string
     data.school = !isEmpty(data.school) ? data.school : "";
     data.degree = !isEmpty(data.degree) ? data.degree : "";
     data.fieldofstudy = !isEmpty(data.fieldofstudy) ? data.fieldofstudy : "";
     data.from = !isEmpty(data.from) ? data.from : "";
   
     if (Validator.isEmpty(data.school)) {
       errors.school = "School field is required";
     }
   
     if (Validator.isEmpty(data.degree)) {
       errors.degree = "Degree field is required";
     }
   
     if (Validator.isEmpty(data.fieldofstudy)) {
       errors.fieldofstudy = "Field of study field is required";
     }
     if (Validator.isEmpty(data.from)) {
       errors.from = "From date field is required";
     }
   
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   
   ```

   

### Delete Education and Experience from Profile

1. new `profile.js` route, first **DELETE** request

   ```javascript
   // @route   DELETE api/profile/experience//:exp_id
   // @desc    Delete experience from profile
   // @access  Private
   router.delete(
     "/experience/:exp_id",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //let's find a user by id
       Profile.findOne({ user: req.user.id }).then(profile => {
         //Find the experience that we want to delete
         //Get remove index
         //Use indexofmap
         const removeIndex = profile.experience
           //turn array of experiences into id's
           .map(item => item.id)
           //gets us the experience to delete
           .indexOf(req.params.exp_id);
   
         //Splice out of the array
         profile.experience.splice(removeIndex, 1);
   
         //Save
         profile
           .save()
           .then(profile => res.json(profile))
   
           //Catch
           .catch(err => res.status(404).json(err));
       });
     }
   );
   ```

2. same thing for education

   ```javascript
   // @route   DELETE api/profile/education//:edu_id
   // @desc    Delete education from profile
   // @access  Private
   router.delete(
     "/education/:edu_id",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //let's find a user by id
       Profile.findOne({ user: req.user.id }).then(profile => {
         //Find the education that we want to delete
         //Get remove index
         //Use indexofmap
         const removeIndex = profile.education
           //turn array of educations into id's
           .map(item => item.id)
           //gets us the education to delete
           .indexOf(req.params.edu_id);
   
         //Splice out of the array
         profile.education.splice(removeIndex, 1);
   
         //Save
         profile
           .save()
           .then(profile => res.json(profile))
   
           //Catch
           .catch(err => res.status(404).json(err));
       });
     }
   );
   ```

3. we can now do post requests on **Postman** to delete education and experience

   ```html
   http://localhost:5000/api/profile/experience/objectid
   http://localhost:5000/api/profile/education/objectid
   ```



#### Route to delete User and Profile

1. add a new **DELETE** request in `profile.js`

   ```javascript
   // @route   DELETE api/profile
   // @desc    Delete user and profile
   // @access  Private
   router.delete(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //Delete the profile
       Profile.findOneAndRemove({ user: request.user.id }).then(() => {
         //Delete the user (needs user Model)
         User.findOneAndRemove({ _id: req.user.id }).then(() =>
           res.json({ success: true })
         );
       });
     }
   );
   
   ```

   



### Creating the Post Feature

get, delete, like, unlike, add, comment, and remove comments

1. create a post model in models `post.js` 

   ```javascript
   const mongoose = require("mongoose");
   const Schema = mongoose.Schema;
   
   //Create Schema
   const PostSchema = new Schema({
     //fields for post
     user: {
       type: Schema.Types.ObjectId,
       ref: "users"
     },
     text: {
       type: String,
       required: true
     },
     //Want each post to have their name and avatar, these come FROM user object
     name: {
       type: String
     },
     avatar: {
       type: String
     },
     likes: [
       //link each like to the user that made the like
       //when they hit like,user.id will be passed in
       {
         user: {
           type: Schema.Types.ObjectId,
           ref: "users"
         }
       }
     ],
     comments: [
       {
         user: {
           type: Schema.Types.ObjectId,
           ref: "users"
         },
         text: {
           type: String,
           required: true
         },
         name: {
           type: String
         },
         avatar: {
           type: String
         },
         date: {
           type: Date,
           default: Date.now
         }
       }
     ],
     //date for the post
     date: {
       type: Date,
       default: Date.now
     }
   });
   
   module.exports = Post = mongoose.model("post", PostSchema);
   
   ```

2. update `posts.js`

   ```javascript
   const express = require("express");
   const router = express.Router();
   //bring in mongoose for database
   const mongoose = require("mongoose");
   //passport to protect the routes
   const passport = require("passport");
   //bring in post model
   const Post = require("../../models/Post");
   
   // @route   GET api/posts/test
   // @desc    Tests post route
   // @access  Public
   router.get("/test", (req, res) => res.json({ msg: "Posts Works Fine" }));
   
   // @route   POST api/posts
   // @desc    Create post
   // @access  Private
   router.post(
     "/",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       const newPost = new Post({
         text: req.body.text,
         name: req.body.name,
         avatar: req.body.name,
         user: req.user.id
       });
   
       newPost.save().then(post => res.json(post));
     }
   );
   
   module.exports = router;
   
   ```

3. Create validation `validation/post.js`

   ```javascript
   const Validator = require("validator");
   const isEmpty = require("./is-empty");
   
   module.exports = function validatePostInput(data) {
     let errors = {};
   
     // gets tested as an empty string
     data.text = !isEmpty(data.text) ? data.text : "";
   
     if (!Validator.isLength(data.text, { min: 2, max: 300 })) {
       errors.text = "Post must be between 2 and 300 characters";
     }
   
     if (Validator.isEmpty(data.text)) {
       errors.text = "Text field is required";
     }
   
     return {
       errors,
       isValid: isEmpty(errors)
     };
   };
   
   ```

   and include it in `api/posts.js`

   `const validatePostInput = require("../../validation/post");`



### Post Create Route Setup

1. create route in `posts.js` to get all posts

2. ```javascript
   // @route   GET api/posts
   // @desc    Get posts
   // @access  Public
   router.get("/", (req, res) => {
     Post.find()
       .sort({ date: -1 })
       .then(posts => res.json(posts))
       .catch(err => res.status(404).json({ nopostsfound: "No posts found" }));
   });
   ```

2. create route to get one post

   ```javascript
   // @route   GET api/posts/:id
   // @desc    Get posts by id
   // @access  Public
   router.get("/:id", (req, res) => {
     //find by id
     Post.findById(req.params.id)
       .then(posts => res.json(posts))
       .catch(err =>
         res.status(404).json({ nopostfound: "No post found with this id" })
       );
   });
   ```

#### Delete Posts

1. add a DELETE route to `posts.js`

   ```javascript
   // @route   DELETE api/posts/:id
   // @desc    Delete posts by id
   // @access  Private
   router.delete(
     "/:id",
     passport.authenticate("jwt", { session: false }),
     (req, res) => {
       //make sure owner of post is doing the deleting, add profile model
       Profile.findOne({ user: req.user.id })
         //with this profile,
         .then(profile => {
           Post.findById(req.params.id)
             .then(post => {
               // Check for post owner: post.user is not a string, so convert it
               if (post.user.toString != req.user.id) {
                 return res
                   .status(401)
                   .json({ notauthorized: "User not authorized" });
               }
   
               //Delete post
               post.remove().then(() => res.json({ success: true }));
             })
             .catch(err =>
               res.status(404).json({ postnotfound: "No post found with this id" })
             );
         });
     }
   );
   ```

   make sure to add Profile model to header

   ```javascript
   //Add Profile model
   const Profile = require("../../models/Profile");
   ```



### Post Like & Unlike Routes Setup

1. in `posts.js` make a new post request

   ```javascript
   // @route   POST api/posts/like/:id
   // @desc    Like Post
   // @access  Private
   router.post(
     '/like/:id',
     passport.authenticate('jwt', { session: false }),
     (req, res) => {
       Post.findById(req.params.id)
         .then(post => {
           if (
             post.likes.filter(like => like.user.toString() === req.user.id)
               .length > 0
           ) {
             return res
               .status(400)
               .json({ alreadyliked: 'User already liked this post' });
           }
   
           post.likes.unshift({ user: req.user.id });
           post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'No post to like' }));
     }
   );
   ```

   this section was some trouble; Postman would not pull up a post by id, although the user verification part was working. I had to rewrite it, take out the profile verification, and edit a line in `server.js` for mongoose to use the updated URL parser `  .connect(db, { useNewUrlParser: true })`.

2. For unlikes, same thing, except we splice the like out of the array of likes

   ```javascript
   // @route   POST api/posts/unlike/:id
   // @desc    Unike Post
   // @access  Private
   router.post(
     '/unlike/:id',
     passport.authenticate('jwt', { session: false }),
     (req, res) => {
       Post.findById(req.params.id)
         .then(post => {
           if (
             (post.likes.filter(
               like => like.user.toString() === req.user.id
             ).length = 0)
           ) {
             return res
               .status(400)
               .json({ alreadyliked: 'User did not like this post' });
           }
           //Get the remove index
           const removeIndex = post.likes
             .map(item => item.user.toString())
             .indexOf(req.user.id);
   
           //Splice out of the array
           post.likes.splice(removeIndex, 1);
   
           //Save
           post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'No post to like' }));
     }
   );
   ```



### Adding / Removing Comments model and routes

1. add a new route 

   ```javascript
   // @route   POST api/posts/comment/:id
   // @desc    Add a comment to Post
   // @access  Private
   router.post(
     '/comment/:id',
     passport.authenticate('jwt', { session: false }),
     (req, res) => {
       Post.findById(req.params.id)
         .then(post => {
           const newComment = {
             text: req.body.text,
             name: req.body.name,
             avatar: req.body.avatar,
             user: req.user.id
           };
   
           //Push this onto the comments array
           post.comments.unshift(newComment);
   
           //Save
           post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
     }
   );
   ```

   

2. validate by using `validation/post` because you you can't have a comment without a post anyways

   ```javascript
   // @route   POST api/posts/comment/:id
   // @desc    Add a comment to Post
   // @access  Private
   router.post(
     '/comment/:id',
     passport.authenticate('jwt', { session: false }),
     (req, res) => {
       const { errors, isValid } = validatePostInput(req.body);
   
       //Check validation
       if (!isValid) {
         // If any errors, send 400 w/ errors object
         return res.status(400).json(errors);
       }
       Post.findById(req.params.id)
         .then(post => {
           const newComment = {
             text: req.body.text,
             name: req.body.name,
             avatar: req.body.avatar,
             user: req.user.id
           };
   
           //Push this onto the comments array
           post.comments.unshift(newComment);
   
           //Save
           post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
     }
   );
   ```

3. For deleting comments, copy the previous and make a **DELETE** request

   ```javascript
   // @route   DELETE api/posts/comment/:id/:comment_id
   // @desc    Remove comment from post
   // @access  Private
   router.delete(
     '/comment/:id/:comment_id',
     passport.authenticate('jwt', { session: false }),
     (req, res) => {
       Post.findById(req.params.id)
         .then(post => {
           if (
             post.comments.filter(
               comment => comment._id.toString() === req.params.comment_id
             ).length === 0
           ) {
             res.status(404).json({ commentnoexist: ' Comment does not exist' });
           }
   
           const removeIndex = post.comments
             .map(item => item._id.toString())
             .indexOf(req.params.comment_id);
   
           post.comments.splice(removeIndex, 1);
           post.save().then(post => res.json(post));
         })
         .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
     }
   );
   ```





## FRONT END SECTION (FINALLY)

We are using a bootstrap framework to link the backend API to the frontend



### Implementing React - with concurrently

1. inside the `DEVNET` folder `create-react-app client` to make the app inside client folder

2. all the client stuff is REACT

3. open `package.json` and add a proxy value: so that the `axios` request to the backend 

4. we will use **<u>concurrently</u>** `npm i concurrently`, and then add a client to the scripts to the DevNet `package.json` `"npm install --prefix client"`

   ```javascript
     "scripts": {
       "client-install": "npm install --prefix client",
       "start": "node server.js",
       "server": "nodemon server.js",
       "client": "npm start --prefix client",
       //this one runs both the server and the client
       "dev": "concurrently \"npm run server\" \"npm run client\""
     },
   ```

5. from now on, `npm run dev` is the command we use to run both

6. Do some cleanup

   1. delete `logo.svg`

   2. change `App.js`to

      ```react
      import React, { Component } from 'react';
      import './App.css';
      
      class App extends Component {
        render() {
          return (
            <div className="App">
              <h1> HEy </h1>
            </div>
          );
        }
      }
      ```

   3. get rid of everything in `App.css` and replace it with `style.css` from `/devnet_theme/css`

   4. change `  background: url('./img/showcase.jpg') no-repeat;` and add a new `img` directory, and then add the `showcase.jpg` from `devnet_theme`

7. `public/index.html` and install bootstrap

   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico" />
       <!-- Added bootstrap -->
       <link
         rel="stylesheet"
         href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css"
         integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS"
         crossorigin="anonymous"
       />
       <link
         rel="stylesheet"
         href="https://use.fontawesome.com/releases/v5.7.1/css/all.css"
         integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr"
         crossorigin="anonymous"
       />
       <meta
         name="viewport"
         content="width=device-width, initial-scale=1, shrink-to-fit=no"
       />
       <meta name="theme-color" content="#000000" />
   
       <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
   
       <title>React App</title>
     </head>
     <body>
       <noscript>You need to enable JavaScript to run this app.</noscript>
       <!--- JS dependencies for BootStrap -->
       <div id="root"></div>
       <script
         src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
         integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
         crossorigin="anonymous"
       ></script>
       <script
         src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js"
         integrity="sha384-wHAiFfRlMFy6i5SRaxvfOCifBUQy1xHdJ/yoi7FRNXMRBu5WHdZYu1hA6ZOblgut"
         crossorigin="anonymous"
       ></script>
       <script
         src="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js"
         integrity="sha384-B0UglyR+jN6CkvvICOB2joaf5I4l3gm9GU6Hc1og6Ls7i6U/mkkaduKaBhlAXv9k"
         crossorigin="anonymous"
       ></script>
     </body>
   </html>
   ```

   

8. install **React Dev Tools** and **Redux Dev Tools** for Google Chrome

9. install fontawesome in `index.html`

   `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.1/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">`, changes shown above



### Basic Layout Setup - Navbar and footer

1. <u>`rfc` tab for functional components / display(dumb components)</u>

2. <u>`rcc` tab for class component</u>

3. open up `landing.html` and grab the navbar code

   ```react
   <!-- Navbar -->
     <nav class="navbar navbar-expand-sm navbar-dark bg-dark mb-4">
       <div class="container">
         <a class="navbar-brand" href="landing.html">DevConnector</a>
         <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#mobile-nav">
           <span class="navbar-toggler-icon"></span>
         </button>
   
         <div class="collapse navbar-collapse" id="mobile-nav">
           <ul class="navbar-nav mr-auto">
             <li class="nav-item">
               <a class="nav-link" href="profiles.html"> Developers
               </a>
             </li>
           </ul>
   
           <ul class="navbar-nav ml-auto">
             <li class="nav-item">
               <a class="nav-link" href="register.html">Sign Up</a>
             </li>
             <li class="nav-item">
               <a class="nav-link" href="login.html">Login</a>
             </li>
           </ul>
         </div>
       </div>
     </nav>
   ```

4. import this new Navbar.js into App.js and add the Navbar in the header

   ```react
   import React, { Component } from 'react';
   
   import Navbar from './components/layout/Navbar';
   
   import './App.css';
   
   class App extends Component {
     render() {
       return (
         <div className="App">
           <Navbar />
           <h1> React Setup Complete </h1>
         </div>
       );
     }
   }
   
   export default App;
   ```

5. in `Footer.js` 

   1. `rfc` tab to create new functional component

   2. **This step uses Emmet and is very helpful**

      `footer.bg-dark.text-white.mt-5.p-4.text-center` (mt for margin top, p for padding) and hit **tab**

      `<footer className="bg-dark text-white mt-5 p-4 text-center"></footer>`

   3. ```javascript
      import React from 'react'
      
      export default function Footer() {
        return (
          <footer className="bg-dark text-white mt-5 p-4 text-center">
              Copyright &copy; {new Date().getFullYear()} DevNet
          </footer>
        )
      
      ```

6. bring in footer to `App.js`

    `import Footer from './components/layout/Footer';`

7. `rcc` tab inside `Landing.js`

   ```javascript
   import React, { Component } from 'react';
   
   class Landing extends Component {
     render() {
       return (
         // Landing
         <div class="landing">
           <div class="dark-overlay landing-inner text-light">
             <div class="container">
               <div class="row">
                 <div class="col-md-12 text-center">
                   <h1 class="display-3 mb-4">Developer Network</h1>
                   <p class="lead">
                     {' '}
                     Create a developer profile/portfolio, share posts and get help
                     from other developers
                   </p>
                   <hr />
                   <a href="register.html" class="btn btn-lg btn-info mr-2">
                     Sign Up
                   </a>
                   <a href="login.html" class="btn btn-lg btn-light">
                     Login
                   </a>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   export default Landing;
   ```

8. Update `App.js` to import Landing and to implement it

   ```react
   import React, { Component } from 'react';
   
   import Navbar from './components/layout/Navbar';
   import Footer from './components/layout/Footer';
   import Landing from './components/layout/Landing';
   
   import './App.css';
   
   class App extends Component {
     render() {
       return (
         <div className="App">
           <Navbar />
           <Landing />
           <Footer />
         </div>
       );
     }
   }
   
   export default App;
   
   ```



### React Router & Component State Setup

**IMPORTANT:** Install the router inside the `client` folder and NOT the main DevNet folder

1. now run `npm i react-router-dom`

2. Now in `App.js`, bring in the BrowserRouter from react-router-dom and make some edits

   ```react
   import React, { Component } from 'react';
   import { BrowserRouter as Router, Route } from 'react-router-dom';
   
   import Navbar from './components/layout/Navbar';
   import Footer from './components/layout/Footer';
   import Landing from './components/layout/Landing';
   
   import './App.css';
   
   class App extends Component {
     render() {
       return (
         <Router>
           <div className="App">
             <Navbar />
             {/* need exact path to make sure route doesn't display all paths */}
             <Route exact path="/" component={Landing} />
             <Footer />
           </div>
         </Router>
       );
     }
   }
   
   export default App;
   
   ```

   

#### Setting Up the registration component / sending JWT 

1. create 'components/auth' as new directoy and create `Login.js and Register.js`, and occupy them with the following code

   `Login.js`

   ```react
   import React, { Component } from 'react';
   
   class Login extends Component {
     render() {
       return (
         <div>
           <h1> Login </h1>
         </div>
       );
     }
   }
   export default Login;
   
   ```

   `Register.js`

   ```react
   import React, { Component } from 'react';
   
   class Register extends Component {
     render() {
       return (
         <div>
           <h1> Register </h1>
         </div>
       );
     }
   }
   export default Register;
   
   ```

2. go back to `App.js` to make use of all this

   ```react
   import React, { Component } from 'react';
   import { BrowserRouter as Router, Route } from 'react-router-dom';
   
   import Navbar from './components/layout/Navbar';
   import Footer from './components/layout/Footer';
   import Landing from './components/layout/Landing';
   
   import Register from './components/auth/Register';
   import Login from './components/auth/Login';
   
   import './App.css';
   
   class App extends Component {
     render() {
       return (
         <Router>
           <div className="App">
             <Navbar />
             <Route exact path="/" component={Landing} />
             <div className="container">
               <Route exact path="/register" component={Register} />
               <Route exact path="/login" component={Login} />
             </div>
             <Footer />
           </div>
         </Router>
       );
     }
   }
   
   export default App;
   
   ```

3. now we want the Login button on the navbar to link to the login page

   ```react
   import React, { Component } from 'react';
   {/* Added Link from react router */}
   import { Link } from 'react-router-dom';
   
   class Navbar extends Component {
     render() {
       return (
         // Navbar
         <div>
           <nav className="navbar navbar-expand-sm navbar-dark bg-dark mb-4">
             <div className="container">
                 {/* Changed this */}
               <Link className="navbar-brand" to="/">
                 DevConnector
               </Link>
               <button
                 className="navbar-toggler"
                 type="button"
                 data-toggle="collapse"
                 data-target="#mobile-nav"
               >
                 <span className="navbar-toggler-icon" />
               </button>
   
               <div className="collapse navbar-collapse" id="mobile-nav">
                 <ul className="navbar-nav mr-auto">
                   <li className="nav-item">
                     <Link className="nav-link" to="/profiles">
                       {' '}
                       Developers
                     </Link>
                   </li>
                 </ul>
   
                 <ul className="navbar-nav ml-auto">
                   <li className="nav-item">
                   	{/* Changed this */}
                     <Link className="nav-link" to="/register">
                       Sign Up
                     </Link>
                   </li>
                   <li className="nav-item">
                       {/* Changed this */}
                     <Link clLinkssName="nav-link" to="/login">
                       Login
                     </Link>
                   </li>
                 </ul>
               </div>
             </div>
           </nav>
         </div>
       );
     }
   }
   
   export default Navbar;
   
   ```

4. same thing for the `Landing.js` page

   ```react
   import React, { Component } from 'react';
   {/* Added Link from react router */}
   import { Link } from 'react-router-dom';
   
   class Landing extends Component {
     render() {
       return (
         // Landing
         <div className="landing">
           <div className="dark-overlay landing-inner text-light">
             <div className="container">
               <div className="row">
                 <div className="col-md-12 text-center">
                   <h1 className="display-3 mb-4">Developer Network</h1>
                   <p className="lead">
                     {' '}
                     Create a developer profile/portfolio, share posts and get help
                     from other developers
                   </p>
                   <hr />
                   {/* Changed this */}
                   <Link to="/register" className="btn btn-lg btn-info mr-2">
                     Sign Up
                   </Link>
                   <Link to="/login" className="btn btn-lg btn-light">
                     Login
                   </Link>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   export default Landing;
   ```



### Signup Form and Component States

Working on the Register component

1. in `Register.js` we are going to bring inthe bootstrap register code and make a few edits, shown as comments

   ```react
   import React, { Component } from 'react';
   
   class Register extends Component {
     // Register is a component so we need to make a constructor
     constructor() {
       super();
       this.state = {
         name: '',
         email: '',
         password: '',
         password2: '',
         errors: {
           //Will use with Redux later
         }
       };
   
       //Binds onChange and onSubmit to the states object
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     onChange(event) {
       //Whenever user sets this off, we set state variables to whatever the user put in
       this.setState({ [event.target.name]: event.target.value });
     }
   
     //Whenever this gets set off, store whatever the user typed in as a state object and pass it out
     onSubmit(event) {
       event.preventDefault();
   
       const newUser = {
         name: this.state.name,
         email: this.state.email,
         password: this.state.password,
         password2: this.state.password2
       };
   
       console.log(newUser);
     }
   
     render() {
       return (
         <div className="register">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Sign Up</h1>
                 {/* Added on Submit  */}
                 <form onSubmit={this.onSubmit}>
                   <div className="form-group">
                     <input
                       type="text"
                       className="form-control form-control-lg"
                       placeholder="Name"
                       name="name"
                       // link this input to that state value
                       value={this.state.name}
                       onChange={this.onChange}
                     />
                   </div>
                   <div className="form-group">
                     <input
                       type="email"
                       className="form-control form-control-lg"
                       placeholder="Email Address"
                       name="email"
                       // link this input to that state value
                       value={this.state.email}
                       onChange={this.onChange}
                     />
                     <small className="form-text text-muted">
                       This site uses Gravatar so if you want a profile image, use
                       a Gravatar email
                     </small>
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className="form-control form-control-lg"
                       placeholder="Password"
                       name="password"
                       // link this input to that state value
                       value={this.state.password}
                       onChange={this.onChange}
                     />
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className="form-control form-control-lg"
                       placeholder="Confirm Password"
                       name="password2"
                       // link this input to that state value
                       value={this.state.password2}
                       onChange={this.onChange}
                     />
                   </div>
                   <input type="submit" className="btn btn-info btn-block mt-4" />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   export default Register;
   ```

2. Same thing for the login form, go to `auth/Login.js` and follow the 5 steps

   ```react
   import React, { Component } from 'react';
   
   class Login extends Component {
     //Step 1: Create a constructor
     constructor() {
       super();
       this.state = {
         email: '',
         password: '',
         errors: {
           //Will use with Redux later
         }
       };
   
       //Step 2: Add the bindings for these
       //Binds onChange and onSubmit to the states object
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     //Step 5: Create onChange and onSubmit functions
     onChange(event) {
       this.setState({ [event.target.name]: event.target.value });
     }
   
     onSubmit(event) {
       event.preventDefault();
   
       const currUser = {
         email: this.state.email,
         password: this.state.password
       };
   
       console.log(currUser);
     }
   
     render() {
       return (
         <div className="login">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Log In</h1>
                 <p className="lead text-center">
                   Sign in to your DevConnector account
                 </p>
                 {/* Step 4: Add onSubmit */}
                 <form onSubmit={this.onSubmit}>
                   <div className="form-group">
                     <input
                       type="email"
                       className="form-control form-control-lg"
                       placeholder="Email Address"
                       name="email"
                       //Step 3: link this input to that state value
                       value={this.state.email}
                       onChange={this.onChange}
                     />
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className="form-control form-control-lg"
                       placeholder="Password"
                       name="password"
                       //Step 3: link this input to that state value
                       value={this.state.password}
                       onChange={this.onChange}
                     />
                   </div>
                   <input type="submit" className="btn btn-info btn-block mt-4" />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   export default Login;
   ```

   

### Testing Registration without Redux

Install inside `client` directory: `npm i axios` 

1. Import `axios` into `Register.js`

2. We can now use this to link the front to backend using `axios`

   ```react
   import React, { Component } from 'react';
   //Step 1: Import axios
   import axios from 'axios';
   
   class Register extends Component {
     // Register is a component so we need to make a constructor
     constructor() {
       super();
       this.state = {
         name: '',
         email: '',
         password: '',
         password2: '',
         errors: {
           //Will use with Redux later
         }
       };
   
       //Binds onChange and onSubmit to the states object
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     onChange(event) {
       //Whenever user sets this off, we set state variables to whatever the user put in
       this.setState({ [event.target.name]: event.target.value });
     }
   
     //Whenever this gets set off, store whatever the user typed in as a state object and pass it out
     onSubmit(event) {
       event.preventDefault();
   
       const newUser = {
         name: this.state.name,
         email: this.state.email,
         password: this.state.password,
         password2: this.state.password2
       };
   	
       //Step 2: Create axios
       axios
       //throw a post-request to the api
         .post('/api/users/register', newUser)
         //then respond with the data
         .then(res => console.log(res.data))
         //For the errors, respond with the appropriate error
         .catch(err => console.log(err.response.data));
     }
   ```



### Now we want the Errors to Display under the Input

1. we want the error from `axios` to set to state

   `.catch(err => this.setState({errors: err.response.data}));`

2. we need a conditional class to show the error message, we need to install `classnames` on terminal **IMPORTANT: inside client directory**

   `sudo npm i classnames`

3. import it into `Register.js`

   `import classnames from 'classnames';`

4. Create error catcher for `this.state`

   `const { errors } = this.state;`

5. go inside the className `div`s and change the `className` parameters

   ```react
   className={classnames('form-control form-control-lg', {
   //is-invalid only happens if errors.name exists
   //as we set up in step 4
   'is-invalid': errors.name
   })}
   ```

6. This line brings the error message to the front to display

   ```react
   {errors.name && (
   	<div className="invalid-feedback">{errors.name}</div>
   )}
   ```

7. Add this line to stop HTML5 auto error codes, `noValidate` handles it

   `<form noValidate onSubmit={this.onSubmit}>`

8. Copy step 6 for all the classNames `auth/Register.js`

   ```react
   import React, { Component } from 'react';
   import axios from 'axios';
   import classnames from 'classnames';
   
   class Register extends Component {
     // Register is a component so we need to make a constructor
     constructor() {
       super();
       this.state = {
         name: '',
         email: '',
         password: '',
         password2: '',
         errors: {
           //Will use with Redux later
         }
       };
   
       //Binds onChange and onSubmit to the states object
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     onChange(event) {
       //Whenever user sets this off, we set state variables to whatever the user put in
       this.setState({ [event.target.name]: event.target.value });
     }
   
     //Whenever this gets set off, store whatever the user typed in as a state object and pass it out
     onSubmit(event) {
       event.preventDefault();
   
       const newUser = {
         name: this.state.name,
         email: this.state.email,
         password: this.state.password,
         password2: this.state.password2
       };
   
       axios
         .post('/api/users/register', newUser)
         .then(res => console.log(res.data))
         .catch(err => this.setState({ errors: err.response.data }));
     }
   
     render() {
       //Errors from classname, using deconstruction
       const { errors } = this.state;
   
       return (
         <div className="register">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Sign Up</h1>
                 {/* Added on Submit  */}
                 <form noValidate onSubmit={this.onSubmit}>
                   <div className="form-group">
                     <input
                       type="text"
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.name
                       })}
                       placeholder="Name"
                       name="name"
                       // link this input to that state value
                       value={this.state.name}
                       onChange={this.onChange}
                     />
                     {errors.name && (
                       <div className="invalid-feedback">{errors.name}</div>
                     )}
                   </div>
                   <div className="form-group">
                     <input
                       type="email"
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.email
                       })}
                       placeholder="Email Address"
                       name="email"
                       // link this input to that state value
                       value={this.state.email}
                       onChange={this.onChange}
                     />
                     {errors.email && (
                       <div className="invalid-feedback">{errors.email}</div>
                     )}
                     <small className="form-text text-muted">
                       This site uses Gravatar so if you want a profile image, use
                       a Gravatar email
                     </small>
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.password
                       })}
                       placeholder="Password"
                       name="password"
                       // link this input to that state value
                       value={this.state.password}
                       onChange={this.onChange}
                     />
                     {errors.password && (
                       <div className="invalid-feedback">{errors.password}</div>
                     )}
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.password2
                       })}
                       placeholder="Confirm Password"
                       name="password2"
                       // link this input to that state value
                       value={this.state.password2}
                       onChange={this.onChange}
                     />
                     {errors.password2 && (
                       <div className="invalid-feedback">{errors.password2}</div>
                     )}
                   </div>
                   <input type="submit" className="btn btn-info btn-block mt-4" />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   export default Register;
   
   ```



## Setting up Redux and Authentication

What is Redux?

Used to mainly share data between components

Instead of passing things from component to component, a **single source** of truth goes to all of components.

Like Profiles, Posts, likes, and all the things we know already.

These are pieces of the code we want to share with other pieces.

1. We need to install some things in `client` folder

   ```
   npm i redux react-redux redux-thunk
   ```

2. in `App.js` we wanna import stuff

   ```react
   import { Provider } from 'react-redux';
   ```

   and we want to wrap that around the <Router> too

   ```react
       return (
         <Provider>
         <Router>
           <div className="App">
             <Navbar />
             <Route exact path="/" component={Landing} />
             <div className="container">
               <Route exact path="/register" component={Register} />
               <Route exact path="/login" component={Login} />
             </div>
             <Footer />
           </div>
         </Router>
         </Provider>
   ```

3. we need to create our store variable

   ```react
   import { createStore, applyMiddleware } from 'redux';
   ...
   const store = createStore((() => [], {}, applyMiddleware()));
   ...
   <Provider store={store}>
           <Router>
             <div className="App">
               <Navbar />
               <Route exact path="/" component={Landing} />
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
               </div>
               <Footer />
             </div>
           </Router>
         </Provider>
   ```

4. put the import and const store inside a new file inside `client/src/store.js`

   ```react
   import { createStore, applyMiddleware } from 'redux';
   
   const store = createStore((() => [], {}, applyMiddleware()));
   
   export default store;
   
   ```

5. and import it back into `App.js`

   ```react
   import React, { Component } from 'react';
   import { BrowserRouter as Router, Route } from 'react-router-dom';
   import { Provider } from 'react-redux';
   import store from './store';
   
   import Navbar from './components/layout/Navbar';
   import Footer from './components/layout/Footer';
   import Landing from './components/layout/Landing';
   
   import Register from './components/auth/Register';
   import Login from './components/auth/Login';
   
   import './App.css';
   
   class App extends Component {
     render() {
       return (
         <Provider store={store}>
           <Router>
             <div className="App">
               <Navbar />
               <Route exact path="/" component={Landing} />
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
               </div>
               <Footer />
             </div>
           </Router>
         </Provider>
       );
     }
   }
   
   export default App;
   
   ```

6. import `thunk` from `redux-thunk` and add it into the middleware line

   `store.js`

   ```react
   import { createStore, applyMiddleware } from 'redux';
   import thunk from 'redux-thunk';
   
   const middleware = [thunk];
   
   const store = createStore((() => [], {}, applyMiddleware(...middleware)));
   
   export default store;
   ```

7. we need a reducer now, so create `src/reducers/index.js`

   ```react
   import { combineReducers } from 'redux';
   import authReducer from './authReducer';
   
   export default combineReducers({
       auth: authReducer
   })
   ```

8. and `src/reducers/authReducer.js`

   ```react
   const initialState = {
     isAuthenticated: false,
     user: {}
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       default:
         return state;
     }
   }
   ```

9. update `store.js`

   ```react
   import { createStore, applyMiddleware } from 'redux';
   import thunk from 'redux-thunk';
   import rootReducer from './reducers';
   
   const initialState = {};
   
   const middleware = [thunk];
   
   const store = createStore(
     rootReducer,
     initialState,
     applyMiddleware(...middleware)
   );
   
   export default store;
   
   ```

10. we need to bring in `compose` from redux to be able to call the redux chrome development extension

    ```react
    import { createStore, applyMiddleware, compose } from 'redux';
    import thunk from 'redux-thunk';
    import rootReducer from './reducers';
    
    const initialState = {};
    
    const middleware = [thunk];
    
    const store = createStore(
      rootReducer,
      initialState,
      compose(
        applyMiddleware(...middleware),
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
      )
    );
    
    export default store;
    
    ```



### Redux Action & Reducer Workflow

Everything in Redux works in Actions, so we want to get rid of the old axios requests and replace them with Actions

1. create `client/src/actions/authActions.js`

2. This is where we are gonna add registration stuff

3. make `type.js` in the same folder, but this is where we are going to create the types we are going to use

   `export const TEST_DISPATCH = 'TEST_DISPATCH';`

4. import this into `authActions` and create a new registerUser function

   ```react
   //bring in types
   import { TEST_DISPATCH } from './types';
   
   //Register User
   export const registeruser = userData => {
     return {
       type: TEST_DISPATCH,
       payload: userData
     };
   };
   
   ```

5. Now we import `types` into `authReducer` and fill the user info with the payload

   ```react
   //bring in types
   import { TEST_DISPATCH } from '../actions/types';
   
   const initialState = {
     isAuthenticated: false,
     user: {}
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       case TEST_DISPATCH:
       return {
         //We want to take the initialState and add it into the spread operator
         ...state,
         //fills user with the payoad, which is the userData from actions.
         user: action.payload
       }
       default:
         return state;
     }
   }
   ```

6. We want to use redux for registration, so go to `src/components/Register.js` and bring in the `connect` function to connect react to redux

   **NOTE: Container is a React component that works with Redux**

   `import { connect } from 'react-redux';`

7. now bring in the registerUser function from `authActions`

   `import { registerUser } from '../../actions/authActions';`

8. and then we update the `export default` line to connect react with redux

   **NOTE: Second parameter is what we call**

   `export default connect(null, { registerUser })(Register);`

9. now we can replace the `axios` request with this

   any action we bring in is stored in props, and now we can call this

   `    this.props.registerUser(newUser);` **NOTE: Make sure to get rid of axios stuff**

10. we want a dedicated reducer for auth, aka. we *will be replacing TEST_DISPATCH* with something else

11. if we wanted to get any of the auth state into our component, we need to create a function

    ```react
    const mapStateToProps = (state) => ({
        //auth comes from index.js, so be wary of name
      auth: state.auth
    });
    ```

12. and pop it in as the first parameter of 8

    `export default connect(mapStateToProps, { registerUser })(Register);`

13. Now we want to test this out

    ``

14. **now we want to map any free component we have to propTypes** this is just react mannerisms

    `import PropTypes from 'prop-types';`

    and we want to save the registerd user as a prop

    ```react
    Register.propTypes = {
      registerUser: PropTypes.func.isRequired,
      auth: PropTypes.object.isRequired
    };
    ```



### Registration and Error Reducer w/ Redux

1. move axios import into `authActions` 

2. remove axios function from `Register.js`

3. bring in the axios function to `authActions` and modify it:

   ```react
   //Register User
   export const registerUser = userData => dispatch  => {
           axios
           //backend hits userdata
         .post('/api/users/register', userData)
           //and if it is successful, 
         .then(res => console.log(res.data))
         .catch(err => dispatch({
             type: GET_ERRORS,
             payload: err.response.data
         }));
   };
   ```

4. change `TEST_DISPATCH` to the official `GET_ERRORS`

   `import { GET_ERRORS } from './types';`

5. change the `TEST_DISPATCH` code in `types.js`

   `import { GET_ERRORS } from './types';`

6. get rid of test dispatch from `authReducer` and also the test case inside the default function

7. now we create the **ErrorReducer**, copy most of `authReducer` and load the action with the payload, which includes errors

   ```react
   import { GET_ERRORS } from '../actions/types';
   
   const initialState = {
     isAuthenticated: false,
     user: {}
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       case GET_ERRORS:
       //the payload includes the errors object from the server in authActions
         return action.payload;
       default:
         return state;
     }
   }
   ```

8. in `Register.js` update the `mapStateToProps` function now that we have loaded up the right payloads

   ```react
   const mapStateToProps = state => ({
     auth: state.auth,
     errors: state.errors,
     
   });
   ```

9. **DON"T FORGET** to bring in the errorReducer to `index.js`

   ```react
   import { combineReducers } from 'redux';
   import authReducer from './authReducer';
   import errorReducer from './errorReducer';
   
   export default combineReducers({
     auth: authReducer,
     errors: errorReducer
   });
   ```

10. we want to switch getting the errors to a new lifecycle method, add this function to `Register.js`

    ```react
      //Added to make components receive propsm, LIBRARY FUNCTION
      //tests for certain properties, namely the errors property
      //and if errors is included, add it to the component state
      componentWillReceiveProps(nextProps) {
        if (nextProps.errors) {
          this.setState({ errors: nextProps.errors });
        }
      }
    ```

11. get rid of any testing lines

    ```react
    
        
                {user ? user.name : null}
    
    ```

12. add the errors line to `Register.propTypes`

    ```react
    Register.propTypes = {
      registerUser: PropTypes.func.isRequired,
      auth: PropTypes.object.isRequired,
      errors: PropTypes.object.isRequired
    };
    ```

13. Now the errors appear in REDUX!

14. now when a user registers correctly, let's take them to the landing page

    - we need to bring in `withRouter`

      `import { withRouter } from 'react-router-dom'`

    - go to the export line, and wrap the `Register` component 

      ```react
      export default connect(
        mapStateToProps,
        { registerUser }
      )(withRouter(Register));
      ```

    - go to `this.props.registerUser` and enable us to use this.props.history to redirect an action.

      `this.props.registerUser(newUser, this.props.history);`

    - back in `authActions` catch the this.props.history we caught, and add the redirect link

    ```react
    //Register User
    export const registerUser = (userData, history) => dispatch => {
      axios
        //backend hits userdata
        .post('/api/users/register', userData)
        //and if it is successful, redirect to login page
        .then(res => history.push('/login'))
        .catch(err =>
          dispatch({
            type: GET_ERRORS,
            payload: err.response.data
          })
        );
    };
    ```

15. Now when we login, we get redirected to the login!



### Login Action & Set Current User w/ Login

very difficult because we need to have the token saved on local storage

we are going to design it so that if we have the token on local storage that is validated, we are going to send that with every request we make (save it temporarily, pretty much)

request token -> access protected routes -> local storage -> recall it whenever we need to make a request

setup logout so the key gets destroyed in local storage

1. new action in `authAction.js` to login user and get token

   ```react
   //Login - Get User Login Token
   export const loginUser = (userData) => dispatch => {
       //make axios post request to ...
       axios.post('/api/users/login', userData)
           .then(red => {
               //Save to local storage
               const { token } = res.data;
               //Set token to local storage (only stores strings, so make sure to convert; but tokens are already strings)
               localStorage.setItem('jwtToken', token);
               // Set token to Auth header in src/utils/setAuthToken.js
               setAuthToken(token);
           })
           //error catcher
           .catch(err => {
               dispatch({
                   type: GET_ERRORS,
                   payload: err.response.data
                 })
           })
   }
   ```

2. we neet to create `src/utils/setAuthToken.js` and fill it with axios post request to get the user token

   ```javascript
   //import axios to prevent us to manually make sure we have the token
   import axios from 'axios';
   
   const setAuthToken = token => {
     if (token) {
       //Apply to every request
       axios.defaults.header.common['Authorization'] = token;
     } else {
       //Delete Auth header if token is not there
       delete axios.defaults.headers.common['Authorization'];
     }
   };
   
   export default setAuthToken;
   ```

3. now we import this into `authActions.js` 

   `import setAuthToken from '../utils/setAuthToken';`

4. set the user by extracting info from the token and putting it into the user object

   - **NOTE: we need to install `jwtcode` for this**

   - go to the `client` folder and

     `npm i jwt-decode`

   - import it into `authActions`

     `import jwt_decode from 'jwt-decode';`

5. use `jwt_decode` and a new function `setCurrentUser` to decode the token, and set the user with this payload

   ```react
               //We want to "set" the user and fill the user object with the token info
               //we need jwt_decode module to do this
               const decoded = jwt_decode(token);
               //Set current user
               dispatch(setCurrentUser(decoded));
               
               //Set logged in user
   export const setCurrentUser = (decoded) => {
       return {
           type: SET_CURRENT_USER,
           payload: decoded
       }
   }
   ```

6. we need to import `SET_CURRENT_USER` from types, and then we create it in `types.js`

   `import { GET_ERRORS, SET_CURRENT_USER } from './types';`

   `export const SET_CURRENT_USER = 'SET_CURRENT_USER';`

7. and now we have to catch it in `authReducer` by importing it

   `import { SET_CURRENT_USER } from '../actions/types';`

   and we set a new case for it in the `function`

   ```react
       //case for setting user
       case SET_CURRENT_USER:
         return {
           //current state
           ...state,
           //isauthenticated: check to see if decoded user is not empty
           isAuthenticated: !isEmpty(action.payload),
           //the action payload
           user: action.payload
         };
   ```

8. we need to make another `is-empty` function file in `client/src/validation/is-empty`, which is pretty much a copy of the is-empty we made for the backend

   ```react
   const isEmpty = value =>
     value === undefined ||
     value === null ||
     (typeof value === 'object' && Object.keys(value).length === 0) ||
     (typeof value === 'string' && value.trim().length === 0);
   
   export default isEmpty;
   
   ```

9. bring into `authReducer`

   `import isEmpty from '../validation/is-empty';`

10. now our user object gets filled in with the payload



### Login Component -> Form Functionality

now that we've authenticated the user through redux, we want to make sure that the Login component does just that

1. in `components/auth/Login.js` we are going to want to import a few things:

   ```react
   import PropTypes from 'prop-types';
   //to connect to redux
   import { connect } from 'react-redux';
   //login user function
   import { loginUser } from '../../actions/authActions';
   //classnames for validation
   import classnames from 'classnames';
   ```

2. we want to go to our export, and connect redux

   ```react
   
   Login.propTypes = {
     loginUser: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth,
     errors: state.errors
   });
   
   export default connect(
     mapStateToProps,
     { loginUser }
   )(Login);
   ```

3. we need to implement the errors in the render with classnames

   ```react
    render() {
       //Create errors object
       const { errors } = this.state;
   
       return (
         <div className="login">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Log In</h1>
                 <p className="lead text-center">
                   Sign in to your DevConnector account
                 </p>
                 {/* Step 4: Add onSubmit */}
                 <form onSubmit={this.onSubmit}>
                   <div className="form-group">
                     <input
                       type="email"
                       //Modfied this part for Redux
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.email
                       })}                    
                       placeholder="Email Address"
                       name="email"
                       //Step 3: link this input to that state value
                       value={this.state.email}
                       onChange={this.onChange}
                     />
                     {errors.email && (
                       <div className="invalid-feedback">{errors.email}</div>
                     )}
                   </div>
                   <div className="form-group">
                     <input
                       type="password"
                       className={classnames('form-control form-control-lg', {
                         'is-invalid': errors.password
                       })}                     
                       placeholder="Password"
                       name="password"
                       //Step 3: link this input to that state value
                       value={this.state.password}
                       onChange={this.onChange}
                     />
                     {errors.password && (
                       <div className="invalid-feedback">{errors.password}</div>
                     )}
                   </div
                       
                       ....
   ```

4. we need to create our lifecycle method `componentWillReceiveProps`

   ```javascript
     //For Redux prop/component
     componentWillReceiveProps(nextProps) {
   
         //we want to see if the user is authenticated
       if(nextProps.auth.isAuthenticated) {
         //redirect to dashboard
         this.props.history.push('/dashboard');
       }
       if(nextProps.errors) {
         //set state
         this.setState({errors: nextProps.errors})
       }
     }
   ```

5. `onSubmit` should now call the action

   ```javascript
     onSubmit(event) {
       event.preventDefault();
   
       const currUser = {
         email: this.state.email,
         password: this.state.password
       };
   
       this.props.loginUser(currUser);
     }
   ```

6. we want to make some updates on `App.js` now

   - import `jwt_decode` , `setAuthToken` and `setCurrentUser`

     ```react
     //importing these for Redux functionalities
     import jwt_decode from 'jwt-decode';
     import setAuthToken from './utils/setAuthToken';
     import { setCurrentUser } from './actions/authActions';
     ```

   - Check for token with the imported functions

     ```javascript
     //44: Check for token
     //If token exists in local storage
     if (localStorage.jwtToken) {
       //set auth token header auth
       setAuthToken(localStorage.jwtToken);
       //Decode token and get user info and exp
       const decoded = jwt_decode(localStorage.jwtToken);
       // set current user action, is authenticated
       store.dispatch(setCurrentUser(decoded));
     }
     ```



### Logout & Conditional Navbar Links

almost completed with authActions

1. in `authActions`, we are going to create a function to log a user out

   ```react
   //Log user out
   export const logoutUser = () => dispatch => {
     //remove token from local storage
     localStorage.removeItem('jwtToken');
     //remove the auth header for future requests
     setAuthToken(false);
     //set the current user to empty object, which will set isauthenticated to false (setting it back to initial state)
     dispatch(setCurrentUser({}))
   }
   ```

2. now go to `components/layout/Navbar.js` and connect it to redux by importing: 

   ```javascript
   //imported these to connect navbar to redux
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import { logoutUser } from '../../actions/authActions';
   ```

3. we want the navbar to show a different menu based on login state, so right before `export default Navbar`, let's write this `mapState` helper

   ```react
   Navbar.propTypes = {
     logoutUser: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired
   }
   
   const mapStateToProps = (state) => ({
     auth: state.auth
   })
   
   export default connect(mapStateToProps, { logoutUser })(Navbar);
   ```

4. go back to the render to pull out `isAuthenticated` in `Navbar.js`

   ```javascript
   import React, { Component } from 'react';
   import { Link } from 'react-router-dom';
   //imported these to connect navbar to redux
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import { logoutUser } from '../../actions/authActions';
   
   class Navbar extends Component {
     onLogoutClick(event) {
       event.preventDefault();
       this.props.logoutUser();
     }
   
     render() {
       const { isAuthenticated, user } = this.props.auth;
       const authLinks = (
         <ul className="navbar-nav ml-auto">
           <li className="nav-item">
             <a
               href=""
               onClick={this.onLogoutClick.bind(this)}
               className="nav-link">
               <img
                 // for the circle action
                 className="rounded-circle"
                 src={user.avatar}
                 alt={user.name}
                 style={{ width: '25px', marginRight: '5px' }}
                 title="You must have a Gravatar connected to your email to display an image"
               />
               Logout
             </a>
           </li>
         </ul>
       );
       const guestLinks = (
         <ul className="navbar-nav ml-auto">
           <li className="nav-item">
             <Link className="nav-link" to="/register">
               Sign Up
             </Link>
           </li>
           <li className="nav-item">
             <Link className="nav-link" to="/login">
               Login
             </Link>
           </li>
         </ul>
       );
       return (
         // Navbar
         <div>
           <nav className="navbar navbar-expand-sm navbar-dark bg-dark mb-4">
             <div className="container">
               <Link className="navbar-brand" to="/">
                 DevConnector
               </Link>
               <button
                 className="navbar-toggler"
                 type="button"
                 data-toggle="collapse"
                 data-target="#mobile-nav"
               >
                 <span className="navbar-toggler-icon" />
               </button>
   
               <div className="collapse navbar-collapse" id="mobile-nav">
                 <ul className="navbar-nav mr-auto">
                   <li className="nav-item">
                     <Link className="nav-link" to="/profiles">
                       {' '}
                       Developers
                     </Link>
                   </li>
                 </ul>
                 {/* displays link depending on auth level */}
                 {isAuthenticated ? authLinks : guestLinks}
               </div>
             </div>
           </nav>
         </div>
       );
     }
   }
   
   Navbar.propTypes = {
     logoutUser: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { logoutUser }
   )(Navbar);
   
   ```

5. when the token expires, we want the user to be logged out.

   - in `App.js`, check for expired tokens

     ```javascript
     ...
     //importing these for Redux functionalities
     import jwt_decode from 'jwt-decode';
     import setAuthToken from './utils/setAuthToken';
     import { setCurrentUser, logoutUser } from './actions/authActions';
     
     import Navbar from './components/layout/Navbar';
     import Footer from './components/layout/Footer';
     import Landing from './components/layout/Landing';
     
     import Register from './components/auth/Register';
     import Login from './components/auth/Login';
     
     import './App.css';
     
     //44: Check for token
     //If token exists in local storage
     if (localStorage.jwtToken) {
       //set auth token header auth
       setAuthToken(localStorage.jwtToken);
       //Decode token and get user info and exp
       const decoded = jwt_decode(localStorage.jwtToken);
       // set current user action, is authenticated
       store.dispatch(setCurrentUser(decoded));
     
       //Check for expired token
       const currentTime = Date.now() / 1000;
       if (decoded.exp < currentTime) {
         //Logout the user
         store.dispatch(logoutUser());
         //TODO: Clear the current Profile
         //Redirect to Login
         window.location.href = '/login';
       }
     }
     ...
     ```

6. if we are logged in, we don't wanna be able to access SignUp or Login, so in `Login.js` **and** `Register.js`, create a lifecycle method above `componenetWillReceiveProps` called `componentDidMount`

   ```javascript
     //Lifecycle method to just see if we are logged in
     componentDidMount() {
       if(this.props.auth.isAuthenticated) {
         this.props.history.push('/dashboard');
       }
     }
   ```

7. bring in redux to `Landing.js` and also plug `componentDidMount` here too

   ```react
   import React, { Component } from 'react';
   import { Link } from 'react-router-dom';
   //Importing redux tools
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   
   class Landing extends Component {
     //Lifecycle method to just see if we are logged in
     //if so, we redirect to the dashboard
     componentDidMount() {
       if (this.props.auth.isAuthenticated) {
         this.props.history.push('/dashboard');
       }
     }
   
     render() {
       return (
         // Landing
         <div className="landing">
           <div className="dark-overlay landing-inner text-light">
             <div className="container">
               <div className="row">
                 <div className="col-md-12 text-center">
                   <h1 className="display-3 mb-4">Developer Network</h1>
                   <p className="lead">
                     {' '}
                     Create a developer profile/portfolio, share posts and get help
                     from other developers
                   </p>
                   <hr />
                   <Link to="/register" className="btn btn-lg btn-info mr-2">
                     Sign Up
                   </Link>
                   <Link to="/login" className="btn btn-lg btn-light">
                     Login
                   </Link>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   Landing.propTypes = {
     auth: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(mapStateToProps)(Landing);
   
   ```



## Dashboard & Profile State

Profile States & Reducers, creating the dashboard.



### TextFieldGroupInput Component

we want different components for `div className='form-group'` to make things look cleaner

1. create a new file `components/common/TextFieldGroup.js` and make it a `rcf` component, and then grab this from `Login.js`

   ```react
   import React from 'react';
   //import classnames
   import classnames from 'classnames';
   import PropTypes from 'prop-Types';
   
   //This file has a lot of properties: which are passed in
   const TextFieldGroup = ({
     name,
     placeholder,
     value,
     label,
     error,
     info,
     type,
     onChange,
     disabled
   }) => {
     return (
       <div className="form-group">
         <input
           //type is whatever tpy eis passed in
           type={type}
           // Modfied this part for Redux
           className={classnames('form-control form-control-lg', {
             'is-invalid': error
           })}
           placeholder={placeholder}
           name={name}
           // Step 3: link this input to that state value
           value={value}
           onChange={onChange}
           disabled={disabled}
         />
         {info && <small className="form-text text-muted"> {info}</small>}
         {errors.email && <div className="invalid-feedback">{errors.email}</div>}
       </div>
     );
   };
   
   TextFieldGroup.propTypes = {
     name: PropTypes.string.isRequired,
     placeholder: PropTypes.string,
     value: PropTypes.string.isRequired,
     info: PropTypes.string,
     error: PropTypes.string,
     type: PropTypes.string.isRequired,
     onChange: PropTypes.func.isRequired,
     disabled: PropTypes.string
   };
   
   TextFieldGroup.defaultProps = {
     type: 'text'
   };
   
   export default TextFieldGroup;
   
   ```

2. now, whenever we want a formgroup with an input field, like in `Login.js`, import the `TextFieldGroup` file we just made, and create a sort of template for all the stuff from `Login.js`

   ```react
   ...
   //importing to turn all form-groups into components
   import TextFieldGroup from '../common/TextFieldGroup';
   ...
   ...
   render() {
       //Create errors object
       const { errors } = this.state;
   
       return (
         <div className="login">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Log In</h1>
                 <p className="lead text-center">
                   Sign in to your DevConnector account
                 </p>
                 {/* Step 4: Add onSubmit */}
                 <form onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="Email Address"
                     name="email"
                     type="email"
                     value={this.state.email}
                     onChange={this.onChange}
                     error={errors.email}
                   />
                   <TextFieldGroup
                     placeholder="Password"
                     name="password"
                     type="password"
                     value={this.state.password}
                     onChange={this.onChange}
                     error={errors.password}
                   />
                   <input type="submit" className="btn btn-info btn-block mt-4" />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   ..
   ...
   ...
   ```

3. Now we can go ahead and replace the `Register.js` field with this, so like above, import `TextFieldGroup` and do the same thing

   ```react
   //importing to turn all form-groups into components
   import TextFieldGroup from '../common/TextFieldGroup';
   ...
   ...
   render() {
       //Errors from classname, using deconstruction
       const { errors } = this.state;
   
       return (
         <div className="register">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Sign Up</h1>
                 {/* Added on Submit  */}
                 <form noValidate onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="Name"
                     name="name"
                     type="text"
                     value={this.state.name}
                     onChange={this.onChange}
                     error={errors.name}
                   />
                   <TextFieldGroup
                     placeholder="Email Address"
                     name="email"
                     type="email"
                     value={this.state.email}
                     onChange={this.onChange}
                     error={errors.email}
                     info="This site uses Gravatar so if you want a profile image, use a Gravatar email"
                   />
                   <TextFieldGroup
                     placeholder="Password"
                     name="password"
                     type="password"
                     value={this.state.password}
                     onChange={this.onChange}
                     error={errors.password}
                   />
                   <TextFieldGroup
                     placeholder="Confirm Password"
                     name="password2"
                     type="password"
                     value={this.state.password2}
                     onChange={this.onChange}
                     error={errors.password2}
                   />
                   <input type="submit" className="btn btn-info btn-block mt-4" />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   ```

4. Now everything is a component, sweet. We continue to do the holy work.



### Profile Reducer & Get Current Profile

we are actually going to create our dashboard now

1. `reducers/profileReducer.js` and import it into `index.js`

   ```react
   import { combineReducers } from 'redux';
   import authReducer from './authReducer';
   import errorReducer from './errorReducer';
   import profileReducer from './profileReducer';
   
   export default combineReducers({
     auth: authReducer,
     errors: errorReducer,
     profile: profileReducer
   });
   ```

2. begin to initialize `profileReducer`

   ```javascript
   const initialState = {
     profile: null,
     profiles: null,
     loading: false
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       default:
         return state;
     }
   }
   ```

3. create a new type in `types.js`

   ```react
   export const GET_PROFILE = 'GET_PROFILE';
   export const PROFILE_LOADING = 'PROFILE_LOADING';
   export const PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND';
   export const CLEAR_CURRENT_PROFILE = 'CLEAR_CURRENT_PROFILE';
   export const GET_PROFILES = 'GET_PROFILES';
   ```

4. create the actions file `actions/profileActions.js` we want to create an aciton to get the current profile to hit the API profile endpoint

   ```javascript
   import axios from 'axios';
   
   import { GET_PROFILE, PROFILE_LOADING, GET_ERRORS } from './types';
   
   // Get current profile
   export const getCurrentProfile = () => dispatch => {
     //setprofileloading to set the profile to be loading before the actual request
     dispatch(setProfileLoading());
     //get current user profile
     axios
       .get('/api/profile')
       .then(res =>
         dispatch({
           type: GET_PROFILE,
           payload: res.data
         })
       )
       //If there isn't a profile, just return an empty profile and a button to create one, instead of errors
       .catch(err =>
         dispatch({
           type: GET_PROFILE,
           payload: {}
         })
       );
   };
   
   //Profile loading - just lets reducer know this is loading
   export const setProfileLoading = () => {
     return {
       type: PROFILE_LOADING
     };
   };
   ```

5. and back in our `profileReducer` import the types and such

   ```
   import { GET_PROFILE, PROFILE_LOADING } from '../actions/types';
   
   const initialState = {
     profile: null,
     profiles: null,
     loading: false
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       case PROFILE_LOADING:
         return {
           ...state,
           loading: true
         };
       case GET_PROFILE:
         return {
           ...state,
           profile: action.payload,
           loading: false
         };
       default:
         return state;
     }
   }
   ```

6. create `components/dashboard` `dashboard.js`, rcc tab

   ```react
   import React, { Component } from 'react';
   //connect it to redux
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import { getCurrentProfile } from '../../actions/profileActions';
   
   class Dashboard extends Component {
     //ajax request to call this right away
     componentDidMount() {
       this.props.getCurrentProfile();
     }
   
     render() {
       return (
         <div>
           <h1> Dashboard </h1>
         </div>
       );
     }
   }
   
   export default connect(
     null,
     { getCurrentProfile }
   )(Dashboard);
   
   ```

7. create the route in `App.js` 

   ```react
   import Dashboard from './components/dashboard/Dashboard';
   
   ...
   ...
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
                 <Route exact path="/dashboard" component={Dashboard} />
               </div>
   ...
   ...
   ```

8. now the dashboard should work, make sure to delete `classnames` import from `Register` and `Login` because we replaced them with components

9. We want the dashboard to return something else

   1. import `CLEAR_CURRENT_PROFILE`

   2. create a new function

      ```javascript
      //Clear Profile
      export const clearCurrentProfile = () => {
        return {
          type: CLEAR_CURRENT_PROFILE
        };
      };
      ```

   3. import this into `profileReducer` and create a case

      ```javascript
      import { GET_PROFILE, PROFILE_LOADING, CLEAR_CURRENT_PROFILE } from '../actions/types';
      ...
      ...
      ...
            case CLEAR_CURRENT_PROFILE:
              return{
                  ...state,
                  profile: null
              }
      ```

10. go to `Navbar.js` and bring in another button to click

    ```react
    //For importing 
    import { clearCurrentProfile } createRequireFromPath, '../../actions/profileActions';
    import { createRequireFromPath } from 'module';
    
    class Navbar extends Component {
      onLogoutClick(event) {
        event.preventDefault();
        //Clear profile
        this.props.clearCurrentProfile();
        this.props.logoutUser();
      }
    
        ...
        ...
        
    export default connect(
      mapStateToProps,
      { logoutUser, clearCurrentProfile }
    )(Navbar);
    ```

11. go back to `App.js` and clear the dispatch as we planned to before

    ```react
        //TODO: Clear the current Profile
        store.dispatch(clearCurrentProfile);
    ```

    

### STARTING THE DASHBOARD

So far we created the profile reducer and actions, and now we want to make sure that the dashboard works

1. create a `mapStateToProps` in `Dashboard.js`

   ```javascript
   const mapStateToProps = state => ({
     profile: state.profile,
     auth: state.auth
   });
   ```

2. set up `PropTypes`

   ```javascript
   Dashboard.propTypes = {
     getCurrentProfile: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired,
     profile: PropTypes.object.isRequired
   };
   ```

3. We need to make sure that `profile state` is not `null` before we return anything

   ```react
     render() {
       //To make sure that profile state is not null
       //get the user from the auth.state
       const { user } = this.props.auth;
       const { profile, loading } = this.props.profile;
   
       let dashboardContent;
       //if profile is null OR loading is true
       if (profile === null || loading) {
         //we're going to add a spinner here while loading
         dashboardContent = <h4>Loading ...</h4>;
       } else {
         //and the output is here
         dashboardContent = <h1>Hello</h1>;
       }
   
       return (
         <div className="dashboard">
           <div className="container">
             <div className="row">
               <div className="col-md-12">
                 <h1 className="display-4">Dashboard</h1>
                 {dashboardContent}
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   ```

4. now we want to add a spinner with a gif image

5. make a new file in `common/Spinner.js`

   ```react
   import React from 'react';
   //bring in the spinner image
   import spinner from './spinner.gif';
   
   export default function Spinner() {
     return (
       <div>
         <img
           src={spinner}
           style={{ width: '200px', margin: 'auto', display: 'block' }}
           alt="Loading ..."
         />
       </div>
     );
   }
   ```

6. bring this into the dashboard now

   ```react
   //Import the spinner
   import Spinner from '../common/Spinner';
   
   ...
   ...
   
   return (
         <div className="dashboard">
           <div className="container">
             <div className="row">
               <div className="col-md-12">
                 <h1 className="display-4">Dashboard</h1>
                 {dashboardContent}
               </div>
             </div>
           </div>
         </div>
       );
   ```

7. now the spinner is done, if the user does not have a profile we want for them to create a profile, if the user has a profile, we want to display the dashboard.

   ```react
   //Importing for create-profile link
   import { Link } from 'react-router-dom';
   ...
   ...
   ...
   render() {
       //To make sure that profile state is not null
       //get the user from the auth.state
       const { user } = this.props.auth;
       const { profile, loading } = this.props.profile;
   
       let dashboardContent;
       //if profile is null OR loading is true
       if (profile === null || loading) {
         //we're going to add a spinner here while loading
         dashboardContent = <Spinner />;
       } else {
         //check if the logged in user has profile data
         if (Object.keys(profile).length > 0) {
           //something is in this object, they have a profile and we want to display it
           dashboardContent = <h4> TODO: Display Profile </h4>;
         } else {
           //they do not have a profile, so send them to create-a-profile link
           //Make sure to import Link
           dashboardContent = (
             <div>
               <p className="lead text-muted">Welcome {user.name}</p>
               <p>You have not set up a profile, set one up:</p>
               <Link to="/create-profile" className="btn btn-lg btn-info">
                 Create Profile
               </Link>
             </div>
           );
         }
       }
    ...
    ...
    ...
   ```

8. set up a private route so you can't see the dashboard when you are logged out



### Private Routes for Dashboard

using **protected routes** with React, we want to be able to set up a private path component

1. `common/PrivateRoute.js`

   ```javascript
   import React from 'react';
   import { Route, Redirect } from 'react-router-dom';
   //for redux, in case we need to see if user is authenticated or now
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import { stat } from 'fs';
   const PrivateRoute = ({ component: Component, auth, ...rest }) => (
     <Route
       {...rest}
       render={props =>
         //if we are logged in
         auth.isAuthenticated === true ? (
           //load the component if we are
           <Component {...props} />
         ) : (
           //otherwise redirect to login
           <Redirect to="/login" />
         )
       }
     />
   );
   PrivateRoute.propTypes = {
     auth: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: stat.auth
   });
   
   export default connect(mapStateToProps)(PrivateRoute);
   
   ```

2. import this into `App.js`

   ```react
   import PrivateRoute from './components/common/PrivateRoute';
   import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
   
   ...
   ...
   ...
   return (
         <Provider store={store}>
           <Router>
             <div className="App">
               <Navbar />
               <Route exact path="/" component={Landing} />
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
                 <PrivateRoute exact path="/dashboard" component={Dashboard} />
               </div>
               <Footer />
             </div>
           </Router>
         </Provider>
       );
   ```

3. we are going to now import `Switch` and make sure every private route is wrapped in the switch (in `App.js`)

   ```react
                 <Route exact path="/login" component={Login} />
                 <Switch>
                   <PrivateRoute exact path="/dashboard" component={Dashboard} />
                 </Switch>
   ```

4. now the dashboard is locked when you are not logged in, the **SWITCH** is what makes redirecting upon logout possible.



### CreateProfile Component & Route

let's actually make the component to create a profile

1. `components/create-profile/CreateProfile.js`

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   //Step 4: Text Field Groups
   import TextFieldGroup from '../common/TextFieldGroup';
   
   class CreateProfile extends Component {
     //Step 1: create the component state values (the fields)
     constructor(props) {
       super(props);
       this.state = {
         //toggle
         displaySocialInputs: false,
         handle: '',
         company: '',
         website: '',
         location: '',
         status: '',
         skills: '',
         githubusername: '',
         bio: '',
         twitter: '',
         facebook: '',
         linkedin: '',
         youtube: '',
         instagram: '',
         errors: {}
       };
     }
   
     //Step 5: Create the inside of the form
     render() {
       return (
         <div className="create-profile">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Create Your Profile </h1>
                 <p className="p lead text-center">
                   We need some info to make your profile stand out:
                 </p>
                 <small className="d-block pb-3">* = required fields</small>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   //Step 3: PropTypes
   CreateProfile.propTypes = {
     profile: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   //Step 2: mapStateToProps
   const mapStateToProps = state => ({
     profile: state.profile,
     errors: state.errors
   });
   export default connect(mapStateToProps)(CreateProfile);
   ```

2. now we wnat to make sure this doesn't affect routing: go to `App.js` and bring it in

   ```react
   import CreateProfile from './components/create-profile/CreateProfile';
   ```

3. create a private route to this in `App.js`

   ```react
                 <Switch>
                   <PrivateRoute
                     exact
                     path="/create-profile"
                     component={CreateProfile}
                   />
                 </Switch>
   ```

4. The links work!



### Form Input Field Components

we need for select-form and text-fields, and also url-components

1. `common/TextAreaFieldGroup.js` and copy-paste `TextFieldGroup` code inside it;

   ```javascript
   import React from 'react';
   //import classnames
   import classnames from 'classnames';
   import PropTypes from 'prop-types';
   
   //This file has a lot of properties: which are passed in
   const TextAreaFieldGroup = ({
     name,
     placeholder,
     value,
     error,
     info,
     onChange
   }) => {
     return (
       <div className="form-group">
         <textarea
           // Modfied this part for Redux
           className={classnames('form-control form-control-lg', {
             'is-invalid': error
           })}
           placeholder={placeholder}
           name={name}
           // Step 3: link this input to that state value
           value={value}
           onChange={onChange}
         />
         {info && <small className="form-text text-muted"> {info}</small>}
         {error && <div className="invalid-feedback">{error}</div>}
       </div>
     );
   };
   
   TextAreaFieldGroup.propTypes = {
     name: PropTypes.string.isRequired,
     placeholder: PropTypes.string,
     value: PropTypes.string.isRequired,
     info: PropTypes.string,
     error: PropTypes.string,
     onChange: PropTypes.func.isRequired
   };
   
   export default TextAreaFieldGroup;
   
   ```

2. create `common/SelectListGroup.js` for the Selection List component and copy-paste `TextAreaFieldGroup` and make some modifications

   ```react
   import React from 'react';
   //import classnames
   import classnames from 'classnames';
   import PropTypes from 'prop-types';
   
   //This file has a lot of properties: which are passed in
   const SelectListGroup = ({
     name,
     value,
     error,
     info,
     onChange,
     //Step 1: we need this new one
     options
   }) => {
     //Step 2: pull options out of the options array
     const selectOptions = options.map(option => (
       <option key={option.label} value={option.value}>
         {option.label}
       </option>
     ));
   
     return (
       <div className="form-group">
         <select
           // Modfied this part for Redux
           className={classnames('form-control form-control-lg', {
             'is-invalid': error
           })}
           name={name}
           // Step 3: link this input to that state value
           value={value}
           onChange={onChange}
         >
           {selectOptions}
         </select>
         {info && <small className="form-text text-muted"> {info}</small>}
         {error && <div className="invalid-feedback">{error}</div>}
       </div>
     );
   };
   
   SelectListGroup.propTypes = {
     name: PropTypes.string.isRequired,
     value: PropTypes.string.isRequired,
     info: PropTypes.string,
     error: PropTypes.string,
     onChange: PropTypes.func.isRequired,
     options: PropTypes.array.isRequired
   };
   
   export default SelectListGroup;
   
   ```

3. create `common/InputGroup.js` and copy from `TextAreaFieldGroup` and make some changes

   ```react
   import React from 'react';
   //import classnames
   import classnames from 'classnames';
   import PropTypes from 'prop-types';
   
   //This file has a lot of properties: which are passed in
   const InputGroup = ({
     name,
     placeholder,
     value,
     error,
     icon,
     type,
     onChange
   }) => {
     return (
       <div className="input-group mb-3">
         <div className="input-group-prepend">
           <span className="input-group-text">
             <i className={icon} />
           </span>
         </div>
         <input
           className={classnames('form-control form-control-lg', {
             'is-invalid': error
           })}
           placeholder={placeholder}
           name={name}
           value={value}
           onChange={onChange}
         />
         {error && <div className="invalid-feedback">{error}</div>}
       </div>
     );
   };
   
   InputGroup.propTypes = {
     name: PropTypes.string.isRequired,
     placeholder: PropTypes.string,
     value: PropTypes.string.isRequired,
     icon: PropTypes.string,
     error: PropTypes.string,
     type: PropTypes.string.isRequired,
     onChange: PropTypes.func.isRequired
   };
   
   //Need this
   InputGroup.defaultProps = {
     type: 'text'
   };
   
   export default InputGroup;
   ```

4. import all these into `CreateProfile.js`

   ```javascript
   //Step 5: Import other form groups
   import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
   import SelectListGroup from '../common/SelectListGroup';
   import InputGroup from '../common/InputGroup';
   ```

5. noice noice noice



### Create Profile Form Fields

we have all the components, we just need to add the fields now

1. `CreateProfile.js` go under `small` bracket and create `onSubmit` actions, further notes in code comments

   ```react
   <form onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="* Profile Handle"
                     name="handle"
                     value={this.state.handle}
                     onChange={this.onChange}
                     error={errors.handle}
                     info="A unique handle for your profile url"
                   />
                 </form>
   ```

2. bring in `errors` above the `return`

   ```react
   render() {
       //so we know what errors are
       const { errors } = this.state;
   
       return (
         <div className="create-profile">
           <div className="container">
             <div className="row">
               <div className="col-md-8 m-auto">
                 <h1 className="display-4 text-center">Create Your Profile </h1>
                   ...
                   ..
                   .
   ```

3. bind `onChange` and `onSubmit`

   ```react
   constructor(props) {
       super(props);
       this.state = {
         //toggle
         displaySocialInputs: false,
         handle: '',
         company: '',
         website: '',
         location: '',
         status: '',
         skills: '',
         githubusername: '',
         bio: '',
         twitter: '',
         facebook: '',
         linkedin: '',
         youtube: '',
         instagram: '',
         errors: {}
       };
   
       //53:2 bind onChange and onSubmit
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   ```

4. make functions for these

   ```react
    //53:3 set up functions for the on-commands
     onChange(event) {
       this.setState({ [event.target.name]: event.target.value });
     }
   
     onSubmit(event) {
       event.preventDefault();
       console.log('submit');
     }
   ```

5. Woo! now the handle field is there

6. now, for the select-list, we can use our `SelectListGroup` component we just made, but first let's create the options we need above the `return`

   ```react
       //declaring the options
       const options = [
         { label: '* Select Professional Status', value: 0 },
         { label: 'Developer', value: 'Developer' },
         { label: 'Junior Developer', value: 'Junior Developer' },
         { label: 'Senior Developer', value: 'Senior Developer' },
         { label: 'Manager', value: 'Manager' },
         { label: 'Student', value: 'Student' },
         { label: 'Instructor', value: 'Instructor' },
         { label: 'Intern', value: 'Intern' },
         { label: 'Designer', value: 'Designer' },
         { label: 'Other', value: 'Other' }
       ];
   ```

7. now we create the select field component under the `TextFieldGroup` div

   ```react
                   <SelectListGroup
                     placeholder="Status"
                     name="status"
                     value={this.state.status}
                     onChange={this.onChange}
                     options={options}
                     error={errors.status}
                     info="Current place in career"
                   />
   ```

8. we need more field groups

   ```react
                 <form onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="* Profile Handle"
                     name="handle"
                     value={this.state.handle}
                     onChange={this.onChange}
                     error={errors.handle}
                     info="A unique handle for your profile url"
                   />
                   <SelectListGroup
                     placeholder="Status"
                     name="status"
                     value={this.state.status}
                     onChange={this.onChange}
                     options={options}
                     error={errors.status}
                     info="Current place in career"
                   />
                   <TextFieldGroup
                     placeholder="Company"
                     name="company"
                     value={this.state.company}
                     onChange={this.onChange}
                     error={errors.company}
                     info="Current company (optional)"
                   />
                   <TextFieldGroup
                     placeholder="Website"
                     name="website"
                     value={this.state.website}
                     onChange={this.onChange}
                     error={errors.website}
                     info="Personal / Professional website (optional)"
                   />
                   <TextFieldGroup
                     placeholder="Location"
                     name="location"
                     value={this.state.location}
                     onChange={this.onChange}
                     error={errors.location}
                     info="Where are you based? (City, State) (optional)"
                   />
                   <TextFieldGroup
                     placeholder="* Skills"
                     name="skills"
                     value={this.state.skills}
                     onChange={this.onChange}
                     error={errors.skills}
                     info="Please use comma separated values (e.g Python, HTML, Apex Legends)"
                   />
                   <TextFieldGroup
                     placeholder="Github Username"
                     name="githubusername"
                     value={this.state.githubusername}
                     onChange={this.onChange}
                     error={errors.githubusername}
                     info="Enter your github username for your latest repos and links"
                   />
                   <TextAreaFieldGroup
                     placeholder="Short Bio"
                     name="bio"
                     value={this.state.compabiony}
                     onChange={this.onChange}
                     error={errors.bio}
                     info="Short, descriptive bio of yourself"
                   />
   ```

9. now we need to create the optional button-click-reveal menu for the social media links

   ```react
   <button
                       onClick={() => {
                         this.setState(prevState => ({
                           displaySocialInputs: !prevState.displaySocialInputs
                         }));
                       }}
                       className="btn btn-light"
                     >
                       Add Social Media Links
                     </button>
                     <span className="text-muted">Optional</span>
   ```

10. we want a variable to hold the social media links, so create under `div`

    ```react
                    {socialInputs}
                    <input
                      type="submit"
                      value="Submit"
                      className="btn btn-info btn-block mt-4"
                    />
    ```

11. now we want `{socialInputs}` to actually be something, so update the errors line to also pull out the socialInputs

    ```react
       //so we know what errors are
        const { errors, displaySocialInputs } = this.state;
        
       let socialInputs;
        if (displaySocialInputs) {
          socialInputs = (
            <div>
              <InputGroup
                placeholder="Twitter Profile URL"
                name="twitter"
                icon="fab fa-twitter"
                value={this.state.twitter}
                onChange={this.onChange}s
                error={errors.twitter}
              />
              <InputGroup
                placeholder="Facebook Profile URL"
                name="facebook"
                icon="fab fa-facebook"
                value={this.state.facebook}
                onChange={this.onChange}
                error={errors.facebook}
              />
              <InputGroup
                placeholder="LinkedIn Profile URL"
                name="linkedin"
                icon="fab fa-linkedin"
                value={this.state.linkedin}
                onChange={this.onChange}
                error={errors.linkedin}
              />
              <InputGroup
                placeholder="Youtube Profile URL"
                name="youtube"
                icon="fab fa-youtube"
                value={this.state.youtube}
                onChange={this.onChange}
                error={errors.youtube}
              />
              <InputGroup
                placeholder="Instagram Profile URL"
                name="instagram"
                icon="fab fa-instagram"
                value={this.state.instagram}
                onChange={this.onChange}
                error={errors.instagram}
              />
            </div>
          );
        }
    ...
    ...
    ...
    ```

12. Now that Works! Icons come from fontawesome; awesome.



### Create a Profile (Functionality)

We want to actually be able to create a profile now.

1. in `profileActions.js` create an action to create a profile

   ```javascript
   //Create a new Profile, history used for redirecting with router
   export const createProfile = (profileData, history) => dispatch => {
     axios
       .post('/api/profile', profileData)
       .then(res => history.push('/dashboard'))
       .catch(err =>
         dispatch({
           //make sure to bring in GET_ERRORS type
           type: GET_ERRORS,
           payload: err.reponse.data
         })
       );
   };
   ```

2. create a componentwillreceiveprops in `CreateProfile.js`

   ```javascript
     //For Create Profile from profileActions
     componentWillReceiveProps(nextProps) {
       if (nextProps.errors) {
         //fills the state with the error
         this.setState({ errors: nextProps.errors });
       }
     }
   ```

3. we need to actually call the Create Profile action, so import 

   ```javascript
   //Create profile function
   import { createProfile } from '../../actions/profileActions';
   import { withRouter } from 'react-router-dom';
   ...
   ...
   ...
   
   export default connect(
     mapStateToProps,
     { createProfile }
   )(withRouter(CreateProfile));
   ```

4. **NOTE: Error because the Add Social Media button needs to be typed as a button, or else it just submits the whole form** `CreateProfile.js`

   ```javascript
   <div className="mb-3">
                     <button
                     type="button"
                       onClick={() => {
                         this.setState(prevState => ({
                           displaySocialInputs: !prevState.displaySocialInputs
                         }));
                       }}
                       className="btn btn-light"
                     >
   ```

5. NOW WE CAN SUBMIT A PROFILE!!!!



### Dashboard & Profile State pt.2: Display Profile

We need to display the profile now

1. new file `dashboard/ProfileActions.js` 

2. we want to go to `Dashboard.js` and grab this line

   ```react
           //if they are logged in, we want their username to be a link
           dashboardContent = (
             <div>
               <p className="lead text-muted">
                 Welcome <Link to={`/profile/${profile.handle}`}>{user.name}</Link>
               </p>
             </div>
           );
   ```

3. import `ProfileActions` into `Dashboard.js` and add Profile Actions under the thing we created in step 2.

   ```react
   dashboardContent = (
             <div>
               <p className="lead text-muted">
                 Welcome <Link to={`/profile/${profile.handle}`}>{user.name}</Link>
               </p>
               <ProfileActions/>
             </div>
           );
   ```

4. We are now going to create `ProfileActions.js`

   ```react
   import React from 'react';
   import { Link } from 'react-router-dom';
   
   const ProfileActions = () => {
     return (
       <div className="btn-group mb-4" role="group">
         <Link to="/edit-profile" className="btn btn-light">
           <i className="fas fa-user-circle text-info mr-1" /> Edit Profile
         </Link>
         <Link to="add-experience" className="btn btn-light">
           <i className="fab fa-black-tie text-info mr-1" />
           Add Experience
         </Link>
         <Link to="add-education" className="btn btn-light">
           <i className="fas fa-graduation-cap text-info mr-1" />
           Add Education
         </Link>
       </div>
     );
   };
   
   export default ProfileActions;
   ```

5. now we have the buttons on the dashboard done

6. **WE WANT TO DELETE THE ACCOUNT NOW**

   ```react
               {/* TODO: exp and education */}
               <div style={{ marginBottom: '60px' }} />
               <button
                 onClick={this.onDeleteClick.bind(this)}
                 className="btn btn-danger"
               >
                 Delete My Account
               </button>
   ```

7. create the `onDeleteClick` function, import it, and also declare it on the Redux connect function

   ```react
     import { getCurrentProfile, deleteAccount } from '../../actions/profileActions';
     ...
     ...
     //function to delete account
     onDeleteClick(event) {
       this.props.deleteAccount();
     }
     ...
     ...
     ...
     export default connect(
     mapStateToProps,
     { getCurrentProfile, deleteAccount }
   )(Dashboard);
   ```

8. we now want to update the `propTypes`

   ```react
   Dashboard.propTypes = {
     getCurrentProfile: PropTypes.func.isRequired,
     deleteAccount: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired,
     profile: PropTypes.object.isRequired
   };
   ```

9. bring this into `actions/profileActions.js`

   ```react
   //NOTE: dispatch is used for AXIOS requests
   export const deleteAccount = () => dispatch => {
     if (window.confirm('Are you sure? This action CANNOT be undone.')) {
       axios
         .delete('/api/profile')
         .then(res =>
           dispatch({
             type: SET_CURRENT_USER,
             payload: {}
           })
         )
         .catch(err =>
           dispatch({
             type: GET_ERRORS,
             payload: err.response.data
           })
         );
     }
   };
   ```

10. the workflow goes:

    1. axios request gets received in `profileActions.js`
    2. the default export in `authReducer.js` lets you actually check for authentication



### Edit Profile Component

we want to now be able to edit the profile

1. `components/edit-profile/EditProfile.js`

   1. in `App.js`import `getCurrentProfile` and add a lifecycle method `getCurrentProfile`

   ```react
   import { createProfile, getCurrentProfile } from '../../actions/profileActions';
   ...
   ...
   ...
     componentDidMount() {
         this.props.getCurrentProfile();
     }
     ...
     ...
     export default connect(
     mapStateToProps,
     { createProfile, getCurrentProfile }
   )(withRouter(CreateProfile));
   ```

2. edit `componentWillReceiveProps` and import `isEmpty` to use inside it

   ```react
   //For Create Profile from profileActions
     componentWillReceiveProps(nextProps) {
       if (nextProps.errors) {
         //fills the state with the error
         this.setState({ errors: nextProps.errors });
       }
       //We want to see if this profile has come in from the state because we want to fill the component fields with those values
       if (nextProps.profile.profile) {
         const profile = nextProps.profile.profile;
         //if the user doesn't have option fields filled in, we need to make it an empty string
         //so import isEmpty function
         //we want to make the skills array into a CSV
         //takes array and splits each value by a comma
         const skillsCSV = profile.skills.join(',');
   
         //if profile field doens't exist, make empty string
         profile.company = !isEmpty(profile.company) ? profile.company : '';
         profile.website = !isEmpty(profile.website) ? profile.website : '';
         profile.location = !isEmpty(profile.location) ? profile.location : '';
         profile.githubusername = !isEmpty(profile.githubusername)
           ? profile.githubusername
           : '';
         profile.bio = !isEmpty(profile.bio) ? profile.bio : '';
         profile.social = !isEmpty(profile.social) ? profile.social : {};
         profile.twitter = !isEmpty(profile.social.twitter)
           ? profile.social.twitter
           : '';
         profile.facebook = !isEmpty(profile.social.facebook)
           ? profile.social.facebook
           : '';
         profile.linkedin = !isEmpty(profile.social.linkedin)
           ? profile.social.linkedin
           : '';
         profile.youtube = !isEmpty(profile.social.youtube)
           ? profile.social.youtube
           : '';
         profile.instagram = !isEmpty(profile.social.instagram)
           ? profile.social.instagram
           : '';
   
         //Set component fields state
         this.setState({
           handle: profile.handle,
           company: profile.company,
           website: profile.website,
           location: profile.location,
           status: profile.status,
           githubusername: profile.githubusername,
           bio: profile.bio,
           twitter: profile.company,
           facebook: profile.facebook,
           linkedin: profile.linkedin,
           youtube: profile.youtube,
           skills: skillsCSV
         });
       }
     }
   ```

3. let's add a dashboard link in `Navbar.js`

   ```react
   render() {
       const { isAuthenticated, user } = this.props.auth;
       const authLinks = (
         <ul className="navbar-nav ml-auto">
           <li className="nav-item">
             <Link className="nav-link" to="/dashboard">
               Dashboard
             </Link>
           </li>
           ...
           ...
           ...
   ```



### Adding Experiences and Education from Dashboard

1. create `components/add-credentials/AddExperience.js` and `components/add-credentials/AddEducation.js`

   - in `AddExperience`

   ```react
   import React, { Component } from 'react';
   //bring in the redux state we need withROuter to redirect from an action
   import { Link, withRouter } from 'react-router-dom';
   import TextFieldGroup from '../common/TextFieldGroup';
   import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
   //we need the connect import for containers
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   
   class AddExperience extends Component {
     constructor(props) {
       super(props);
       this.state = {
         company: '',
         title: '',
         location: '',
         from: '',
         to: '',
         current: false,
         description: '',
         errors: {},
         disabled: false
       };
     }
   
     render() {
       //FUnFACT: Destructuring is an ES6 standard
       const { errors } = this.state;
   
       return;
       <div className="add-experience">
         <div className="container">
           <div className="row">
             <div className="div col-md-8 m-auto">
               <Link to="dashboard" className="btn btn-light">
                 Go Back
               </Link>
               <h1 className="hisplay-4 text-center">Add Experience</h1>
               <p className="lead text-center">Add any job or position you had</p>
               <small className="d-block pb-3">* = required fields</small>
             </div>
           </div>
         </div>
       </div>;
     }
   }
   AddExperience.propTypes = {
     profile: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile,
     errors: state.errors
   });
   
   export default connect(mapStateToProps)(withRouter(AddExperience));
   ```

   - import this into our router in `App.js`

     ```react
     import AddExperience from './components/add-credentials/AddExperience';
     
     ...
     ...
     ...
     
                   <Switch>
                     <PrivateRoute
                       exact
                       path="/add-experience"
                       component={AddExperience}
                     />
                   </Switch>
     ```

2. We want to create the actual fields now, so in `AddExperience` under the latest `small` tag:

   ```react
   <form onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="* Company"
                     name="company"
                     value={this.state.company}
                     onChange={this.onChange}
                     error={errors.company}
                   />
                   <TextFieldGroup
                     placeholder="* Job Title"
                     name="title"
                     value={this.state.title}
                     onChange={this.onChange}
                     error={errors.title}
                   />
                   <TextFieldGroup
                     placeholder="* Location"
                     name="location"
                     value={this.state.location}
                     onChange={this.onChange}
                     error={errors.location}
                   />
                   <h6>From Date</h6>
                   <TextFieldGroup
                     name="from"
                     type="date"
                     value={this.state.from}
                     onChange={this.onChange}
                     error={errors.from}
                   />
                   <h6>To Date</h6>
                   <TextFieldGroup
                     name="to"
                     type="date"
                     value={this.state.to}
                     onChange={this.onChange}
                     error={errors.to}
                     disabled={this.state.disabled ? 'disabled' : ''}
                   />
                   <div className="form-check mb-4">
                     <input
                       type="checkbox"
                       className="form-check-input"
                       name="current"
                       value={this.state.current}
                       checked={this.state.current}
                       onChange={this.onCheck}
                       id="current"
                     />
                     <label htmlFor="current" className="form-check-label">
                       Current Job
                     </label>
                   </div>
                   <TextAreaFieldGroup
                     placeholder="Job Description"
                     name="description"
                     value={this.state.description}
                     onChange={this.onChange}
                     error={errors.description}
                     info="Tell us about the position"
                   />
                   <input
                     type="submit"
                     value="Submit"
                     className="btn btn-info btn-block mt-4"
                   />
                 </form>
   ```

3. we want the Current Job portion to click, so create `onChange` and `onSubmit`

   ```javascript
   class AddExperience extends Component {
     constructor(props) {
       super(props);
       this.state = {
         company: '',
         title: '',
         location: '',
         from: '',
         to: '',
         current: false,
         description: '',
         errors: {},
         disabled: false
       };
   
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
       this.onCheck = this.onCheck.bind(this);
     }
   
     onSubmit(event) {
       event.preventDefault();
       console.log('submit');
     }
   
     onChange(event) {
       this.setState({ [event.target.name]: event.target.value });
     }
   
     onCheck(event) {
       //we want to change the disabled state and set current to whatever it is
       this.setState({
         disabled: !this.state.disabled,
         current: !this.state.current
       });
     }
   ```



### Create Add Experience Functionality

1. in `AddExperience`

   ```react
   //the addExperience action
   import { addExperience } from '../../actions/profileActions';
   
   ...
   ...
   ...
   
   AddExperience.propTypes = {
     addExperience: PropTypes.func.isRequired,
     profile: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile,
     errors: state.errors
   });
   
   export default connect(
     mapStateToProps,
     { addExperience }
   )(withRouter(AddExperience));
   ```

2. change `onSubmit`, because this is when we want things to happen

   ```react
    onSubmit(event) {
       event.preventDefault();
   
       const expData = {
         company: this.state.company,
         title: this.state.title,
         location: this.state.location,
         from: this.state.from,
         to: this.state.to,
         current: this.state.current,
         description: this.state.description
       };
   
       //we can use history because we brought in withRouter
       this.props.addExperience(expData, this.props.history);
     }
   ```

3. and now in `actions/profileActions`, create `addExperience` function

   ```react
   //Add Experience
   export const addExperience = (expData, history) => dispatch => {
     axios
       .post('/api/profile/experience', expData)
       .then(res => history.push('/dashboard'))
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```

4. **NOTE: WE CANNOT FORGET `componentWillReceiveProps`**, or we will get a bad request

   ```react
   componentWillReceiveProps(nextProps) {
       if (nextProps.errors) {
         this.setState({ errors: nextProps.errors });
       }
     }
   ```





### Add Education Form & Functionality

1. in `components/add-credentials/AddEducation`

   ```react
   import React, { Component } from 'react';
   //bring in the redux state we need withROuter to redirect from an action
   import { Link, withRouter } from 'react-router-dom';
   import TextFieldGroup from '../common/TextFieldGroup';
   import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
   //we need the connect import for containers
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   //the addEducation action
   import { addEducation } from '../../actions/profileActions';
   
   class AddEducation extends Component {
     constructor(props) {
       super(props);
       this.state = {
         school: '',
         degree: '',
         fieldofstudy: '',
         from: '',
         to: '',
         current: false,
         description: '',
         errors: {},
         disabled: false
       };
   
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
       this.onCheck = this.onCheck.bind(this);
     }
   
     componentWillReceiveProps(nextProps) {
       if (nextProps.errors) {
         this.setState({ errors: nextProps.errors });
       }
     }
   
     onSubmit(event) {
       event.preventDefault();
   
       const eduData = {
         school: this.state.school,
         degree: this.state.degree,
         fieldofstudy: this.state.fieldofstudy,
         from: this.state.from,
         to: this.state.to,
         current: this.state.current,
         description: this.state.description
       };
   
       //we can use history because we brought in withRouter
       this.props.addEducation(eduData, this.props.history);
     }
   
     onChange(event) {
       this.setState({ [event.target.name]: event.target.value });
     }
   
     onCheck(event) {
       //we want to change the disabled state and set current to whatever it is
       this.setState({
         disabled: !this.state.disabled,
         current: !this.state.current
       });
     }
   
     render() {
       //FUnFACT: Destructuring is an ES6 standard
       const { errors } = this.state;
   
       return (
         <div className="add-education">
           <div className="container">
             <div className="row">
               <div className="div col-md-8 m-auto">
                 <Link to="dashboard" className="btn btn-light">
                   Go Back
                 </Link>
                 <h1 className="hisplay-4 text-center">Add Education</h1>
                 <p className="lead text-center">Add any school, bootcamp etc.</p>
                 <small className="d-block pb-3">* = required fields</small>
                 <form onSubmit={this.onSubmit}>
                   <TextFieldGroup
                     placeholder="* School"
                     name="school"
                     value={this.state.school}
                     onChange={this.onChange}
                     error={errors.school}
                   />
                   <TextFieldGroup
                     placeholder="* Degree or Certification"
                     name="degree"
                     value={this.state.degree}
                     onChange={this.onChange}
                     error={errors.degree}
                   />
                   <TextFieldGroup
                     placeholder="* Field of Study"
                     name="fieldofstudy"
                     value={this.state.fieldofstudy}
                     onChange={this.onChange}
                     error={errors.fieldofstudy}
                   />
                   <h6>From Date</h6>
                   <TextFieldGroup
                     name="from"
                     type="date"
                     value={this.state.from}
                     onChange={this.onChange}
                     error={errors.from}
                   />
                   <h6>To Date</h6>
                   <TextFieldGroup
                     name="to"
                     type="date"
                     value={this.state.to}
                     onChange={this.onChange}
                     error={errors.to}
                     disabled={this.state.disabled ? 'disabled' : ''}
                   />
                   <div className="form-check mb-4">
                     <input
                       type="checkbox"
                       className="form-check-input"
                       name="current"
                       value={this.state.current}
                       checked={this.state.current}
                       onChange={this.onCheck}
                       id="current"
                     />
                     <label htmlFor="current" className="form-check-label">
                       Currently Attending
                     </label>
                   </div>
                   <TextAreaFieldGroup
                     placeholder="Program Description"
                     name="description"
                     value={this.state.description}
                     onChange={this.onChange}
                     error={errors.description}
                     info="Tell us about the program that you were in"
                   />
                   <input
                     type="submit"
                     value="Submit"
                     className="btn btn-info btn-block mt-4"
                   />
                 </form>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   AddEducation.propTypes = {
     addEducation: PropTypes.func.isRequired,
     profile: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile,
     errors: state.errors
   });
   
   export default connect(
     mapStateToProps,
     { addEducation }
   )(withRouter(AddEducation));
   
   ```

2. create the `addEducation` action in `profileActions`

   ```react
   //Add Education
   export const addEducation = (eduData, history) => dispatch => {
     axios
       .post('/api/profile/education', eduData)
       .then(res => history.push('/dashboard'))
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```

3. now we want to bring this route into `App.js`

   ```react
   import AddEducation from './components/add-credentials/AddEducation';  
   
   			<Switch>
                   <PrivateRoute
                     exact
                     path="/add-education"
                     component={AddEducation}
                   />
                 </Switch>
   ```

4. Add education and experience works perfectly now~



### Dashboard: Display & Delete Experience

1. in `dashboard/Dashboard.js` import

   ```react
   //import experience for dashboard experience content
   import Experience from './Experience';
   
   dashboardContent = (
             <div>
               <p className="lead text-muted">
                 Welcome <Link to={`/profile/${profile.handle}`}>{user.name}</Link>
               </p>
               <ProfileActions />
               <Experience experience={profile.experience} />
               <div style={{ marginBottom: '60px' }} />
               <button
                 onClick={this.onDeleteClick.bind(this)}
                 className="btn btn-danger"
               >
                 Delete My Account
               </button>
             </div>
           );
   ```

2. create `Experience.js` 

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import { withRouter } from 'react-router-dom';
   
   class Experience extends Component {
     render() {
       const experience = this.props.experience.map(exp => (
         <tr key={exp._id}>
           <td>{exp.company}</td>
           <td>{exp.title}</td>
           <td>
             {exp.to} - {exp.to}
           </td>
           <td>
             <button className="btn btn-danger">Delete</button>
           </td>
         </tr>
       ));
   
       return (
         <div>
           <h4 className="mb-4">Experience Credentials</h4>
           <table className="table">
             <thead>
               <tr>
                 <th>Company</th>
                 <th>Title</th>
                 <th>Years</th>
                 <th />
               </tr>
               <tbody>{experience}</tbody>
             </thead>
           </table>
         </div>
       );
     }
   }
   
   export default connect(null)(withRouter(Experience));
   ```

3. This is all cool, but we want the date to be formatted better: so we are going to use `react moment`

4. install it in `client` directory:  `npm install react-moment` and `npm install moment`

5. go in `Experience.js` and import this

   ```react
   ...
   ...
   //importing react-moment to format experience date
   import Moment from 'react-moment';
   
   class Experience extends Component {
     render() {
       const experience = this.props.experience.map(exp => (
         <tr key={exp._id}>
           <td>{exp.company}</td>
           <td>{exp.title}</td>
           <td>
             <Moment format="YYYY/MM/DD">{exp.from}</Moment> -
             <Moment format="YYYY/MM/DD">{exp.to}</Moment>
           </td>
           <td>
             <button className="btn btn-danger">Delete</button>
           </td>
         </tr>
       ));
   ...
   ...
   ...
   ```

6. one problem we have is that the **Current Job** tick is recognized as an invalid date, so:

   ```react
   ...
   ...
           <td>
             <Moment format="YYYY/MM/DD">{exp.from}</Moment> -
             {exp.to === null ? (
               'Current'
             ) : (
               <Moment format="YYYY/MM/DD">{exp.to}</Moment>
             )}
           </td>
    ...
    ...
   ```

7. we want to be able to delete experiences from the dashboard:

   - import `deleteExperience` which we will create soon

   - create PropTypes for deleteExperience

   - change the button to do something `onClick`

   - we create `onDeleteClick`

     ```react
     ...
     ...
     import { deleteExperience } from '../../actions/profileActions';
     
     class Experience extends Component {
         onDeleteClick(id) {
             this.props.deleteExperience(id);
         }
     
       render() {
         const experience = this.props.experience.map(exp => (
           <tr key={exp._id}>
             ...
             ...
               <button onClick={this.onDeleteClick.bind(this, exp._id)} className="btn btn-danger">Delete</button>
             </td>
           </tr>
         ));
     
     ...
     ...
     ...
     
     Experience.propTypes = {
       deleteExperience: PropTypes.func.isRequired
     };
     
     export default connect(
       null,
       { deleteExperience }
     )(withRouter(Experience));
     
     ```

8. create `deleteExperience` in `actions/profileAction.js`

   ```javascript
   //Delete Experience
   export const deleteExperience = id => dispatch => {
     axios
       .delete(`/api/profile/experience/${id}`)
       .then(res =>
         dispatch({
           type: GET_PROFILE,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```

9. We can now delete experiences



### Dashboard: Education Display & Delete

We want to delete education now

1. copy over `Experience` as a template into the new `dashboard/Education` file

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import { withRouter } from 'react-router-dom';
   //importing react-moment to format experience date
   import Moment from 'react-moment';
   //to delete experience
   import { deleteEducation } from '../../actions/profileActions';
   
   class Education extends Component {
     onDeleteClick(id) {
       this.props.deleteEducation(id);
     }
   
     render() {
       const education = this.props.education.map(edu => (
         <tr key={edu._id}>
           <td>{edu.school}</td>
           <td>{edu.degree}</td>
           <td>
             <Moment format="YYYY/MM/DD">{edu.from}</Moment> -
             {edu.to === null ? (
               ' Current'
             ) : (
               <Moment format="YYYY/MM/DD">{edu.to}</Moment>
             )}
           </td>
           <td>
             <button
               onClick={this.onDeleteClick.bind(this, edu._id)}
               className="btn btn-danger"
             >
               Delete
             </button>
           </td>
         </tr>
       ));
   
       return (
         <div>
           <h4 className="mb-4">Education Credentials</h4>
           <table className="table">
             <thead>
               <tr>
                 <th>School</th>
                 <th>Degree</th>
                 <th>Years</th>
                 <th />
               </tr>
               {education}
             </thead>
           </table>
         </div>
       );
     }
   }
   
   Education.propTypes = {
     deleteEducation: PropTypes.func.isRequired
   };
   
   export default connect(
     null,
     { deleteEducation }
   )(withRouter(Education));
   
   ```

2. go back to `Dashboard.js`, import the Education file, and add the route

   ```react
   ...
   ...
   import Education from './Education';
   ...
   ...
   ...
   dashboardContent = (
             <div>
               <p className="lead text-muted">
                 Welcome <Link to={`/profile/${profile.handle}`}>{user.name}</Link>
               </p>
               <ProfileActions />
               <Experience experience={profile.experience} />
               <Education education={profile.education} />
               <div style={{ marginBottom: '60px' }} />
               <button
                 onClick={this.onDeleteClick.bind(this)}
                 className="btn btn-danger"
               >
                 Delete My Account
               </button>
             </div>
           );
   ```

3. create `deleteEducation` function

   ```react
   //Delete Education
   export const deleteEducation = id => dispatch => {
     axios
       .delete(`/api/profile/experience/${id}`)
       .then(res =>
         dispatch({
           type: GET_PROFILE,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```

4. Sweet, this all works now!

5. Let's add a quick **Go Back** button on the *Add* pages for convenience:

   - in `EditProfile.js` import `Link` and add a button before the top margin

     ```react
     import { withRouter, Link } from 'react-router-dom';
     ...
     ...
     ...
     <div className="create-profile">
             <div className="container">
               <div className="row">
                 <div className="col-md-8 m-auto">
                   {/* Added link to go back to dashboard */}
                   <Link to="dashboard" className="btn btn-light">
                     Go Back
                   </Link>
                   ...
                  ...
                 ..
                ..
              ...
             
     ```

6. Now there's a go-back button as well

### Profile Display

We want to build the display components of our profile

1. create `components/profiles/Profiles.js` and `ProfileItem.js` which turns each component into a list

2. in `Profiles.js`:

   ```react
   import React, { Component } from 'react';
   //for redux stuff
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import Spinner from '../common/Spinner';
   //for fetching profiles
   import { getProfiles } from '../../actions/profileActions';
   
   class Profiles extends Component {
     //as soon as component mounts, get profile
     componentDidMount() {
       this.props.getProfiles();
     }
   
     render() {
       const { profiles, loading } = this.props.profile;
       let profileItems;
   
       //test to see if profile is loading
       if (profiles === null || loading) {
         profileItems = <Spinner />;
           } else {
         if (profiles.length > 0) {
           profileItems = <h1>PROFILES HERE</h1>;
         } else {
           profileItems = <h4>No Profiles Found</h4>;
         }
       }
       return (
         <div className="profiles">
           <div className="container">
             <div className="row">
               <div className="col-md-12">
                 <h1 className="display-4 text-center">Developer Profiles</h1>
                 <p className="lead text-center">
                   Browse and connect with other developers
                 </p>
                 {profileItems}
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   Profiles.propTypes = {
     getProfiles: PropTypes.func.isRequired,
     profile: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile
   });
   
   export default connect(
     mapStateToProps,
     { getProfiles }
   )(Profiles);
   ```

3. and then we want to bring in this as a route to `App.js` **NOTE: we use a regular `Route` because we want this to be a public route**

   ```react
   import Profiles from './components/profiles/Profiles'
   ...
   ...
   ...
   class App extends Component {
     render() {
       return (
         <Provider store={store}>
           <Router>
             <div className="App">
               <Navbar />
               <Route exact path="/" component={Landing} />
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
                 <Route exact path="/profiles" component={Profiles} />
   ```

4. let's create `getProfile` in `actions/profileActions`

   ```react
   ...
   import {
     GET_PROFILE,
     GET_PROFILES,
     PROFILE_LOADING,
     CLEAR_CURRENT_PROFILE,
     GET_ERRORS,
     SET_CURRENT_USER
   } from './types';
   
   // Get All Profiles
   export const getProfiles = () => dispatch => {
     dispatch(setProfileLoading());
     axios
       .delete('/api/profile/all')
       .then(res =>
         dispatch({
           type: GET_PROFILE,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_PROFILES,
           payload: null
         })
       );
   };
   ...
   ```

5. go to `profileReducer`  and add a case for `GET_PROFILES`

   ```react
   export default function(state = initialState, action) {
     switch (action.type) {
       case PROFILE_LOADING:
         return {
           ...state,
           loading: true
         };
       case GET_PROFILE:
         return {
           ...state,
           profile: action.payload,
           loading: false
         };
       case GET_PROFILES:
         return {
           ...state,
           profiles: action.payload,
           loading: false
         };
   ```



### Profile Items

We want to create items for the profile to display

1. in `ProfileItem.js` we create a new react component

   ```react
   import React, { Component } from 'react'
   import PropTypes from 'prop-types'
   import { Link } from 'react-router-dom'
   import isEmpty from '../../validation/is-empty'
   
   
   class ProfileItem extends Component {
     render() {
   
       const { profile} = this.props;
   
       return (
         <div className='card card-body bg-light mb-3'>
           <div className='row'>
               <div className="col-2">
                   <img src={profile.user.avatar} alt="" className="rounded-circle"/>
               </div>
           </div>
         </div>
       )
     }
   }
   
   export default ProfileItem
   ```

2. ```react
   import React, { Component } from 'react';
   //for redux stuff
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import Spinner from '../common/Spinner';
   //for fetching profiles
   import { getProfiles } from '../../actions/profileActions';
   
   class Profiles extends Component {
     //as soon as component mounts, get profile
     componentDidMount() {
       this.props.getProfiles();
     }
   
     render() {
       const { profiles, loading } = this.props.profile;
       let profileItems;
       //test to see if profile is loading
       if (profiles === null || loading) {
         profileItems = <Spinner />;
       } else {
         if (profiles.length > 0) {
           profileItems = <h1>PROFILES HERE</h1>;
         } else {
           profileItems = <h4>No Profiles Found</h4>;
         }
       }
       return (
         <div className="profiles">
           <div className="container">
             <div className="row">
               <div className="col-md-12">
                 <h1 className="display-4 text-center">Developer Profiles</h1>
                 <p className="lead text-center">
                   Browse and connect with other developers
                 </p>
                 {profileItems}
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   Profiles.propTypes = {
     getProfiles: PropTypes.func.isRequired,
     profile: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile
   });
   
   export default connect(
     mapStateToProps,
     { getProfiles }
   )(Profiles);
   
   ```

3. we want to import this into `Profiles.js` and replace the placeholders with the actual profile items

   ```react
   import ProfileItem from './ProfileItem'
   ...
   ...
   ...
     render() {
       const { profiles, loading } = this.props.profile;
       let profileItems;
       //test to see if profile is loading
       if (profiles === null || loading) {
         profileItems = <Spinner />;
       } else {
         if (profiles.length > 0) {
           profileItems = profiles.map(profile => (
             <ProfileItem key={profile._id} profile={profile} />
           ));
         } else {
           profileItems = <h4>No Profiles Found</h4>;
         }
       }
   ```

4. Now our 'All Profiles' button works perfectly, we need to make Each Profile work now



### User Profile by Handle and Subcomponents

We need each user profile to have stuff inside it

1. create `components/profile/Profile.js` and `ProfileHeader.js`, `ProfileAbout.js`, `ProfileGithub.js`, `ProfileCreds.js`

2. Fill in all the files with a RCC placeholder, and then fill Profile.js with the necessary imports for the other Profile files

   ```react
   import React, { Component } from 'react';
   import ProfileHeader from './ProfileHeader';
   import ProfileAbout from './ProfileAbout';
   import ProfileCreds from './ProfileCreds';
   import ProfileGithub from './ProfileGithub';
   import Spinner from '../common/Spinner';
   //importing redux for fetching profile
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   import { Link } from 'react-router-dom';
   import { getProfileByHandle } from '../../actions/profileActions';
   
   class Profile extends Component {
     componentDidMount() {
       if (this.props.match.params.handle) {
         this.props.getProfileByHandle(this.props.match.params.handle);
       }
     }
   
     render() {
       return (
         <div>
           <h1>TODO: Profile Creds</h1>
         </div>
       );
     }
   }
   
   Profile.propTypes = {
     profile: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile
   });
   
   export default connect(mapStateToProps)(Profile);
   ```

3. make sure to import `Profile` into `App.js` and create a public route to profiles

   ```react
   import Profile from './componenets/profile/Profile';
   ...
   ...
   ...
   class App extends Component {
     render() {
       return (
         <Provider store={store}>
           <Router>
             <div className="App">
               <Navbar />
               <Route exact path="/" component={Landing} />
               <div className="container">
                 <Route exact path="/register" component={Register} />
                 <Route exact path="/login" component={Login} />
                 <Route exact path="/profiles" component={Profiles} />
   ```

   

4. we now want to create the actual action to grab a profile by the handle in `profileActions`

   ```react
   // Get profile by handle
   export const getProfileByHandle = handle => dispatch => {
     //setprofileloading to set the profile to be loading before the actual request
     dispatch(setProfileLoading());
     //get current user profile
     axios
       .get(`/api/profile/handle/${handle}`)
       .then(res =>
         dispatch({
           type: GET_PROFILE,
           payload: res.data
         })
       )
       //If there isn't a profile, just return an empty profile and a button to create one, instead of errors
       .catch(err =>
         dispatch({
           type: GET_PROFILE,
           payload: null
         })
       );
   };
   ```

5. go back to `Profile.js` and make sure this is imported, and declare it on the bottom for redux connect

   ```react
   import { getProfileByHandle } from '../../actions/profileActions';
   ...
   ...
   ...
   Profile.propTypes = {
     getProfileByHandle: PropTypes.func.isRequired,
     profile: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     profile: state.profile
   });
   
   export default connect(
     mapStateToProps,
     { getProfileByHandle }
   )(Profile);
   ```

6. now in our redux states, we can see that the profile can be grabbed by the handle

7. just for visual verification, we add these lines to add some header placeholders for user profiles in `Profile.js`

   ```react
   ...
   ...
   class Profile extends Component {
     componentDidMount() {
       if (this.props.match.params.handle) {
         this.props.getProfileByHandle(this.props.match.params.handle);
       }
     }
   
     render() {
       return (
         <div>
           <ProfileHeader />
           <ProfileAbout />
           <ProfileCreds />
           <ProfileGithub />
         </div>
       );
     }
   }
   ...
   ...
   ```



### Profile Header

1. we want to get rid of the placeholders in `Profile` with proper containage

   ```react
     render() {
       const { profile, loading } = this.props.profile;
       let profileContent;
   
       if (profile === null || loading) {
         profileContent = <Spinner />;
       } else {
         profileContent = (
           <div>
             <div className="row">
               <div className="col-md-6">
                 <Link to="/profiles" className="btn btn-light mb-3 float-left">
                   Back To Profiles
                 </Link>
               </div>
               <div className="col-md-6" />
             </div>
             <ProfileHeader profile={profile} />
             <ProfileAbout />
             <ProfileCreds />
             <ProfileGithub />
           </div>
         );
       }
       return (
         <div className="profile">
           <div className="container">
             <div className="row">
               <div className="col-md-12">{profileContent}</div>
             </div>
           </div>
         </div>
       );
     }
   }
   ```

2. Now we want to go into `ProfileHeader` and bring these components out

   ```react
   import React, { Component } from 'react';
   import isEmpty from '../../validation/is-empty';
   
   class ProfileHeader extends Component {
     render() {
       const { profile } = this.props;
       return (
         <div className="row">
           <div className="col-md-12">
             <div className="card card-body bg-info text-white mb-3">
               <div className="row">
                 <div className="col-4 col-md-3 m-auto">
                   <img
                     className="rounded-circle"
                     src={profile.user.avatar}
                     alt=""
                   />
                 </div>
               </div>
               <div className="text-center">
                 <h1 className="display-4 text-center">{profile.user.name}</h1>
                 <p className="lead text-center">
                   {profile.status}
                   {isEmpty(profile.company) ? null : (
                     <span>at {profile.company}</span>
                   )}
                 </p>
   
                 {isEmpty(profile.location) ? null : <p>at {profile.location}</p>}
   
                 <p>
                   <a className="text-white p-2" href="#">
                     <i className="fas fa-globe fa-2x" />
                   </a>
                   <a className="text-white p-2" href="#">
                     <i className="fab fa-twitter fa-2x" />
                   </a>
                   <a className="text-white p-2" href="#">
                     <i className="fab fa-facebook fa-2x" />
                   </a>
                   <a className="text-white p-2" href="#">
                     <i className="fab fa-linkedin fa-2x" />
                   </a>
                   <a className="text-white p-2" href="#">
                     <i className="fab fa-instagram fa-2x" />
                   </a>
                 </p>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   export default ProfileHeader;
   ```

3. Now our profile picture and tags are there, we need to make sure the social media icons are linked before displaying this

   ```react
   ...
   ...
   ...
                   {isEmpty(profile.company) ? null : (
                     <span>at {profile.company}</span>
                   )}
                 </p>
   
                 {isEmpty(profile.location) ? null : <p>at {profile.location}</p>}
   
                 <p>
                   {isEmpty(profile.website) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.website}
                       target="_blank"
                     >
                       <i className="fas fa-globe fa-2x" />
                     </a>
                   )}
                   {isEmpty(profile.social && profile.social.twitter) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.social.twitter}
                       target="_blank"
                     >
                       <i className="fab fa-twitter fa-2x" />
                     </a>
                   )}
                   {isEmpty(profile.social && profile.social.facebook) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.social.facebook}
                       target="_blank"
                     >
                       <i className="fab fa-facebook fa-2x" />
                     </a>
                   )}
                   {isEmpty(profile.social && profile.social.linkedin) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.social.linkedin}
                       target="_blank"
                     >
                       <i className="fab fa-linkedin fa-2x" />
                     </a>
                   )}
                   {isEmpty(profile.social && profile.social.youtube) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.social.youtube}
                       target="_blank"
                     >
                       <i className="fab fa-youtube fa-2x" />
                     </a>
                   )}
                   {isEmpty(profile.social && profile.social.instagram) ? null : (
                     <a
                       className="text-white p-2"
                       href={profile.social.instagram}
                       target="_blank"
                     >
                       <i className="fab fa-instagram fa-2x" />
                     </a>
                   )}
                 </p>
   ...
   ...
   ...
   ```

4. Now our profile only shows icons for the social media features we have links for



### Profile About & Credentials section

1. we want to grab the profile about code from the devote_theme folder we downloaded

   ```react
   import React, { Component } from 'react';
   import PropTypes from 'prop-types';
   import isEmpty from '../../validation/is-empty';
   
   class ProfileAbout extends Component {
     render() {
       const { profile } = this.props;
   
       //Get first name
       const firstName = profile.user.name.trim().split(' ')[0];
   
       //Skill List
       const skills = profile.skills.map((skill, index) => (
         <div key={index} className="p-3">
           <i className="fa fa-check" /> {skill}
         </div>
       ));
   
       return (
         <div className="row">
           <div className="col-md-12">
             <div className="card card-body bg-light mb-3">
               <h3 className="text-center text-info">{firstName}'s Bio</h3>
               <p className="lead">
                 {isEmpty(profile.bio) ? null : <span>{profile.bio}</span>}
               </p>
               <hr />
               <h3 className="text-center text-info">Skill Set</h3>
               <div className="row">
                 <div className="d-flex flex-wrap justify-content-center align-items-center">
                   {skills}
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
   }
   
   export default ProfileAbout;
   ```

2. and make sure to plug this into `Profile.js` so the about section returns something else

   ```react
   ...
   ...
     render() {
       const { profile, loading } = this.props.profile;
       let profileContent;
   
       if (profile === null || loading) {
         profileContent = <Spinner />;
       } else {
         profileContent = (
           <div>
             <div className="row">
               <div className="col-md-6">
                 <Link to="/profiles" className="btn btn-light mb-3 float-left">
                   Back To Profiles
                 </Link>
               </div>
               <div className="col-md-6" />
             </div>
             <ProfileHeader profile={profile} />
             <ProfileAbout profile={profile} />
             <ProfileCreds />
             <ProfileGithub />
           </div>
         );
       }
   ...
   ...
   ...
   ```

3. We want credentials to work now, so go to `Profile.js` to pass in properties to `ProfileCreds`

   ```react
   <ProfileCreds education={profile.education} experience={profile.experience}/>
   ```

4. go to `ProfileCreds` and write this:

   ```react
   import React, { Component } from 'react';
   import Moment from 'react-moment';
   
   class ProfileCreds extends Component {
     render() {
       const { experience, education } = this.props;
   
       const expItems = experience.map(exp => (
         <li key={exp._id} className="list-group-item">
           <h4>{exp.company}</h4>
           <p>
             <Moment format="YYYY/MM/DD">{exp.from}</Moment> -{' '}
             {exp.to === null ? (
               ' Now'
             ) : (
               <Moment format="YYYY/MM/DD">{exp.to}</Moment>
             )}
           </p>
           <p>
             <strong>Position:</strong> {exp.title}
           </p>
           <p>
             {exp.location === '' ? null : (
               <span>
                 <strong>Location: </strong> {exp.location}
               </span>
             )}
           </p>
           <p>
             {exp.description === '' ? null : (
               <span>
                 <strong>Description: </strong> {exp.description}
               </span>
             )}
           </p>
         </li>
       ));
   
       return (
         <div>
           <h1>TODO: Profile Creds</h1>
         </div>
       );
     }
   }
   
   export default ProfileCreds;
   ```

5. and add parts for eduItems

   ```react
   import React, { Component } from 'react';
   import Moment from 'react-moment';
   
   class ProfileCreds extends Component {
     render() {
       const { experience, education } = this.props;
   
       const expItems = experience.map(exp => (
         <li key={exp._id} className="list-group-item">
           <h4>{exp.company}</h4>
           <p>
             <Moment format="YYYY/MM/DD">{exp.from}</Moment> -
             {exp.to === null ? (
               ' Now'
             ) : (
               <Moment format="YYYY/MM/DD">{exp.to}</Moment>
             )}
           </p>
           <p>
             <strong>Position:</strong> {exp.title}
           </p>
           <p>
             {exp.location === '' ? null : (
               <span>
                 <strong>Location: </strong> {exp.location}
               </span>
             )}
           </p>
           <p>
             {exp.description === '' ? null : (
               <span>
                 <strong>Description: </strong> {exp.description}
               </span>
             )}
           </p>
         </li>
       ));
   
       const eduItems = education.map(edu => (
         <li key={edu._id} className="list-group-item">
           <h4>{edu.school}</h4>
           <p>
             <Moment format="YYYY/MM/DD">{edu.from}</Moment> -{' '}
             {edu.to === null ? (
               ' Now'
             ) : (
               <Moment format="YYYY/MM/DD">{edu.to}</Moment>
             )}
           </p>
           <p>
             <strong>Degree:</strong> {edu.degree}
           </p>
           <p>
             <strong>Field of Study:</strong> {edu.fieldofstudy}
           </p>
           <p>
             {edu.description === '' ? null : (
               <span>
                 <strong>Description: </strong> {edu.description}
               </span>
             )}
           </p>
         </li>
       ));
   
       return (
         <div className="row">
           <div className="col-md-6">
             <h3 className="text-center text-info">Experience</h3>
             {/* test to see if there are any experience items */}
             {expItems.length > 0 ? (
               <ul className="list-group">{expItems}</ul>
             ) : (
               <p className="text-center">No Experiences Listed</p>
             )}
           </div>
           <div className="col-md-6">
             <h3 className="text-center text-info">Education</h3>
             {/* test to see if there are any education items */}
             {eduItems.length > 0 ? (
               <ul className="list-group">{eduItems}</ul>
             ) : (
               <p className="text-center">No Education Listed</p>
             )}
           </div>
         </div>
       );
     }
   }
   
   export default ProfileCreds;
   ```

6. Now the Profile shows Experiences and Education listed!



### Profile Github & Touch Ups

We now want the functionalities for the Github function.

1. we want to do a Google search for **Register a new OAuth application** and register for `localhost:3000` 

2. we want to go to `ProfileGithub` and import 

   ```react
   import React, { Component } from 'react';
   import { Link } from 'react-router-dom';
   import PropTypes from 'prop-types';
   
   class ProfileGithub extends Component {
     constructor(props) {
       super(props);
       this.state = {
         clientId: '8b27b07d3b50ccb9f297',
         clientSecret: 'f2afb15e5005e3860148091a7fb659cd838305cd',
         count: 5,
         sort: 'created: asc',
         repos: []
       };
     }
   
     componentDidMount() {
       const { username } = this.props;
       const { count, sort, clientId, clientSecret } = this.state;
   
       fetch(
         `https://api.github.com/users/${username}/repos?per_page=${count}&sort=${sort}&client_id=${clientId}&client_secret=${clientSecret}`
       )
         .then(res => res.json())
         .then(data => {
           if (this.refs.myRef && !data.message) {
             this.setState({ repos: data });
           }
         })
         .catch(err => console.log(err));
     }
   
     render() {
       const { repos } = this.state;
       const repoItems = repos.map(repo => (
         <div key={repo.id} className="card card-body mb-2">
           <div className="row">
             <div className="col-md-6">
               <h4>
                 <Link to={repo.html_url} className="text-info" target="_blank">
                   {repo.name}
                 </Link>
               </h4>
               <p>{repo.description}</p>
             </div>
             <div className="col-md-6">
               <span className="badge badge-info mr-1">
                 Stars: {repo.stargazers_count}
               </span>
               <span className="badge badge-secondary mr-1">
                 Watchers: {repo.watchers_count}
               </span>
               <span className="badge badge-success">
                 Forks: {repo.forks_count}
               </span>
             </div>
           </div>
         </div>
       ));
   
       return (
         <div ref="myRef">
           <hr />
           <h3 className="mb-4">Latest Github Repos</h3>
           {repoItems}
         </div>
       );
     }
   }
   
   ProfileGithub.propTypes = {
     username: PropTypes.string.isRequired
   };
   
   export default ProfileGithub;
   ```

3. create a new functional component inside `components/not-found/NotFound.js`: we want for pages that cannot be found to display such a message

   ```react
   import React from 'react'
   
   export default function NotFound() {
     return (
       <div>
         <h1 className="display-4">Page Not Found</h1>
         <p>Sorry, this page does not exist</p>
       </div>
     )
   }
   ```

4. and now we want to create a new route for this in `App.js` 

   ```react
   import NotFound from './components/not-found/NotFound';
   ...
   ...
   ...
                 <Switch>
                   <PrivateRoute
                     exact
                     path="/add-education"
                     component={AddEducation}
                   />
                 </Switch>
                 <Route exact path="/not-found" component={NotFound} />
               </div>
               <Footer />
   ...
   ...
   ```

5. create a new lifecycle method in `Profile.js` for `componentWillReceiveProps`

   ```react
     componentWillReceiveProps(nextProps) {
       if (nextProps.profile.profile === null && this.props.profile.loading) {
         this.props.history.push('/not-found');
       }
     }
   ```



### Posts: State & addPost Action

1. We need to create a new reducer and action file for post:

   `reducers/postReducer.js`

   ```react
   const initialState = {
       posts: [],
       post: {},
       loading: false
   }
   
   export default function(state = initialState, action) {
       switch(action.type) {
           default:
           return state;
       }
   }
   ```

2. We want to jump in `types.js` and add these new types under `GET_PROFILE`

   ```react
   ...
   export const POST_LOADING = 'POST_LOADING';
   export const GET_POSTS = 'GET_POSTS';
   export const GET_POST = 'GET_POST';
   export const ADD_POST = 'ADD_POST';
   export const DELETE_POST = 'DELETE_POST';
   ```

3. for this post reducer to even be seen, we need to import it into `reducers/index.js` 

   ```react
   ...
   ...
   import postReducer from './postReducer';
   
   export default combineReducers({
     auth: authReducer,
     errors: errorReducer,
     profile: profileReducer,
     post: postReducer
   });
   ```

4. create a new action to add posts `actions/postActions.js`

   ```react
   import axios from 'axios';
   
   import { ADD_POST, GET_ERRORS } from './types';
   
   //Add Post
   export const addPost = postData => dispatch => {
     axios
       .post('/api/posts', postData)
       .then(res =>
         dispatch({
           type: ADD_POST,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```



### Posts: Post Form Component

1. create `components/posts/Posts.js` and `PostForm.js`

2. `Posts.js` is going to be the Chrome parent wrapper for our app

   ```react
   import React, { Component } from 'react'
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import PostForm from './PostForm';
   import Spinner from '../common/Spinner';
   
   class Posts extends Component {
     render() {
       return (
         <div className='feed'>
           <div className="container">
               <div className="row">
               <div className="col-md-12">
               <PostForm />
               </div>
               </div>
           </div>
         </div>
       )
     }
   }
   
   export default Posts;
   ```

3. create a Route for this in `App.js`

   ```react
   ...
   ...
   import Posts from './components/posts/Posts';
   ...
   
   
   ...
   ...
   
                   <PrivateRoute
                     exact
                     path="/feed"
                     component={Posts}
                   />
                 </Switch>
   ```

4. and now we want the `Navbar` to show this, so in `Navbar.js`

   ```react
   ...
   ...
   ...
   
         <li className="nav-item">
             <Link className="nav-link" to="/feed">
               Post Feed
             </Link>
           </li>
           
   ...
   ...
   ...
   ```

5. copy paste the Post Form theme onto `PostForm.js`

   ```react
   import React, { Component } from 'react';
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
   import { addPost } from '../../actions/postActions';
   
   class PostForm extends Component {
     constructor(props) {
       super(props);
       this.state = {
         text: '',
         errors: {}
       };
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     onSubmit(e) {
       e.preventDefault();
       const { user } = this.props.auth;
   
       const newPost = {
         text: this.state.text,
         name: user.name,
         avatar: user.avatar
       };
   
       this.props.addPost(newPost);
   
       //clear the text field
       this.setState({ text: '' });
     }
   
     onChange(e) {
       this.setState({ [e.target.name]: e.target.value });
     }
   
     render() {
       const { errors } = this.state;
   
       return (
         <div className="post-form mb-3">
           <div className="card card-info">
             <div className="card-header bg-info text-white">Say Somthing...</div>
             <div className="card-body">
               <form onSubmit={this.onSubmit}>
                 <div className="form-group">
                   <TextAreaFieldGroup
                     placeholder="Create a post"
                     name="text"
                     value={this.state.text}
                     onChange={this.onChange}
                     error={errors.text}
                   />
                 </div>
                 <button type="submit" className="btn btn-dark">
                   Submit
                 </button>
               </form>
             </div>
           </div>
         </div>
       );
     }
   }
   
   PostForm.propTypes = {
     addPost: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     errors: state.errors,
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { addPost }
   )(PostForm);
   
   ```

6. once we submit the form we want to call `addPost`

   ```react
   ...
   ...
   onSubmit(e) {
       e.preventDefault();
       const { user } = this.props.auth;
   
       const newPost = {
         text: this.state.text,
         name: user.name,
         avatar: user.avatar
       };
   
       this.props.addPost(newPost);
   
       //clear the text field
       this.setState({ text: '' });
     }
   ...
   ...
   ```

7. We need to go back to `PostForm` to create a `componentWillReceiveProps` function

   ```react
   
     componentWillReceiveProps(newProps) {
       if (newProps.errors) {
         this.setState({ errors: newProps.errors });
       }
     }
   ```

8. we want to hop back in the `postReducer` so that when we add a post from the display, it adds it onto the redux console

   ```react
   import { ADD_POST } from '../actions/types';
   
   const initialState = {
     posts: [],
     post: {},
     loading: false
   };
   
   export default function(state = initialState, action) {
     switch (action.type) {
       case ADD_POST:
         return {
           ...state,
           posts: [action.payload, ...state.posts]
         };
   
       default:
         return state;
     }
   }
   ```




### Posts: getPosts Action and PostFeed Component

1. we want to create an action to grab the post, so we want to do that in `actions/postActions`

   ```react
   ...
   import { ADD_POST, GET_ERRORS, GET_POSTS, POST_LOADING } from './types';
   ...
   ...
   ...
   //Get Post
   export const getPost = () => dispatch => {
     dispatch(setPostLoading());
     axios
       .get('/api/posts')
       .then(res =>
         //once post is fetched
         dispatch({
           type: GET_POSTS,
           payload: res.data
         })
       )
       //for errors
       .catch(err =>
         dispatch({
           type: GET_POSTS,
           payload: null
         })
       );
   };
   
   // Set loading state for getPost
   export const setPostLoading = () => {
     return {
       type: POST_LOADING
     };
   };
   ```

2. we want to now create the `GET_POST` type in the `postReducer`

   ```react
   import { ADD_POST, GET_POSTS, POST_LOADING } from '../actions/types';
   ...
   ...
   ...
       case POST_LOADING:
         return {
           ...state,
           loading: true
         };
       //once we get the post
       case GET_POSTS:
         return {
           ...state,
           posts: action.payload,
           loading: false
         };
   ```

3. now it is time to create the actual component, so let's go to `posts/Posts` and hook it up with redux

   ```react
   Posts.propTypes = {
     getPosts: PropTypes.func.isRequired,
     post: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     post: state.post
   });
   
   export default connect(
     mapStateToProps,
     { getPosts }
   )(Posts);
   ```

4. and now we want to create the lifecycle method for `componentDidMount` as well as creating an if statement inside the render to check for posts

   ```react
   class Posts extends Component {
     componentDidMount() {
       this.props.getPosts();
     }
   
     render() {
       const { posts, loading } = this.props.post;
       let postContent;
   
       //make sure post is not null
       if (posts === null || loading) {
         postContent = <Spinner />;
       } else {
         //post is not null or not loading
         postContent = <PostFeed posts={posts} />;
       }
   
       return (
         <div className="feed">
           <div className="container">
             <div className="row">
               <div className="col-md-12">
                 <PostForm />
                 {/* This is where we want the content to show */}
                 {postContent}
   ```

5. and now we need to create `posts/PostFeed` because we require it, and also `posts/PostItem.js` for the next section

   - this funciton mainly serves to map through the posts and display them

   ```react
   import React, { Component } from 'react';
   import PropTypes from 'prop-types';
   import PostItem from './PostItem';
   
    class PostFeed extends Component {
     render() {
       //destructure post out of props
       const { posts } = this.props;
   
       return posts.map(post => <PostItem key={post._id} post={post} />)
     }
   }
   
   PostFeed.propTypes = {
       posts: PropTypes.array.isRequired
   }
   
   export default PostFeed;
   ```

6. we still get an error for now, but we will fix it in the next section and create the component in `PostItem.js`



### Posts: PostItem Component

This is where we will fix the render method issues with `PostFeed` in the last section

1. make an `rcc` component inside PostItems, and fill it with theme code for the Post Item in `feed.html` from `devnet_theme`. 

2. Change all the `class` tags into `className`, and then we want this to look more dynamic:

   - at this point, we have the theme to plug in repeating placeholders for each post we made 
   - the rest of the steps are mentioned in the comments

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   // import classnames from 'classnames';
   import { Link } from 'react-router-dom';
   
   class PostItem extends Component {
     onDeleteClick(id) {
       console.log(id);
     }
   
     render() {
       //pull post and auth out of props
       const { post, auth } = this.props;
   
       return (
         <div className="card card-body mb-3">
           <div className="row">
             <div className="col-md-2">
               <a href="profile.html">
                 <img
                   className="rounded-circle d-none d-md-block"
                   // Changed this post {post.avatar} for dyanmic user profile picture grabbing
                   src={post.avatar}
                   alt=""
                 />
               </a>
               <br />
               {/* So the name shows dynamically */}
               <p className="text-center">{post.name}</p>
             </div>
             <div className="col-md-10">
               <p className="lead">
                 {/* For dynamic text grabbing */}
                 {post.text}
               </p>
               <button type="button" className="btn btn-light mr-1">
                 <i className="text-info fas fa-thumbs-up" />
                 {/* For number of likes */}
                 <span className="badge badge-light">{post.likes.length}</span>
               </button>
               <button type="button" className="btn btn-light mr-1">
                 <i className="text-secondary fas fa-thumbs-down" />
               </button>
               {/* This allows us to get post by id, but we need to create a route */}
               <Link to={`/post/${post._id}`} className="btn btn-info mr-1">
                 Comments
               </Link>
               {/* This is so the authorized user can delete the post */}
               {post.user === auth.user.id ? (
                 <button
                   //   We need to create the onDeleteClick function
                   onClick={this.onDeleteClick.bind(this, post._id)}
                   type="button"
                   className="btn btn-danger mr-1"
                 >
                   <i className="fas fa-times" />
                 </button>
               ) : null}
             </div>
           </div>
         </div>
       );
     }
   }
   
   PostItem.propTypes = {
     post: PropTypes.object.isRequired,
     auth: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(mapStateToProps)(PostItem);
   ```



### Posts: Delete, Like, Unlike Posts

1. We first want to create the `deletePost` action in `actions/postActions`

   ```react
   //Delete Post
   export const deletePost = id => dispatch => {
     axios
       .delete(`/api/posts/${id}`)
       .then(res =>
         dispatch({
           type: DELETE_POST,
           payload: id
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.res.data
         })
       );
   };
   ```

2. now we want to import `DELETE_POST` to types

   ```react
   import { ADD_POST, GET_ERRORS, GET_POSTS, POST_LOADING, DELETE_POST } from './types';
   ```

3. then we want to hop into `postReducer` and add the `DELETE_POST` type

   ```react
   import { ADD_POST, GET_POSTS, POST_LOADING, DELETE_POST } from '../actions/types';
   
   ...
   ...
   
       //case for deleting post
       case DELETE_POST:
         return {
           ...state,
           posts: state.posts.filter(post => post._id !== action.payload)
         };
   ```

4. we want to bring this feature into `PostItem` now

   ```react
   import { deletePost } from '../../actions/postActions'
   ...
   ...
   
   class PostItem extends Component {
     onDeleteClick(id) {
       this.props.deletePost(id);
     }
     ...
   ...
   ...
   
   PostItem.propTypes = {
     post: PropTypes.object.isRequired,
     auth: PropTypes.object.isRequired,
     deletePost: PropTypes.func.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { deletePost }
   )(PostItem);
   ```

5. we now want to Like and Unlike posts, so we need to go to `postActions ` and create a new function called `addLike` and also `removeLike`

   ```react
   //Add Like
   export const addLike = id => dispatch => {
     axios
       .post(`/api/posts/like/${id}`)
       .then(res => dispatch(getPosts()))
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   
   //Remove Like
   export const removeLike = id => dispatch => {
     axios
       .post(`/api/posts/unlike/${id}`)
       .then(res => dispatch(getPosts()))
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.response.data
         })
       );
   };
   ```

6. go back to `PostItem` and bring in the two actions

   ```react
   import { deletePost, addLike, removeLike } from '../../actions/postActions';
   ...
   ...
   ...
   class PostItem extends Component {
     onDeleteClick(id) {
       this.props.deletePost(id);
     }
   onLikeClick(id) {
       this.props.addLike(id);
     }
     onUnlikeClick(id) {
       this.props.removeLike(id);
     }
   ...
   ...
   ...
   <button
                 onClick={this.onLikeClick.bind(this, post._id)}
                 type="button"
                 className="btn btn-light mr-1"
               >
                 <i className="text-info fas fa-thumbs-up" />
                 {/* For number of likes */}
                 <span className="badge badge-light">{post.likes.length}</span>
               </button>
               <button
                 onClick={this.onUnlikeClick.bind(this, post._id)}
                 type="button"
                 className="btn btn-light mr-1"
               >
   ...
   ...
   ...
   PostItem.propTypes = {
     addLike: PropTypes.func.isRequired,
     removeLike: PropTypes.func.isRequired,
     post: PropTypes.object.isRequired,
     auth: PropTypes.object.isRequired,
     deletePost: PropTypes.func.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { deletePost, addLike, removeLike }
   )(PostItem);
   ```

7. when we like a post, we want the post we liked to show in green, so that's what we want to do in `PostItem.js`

   ```react
     findUserLike(likes) {
       const {auth} = this.props;
       if(likes.filter(like => like.user === auth.user.id).length > 0) {
         return true;
       } else {
         return false;
       }
     }
   
   ...
   ...
   ...
               {/* So the name shows dynamically */}
               <p className="text-center">{post.name}</p>
             </div>
             <div className="col-md-10">
               <p className="lead">
                 {/* For dynamic text grabbing */}
                 {post.text}
               </p>
               <button
                 onClick={this.onLikeClick.bind(this, post._id)}
                 type="button"
                 className="btn btn-light mr-1"
               >
                 {/* NOTE: this Text Info class is what makes the button green, so we want THIS part to be dynamic */}
                 {/* with classnames, our text-info first checks if user is valid, and then changes the colors accordingly */}
                 <i className={classnames('fas fa-thumbs-up', {
                   'text-info': this.findUserLike(post.likes)
                 })} />
                 {/* For number of likes */}
                 <span className="badge badge-light">{post.likes.length}</span>
               </button>
               <button
                 onClick={this.onUnlikeClick.bind(this, post._id)}
                 type="button"
                 className="btn btn-light mr-1"
               >
                 <i className="text-secondary fas fa-thumbs-down" />
               </button>
   ```

8. now when we like a post, the thumbs up icon is blue

### 

### Posts: Comments and Single Post Display

We need to create a component and route for **SINGLE POSTS**

1. create `components/post/Post.js` for the post component

   ```react
   import React, { Component } from 'react'
   
   class Post extends Component {
     render() {
       return (
         <div>
           <h1>POST PLACEHOLDER</h1>
         </div>
       )
     }
   }
   
   export default Post;
   ```

2. in `App.js` bring in the Post component as well as create a Private Route

   ```react
   import Post from './components/post/Post';
   ...
   ...
   ...
   
   <Switch>
                   <PrivateRoute
                     exact
                     // We need :id because we want to grab each post's unique id for the page
                     path="/post/:id"
                     component={Post}
                   />
                 </Switch>
                 <Route exact path="/not-found" component={NotFound} />
               </div>
               <Footer />
             </div>
           </Router>
         </Provider>
       );
     }
   }
   
   export default App;
   ```

3. we need an action to fetch the post based on the id now, so create a `getPost` action in `action/postActions`

   ```react
   import {
     ADD_POST,
     GET_ERRORS,
     GET_POSTS,
     GET_POST,
     POST_LOADING,
     DELETE_POST
   } from './types';
   
   ...
   ...
   
   //Get post
   export const getPost = (id) => dispatch => {
     dispatch(setPostLoading());
     axios
       .get(`/api/post/${id}`)
       .then(res =>
         //once post is fetched
         dispatch({
           type: GET_POST,
           payload: res.data
         })
       )
       //for errors
       .catch(err =>
         dispatch({
           type: GET_POST,
           payload: null
         })
       );
   };
   ```

4. and now we want to bring this type into the `postReducer`

   ```react
   import {
     GET_POST,
     ADD_POST,
     GET_POSTS,
     POST_LOADING,
     DELETE_POST
   } from '../actions/types';
   
   ...
   ...
   
   export default function(state = initialState, action) {
     switch (action.type) {
       case GET_POST:
        return {
          ...state,
          post: action.payload,
          loading: false
        }
   ```

5. we are now finished with all the Redux stuff, so let's go back to `Post.js` and bring in redux there

   - we also have to deconstruct showActions from the prop to make sure the Like button is not featured on the page

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import { Link } from 'react-router-dom';
   import PropTypes from 'prop-types';
   import PostItem from '../posts/PostItem';
   import Spinner from '../common/Spinner';
   import { getPost } from '../../actions/postActions';
   
   class Post extends Component {
     componentDidMount() {
       this.props.getPost(this.props.match.params.id);
     }
   
     render() {
       //using PostItem to get post from props
       const { post, loading } = this.props.post;
       let postContent;
   
       if (post === null || loading || Object.keys(post).length === 0) {
         postContent = <Spinner />;
       } else {
         postContent = (
           <div>
             {/* this is because we do not want Like button to show in this page */}
             <PostItem post={post} showActions={false} />
           </div>
         );
       }
   
       return (
         <div className="post">
           <div className="container">
             <div className="row">
               <div className="col-md-12" />
               <Link to="/feed" className="btn btn-light mb-3">
                 Back to Feed
               </Link>
             </div>
             {postContent}
           </div>
         </div>
       );
     }
   }
   
   Post.propTypes = {
     getPost: PropTypes.func.isRequired,
     post: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     post: state.post
   });
   
   export default connect(
     mapStateToProps,
     { getPost }
   )(Post);
   ```

6. go back into `PostItem.js` to deconstruct `showActions` from props, and set it to `true` by making a new default Prop

   ```react
   //pull post and auth out of props
       //pulling showActions to disable like feature on comments page
   
       const { post, auth, showActions } = this.props;
   
       return (
   ...
           ...
           ...
           ...
               {/* only show likes if ShowActions is true */}
               {showActions ? (
                 <span>
                   <button
                     onClick={this.onUnlikeClick.bind(this, post._id)}
                     type="button"
                     className="btn btn-light mr-1"
                   >
                     <i className="text-secondary fas fa-thumbs-down" />
                   </button>
                   {/* This allows us to get post by id, but we need to create a route */}
                   <Link to={`/post/${post._id}`} className="btn btn-info mr-1">
                     Comments
                   </Link>
                   {/* This is so the authorized user can delete the post */}
                   {post.user === auth.user.id ? (
                     <button
                       //   We need to create the onDeleteClick function
                       onClick={this.onDeleteClick.bind(this, post._id)}
                       type="button"
                       className="btn btn-danger mr-1"
                     >
                       <i className="fas fa-times" />
                     </button>
                   ) : null}
                 </span>
               ) : null}
             </div>
           </div>
         </div>
       );
     }
   }
   
   PostItem.defaultProps = {
     showActions: true
   }
   
   ...
   ...
   ```

7. Now the post shows correctly, let's move onto the Comment Form



### Posts: Comment Form Component and Action

We want to add and display comments for each post page

1. create a bunch of new components in the states folder

   `post/CommentForm.js` - this one is basically a copy of `PostForm` with a couple modifications

   ```react
   import React, { Component } from 'react';
   import PropTypes from 'prop-types';
   import { connect } from 'react-redux';
   import TextAreaFieldGroup from '../common/TextAreaFieldGroup';
   //we are going to need to create this action
   import { addComment } from '../../actions/postActions';
   
   class CommentForm extends Component {
     constructor(props) {
       super(props);
       this.state = {
         text: '',
         errors: {}
       };
       this.onChange = this.onChange.bind(this);
       this.onSubmit = this.onSubmit.bind(this);
     }
   
     componentWillReceiveProps(newProps) {
       if (newProps.errors) {
         this.setState({ errors: newProps.errors });
       }
     }
   
     onSubmit(e) {
       e.preventDefault();
       const { user } = this.props.auth;
   
       //NEW: need this for the post id, so we know where to add the comment
       const { postId } = this.props;
   
       const newComment = {
         text: this.state.text,
         name: user.name,
         avatar: user.avatar
       };
   
       this.props.addComment(postId, newComment);
   
       //clear the text field
       this.setState({ text: '' });
     }
   
     onChange(e) {
       this.setState({ [e.target.name]: e.target.value });
     }
   
     render() {
       const { errors } = this.state;
   
       return (
         <div className="post-form mb-3">
           <div className="card card-info">
             <div className="card-header bg-info text-white">
               Leave a comment...
             </div>
             <div className="card-body">
               <form onSubmit={this.onSubmit}>
                 <div className="form-group">
                   <TextAreaFieldGroup
                     placeholder="Reply to post"
                     name="text"
                     value={this.state.text}
                     onChange={this.onChange}
                     error={errors.text}
                   />
                 </div>
                 <button type="submit" className="btn btn-dark">
                   Submit
                 </button>
               </form>
             </div>
           </div>
         </div>
       );
     }
   }
   
   CommentForm.propTypes = {
     addComment: PropTypes.func.isRequired,
     auth: PropTypes.object.isRequired,
     errors: PropTypes.object.isRequired,
     postId: PropTypes.string.isRequired
   };
   
   const mapStateToProps = state => ({
     errors: state.errors,
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { addComment }
   )(CommentForm);
   ```

2. now we want to create `addComment` in `postActions`

   ```react
   //Add Comment
   export const addComment = (postId, commentData) => dispatch => {
     axios
       .post(`/api/posts/comment/${postId}`, commentData)
       .then(res =>
         dispatch({
           type: GET_POST,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.res.data
         })
       );
   };
   ```

3. now we want to add the actual comment form in `Post.js`

   ```react
   import CommentForm from './CommentForm';
   
   ...
   ...
   ...
   
     render() {
       //using PostItem to get post from props
       const { post, loading } = this.props.post;
       let postContent;
   
       if (post === null || loading || Object.keys(post).length === 0) {
         postContent = <Spinner />;
       } else {
         postContent = (
           <div>
             {/* this is because we do not want Like button to show in this page */}
             <PostItem post={post} showActions={false} />
             <CommentForm postId={post._id}/>
           </div>
         );
       }
   ```

4. at this point, we can see the `Reply to Post` box



### Comment: Display and Delete (Feed Component and Item)

we now want to be able to see the comment out in the post

1. create two more components `post/CommentFeed.js` and `post/CommentItem.js`

2. feed takes care of mapping through the items and item is in charge of displaying each one

3. in `CommentFeed` create a class based component

   ```react
   import React, { Component } from 'react';
   import PropTypes from 'prop-types';
   import CommentItem from './CommentItem';
   
   class CommentFeed extends Component {
     render() {
       const { comments, postId } = this.props;
   
       return comments.map(comment => (
         <CommentItem key={comment._id} comment={comment} postId={postId} />
       ));
     }
   }
   
   CommentFeed.propTypes = {
     comments: PropTypes.array.isRequired,
     postId: PropTypes.string.isRequired
   };
   
   export default CommentFeed;
   ```

4. now in `CommentItem` we want to create a class based component and get `post.html`theme into the render, from the `devnet_theme` folder

5. and if we are an authorized user, we want to be able to delete an item as well

   ```react
   import React, { Component } from 'react';
   import { connect } from 'react-redux';
   import PropTypes from 'prop-types';
   //action for deleteComment, which we need to create
   import { deleteComment } from '../../actions/postActions';
   
   class CommentItem extends Component {
     render() {
       const { comment, postId, auth } = this.props;
   
       return (
         <div className="card card-body mb-3">
           <div className="row">
             <div className="col-md-2">
               <a href="profile.html">
                 <img
                   className="rounded-circle d-none d-md-block"
                   src={comment.avatar}
                   alt=""
                 />
               </a>
               <br />
               <p className="text-center">{comment.name}</p>
             </div>
             <div className="col-md-10">
               <p className="lead">{comment.text}</p>
               {/* This is so the authorized user can delete the post */}
               {comment.user === auth.user.id ? (
                 <button
                   //   We need to create the onDeleteClick function
                   onClick={this.onDeleteClick.bind(this, postId, comment._id)}
                   type="button"
                   className="btn btn-danger mr-1"
                 >
                   <i className="fas fa-times" />
                 </button>
               ) : null}
             </div>
           </div>
         </div>
       );
     }
   }
   
   CommentItem.propTypes = {
     deleteComment: PropTypes.func.isRequired,
     comment: PropTypes.object.isRequired,
     postId: PropTypes.string.isRequired,
     auth: PropTypes.object.isRequired
   };
   
   const mapStateToProps = state => ({
     auth: state.auth
   });
   
   export default connect(
     mapStateToProps,
     { deleteComment }
   )(CommentItem);
   
   
   ```

6. go back to `post/Post.js` and import the `CommentFeed`

   ```react
   import CommentFeed from './CommentFeed';
   
   ...
   
   class Post extends Component {
     componentDidMount() {
       this.props.getPost(this.props.match.params.id);
     }
   
     render() {
       //using PostItem to get post from props
       const { post, loading } = this.props.post;
       let postContent;
   
       if (post === null || loading || Object.keys(post).length === 0) {
         postContent = <Spinner />;
       } else {
         postContent = (
           <div>
             {/* this is because we do not want Like button to show in this page */}
             <PostItem post={post} showActions={false} />
             <CommentForm postId={post._id} />
             <CommentFeed postId={post._id} comments={post.comments} />
   
           </div>
         );
       }
   
   ```

7. go back to `postActions` and let's create the `deleteComment` action

   ```react
   //Delete Comment
   export const deleteComment = (postId, commentId) => dispatch => {
     axios
       .delete(`/api/posts/comment/${postId}/${commentId}`)
       .then(res =>
         dispatch({
           type: GET_POST,
           payload: res.data
         })
       )
       .catch(err =>
         dispatch({
           type: GET_ERRORS,
           payload: err.res.data
         })
       );
   };
   ```

8. go back into `CommentItem` and let's create onDeleteClick

   ```react
     onDeleteClick(postId, commentId) {
       this.props.deleteComment(postId, commentId);
     }
   ```

9. and at this point, the button to delete a comment appears AND works

10. we want to make sure that all errors clear after delete action has been done, so back in `postActions` and make a `clearErrors` action, as well as adding the `CLEAR_ERRROS` type in `actions/types.js`

    ```react
    import {
      CLEAR_ERRORS,
      ADD_POST,
      GET_ERRORS,
      GET_POSTS,
      GET_POST,
      POST_LOADING,
      DELETE_POST
    } from './types';
    ...
    ...
    // Clear errors
    export const clearErrors = () => {
      return {
        type: CLEAR_ERRORS
      };
    };
    ```

    and in `types`

    ```react
    export const CLEAR_ERRORS = 'CLEAR_ERRORS';
    ```

11. and now we want `addComment` and `addPost` in `postActions` to dispatch CLEAR_ERRORS before anything else

    ```react
    ..
    ...
    ...
    //Add Post
    export const addPost = postData => dispatch => {
      dispatch(clearErrors());
      axios
        .post('/api/posts', postData)
        .then(res =>
          dispatch({
            type: ADD_POST,
            payload: res.data
          })
        )
        .catch(err =>
          dispatch({
            type: GET_ERRORS,
            payload: err.res.data
          })
        );
    };
    
    ...
    
    //Add Comment
    export const addComment = (postId, commentData) => dispatch => {
      dispatch(clearErrors());
      axios
        .post(`/api/posts/comment/${postId}`, commentData)
        .then(res =>
          dispatch({
            type: GET_POST,
            payload: res.data
          })
        )
        .catch(err =>
          dispatch({
            type: GET_ERRORS,
            payload: err.response.data
          })
        );
    };
    ```

12. and now we want to bring this into the `errorReducer` so we can use this anywhere wih errors

    ```react
    import { GET_ERRORS, CLEAR_ERRORS } from '../actions/types';
    
    const initialState = {
      isAuthenticated: false,
      user: {}
    };
    
    export default function(state = initialState, action) {
      switch (action.type) {
        case GET_ERRORS:
          //the payload includes the errors object from the server in authActions
          return action.payload;
          //just return an empty object to clear the previous object
          case CLEAR_ERRORS:
          return {}
        default:
          return state;
      }
    }
    ```

13. So now, the errors disappear when I post a comment or a post

14. We are finished with the actual coding part now!



## Prepare & Deploy

1. we need to look at our config keys in `config/keys` because we do not want to push the actual database information, so we are going to create two new files in `config` called `keys_dev.js` and `keys_prod.js`

   `keys_devs.js`

   ```react
   //we do not want to push this file
   module.exports = {
       mongoURI:
         'mongodb://jinwoo:jinwoo1@ds117545.mlab.com:17545/react-social-network',
       secretOrKey: 'secret'
     };
   ```

   `keys_prod.js` this file has info that people won't be able to use

   ```react
   module.exports = {
       mongoURI:
         process.env.MONGO_URI,
       secretOrKey: process.env.SECRET_OR_KEY
     };
   ```

2. and we modify `keys` to choose which keys we want to push

   ```javascript
   if (process.env.NODE_ENV === 'production') {
     module.export = require('./keys_prod');
   } else {
     module.exports = require('./keys_dev');
   }
   ```

3. we don't want to include this file so go to root `.gitignore` and include keys_dev

   ```react
   /node_modules
   package-lock.json
   /config/keys_dev.js
   ```

