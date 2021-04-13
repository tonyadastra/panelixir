from flask import request, render_template, redirect, url_for, Blueprint, session, jsonify, abort
import google_auth
import psycopg2
import functools
from models.models import Db, User, Post, UserReaction, PostReplies, UserReactionReplies, PostReplyComments, \
    LikedComments, Favorites
from sqlalchemy import desc, case, and_
# from modules.timeInterval import getTimeAgo
from modules.forumFormat import getTimeAgo, formatInput, toJSBoolean, getEntityID, readEntity, readPost
import os
import datetime
import json

conn = psycopg2.connect(f'''host={os.environ.get('AWS_DATABASE_HOST')}
                         dbname=forumdb user={os.environ.get('AWS_DATABASE_MASTER_USER')} 
                         password={os.environ.get('AWS_DATABASE_MASTER_PASSWORD')}''')
cur = conn.cursor()

app = Blueprint('forum', __name__)


def login_required(template=None, include_user_info=False):
    def decorator(view):
        @functools.wraps(view)
        def wrap(*args, **kwargs):
            if "username" in session:
                template_name = template
                if template_name is None:
                    template_name = request.endpoint \
                                        .replace('.', '/') + '.html'
                ctx = view(*args, **kwargs)
                if ctx is None:
                    ctx = {}
                elif not isinstance(ctx, dict):
                    return ctx
                session['previous_url'] = request.url
                if include_user_info:
                    return render_template(template_name, cUsername=session.get('username', None),
                                           cUserInfo=session.get('user_info', None), **ctx)
                else:
                    return render_template(template_name, **ctx)
            else:
                if google_auth.is_logged_in():
                    session.clear()
                session['redirect_uri'] = request.url
                return redirect(url_for("google_auth.login"))

        return wrap

    return decorator


def navbar_templated(template=None):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            template_name = template
            if template_name is None:
                template_name = request.endpoint \
                                    .replace('.', '/') + '.html'
            ctx = f(*args, **kwargs)
            if ctx is None:
                ctx = {}
            elif not isinstance(ctx, dict):
                return ctx
            session['redirect_uri'] = session['previous_url'] = request.url
            return render_template(template_name, cUsername=session.get('username', None),
                                   cUserInfo=session.get('user_info', None), **ctx)

        return decorated_function

    return decorator


@app.route('/forum')
@navbar_templated('forum.html')
def forum():
    page = int(request.args.get('page', default=1))
    page_size = 25

    session_uid = -1
    session_userRole = "U"
    if "username" in session:
        session_user = User.query.filter_by(username=session['username']).first()
        session_uid = session_user.uid
        session_userRole = session_user.role
    elif google_auth.is_logged_in():
        session.clear()

    total_posts = Post.query.count()
    if (page - 1) * page_size >= total_posts:
        page = 1

    allReplyDates = Db.session.query(
        PostReplies.post.label('post'), PostReplies.date.label('date')
    ).distinct(PostReplies.post).order_by(PostReplies.post, desc(PostReplies.date)).subquery()

    allPosts = Db.session.query(
        User, Post, allReplyDates
    ).join(
        allReplyDates, allReplyDates.c.post == Post.pid, isouter=True
    ).filter(
        User.uid == Post.author
    ).order_by(
        desc(
            case([
                (allReplyDates.c.date.is_(None), Post.date)
            ],
                else_=allReplyDates.c.date
            )
        )
    ).offset((page - 1) * page_size).limit(page_size).all()

    all_posts = []
    for cPost in allPosts:
        pid = cPost[1].pid
        favorited_by_user = Favorites.query.filter_by(entity=getEntityID('p', pid), uid=session_uid).first() is not None

        all_posts.append(dict(favoritedByUser=favorited_by_user, **readPost(cPost, session_uid=session_uid,
                                                                            latest_reply_time=cPost[3])))

    pagination_data = {"page": page,
                       "totalPages": total_posts // page_size + (total_posts % page_size > 0),
                       "baseuri": url_for("forum.forum")
                       }

    return dict(posts=all_posts, pagi_data=pagination_data)


@app.route('/discussion/<int:post_id>')
@navbar_templated('forum-discussion.html')
def discussion(post_id):
    if "username" not in session and google_auth.is_logged_in():
        google_auth.logout()

    page = int(request.args.get('page', default=1))
    page_size = 30

    session_uid = -1
    cPost = Db.session.query(
        User, Post
    ).filter(
        Post.pid == post_id
    ).filter(
        User.uid == Post.author
    ).first()

    if cPost is None:
        abort(404)

    if "username" in session:
        session_user = User.query.filter_by(username=session['username']).first()
        session_uid = session_user.uid
        # if cPost is not None:
        current_views = cPost[1].views + 1
        cPost[1].views = current_views
        Db.session.commit()
    elif google_auth.is_logged_in():
        session.clear()

    favorited_by_user = Favorites.query.filter_by(entity=getEntityID('p', post_id), uid=session_uid).first() is not None
    try:
        latest_reply_time = PostReplies.query.filter_by(post=post_id).with_entities(PostReplies.date).order_by(
            desc(PostReplies.date)).first()[0]
    except TypeError:
        latest_reply_time = None

    post = dict(favoritedByUser=favorited_by_user, **readPost(cPost, session_uid=session_uid,
                                                              latest_reply_time=latest_reply_time))

    all_Replies = Db.session.query(
        User, PostReplies
    ).filter(
        PostReplies.post == post_id
    ).filter(
        User.uid == PostReplies.author
    ).order_by(desc(PostReplies.date)).offset((page - 1) * page_size).limit(page_size).all()

    replies = []
    for Reply in all_Replies:
        rid = Reply[1].rid
        r_liked_by_user = UserReactionReplies.query.filter_by(post=post_id, liked_rid=rid,
                                                              user_id=session_uid).first() is not None
        # r_favorited_by_user = Favorites.query.filter_by(entity=getEntityID('r', post_id, rid),
        #                                                 uid=session_uid).first() is not None
        all_Comments = Db.session.query(
            User, PostReplyComments
        ).filter(
            PostReplyComments.post == post_id
        ).filter(
            PostReplyComments.reply == Reply[1].rid
        ).filter(
            User.uid == PostReplyComments.author
        ).order_by(desc(PostReplyComments.date)).all()

        reply = dict(rid=Reply[1].rid, pid=post_id, username=Reply[0].username, picture=Reply[0].picture,
                     reply=formatInput(Reply[1].reply), date=getTimeAgo(Reply[1].date), likes=len(Reply[1].likes),
                     likedByUser=toJSBoolean(r_liked_by_user),
                     postedByUser=toJSBoolean(session_uid == Reply[0].uid),
                     edited=toJSBoolean(Reply[1].edited),
                     # favoritedByUser=toJSBoolean(r_favorited_by_user),
                     comments=[dict(cid=Comment[1].cid, username=Comment[0].username, picture=Comment[0].picture,
                                    comment=formatInput(Comment[1].comment), date=getTimeAgo(Comment[1].date),
                                    likes=len(Comment[1].likes),
                                    likedByUser=LikedComments.query.filter_by(
                                        post=post_id, reply=Reply[1].rid,
                                        liked_cid=Comment[1].cid, user_id=session_uid
                                    ).first() is not None,
                                    postedByUser=(session_uid == Comment[0].uid),
                                    edited=Comment[1].edited
                                    )
                               for Comment in all_Comments]
                     )
        replies.append(reply)

    pagination_data = {"page": page,
                       "totalPages": post['replies'] // page_size + (post['replies'] % page_size > 0),
                       "baseuri": url_for("forum.discussion", post_id=post_id)
                       }

    return dict(post=post, replies=replies, pagi_data=pagination_data)


@app.route('/users/<username>')
@login_required("user-profile.html", True)
def userProfile(username):
    user = User.query.filter_by(username=username).first()
    if user is None:
        abort(404)
    uid = user.uid

    recentPosts = Post.query.filter_by(author=uid).order_by(Post.date.desc()).limit(5).all()
    recent_posts = [readPost(recentPost, basic_info_only=True) for recentPost in recentPosts]

    # TODO: User Stats: likes, views, joined date, etc.
    # Db.session.query(
    #     User, Post
    # ).join(
    #
    # ).filter(
    #     User.uid == Post.author == PostReplies.author
    # )
    UserInfo = User.query.filter_by(username=username).first()
    if session.get("username", None) == username:

        user_info = dict(firstName=UserInfo.first_name, lastName=UserInfo.last_name, picture=UserInfo.picture,
                         email=UserInfo.email)
        return dict(username=username, user_info=user_info, recent_posts=recent_posts, isCurrentUser=True)
    else:
        user_info = dict(picture=UserInfo.picture)
        return dict(recent_posts=recent_posts, user_info=user_info, username=username, isCurrentUser=False)


@app.route('/forum/favorites')
@login_required("favorites.html", include_user_info=True)
def favorites():
    session_user = User.query.filter_by(username=session['username']).first()
    session_uid = session_user.uid
    userFavorites = Favorites.query.filter_by(uid=session_uid).all()

    all_favorites = []
    for userFavorite in userFavorites:
        entity_id = userFavorite.entity
        entity_info = readEntity(entity_id)

        entity = None
        if entity_info['category'] == "post":
            cPost = Db.session.query(
                User, Post
            ).filter(
                Post.pid == entity_info['pid']
            ).filter(
                User.uid == Post.author
            ).first()
            try:
                latest_reply_time = PostReplies.query.filter_by(post=cPost[1].pid).with_entities(
                    PostReplies.date
                ).order_by(
                    desc(PostReplies.date)
                ).first()[0]
            except TypeError:
                latest_reply_time = None

            entity = dict(favoritedByUser=True, **readPost(cPost, session_uid=session_uid,
                                                           latest_reply_time=latest_reply_time))

        if entity:
            all_favorites.append(dict(category=entity_info['category'], entity=entity))

    return dict(all_favorites=all_favorites)


@app.route('/new-user', methods=["GET", "POST"])
def newUser():
    if "username" in session:
        return redirect(url_for("forum.forum"))

    if google_auth.is_logged_in():
        if request.method == "POST":
            username = request.form['username']
            session['username'] = username
            user_info = session['user_info']
            new_user = User(first_name=user_info['given_name'],
                            last_name=user_info['family_name'],
                            email=user_info['email'],
                            picture=user_info['picture'],
                            username=username)
            Db.session.add(new_user)
            Db.session.commit()

            return redirect("/forum")

        all_taken_usernames = [username[0] for username in
                               Db.session.query(User).with_entities(User.username).all()]

        return render_template("newuser.html", cUserInfo=session['user_info'],
                               all_taken_usernames=all_taken_usernames)
    else:
        abort(403)

    # return jsonify(userFavorites)


@app.route('/forum/newpost', methods=['GET', 'POST'])
@login_required("newpost-forum.html", include_user_info=True)
def forumNewPost():
    if request.method == "POST":
        session_user = User.query.filter_by(username=session['username']).first()

        title = request.form['title']
        body = request.form['body']

        new_post = Post(author=session_user.uid, title=title, body=body)
        Db.session.add(new_post)
        Db.session.commit()

        return redirect(url_for("forum.forum"))

    # if not google_auth.is_logged_in():
    #     session['redirect_uri'] = url_for("forum.forumNewPost")
    #     return redirect(url_for("google_auth.login"))
    return


@app.route('/forum/like-entity', methods=['GET', 'POST'])
def forumLikeEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid', default=None)
        cid = request.args.get('cid', default=None)
        entityCategory = request.args.get('category')
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            # uid = request.args.get('uid')
            likeAdded = False
            if entityCategory == "post":
                if UserReaction.query.filter_by(user_id=uid, liked_pid=pid).first() is None:
                    user_reaction = UserReaction(user_id=uid, liked_pid=pid)
                    Db.session.add(user_reaction)
                    Db.session.commit()
                    likeAdded = True
                all_likes = UserReaction.query.filter_by(liked_pid=pid).count()

                return jsonify({"likes": all_likes, "liked": likeAdded})

            elif entityCategory == "reply":
                if UserReactionReplies.query.filter_by(user_id=uid, post=pid, liked_rid=rid).first() is None:
                    user_reaction_reply = UserReactionReplies(user_id=uid, post=pid, liked_rid=rid)
                    Db.session.add(user_reaction_reply)
                    Db.session.commit()
                    likeAdded = True
                all_likes = UserReactionReplies.query.filter_by(post=pid, liked_rid=rid).count()

                return jsonify({"likes": all_likes, "liked": likeAdded})

            elif entityCategory == "comment":
                if LikedComments.query.filter_by(user_id=uid, post=pid, reply=rid, liked_cid=cid).first() is None:
                    liked_comment = LikedComments(user_id=uid, post=pid, reply=rid, liked_cid=cid)
                    Db.session.add(liked_comment)
                    Db.session.commit()
                    likeAdded = True
                all_likes = LikedComments.query.filter_by(post=pid, reply=rid, liked_cid=cid).count()

                return jsonify({"likes": all_likes, "liked": likeAdded})
            else:
                return jsonify({"liked": False, "error": "Unidentified category of like."})
            # return jsonify()

        # else:
        # if entityCategory == "post":
        #     all_likes = UserReaction.query.filter_by(liked_pid=pid).count()
        # elif entityCategory == "reply":
        #     all_likes = UserReactionReplies.query.filter_by(post=pid, liked_rid=rid).count()
        # elif entityCategory == "comment":
        #     all_likes = LikedComments.query.filter_by(post=pid, reply=rid, liked_cid=cid).count()
        return jsonify({"liked": False, "error": "You must be logged in to post your reactions."})
    else:
        abort(405)


@app.route('/forum/unlike-entity', methods=['GET', 'POST'])
def forumUnlikeEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid', default=None)
        cid = request.args.get('cid', default=None)
        entityCategory = request.args.get('category')
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            # uid = 1
            if entityCategory == "post":
                added_reaction = UserReaction.query.filter_by(user_id=uid, liked_pid=pid).first()
            elif entityCategory == "reply":
                added_reaction = UserReactionReplies.query.filter_by(user_id=uid, post=pid, liked_rid=rid).first()
            elif entityCategory == "comment":
                added_reaction = LikedComments.query.filter_by(user_id=uid, post=pid, reply=rid, liked_cid=cid).first()
            else:
                return jsonify({"unliked": False, "error": "The category of this action is not specified."})

            Db.session.delete(added_reaction)
            Db.session.commit()

            if entityCategory == "post":
                all_likes = UserReaction.query.filter_by(liked_pid=pid).count()
            elif entityCategory == "reply":
                all_likes = UserReactionReplies.query.filter_by(post=pid, liked_rid=rid).count()
            elif entityCategory == "comment":
                all_likes = LikedComments.query.filter_by(post=pid, reply=rid, liked_cid=cid).count()
            else:
                return jsonify({"unliked": False, "error": "Unidentified category of unlike."})

            return jsonify({"unliked": True, "likes": all_likes})

        return jsonify({"unliked": False, "error": "We cannot verify your identity."})
    else:
        abort(405)


@app.route('/forum/post-reply', methods=['GET', 'POST'])
def forumPostReply():
    if request.method == "POST":
        pid = request.args.get('pid')
        reply = request.form['reply'].strip()
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            # uid = request.args.get('uid')
            Reply = PostReplies(post=pid, author=uid, reply=reply)
            Db.session.add(Reply)
            Db.session.commit()

            return redirect(url_for("forum.discussion", post_id=pid))

        else:
            return "You must be logged in to post a reply."
    else:
        abort(405)


@app.route('/forum/post-reply-comment', methods=['GET', 'POST'])
def forumPostReplyComment():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid')
        comment = request.form['comment'].strip()
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            Comment = PostReplyComments(post=pid, author=uid, reply=rid, comment=comment)
            Db.session.add(Comment)
            Db.session.commit()
            return redirect(url_for("forum.discussion", post_id=pid))

        else:
            return abort(401)
    else:
        abort(405)


@app.route('/forum/edit-entity', methods=['GET', 'POST'])
def forumEditEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid', default=None)
        cid = request.args.get('cid', default=None)

        category = request.get_json()['category']
        editedEntity = request.get_json()['editedEntity']

        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            # uid = request.args.get('uid')
            if category == "post":
                thisPost = Post.query.filter_by(pid=pid, author=uid).first()
                thisPost.title = editedEntity['title'].strip()
                thisPost.body = editedEntity['description'].strip()
                thisPost.edited = True

            elif category == "reply":
                thisReply = PostReplies.query.filter_by(post=pid, author=uid, rid=rid).first()
                thisReply.reply = editedEntity['reply'].strip()
                thisReply.edited = True

            elif category == "comment":
                thisComment = PostReplyComments.query.filter_by(post=pid, reply=rid, author=uid, cid=cid).first()
                thisComment.comment = editedEntity['comment'].strip()
                thisComment.edited = True
            else:
                return jsonify({"status": "failure", "error": "Unidentified category of edit."})

            Db.session.commit()

            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "failure", "error": "You must be logged in to make an edit."})
    else:
        abort(405)


@app.route('/forum/delete-entity', methods=['GET', 'POST'])
def forumDeleteEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid')
        cid = request.args.get('cid')

        category = request.args.get('category')

        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            if category == "post":
                thisPost = Post.query.filter_by(pid=pid, author=uid).first()
                Db.session.delete(thisPost)
                Db.session.query(Favorites).filter(Favorites.entity == getEntityID('p', pid)).delete()
                Db.session.commit()

                return redirect(url_for(".forum"))

            elif category == "reply":
                thisReply = PostReplies.query.filter_by(post=pid, author=uid, rid=rid).first()
                Db.session.delete(thisReply)
            elif category == "comment":
                thisComment = PostReplyComments.query.filter_by(post=pid, reply=rid, cid=cid, author=uid).first()
                Db.session.delete(thisComment)
            else:
                return jsonify({"status": "failure", "error": "unidentified category of delete"})


            Db.session.commit()

            return redirect(url_for("forum.discussion", post_id=pid))
            # else:
            #     return "You must be the original post author to delete this post."

        else:
            return jsonify({"status": "failure", "error": "You must be logged in to delete a comment."})
    else:
        abort(405)


@app.route('/forum/favorite-entity', methods=['GET', 'POST'])
def forumFavoriteEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid', default=None)
        # cid = request.args.get('cid', default=None)
        entityCategory = request.args.get('category')
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            if entityCategory != "post" and entityCategory != "reply":
                return jsonify({"liked": False, "error": "Unidentified category of entity to favorite."})

            entity_id = getEntityID(entityCategory, pid, rid)

            if Favorites.query.filter_by(uid=uid, entity=entity_id).first() is None:
                newFavorite = Favorites(uid=uid, entity=entity_id)
                Db.session.add(newFavorite)
                Db.session.commit()
                return jsonify({"status": "success"})
            # else:
            return jsonify({"status": "failure", "error": "This entity is already in your favorites."})

        return jsonify({"status": "failure", "error": "You must be logged in to favorite an entity."})
    else:
        abort(405)


@app.route('/forum/unfavorite-entity', methods=['GET', 'POST'])
def forumUnfavoriteEntity():
    if request.method == "POST":
        pid = request.args.get('pid')
        rid = request.args.get('rid', default=None)
        # cid = request.args.get('cid', default=None)
        entityCategory = request.args.get('category')
        if "username" in session:
            uid = User.query.filter_by(username=session['username']).first().uid
            if entityCategory != "post" and entityCategory != "reply":
                return jsonify({"liked": False, "error": "Unidentified category of entity to favorite."})

            entity_id = getEntityID(entityCategory, pid, rid)

            selected_unfavorite_Favorite = Favorites.query.filter_by(uid=uid, entity=entity_id).first()
            if selected_unfavorite_Favorite is not None:
                Db.session.delete(selected_unfavorite_Favorite)
                Db.session.commit()
                return jsonify({"status": "success"})
            # else:
            return jsonify({"status": "failure", "error": "This entity you'd like to unfavorite does not exist."})

        return jsonify({"status": "failure", "error": "You must be logged in to unfavorite an entity."})
    else:
        abort(405)


@app.route('/forum/privacy-policy', methods=['GET'])
def privacy_policy():
    return render_template("legal/privacy-policy.html")


@app.route('/forum/terms', methods=['GET'])
def terms():
    return render_template("legal/terms.html")


@app.errorhandler(400)
def bad_request(e):
    if session.get("previous_url"):
        url = session["previous_url"]
        session.pop("previous_url")
        return render_template('error/400.html', url=url), 400
    return render_template('error/400.html'), 400


@app.errorhandler(401)
def unauthorized(e):
    if session.get("previous_url"):
        url = session["previous_url"]
        session.pop("previous_url")
        return render_template('error/401.html', url=url), 401
    return render_template('error/401.html'), 401


@app.errorhandler(403)
def forbidden(e):
    if session.get("previous_url"):
        url = session["previous_url"]
        session.pop("previous_url")
        return render_template('error/403.html', url=url), 403
    return render_template('error/403.html'), 403


@app.errorhandler(404)
def page_not_found(error):
    if session.get("previous_url"):
        url = session["previous_url"]
        session.pop("previous_url")
        return render_template('error/404.html', url=url), 404
    return render_template('error/404.html'), 404


@app.errorhandler(405)
def method_not_allowed(error):
    if session.get("previous_url"):
        url = session["previous_url"]
        session.pop("previous_url")
        return render_template('error/405.html', url=url, path=request.path, method=request.method), 405
    return render_template('error/405.html', path=request.path, method=request.method), 405


@app.errorhandler(500)
def internal_server_error(error):
    # referrer = request.referrer
    # print(referrer)
    # note that we set the 404 status explicitly
    return render_template('error/500.html'), 500


@app.before_request
def make_session_permanent():
    session.permanent = True
