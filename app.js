// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
/*if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });
*/
// Code to run if we're in a worker process
//} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');
	const cheerio = require('cheerio')
	const url = 'http://mod.cht.com.tw/bepg2/'
	const request = require('request')
	const cron = require('node-cron')
	var path = require('path')
    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(bodyParser.urlencoded({extended:false}));
	//app.use(express.static(__dirname + '/views/'));
	//app.use('static', express.static(path.join(__dirname, "static")));
	//app.use(express.static(__dirname + '/static'));
	//app.use(express.static(path.join(__dirname, "/static")));
	app.use('/static', express.static(path.join(__dirname, "/static")));
	var new_update_time;
	
	//parse tv show program
	let weathers = [];
	function parseStr(arr, num){
		let reg = /\d{2}:\d{2}\s*\S*\w*\s*[- ]*/g;
		//console.log(arr);
		if(arr[0].match(reg) == null)
		{
			console.log(arr[0]);
			return 'Empty'
		}
		else
		{
			try {
				var result = arr[0].match(reg)[num].substr(0,5) + ' ' + arr[0].match(reg)[num].substr(5,arr[0].match(reg)[num].length - 5);
			}
			catch(err) {
				console.log('error at: ' + arr[0]);
				console.log(err);
				
			}			
		}
			return arr[0].match(reg)[num].substr(0,5) + ' ' + arr[0].match(reg)[num].substr(5,arr[0].match(reg)[num].length - 5).trim();
	}
	function updateTvShow() {
	var tvshows = [];
	
	request(url, (err, res, body) => {
		const $ = cheerio.load(body)

		$('.wrapper .rowat, .rowat_gray').each(function(i, elem) {
			tvshows.push(
				$(this)
				.text()
				.split('\n')
			)
		})			
		let reg = /\d{2}:\d{2}\S*\w*\s*[- ]*/g;
		
		tvshows = tvshows.map(weather => ({
			channelNumber: weather[0].split(' ')[0],
			channelName: weather[0].split(' ')[1],
			comingup1: parseStr(weather,0),
			comingup2: parseStr(weather,1),
			comingup3: parseStr(weather,2)
			}));
		
		console.log(tvshows);
		//tvshows = tvshows.map(weather => ({
		//	channelNumber: weather[0].split(' ')[0],
		//	channelName: weather[0].split(' ')[1],
		//	comingup1: weather[0].match(reg)[0],
			//comingup1: weather[0].match(reg)[0].substr(0,5) + ' ' + weather[0].match(reg)[0].substr(5,weather[0].match(reg)[0].length - 5),
			//comingup2: weather[0].match(reg)[1].substr(0,5) + ' ' + weather[0].match(reg)[1].substr(5,weather[0].match(reg)[1].length - 5),
			//comingup3: weather[0].match(reg)[2].substr(0,5) + ' ' + weather[0].match(reg)[2].substr(5,weather[0].match(reg)[2].length - 5),

		//}));
		weathers = tvshows;
		new_update_time = new Date();
		//console.log(weathers);
	});
}

    app.get('/', function(req, res) {
        res.render('index', {
            static_path: 'static',
            theme: process.env.THEME || 'flatly',
            flask_debug: process.env.FLASK_DEBUG || 'false',
			tvshow: weathers,
			update_time: new_update_time
        });
    });

    app.post('/signup', function(req, res) {
        var item = {
            'email': {'S': req.body.email},
            'name': {'S': req.body.name},
            'preview': {'S': req.body.previewAccess},
            'theme': {'S': req.body.theme}
        };

        ddb.putItem({
            'TableName': ddbTable,
            'Item': item,
            'Expected': { email: { Exists: false } }        
        }, function(err, data) {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }

                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } else {
                sns.publish({
                    'Message': 'Name: ' + req.body.name + "\r\nEmail: " + req.body.email 
                                        + "\r\nPreviewAccess: " + req.body.previewAccess 
                                        + "\r\nTheme: " + req.body.theme,
                    'Subject': 'New user sign up!!!',
                    'TopicArn': snsTopic
                }, function(err, data) {
                    if (err) {
                        res.status(500).end();
                        console.log('SNS Error: ' + err);
                    } else {
                        res.status(201).end();
                    }
                });            
            }
        });
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
		updateTvShow();
		cron.schedule('0 0 */1 * * *', function(){
		//cron.schedule('*/10 * * * * *', function(){
			updateTvShow();
			//console.log('print message');
			console.log(new Date());
		});
    });
//}