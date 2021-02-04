class developerCard extends HTMLElement {
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

        const linkElem4 = document.createElement('link');
        linkElem4.setAttribute('rel', 'stylesheet');
        linkElem4.setAttribute('href', '../static/css/style.css');
        shadow.appendChild(linkElem4);

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
            img_wrapper.setAttribute('style', 'height: 70px;');
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
            var approved_countries_count = this.getAttribute('data-approved-countries').replace(", ", ",").split(",").length
            approved_countries.setAttribute('class', 'approved-countries');
            approved_countries.innerHTML = "<span class='highlight-warp-speed' id='pbar5' style='color: white; margin: 0;'><i class=\"fas fa-check-circle\"></i> Approved Countries</span>&nbsp;" + "(" + approved_countries_count + ") <b>" + this.getAttribute('data-approved-countries').replaceAll('NEW', " <span class='badge badge-new'>New</span> ") + "</b>";
            wrapper.appendChild(approved_countries);
            // displayButton = true;
        }

        if (this.getAttribute('data-early') === 'True' && this.getAttribute('data-limited-countries') !== 'None' && this.getAttribute('data-limited-countries') !== '') {
            var limited_countries = document.createElement('p');
            var limited_countries_count = this.getAttribute('data-limited-countries').replace(", ", ",").split(",").length
            limited_countries.setAttribute('class', 'approved-countries');
            limited_countries.innerHTML = "<span class='highlight-warp-speed' id='early' style='color: white; margin: 0;'><i class=\"far fa-check-circle\"></i> Limited Use Countries</span>&nbsp;" + "(" + limited_countries_count + ") <b>" + this.getAttribute('data-limited-countries').replaceAll('NEW', " <span class='badge badge-new'>New</span> ") + "</b>";
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

        if (this.getAttribute('data-age-group') !== 'None' && this.getAttribute('data-age-group') !== '') {
            var age_group = document.createElement('p');
            age_group.setAttribute('class', 'info-tag');
            age_group.innerHTML = "<b>Age Group: </b>" + this.getAttribute('data-age-group');
            wrapper.appendChild(age_group);
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
customElements.define('my-card', developerCard);


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


        // news_tag.setAttribute('class', 'news_tag');
        // if (this.getAttribute('news-tag').toLowerCase() === "New".toLowerCase()) {
        //     news_tag.setAttribute('id', 'news_tag_new');
        // }
        // if (this.getAttribute('news-tag').toLowerCase() === "Breaking News".toLowerCase()) {
        //     news_tag.setAttribute('id', 'news_tag_breaking_news');
        // }
        // if (this.getAttribute('news-tag').toLowerCase() === "Top".toLowerCase()) {
        //     news_tag.setAttribute('id', 'news_tag_top');
        // }
        // if (this.getAttribute('news-tag').toLowerCase() === "About this Website".toLowerCase()) {
        //     news_tag.setAttribute('id', 'news_tag_about');
        // }
        // news_tag.innerHTML = this.getAttribute('news-tag');
        if (this.getAttribute('news-tag') !== 'None' && this.getAttribute('news-tag') !== '') {
            // news tag
            var news_tag = document.createElement('span');
            news_tag.className = "badge badge-" + this.getAttribute('news-tag').toLowerCase();
            news_tag.innerHTML = this.getAttribute('news-tag');
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
                    news_company.setAttribute('class', 'news-company anchor-text')
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


class stories extends HTMLElement {
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


        // var twitter_script = document.createElement('script');
        // twitter_script.src = '../static/js/library/twitter-widget.js';
        // shadow.appendChild(twitter_script);

        var story_tag = this.getAttribute('story-tag');

        var card = document.createElement('div');

        var tag = "";
        if (story_tag !== 'None' && story_tag !== '') {
            tag = "<span class=\"badge badge-" + story_tag.toLowerCase() + "\">" + story_tag + "</span>"
        }

        var card_title = "<h5 class=\"card-title\">" + tag + "\n" + this.getAttribute('story-title') + "</h5>"

        var cardBody = document.createElement('div')
        cardBody.className = "card-body";


        if (this.getAttribute('story-category') === 'S') {
            card.setAttribute('class', 'card horizontal-card mb-3 mx-auto')

            var row_ng = document.createElement('div')
            row_ng.setAttribute('class', 'row no-gutters')

            var imgCol = document.createElement('div')
            imgCol.setAttribute('class', 'col-md-4')

            var image = document.createElement('img')
            image.src = "../static/img/" + this.getAttribute('story-img')
            image.className = "card-img";

            imgCol.appendChild(image)

            var textCol = document.createElement('div')
            textCol.setAttribute('class', 'col-md-8')

            // var cardBody = document.createElement('div')
            // cardBody.className = "card-body";

            // var cardTitle = document.createElement('h5')
            // cardTitle.className = "card-title"
            //
            // cardTitle.innerHTML = tag + this.getAttribute('story-title')

            var body_text = "<p class=\"card-text\">" + this.getAttribute('story-body-text')+ "</p>"

            var card_source = ""
            if (this.getAttribute('story-source') !== 'None' && this.getAttribute('story-source') !== '') {
                card_source = "<p class=\"source\">" + this.getAttribute('story-source') + "</p>"
            }
            cardBody.innerHTML = card_title + body_text + card_source;

            textCol.appendChild(cardBody)

            var stretched_link = "<a href=\"" + this.getAttribute('story-link') + "\" class=\"stretched-link\"></a>"

            row_ng.appendChild(imgCol);
            row_ng.appendChild(textCol);
            row_ng.innerHTML += stretched_link;

            card.appendChild(row_ng);

        }
        else if (this.getAttribute('story-category') === 'V') {
            card.className = "card horizontal-card text-center mx-auto add-card-margin"

            var video = '<video width="100%" height="auto" controls controlsList="nodownload">\n' +
                '<source src="' + this.getAttribute('story-link') + '" type="video/mp4">\n' +
                'Your browser does not support the video tag.\n' +
                '</video>'

            cardBody.innerHTML = card_title + video

            card.appendChild(cardBody)

        }
        // else if (this.getAttribute('story-category') === 'T') {
        //
        //     card.setAttribute('class', 'card horizontal-card mx-auto text-center add-card-margin')
        //
        //     var target_container = document.getElementById("stories-container")
        //
        //     var t_card_body = document.createElement('div')
        //     t_card_body.setAttribute('class', 'card-body')
        //
        //     var t_card_title = document.createElement('h5')
        //     t_card_title.setAttribute('class', 'card-title')
        //
        //     if (this.getAttribute('story-tag') === "Fun") {
        //         var t_tag = "<span class='badge badge-info'>Fun</span>"
        //         t_card_title.innerHTML = t_tag + "\n" + this.getAttribute('story-title')
        //     } else {
        //         t_card_title.innerHTML = this.getAttribute('story-title')
        //     }
        //
        //     var t_body_content = this.getAttribute('story-body')
        //
        //     t_card_body.appendChild(t_card_title)
        //     t_card_body.innerHTML += t_body_content
        //
        //     if (this.getAttribute('story-body-text') !== 'None' && this.getAttribute('story-body-text') !== '') {
        //         var t_body_text = document.createElement('p')
        //         t_body_text.setAttribute('class', 'card-text')
        //         t_body_text.innerHTML = this.getAttribute('story-body-text')
        //         t_card_body.appendChild(t_body_text)
        //     }
        //
        //     card.appendChild(t_card_body)
        //     console.log(card)
        //     console.log(target_container)
        //     target_container.appendChild(card)
        //     target_container.appendChild(twitter_script)
        // }


        shadow.appendChild(card);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('people-and-stories', stories);




class localVaccinations extends HTMLElement {
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


        const countyName = this.getAttribute('vac-county');
        var countyWrapper = document.createElement('div')
        countyWrapper.setAttribute('class', 'card county-wrapper');

        var county_body = document.createElement('div')
        county_body.setAttribute('class', 'county-body card-body');

        var county_name = document.createElement('div')
        county_name.setAttribute('class', 'county-name card-title')
        county_name.innerHTML = "<h3 class='county'>" + countyName + " County</h3>";
        county_body.appendChild(county_name);


        var date = document.createElement('p')
        date.setAttribute('class', 'date')
        date.innerHTML = "Updated " + this.getAttribute('vac-date');
        county_body.appendChild(date);


        var phase_and_eligibility = document.createElement('div')
        let phase = this.getAttribute('vac-phase');
        phase_and_eligibility.innerHTML = "<b>Phase and Eligibility</b>: "
        if (phase !== "None" && phase!== "") {
            phase_and_eligibility.innerHTML += "<span class='badge badge-phase-" + phase + "'>Phase " + phase + "</span>"
        }
        phase_and_eligibility.innerHTML += "&nbsp;" + this.getAttribute('vac-eligibility') + " Visit <a class='county-link anchor-text' target='_blank' href='" + this.getAttribute('vac-appointment-website') + "'>the county's website</a> to see who is eligible."
        county_body.appendChild(phase_and_eligibility);

        var vaccination_facilities = document.createElement('div')
        vaccination_facilities.innerHTML =  "<b>Vaccination Facilities</b>: <a class='anchor-text' class='anchor-text' href='https://www.vaccinateca.com/counties/" + countyName.toLowerCase().replace(' ', '_') + "' target='_blank'>Find facilities administering COVID-19 vaccines in " + countyName + " County</a>"
        county_body.appendChild(vaccination_facilities);

        var info_link = document.createElement('div')
        info_link.innerHTML =  "<b>County Vaccination Info</b>: <a class='anchor-text' href='" + this.getAttribute('vac-info-website') + "' target='_blank'>Visit Vaccination Info Website</a>"
        county_body.appendChild(info_link);

        // var appointment_link = document.createElement('div')
        // appointment_link.innerHTML = "

        // county_body.appendChild(appointment_link);

        if (this.getAttribute('vac-notification') !== "None" && this.getAttribute('vac-notification')!== "") {
            var notification = document.createElement('div')
            notification.setAttribute('class', 'notification-website')
            notification.innerHTML = "Not currently eligible? Don't worry. " + countyName + " has enabled the vaccine notification system. <a class='anchor-text' class='county-link' target='_blank' href='" + this.getAttribute('vac-notification') + "'>Click here to sign up for notifications</a>"
            county_body.appendChild(notification);
        }

        // if (this.getAttribute('vac-administered') !== "None" && this.getAttribute('vac-administered')!== "") {
        //     var total_administered = document.createElement('div')
        //     total_administered.className = "county-doses-administered"
        //     total_administered.innerHTML = "<b>Total Doses Administered</b>: " + parseInt(this.getAttribute('vac-administered')).toLocaleString();
        //     county_body.appendChild(total_administered);
        // }
        //
        // if (this.getAttribute('vac-distributed') !== "None" && this.getAttribute('vac-distributed')!== "") {
        //     var total_distributed = document.createElement('div')
        //     total_distributed.innerHTML = "<b>Total Doses Distributed</b>: " + parseInt(this.getAttribute('vac-distributed')).toLocaleString();
        //     county_body.appendChild(total_distributed);
        // }

        let population = parseInt(this.getAttribute('population'));
//         if (this.getAttribute('total-cases') !== "None" && this.getAttribute('total-cases')!== "") {
//             let total_cases = parseInt(this.getAttribute('total-cases')).toLocaleString();
//             let total_cases_per_100 = parseFloat(this.getAttribute('total-cases') / population).toFixed(2)
//             // if (doses_distributed === "NaN")
//             //     doses_distributed = "-"
//             // let doses_distributed_per_100 = parseFloat(this.getAttribute('vac-distributed') / population).toFixed(2)
//             // if (doses_distributed_per_100 === "NaN")
//             //     doses_distributed_per_100 = "-"
//
//             var cases_table = document.createElement('div')
//             cases_table.className = "county-vaccination-table";
//
//             cases_table.innerHTML = "<b>Cases:</b>" + `
//             <table class="table text-center">
//                 <thead>
//                     <tr>
// <!--                        <th scope="col">County</th>-->
//                         <th scope="col">Cases</th>
//       <!--                   <th scope="col">Doses Available</th> -->
//                         <th scope="col">Cases Per 100 People</th>
//       <!--                   <th scope="col">Available Per 100 People</th> -->
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr>
//                         <!-- <td>` + countyName + `</td>-->
//                         <td style="color: rgb(241,21,72)">` + total_cases + `</td>
//                         <td style="color: rgb(241,21,72)">` + total_cases_per_100 + `</td>
//
//                     </tr>
//                 </tbody>
//             </table>
//                     `
//
//             county_body.appendChild(cases_table)
//         }
        let total_administered = parseInt(this.getAttribute('vac-administered'));
        let administered_1 = parseInt(this.getAttribute('vac-administered-1'));
        let administered_2 = parseInt(this.getAttribute('vac-administered-2'));

        if (isNaN(administered_1) && !(isNaN(total_administered) && isNaN(administered_2)))
            administered_1 = total_administered - administered_2
        if (isNaN(administered_2) && !(isNaN(total_administered) && isNaN(administered_1)))
            administered_2 = total_administered - administered_1
        if (isNaN(total_administered) && !(isNaN(administered_1) && isNaN(administered_2)))
            total_administered = administered_1 + administered_2

        if (!isNaN(total_administered) && !isNaN(administered_1) && !isNaN(administered_2)) {
            let population_given_dose_1 = ((administered_1 / population) * 100).toFixed(2) + "%";
            let population_given_dose_2 = ((administered_2 / population) * 100).toFixed(2) + "%";

            let doses_distributed = parseInt(this.getAttribute('vac-distributed')).toLocaleString();
            if (doses_distributed === "NaN")
                doses_distributed = "-"
            let doses_distributed_per_100 = parseFloat(this.getAttribute('vac-distributed') / population).toFixed(2)
            if (doses_distributed_per_100 === "NaN")
                doses_distributed_per_100 = "-"

            let supply_used = ((parseInt(this.getAttribute('vac-administered')) / parseInt(this.getAttribute('vac-distributed'))) * 100).toFixed(2) + "%";
            if (supply_used === "NaN%")
                supply_used = "-"

            var vaccination_table = document.createElement('div')
            vaccination_table.className = "county-vaccination-table";
            vaccination_table.style.overflowX = "auto";
            // vaccination_table.style.width = "100%";

            vaccination_table.innerHTML = "<b>Vaccinations:</b>" + `
            <table class="table text-center county-table" style='margin-left: auto;margin-right: auto;'>
                <thead>
                    <tr class='local-vaccination-table-head'>
<!--                        <th scope="col">County</th>-->
                        <th style="background-color: rgb(100,208,138)" scope="col">Doses Administered</th>
                        <th style="background-color: rgb(147,201,248)" scope="col">Doses Given Per 100 People</th>
                        <th style="background-color: rgb(212,245,224)" scope="col">Population Given At Least 1 Dose</th>
                        <th style="background-color: rgb(111,217,168)" scope="col">Population Fully Vaccinated</th>
                        <!--<th scope="col">Doses Available</th> -->
                      
                        <!--<th scope="col">Available Per 100 People</th>-->
                        <!--<th style='background-color: rgb(147, 201, 248)' scope="col">Supply Used</th>-->
                    </tr>
                </thead>
                <tbody>
                    <tr style='font-weight: bold;'>
                        <!-- <td>` + countyName + `</td>-->
                        <td style="color: rgb(7, 158, 138)">` + parseInt(this.getAttribute('vac-administered')).toLocaleString() + `</td>
                        <!--<td style="color: #016254">` + doses_distributed + `</td> -->
                        <td style="color: rgb(14, 112, 196)">` + parseFloat(this.getAttribute('vac-administered') / population).toFixed(2) + `</td>
                        <td style="color: rgb(42, 145, 114)">` + population_given_dose_1 + `</td>
                        <td style="color: rgb(7, 158, 138)">` + population_given_dose_2 + `</td>
                        <!--<td style="color: #016254">` + doses_distributed_per_100 + `</td> -->
                        <!--<td style="color: rgb(14, 112, 196)">` + supply_used + `</td>-->

                    </tr>
                </tbody>
            </table>
                    `

            county_body.appendChild(vaccination_table)
        }


        if (this.getAttribute('vac-body') !== "None" && this.getAttribute('vac-body')!== "") {
            var county_body_content = document.createElement('div')
            county_body_content.className = "county-body-content"
            county_body_content.innerHTML = this.getAttribute('vac-body');
            county_body.appendChild(county_body_content);
        }


        countyWrapper.appendChild(county_body)


        shadow.appendChild(countyWrapper);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('local-vaccinations', localVaccinations);



class newsAPI extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({mode: 'open'});

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


        // var story_tag = this.getAttribute('story-tag');

        var card = document.createElement('div');

        var local_tag = this.getAttribute('local-tag')
        var tag = "";
        if (local_tag !== 'None' && local_tag !== '') {
            tag = "<span class=\"badge badge-" + local_tag.toLowerCase() + "\">" + local_tag + "</span>"
        }
        // if (story_tag !== 'None' && story_tag !== '') {
        //     tag = "<span class=\"badge badge-" + story_tag.toLowerCase() + "\">" + story_tag + "</span>"
        // }

        var card_title = "<h5 class=\"card-title\">" + tag + "\n" + this.getAttribute('local-title') + "</h5>"

        var cardBody = document.createElement('div')
        cardBody.className = "card-body";


        // if (this.getAttribute('story-category') === 'S') {
        card.setAttribute('class', 'card horizontal-card mb-3 mx-auto county-news-wrapper')

        var row_ng = document.createElement('div')
        row_ng.className = 'row no-gutters';

        var textCol = document.createElement('div');

        var content = ""
        if (this.getAttribute('local-content') !== "None" && this.getAttribute('local-content') !== "") {
            content = "<p class=\"card-text\">" + this.getAttribute('local-content') + "</p>"
        }

        var card_source = "";
        if (this.getAttribute('local-source') !== 'None' && this.getAttribute('local-source') !== '') {
            card_source = "<p class=\"source\">" + this.getAttribute('local-source') + "</p>"
        }

        // var card_time = ""
        // if (this.getAttribute('local-time') !== 'None' && this.getAttribute('local-time') !== '') {
        //     card_time = "<p class=\"date\">" + this.getAttribute('local-time') + "</p>"
        // }

        cardBody.innerHTML = card_title + content + card_source;

        textCol.appendChild(cardBody);

        if (this.getAttribute('local-img') !== "None" && this.getAttribute('local-img') !== "") {
            var imgCol = document.createElement('div')
            imgCol.className = 'col-md-2 col-3';

            var image = document.createElement('img')
            image.src = this.getAttribute('local-img')
            image.className = "card-img";

            imgCol.appendChild(image);
            row_ng.appendChild(textCol);
            row_ng.appendChild(imgCol);

            textCol.setAttribute('class', 'col-md-10 col-9');
        } else {
            textCol.setAttribute('class', 'col-12');
            row_ng.appendChild(textCol);
        }


        // var cardBody = document.createElement('div')
        // cardBody.className = "card-body";

        // var cardTitle = document.createElement('h5')
        // cardTitle.className = "card-title"
        //
        // cardTitle.innerHTML = tag + this.getAttribute('local-title')

        var stretched_link = "<a href=\"" + this.getAttribute('local-url') + "\" class=\"stretched-link\" target='_blank'></a>"


        row_ng.innerHTML += stretched_link;

        card.appendChild(row_ng)

        // }
        // else if (this.getAttribute('story-category') === 'V') {
        //     card.className = "card horizontal-card text-center mx-auto add-card-margin"
        //
        //     var video = '<video width="100%" height="auto" controls controlsList="nodownload">\n' +
        //         '<source src="' + this.getAttribute('story-link') + '" type="video/mp4">\n' +
        //         'Your browser does not support the video tag.\n' +
        //         '</video>'
        //
        //     cardBody.innerHTML = card_title + video
        //
        //     card.appendChild(cardBody)
        //
        // }
        // else if (this.getAttribute('story-category') === 'T') {
        //
        //     card.setAttribute('class', 'card horizontal-card mx-auto text-center add-card-margin')
        //
        //     var target_container = document.getElementById("stories-container")
        //
        //     var t_card_body = document.createElement('div')
        //     t_card_body.setAttribute('class', 'card-body')
        //
        //     var t_card_title = document.createElement('h5')
        //     t_card_title.setAttribute('class', 'card-title')
        //
        //     if (this.getAttribute('story-tag') === "Fun") {
        //         var t_tag = "<span class='badge badge-info'>Fun</span>"
        //         t_card_title.innerHTML = t_tag + "\n" + this.getAttribute('local-title')
        //     } else {
        //         t_card_title.innerHTML = this.getAttribute('local-title')
        //     }
        //
        //     var t_body_content = this.getAttribute('story-body')
        //
        //     t_card_body.appendChild(t_card_title)
        //     t_card_body.innerHTML += t_body_content
        //
        //     if (this.getAttribute('story-body-text') !== 'None' && this.getAttribute('story-body-text') !== '') {
        //         var t_body_text = document.createElement('p')
        //         t_body_text.setAttribute('class', 'card-text')
        //         t_body_text.innerHTML = this.getAttribute('story-body-text')
        //         t_card_body.appendChild(t_body_text)
        //     }
        //
        //     card.appendChild(t_card_body)
        //     console.log(card)
        //     console.log(target_container)
        //     target_container.appendChild(card)
        //     target_container.appendChild(twitter_script)
        // }

        shadow.appendChild(card);
        // this.attachShadow({ mode: 'close' });
    }

}
customElements.define('local-news', newsAPI);