class myCard extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({mode: 'open'});

        // link css
        const linkElem1 = document.createElement('link');
        linkElem1.setAttribute('rel', 'stylesheet');
        linkElem1.setAttribute('href', '../static/css/card.css');
        shadow.appendChild(linkElem1);

        const linkElem2 = document.createElement('link');
        linkElem2.setAttribute('rel', 'stylesheet');
        linkElem2.setAttribute('href', '../static/css/bootstrap.css');
        shadow.appendChild(linkElem2);

        // the outter most div
        var wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'wrapper');

        // tag wrapper
        var tag_wrapper = document.createElement('div');
        tag_wrapper.setAttribute('class', 'tag_wrapper');

        // country tag
        // #e37222'
        if (this.getAttribute('data-country') !== '') {
            var countryArr = this.getAttribute('data-country').split(',')
            if (window.screen.width >= 768) {
                countryArr = countryArr.reverse()
            }
            countryArr.forEach((country) => {
                // country = country.trim();
                var country_tag = document.createElement('span');
                country_tag.setAttribute('class', 'country_tag');
                country_tag.setAttribute('style', 'background-color:rgba(236, 112, 30, 0.74)');
                country_tag.innerHTML = country.trim();
                tag_wrapper.appendChild(country_tag);
            })
        }


        if (this.getAttribute('data-vactype') !== '') {
            // vaccine type tag
            var vac_tag = document.createElement('span');
            vac_tag.setAttribute('class', 'vac_tag');
            // vac_tag.setAttribute('padding-top','30px');
            vac_tag.setAttribute('style', 'background-color:rgba(182, 131, 236, 0.74)');
            vac_tag.innerHTML = this.getAttribute('data-vactype') + " Vaccine";
            tag_wrapper.appendChild(vac_tag);
        }

        wrapper.appendChild(tag_wrapper);

        var img_wrapper = document.createElement('div');
        img_wrapper.setAttribute('style', 'height: 70px')
        // logo image
        if (this.hasAttribute('data-img')) {
            const imgUrlArr = this.getAttribute('data-img').split(',')
            imgUrlArr.forEach((imgUrl) => {
                imgUrl = imgUrl.replace(/\s|\'|\]|\[/g, '');
                const image = new Image();
                image.setAttribute('height', '60px');
                image.src = imgUrl;
                img_wrapper.appendChild(image);


            })
        }
        wrapper.appendChild(img_wrapper)
        // else {
        //     let imgUrl = '../static/img/Untitled.png';
        //     const img = document.createElement('img');
        //     img.setAttribute('height', '40px');
        //     img.src = imgUrl;
        //     wrapper.appendChild(img);
        // }

        // progress bar
        var bar_wrapper = document.createElement('div');
        bar_wrapper.setAttribute('class', 'progress');
        bar_wrapper.setAttribute('style', 'height:55px');

        var pbar1 = document.createElement('div');
        pbar1.setAttribute('class', 'progress-bar');
        pbar1.setAttribute('id', 'pbar1');
        pbar1.innerHTML = 'PRECLINICAL';


        var pbar2 = document.createElement('div');
        pbar2.setAttribute('class', 'progress-bar');
        pbar2.setAttribute('id', 'pbar2');
        pbar2.innerHTML = 'PHASE I';

        var pbar3 = document.createElement('div');
        pbar3.setAttribute('class', 'progress-bar');
        pbar3.setAttribute('id', 'pbar3');
        pbar3.innerHTML = 'PHASE II';

        var pbar4 = document.createElement('div');
        pbar4.setAttribute('class', 'progress-bar');
        pbar4.setAttribute('id', 'pbar4');
        pbar4.innerHTML = 'PHASE III';

        var pbar5 = document.createElement('div');
        pbar5.setAttribute('class', 'progress-bar');
        pbar5.setAttribute('id', 'pbar5');
        pbar5.innerHTML = 'APPROVAL';

        var pbar6 = document.createElement('div');
        pbar6.setAttribute('class', 'progress-bar');
        pbar6.setAttribute('id', 'pbar5');
        // pbar6.setAttribute('style', 'width: 0%')
        pbar6.innerHTML = 'EARLY APPROVAL';

        var pbar7 = document.createElement('div');
        pbar7.setAttribute('class', 'progress-bar');
        pbar7.setAttribute('id', 'early');
        // pbar6.setAttribute('style', 'width: 10%')
        pbar7.innerHTML = 'LIMITED USE';

        if (this.getAttribute('data-stage') >= 0)
            bar_wrapper.appendChild(pbar1);

        if (this.getAttribute('data-stage') >= 1)
            bar_wrapper.appendChild(pbar2);

        if (this.getAttribute('data-stage') >= 2)
            bar_wrapper.appendChild(pbar3);

        if (this.getAttribute('data-stage') >= 3)
            bar_wrapper.appendChild(pbar4);

        if (this.getAttribute('data-stage') == 4)
            bar_wrapper.appendChild(pbar5);

        if (this.getAttribute('data-id') === '29' || this.getAttribute('data-id') === '12' || this.getAttribute('data-id') === '28' || this.getAttribute('data-id') === '35' || this.getAttribute('data-id') === '13' || this.getAttribute('data-id') === '119') {
            bar_wrapper.appendChild(pbar7);
        }

        // if (this.getAttribute('data-id') === '13'){
        //     bar_wrapper.appendChild(pbar6);
        // }


        // if (this.getAttribute('data-stage') === '0') {
        //     bar_wrapper.appendChild(pbar1);
        // }
        //
        // else if (this.getAttribute('data-stage') === '1') {
        //     bar_wrapper.appendChild(pbar1);
        //     bar_wrapper.appendChild(pbar2);
        // }
        //
        // else if (this.getAttribute('data-stage') === '2') {
        //     bar_wrapper.appendChild(pbar1);
        //     bar_wrapper.appendChild(pbar2);
        //     bar_wrapper.appendChild(pbar3);
        // }
        //
        // else if (this.getAttribute('data-stage') === '3') {
        //     bar_wrapper.appendChild(pbar1);
        //     bar_wrapper.appendChild(pbar2);
        //     bar_wrapper.appendChild(pbar3);
        //     bar_wrapper.appendChild(pbar4);
        // }
        //
        // if (this.getAttribute('data-stage') === '4') {
        //     bar_wrapper.appendChild(pbar1);
        //     bar_wrapper.appendChild(pbar2);
        //     bar_wrapper.appendChild(pbar3);
        //     bar_wrapper.appendChild(pbar4);
        //     bar_wrapper.appendChild(pbar5);
        // }
        //
        // if (this.getAttribute('data-stage') === '5') {
        //     bar_wrapper.appendChild(pbar1);
        //     bar_wrapper.appendChild(pbar6);
        // }

        wrapper.appendChild(bar_wrapper);

        // short company intro
        var text = document.createElement('p');
        text.setAttribute('class', 'intro intro-mobile-font');
        // text.setAttribute('style', 'text-align:justify');
        // if (this.getAttribute('data-stage') != 0)
        text.innerHTML = this.getAttribute('data-intro');
        // else
        //     text.setAttribute('style', 'margin-bottom:2rem');
        wrapper.appendChild(text);

        var latest_news_title = document.createElement('b');
        latest_news_title.setAttribute('class', 'intro intro-mobile-font');
        latest_news_title.setAttribute('style', 'color:purple;');
        latest_news_title.innerHTML = "Latest News:";

        // var line_break = document.createElement('br');

        // short company intro
        var latest_news = document.createElement('p');
        latest_news.setAttribute('class', 'intro intro-mobile-font');
        latest_news.setAttribute('style', 'color:purple;');
        latest_news.innerHTML = this.getAttribute('data-news');

        // wrapper.appendChild(text);
        if (this.getAttribute('data-news') !== 'None') {
            // wrapper.appendChild(line_break);
            wrapper.appendChild(latest_news_title);
            wrapper.appendChild(latest_news);
        }

        if (this.getAttribute('data-date') !== 'None') {
            var update_time = document.createElement('span');
            update_time.setAttribute('class', 'date intro-mobile-font');
            update_time.innerHTML = " Updated " + this.getAttribute('data-date');
            wrapper.appendChild(update_time);
        }

        // button to learn more
        var btn = document.createElement('button');
        btn.setAttribute('class', 'collapsible');
        btn.setAttribute('type', 'button');
        btn.innerHTML = 'Learn More';

        var content = document.createElement('a');

        var url = this.getAttribute('data-expand');
        content.setAttribute("href", url);
        content.innerHTML = url;
        // content.innerHTML ='Some collapsible content. Click the button to toggle between showing and hiding the collapsible content. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
        content.setAttribute('class', 'content');
        // wrapper.appendChild(btn);
        // wrapper.appendChild(content);

        //toggle
        btn.addEventListener("click", function () {
            this.classList.toggle("active");
            if (content.style.display === "block") {
                content.style.display = "none";
                // document.get
            } else {
                content.style.display = "block";
            }
        });


        shadow.appendChild(wrapper);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('my-card', myCard);


// class instDetail extends HTMLElement extends HTMLUListElement{
//     constructor() {
//         const shadow = this.attachShadow({ mode: 'open' });
//         const linkElem = document.createElement('link');
//         linkElem.setAttribute('rel', 'stylesheet');
//         linkElem.setAttribute('href', '../static/css/card.css');



//         shadow.appendChild(linkElem);
//     }
// }
// customElements.define('my-expandInfo', instDetail, { extends: "ul" });



class news extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        // link css
        const linkElem1 = document.createElement('link');
        linkElem1.setAttribute('rel', 'stylesheet');
        linkElem1.setAttribute('href', '../static/css/style.css');
        shadow.appendChild(linkElem1);

        const linkElem2 = document.createElement('link');
        linkElem2.setAttribute('rel', 'stylesheet');
        linkElem2.setAttribute('href', '../static/css/bootstrap.css');
        shadow.appendChild(linkElem2);

        const linkElem3 = document.createElement('link');
        linkElem3.setAttribute('rel', 'stylesheet');
        linkElem3.setAttribute('href', '../static/css/card.css');
        shadow.appendChild(linkElem3);


        // list news
        var list = document.createElement('li');
        list.setAttribute('class', 'news-text');

        // news tag
        var news_tag = document.createElement('b');
        news_tag.setAttribute('class', 'news_tag');
        if (this.getAttribute('news-tag') == 'New') {
            news_tag.setAttribute('id', 'news_tag_new');
        }
        if (this.getAttribute('news-tag') == "Breaking News") {
            news_tag.setAttribute('id', 'news_tag_breaking_news');
        }
        if (this.getAttribute('news-tag') == "Top") {
            news_tag.setAttribute('id', 'news_tag_top');
        }
        if (this.getAttribute('news-tag') == "About this Website") {
            news_tag.setAttribute('id', 'news_tag_about');
        }
        news_tag.innerHTML = this.getAttribute('news-tag');
        if (this.getAttribute('news-tag') != 'None') {
            list.appendChild(news_tag);
        }



        // News Text
        var news_text = document.createElement('span');

        if (this.getAttribute('news-company') != 'None' && this.getAttribute('news-text').includes(this.getAttribute('news-company'))) {
            const newsArray = this.getAttribute('news-text').split(this.getAttribute('news-company'));
            var news_before = document.createElement('span');
            news_before.innerHTML = " " + newsArray[0];
            news_text.appendChild(news_before);
            var news_company = document.createElement('span');
            news_company.innerHTML = this.getAttribute('news-company');
            let vac_id = this.getAttribute('news-vac-id');
            if (vac_id !== '-1') {
                news_company.setAttribute('class', 'news-company')
                news_company.addEventListener('click', function () {
                    $.ajax({
                        url: "/display-company",
                        data: {'company_id': vac_id},
                        type: "GET",
                        success: function (response) {
                            // console.log(response)
                            document.getElementById('append-card').innerHTML = response;
                            $('#company-modal').modal('show');
                        },
                    });
                })
            }
            news_text.appendChild(news_company);
            var news_after = document.createElement('span');
            news_after.innerHTML = newsArray[1];
            // console.log(newsArray)
            news_text.appendChild(news_after);
        } else {
            news_text.innerHTML = " " + this.getAttribute('news-text');
        }
        list.appendChild(news_text);

        // Append Date
        var date = document.createElement('span');
        date.setAttribute('class', 'date');
        date.innerHTML = this.getAttribute('news-date');
        list.appendChild(date);

        shadow.appendChild(list);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('latest-news', news);