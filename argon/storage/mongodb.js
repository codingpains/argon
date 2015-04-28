Class(Argon.Storage, 'MongoDB')({
    
    prototype : {
        
        driver : null,
        collectionName : null,
        collection : null,

        preprocessors : [],
        processors : [],

        init : function init(config) {
            if(this.preprocessors instanceof Array === false){
                this.preprocessors = [].concat(this.constructor.preprocessors);
            }

            if(this.preprocessors instanceof Array === false){
                this.preprocessors = [].concat(this.constructor.preprocessors);
            }

            this.driver = config.driver;
            this.collectionName = config.collectionName;
            this.collection = this.driver.collection(this.collectionName);

            return this;
        },

        create : function create(requestObj, callback) {
            var storage = this,
                i;

            for (i = 0; i < this.preprocessors.length; i++) {
                requestObj.data = this.preprocessors[i](requestObj.data, requestObj);
            }

            this.collection.insert(requestObj.data, function (error, data) {
                var j;
                if (error) {
                    callback(error);
                }
                else {
                    data = data[0];
                
                    for (j = 0; j < storage.processors.length; j += 1) {
                        data = storage.processors[j](data, requestObj);
                    }

                    callback(data);
                }
            });

            return this;
        },

        update : function update(requestObj, callback) {
            var i,
                query = {
                    _id : requestObj.data.id
                };

            for (i = 0; i < this.preprocessors.length; i += 1) {
                requestObj.data = this.preprocessors[i](requestObj.data, requestObj);
            }

            this.collection.update(query, requestObj.data, function (error, data) {
                callback(error || data);
            });

            return this;
        },

        find : function find(requestObj, callback) {
            this.collection.find().toArray(function (error, data) {
                var result;

                if (error) {
                    callback(error);
                }
                else {
                    result = data.map(function (item) {
                        return new requestObj.model(item);
                    });
                    callback(result)
                }
            });

            return this;
        },

        findOne : function findOne(requestObj, callback) {
            var query = {
                _id : requestObj.data.id
            }

            this.collection.find(query, function (error, docs) {
                var modelInstance;

                if (error) {
                    callback(error);
                }
                else {
                    modelInstance = new requestObj.model(docs[0]);
                    callback(modelInstance);
                }
            });

            return this;
        },

        search : function search(requestObj, callback) {
            var result;

            this.collection.find(requestObj.query, function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    data.toArray(function (error, docs) {
                        if (error) {
                            callback(error);
                        }
                        else {
                            result = docs.map(function (doc) {
                                return new requestObj.model(doc);
                            });
                            callback(result);
                        }
                    });
                }
            });

            return this;
        },

        remove : function remove(requestObj, callback) {
            var query = {
                _id : requestObj.data.id
            };

            this.collection.remove(query, function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(data);
                }
            });

            return this;
        }
    }
});