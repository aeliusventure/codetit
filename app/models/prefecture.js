exports.definition = {
    config: {
        columns: {
            "id": "text",
            "name": "text",
            "district_id": "text",
            "seq_no": "integer",
            "lat": "numeric",
            "lng": "numeric",
            "zoom": "integer"
        },
        adapter: {
            type: "sql",
            collection_name: "prefectures",
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
            // extended functions and properties go here
        });

        return Collection;
    }
};
