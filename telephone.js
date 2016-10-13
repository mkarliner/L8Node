var amqp = require('amqp');
var influx = require('influx')
 
var connection = amqp.createConnection({ 
	host: 'chicken.rmq.cloudamqp.com',
	login: 'kkgckekp',
	password: 'JjUH8_kS08rLduyVO5jK4DtoTcZ00-B7',
	vhost: 'kkgckekp',
	heartbeat: 25
});

var client = influx({
 
  //cluster configuration 
  // hosts: [
  //   {
  //     host: 'localhost',
  //     port: 8060, //optional. default 8086
  //     protocol: 'http' //optional. default 'http'
  //   }
  // ],
  // or single-host configuration 
  host: 'localhost',
  port: 8086, // optional, default 8086 
  protocol: 'http', // optional, default 'http' 
  username: 'dbuser',
  password: 'f4ncyp4ass',
  database: 'mydatabase'
})

 
// add this for better debuging 
connection.on('error', function(e) {
  console.log("Error from amqp: ", e);
});

connection.on("close", function(e) {
	console.log("CONNECTION CLOSED!")
})
 
// Wait for connection to become established. 
connection.on('ready', function () {
  // Use the default 'amq.topic' exchange 
 console.log("Hooray!")
  connection.queue('my-queue', function (q) {
      // Catch all messages 
      q.bind('#');
    
      // Receive messages 
      q.subscribe(function (message, headers, deliveryInfo, messageObject) {
        // Print messages to stdout 
		w = JSON.parse(message.data.toString())
        console.log("MSG: ", JSON.stringify(w,null,4));
		// console.log("OBJ: ", messageObject)
		
		console.log("DI: ", deliveryInfo)
		// console.log("HEADERS: ", headers)
		if(deliveryInfo.routingKey == "weatherLondonTest") {
			client.writePoint("LondonWeather", w.temperature, {location: "cricklewood"}, function(e) {
				console.log("ERR: ", e)
			} )
		}
		if(deliveryInfo.routingKey == ".StAlbans.L8.mixingvalves.data") {
			console.log("L8 DATA! length: ", w.data.length);
			for(var i=0; i<w.data.length; i++){
				// var devID = w.data[i].deviceID;
// 				var name = w.data[i].name;
				//var readings = w.data[i].readings;
				var dev = w.data[i];
				console.log("MEASUREMENT: ", dev)
				
				client.writePoint("L8 StAlbans", // Measurement
				// fields
				 {
					hot: dev.hot,
					cold: dev.cold,
					mixed: dev.mixed,
					 time: dev.ts
				 },
				 // tags
				 {
					 deviceID: dev.deviceID,
					 name: dev.name,
				 },
				 function(e) {
				 	console.log("ERR: ", e)
				 }
			 )
			}
		}

		// console.log("HEADERS : ", headers);
		// console.log("DELIVERYINFO : ", deliveryInfo);
		// console.log("MSG_OBJ: ", messageObject)
		
      });
  });
});