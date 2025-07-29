exports.up = function(knex) {
  return knex.schema.table('surveys', function(table) {
    table.json('templates');
  });
};

exports.down = function(knex) {
  return knex.schema.table('surveys', function(table) {
    table.dropColumn('templates');
  });
};
