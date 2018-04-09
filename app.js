var express = require('express');
var socket = require('socket.io');

// uygulamam kurulumu
var app = express();

var server = app.listen('4000', function(){
    console.log("4000 portu üzerinden dinleniyor..");
});

//Soket kurulumu
var io = socket(server);

//Veritabanı bağlantısı
var mongo = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/chat-app';




io.on('connection', function(socket){
    console.log("Soket bağlantısı gerçekleşti.", socket.id);

    socket.send(veri);

    //istemciden gelen chat olayını yakala.
    socket.on('chat', function(data){

        io.sockets.emit('chat', data); //gelen mesajı tüm clientlara gönder.

    });

    //broadcast
    socket.on('yaziyor', function(data){

        socket.broadcast.emit('yaziyor',data);

    });
});



//statik dosyalar
//app.use(express.static('public'));




    MongoClient.connect(url, function(err, db){
        if(err) {
            console.log('Sunucuya bağlanılamıyor.', err);
        }else {
            console.log('Bağlantı sağlandı.');

            var collection = db.collection('users');

            var veri;

            collection.find({}).toArray(function(err, result){
                if(err){
                    console.log(err);
                }else if(result.length){
                    veri = result;
                }else{
                    res.send('Dosya bulunamadı!');
                }
            });
        }

    });



