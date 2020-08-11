class myCard extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

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
        const countryArr = this.getAttribute('data-country').split(',')
        const countryArr_ordered = countryArr.reverse()
        countryArr_ordered.forEach((country) => {
            // country = country.trim();
            var country_tag = document.createElement('span');
            country_tag.setAttribute('class', 'country_tag');
            country_tag.setAttribute('style', 'background-color:rgba(236, 112, 30, 0.74)');
            country_tag.innerHTML = country.trim();
            tag_wrapper.appendChild(country_tag);
        })


        // vaccine type tag
        var vac_tag = document.createElement('span');
        vac_tag.setAttribute('class', 'vac_tag');
        // vac_tag.setAttribute('padding-top','30px');
        vac_tag.setAttribute('style', 'background-color:rgba(182, 131, 236, 0.74)');
        vac_tag.innerHTML = this.getAttribute('data-vactype')+" Vaccine";
        tag_wrapper.appendChild(vac_tag);

        wrapper.appendChild(tag_wrapper);

        // button to learn more
        var btn = document.createElement('button');
        btn.setAttribute('class', 'collapsible');
        btn.setAttribute('type', 'button');
        btn.innerHTML = 'Learn More';

        var content = document.createElement('a');

        // logo image
        if (this.hasAttribute('data-img')) {
            const imgUrlArr = this.getAttribute('data-img').split(',')
            imgUrlArr.forEach((imgUrl) => {
                imgUrl = imgUrl.replace(/\s|\'|\]|\[/g, '');
                const img = document.createElement('img');
                img.setAttribute('height', '60px');
                img.src = imgUrl;
                wrapper.appendChild(img);
            })
        } else {
            let imgUrl = '../static/img/Untitled.png';
            const img = document.createElement('img');
            img.setAttribute('height', '40px');
            img.src = imgUrl;
            wrapper.appendChild(img);
        }


        // progress bar
        var bar_wrapper = document.createElement('div');
        bar_wrapper.setAttribute('class', 'progress');
        bar_wrapper.setAttribute('style', 'height:55px');

        var pbar1 = document.createElement('div');
        pbar1.setAttribute('class', 'progress-bar');
        pbar1.setAttribute('id', 'pbar1');
        pbar1.innerHTML = 'PRECLICNICAL';


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

        wrapper.appendChild(bar_wrapper);

        // short company intro
        var text = document.createElement('p');
        text.setAttribute('class', 'intro');
        // text.innerHTML ="Moderna’s vaccine dazzled the stock market in May with Phase I data on just eight people, only to see its stock price drop when experts had a lukewarm reaction to the results. The vaccine uses messenger RNA (mRNA for short) to produce viral proteins. The American company is eyeing Phase III trials in July and hopes to have vaccine doses ready by early 2021.";
        var intro = this.getAttribute('data-intro');
        // console.log(intro);


        // if (this.getAttribute('data-stage') != 0)
        text.innerHTML = intro;
        // else
        //     text.setAttribute('style', 'margin-bottom:2rem');
        wrapper.appendChild(text);


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