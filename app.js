var express = require('express');
var socket = require('socket.io');
////Veritabanı bağlantısı
var mongoose = require('mongoose');
//var MongoClient = mongodb.MongoClient;
//var url = 'mongodb://localhost:27017/chat-app';

var path = require('path');

var logger = require('morgan');  // isteklerle ilgili logları konsola yazmak için



//app.use()  gerekli olan middleware (fonksiyon) leri eklemek (aktif hale getirmek) için kullanılır


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
app.use(logger('dev'));

var users = {}; //kullanıcıları soket_id si ile tutacak olan nesne dizisi.
var status=[];
var userSchema = mongoose.Schema({
    nickname: String,
    socketid: String,
    roomname: String,
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

console.log(__dirname);






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
        var socketindex;

        //yeni bir kullanıcı geldiğinde
        socket.on('new user', function(data, callback){

            console.log(users[socket.id]);

            //bu kullanıcı daha önceden oluşturulmuş mu?
            user.findOne({ 'nickname': data.nickname }, function(err, result) {
                if (err) {
                    throw err;
                }

                if (result) { //kullanıcı önceden oluşturulmuş.

                    callback(false);



                    //kullanıcının yeni soket adresini güncelle.
                    user.findOneAndUpdate({nickname:data.nickname},{$set:{socketid:socket.id, status:true}},function(err,doc){
                        if(err) throw err;
                        console.log("Güncelleme başarılı!");
                        console.log(data.nickname+'='+socket.id);
                        users[data.nickname]=socket.id;
                        socket.join(data.roomname);
                        //Kullanıcının durumunu diziye atama.
                        status.push(data.nickname);
                        socket.index=status.indexOf(data.nickname);


                        updateNicknames();
                        });



                //eski public mesajları getir.
                getAllMessages();


                } else {  // burada yeni kullanıcı kaydedilecek.
                    callback(true);
                    socket.nickname = data.nickname;
                    users[socket.nickname] = socket.id;
                    status.push(data.nickname);
                    socketindex= status.indexOf(data.nickname);

                    socket.join(data.roomname);


                    updateNicknames();


                    var newUser= new user({nickname:data.nickname, socketid: socket.id, roomname:data.roomname, status:true});

                    newUser.save(function(err){
                        if(err) throw err;
                        console.log("Kisi kaydedildi");
                    });


                }

            });

            socket.on("get private messages", function(data){
                message.find( {$or: [{$and:[{sender:data.nickname},{receiver:data.to}]},{$and:[{sender:data.to},{receiver:data.nickname}]}]}).exec( function(err, docs){
                    if(err) throw err;


                    io.to(socket.id).emit('private messages', docs);
                });
            });


        });

        function getAllMessages() {


            message.find({receiver: 'all'}).exec(function (err, docs) {
                if (err) throw err;
                console.log(docs);

                io.to(socket.id).emit('get all messages', docs);
            });
        }

        socket.on('get room messages', function(data ,callback) {

            user.findOne({nickname: data.nickname}, function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.roomname === data.roomname) { //kullanıcı odaya kayıtlı
                    callback(true);

                    message.find({receiver: data.roomname}).exec(function (err, docs) {
                        if (err) throw err;


                        io.to(data.roomname).emit('room', docs);
                    });


                } else { //kullanıcı odada bulunmuyor.
                    callback(false);


                }
            })

        });

        socket.on('get public', function(data){
            getAllMessages();
        })









        //kullanıcıların bulunduğu listeyi günceller.
        function updateNicknames(){
            io.sockets.emit('usernames', Object.keys(users)); //tüm kullanıcılara users nesnesindek key değerleri(nickname'leri) gönderir.
            io.sockets.emit('status',status);
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

            }else if((data.to === 'Ev') ||(data.to === 'Is') || (data.to === 'Okul')){
                console.log("grup mesajlasma= ", data.to);
                var newMsg = new message({message: data.msg, sender: data.nickname, receiver: data.to});
                newMsg.save(function(err){
                    if(err) throw err;
                    //console.log('karşıdaki:'+users[data.to]);
                    //socket.emit('new message', {message: data.msg, nickname: data.nickname}); //kendine
                    io.to(data.to).emit('new message', {message: data.msg, nickname: data.nickname}); //karşıdakine
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

            console.log(status[socket.index]+" cıktı");

            delete status[socket.index];
            updateNicknames();


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



