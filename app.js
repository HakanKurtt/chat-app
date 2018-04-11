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
    nickname: String,
    socketid: String,
    status: {type:Boolean, default:false}
});

var msgSchema = mongoose.Schema({
    message: String,
    sender: String,
    receiver: String,
    created: {type: Date, default:Date.now()}
});



var user = mongoose.model('User',userSchema);
var message = mongoose.model('message',msgSchema);


//statik dosyalar
app.use(express.static('public'));







    io.on('connection', function(socket){
        console.log("Soket bağlantısı gerçekleşti.", socket.id);


        //uygulamadaki kullanıcıları getiren fonksiyon.
        function getUsers(){
            user.find({}, function(err, docs){
                if(err) throw err;

                for(var i=docs.length-1; i >= 0; i--){
                    users[docs[i].nickname] = docs[i].socketid;

                }
                //io.sockets.emit('usernames', Object.keys(users)); //tüm kullanıcılara users nesnesindek key değerleri(nickname'leri) gönderir.

            });


        }

        getUsers();

        var result;

        //yeni bir kullanıcı geldiğinde
        socket.on('new user', function(data, callback){


            //bu kullanıcı daha önceden oluşturulmuş mu?
            user.findOne({ 'nickname': data }, function(err, result) {
                if (err) {
                    throw err;
                }

                if (result) { //kullanıcı önceden oluşturulmuş.
                    callback(false);



                    //kullanıcının yeni soket adresini güncelle.
                    user.findOneAndUpdate({nickname:data},{$set:{socketid:socket.id, status:true}},function(err,doc){
                        if(err) throw err;
                        console.log("Güncelleme başarılı!");
                        console.log(data+'='+socket.id);
                        users[data]=socket.id;
                        updateNicknames();
                        });





                    //eski mesajları getir.
                    message.find({sender: data}).exec( function(err, docs){
                        if(err) throw err;
                        console.log(docs);
                        io.to(socket.id).emit('old messages', docs);
                    });


                } else {  // burada yeni kullanıcı kaydedilecek.
                    callback(true);
                    socket.nickname = data;
                    users[socket.nickname] = socket.id;
                    updateNicknames();


                    var newUser= new user({nickname:data, socketid: socket.id, status:true});

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

            if(data.to === 'all'){ //herkese mesaj gönderme
                var newMsg = new message({message: data.msg, sender: data.nickname, receiver: data.to});
                newMsg.save(function(err){
                    if(err) throw err;

                    socket.emit('new message', {message: data.msg, nickname: data.nickname}); //kendine
                    io.sockets.emit('new message', {message: data.msg, nickname: data.nickname}); //gelen mesajı tüm clientlara
                });

            }else{ // özel mesaj gönderme
                console.log(data.nickname);
                var newMsg = new message({message: data.msg, sender: data.nickname, receiver: data.to});
                newMsg.save(function(err){
                    if(err) throw err;
                    console.log('karşıdaki:'+users[data.to]);
                    socket.emit('new message', {message: data.msg, nickname: data.nickname}); //kendine
                    io.to(users[data.to]).emit('new message', {message: data.msg, nickname: data.nickname}); //karşıdakine
                });
            }
        });





        //kullanıcı uygulamadan çıktığında
        socket.on('disconnect', function(data){
            if(!socket.nickname) return;
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



