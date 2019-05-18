/*
 * Jogo
 * Autor: Bruno Luiz Katzjarowski;
 * Data: 04/05/2019
 * */

const mongoDb = require('mongojs');
const urlConnect = 'mongodb://kidjapa:Hu7p5s7q@mygame-shard-00-00-5t9ax.mongodb.net:27017,mygame-shard-00-01-5t9ax.mongodb.net:27017,mygame-shard-00-02-5t9ax.mongodb.net:27017/myGame?ssl=true&replicaSet=myGame-shard-0&authSource=admin&retryWrites=true';
const urlLocalhost = 'localhost:27017/myGame';
const db = mongoDb(urlLocalhost, ['account','progress']);

var express = require('express'); //Call the express library to listen game.
var app = express(); //set entire express to app variable

var serv = require('http').Server(app);


app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client',express.static(__dirname + '/client'));
serv.listen(2000); //listen port 2000

console.log('#########~~~####################');
console.log('## Server Started  Port: 2000 ##');
console.log('#########~~~####################');

const EMIT_ADD_TO_CHAT = "addToChat";

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Entity = function(){
    let self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id:""
    };
    self.update = function(){
        self.updatePosition();
    };
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    };

    /**
     * @param pt Point x | y
     * @returns {number}
     */
    self.distance = function(pt){
      return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2) );
    };


    return self;
};


var Player = function(id){

    var self = Entity();
    
    //Add attributes to player entity
    self.id = id;
    self.number = Math.floor(10*Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpeed = 10;

    //Save the entity update
    var super_update = self.update;

    //set the player update function
    self.update = function(){
        self.updateSpd();
        super_update();

        if(self.pressingAttack){
            self.shootBullet(self.id, self.mouseAngle);
        }
    };

    self.shootBullet = function(pt, angle){
        var b = Bullet(pt,angle);
        b.x = self.x;
        b.y = self.y;
    };

    //UPDATE SPEED OF PLAYER
    self.updateSpd = function(){

        if(self.pressingRight)
            self.spdX = self.maxSpeed;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpeed;
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -self.maxSpeed;
        else if(self.pressingDown)
            self.spdY = +self.maxSpeed;
        else
            self.spdY = 0;
    };

    Player.list[id] = self;
    return self;
};
Player.list = {};

Player.onConnect = function(socket){

    //Create a player and set the attributes
    var player = Player(socket.id);

    //----------------------
    //Set the player Events
    //----------------------
    socket.on('keyPress',function(data){
        if(data.inputId === 'UP')
            player.pressingUp = data.state;
        if(data.inputId === 'DOWN')
            player.pressingDown = data.state;
        if(data.inputId === 'LEFT')
            player.pressingLeft = data.state;
        if(data.inputId === 'RIGHT')
            player.pressingRight = data.state;
        if(data.inputId === 'ATTACK')
            player.pressingAttack = data.state;
        if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

};
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
};

Player.update = function(){
    
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];

        //Update the player position
        player.update();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    return pack;

};


var Bullet = function(parent,angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI)*10;
    self.spdY = Math.sin(angle/180*Math.PI)*10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for(let i in Player.list){
            let p = Player.list[i];
            if(self.distance(p) < 32 && self.parent !== p.id){
                //TODO: Handdle --hp
                self.toRemove = true;
            }
        }

    };
    Bullet.list[self.id] = self;
    return self;
};
Bullet.list = {};
Bullet.update = function(){
    
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        //Update the Bullet position
        bullet.update();
        if(bullet.toRemove === true){
            delete Bullet.list[i];
        }
        pack.push({
            x: bullet.x,
            y: bullet.y
        });
    }
    return pack;

};

const USERS = {
    'bob': 'asd',
    'b': 'b'
};

/**
 * Verifica se os dados de passowrd e usuario estão corretos
 * @param {object} data data.username && data.password
 * @param {function} callback return true|false
 */
const isValidPassword = function(data,callback){
    console.log('isValidPassword',data.password);
    db.account.find({username: 'bruno'},function(err,res){
        console.log(res);
    });

    // db.account.find({username: data.username,password: data.password},function(err,res){
    //     console.log(res);
    //     if(res.length > 0)
    //         callback(true);
    //     else
    //         callback(false);
    // });
};

/**
 * Verificar se o usuario já existe
 * @param {object} data data.username && data.password 
 * @param {function} callback return true|false
 */
const isUserNameTaken = function(data,callback){
    db.account.find({username: data.username},function(err,res){
        if(res.length > 0)
            callback(true);
        else
            callback(false);
    });
};

/**
 * Adicionar um usuario ao database
 * @param {object} data data.username && data.password
 * @param {function} callback
 */
const addUser = function(data, callback){
    db.account.insert({
        username: data.username,
        password: data.password
    },function(err,res){
        if(err === null)
            callback(true);
        else
            callback(false);
    });
};


var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){

    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.on('signin',function(data){

        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket);
                socket.emit('signInResponse',{succes: true});
            }else{
                socket.emit('signInResponse',{succes: false});
            }
        });

    });

    socket.on('signup',function(data){

        isUserNameTaken(data, function(res){
            if(res){
                socket.emit('signUpResponse',{succes: false,message: 'Usuário já existe.'});
            }else{ // Make User
                addUser(data, function(res){
                    if(res)
                        socket.emit('signUpResponse',{succes: true,message: 'Usuário criado com sucesso!'});
                    else
                        socket.emit('signUpResponse',{succes: false,message: 'ops, algo de errado aconteceu. Tente novamente mais tarde!'});
                });
            }
        });

    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMessageToServer',function(text){

        let playerName = (''+socket.id).slice(2,7);

        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit(EMIT_ADD_TO_CHAT,playerName+": "+text);
        }
        
    });

});

setInterval(function(){
    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack);
    }

},1000/25);