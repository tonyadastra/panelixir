var prev_i = 0; // determine the new section
var j_tester = -1; // placeholder for previous section scrolled through


let box = document.querySelector('div#scroll-menu');
let box_width = box.clientWidth;

$(window).scroll(function () {
    if ($(window).scrollTop() >= 50) {
        // $('nav').addClass('fixed');
        $('section').each(function (i) {
            // console.log($(window).scrollTop() - $(this).position().top)
            if ($(this).position().top <= $(window).scrollTop() + 80) {
                if (prev_i >= i) {
                    if (j_tester !== prev_i) {
                        // console.log(prev_i)
                        if (screen.width < 768) {
                            if (j_tester < prev_i) {
                                // scrolling down
                                $('.scroll-menu').animate({
                                    scrollLeft: box_width * 0.23 * (prev_i)
                                }, 300);
                            } else if (j_tester > prev_i) {
                                // scrolling up
                                $('.scroll-menu').animate({
                                    scrollLeft: box_width * 0.23 * (prev_i)
                                }, 300);
                            }
                        }

                        $('nav a[data-scroll].active').removeClass('active');
                        $('nav a[data-scroll]').eq(prev_i).addClass('active');

                        j_tester = prev_i;
                    }
                }
                prev_i = i;
            }
        });

    } else {
        // $('nav').removeClass('fixed');
        $('nav a[data-scroll].active').removeClass('active');
        $('nav a[data-scroll]:first').addClass('active');
    }


    // if ($('section#vaccine-distribution').offset().top - $(window).scrollTop() > 20) {
    //     $('.scroll-menu').animate({
    //         scrollLeft: 0
    //     }, 500);
    // }
    // console.log($('section#news-section').offset().top - $(window).scrollTop() === 20)
    // if ($('section#news-section').offset().top - $(window).scrollTop() === 20) {
    //     $('.scroll-menu').animate({
    //         scrollLeft: box_width * 0.6
    //     }, 500);
    // }
});
$('nav a[data-scroll]').on('click', function() {

    var scrollAnchor = $(this).attr('data-scroll'),
        scrollPoint = $('section[data-anchor="' + scrollAnchor + '"]').offset().top - 55;

    // var scrollLeftPoint = $('a.style-a.active').offset().left;
    // console.log(scrollLeftPoint)

    $('body,html').animate({
        scrollTop: scrollPoint
    }, 500);

    // $('.scroll-menu').animate({
    //     scrollLeft: scrollLeftPoint
    // }, 500);

    return false;
})

