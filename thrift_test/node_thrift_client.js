/******************************************************************/
// Zookeeper Client
/******************************************************************/
var zookeeper = require('node-zookeeper-client');

// ZK 에서 살아있는 서버 리스트를 받아서 해당 서버로 요청을 서비스를 요청한다.
var zk_client = zookeeper.createClient('localhost:2181, localhost:2182, localhost:2183, localhost:2184, localhost:2185',
    { sessionTimeout: 1000 });
var root_path = '/thriftCalc';
var zkThriftPort = [];

zk_client.on('connected', function () {
    console.log('Connected to the Zookeeper server.');
    
    // Watcher 등록
    listChildren(zk_client, root_path);
});

zk_client.on('disconnected', function () {
    console.log('Disconnected to the Zookeeper server.');
})

zk_client.connect();

// Watcher 등록
function listChildren(client, path) {
    client.getChildren(
        path,
        function (event) {
            console.log('Got watcher event: %s', event);
            listChildren(client, path);
        },
        function (error, children, stat) {
            if (error) {
                // console.log(
                //     'Failed to list children of %s due to: %s.',
                //     path,
                //     error
                // );
                zkThriftPort = [];
                return;
            }


            zkThriftPort = children;



            console.log('Children of %s are: %s.', path, children);
        }
    );
}

/******************************************************************/
// Zookeeper Command - 주키퍼의 상태를 가져오기 위한 라이브러리
/******************************************************************/

// zk 상태 체크
var zookeeperCommands = require('zookeeper-commands');
var Options = zookeeperCommands.Options;
var ZookeeperCmd = zookeeperCommands.Zookeeper;
var zkSvrState = {
    "2181": "",
    "2182": "",
    "2183": "",
    "2184": "",
    "2185": ""
};

function checkZkSvr(port) {

    var options = new Options('localhost', port, 1000);
    var zookeeperCmd = new ZookeeperCmd(options);

    console.log(port + '====================================================' + zookeeperCmd);

    zookeeperCmd.command('stat').then(function (data) {
        zkSvrState[port] = data['json']['mode'];
        if(zkSvrState[port] == undefined) zkSvrState[port] = "Wait";
    }).catch(function (e) {
        
        zkSvrState[port] = "OFF";
    });

}


/******************************************************************/
// Thrift Client
/******************************************************************/
var thrift = require("thrift");
var ttypes = require("./gen-nodejs/Calculator_types");
var Calculator = require("./gen-nodejs/CalculatorService");

var transport = thrift.TBufferedTransport;
var protocol = thrift.TBinaryProtocol;
var connection;
var thrift_client;

/******************************************************************/
// 접속 자동화를 위해서 이벤트 루프를 이용한다.
// 
/******************************************************************/
function connectServers(socketClient) {
    console.log("zkThriftPort : %s", zkThriftPort);

    console.log(io);

    // thrift 서버 상태 체크
    socketClient.emit('thrift_svr1_state', zkThriftPort.includes('9081') ? 'ON' : 'OFF');
    socketClient.emit('thrift_svr2_state', zkThriftPort.includes('9082') ? 'ON' : 'OFF');
    socketClient.emit('thrift_svr3_state', zkThriftPort.includes('9083') ? 'ON' : 'OFF');
    socketClient.emit('thrift_svr4_state', zkThriftPort.includes('9084') ? 'ON' : 'OFF');
    socketClient.emit('thrift_svr5_state', zkThriftPort.includes('9085') ? 'ON' : 'OFF');

    if(zkThriftPort.length > 0) {
        console.log(1);
        // Create a Calculator client with the connection
        
        var selThriftPort = Math.floor(Math.random() * (zkThriftPort.length));
        console.log('========================**************************' + selThriftPort + zkThriftPort.length);
        connection = thrift.createConnection("localhost", zkThriftPort[selThriftPort], {
            transport: transport,
            protocol: protocol
        });
        
        thrift_client = thrift.createClient(Calculator, connection);
        console.log(3);

        connection.on('error', function (err) {
            // connection = thrift.createConnection("localhost", zkThriftPort[0], {
            //     transport: transport,
            //     protocol: protocol
            // });
        
            // thrift_client = thrift.createClient(Calculator, connection);
        });

        var num1 = Math.floor(Math.random() * 10000) + 1  ;
        var num2 = Math.floor(Math.random() * 10000) + 1  ;
        thrift_client.plus(num1, num2, function (err, response) {
            
            var calc = num1 + ' + ' + num2 + ' = ' + response;

            zkThriftPort[selThriftPort] == ('9081') ? socketClient.emit('thrift_svr1_calc', calc) : socketClient.emit('thrift_svr1_calc', '');
            zkThriftPort[selThriftPort] == ('9082') ? socketClient.emit('thrift_svr2_calc', calc) : socketClient.emit('thrift_svr2_calc', '');
            zkThriftPort[selThriftPort] == ('9083') ? socketClient.emit('thrift_svr3_calc', calc) : socketClient.emit('thrift_svr3_calc', '');
            zkThriftPort[selThriftPort] == ('9084') ? socketClient.emit('thrift_svr4_calc', calc) : socketClient.emit('thrift_svr4_calc', '');
            zkThriftPort[selThriftPort] == ('9085') ? socketClient.emit('thrift_svr5_calc', calc) : socketClient.emit('thrift_svr5_calc', '');
        });
    }
    else {
        socketClient.emit('thrift_svr1_calc', '');
        socketClient.emit('thrift_svr2_calc', '');
        socketClient.emit('thrift_svr3_calc', '');
        socketClient.emit('thrift_svr4_calc', '');
        socketClient.emit('thrift_svr5_calc', '');
    }
    
     
    

    

    checkZkSvr('2181');
    checkZkSvr('2182');
    checkZkSvr('2183');
    checkZkSvr('2184');
    checkZkSvr('2185');

    socketClient.emit('zk_svr1_state', zkSvrState["2181"]);
    socketClient.emit('zk_svr2_state', zkSvrState['2182']);
    socketClient.emit('zk_svr3_state', zkSvrState["2183"]);
    socketClient.emit('zk_svr4_state', zkSvrState["2184"]);
    socketClient.emit('zk_svr5_state', zkSvrState["2185"]);


}



/******************************************************************/
// 웹페이지 구현을 위한 node.js socket.io
/******************************************************************/
console.log(111);
var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);
 

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', function (socket) {

    setInterval(function () { connectServers(socket); }, 1500);
    
    console.log('Socket.io (Web HTML) connect');


    // force client disconnect from server
    socket.on('Socket.io forceDisconnect', function () {
        socket.disconnect();
    })

    socket.on('disconnect', function () {
        console.log('Socket.io user disconnected: ' + socket.id);
    });
});

server.listen(3000, function () {
    console.log('Socket IO server listening on port 3000');
});