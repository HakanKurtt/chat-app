var express = require('express');
var socket = require('socket.io');
////Veritabanı bağlantısı
//var mongo = require('mongodb');
//var MongoClient = mongodb.MongoClient;
//var url = 'mongodb://localhost:27017/chat-app';

// uygulamam kurulumu
var app = express();

var server = require('http').createServer(app);
//Soket kurulumu
var io = socket(server);

server.listen(4000);

var users = {}; //kullanıcıları soket_id si ile tutacak olan nesne dizisi.


//statik dosyalar
app.use(express.static('public'));








    io.on('connection', function(socket){
        console.log("Soket bağlantısı gerçekleşti.", socket.id);


        //yeni bir kullanıcı geldiğinde
        socket.on('new user', function(data, callback){
            if(data in users){ //eger kullanıcı ismi dizide varsa
                callback(false);
            }else{
                callback(true);
                socket.nickname = data;
                users[socket.nickname] = socket;
                updateNicknames();
            }
        });

        //kullanıcıların bulunduğu listeyi günceller.
        function updateNicknames(){
            io.sockets.emit('usernames', Object.keys(users)); //tüm kullanıcılara users nesnesindek key değerleri(nickname'leri) gönderir.
        }

        //istemciden gelen chat olayını yakala.
        socket.on('send message', function(data){

            if(data.to === 'all'){
                io.sockets.emit('new message', {message: data.msg, nickname: socket.nickname}); //gelen mesajı tüm clientlara gönder.
            }else{
                io.to(users[data.to].id).emit('new message', {message: data.msg, nickname: socket.nickname});
            }
        });

        //kullanıcı uygulamadan çıktığında
        socket.on('disconnect', function(data){
            if(!socket.nickname) return;
            delete users[socket.nickname];
            updateNicknames();
        });

        //broadcast
        socket.on('yaziyor', function(data){

            socket.broadcast.emit('yaziyor',data);

        });
    });







//   MongoClient.connect(url, function(err, db){
//       if(err) {
//           console.log('Sunucuya bağlanılamıyor.', err);
//       }else {
//           console.log('Bağlantı sağlandı.');

//           var collection = db.collection('users');

//           var veri;

//           collection.find({}).toArray(function(err, result){
//               if(err){
//                   console.log(err);
//               }else if(result.length){
//                   veri = result;
//               }else{
//                   res.send('Dosya bulunamadı!');
//               }
//           });
//       }

//   });



