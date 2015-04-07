var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(process.env['MANDRILL_API_KEY']);
var pg = require('pg');

console.log("Mailer running with API Key: ", process.env['MANDRILL_API_KEY']);

var conString = process.env["DATABASE_URL"];


/// connect to the database and send mail
pg.connect(conString, function(err, db, done) {
	if(err) {
		return console.error('error fetching client from pool', err);
	}
  	// Get all the sequence 0 people
	var message = getMessageForSequenceNumber(0);

	db.query('SELECT email FROM users WHERE sequence = 0;', [], function(err, result) {
	    if(err) {
	      console.log(err);
	    }
	    sendMailToUsers(result.rows, message, function(result) {
	    	for (var i = 0; i < result.length; i++) {
	    		if (result[i].status == "queued"){
	    			db.query("UPDATE users SET sequence = 1, last_email_sent = NOW() WHERE email = $1", [result[i].email])
	    		}
	    	};
	    	
	    });
	});

});


function getMessageForSequenceNumber(seqNumber) {
	var message = {
	    "html": "<p>Real Email Info</p>",
	    "subject": "Some actual subject",
	    "from_email": "liz@tradecrafted.com",
	    "from_name": "lizTheEmailer"
	};
	return message
}



function sendMailToUsers(users, message, callback) {
	//set users to send to
	message.to = users;

	var async = true;
	mandrill_client.messages.send({"message": message, "async": async}, function(result) {
	    console.log(result);

	    callback(result);
	    /*
	    [{
	            "email": "recipient.email@example.com",
	            "status": "sent",
	            "reject_reason": "hard-bounce",
	            "_id": "abc123abc123abc123abc123abc123"
	        }]
	    */
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	});

}