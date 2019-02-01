const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

// Load User Model
const User = require("../../models/User");

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get("/test", (req, res) => res.json({ msg: "Users Works Fine" }));

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
  //use mongoose to first find if email exists (line 4 Load User Model)
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size
        r: "pg", //Rating
        d: "mm" //default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

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
  });
});

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
    });
  });
});

module.exports = router;
