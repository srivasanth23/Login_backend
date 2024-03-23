const path = require('path');
const sqlite3 = require('sqlite3');
const express = require("express");
const {open} = require('sqlite');
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

// API
app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const query = `select * from user where username = '${username}' and password = '${password}'`;
    const dbUser = await db.get(query);

    if (dbUser === undefined) {
        if(password.length > 5){
            const query = `insert into user (username, password) values ('${username}', '${password}')`;
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

app.get("/", async (req,res) => {
    const query = `select * from user`;
    const dbUser = await db.all(query);
    res.send(dbUser);

})
module.exports = app;