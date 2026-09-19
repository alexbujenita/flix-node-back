const { createApp } = require("./src/app");

const app = createApp();

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
