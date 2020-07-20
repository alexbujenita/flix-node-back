# MyFlix Backend
A backend for retrieving films, saving them with personal content and with the possibility of having users.

## Installation
Clone the repo and:
```bash
$ npm install
```
Also you'll need sequelize-cli installed globally:
```bash
$ npm install -g sequelize-cli
```
The first thing is to run the migration with Sequelize:
```bash
$ sequelize-cli db:migrate
```
Then create a file used for the secret keys:
```bash
$ touch secrets.js
```
and populate like this:
```javascript
exports.API_KEY = "YOUR_TMDB_API_KEY";
exports.PRIVATE_KEY = "A RANDOM KEY TO SIGN THE JWT";
```
Finally you can run the server by:
```bash
$ npm start
```