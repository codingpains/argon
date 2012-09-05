/**
A synchronous variation from the original asynchronous variation of Model.
Models include Events and Validations. All packaged in a module you can include
on your objects.
@module SyncModel
@namespace Argon
@includes CustomEventSupport
@includes ValidationSupport
**/
Module(Argon, 'SyncDaemonModel').includes(CustomEventSupport, ValidationSupport)({
    
    /**
    Contains the instance of the storage adapter for the model
    This property must be set when creating the model
    @property storage <public> [Storage] (null)
    **/
    storage : null,
    
    /**
    Contains the caching data for the model
    @property _cache <private> [Object] ({})
    **/
    _cache  : {},
    
    /**
    Configures the caching expire times
    By default this are cached forever, so the possible values for this is:
    null cache forever
    Number (milliseconds) the time to live for the caching key
    @property _cacheTimeToLive <private> [Object] ({all:null,instance:null})
    **/
    _cacheTimeToLive : {
        all      : null,
        instance : null
    },
    
    /**
    Builds a new instance of Argon Model and saves to storage.
    @method create <public, static>
    @argument data <required> [Object] the attributes of the model.
    @return [Argon.Model]
    **/
    create  : function (data) {
        this.dispatch('beforeCreate');
        model = new this(data);
        var result = model.save();
        this.dispatch('afterSave');
        return result;
    },
    
    /**
    Builds a new instance of Argon Model from storage.
    @method read <public, static>
    @argument query <required> [Object] conditions to match.
    @return [Argon.Model]
    **/
    read    : function (query) {
        var data, Model;
        query = query || {};

        Model = this;

        this.dispatch('beforeRead');

        query.className = this.className;

        var result = this.storage.get(query);
        this.dispatch('afterRead');

        return result;
    },
    
    /**
    Tells if the given cache key is present in the cache object.
    @method isCached <public, static>
    @argument key <required> [String] key to look for.
    @return [Boolean].
    **/
    isCached : function (key) {
        return this._cache.hasOwnProperty(key) && this._cache[key].data != 'undefined';
    },
    
    /**
    Tells if the given cache key is already expired.
    @method isCacheExpired <public, static>
    @argument key <required> [String] key to look for.
    @argument timeKey <required> [String] time key to look for.
    @return [Boolean].
    **/
    isCacheExpired : function(key, timeKey) {
        if (this._cacheTimeToLive.hasOwnProperty(timeKey)) {
            return this._cacheTimeToLive[timeKey] !== null && ((new Date() - this._cache[key].cachedAt) > this._cacheTimeToLive[timeKey]);
        }
        return false;
    },
    
    /**
    Fetches all records of a given Model and creates the instances.
    @method all <public, static>
    @return [Argon.Model].
    **/
    all : function () {
        var Model, data;
        
        Model = this;

        if( this.isCached('all') && !this.isCacheExpired('all', 'all') ) {
            data = this._cache.all.data;
        } else {
            data = this.read({});
            Model._cache.all = {
                cachedAt : (new Date()),
                data     : data
            };
        }
        
        return data;
    },
    
    /**
    Fetches one record of a given Model and creates the instance.
    @method find <public, static>
    @argument id <required> [Object] the id of the record.
    @return [Argon.Model].
    **/
    find : function (id) {
        var key = 'find_' + id.toString();
        var data;
        if (this.isCached(key) && !this.isCacheExpired(key,'instance')) {
            data = this._cache[key].data;
        } else {
            data = this.read({conditions : {id : id}});
            this._cache[key] = { data : data, cachedAt : (new Date())};
        }

        return data;
    },
    
    /**
    Fetches one record of a given Model and creates the instance.
    @method findBy <public, static>
    @argument attribute <required> [String] the attribute to match.
    @argument value <required> [String] the value to match in the attribute.
    @return [Argon.Model].
    **/
    findBy : function (property, value) {
        var customConditions, key, data;
        customConditions = {};
        customConditions[property] = value;
        key = 'findBy_' + property + '_' + value;

        if (this.isCached(key) && !this.isCacheExpired(key,'instance')) {
            data = this._cache[key].data;
        } else {
            data = this.read({conditions : customConditions});
            this._cache[key] = { data : data, cachedAt : (new Date())};
        }
        return data;
    },
    
    prototype : {
        /**
        Contain the errors for the model instance
        @property errors <public> [Array] ([])
        **/
        errors           : [],

        /**
        Contains the properties of the record that this instance represents
        @property properties <public> [Object] ({})
        **/
        properties       : {},
        
        /**
        Object initializer, this method server as the real constructor
        @method init <public>
        @argument properties <optional> [Object] ({}) the attributes for the model isntance
        **/
        init             : function (properties) {
            var property;

            this.eventListeners = [];

            for (property in properties) {
                if (properties.hasOwnProperty(property)) {
                    this[property] = properties[property];
                }
            }

            return this;
        },
        
        /**
        Exposes the value of a property.
        @method getProperty <public>
        @argument property <required> [String] the property to expose.
        @return [Object] the property value.
        **/
        getProperty      : function (property) {
          return this[property];
        },
        
        /**
        Sets the value of a property.
        @method setProperty <public>
        @argument property <required> [String] the property to write.
        @argument newValue <required> [String] the value for the property.
        @return [Object] instance of the model.
        **/
        setProperty      : function (property, newValue) {
            var originalValue;

            if (newValue != originalValue) {
                originalValue = this[property];
                this[property] = newValue;

                this.dispatch('change:' + property, {
                    originalValue : originalValue,
                    newValue      : newValue
                });
            }

            return this;
        },
        
        /**
        Sets the value of a group of properties.
        @method updateProperties <public>
        @argument properties <required> [Object] the properties collection to write.
        @return [Object] instance of the model.
        **/
        updateProperties : function (properties) {
            var property;

            for (property in properties) {
                if (properties.hasOwnProperty(property)) {
                    this.setProperty(property, properties[property]);
                }
            }

            return this;
        },
        
        /**
        Saves the model to storage.
        @method save <public>
        @return Noting.
        **/
        save             : function () {
            var model;

            model = this;

            this.dispatch('beforeSave');
            if (!this.isValid()) {
                return model;
            }

            if (this.hasOwnProperty('id') && this.id !== '') {
                //this.constructor.storage.put(this);
                this.id = this._generateUid(24); 
                SyncDaemon.push(this);
                model.dispatch('afterSave');
            }
            else {
                this.constructor.storage.post(this);
                SyncDaemon.push(this);
                model.dispatch('afterSave');
            }

            return this;
        },
        
        /**
        Removes a record from storage.
        @method destroy <public>
        @return Noting.
        **/
        destroy          : function () {
            var model = this;
            this.dispatch('beforeDestroy');

            //this.constructor.storage.remove({
            //    conditions : { id : this.getProperty('id') }
            //});
            //model.setProperty('id', null);

            SyncDaemon.push(this);
            model.dispatch('afterDestroy');
            return null;
        },

        /**
        Generates a hexadecimal hash-like string based on Math.random.
        
        Declaration notice. This abstraction may seem a lil weird because codes could be part of the class
        but this way you dont have to pollute the class with the implementation of the generation algorithm.
        
        The math trick to get integers was taken from 
        https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Math/random#Example.3a_Using_Math.random
        
        @method _generateUid <private>
        @argument length <required> [Number] (32) The length of the generated string
        @return [String]
        **/
        _generateUid : (function () {
            var getUid = function(length){
                var i, uid, min, max;
                
                length = length || 32;
                uid = '';
                min = 0;
                max = 14;
                for(i = 0; i < length; i++){
                    uid += getUid.codes[ Math.floor(Math.random() * (max - min + 1)) + min ];
                }
                return uid;
            };

            getUid.codes  = [0, 1, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'];
            
            return getUid;
        }())
        
    }
});


