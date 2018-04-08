//Sunucuyla bağlantı kurma
var socket = io.connect('http://localhost:4000');

//DOM nesnelerine erişim

var message = document.getElementById('message'),
    isim = document.getElementById('isim'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback');



//sende tıklandığında chat isimli bir olay yayınla.
btn.addEventListener('click', function () {
    socket.emit('chat', {
        message: message.value,
        name: isim.value
    });

});

message.addEventListener('keypress', function(){
    socket.emit('yaziyor', isim.value);
});

//Eventleri dinleme.

socket.on('chat', function(data){
    feedback.innerHTML = "";
   output.innerHTML += '<p><strong>'+ data.name + ' : </strong>' + data.message + '</p>';
   message.value = "";
});

socket.on('yaziyor', function(data){

    feedback.innerHTML = '<p><em>'+ data + ' yazıyor...</em></p>';

})