// 서버 실행 포트
if (process.argv.length <= 2) {
    console.log("서비스 포트를 입력하세요");
    process.exit(-1);
}

// 포트 파라미터 셋팅
var port = process.argv[2];
var thrift = require("thrift");
var ttypes = require("./gen-nodejs/Calculator_types");
var Calculator = require("./gen-nodejs/CalculatorService");
var zookeeper = require('node-zookeeper-client');

// Thrift Server 실행
var server = thrift.createServer(Calculator, {
    getPort: function (result) {
        console.log("getPosrt : " + port);
    },

    ping: function (result) {
        console.log("ping()");
        result();
    },

    plus: function (n1, n2, result) {
        console.log("plus(", n1, "+", n2, ")");
        result(null, n1 + n2);
    },

    minus: function (n1, n2, result) {
        console.log("plus(", n1, "-", n2, ")");
        result(null, n1 - n2);
    }
});

server.listen(port, "localhost", function (error) {
    if (error) {
        console.error("Unable to listen on port", port, error);
        listen(port + 1);
        return;
    }
    console.log(port + " 포트 서비스 시작");

});

// Thrift 서버 실행하면서 Zookeeper Client Node 등록
var client = zookeeper.createClient('localhost:2181, localhost:2182, localhost:2183, localhost:2184, localhost:2185',
    { sessionTimeout: 100000 });
var root_path = '/thriftCalc';
var path = root_path + '/' + port;

client.on('connected', function () {
    console.log('Connected to the Zookeeper server.');
    client.create(path,
        new Buffer('data'),
        CREATE_MODES.EPHEMERAL,
        function (error) {
            if (error) {
                console.log('Failed to create node: %s due to: %s.', path, error);
                //client.close();
            } else {
                console.log('Node: %s is successfully created.', path);
            }
        });
});

client.once('disconnected', function () {
    console.log('zk node Disconnected' + client);
    

    //}
    // client.connect().then(function (data) {
        
    // }).catch(function (e) {
         
    // });
     
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