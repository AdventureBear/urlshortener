/**
 * Created by suzanne on 10/18/16.
 */

//  User Story: I can pass a URL as a parameter
//  and I will receive a shortened URL in the JSON response.
//
//  User Story: If I pass an invalid URL that doesn't follow
//  the valid http://www.example.com format, the JSON response
//  will contain an error instead.
//
//  User Story: When I visit that shortened URL,
//  it will redirect me to my original link.
//
var express = require('express');
var request = require('request');
var mongodb = require('mongodb');


//read .env file variables (private user/pass information)
var dotenv = require('dotenv');
dotenv.config();

var app = express();
app.use(express.static('.'));
app.set('port', (process.env.PORT || 5000));

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
// For locally running connection
//var url = 'mongodb://localhost:27017/urlshortener';

// user & pass for mLab set in .env file (uses dotenv)
var url = process.env.MONGOLAB_URI;

//(Focus on This Variable)
//console.log(url);

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to database');

    // do some work here with the database.
    app.get('/', function (req, res) {
      res.send('index.html');
    });



    app.get('/:id(\\d+)/', function(req, res){
    //app.get(':id(\[0-9\]+)/', function(req, res){
      //try to get the sequence from the passed in param
      console.log(req.params.id);
      //res.send("Looks like a previously shortened URL" );
      db.collection("urls").findOne(
        { sequence: +req.params.id},
        function(err,r){
          if (err) throw err;
          res.redirect(307, r.longUrl)
          //res.send(r);
          console.log(r.longUrl);
        }
      )
    });

    app.get('/url/*', function(req, res){
      var inputurl = req.params[0];
      //validate url format
      re = /(http:\/\/|https:\/\/).*(\.).*/;

      console.log(inputurl);

      if (re.test(inputurl)){

        request(inputurl, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var code = response.statusCode
            console.log("Status Code: ", response.statusCode) // Show the HTML for the Google homepage.

            db.collection("counters").findOneAndUpdate(
              { _id: "userid" },
              { $inc: { seq: 1 } },
              {new: true},
              function(err, r) {
                if (err) throw err;
                console.log("Got next sequence" + r.value.seq);
                console.log(r.value.seq);
                //return r.value.seq;
                obj = {

                  longUrl: inputurl,
                  dateAdded: new Date(),
                  sequence: r.value.seq,
                  status: {
                    code: code,
                    lastResponse: new Date()
                  }
                };

                db.collection('urls').insertOne(
                  obj,
                  function(err, data) {
                    // handle error
                    if (err) throw err;
                    // other operations
                    console.log(JSON.stringify(obj));
                    res.send(obj);
                  });
                //db.close();
              }
            );
          } else {
            res.send("Sorry this is not a live page" + response.statusCode)
          }
        })


      } else {
        res.send(inputurl+ "is not a valid URL");
      }
    });


    app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
    });


    //Close connection

  }
});

