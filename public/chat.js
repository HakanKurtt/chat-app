$(function() {
    var socket = io.connect();

    var $nickForm = $('#setNick');
    var $nickError = $('#nickError');
    var $nickBox = $('#nickname');
    var $messageForm = $('#send-message');
    var $messageBox = $('#message');
    var $chat = $('#chat');
    var $users = $('#users');
    var to='all';
    var room='';
    var $feedback= $('#feedback');
    var message=document.getElementById('message');


    $(document).on('click','.user',function(){
        to = $(this).text();

    });

    $(document).on('click','.group-name',function(){
        room = $(this).text();

    });






    $nickForm.submit(function(e){
        e.preventDefault();
        socket.emit('new user', $nickBox.val(), function(data){ //data degeri sunucudaki callback'e denk.

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





    $messageForm.submit(function (e) {
       e.preventDefault();
       socket.emit('send message', { nickname:$nickBox.val(), msg:$messageBox.val(), to: to});
       $messageBox.val('');
    });

    $(document).on('click','.user',function(){
        to = $(this).text();
        socket.emit("get private messages",{nickname:$nickBox.val(), to: to});

    });

    //Herkes'e tıklayınca genel mesajları getir.
    $(document).on('click','#herkes',function(){
        to = 'all';

        socket.emit("get public");

    });

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
        feedback.innerHTML = "";
        $chat.append('<b>'+ data.nickname + ':</b>'+ data.message + '<br />');
    });

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
        }, 1000); //settimeout finish.

    });


    /*socket.on('yaziyor', function(data){

        feedback.innerHTML = '<p><em>'+ data + ' yazıyor...</em></p>';

    }); */



});
