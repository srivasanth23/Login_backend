const path = require('path');
const sqlite3 = require('sqlite3');
const express = require("express");
const {open} = require('sqlite');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const app = express();

const dbPath = path.join(__dirname, "login.db");
let db = null;
app.use(express.json());

//for creating a table
//const db = new sqlite3.Database("./database_name.db", sqlite3.OPEN_READWRITE, (err) => {if (err) return console.error(err.message);});
//db.run(`CREATE TABLE user (username TEXT, password TEXT)`);


// Database Connection
const Connection = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, () => {
            console.log('Server started');
        });
    } catch (error) {
        console.log(`error message : ${error.message}`);
    }
}

Connection();


const authenticationToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
  
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username;
          console.log(payload, "u");
          next();
        }
      });
    }
  };
  
// API
app.post("/register", async (request, response) => {
    const { username, password } = request.body;
    const query = `select * from user where username = '${username}' and password = '${password}'`;
    const dbUser = await db.get(query);

    if (dbUser === undefined) {
        if(password.length > 5){
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = `insert into user (username, password) values ('${username}', '${hashedPassword}')`;
            await db.run(query);
            response.send("User created successfully");
        } else {
            response.status(400);
            response.send("Password is too short");
        }
    }else{
        response.send("User already exists");
        response.status(400);
    }
})


app.post("/login/", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
  
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        const payload = {
          username: username,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        response.send({ jwtToken });
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
});


app.get("/", async (req,res) => {
    const query = `select * from user`;
    const dbUser = await db.all(query);
    res.send(dbUser);

})
module.exports = app;