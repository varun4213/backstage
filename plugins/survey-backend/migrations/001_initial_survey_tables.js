exports.up = function(knex) {
  return knex.schema
    // Create surveys table
    .createTable('surveys', function(table) {
      table.uuid('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('ownerGroup');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
    })
    // Create questions table
    .createTable('questions', function(table) {
      table.uuid('id').primary();
      table.uuid('surveyId').references('id').inTable('surveys').onDelete('CASCADE');
      table.string('type').notNullable(); // 'text', 'rating', 'multiple-choice'
      table.string('label').notNullable();
      table.json('options'); // For multiple choice options
    })
    // Create responses table
    .createTable('responses', function(table) {
      table.uuid('id').primary();
      table.uuid('surveyId').references('id').inTable('surveys').onDelete('CASCADE');
      table.string('userRef').notNullable();
      table.json('answers').notNullable();
      table.timestamp('submittedAt').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('responses')
    .dropTableIfExists('questions')
    .dropTableIfExists('surveys');
};
