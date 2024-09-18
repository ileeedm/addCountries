import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "159357",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = []

let users = [];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = ($1)",[currentUserId[0]]);
  const color = await db.query("SELECT color FROM users WHERE id = ($1)",[currentUserId[0]]);
  let countries = [];
  let userColor = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  color.rows.forEach((colour) => {
    userColor.push(colour.color);
  });
  
  return {countries:countries,
          userColor:userColor
        }
}
app.get("/", async (req, res) => {
  users = []
  const allUsers = await db.query("SELECT * FROM users ");
  allUsers.rows.forEach((user) =>{
    users.push(user)
 })
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries.countries,
    total: countries.countries.length,
    users: users,
    color: countries.userColor,
  });

});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect('/')
    }
  } catch (err) {
    console.log(err);
    res.redirect('/')
  }
});

app.post("/user", async (req, res) => {

const add = req.body.add
const input = req.body.user;
currentUserId = input
console.log(add)

if(add === 'new'){
  currentUserId = []
  res.render('new.ejs')
}
else if (input) {
  res.redirect('/')
}

});


app.post("/new", async (req, res) => {
 
  const name = req.body.name
  const color = req.body.color
  console.log(name)
  console.log(color)
  await db.query("INSERT INTO users (name,color) VALUES ($1,$2)",
  [name,color]
  );
  res.redirect('/')
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
