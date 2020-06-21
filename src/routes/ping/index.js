const pingRouter = require('express').Router();

pingRouter.get('/', (req, resp) => {
    resp.status(200).send('OK');
});

exports.pingRouter = pingRouter;