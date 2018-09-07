var insertSql =
"INSERT INTO `middle_categories` (`id`, `name`) " +
"VALUES " +
    "(1, '破片/かけら類'), " +
    "(2, 'タバコ'), " +
    "(3, '飲料'), " +
    "(4, '食品'), " +
    "(5, '農業'), " +
    "(6, '医療・衛生'), " +
    "(7, '生活・レクリエーション'), " +
    "(8, '衣料品'), " +
    "(9, '大型粗大ゴミ'), " +
    "(10, '物流'), " +
    "(11, '建築'), " +
    "(12, '特殊'), " +
    "(13, '海・河川・湖沼'), " +
    "(14, 'その他'); ";

migration.up = function(migrator) {
    migrator.createTable({
        columns: {
            "id": "integer",
            "name": "text"
        },
    });

    migrator.db.execute(insertSql);
};

migration.down = function(migrator) {
    migrator.dropTable();
};
