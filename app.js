var express = require('express');
var socket = require('socket.io');
////Veritabanı bağlantısı
var mongoose = require('mongoose');
//var MongoClient = mongodb.MongoClient;
//var url = 'mongodb://localhost:27017/chat-app';

mongoose.connect('mongodb://localhost:27017/chat', function(err){
    if(err){
        console.log(err);
    }else {
        console.log('Connected to db.');
    }
})
// uygulamam kurulumu
var app = express();

var server = require('http').createServer(app);
//Soket kurulumu
var io = socket(server);

server.listen(4000);

var users = {}; //kullanıcıları soket_id si ile tutacak olan nesne dizisi.

var userSchema = mongoose.Schema({
    nickname: String
});

var msgSchema = mongoose.Schema({
    message: String,
    sender: String,
    receiver: String,
    Date: {type: Date,default:Date.now()}
});

var user = mongoose.model('User',userSchema);


//statik dosyalar
app.use(express.static('public'));








    io.on('connection', function(socket){
        console.log("Soket bağlantısı gerçekleşti.", socket.id);


        var result;

        //yeni bir kullanıcı geldiğinde
        socket.on('new user', function(data, callback){

            user.findOne({ 'nickname': data }, function(err, result) {
                if (err) {
                    throw err;
                }

                if (result) {
                    callback(false);
                } else {
                    callback(true);
                    socket.nickname = data;
                    users[socket.nickname] = socket;
                    updateNicknames();

                    var newUser= new user({nickname:data});

                    newUser.save(function(err){
                        if(err) throw err;
                        console.log("Kisi kaydedildi");
                    });
                }

            });



            /*if(result == undefined){ //eger kullanıcı ismi dizide varsa
                callback(false);
            }else{
                callback(true);
                socket.nickname = data;
                users[socket.nickname] = socket;
                updateNicknames();

                var newUser= new user({nickname:data});

                newUser.save(function(err){
                    if(err) throw err;
                    console.log("Kisi kaydedildi");
                });
            }*/
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
                socket.emit('new message', {message: data.msg, nickname: socket.nickname}); //kendine
                io.to(users[data.to].id).emit('new message', {message: data.msg, nickname: socket.nickname}); //karşıdakine
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



