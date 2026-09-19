const path = require("path");
const Sequelize = require("sequelize");
const { Umzug, memoryStorage } = require("umzug");

async function migrate(sequelize) {
  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, "../../migrations/*.js"),
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);

        return {
          name,
          up: async () => migration.up(context, Sequelize),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: memoryStorage(),
    logger: undefined,
  });

  return umzug.up();
}

async function truncateAll(db) {
  const storage =
    db.sequelize.options.storage ?? db.sequelize.config.storage;

  if (process.env.NODE_ENV !== "test" || storage !== ":memory:") {
    throw new Error(
      "Refusing to truncate unless NODE_ENV is test and storage is :memory:"
    );
  }

  await db.UserFavourite.destroy({ where: {} });
  await db.User.destroy({ where: {} });
}

exports.migrate = migrate;
exports.truncateAll = truncateAll;
