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

## Auth middleware

~~Checks the presence of the auth headers and tries to decode it, if successful 
create a property on the req object with the actual user ID, if not return a 401.`~~

Almost, now it checks the presence of the cookie.

## Routes breakdown

### Auth

#### Signing up

The route accepts a POST request with the body containing the first name, last name (the only optional field), a unique email address and a password, that will be hashed when saving it to the DB. It either responds with 201 if successful or a 500 status code if errors were encountered.

#### Signing in

The route accepts a POST request with the body containing the unique email address and the password. It finds the user by email and compares the hashed password with the received one, if successful it creates a JWT to be sent back to the client, if something doesn't match it send a 401 and if anything else goes wring a 404 status code.

#### Logout
A DELETE request to the route will delete the specified cookie/s.
### Actor movies

Accepts a GET request with the actor's ID in the params, it then goes through all the existing pages and builds a list with all of the actor's films. In case of error return 501.

### Actor Info

Accepts a GET request with the actor's ID in the params, it return an object with
the actor's info, such as name.
### Movie

Accepts a GET request with the film's ID in the params, retrieves it and before sending it back to the client it caches it in a Map for future use. In case of error return 404.

### Movie credits

Accepts a GET request with the film's ID in the params, retrieves its credits and before sending it back to the client it caches it in a Map for future use. In case of error return 404.

### Movies

Accepts a GET request with an optional query &page=INT, and retrieves the films from TMDB sorted by popularity.

### Movie trailer

Accepts a GET request with the film's ID in the params, retrieves its trailer/s and before sending it back to the client it caches it in a Map for future use. In case of error return 404.

### Ping

A health check route. Responds to GET request to which, if alive, returns a 200 status code.

### Random

Accepts a GET request, and returns a random list of films. If it enters an infinite loop there is a fail safe mechanism to break out of it and return a 501 status code.

### Search

Accepts a GET request with two optional queries &pageNum=INT and &includeAdult=STRING and the search term. If successful returns the films found otherwise 501.

### User favs

#### This route uses the auth middleware.

##### GET

Return the user with it's favs.

##### POST

Providing all the required info it create a new UserFavourite with the user requesting it as the owner.

##### PATCH

Modifies the UserFavourite entry either with the boolean 'seen' and 'watchlist' or the string 'description', also it accepts a 'rating' property.

##### DELETE

Removes the UserFavourite entry of the requesting user.
