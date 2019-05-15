/*
 * Jogo
 * Autor: Bruno Luiz Katzjarowski;
 * Data: 04/05/2019
 * */

var express = require('express'); //Call the express library to listen game.
var app = express(); //set entire express to app variable

var serv = require('http').Server(app);


app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client',express.static(__dirname + '/client'));
serv.listen(2000); //listen port 2000

console.log('#########~~~#########');
console.log('## Server Started  ##');
console.log('#########~~~#########');


var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Entity = function(){
    let self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id:""
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}


var Player = function(id){

    var self = Entity();
    
    //Add attributes to player entity
    self.id = id;
    self.number = Math.floor(10*Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.maxSpeed = 10;

    //Save the entity update
    var super_update = self.update;

    //set the player update function
    self.update = function(){
        self.updateSpd();
        super_update();
    }

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
    }


    Player.list[id] = self;
    return self;
}
Player.list = {}

Player.onConnect = function(socket){

    //Create a player and set the attributes
    var player = Player(socket.id);
    console.log('Creating player: '+socket.id);

    //----------------------
    //Set the player Events
    //----------------------
    socket.on('keyPress',function(data){
        console.log(data);
        if(data.inputId == 'UP')
            player.pressingUp = data.state;
        if(data.inputId == 'DOWN')
            player.pressingDown = data.state;
        if(data.inputId == 'LEFT')
            player.pressingLeft = data.state;
        if(data.inputId == 'RIGHT')
            player.pressingRight = data.state;
    });

}
Player.onDisconnect = function(socket){
    console.log('Deleting player: '+socket.id);
    delete Player.list[socket.id];
}

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

}


var Bullet = function(angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI)*10;
    self.spdY = Math.sin(angle/180*Math.PI)*10;

    self.timer = 0;
    self.toRemove = false;
    
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();
    };
    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};
Bullet.update = function(){

    if(Math.random() < 0.1){
        Bullet(Math.random()*360);
    }
    
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];

        //Update the Bullet position
        bullet.update();
        pack.push({
            x: bullet.x,
            y: bullet.y
        });
    }
    return pack;

}


var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){

    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMessageToServer',function(text){

        let playerName = (''+socket.id).slice(2,7);

        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName+": "+text);
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

