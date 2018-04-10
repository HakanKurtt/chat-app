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

    $(document).on('click','.online-user',function(){
        to = $(this).text();

    });

    $(document).on('click','.group-name',function(){
        room = $(this).text();

    });


    $nickForm.submit(function(e){
        e.preventDefault();
        socket.emit('new user', $nickBox.val(), function(data){ //data degeri sunucudaki callback'e denk.
            if(data){
                $('#nickWrap').hide();
                $('#contentWrap').show();
            }else {
                $nickError.html('Bu kullanıcı adı daha önceden alınmış!');
            }
        });
    });

    socket.on('usernames', function(data){
        var html='';

        for(i=0; i < data.length; i++){
            html += '<li class="list-group-item list-group-item-action online-user">'+data[i] + '</li>'
        }

        $users.html(html);
    });



    $messageForm.submit(function (e) {
       e.preventDefault();
       socket.emit('send message', { msg:$messageBox.val(), to: to});
       $messageBox.val('');
    });


    /*socket.on('connect', function(){

    }); */

    socket.on('new message', function(data){
        $chat.append('<b>'+ data.nickname + ':</b>'+ data.message + '<br />');
    });






});
