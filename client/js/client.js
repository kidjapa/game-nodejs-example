var socket = io();
var ctx = document.getElementById('ctx').getContext('2d');

const KEY_UP = 87;
const KEY_DOWN = 83;
const KEY_LEFT = 65;
const KEY_RIGHT = 68;


var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');


ctx.font = '30px Arial';

socket.on('newPositions',function(data){
    ctx.clearRect(0,0,500,500);
    for(var i =0; i < data.player.length; i++){
        let player = data.player[i];
        ctx.fillText(player.number,player.x, player.y);
    }

    for(var i =0; i < data.bullet.length; i++){
        let bullet = data.bullet[i];
        ctx.fillRect(bullet.x-5,bullet.y-5,10,10);
    }
});

socket.on('addToChat',function(data){
    chatText.innerHTML += '<div>' + data + '</div>';
});

chatForm.onsubmit = function(e){
    e.preventDefault();
    socket.emit('sendMessageToServer',chatInput.value);
};

//send player att position
document.onkeydown = function(e){
    let key = e.keyCode;
    console.log('KeyCode',key);
    if(key == KEY_UP)
        socket.emit('keyPress',{inputId: 'UP',state: true});
    if(key == KEY_DOWN)
        socket.emit('keyPress',{inputId: 'DOWN',state: true});
    if(key == KEY_LEFT)
        socket.emit('keyPress',{inputId: 'LEFT',state: true});
    if(key == KEY_RIGHT)
        socket.emit('keyPress',{inputId: 'RIGHT',state: true});
}
document.onkeyup = function(e){
    let key = e.keyCode;
    if(key == KEY_UP)
        socket.emit('keyPress',{inputId: 'UP',state: false});
    if(key == KEY_DOWN)
        socket.emit('keyPress',{inputId: 'DOWN',state: false});
    if(key == KEY_LEFT)
        socket.emit('keyPress',{inputId: 'LEFT',state: false});
    if(key == KEY_RIGHT)
        socket.emit('keyPress',{inputId: 'RIGHT',state: false});
}