migration.up = function(migrator) {
    migrator.createTable({
        columns: {
            "local_id": "integer primary key autoincrement",
            "id": "integer",
            "lat": "numeric",
            "lng": "numeric",
            "prefecture_id": "text",
            "city_id": "text",
            "river_id": "text",
            "searched_at": "text",
            "garbage_type": "integer",
            "garbage_density": "numeric",
            "garbage_dengared": "text",
            "time_thrown_away": "integer",
            "which_river_side": "integer",
            "searched_length": "integer",
            "comment": "text",
            "has_removed": "integer",
            "image1": "text",
            "image2": "text",
            "image3": "text",
            "image4": "text",
            "name": "text",             // 使ってないけどサーバーにあるので念のため
            "garbage_level": "integer", // 使ってないけどサーバーにあるので念のため
            "area_id": "integer",       // 使ってないけどサーバーにあるので念のため
            "prog_type": "integer",     // 使ってないけどサーバーにあるので念のため
            "created_at": "text",
            "updated_at": "text",
            "garbage_dumps_small_categories": "text",
        },
    });
};

migration.down = function(migrator) {
    migrator.dropTable();
};
