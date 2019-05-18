var socket = io();
var ctx = document.getElementById('ctx').getContext('2d');

const KEY_UP = 87;
const KEY_DOWN = 83;
const KEY_LEFT = 65;
const KEY_RIGHT = 68;

// Login
const signDiv = document.getElementById('signDiv');
const signDivUsername = document.getElementById('signDiv-username');
const signDivPassword = document.getElementById('signDiv-password');
const signDivBtSignIn = document.getElementById('sign-in');
const signDivBtSignUp = document.getElementById('sign-up');
const gameDiv = document.getElementById('gameDiv');


signDivBtSignIn.onclick = function(){
    socket.emit('signin',{username: signDivUsername.value, password: signDivPassword.value});
};
signDivBtSignUp.onclick = function(){
    socket.emit('signup',{username: signDivUsername.value, password: signDivPassword.value});
};


socket.on('signInResponse',function(data){
    console.log(data);
    if(data.succes){
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
    }else{
        if(typeof data.message !== 'undefined')
            alert(data.message);
        else
            alert('sign in unsuccesussul');
    }
});

socket.on('signUpResponse',function(data){
    if(data.succes){
        if(typeof data.message !== 'undefined')
            alert(data.message);
        else
            alert('Usuario criado com sucesso!');
    }else{
        if(typeof data.message !== 'undefined')
            alert(data.message);
        else
            alert('sign up unsuccesussul');
    }
});


// Game
const chatText = document.getElementById('chat-text');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');


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
    if(key === KEY_UP)
        socket.emit('keyPress',{inputId: 'UP',state: true});
    if(key === KEY_DOWN)
        socket.emit('keyPress',{inputId: 'DOWN',state: true});
    if(key === KEY_LEFT)
        socket.emit('keyPress',{inputId: 'LEFT',state: true});
    if(key === KEY_RIGHT)
        socket.emit('keyPress',{inputId: 'RIGHT',state: true});
};
document.onkeyup = function(e){
    let key = e.keyCode;
    if(key === KEY_UP)
        socket.emit('keyPress',{inputId: 'UP',state: false});
    if(key === KEY_DOWN)
        socket.emit('keyPress',{inputId: 'DOWN',state: false});
    if(key === KEY_LEFT)
        socket.emit('keyPress',{inputId: 'LEFT',state: false});
    if(key === KEY_RIGHT)
        socket.emit('keyPress',{inputId: 'RIGHT',state: false});
};

//Attack
document.onmousedown = function(event){
    socket.emit('keyPress',{inputId: 'ATTACK', state: true});
};
document.onmouseup = function(event){
    socket.emit('keyPress',{inputId: 'ATTACK', state: false});
};

document.onmousemove = function(event){
  let x = -250 + event.clientX-8;
  let y = -250 + event.clientY-8;

  let angle = Math.atan2(y,x) / Math.PI * 180;
  socket.emit('keyPress',{inputId:'mouseAngle',state: angle})
};