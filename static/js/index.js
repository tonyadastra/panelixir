$(document).ready(function () {
    var continent = "World";
    // console.log("hihihi")
    $.ajax({
        url: "/update_continent",
        type: "get",
        data: { continent: continent },
        success: function (response) {
            console.log(response)
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

// $header.onload(function () {
//     var continent = $(this).data("value");
//     console.log("hihihi")
//     $.ajax({
//         url: "/update_continent",
//         type: "get",
//         data: { continent: continent },
//         success: function (response) {
//             // console.log(response)
//             $("#progressbar").html(response);
//             // window.location.replace('/');
//         },
//     });
// });