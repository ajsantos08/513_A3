var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var user = 1;
var userlist = [];
var log = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    var nick = "user"+ user;
    var nickcolor = "#fff";
    console.log(nick + ' connected');
    var msg = 'connected';
    var date = new Date(); 
    var time = date.toTimeString();
    time = time.split('-');
    userlist.push([nick, nickcolor]);
    socket.emit('join', 'user'+ user);
    io.emit('updatelist', userlist);
    socket.broadcast.emit('newuser', nick + " ["+time[0]+"] : " + msg);
    socket.emit('log', log);
    user++;

  socket.on('disconnect', function(){
    console.log(nick + ' disconnected');
    var msg = 'disconnected';
    var date = new Date(); 
    var time = date.toTimeString();
    time = time.split('-');
    userlist.forEach(function(u){
      if (u[0] == nick){
        userlist.splice(userlist.indexOf(u), 1);
      }
    });
    io.emit('updatelist', userlist);
    io.emit('disconnect', nick + " ["+time[0]+"] : " +msg);
  });

  socket.on('chat message', function(msg){
    console.log(nick + "message: " + msg);
    if((msg.split(' ')[0] == '/nick') &&  (msg.split(' ')[1] != null) && (msg.split(' ')[1] != '')){
      var oldnick = nick;
      var newnick = msg.split(' ')[1];
      var used = false;
      userlist.forEach(function(u){
        if (u[0] == newnick){
          used = true;
        }
      });
      if(!used){
        userlist.forEach(function(u){
          if (u[0] == oldnick){
            u[0] = newnick;
          }
        });
        nick = newnick;
        socket.emit('newnick', nick);
        io.emit('updatelist', userlist);
      }else{
        socket.emit('errnick', newnick);
      }
    }else if(msg.split(' ')[0] == '/nickcolor'){
      var newcolor = msg.split(' ')[1];
      var isHexColor  = /(^#[A-Fa-f0-9]{6}$)|(^#[A-Fa-f0-9]{3}$)/i.test(newcolor) 
      if (isHexColor){
        nickcolor = newcolor;
        userlist.forEach(function(u){
          if (u[0] == nick){
            u[1] = nickcolor;
          }
        });
        socket.emit('newcolor', nickcolor);
        io.emit('updatelist', userlist);
      }else{
        socket.emit('errcolor', newcolor);
      }
    }else{
      var date = new Date(); 
      var time = date.toTimeString();
      time = time.split('-');
      if(log.length < 200){
        log.push([nick," ["+time[0]+"] : "+msg, nickcolor]);
      }else{
        log.shift();
        log.push([nick," ["+time[0]+"] : "+msg, nickcolor]);
      }
      io.emit('chat message', nick," ["+time[0]+"] : "+msg, nickcolor);
    }
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});