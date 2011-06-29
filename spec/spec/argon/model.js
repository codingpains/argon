Te.suite('Model')(function(){
    this.beforeEach(function(){
        this.registry.ExampleModel = Class().includes(Argon.Model)({
            storage : (new Argon.Storage.Local())
        });

        this.registry.ExampleModel.className = 'ExampleModel';
    });

    this.specify('Model inherit from Argon.Model')(function(){
        this.assert(this.registry.ExampleModel.__includedModules.indexOf(Argon.Model)).toBeGreaterThan(-1);
        this.completed();
    });

    this.specify('has a storage mechanism')(function(){
        this.assert(this.registry.ExampleModel.storage).toBeTruthy();
        this.completed();
    });
    
    this.specify('every model must have a spearate instance of storage')(function(){
        var Model1, Model2;
        
        Model1 = this.registry.ExampleModel;
        Model2 = Class().includes(Argon.Model)({
            storage : (new Argon.Storage.Local())
        });

        this.registry.ExampleModel.className = 'Model2';
        
        this.assert(Model1.storage).not().toBe(Model2.storage);
        this.completed();
    });
    
    this.describe('Model operations')(function(){
        
        this.beforeEach(function(){
            this.registry.exampleModel  = new this.registry.ExampleModel({
                data : 'some data'
            });
        });
        
        this.describe('reading data from storage')(function(){
            
            this.beforeEach(function(){
                this.registry.ExampleModel.storage.storage = {
                    'asddsgasd' : {id : 'asddsgasd', data : 1},
                    'asdxsgasd' : {id : 'asdxsgasd', data : 2},
                    'avfskgasd' : {id : 'avfskgasd', data : 3},
                    'w29xsgasd' : {id : 'w29xsgasd', data : 4}
                };
            });
            
            this.afterEach(function(){
                Argon.Storage.Local.storage = {};
            });
            
            this.specify('retrieve all data for the model')(function(spec){
                this.registry.ExampleModel.read({}, function(data){
                    spec.assert(data).toBeInstanceOf(Array);
                    spec.assert(data.length).toBeGreaterThan(0);
                    spec.completed();
                });
            });
            
            this.specify('retrieve data with a query')(function(spec) {
                this.registry.ExampleModel.read({conditions : {id : 'avfskgasd'}}, function(data) {
                    spec.assert(data.length).toBeGreaterThan(0);
                    spec.assert(data[0].data).toEqual(3);
                    spec.completed();
                });
            });
        });

        this.describe('saving data with the model')(function(){

            this.specify('saves reccord to storage')(function(spec){

                this.registry.exampleModel.save(function(data){
                    spec.assert(data.id).toBeTruthy();
                    spec.completed();
                });

            });

            this.specify('saves modifications to storage')(function(spec){
                var em, ExampleModel;

                em           = this.registry.exampleModel;
                ExampleModel = this.registry.ExampleModel;


                em.save(function(data){
                    em.x = 2;
                    em.save(function(){
                        ExampleModel.read({}, function(examples){
                            spec.assert(examples[0].x).toEqual(2);
                            spec.completed();
                        });
                    });
                });

            });

            this.specify('saves modifications to storage')(function(spec){
                var em, ExampleModel;

                em           = this.registry.exampleModel;
                ExampleModel = this.registry.ExampleModel;

                em.save(function(data){
                    em.x = 2;
                    em.save(function(){
                        ExampleModel.read({}, function(examples){
                            spec.assert(examples[0].x).toEqual(2);
                            spec.completed();
                        });
                    });
                });
            });

            this.specify('destroy removes the instance from storage')(function(spec){
                var em, ExampleModel;

                em           = this.registry.exampleModel;
                ExampleModel = this.registry.ExampleModel;

                em.save(function(){
                    em.destroy(function(){
                        ExampleModel.read({},function(data){
                            spec.assert(data.length).toEqual(0);
                            spec.completed();
                        });
                    });
                });

            });
            
        });
        
        this.describe('Model event system')(function(){
            
            this.specify('BeforeRead event')(function(spec){
                var executedEvent;
                
                executedEvent = false;
                
                this.registry.ExampleModel.bind('beforeRead', function(){
                   executedEvent = true; 
                });
                
                this.registry.ExampleModel.read({}, function(){
                    spec.assert(executedEvent).toBe(true);
                    spec.completed();
                });
            });
        });
    });
});