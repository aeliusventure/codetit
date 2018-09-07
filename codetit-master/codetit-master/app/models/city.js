exports.definition = {
    config: {
        columns: {
            "id": "text",
            "name": "text",
            "prefecture_id": "text",
            "seq_no": "integer"
        },
        adapter: {
            type: "sql",
            collection_name: "cities",
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
                        statement: 'SELECT * FROM cities where prefecture_id = ? ORDER BY id',
                        params: prefectureId
                    },
                });
            },
        });
    
        return Collection;
    }
};
