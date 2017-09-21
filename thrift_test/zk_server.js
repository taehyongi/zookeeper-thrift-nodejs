var zookeeper = require('node-zookeeper-client');

var client = zookeeper.createClient('localhost:2181');
var path = '/thriftCalc/test'

client.once('connected', function () {
   console.log('Connected to the server.');
    // client.remove(path, -1, function (error) {
    //     if (error) {
    //         console.log(error.stack);
    //         return;
    //     }});
   client.create(path, 
    new Buffer('data'),
    CREATE_MODES.EPHEMERAL,function (error) {
       if (error) {
           console.log('Failed to create node: %s due to: %s.', path, error);
       } else {
           console.log('Node: %s is successfully created.', path);
       }

       client.close();
   });
});

client.connect();


var CREATE_MODES = {
    
        /**
         * The znode will not be automatically deleted upon client's disconnect.
         */
        PERSISTENT: 0,
    
        /**
        * The znode will not be automatically deleted upon client's disconnect,
        * and its name will be appended with a monotonically increasing number.
        */
        PERSISTENT_SEQUENTIAL: 2,
    
        /**
         * The znode will be deleted upon the client's disconnect.
         */
        EPHEMERAL: 1,
    
        /**
         * The znode will be deleted upon the client's disconnect, and its name
         * will be appended with a monotonically increasing number.
         */
        EPHEMERAL_SEQUENTIAL: 3
    };