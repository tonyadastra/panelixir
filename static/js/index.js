$('#dropdown-form-button').click(function(event){
    // Prevent redirection with AJAX for contact form
    var form = $('#dropdown-form');
    var form_id = 'dropdown-form';
    var url = form.prop('action');
    var type = form.prop('method');
    var formData = document.getElementById("dropdown-form-button").value;
    console.log(formData)

    // submit form via AJAX
    send_form(form, form_id, url, type, modular_ajax, formData);

function send_form(form, form_id, url, type, inner_ajax, formData) {
        // inner AJAX call
    inner_ajax(url, type, formData);
    }

function modular_ajax(url, type, formData) {
    // Most simple modular AJAX building block
    $.ajax({
        url: url,
        type: type,
        data: formData,
        processData: false,
        contentType: false,
    success: function ( data ){
        // response from Flask contains elements
    },
    }).done(function() {
    });
}
});


// $('#dropdown-form-button').click(function(event) {
//     var http = new XMLHttpRequest();
//     var stages = document.getElementById("dropdown-form-button").value;
//     http.open("POST", "/", true);
//     http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
//     var params = stages; // probably use document.getElementById(...).value
//     console.log(params)
//     http.send(params);
//     http.onload = function() {
//         alert(http.responseText);
//     }
// })
