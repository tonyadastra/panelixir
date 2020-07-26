$(document).ready(function () {
    var continent = "World";
    var processing = false;
    $.ajax({
        url: "/update_continent",
        type: "get",
        async: true,
        data: { continent: continent },
        success: function (response) {
            // console.log(response)
            $("#progressbar").html(response);
            setTimeout(function () {
                if (!processing){
                    processing = true;
                    $.ajax({
                    url: "/get_bars_data",
                    type: "get",
                    async: true,
                    data: { continent: continent },
                    success: function (response) {
                        // console.log(response)
                        // $("#vis2").html(response);
                        // window.location.replace('/');
                    },
                    });
                }
            }, 300);
            // window.location.replace('/');
        },
    });
});

$('.button-font').on('click', function () {
    var processing = false;
    var continent = $(this).data("value");
    $.ajax({
        url: "/update_continent",
        type: "get",
        async: true,
        data: { continent: continent },
        success: function (response) {
            // console.log(response)
            $("#progressbar").html(response);
            // window.location.replace('/');
            setTimeout(function () {
                if (!processing){
                    processing = true;
                    $.ajax({
                    url: "/get_bars_data",
                    type: "get",
                    async: true,
                    data: { continent: continent },
                    success: function (response) {
                        // Call d3 function
                        },
                    });
                }
            }, 300)
        },
    });
});