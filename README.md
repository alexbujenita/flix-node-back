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

## Validation

Run ESLint across the backend with:

```bash
$ npm run lint
```

## Formatting

Prettier is configured in `.prettierrc.json`, with exclusions in `.prettierignore`.
Both scripts cover the whole repo, including the `test/` suite. Recorded TMDB
fixtures are excluded, since they are generated API dumps.

Format everything in place:

```bash
$ npm run format
```

Check formatting without writing (useful in CI):

```bash
$ npm run format:check
```

## Testing

Run the whole suite:

```bash
$ npm test
```

Or one project at a time:

```bash
$ npm run test:unit
$ npm run test:integration
```

Tests don't need a `secrets.js` file. The test setup injects `API_KEY` and
`PRIVATE_KEY` as environment variables, so you can clone and run the suite
without any local secrets.

### Recording fixtures

```bash
$ npm run fixtures:record
```

This hits the real TMDB API, so it needs a valid TMDB key in the environment.

Status: fixture recording can't complete right now. The recorder looks for a
pair of actor discover pages that naturally overlap, and no such pair was found
in the TMDB data we sampled. As a documented interim substitution, tests 20, 21
and 29-31 use synthetic data served through `nock`, shaped like real TMDB
responses. These should be swapped for real fixtures once recording works.

### TODO

Some tests fail on purpose. They pin down bugs that are still in the codebase:

- IDOR in `userFavs`: a user can read and modify another user's
  favourites. This is a live security issue and it's still unfixed. Treat it as
  the priority.
- `signUp` returns an HTML error page instead of JSON when bcrypt
  throws.
- `search` throws a `TypeError` on certain inputs.
- the recommendation route answers 204 where it should answer 404.
- `userFavs` uses a truthy check on the limit value, so a limit of 0
  is ignored.
- the PDF response is missing its `content-type` header.
- `search` doesn't encode the search term into the URL properly.

B5 and B8 are missing from that list on purpose. Both were investigated and
turned out not to be bugs, and the original numbering was kept so the notes and
test names still line up.

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

OR

```
"/:movieId/:movieResource"
```

Which can query a similar movie by sending an ID, or by sending a string that can't be
parsed to an INT you could get other resources, comments in the file.

### Movie credits

Accepts a GET request with the film's ID in the params, retrieves its credits and before sending it back to the client it caches it in a Map for future use. In case of error return 404.

### Movies

Accepts a GET request with an optional query &page=INT, and retrieves the films from TMDB sorted by popularity.

### Movie trailer

Accepts a GET request with the film's ID in the params, retrieves its trailer/s and before sending it back to the client it caches it in a Map for future use. In case of error return 404.

### Ping

A health check route. Responds to GET request to which, if alive, returns a 200 status code.

### Random

Accepts a GET request, and returns a random list of films. If it enters an infinite loop there is a fail safe mechanism to break out of it and return the list.

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
