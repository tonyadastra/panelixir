const forumTemplate = document.createElement('template');
forumTemplate.innerHTML = `
<div class="card forum-card px-3 py-2 mb-2">
    <div class="media forum-item">
        <a href="#" data-toggle="collapse" data-target=".forum-content"><img src="" class="mr-3 rounded-circle" width="35" alt="User" /></a>
        <div class="media-body">
            <div class="main-body">
                <span class="username"></span><span class="text-muted card-note"><span class="text-note"></span></span> 
                <div class="body-text">
                </div>
                <div class="text-muted small align-self-center forum-stats">
                    <span class="picon forum-views"><i class="far fa-eye"></i> </span>
                    <span class="picon forum-replies"><i class="far fa-comment"></i> </span>
                    <span class="picon forum-likes" id="like"><i class="far fa-heart" id="like-icon"></i></span>
                    <span class="time-text ml-3"></span>
                </div>
            </div>
            
            <div class="edit-forum" style="display: none;">
                <textarea class="edit-input form-control" rows="1" name="forumInput" autocomplete="off"></textarea>
                <div class="edit-buttons">
                    <button type="button" class="btn btn-light btn-cancel mr-3">Cancel</button>
                    <button type="button" class="btn btn-primary btn-submit">Submit</button>
                </div>
             </div>
         </div>
    </div>
</div>
`

class forumPost extends HTMLElement {
    constructor() {
        super();
        this.appendChild(forumTemplate.content.cloneNode(true));

        this.card = this.querySelector("div.card");

        // this.mediaWrapper = this.querySelector("div.media.forum-item");
        this.mediaBody = this.querySelector("div.media-body");
        this.mediaImage = this.querySelector("img.rounded-circle.mr-3");

        this.mainBody = this.querySelector("div.main-body");
        this.mediaUsername = this.mainBody.querySelector("span.username");
        this.postNote = this.mainBody.querySelector("span.text-note");
        // this.favoriteIcon = this.mainBody.querySelector("i.fa-star");
        this.mediaBodyText = this.mainBody.querySelector("div.body-text");
        this.stats = this.mainBody.querySelector("div.forum-stats.text-muted");

        let editSection = this.querySelector("div.edit-forum");
        this.editSection = editSection;
        this.editInput = editSection.querySelector("textarea.edit-input");

        let editButtons = editSection.querySelector(".edit-buttons");
        this.editButtons = editButtons;
        this.cancelButton = editButtons.querySelector("button.btn-cancel");

        editButtons.childNodes.forEach(function (button) {
            button.addEventListener('click', function () {
                editSection.style.display = "none";
            })
        })
        this.submitButton = editButtons.querySelector("button.btn-submit");
        this.deleteModal = $("div#confirmDeleteModal");

        this.likesItem = this.querySelector("span.picon.forum-likes");
    }

    connectedCallback() {
        let p = this;
        let post_id = this.getAttribute('pid');
        let username = this.getAttribute('p-username');
        let profilePicture = this.getAttribute('p-picture');
        let title = this.getAttribute('p-title');
        let body = this.getAttribute('p-body');
        let views = this.getAttribute('p-views');
        let replies = this.getAttribute('p-replies');
        let likes = this.getAttribute('p-likes');
        let timeAgo = this.getAttribute('p-date');
        let likedByUser = (this.getAttribute('p-liked-by-user').toLowerCase() === "true");
        let titleLink = this.getAttribute('p-title-link');
        let postedByUser = (this.getAttribute('p-posted-by-user').toLowerCase() === "true");
        let edited = (this.getAttribute('p-edited').toLowerCase() === "true");
        let location = this.getAttribute('p-location').replace("forum.", "");
        let loggedIn = this.getAttribute('p-logged-in').toLowerCase() === "true";
        let favoritedByUser = (this.getAttribute('p-favorited-by-user').toLowerCase() === "true");

        // if (location !== "discussion")
        //     p.card.classList.add("card-post-opacity");

        let editSection = p.editSection;
        let editInputDescription = p.editInput;
        if (location !== "discussion" || !postedByUser) {
            editSection.parentNode.removeChild(editSection);
        }

        // let mediaWrapper = p.mediaWrapper;
        let mediaImage = p.mediaImage;
        mediaImage.src = profilePicture;

        // let mainBody = mediaWrapper.querySelector("div.main-body");
        // let mediaUsername = mainBody.querySelector("span.username");
        p.mediaUsername.innerHTML = username;

        let favoriteIcon = createIcon("far fa-star active-icon");
        p.postNote.parentNode.appendChild(favoriteIcon);
        
        if (favoritedByUser) {
            favoriteIcon.classList.replace("far", "fas");
        }

        let removeFavoriteDelay;

        favoriteIcon.addEventListener('click', function () {
            let favoriteIconClassList = favoriteIcon.classList;
            if (favoriteIconClassList.contains("far")) {
                // Current State: Unfavorite; New State: Favorite
                $.ajax({
                    url: `/forum/favorite-entity?pid=${post_id}&category=post`,
                    type: "POST",
                    success: function (favoriteResponse) {
                        let status = favoriteResponse.status;
                        if (status === 'success') {
                            window.clearTimeout(removeFavoriteDelay);
                            favoriteIconClassList.replace("far", "fas");
                            showSnackbar("Successfully added to favorites!");
                        } else {
                            let errorMessage = favoriteResponse.error;
                            showSnackbar("Server Error: " + errorMessage);
                        }
                    },
                });
            }
            else if (favoriteIconClassList.contains("fas")) {
                // Current State: Favorite; New State: Unfavorite
                $.ajax({
                    url: `/forum/unfavorite-entity?pid=${post_id}&category=post`,
                    type: "POST",
                    success: function (unfavoriteResponse) {
                        let status = unfavoriteResponse.status;
                        if (status === 'success') {
                            favoriteIconClassList.replace("fas", "far");
                            showSnackbar("Successfully removed from favorites.");
                            if (location === "favorites") {
                                removeFavoriteDelay = setTimeout(function () {
                                    p.card.style.display = "none";
                                }, 1500);
                            }

                        } else {
                            let errorMessage = unfavoriteResponse.error;
                            showSnackbar("Server Error: " + errorMessage);
                        }
                    },
                });
            }
        });

        let postNote = this.postNote;
        if (edited && location === "discussion")
            postNote.innerHTML = "(Edited)";
        else if (!postedByUser)
            postNote.parentNode.removeChild(postNote);

        // let mediaBodyText = p.mediaBodyText
        let E_forumTitle = createGeneralElement("h5", "forum-post-title", title);
        if (location !== "discussion") {
            p.card.classList.add("card-post-opacity");
            let E_postLink = createAElement(titleLink, "post-link stretched-link");
            E_postLink.appendChild(E_forumTitle);
            p.mediaBodyText.appendChild(E_postLink);
        }
        else {
            p.mediaBodyText.appendChild(E_forumTitle);
        }

        let editInputTitle = document.createElement('input');
        editInputTitle.className = "form-control mb-2";
        editInputTitle.name = "forumTitle";
        editInputTitle.value = E_forumTitle.innerText;
        editInputTitle.autocomplete = "off";
        editInputTitle.required = "true";
        editSection.insertBefore(editInputTitle, editInputDescription);

        let E_forumDescription = createGeneralElement("p", "", body);
        if (location !== "discussion") {
            E_forumDescription.classList.add("text-truncate");
        }

        editInputDescription.value = E_forumDescription.innerText;
        editInputDescription.style.overflowY = "hidden";
        editInputDescription.style.height = "auto";

        let editButtons = p.editButtons;
        p.mediaBodyText.appendChild(E_forumDescription);


        // let mediaForumStats = p.mainBody.querySelector("div.forum-stats.text-muted");
        let viewsItem = p.stats.querySelector("span.picon.forum-views");
        viewsItem.innerHTML += parseInt(views) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(views));
        let repliesItem = p.stats.querySelector("span.picon.forum-replies");

        if (location === "discussion")
            p.stats.removeChild(repliesItem);
        else
            repliesItem.innerHTML += parseInt(replies) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(replies));

        let likesItem = p.likesItem;
        let likesIcon = likesItem.querySelector("i.fa-heart");
        if (!loggedIn) {
            likesItem.classList.add('disabled')
        }
        if (likedByUser) {
            likesIcon.className = "fas fa-heart";
            likesItem.classList.add("liked");
        }
        if (location !== "discussion") {
            likesItem.style.zIndex = "20";
            likesItem.style.position = "relative";

            favoriteIcon.style.zIndex = "20";
            favoriteIcon.style.position = "relative";
        }

        let E_likesCount = createSpanElement("likes-count", parseInt(likes) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(likes)));
        likesItem.appendChild(E_likesCount);
        likesItem.addEventListener('click', function () {
            let likeIconClass = likesIcon.className;
            if (likeIconClass === "far fa-heart") {
                // like post
                $.ajax({
                    url: `/forum/like-entity?pid=${post_id}&category=post`,
                    type: "POST",
                    // beforeSend: function () {
                    //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                    // },
                    // error: function () {
                    //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                    // },
                    success: function (likeResponse) {
                        let likeAdded = likeResponse.liked;
                        if (likeAdded) {
                            let newLikes = likeResponse.likes;
                            likesIcon.className = "fas fa-heart";
                            newLikes = abbreviateNumber(newLikes);
                            E_likesCount.innerHTML = newLikes;
                            likesItem.classList.add("liked");
                        } else {
                            let errorMessage = likeResponse.error;
                            showSnackbar("Server Error: " + errorMessage);
                        }
                    },
                });
            } else if (likeIconClass === "fas fa-heart") {
                // unlike post
                $.ajax({
                    url: `/forum/unlike-entity?pid=${post_id}&category=post`,
                    type: "POST",
                    // beforeSend: function () {
                    //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                    // },
                    // error: function () {
                    //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                    // },
                    success: function (UnlikeResponse) {
                        let likeRemoved = UnlikeResponse.unliked;
                        if (likeRemoved) {
                            let newLikes = UnlikeResponse.likes;
                            likesIcon.className = "far fa-heart";
                            newLikes = newLikes === 0 ? "&nbsp;" : abbreviateNumber(newLikes);
                            E_likesCount.innerHTML = newLikes;
                            likesItem.classList.remove("liked");
                        } else {
                            let errorMessage = UnlikeResponse.error;
                            showSnackbar("Server Error: " + errorMessage);
                        }
                    },
                });
            }
        })


        let timeItem = p.stats.querySelector("span.time-text");
        timeItem.innerHTML = "Active " + timeAgo;

        if (postedByUser && location === "discussion") {
            let editIcon = createIcon('fas fa-pen active-icon picon');
            editIcon.onclick = function () {
                editSection.style.display = "block";
                p.mainBody.style.display = "none";
                initTextarea(editInputDescription);
                editInputDescription.focus();
                // replySection.style.display = "none";
                // newReplySection.style.display = "block";
                // editInputTitle.focus();
            };
            // editIcon.style.display = "none";
            p.stats.appendChild(editIcon);

            // mainBody.addEventListener('mouseover', function () {
            //     editIcon.style.display = "inline-block";
            //     deleteIcon.style.display = "inline-block";
            // })

            editButtons.childNodes.forEach(function (button) {
                button.addEventListener('click', function () {
                    p.mainBody.style.display = "block";
                })
            })

            let deleteModal = this.deleteModal;

            p.submitButton.addEventListener('click', function () {
                let editedInputTitle = editInputTitle.value.trim(), editedInputDescription = editInputDescription.value.trim();
                if (editedInputDescription !== E_forumDescription.innerText || editedInputTitle !== E_forumTitle.innerText) {
                    if (editInputTitle.value === "") {
                        initDeleteModal();
                        deleteModal.modal('show');
                    } else {
                        $.ajax({
                            url: `/forum/edit-entity?pid=${post_id}`,
                            type: "POST",
                            contentType: 'application/json',
                            data: JSON.stringify(
                                {"editedEntity": {"title": editInputTitle.value, "description": editInputDescription.value}, "category": "post"}
                            ),
                            success: function (editResponse) {
                                let responseStatus = editResponse.status;
                                if (responseStatus === "success") {
                                    E_forumTitle.innerText = editInputTitle.value;
                                    E_forumDescription.innerText = editInputDescription.value;
                                    edited = true;
                                    if (p.mainBody.contains(postNote)) {
                                        postNote.innerHTML = "(Edited)"
                                    }

                                    // replyTop.innerHTML += ` <span class="text-muted">(Edited)</span>`
                                    // if (!usernameTag.includes("(Edited)")) {
                                    //     usernameTag += ` <span class="text-muted">(Edited)</span>`
                                    // }
                                } else {
                                    let errorMessage = editResponse.error;
                                    showSnackbar("Error: " + errorMessage);
                                }
                            },
                        });
                    }
                }
            })

            let deleteIcon = createIcon('fas fa-trash-alt active-icon picon');
            deleteIcon.addEventListener('click', function () {
                initDeleteModal();
                deleteModal.modal('show');
            })
            p.stats.appendChild(deleteIcon);

            function initDeleteModal() {
                deleteModal.find(".modal-body")
                    .html("Are you sure you want to delete this post? This action cannot be undone.");
                deleteModal.find("form.forum-delete-form")
                    .attr("action", `/forum/delete-entity?pid=${post_id}&category=post`);
            }

        }
    }
}
window.customElements.define('forum-post', forumPost);






class postReplies extends forumPost {
    constructor(_rid, _pid, _username, _picture, _reply, _timeAgo, _likes, _likedByUser, _postedByUser, _edited, _comments, _loggedIn) {
        super();
        this.post_id = _pid;
        this.reply_id = _rid;
        this.username = _username;
        this.profilePicture = _picture
        this.reply = _reply;
        this.comments = _comments;
        this.likes = _likes;
        this.timeAgo = _timeAgo;
        this.likedByUser = _likedByUser;
        this.postedByUser = _postedByUser;
        this.edited = _edited;
        this.loggedIn = _loggedIn;
        // this.favoritedByUser = _favoritedByUser;
    }

    connectedCallback() {
        let r = this;
        let post_id = r.post_id;
        let reply_id = r.reply_id;
        let username = r.username;
        let profilePicture = r.profilePicture;
        let reply = r.reply;
        let comments = r.comments;
        let comments_count = comments.length;
        let likes = r.likes;
        let timeAgo = r.timeAgo;
        let likedByUser = r.likedByUser;
        let postedByUser = r.postedByUser;
        let edited = r.edited;
        let loggedIn = r.loggedIn;
        // let favoritedByUser= r.favoritedByUser;

        let editSection = r.editSection;
        let editInputReply = editSection.querySelector("textarea.edit-input");

        // let card = this.querySelector("div.card");
        // let mediaWrapper = this.querySelector("div.media.forum-item");
        // let mediaImage = this.querySelector("img.rounded-circle.mr-3")
        r.mediaImage.src = profilePicture;

        let mediaBody = r.mediaBody;

        // let mainBody = mediaWrapper.querySelector("div.main-body");
        // let mediaUsername = r.mainBody.querySelector("span.username");
        r.mediaUsername.innerHTML = username;

        // if (favoritedByUser) {
        //     r.favoriteIcon.classList.replace("far", "fas");
        // }
        //
        // r.favoriteIcon.addEventListener('click', function () {
        //     let favoriteIconClassList = r.favoriteIcon.classList;
        //     if (favoriteIconClassList.contains("far")) {
        //         // Current State: Unfavorite; New State: Favorite
        //
        //         $.ajax({
        //             url: `/forum/favorite-entity?pid=${post_id}&rid=${reply_id}&category=reply`,
        //             type: "POST",
        //             success: function (favoriteResponse) {
        //                 let status = favoriteResponse.status;
        //                 if (status === 'success') {
        //                     favoriteIconClassList.replace("far", "fas");
        //                     showSnackbar("Successfully added to favorites!");
        //                 } else {
        //                     let errorMessage = favoriteResponse.error;
        //                     showSnackbar("Server Error: " + errorMessage);
        //                 }
        //             },
        //         });
        //     }
        //     else if (favoriteIconClassList.contains("fas")) {
        //         // Current State: Favorite; New State: Unfavorite
        //         $.ajax({
        //             url: `/forum/unfavorite-entity?pid=${post_id}&rid=${reply_id}&category=reply`,
        //             type: "POST",
        //             success: function (unfavoriteResponse) {
        //                 let status = unfavoriteResponse.status;
        //                 if (status === 'success') {
        //                     favoriteIconClassList.replace("fas", "far");
        //                     showSnackbar("Successfully removed from favorites.");
        //                 } else {
        //                     let errorMessage = unfavoriteResponse.error;
        //                     showSnackbar("Server Error: " + errorMessage);
        //                 }
        //             },
        //         });
        //     }
        // });

        let postNote = r.postNote;
        if (edited)
            postNote.innerHTML = "(Edited)";
        else if (!postedByUser)
            postNote.parentNode.removeChild(postNote);

        // let mediaBodyText = mainBody.querySelector("div.body-text");
        let E_forumReply = createGeneralElement("p", "forum-reply", reply);


        editInputReply.value = E_forumReply.innerText;
        editInputReply.style.overflowY = "hidden";
        editInputReply.style.height = "auto";

        let editButtons = r.editButtons;
        r.mediaBodyText.appendChild(E_forumReply);

        let mediaForumStats = r.stats;
        let viewsItem = mediaForumStats.querySelector("span.picon.forum-views");
        viewsItem.parentNode.removeChild(viewsItem);
        let repliesItem = mediaForumStats.querySelector("span.picon.forum-replies");
        repliesItem.parentNode.removeChild(repliesItem);
        // repliesItem.innerHTML += parseInt(replies) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(replies));
        let likesItem = mediaForumStats.querySelector("span.picon.forum-likes");
        let likesIcon = likesItem.querySelector("i.fa-heart");

        if (!loggedIn) {
            likesItem.classList.add('disabled');
        }
        if (likedByUser) {
            likesIcon.className = "fas fa-heart";
            likesItem.classList.add("liked");
        }

        let E_likesCount = createSpanElement("likes-count", parseInt(likes) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(likes)));
        likesItem.appendChild(E_likesCount);
        likesItem.addEventListener('click', function () {
            if (loggedIn) {
                let likeIconClass = likesIcon.className;
                if (likeIconClass === "far fa-heart") {
                    // like post
                    $.ajax({
                        url: `/forum/like-entity?pid=${post_id}&rid=${reply_id}&category=reply`,
                        type: "POST",
                        // beforeSend: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                        // },
                        // error: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                        // },
                        success: function (likeResponse) {
                            let likeAdded = likeResponse.liked;
                            if (likeAdded) {
                                let newLikes = likeResponse.likes;
                                likesIcon.className = "fas fa-heart";
                                newLikes = abbreviateNumber(newLikes);
                                E_likesCount.innerHTML = newLikes;
                                likesItem.classList.add("liked");
                            } else {
                                let errorMessage = likeResponse.error;
                                showSnackbar("Error: " + errorMessage);
                            }
                        },
                    });
                } else if (likeIconClass === "fas fa-heart") {
                    // unlike post
                    $.ajax({
                        url: `/forum/unlike-entity?pid=${post_id}&rid=${reply_id}&category=reply`,
                        type: "POST",
                        // beforeSend: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                        // },
                        // error: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                        // },
                        success: function (UnlikeResponse) {
                            let likeRemoved = UnlikeResponse.unliked;
                            if (likeRemoved) {
                                let newLikes = UnlikeResponse.likes;
                                likesIcon.className = "far fa-heart";
                                newLikes = newLikes === 0 ? "&nbsp;" : abbreviateNumber(newLikes);
                                E_likesCount.innerHTML = newLikes;
                                likesItem.classList.remove("liked");
                            } else {
                                let errorMessage = UnlikeResponse.error;
                                showSnackbar("Error: " + errorMessage);
                            }
                        },
                    });
                }
            }
            else {
                showSnackbar("You must be logged in to perform this action.");
            }
        })


        let timeItem = mediaForumStats.querySelector("span.time-text");
        timeItem.innerHTML += timeAgo;

        if (postedByUser) {
            let editIcon = createIcon('fas fa-pen active-icon picon');
            editIcon.onclick = function () {
                editSection.style.display = "block";
                r.mainBody.style.display = "none";
                initTextarea(editInputReply);
                editInputReply.focus();
                // replySection.style.display = "none";
                // newReplySection.style.display = "block";
                // editInputReply.focus();
            };
            // editIcon.style.display = "none";
            mediaForumStats.appendChild(editIcon);

            // mainBody.addEventListener('mouseover', function () {
            //     editIcon.style.display = "inline-block";
            //     deleteIcon.style.display = "inline-block";
            // })

            editButtons.childNodes.forEach(function (button) {
                button.addEventListener('click', function () {
                    r.mainBody.style.display = "block";
                })
            })
            let deleteModal = this.deleteModal;

            r.submitButton.addEventListener('click', function () {
                let editedReplyValue = editInputReply.value.trim();
                if (editedReplyValue !== E_forumReply.innerText) {
                    if (editedReplyValue === "") {
                        initDeleteModal();
                        deleteModal.modal('show');
                    } else {
                        $.ajax({
                            url: `/forum/edit-entity?pid=${post_id}&rid=${reply_id}`,
                            type: "POST",
                            contentType: 'application/json',
                            data: JSON.stringify(
                                {"editedEntity": {"reply": editedReplyValue}, "category": "reply"}
                            ),
                            success: function (editResponse) {
                                let responseStatus = editResponse.status;
                                if (responseStatus === "success") {
                                    E_forumReply.innerText = editedReplyValue;
                                    edited = true;
                                    if (r.mainBody.contains(postNote)) {
                                        postNote.innerHTML = "(Edited)";
                                    }
                                } else {
                                    let errorMessage = editResponse.error;
                                    showSnackbar("Server Error: " + errorMessage);
                                }
                            },
                        });
                    }
                }
            })


            let deleteIcon = createIcon('fas fa-trash-alt active-icon picon');

            deleteIcon.addEventListener('click', function () {
                initDeleteModal();
                deleteModal.modal('show');
            })
            mediaForumStats.appendChild(deleteIcon);

            function initDeleteModal() {
                deleteModal.find(".modal-body")
                .html("Are you sure you want to delete this reply? This action cannot be undone.");
            deleteModal.find("form.forum-delete-form")
                .attr("action", `/forum/delete-entity?pid=${post_id}&rid=${reply_id}&category=reply`);
            }

        }

        let replyButton = document.createElement('button');
        replyButton.className = "ripple text-muted reply-button";
        // replyButton.id =
        replyButton.innerHTML = "Comment";
        mediaForumStats.appendChild(replyButton);

        let commentsSection = createDivElement('div-comments');

        let replyCommentForm = document.createElement('form');
        replyCommentForm.method = "POST";
        replyCommentForm.className = "reply-comment";
        replyCommentForm.action = `/forum/post-reply-comment?pid=${post_id}&rid=${reply_id}`;
        replyCommentForm.enctype = "multipart/form-data";
        replyCommentForm.style.display = "none";

        let replyCommentInput = document.createElement('textarea');
        replyCommentInput.className = "form-control";
        replyCommentInput.rows = "1";
        replyCommentInput.name = "comment";
        replyCommentInput.placeholder = "Add a comment...";
        replyCommentInput.autocomplete = "off";
        replyCommentInput.required = "true";

        replyCommentInput.addEventListener('keyup', function () {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        })

        replyCommentForm.appendChild(replyCommentInput);

        replyButton.addEventListener('click', function () {
            if (loggedIn) {
                replyCommentForm.style.display = "block";
                replyCommentInput.focus();
            }
            else {
                showSnackbar("You must be logged in to post a comment.")
            }
        })

        let commentButtons = r.editButtons.cloneNode(true);
        let cancelComment = commentButtons.querySelector("button.btn-cancel");
        cancelComment.addEventListener('click', function () {
            replyCommentForm.style.display = "none";
        })
        let submitComment = commentButtons.querySelector("button.btn-submit");
        submitComment.type = "submit";

        // let replyCommentBtn = document.createElement('button');
        // replyCommentBtn.type = "submit";
        // replyCommentBtn.className = "btn btn-primary";
        // // replyCommentBtn.style.float = "right";
        // replyCommentBtn.innerHTML = "Reply";

        replyCommentForm.appendChild(commentButtons);

        commentsSection.appendChild(replyCommentForm);

        const commentPageLimit = 5;
        for (let comment of comments.slice(0, commentPageLimit)) {
            // _cid, _rid, _pid, _username, _picture, _comment, _timeAgo, _likes, _likedByUser
            commentsSection.appendChild(
                new postReplyComments(comment.cid, reply_id, post_id, comment.username, comment.picture, comment.comment,
                    comment.date, comment.likes, comment.likedByUser, comment.postedByUser, comment.edited, r.loggedIn)
            );
            // let commentElement = `<reply-comment cid="${comment.cid}" rid="${reply_id}" pid="${post_id}" c-username="${comment.username}" c-picture="${comment.picture}"
            //                     c-comment="${comment.comment}"  c-date="${comment.date}" c-likes="${comment.likes}"
            //                     ></reply-comment>`
            // //   c-likes="${comment.likes}" c-liked-by-user="${comment.likedByUser}" c-comments="${comment.comments}"
            // commentsDiv.innerHTML += commentElement;
        }
        if (comments_count > commentPageLimit) {
            const moreCommentsCount = comments_count - commentPageLimit;
            let moreComments = createDivElement("more-comments hidden");
            // moreComments.style.display = "none";
            for (let comment of comments.slice(commentPageLimit)) {
                // _cid, _rid, _pid, _username, _picture, _comment, _timeAgo, _likes, _likedByUser
                moreComments.appendChild(
                    new postReplyComments(comment.cid, reply_id, post_id, comment.username, comment.picture, comment.comment,
                        comment.date, comment.likes, comment.likedByUser, comment.postedByUser, comment.edited, r.loggedIn)
                );
                // let commentElement = `<reply-comment cid="${comment.cid}" rid="${reply_id}" pid="${post_id}" c-username="${comment.username}" c-picture="${comment.picture}"
                //                     c-comment="${comment.comment}"  c-date="${comment.date}" c-likes="${comment.likes}"
                //                     ></reply-comment>`
                // //   c-likes="${comment.likes}" c-liked-by-user="${comment.likedByUser}" c-comments="${comment.comments}"
                // commentsDiv.innerHTML += commentElement;
            }
            commentsSection.appendChild(moreComments);

            // let collapsibleComments = createDivElement("collapsible-comments");
            let t_collapsibleComments = createSpanElement("collapsible-comments", `<i class="fas fa-caret-down"></i> Show ${moreCommentsCount} More Comment${moreCommentsCount > 1 ? "s" : ""}`);
            // collapsibleComments.appendChild(collapsibleCommentsText);
            commentsSection.appendChild(t_collapsibleComments);

            t_collapsibleComments.addEventListener('click', function () {
                if (moreComments.classList.contains("hidden")) {
                    moreComments.classList.remove("hidden");
                    this.innerHTML = "<i class=\"fas fa-caret-up\"></i> Show Less";
                }
                else {
                    moreComments.classList.add("hidden");
                    this.innerHTML = `<i class="fas fa-caret-down"></i> Show ${moreCommentsCount} More Comment${moreCommentsCount > 1 ? "s" : ""}`;
                }
            })

        }
        mediaBody.appendChild(commentsSection);


        function appendRipple(event) {
            let x = event.pageX - event.target.offsetLeft - r.card.offsetLeft;
            let y = event.pageY - event.target.offsetTop - r.card.offsetTop;

            let rippleElement = document.createElement('span');
            rippleElement.className = "ripples";
            rippleElement.style.left = x + 'px';
            rippleElement.style.top = y + 'px';
            // rippleElement.addEventListener('animationend', function (event) {
            //     alert("Finished transition!");
            // });
            this.appendChild(rippleElement);

            // setTimeout(function () {
            //     rippleElement.remove();
            // }, 500);
        }

        const rippleButtons = this.querySelectorAll("button.ripple.reply-button");
        rippleButtons.forEach(function (button) {
            button.addEventListener('mousedown', appendRipple)
        })

    }


    // createFormButtons(_btn1Text, _btn2Text) {
    //     let formButtons = createDivElement('reply-comment-buttons');
    //
    //     let formCancel = document.createElement('button');
    //     formCancel.type = "button";
    //     formCancel.className = "btn btn-light mr-3";
    //     formCancel.innerHTML = _btn1Text;
    //     // formCancel.addEventListener('click', function () {
    //     //     formButtons.style.display = "none";
    //     // })
    //
    //     let formSubmit = document.createElement('button');
    //     formSubmit.type = "submit";
    //     formSubmit.className = "btn btn-primary";
    //     // formSubmitBtn.style.float = "right";
    //     formSubmit.innerHTML = _btn2Text;
    //
    //     formButtons.appendChild(formCancel);
    //     formButtons.appendChild(formSubmit);
    //
    //     return formButtons;
    // }
}
window.customElements.define('post-replies', postReplies);


class postReplyComments extends forumPost {
    constructor(_cid, _rid, _pid, _username, _picture, _comment, _timeAgo, _likes, _likedByUser, _postedByUser, _edited, _loggedIn) {
        super();
        this.comment_id = _cid;
        this.post_id = _pid;
        this.reply_id = _rid;
        this.username = _username;
        this.profilePicture = _picture
        this.comment = _comment;
        this.likes = _likes;
        this.timeAgo = _timeAgo;
        this.likedByUser = _likedByUser;
        this.postedByUser = _postedByUser;
        this.edited = _edited;
        this.loggedIn = _loggedIn;
    }

    connectedCallback() {
        let c = this;
        let comment_id = c.comment_id;
        let reply_id = c.reply_id;
        let post_id = c.post_id;
        let username = c.username;
        let profilePicture = c.profilePicture;
        let comment = c.comment;
        let likes = c.likes;
        let timeAgo = c.timeAgo
        let likedByUser = c.likedByUser;
        let postedByUser = c.postedByUser;
        let edited = c.edited;
        let loggedIn = c.loggedIn;

        c.card.classList.add("card-comments");
        c.card.classList.replace("mb-2", "mb-1");

        let editSection = c.editSection;
        let editInputComment = editSection.querySelector("textarea.edit-input");

        c.mediaImage.src = profilePicture;

        c.mediaUsername.innerHTML = username;

        let postNote = c.postNote;
        if (edited)
            postNote.innerHTML = "(Edited)";
        else if (!postedByUser)
            postNote.parentNode.removeChild(postNote);

        // let mediaBodyText = mainBody.querySelector("div.body-text");
        let E_forumReply = createGeneralElement("p", "forum-reply", comment);

        editInputComment.value = E_forumReply.innerText;
        editInputComment.style.overflowY = "hidden";
        editInputComment.style.height = "auto";

        let editButtons = c.editButtons;
        c.mediaBodyText.appendChild(E_forumReply);

        // c.favoriteIcon.parentNode.removeChild(c.favoriteIcon);

        let mediaForumStats = c.stats;
        let viewsItem = mediaForumStats.querySelector("span.picon.forum-views");
        viewsItem.parentNode.removeChild(viewsItem);
        let repliesItem = mediaForumStats.querySelector("span.picon.forum-replies");
        repliesItem.parentNode.removeChild(repliesItem);
        // repliesItem.innerHTML += parseInt(replies) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(replies));
        let likesItem = mediaForumStats.querySelector("span.picon.forum-likes");
        let likesIcon = likesItem.querySelector("i.fa-heart");

        if (!loggedIn) {
            likesItem.classList.add('disabled');
        }
        if (likedByUser) {
            likesIcon.className = "fas fa-heart";
            likesItem.classList.add("liked");
        }

        let E_likesCount = createSpanElement("likes-count", parseInt(likes) === 0 ? "&nbsp;" : abbreviateNumber(parseInt(likes)));
        likesItem.appendChild(E_likesCount);
        likesItem.addEventListener('click', function () {
            if (loggedIn) {
                let likeIconClass = likesIcon.className;
                if (likeIconClass === "far fa-heart") {
                    // like post
                    $.ajax({
                        url: `/forum/like-entity?pid=${post_id}&rid=${reply_id}&cid=${comment_id}&category=comment`,
                        type: "POST",
                        // beforeSend: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                        // },
                        // error: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                        // },
                        success: function (likeResponse) {
                            let likeAdded = likeResponse.liked;
                            if (likeAdded) {
                                let newLikes = likeResponse.likes;
                                likesIcon.className = "fas fa-heart";
                                newLikes = abbreviateNumber(newLikes);
                                E_likesCount.innerHTML = newLikes;
                                likesItem.classList.add("liked");
                            } else {
                                let errorMessage = likeResponse.error;
                                showSnackbar("Server Error: " + errorMessage);
                            }
                        },
                    });
                } else if (likeIconClass === "fas fa-heart") {
                    // unlike post
                    $.ajax({
                        url: `/forum/unlike-entity?pid=${post_id}&rid=${reply_id}&cid=${comment_id}&category=comment`,
                        type: "POST",
                        // beforeSend: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "far fa-heart";
                        // },
                        // error: function () {
                        //     document.getElementById('like-icon-' + post_id).className = "fas fa-heart";
                        // },
                        success: function (UnlikeResponse) {
                            let likeRemoved = UnlikeResponse.unliked;
                            if (likeRemoved) {
                                let newLikes = UnlikeResponse.likes;
                                likesIcon.className = "far fa-heart";
                                newLikes = newLikes === 0 ? "&nbsp;" : abbreviateNumber(newLikes);
                                E_likesCount.innerHTML = newLikes;
                                likesItem.classList.remove("liked");
                            } else {
                                let errorMessage = UnlikeResponse.error;
                                showSnackbar("Server Error: " + errorMessage);
                            }
                        },
                    });
                }
            }
            else {
                showSnackbar("You must be logged in to perform this action.");
            }
        })


        let timeItem = mediaForumStats.querySelector("span.time-text");
        timeItem.innerHTML += timeAgo;

        if (postedByUser) {
            let editIcon = createIcon('fas fa-pen active-icon picon');
            editIcon.onclick = function () {
                editSection.style.display = "block";
                c.mainBody.style.display = "none";
                initTextarea(editInputComment);
                editInputComment.focus();

                // replySection.style.display = "none";
                // newReplySection.style.display = "block";
                // editInputComment.focus();
            };
            // editIcon.style.display = "none";
            mediaForumStats.appendChild(editIcon);

            // mainBody.addEventListener('mouseover', function () {
            //     editIcon.style.display = "inline-block";
            //     deleteIcon.style.display = "inline-block";
            // })

            editButtons.childNodes.forEach(function (button) {
                button.addEventListener('click', function () {
                    c.mainBody.style.display = "block";
                })
            })

            let deleteModal = c.deleteModal;

            c.submitButton.addEventListener('click', function () {
                let editedCommentValue = editInputComment.value.trim();
                if (editedCommentValue !== E_forumReply.innerText) {
                    if (editInputComment.value === "") {
                        initDeleteModal();
                        deleteModal.modal('show');
                    } else {
                        $.ajax({
                            url: `/forum/edit-entity?pid=${post_id}&rid=${reply_id}&cid=${comment_id}`,
                            type: "POST",
                            contentType: 'application/json',
                            data: JSON.stringify(
                                {"editedEntity": {"comment": editedCommentValue}, "category": "comment"}
                            ),
                            success: function (editResponse) {
                                let responseStatus = editResponse.status;
                                if (responseStatus === "success") {
                                    E_forumReply.innerHTML = editedCommentValue;
                                    edited = true;
                                    if (c.mainBody.contains(postNote)) {
                                        postNote.innerHTML = "(Edited)";
                                    }

                                } else {
                                    let errorMessage = editResponse.error;
                                    showSnackbar("Server Error: " + errorMessage);
                                }
                            },
                        });
                    }
                }
            })

            let deleteIcon = createIcon('fas fa-trash-alt active-icon picon');

            deleteIcon.addEventListener('click', function () {
                initDeleteModal();
                deleteModal.modal('show');
            })
            mediaForumStats.appendChild(deleteIcon);

            function initDeleteModal() {
                deleteModal.find(".modal-body")
                    .html("Are you sure you want to delete this comment? This action cannot be undone.");
                deleteModal.find("form.forum-delete-form")
                    .attr("action", `/forum/delete-entity?pid=${post_id}&rid=${reply_id}&cid=${comment_id}&category=comment`);
            }

        }

        // let replyButton = document.createElement('button');
        // replyButton.className = "ripple text-muted reply-button";
        // // replyButton.id =
        // replyButton.innerHTML = "Comment";
        // mediaForumStats.appendChild(replyButton);


        // let replyCommentForm = document.createElement('form');
        // replyCommentForm.method = "POST";
        // replyCommentForm.className = "reply-comment";
        // replyCommentForm.action = `/forum/post-reply-comment?pid=${post_id}&rid=${reply_id}`;
        // replyCommentForm.enctype = "multipart/form-data";
        // replyCommentForm.style.display = "none";
        //
        // let replyCommentInput = document.createElement('textarea');
        // replyCommentInput.className = "form-control";
        // replyCommentInput.rows = "1";
        // replyCommentInput.name = "comment";
        // replyCommentInput.placeholder = "Add a comment...";
        // replyCommentInput.autocomplete = "off";
        // replyCommentInput.required = "true";
        //
        // replyCommentInput.addEventListener('keyup', function () {
        //     this.style.height = "auto";
        //     this.style.height = this.scrollHeight + "px";
        // })
        //
        // replyCommentForm.appendChild(replyCommentInput);
        //
        // replyButton.addEventListener('click', function () {
        //     replyCommentForm.style.display = "block";
        //     replyCommentInput.focus();
        // })
        //
        // let commentButtons = c.editButtons.cloneNode(true);
        // let cancelComment = commentButtons.querySelector("button.btn-cancel");
        // cancelComment.addEventListener('click', function () {
        //     replyCommentForm.style.display = "none";
        // })
        // let submitComment = commentButtons.querySelector("button.btn-submit");
        // submitComment.type = "submit";



        // let replyCommentBtn = document.createElement('button');
        // replyCommentBtn.type = "submit";
        // replyCommentBtn.className = "btn btn-primary";
        // // replyCommentBtn.style.float = "right";
        // replyCommentBtn.innerHTML = "Reply";

        // replyCommentForm.appendChild(commentButtons);

        // function appendRipple(event) {
        //     let x = event.pageX - event.target.offsetLeft - c.card.offsetLeft;
        //     let y = event.pageY - event.target.offsetTop - c.card.offsetTop;
        //
        //     let rippleElement = document.createElement('span');
        //     rippleElement.className = "ripples";
        //     rippleElement.style.left = x + 'px';
        //     rippleElement.style.top = y + 'px';
        //     this.appendChild(rippleElement);
        //
        //     // setTimeout(function () {
        //     //     rippleElement.remove();
        //     // }, 500);
        // }
        //
        // const rippleButtons = this.querySelectorAll("button.ripple.reply-button");
        // rippleButtons.forEach(function (button) {
        //     button.addEventListener('mousedown', appendRipple)
        // })

    }

    // createFormButtons(_btn1Text, _btn2Text) {
    //     let formButtons = createDivElement('reply-comment-buttons');
    //
    //     let formCancel = document.createElement('button');
    //     formCancel.type = "button";
    //     formCancel.className = "btn btn-light mr-3";
    //     formCancel.innerHTML = _btn1Text;
    //     // formCancel.addEventListener('click', function () {
    //     //     formButtons.style.display = "none";
    //     // })
    //
    //     let formSubmit = document.createElement('button');
    //     formSubmit.type = "submit";
    //     formSubmit.className = "btn btn-primary";
    //     // formSubmitBtn.style.float = "right";
    //     formSubmit.innerHTML = _btn2Text;
    //
    //     formButtons.appendChild(formCancel);
    //     formButtons.appendChild(formSubmit);
    //
    //     return formButtons;
    // }
}
window.customElements.define('reply-comment', postReplyComments);


const paginationTemplate = document.createElement('template');
paginationTemplate.innerHTML =
    `<nav class="nav-pagination" aria-label="Pagination">
        <ul class="pagination justify-content-center">
<!--            <li class="page-item disabled">-->
<!--              <a class="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>-->
<!--            </li>-->
<!--            <li class="page-item active"><a class="page-link" href="#">1</a></li>-->
<!--            <li class="page-item"><a class="page-link" href="/forum?page=2">2</a></li>-->
<!--            <li class="page-item"><a class="page-link" href="/forum?page=3">3</a></li>-->
<!--            <li class="page-item">-->
<!--              <a class="page-link" href="#">Next</a>-->
<!--            </li>-->
        </ul>
    </nav>`

class pagePagination extends HTMLElement {
    constructor() {
        super();
        // console.log(this.getAttribute('baseuri'))
        this.page = this.getAttribute('page');
        this.baseuri = this.getAttribute('baseuri');
        this.totalPages = this.getAttribute('totalpages');
        this.appendChild(paginationTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        let page = parseInt(this.page);
        let baseURI = this.baseuri;
        let totalPages = parseInt(this.totalPages);
        if (totalPages === 1)
            return; // hide pagination when there's only one page
        let paginationUl = this.querySelector("ul.pagination");

        if (page > 1) {
            let previous = this.createPaginationList("Previous", `${baseURI}?page=${page - 1}`);
            paginationUl.appendChild(previous);
        }

        let iStart = page - 2;
        if (iStart < 1)
            iStart = 1;
        else if (iStart > 1) {
            let page1 = this.createPaginationList(1, `${baseURI}?page=${1}`);
            paginationUl.appendChild(page1);

            if (iStart > 2) {
                let omittedPage = this.createPaginationList("...", "#");
                omittedPage.className += " disabled ellipsis";
                paginationUl.appendChild(omittedPage);
            }

        }

        let iEnd = iStart + 4;
        if (iEnd > totalPages)
            iEnd = totalPages;


        for (let i = iStart; i <= iEnd; i++) {
            let middle = this.createPaginationList(i, `${baseURI}?page=${i}`);
            if (i === page)
                middle.className += " active";
            paginationUl.appendChild(middle);
        }

        if (iEnd < totalPages) {
            if (iEnd + 1 < totalPages) {
                let omittedPage = this.createPaginationList("...", "#");
                omittedPage.className += " disabled ellipsis";
                paginationUl.appendChild(omittedPage);
            }

            let pageEnd = this.createPaginationList(totalPages, `${baseURI}?page=${totalPages}`);
            paginationUl.appendChild(pageEnd);

        }

        if ((page + 1) <= totalPages) {
            let next = this.createPaginationList("Next", `${baseURI}?page=${page + 1}`);
            paginationUl.appendChild(next);
        }

    }
    // disconnectedCallback() {
    //
    // }

    createPaginationList(pageNumber, link) {
        let paginateList = document.createElement('li');
        paginateList.className = "page-item";

        let paginateLink = document.createElement('a');
        paginateLink.className = "page-link";
        paginateLink.href = link;
        paginateLink.innerHTML = pageNumber;

        paginateList.appendChild(paginateLink);

        return paginateList;
    }
}
window.customElements.define('page-pagination', pagePagination);


// $(document).ready(function () {
//     initTextarea();
// })
// $("textarea").each(function () {
//     $(this).on("input", function () {
//         this.style.height = "auto";
//         this.style.height = (this.scrollHeight) + "px";
//     });
// });

var observe;
if (window.attachEvent) {
    observe = function (element, event, handler) {
        element.attachEvent('on' + event, handler);
    };
}
else {
    observe = function (element, event, handler) {
        element.addEventListener(event, handler, false);
    };
}

function initTextarea (textareaElement) {
    // var allTextarea = document.querySelectorAll('textarea');
    /* 0-timeout to get the already changed text */

    // allTextarea.forEach(function (textarea) {
        function delayedResize() {
            window.setTimeout(resize, 0);
        }
        function resize() {
            textareaElement.style.height = 'auto';
            textareaElement.style.height = textareaElement.scrollHeight + 'px';
        }
        observe(textareaElement, 'change', resize);
        observe(textareaElement, 'cut', delayedResize);
        observe(textareaElement, 'paste', delayedResize);
        observe(textareaElement, 'drop', delayedResize);
        observe(textareaElement, 'keydown', delayedResize);

        // textarea.focus();
        // textarea.select();
        resize();
    // })
}

function createIcon(_class) {
    let icon = document.createElement('i');
    icon.className = _class;
    return icon;
}

function createDivElement(_class, _id) {
    let divElement = document.createElement('div');
    if (typeof _class !== 'undefined')
        divElement.className = _class;

    if (typeof _id !== 'undefined')
        divElement.id = _id;
    return divElement;
}

function createAElement(_href, _class, _text) {
    let aElement = document.createElement('a');
    if (typeof _href !== 'undefined')
        aElement.href = _href;

    if (typeof _class !== 'undefined')
        aElement.className = _class;

    if (typeof _text !== 'undefined')
        aElement.innerHTML = _text;
    return aElement;
}

function createSpanElement(_class, _text, _id) {
    let spanElement = document.createElement('span');
    if (typeof _class !== 'undefined')
        spanElement.className = _class;

    if (typeof _text !== 'undefined')
        spanElement.innerHTML = _text;

    if (typeof _id !== 'undefined')
        spanElement.id = _id;
    return spanElement;
}

function createGeneralElement(_tag, _class, _text) {
    let element = document.createElement(_tag);
    if (typeof _class !== 'undefined')
        element.className = _class;
    if (typeof _text !== 'undefined')
        element.innerHTML = _text;
    return element;
}


// Imported Functions
function abbreviateNumber(value) {
    let newValue = value;
    const suffixes = ["", "K", "M", "B", "T"];
    let suffixNum = 0;
    while (newValue >= 1000) {
        newValue /= 1000;
        suffixNum++;
    }

    // not display 11.0 instead of 11
    if (newValue >= 100 || suffixNum !== 0)
        newValue = newValue.toPrecision(3);

    // Rounding errors for values such as 999600 --> returns 1.00e+3K
    // now it will return 1.00M
    if (parseInt(newValue) === 1.00e+3) {
        // newValue is of type 'string'
        newValue = "1.00";
        suffixNum++;
    }

    newValue += suffixes[suffixNum];
    return newValue;
}


