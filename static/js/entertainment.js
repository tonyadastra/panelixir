$(document).ready(function () {
    $.ajax({
        url: "get-entertainment",
        type: "get",
        async: true,
        success: function (response) {

            var twitter_script = document.createElement('script')
            twitter_script.src = '../static/js/library/twitter-widget.js'

            var entertainment_data = JSON.parse(response)

            var target_container = document.getElementById("entertainment_container")

            entertainment_data.forEach(function (data) {
                // console.log(data)
                var card = document.createElement('div')
                card.setAttribute('class', 'card text-center add-card-margin')

                var card_body = document.createElement('div')
                card_body.setAttribute('class', 'card-body')

                var card_title = document.createElement('h5')
                card_title.setAttribute('class', 'card-title')

                if (data[0] === "Fun"){
                    var tag = "<span class='badge badge-info'>Fun</span>"
                    card_title.innerHTML = tag + data[1]
                }
                else {
                    card_title.innerHTML = data[1]
                }

                var body_content = data[2]

                card_body.appendChild(card_title)
                card_body.innerHTML += body_content

                if (data[3] !== 'null') {
                    var body_text = document.createElement('p')
                    body_text.setAttribute('class', 'card-text')
                    body_text.innerHTML = data[3]
                    card_body.appendChild(body_text)
                }

                // card_body.appendChild(body_content)

                card.appendChild(card_body)

                target_container.appendChild(card)

            })

            target_container.appendChild(twitter_script)



            // console.log(JSON.parse(response))

        }
    });
})