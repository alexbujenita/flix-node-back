const { pingRouter } = require('./ping');

const applyApi = app => {
  const routes = {
    '/status': pingRouter
  };

  const paths = Object.keys(routes);

  paths.forEach(path => {
    app.use(path, routes[path]);
  });
}

exports.applyApi = applyApi;