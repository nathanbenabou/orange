//arguments db_number xmin xmax ymin ymax


var db_number = Math.ceil(Number(process.argv[2]));
const xmin_init = Number(process.argv[3]);
const xmax_init = Number(process.argv[4]);
const ymin_init = Number(process.argv[5]);
const ymax_init = Number(process.argv[6]);

const async = require('async');
const request = require('request');
const Json2csvParser = require('json2csv').Parser;

var MongoClient = require('mongodb').MongoClient;
const mlabs = require('./mlabs.json');
const db_name = "orange"+db_number;
var db_url = "mongodb://nb:a12345@"+mlabs[db_number]; //"mongodb://localhost:27017/mydb";


MongoClient.connect(db_url, function(err, db) {
  if (err) throw err;
  var dbo = db.db(db_name);
  dbo.createCollection("fibre", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});

let range = n => Array.from(Array(n).keys());
const subdiv = 2000;
const x_steps = range(Math.ceil((xmax_init-xmin_init)/subdiv));
const xmin_list = x_steps.map(function(x){return xmin_init+(x*subdiv)});
const xmax_list = xmin_list.map(function(x){return x+subdiv});
const y_steps = range(Math.ceil((ymax_init-ymin_init)/subdiv));
const ymin_list = y_steps.map(function(x){return ymin_init+(x*subdiv)});
const ymax_list = ymin_list.map(function(x){return x+subdiv});

// var xmin = 260000;
// var ymin = 6620000;
// var xmax = 265000;
// var ymax = 6625000;

const main_url = "https://couverture-mobile.orange.fr/arcsig/rest/services/extern/optimum_ftth/MapServer/0/query?token=";
const token = "3TtIJGyLUffDA40eIgyhE_xUUOxV-HO84LpCYkXbnOa2HBMAGUJqGtkt5Leiwn4GTJpE8bMHiQiz7RlMJWvhiTTbFPHie_XnTpE4mufQYoI.";

var EventEmitter = require("events").EventEmitter;
var body = new EventEmitter();
var db_connected = new EventEmitter();
var db_mlab

MongoClient.connect(db_url, function(err, db) {
  if (err) throw err;
  db_mlab = db;
  //dbo = db.db(db_name);
  db_connected.emit('update');
});

function sendData(options, callback) {
     async function main_callback(error, response, data) {
          if (!error && response.statusCode == 200) {

            var data_parsed = JSON.parse(data).features
            //console.log("IN");

            var data_to_send = data_parsed.map(function(x){return x.attributes});
            if (data_to_send.length > 0){
              //console.log(data);
              dbo = db_mlab.db(db_name);
              await dbo.collection("fibre").insertMany(data_to_send, function(err, res) {
              if (err) {
                db_number+=1;
                db_url = "mongodb://nb:a12345@"+mlabs[db_number];
                MongoClient.connect(db_url, function(err, db) {
                  if (err) throw err;
                  db_mlab = db;
                  //dbo = db.db(db_name);
                  db_connected.emit('update');
                });
                dbo = db_mlab.db(db_name);
                dbo.collection("fibre").insertMany(data_to_send, function(err, res) {
                  if(err) throw err;

              });
            };

              console.log("Number of documents inserted: " + res.insertedCount);
              callback(error);
                //db.close();
              });
            } else {
              callback(error);
            }

            //console.log('OUT');
            //body.emit('update');
          }
        };
        request(options , main_callback);
};

var q = async.queue(sendData, 5);
//var q = async.queue(request, 2);

async function main(){

    for(var i=0; xn=xmin_list.length,i<xn; i++){
      for(var j=0; yn=ymin_list.length,j<yn; j++){
                    var xmin = xmin_list[i];
                    var xmax = xmax_list[i];
                    var ymin = ymin_list[j];
                    var ymax = ymax_list[j];
                    console.log([xmin, xmax, ymin, ymax]);
                    var req = "&f=json&where=(etape%3D%270%27%20AND%20sous_etape%20not%20in%20(%27A%27%2C%27B%27))%20or%20(etape%3C%3E%270%27)%20or%20(etape%3D%27%27%20AND%20sous_etape%20not%20in%20(%27A%27%2C%27B%27))&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A"+xmin+".0%2C%22ymin%22%3A"+ymin+".0%2C%22xmax%22%3A"+xmax+".0%2C%22ymax%22%3A"+ymax+".0%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=OBJECTID%2Ctype_logement%2Cetat%2Coperateur%2Cadresse%2Cno_dossier%2Cetape%2Csous_etape%2Cstatut_syndic&outSR=102100";


                    var url = main_url + token + req;

                    //console.log(url);

                    var options = {
                      url: url,
                      headers: {
                        // 'Accept': '*/*',
                        //'Accept-Encoding': ['gzip', 'deflate', 'br']
                        //'Connection': 'keep-alive',
                        //'Content-Type': 'application/x-www-form-urlencoded'
                        // 'Host': 'couverture-mobile.orange.fr'
                         'Referer': 'https://couverture-mobile.orange.fr/mapV3/fibre/index.html?geosignet=true'
                        // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
                        // 'X-Requested-With': 'XMLHttpRequest'
                      }
                    };

                    q.push(options, function(err) {
                      console.log('finished processing');
                    });
                    //q.push(options, main_callback);
                  };
                };
                    //var myData = await sendData(options , callback);



};

db_connected.on('update', () => {
  main();
});



q.drain = function() {
    console.log('all items have been processed');
    db_mlab.close();
};
