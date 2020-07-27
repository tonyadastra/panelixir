$(document).ready(function () {
    var continent = "World";
   
    $.ajax({
        url: "/update_continent",
        type: "get",
        data: { continent: continent },
        success: function (response) {
            // console.log(response)
            $("#progressbar").html(response);
            // window.location.replace('/');
        },
    });

    $('.button-font').on('click', function () {
        var continent = $(this).data("value");
        console.log(continent)
        $.ajax({
            url: "/update_continent",
            type: "get",
            data: { continent: continent },
            success: function (response) {
                // console.log(response)
                $("#progressbar").html(response);
                // window.location.replace('/');
            },
        });
    }); 
});


map.registerListener(function (val) {
    // document.querySelector("button[data-value='val']").click();
    var btn_group = document.getElementsByTagName('button');

    for (var i = 0, length = btn_group.length; i < length; i++) {
        var btn = btn_group[i];
        if (btn.value==val) {
            btn.click();
            break;
        }
    }
});


