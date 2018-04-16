$(function() {
    var socket = io.connect();

    var $nickForm = $('#setNick');
    var $nickError = $('#nickError');
    var $nickBox = $('#nickname');
    var $messageForm = $('#send-message');
    var $messageBox = $('#message');
    var $chat = $('#chat');
    var $users = $('#users');
    var $roomname = $('#roomname');
    var to='all';

    var $feedback= $('#feedback');
    var message=document.getElementById('message');


    $(document).on('click','.user',function(){
        to = $(this).text();

    });








    $nickForm.submit(function(e){
        e.preventDefault();
        socket.emit('new user', {nickname:$nickBox.val(), roomname:$roomname.val()}, function(data){ //data degeri sunucudaki callback'e denk.

            if(data){ //yeniyse
                $('#nickWrap').hide();
                $('#contentWrap').show();
                var entermessage = 'Merhaba ' + $nickBox.val();
                $('#username').text(entermessage);
                socket.emit('online', $nickBox.val() );

            }else { //eski kullanıcıysa
                $('#nickWrap').hide();
                $('#contentWrap').show();
                var entermessage = 'Merhaba ' + $nickBox.val();
                $('#username').text(entermessage);


                //var olan kullanıcının eski mesajlarını getir.
                socket.on('get all messages', function(docs){
                    $chat.html('');
                    for(var i=0; i<docs.length; i++){
                        $chat.append('<b>'+ docs[i].sender + ':</b>'+ docs[i].message + '<br />');
                        console.log(docs[i].message);
                    }
                })

            }


        });
    });

    /*message.addEventListener('keypress', function(){
        socket.emit('yaziyor', $nickBox.value);
    }); */

    socket.on('usernames', function(data){
        var html='';

        for(i=0; i < data.length; i++){
            html += '<li class="list-group-item list-group-item-action user"><span id="x" class="glyphicon-one-fine-red-dot"></span>'+data[i] + '</li>'
        }

        $users.html(html);

    });




    //Kişi mesaj yazıp submit ettiğinde send message olayı yayar.
    $messageForm.submit(function (e) {
       e.preventDefault();
       socket.emit('send message', { nickname:$nickBox.val(), msg:$messageBox.val(), to: to, roomname:$roomname.val()});
       $messageBox.val('');
    });

    $(document).on('click','.user',function(){
        to = $(this).text();
        socket.emit("get private messages",{nickname:$nickBox.val(), to: to});

    });

    //Herkes'e tıklayınca genel mesajları getir.
    $(document).on('click','#herkes',function(){
        to = 'all';
        console.log(to);

        socket.emit("get public", to);
    });

    //Spesifik bir room'u seçer.
    $(document).on('click','.group-name',function(){
        to = $(this).text();
        console.log(to);
        $chat.html('');

        socket.emit("get room messages", {nickname:$nickBox.val(), roomname: to}, function(data){
            if(data === false){
                console.log("FALSE");
                $chat.html('');
            }else{
                console.log("TRUE");
            }
        });

    });

    socket.on('room', function(docs){
        $chat.html('');
        console.log("CALISIYOR");
        for(var i=0; i<docs.length; i++){
            $chat.append('<b>'+ docs[i].sender + ':</b>'+ docs[i].message + '<br />');
            console.log(docs[i].message);
        }
    })


    $(document).on('click','.list-group-item', function(e) {
        e.preventDefault();
        //$(this).addClass('active').siblings().removeClass('active');
        $('.list-group-item').removeClass('active');

        // add active selected a
        $(this).addClass('active');
    });



    socket.on("private messages", function(data){
        $chat.html('');
        for(var i=0; i<data.length; i++){
            $chat.append('<b>'+ data[i].sender + ':</b>'+ data[i].message + '<br />');
        }
    });


    socket.on('new message', function(data){
        $messageBox.innerHTML = "";
        $chat.append('<b>'+ data.nickname + ':</b>'+ data.message + '<br />');
    });

    //Aktif ve pasif kullanıcıların gösterimi
    socket.on('status', function(status){


        setTimeout(function(){

            for(var x=0 ; x < status.length ; x++) {

                $('li').each(function () {
                    var text = $(this).text();

                    if(status.indexOf(text) === -1){ //dizide yoksa
                        $(this).children().removeClass('glyphicon-one-fine-dot').addClass('glyphicon-one-fine-red-dot');
                    }else{ //dizide varsa
                        $(this).children().removeClass('glyphicon-one-fine-red-dot').addClass('glyphicon-one-fine-dot');
                    }

                });
            }
        }, 500); //settimeout finish.

    });


    /*socket.on('yaziyor', function(data){

        feedback.innerHTML = '<p><em>'+ data + ' yazıyor...</em></p>';

    }); */



});
