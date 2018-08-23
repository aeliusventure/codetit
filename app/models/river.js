exports.definition = {
    config: {
        columns: {
            "id": "text",
            "degree": "integer",
            "name": "text",
            "basin_id": "text",
            "lat": "numeric",
            "lng": "numeric",
            "prefecture_id": "text",
            "zoom": "integer",
            "first_river_no": "integer",
            "river_id": "text"
        },
        adapter: {
            type: "sql",
            collection_name: "rivers",
            idAttribute: "id",
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {
            // extended functions and properties go here
        });

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            fetchByPrefecture: function(prefectureId) {
                return this.fetch({
                    query: {
                        statement: 'SELECT * FROM rivers where prefecture_id = ? ORDER BY id',
                        params: prefectureId
                    },
                });
            },
        });

        return Collection;
    }
};
