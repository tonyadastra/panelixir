class myCard extends HTMLElement {
   constructor(){
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        // link css
        const linkElem1 = document.createElement('link');
        linkElem1.setAttribute('rel', 'stylesheet');
        linkElem1.setAttribute('href', '../static/css/card.css');

        const linkElem2 = document.createElement('link');
        linkElem2.setAttribute('rel', 'stylesheet');
        linkElem2.setAttribute('href', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css');


        // link bootsrap js and jquery
        const linkElem3 = document.createElement('script');
        linkElem3.setAttribute('src', 'https://code.jquery.com/jquery-3.5.1.slim.min.js');

        const linkElem4 = document.createElement('script');
        linkElem4.setAttribute('src', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js');

        // the outter most div
        var wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'wrapper');

        // logo image
        let imgUrl;
    //    imgUrl = this.geAttribute('img');
        if (this.hasAttribute('img')) {
            imgUrl = this.getAttribute('img');
        } else {
            imgUrl = '../static/img/img1.png';
        }
        
        const img = document.createElement('img');
        img.setAttribute('width','20%');
        
        img.src = imgUrl;
        wrapper.appendChild(img);

        // progress bar
        var bar_wrapper = document.createElement('div');
        bar_wrapper.setAttribute('class', 'progress');
        bar_wrapper.setAttribute('style', 'height:55px');

        var pbar1 = document.createElement('div');
        pbar1.setAttribute('class', 'progress-bar');
        pbar1.setAttribute('id', 'pbar1');
        pbar1.innerHTML='PRECLICNICAL';
        bar_wrapper.appendChild(pbar1);

        var pbar2 = document.createElement('div');
        pbar2.setAttribute('class', 'progress-bar');
        pbar2.setAttribute('id', 'pbar2');
        pbar2.innerHTML = 'PHASE I';
        bar_wrapper.appendChild(pbar2);

        var pbar3 = document.createElement('div');
        pbar3.setAttribute('class', 'progress-bar');
        pbar3.setAttribute('id', 'pbar3');
        pbar3.innerHTML = 'PHASE II';
        bar_wrapper.appendChild(pbar3);

        var pbar4 = document.createElement('div');
        pbar4.setAttribute('class', 'progress-bar');
        pbar4.setAttribute('id', 'pbar4'); 
        pbar4.innerHTML = 'PHASE III';
        bar_wrapper.appendChild(pbar4);

        var pbar5 = document.createElement('div');
        pbar5.setAttribute('class', 'progress-bar');
        pbar5.setAttribute('id', 'pbar5');
       pbar5.innerHTML = 'APPROVAL';
        bar_wrapper.appendChild(pbar5);

        wrapper.appendChild(bar_wrapper);

        // short company intro
        var text = document.createElement('p');
        text.setAttribute('class', 'intro');
        text.innerHTML ="Moderna’s vaccine dazzled the stock market in May with Phase I data on just eight people, only to see its stock price drop when experts had a lukewarm reaction to the results. The vaccine uses messenger RNA (mRNA for short) to produce viral proteins. The American company is eyeing Phase III trials in July and hopes to have vaccine doses ready by early 2021.";
    //    var info = this.getAttribute('data-text');
    //    text.innerHTML= info;
        wrapper.appendChild(text);

        // button to learn more 
        var btn = document.createElement('button');
        btn.setAttribute('class', 'collapsible');
        btn.setAttribute('type', 'button');
        btn.innerHTML='Learn More';

        var content= document.createElement('p');
        content.innerHTML ='Some collapsible content. Click the button to toggle between showing and hiding the collapsible content. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
        content.setAttribute('class', 'content');
        wrapper.appendChild(btn);
        wrapper.appendChild(content);

        //toggle
        btn.addEventListener("click", function () {
            this.classList.toggle("active");
            // var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });


        shadow.appendChild(wrapper);
        shadow.appendChild(linkElem1);
        shadow.appendChild(linkElem2);
        shadow.appendChild(linkElem3);
        shadow.appendChild(linkElem4);
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


