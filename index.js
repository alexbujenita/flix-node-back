const express = require("express");
const applyApi = require("./src/routes").applyApi;
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

applyApi(app);

app.get("/", (req, resp) => {
  resp.send("test");
});

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
