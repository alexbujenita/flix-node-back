const express = require('express');
const applyApi = require('./src/routes').applyApi;
const API_KEY = require('./secrets').API_KEY;


const app = express();
applyApi(app);

app.get('/', (req, resp) => {
  resp.send('test')
})


app.listen(3001, () => {
  console.log('Server started on port 3001')
})