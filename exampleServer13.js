// Create a Server
var http = require('http');
var url = require('url');
var fs = require('fs');
var pg = require('pg');


// ******************************
// ****** INITIALIZATION ********
// ******************************

var conString = "postgres://localhost:5432/mailer13";
var db;

pg.connect(conString, function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }
  db = client;
});

// ******************************
// ******** END INIT ************
// ******************************

var server = http.createServer(function (request, response) {
// Specify what happens when we get a request to that server

	//When a request comes in...

	//Parse the request
	requestParse(request);
	secureRequest(request);

	//Figure out what the user wants based on the URL they requested
	var bodyHandler = router[request.parsedUrl.pathname];
	if (bodyHandler) {
		response.statusCode = 200;
		response.setHeader("Content-Type", "text/html");
		//Based on what they want, generate some body text
		bodyHandler(request, response, function(request, response) {
			response.end();
		});

		//Set the status of the response so we know whether or not we got the right thing, or an error
		
		//Send the response back
		console.log("Ended the response");
	} else {
		response.statusCode = 404;
		response.end("Oh no 404");
	}
	
});

server.listen(3000);
console.log("Listening on port 3000")

// ******************************
// ********* ROUTING ************
// ******************************

var router = {
	"/" : function(request, response, next) {
		response.write('Sign up for my awesome mailing list:<br> <form method="GET" action="/submit">Email: <input name="email" type="text"> <input type="submit"></form>');
		next(request, response);
	},
	"/users" : function (request, response, next) {
		showUsers(function(err, newUsers, oldUsers) {
			var newUserTable = generateUserTable(newUsers)
			var oldUserTable = generateUserTable(oldUsers)
			var body = "<strong>New Users</strong> " + newUserTable + "<br>";
			body += "<strong>Existing Users</strong> " + oldUserTable + "<br>";
			response.write(body);
			next(request, response);
		});
	},
	"/submit" : function (request, response, next) {
		var email = request.parsedUrl.query["email"];
		console.log("Saving user's email")
		saveUser(email, function(err, result) {
			if (err) {
				console.error(err);
				return;
			}
			console.log(result);
		});
		response.write("Thanks, " + email);
		next(request, response);
	}
}


// **************************************************
// ******************* END ROUTING ******************
// **************************************************

// ******************************************************
// ****************** TEMPLATES *************************
// ******************************************************
function generateUserTable(users) {
	var table = "<table>";
		table += "<tr>";
		table += "<td>email</td>";
		table += "<td>created</td>";
		table += "<td>last_email_sent</td>";
		table += "<td>sequence</td>";
		table += "</tr>";

	for (var i = 0; i < users.length; i++) {
		table += "<tr>"
		table += "<td> " + users[i].email + "</td>";
		table += "<td> " + users[i].created + "</td>";
		table += "<td> " + users[i].last_email_sent + "</td>";
		table += "<td> " + users[i].sequence + "</td>";
		table += "</tr>"
	}
	table += "</table>";
	return table;
}

// ******************************************************
// ****************** END TEMPLATES *********************
// ******************************************************


// ************************************************************
// ******************* DATA LAYER *****************************
// ************************************************************

function saveUser (email, callback) {
	if (email) {
	db.query('INSERT INTO users (email, created, sequence) VALUES ($1, NOW(), 0);', [email], function(err, result) {
	    if (err) {
	      callback(err, null);
	    }
	    callback(null, result.rows)
	  });
	} else {
		callback("No email specified", null);
	}
}

function showUsers (callback) {
	var newUsers;
	var oldUsers;

	db.query('SELECT email, created, last_email_sent, sequence FROM users WHERE sequence = 0;', [], function(err, result) {
	    if(err) {
	      callback(err, null);
	    }
	    newUsers = result.rows
	    sendCallback()
	});

	db.query('SELECT email, created, last_email_sent, sequence FROM users WHERE sequence != 0;', [], function(err, result) {
	    if(err) {
	      callback(err, null);
	    }
	    oldUsers = result.rows
	    sendCallback()
	});
	function sendCallback () {
		if (newUsers && oldUsers) {
			callback(null, newUsers, oldUsers);
		}
	}
}

var secureRequest = function(request) {
	//do something here
};
var requestParse = function(request) {
	console.log(request.url);
	request.parsedUrl = url.parse(request.url, true);
};

