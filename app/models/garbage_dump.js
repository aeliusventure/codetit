exports.definition = {
    config: {
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
            "garbage_dengared": "integer",
            "time_thrown_away": "integer",
            "which_river_side": "integer",
            "searched_length": "integer",
            "comment": "text",
            "has_removed": "integer",
            "image1": "text",
            "image2": "text",
            "image3": "text",
            "image4": "text",
            "name": "text",
            "garbage_level": "integer", // 使ってないけどサーバーにあるので念のため
            "area_id": "integer",       // 使ってないけどサーバーにあるので念のため
            "prog_type": "integer",     // 使ってないけどサーバーにあるので念のため
            "created_at": "text",
            "updated_at": "text",
            "garbage_dumps_small_categories": "text",
        },
        adapter: {
            type: "sql",
            collection_name: "garbage_dumps",
            idAttribute: "local_id",
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {
            validate: function (attrs) {
                for (var key in attrs) {
                    var value = attrs[key];
                    if (key === 'lat') {
                        if (!value) return '位置情報が取得できませんでした';
                    }
                    if (key === 'lng') {
                        if (!value) return '位置情報が取得できませんでした';
                    }
                    // if (key === 'prefecture_id') {
                    //     if (!value) return '都道府県を選択してください';
                    // }
                    // if (key === 'city_id') {
                    //     if (!value) return '場所を選択してください';
                    // }
                    // if (key === 'river_id') {
                    //     if (!value) return '河川を選択してください';
                    // }
                    // if (key === 'searched_at') {
                    //     if (!value) return '調査日を選択してください';
                    // }
                    if (key === 'garbage_type') {
                        if (!value) return 'ごみの種別を選択してください';
                    }
                    if (key === 'garbage_density') {
                        if (value < 0) return 'ごみのランクを選択してください';
                    }
                    if (key === 'searched_length') {
                        if (value && !Alloy.Globals.Util.isInteger(value)) {
                            return '調査地点が代表する距離は数値で入力してください';
                        }
                    }
                }
            },
        });

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            destroyDuplicate: function(id) {
                this.fetch({
                    query: {
                        statement: 'SELECT * FROM garbage_dumps where id = ?',
                        params: id
                    },
                });
                this.each(function(m) {
                    m.destroy();
                });
            },
        });

        return Collection;
    }
};
