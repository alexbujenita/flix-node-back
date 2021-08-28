const tableName = "UserFavourites";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex(tableName, {
      fields: ["movieTitle"],
    });

    await queryInterface.addIndex(tableName, {
      fields: ["movieRefId"],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex(tableName, {
      fields: ["movieTitle"],
    });

    await queryInterface.removeIndex(tableName, {
      fields: ["movieRefId"],
    });
  },
};
