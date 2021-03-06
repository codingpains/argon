var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    server = http.createServer(),
    qs = require('querystring');

var app = {
    '/' : {
        'GET' : function(req, res){
            var content = {data : 'hi im just the root do something else please'};
            respondWith(res, JSON.stringify(content));
        }
    },

    '/spec/array.js' : {
        'GET' : function(req, res) {
            var content = [1,2,3,4,5,6];
            respondWith(res, JSON.stringify(content));
        },

        'POST' : function(req, res) {
            debugger;
            req.data = JSON.parse(JSON.stringify(req.data));
            var content = [1,2,3,4,5,6];
            if(req.data.valid === false) {
              content = {error : "Invalid Data"};
              res.writeHead(422, {"Content-Type": "text/json"});
            } else {
              res.writeHead(200, {'Content-Type': 'text/javascript'});
            }

            respondWith(res, JSON.stringify(content));
        },

        'PUT' : function(req, res) {
            req.data = JSON.parse(JSON.stringify(req.data));
            var content = [1,2,3,4,5,6];
            if(req.data.valid === false) {
              content = {error : "Invalid Data"};
              res.writeHead(422, {"Content-Type": "text/json"});
            } else {
              res.writeHead(200, {'Content-Type': 'text/javascript'});
            }
            respondWith(res, JSON.stringify(content));
        },

        'DELETE' : function(req, res) {
            var content = [1,2,3,4,5,6];
            respondWith(res, JSON.stringify(content));
        }
    },

	'/spec/request_with_params.js' : {
		'GET' : function(req, res) {
			var expected = JSON.stringify({id:1, query: {first_name:"John", last_name:"Doe"}});
			console.log('ASDADASDASDASD!')
			if (JSON.stringify(req.data) === expected){
				res.writeHead(200, {'Content-Type': 'text/javascript'});
			} else {
				res.writeHead(422, {"Content-Type":"text/json"});
			}
			respondWith(res, expected);
		}
	}
};

var processRequest = function(req, res) {
    console.log('\n');
    console.log('request recieved:');
    console.log('--------------------------------------');
    console.log(new Date());
    console.log('request headers', req.headers);
    console.log('requested url', req.url);
    console.log('request method', req.method);
    console.log('--------------------------------------');

    var data = '';

    req.on("data", function(chunk) {
        console.log('data recieved');
        data += chunk;
    });

    req.on("end", function() {
        console.log("raw: " + data);

        if (typeof data == 'string' && data.length >= 2) {
         req.data = JSON.parse(data);
        }
        else {
            req.data = {};
        }

        console.log("json: " + JSON.stringify(req.data));

        if(app[req.url] && app[req.url][req.method]){
            app[req.url][req.method](req, res);
            return;
        }

    });

    var uri      = url.parse(req.url).pathname,
        filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
        if(!exists) {

            if(app[req.url] && app[req.url][req.method]){
                app[req.url][req.method](req, res);
                return;
            }

            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not Found\n");
            res.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return;
            }

            res.writeHead(200);
            res.write(file, "binary");
            res.end();
        });
    });
};

var respondWith = function(res, content){
    res.write(content);

    console.log('--------------------------------------')
    console.log(res._header)
    console.log(content);

    res.end();
};

server.on('request', processRequest);
server.listen(4040);

console.log('Server running on port:4000');
console.log('waiting...');

