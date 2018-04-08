var express = require('express');
var socket = require('socket.io');

// uygulamam kurulumu
var app = express();

var server = app.listen('4000', function(){
    console.log("4000 portu üzerinden dinleniyor..");
});


//statik dosyalar
app.use(express.static('public'));

//Soket kurulumu
var io = socket(server);

io.on('connection', function(socket){
    console.log("Soket bağlantısı gerçekleşti.", socket.id);

    //istemciden gelen chat olayını yakala.
    socket.on('chat', function(data){

        io.sockets.emit('chat', data); //gelen mesajı tüm clientlara gönder.

    });

    //broadcast
    socket.on('yaziyor', function(data){

        socket.broadcast.emit('yaziyor',data);

    });
});