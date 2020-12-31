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

        const linkElem3 = document.createElement('link');
        linkElem3.setAttribute('rel', 'stylesheet');
        linkElem3.setAttribute('href', '../static/css/all.css');
        shadow.appendChild(linkElem3);

        // the outer most div
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
        img_wrapper.setAttribute('class', 'img_wrapper')

        // logo image
        // Note: typeof data-img is string, not array (despite having brackets)
        if (this.getAttribute('data-img') !== '[]' && this.getAttribute('data-img') !== 'None') {
            const imgUrlArr = this.getAttribute('data-img').split(',')
            imgUrlArr.forEach((imgUrl) => {
                imgUrl = imgUrl.replace(/\s|\'|\]|\[/g, '');
                const image = new Image();
                image.setAttribute('height', '60px');
                image.setAttribute('class', 'company-logo-image')
                image.src = imgUrl;
                img_wrapper.appendChild(image);

            })
        } else {
            img_wrapper.setAttribute('style', 'height: 70px');
        }
        wrapper.appendChild(img_wrapper)


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
        pbar5.innerHTML = 'APPROVED';

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

        var pbar8 = document.createElement('div');
        pbar8.setAttribute('class', 'progress-bar');
        pbar8.setAttribute('id', 'abandoned');
        pbar8.setAttribute('style', 'width: ' + (100 - (parseInt(this.getAttribute('data-stage')) + 1) * 20) + "%");
        pbar8.innerHTML = 'ABANDONED';

        var pbar9 = document.createElement('div');
        pbar9.setAttribute('class', 'progress-bar');
        pbar9.setAttribute('id', 'paused');
        pbar9.innerHTML = 'PAUSED';

        if (this.getAttribute('data-stage') >= 0)
            bar_wrapper.appendChild(pbar1);

        if (this.getAttribute('data-stage') >= 1)
            bar_wrapper.appendChild(pbar2);

        if (this.getAttribute('data-stage') >= 2)
            bar_wrapper.appendChild(pbar3);

        if (this.getAttribute('data-stage') >= 3)
            bar_wrapper.appendChild(pbar4);

        if (this.getAttribute('data-stage') == 4) {
            bar_wrapper.appendChild(pbar5);
        }
        else {
            if (this.getAttribute('data-early') === 'True') {
                bar_wrapper.appendChild(pbar7);
            }
        }

        if(this.getAttribute('data-abandoned') === 'True')
            bar_wrapper.appendChild(pbar8);

        if(this.getAttribute('data-paused') === 'True')
            bar_wrapper.appendChild(pbar9);

        wrapper.appendChild(bar_wrapper);

        var displayButton = Boolean(false);

        if (this.getAttribute('data-stage') == 4 && this.getAttribute('data-approved-countries') !== 'None' && this.getAttribute('data-approved-countries') !== '') {
            var approved_countries = document.createElement('p');
            approved_countries.setAttribute('class', 'approved-countries');
            approved_countries.innerHTML = "<span class='highlight-warp-speed' id='pbar5' style='color: white; margin: 0;'><i class=\"fas fa-check-circle\"></i> Approved Countries</span>&nbsp;" + this.getAttribute('data-approved-countries');
            wrapper.appendChild(approved_countries);
            // displayButton = true;
        }

        if (this.getAttribute('data-early') === 'True' && this.getAttribute('data-limited-countries') !== 'None' && this.getAttribute('data-limited-countries') !== '') {
            var limited_countries = document.createElement('p');
            limited_countries.setAttribute('class', 'approved-countries');
            limited_countries.innerHTML = "<span class='highlight-warp-speed' id='early' style='color: white; margin: 0;'><i class=\"far fa-check-circle\"></i> Limited Use Countries</span>&nbsp;" + this.getAttribute('data-limited-countries');
            wrapper.appendChild(limited_countries);
            // displayButton = true;
        }

        // vaccine info
        if (this.getAttribute('data-candidate') !== 'None' && this.getAttribute('data-candidate') !== '') {
            var candidate_name = document.createElement('p');
            candidate_name.setAttribute('class', 'info-tag');
            candidate_name.innerHTML = "<b>Candidate Name: </b>" + this.getAttribute('data-candidate');
            wrapper.appendChild(candidate_name);
            displayButton = true;
        }

        if (this.getAttribute('data-efficacy') !== 'None' && this.getAttribute('data-efficacy') !== 'Unknown' && this.getAttribute('data-efficacy') !== '') {
            var efficacy = document.createElement('p');
            efficacy.setAttribute('class', 'info-tag');
            efficacy.innerHTML = "<b>Efficacy: </b>" + this.getAttribute('data-efficacy');
            wrapper.appendChild(efficacy);
            displayButton = true;
        }

        if (this.getAttribute('data-dose') !== 'None' && this.getAttribute('data-dose') !== '') {
            var dose = document.createElement('p');
            dose.setAttribute('class', 'info-tag');
            dose.innerHTML = "<b>Dose: </b>" + this.getAttribute('data-dose');
            wrapper.appendChild(dose);
            displayButton = true;
        }

        if (this.getAttribute('data-injection-type') !== 'None' && this.getAttribute('data-injection-type') !== '') {
            var injection_type = document.createElement('p');
            injection_type.setAttribute('class', 'info-tag');
            injection_type.innerHTML = "<b>Injection Type: </b>" + this.getAttribute('data-injection-type');
            wrapper.appendChild(injection_type);
            displayButton = true;
        }

        if (this.getAttribute('data-trial-size') !== 'None' && this.getAttribute('data-trial-size') !== '') {
            var trial_size = document.createElement('p');
            trial_size.setAttribute('class', 'info-tag');
            trial_size.innerHTML = "<b>Trial Size: </b>" + this.getAttribute('data-trial-size');
            wrapper.appendChild(trial_size);
            // displayButton = true;
        }

        if (this.getAttribute('data-storage') !== 'None' && this.getAttribute('data-storage') !== '') {
            var storage = document.createElement('p');
            storage.setAttribute('class', 'info-tag');
            storage.innerHTML = "<b>Storage Requirements: </b>" + this.getAttribute('data-storage');
            wrapper.appendChild(storage);
            displayButton = true;
        }

        if (this.getAttribute('data-side-effects') !== 'None' && this.getAttribute('data-side-effects') !== '') {
            var side_effects = document.createElement('p');
            side_effects.setAttribute('class', 'info-tag');
            // side_effects.style.color = "crimson";
            side_effects.innerHTML = "<b>Side Effects: </b>" + this.getAttribute('data-side-effects');
            wrapper.appendChild(side_effects);
            // displayButton = true;
        }

        // short company intro
        var text = document.createElement('p');
        text.setAttribute('class', 'intro intro-mobile-font');
        text.innerHTML = this.getAttribute('data-intro');
        if (displayButton){
            text.style.display = "none";
        }
        wrapper.appendChild(text);

        var latest_news_title = document.createElement('b');
        latest_news_title.setAttribute('class', 'intro intro-mobile-font');
        latest_news_title.setAttribute('style', 'color:purple;');
        latest_news_title.innerHTML = "Latest News:";


        // latest news section
        var latest_news = document.createElement('p');
        latest_news.setAttribute('class', 'intro intro-mobile-font');
        latest_news.setAttribute('style', 'color:purple;');
        latest_news.innerHTML = this.getAttribute('data-news');

        // wrapper.appendChild(text);
        if (this.getAttribute('data-news') !== 'None' && this.getAttribute('data-news') !== '') {
            // wrapper.appendChild(line_break);
            if (displayButton) {
                latest_news_title.style.display = "none";
                latest_news.style.display = "none";
            }
            wrapper.appendChild(latest_news_title);
            wrapper.appendChild(latest_news);
        }

        // button to learn more
        if (displayButton) {
            var btn = document.createElement('button');
            btn.setAttribute('class', 'card-collapsible');
            btn.setAttribute('type', 'button');
            btn.innerHTML = 'Learn More';
            wrapper.appendChild(btn);

            btn.addEventListener("click", function () {
                // this.classList.toggle("active");
                if (text.style.display === "block") {
                    text.style.display = "none";
                    latest_news_title.style.display = "none";
                    latest_news.style.display = "none";
                    btn.innerHTML = "Learn More"
                    // document.get
                } else {
                    text.style.display = "block";
                    latest_news_title.style.display = "block";
                    latest_news.style.display = "block";
                    btn.innerHTML = "Show Less";
                }
            });
        }


        if (this.getAttribute('data-date') !== 'None') {
            var update_time = document.createElement('span');
            update_time.setAttribute('class', 'date intro-mobile-font');
            // var update_time_text = " Updated " + this.getAttribute('data-date');
            var update_time_text;
            if (displayButton)
                update_time_text = "<br>&nbsp;&nbsp;Updated " + this.getAttribute('data-date');
            else
                update_time_text = " Updated " + this.getAttribute('data-date');

            update_time.innerHTML = update_time_text;
            wrapper.appendChild(update_time);
        }


        //
        // var content = document.createElement('a');
        // //
        // var url = this.getAttribute('data-expand');
        // content.setAttribute("href", url);
        // content.innerHTML = url;
        // // content.innerHTML ='Some collapsible content. Click the button to toggle between showing and hiding the collapsible content. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
        // content.setAttribute('class', 'content');

        // wrapper.appendChild(content);
        //
        // //toggle


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
        if (this.getAttribute('news-tag').toLowerCase() === "New".toLowerCase()) {
            news_tag.setAttribute('id', 'news_tag_new');
        }
        if (this.getAttribute('news-tag').toLowerCase() === "Breaking News".toLowerCase()) {
            news_tag.setAttribute('id', 'news_tag_breaking_news');
        }
        if (this.getAttribute('news-tag').toLowerCase() === "Top".toLowerCase()) {
            news_tag.setAttribute('id', 'news_tag_top');
        }
        if (this.getAttribute('news-tag').toLowerCase() === "About this Website".toLowerCase()) {
            news_tag.setAttribute('id', 'news_tag_about');
        }
        news_tag.innerHTML = this.getAttribute('news-tag');
        if (this.getAttribute('news-tag') != 'None' && this.getAttribute('news-tag') != '') {
            list.appendChild(news_tag);
        }


        // News Text
        var news_text = document.createElement('span');

        var news_company_text = this.getAttribute('news-company');
        var found = Boolean(false);
        if (this.getAttribute('news-text').includes(news_company_text)){
            found = true;
        }
        else {
            // Handle exception: news-company is not None but not in news-text because of format issues of NYTimes news
            const company_array = news_company_text.split(', ')
            for (const [index, company] of company_array.entries()){
                if (!this.getAttribute('news-text').includes(company))
                    break
                if (index === company_array.length - 1){
                    found = true
                    var index_1 = this.getAttribute('news-text').indexOf(company_array[0])
                    var index_2 = this.getAttribute('news-text').indexOf(company_array[company_array.length - 1]) + company_array[company_array.length - 1].length
                    news_company_text = this.getAttribute('news-text').slice(index_1, index_2)
                }
            }
        }
        if (this.getAttribute('news-category') === 'S') {
            if (news_company_text != 'None' && found === true) {
                const newsArray = this.getAttribute('news-text').split(news_company_text);
                var news_before = document.createElement('span');
                news_before.innerHTML = " " + newsArray[0];
                news_text.appendChild(news_before);

                var news_company = document.createElement('span');
                news_company.innerHTML = news_company_text;
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
                news_after.innerHTML = newsArray[1] + " ";
                // console.log(newsArray)
                news_text.appendChild(news_after);
            } else {
                news_text.innerHTML = " " + this.getAttribute('news-text') + " ";
            }
            list.appendChild(news_text);
        }
        else if (this.getAttribute('news-category') === 'G') {
            var link = document.createElement('a');
            if (this.getAttribute('news-link') != 'None' && this.getAttribute('news-link') != '') {
                link.href = this.getAttribute('news-link');
                link.target = "_blank";
                link.setAttribute('style', 'font-weight: bold;')
            }
            link.innerHTML = " " + this.getAttribute('news-text') + " ";
            news_text.appendChild(link);
            list.appendChild(news_text);

            var source = document.createElement('span');
            source.setAttribute('class', 'source');
            // source.setAttribute('style', 'text-transform: uppercase; font-size')
            source.innerHTML = this.getAttribute('news-source').replaceAll(' ', '&nbsp;');
            list.appendChild(source);
        }
        // list.appendChild(news_text);

        // var source = document.createElement('span');
        // source.setAttribute('class', 'source');
        // // source.setAttribute('style', 'text-transform: uppercase; font-size')
        // source.innerHTML = this.getAttribute('news-source').replaceAll(' ', '&nbsp;');
        // list.appendChild(source);

        // Append Date
        var date = document.createElement('span');
        date.setAttribute('class', 'date');
        date.innerHTML = this.getAttribute('news-date').replace('  ', '&nbsp;')
        list.appendChild(date);

        shadow.appendChild(list);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('latest-news', news);