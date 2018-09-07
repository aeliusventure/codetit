exports.definition = {
    config: {
        columns: {
            "id": "integer",
            "middle_category_id": "integer",
            "name": "text"
        },
        adapter: {
            type: "sql",
            collection_name: "small_categories",
            idAttribute: "id",
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {
        });

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            fetchByMiddleCategory: function(middleCategoryId) {
                return this.fetch({
                    query: {
                        statement: 'SELECT * FROM small_categories where middle_category_id = ? ORDER BY id',
                        params: middleCategoryId
                    },
                });
            },
        });

        return Collection;
    }
};
