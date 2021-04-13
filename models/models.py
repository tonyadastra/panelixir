from flask_sqlalchemy import SQLAlchemy
import datetime

Db = SQLAlchemy()


class Vaccine(Db.Model):
    # Fields
    __tablename__ = 'info'
    __bind_key__ = 'vaccinedb'
    vac_id = Db.Column(Db.Integer, primary_key=True)
    vac_type = Db.Column(Db.String(30), nullable=False)
    country = Db.Column(Db.String(50), nullable=True)
    stage = Db.Column(Db.Integer, nullable=False)
    website = Db.Column(Db.String(300), nullable=True)
    company = Db.Column(Db.String(200), nullable=True)


class User(Db.Model):
    __tablename__ = 'users'
    __bind_key__ = 'forumdb'
    uid = Db.Column(Db.Integer, primary_key=True, autoincrement=True, nullable=False)
    first_name = Db.Column(Db.String)
    last_name = Db.Column(Db.String)
    email = Db.Column(Db.VARCHAR(60))
    picture = Db.Column("profile_picture", Db.String)
    username = Db.Column(Db.String(64), unique=True, nullable=False)
    role = Db.Column(Db.CHAR, default='U')


class Post(Db.Model):
    __tablename__ = 'posts'
    __bind_key__ = 'forumdb'
    pid = Db.Column(Db.Integer, primary_key=True, autoincrement=True)
    author = Db.Column(Db.Integer, Db.ForeignKey('users.uid'), nullable=False)
    title = Db.Column(Db.VARCHAR(500), nullable=False)
    body = Db.Column(Db.VARCHAR(1500), nullable=False)
    date = Db.Column(Db.TIMESTAMP, nullable=False, default=datetime.datetime.utcnow)
    views = Db.Column(Db.Integer, nullable=False, default=0)
    edited = Db.Column(Db.Boolean, nullable=False, default=False)
    pinned = Db.Column(Db.Boolean, nullable=False, default=False)
    status = Db.Column(Db.String, nullable=False, default='ok')
    likes = Db.relationship('UserReaction', backref='posts', lazy='dynamic', cascade="all, delete, delete-orphan")
    replies = Db.relationship('PostReplies', backref='posts', lazy=True, cascade="all, delete, delete-orphan")


class UserReaction(Db.Model):
    __tablename__ = 'user_reactions'
    __bind_key__ = 'forumdb'
    pk = Db.Column(Db.Integer, primary_key=True, autoincrement=True)
    user_id = Db.Column(Db.Integer, nullable=False)
    liked_pid = Db.Column(Db.Integer, Db.ForeignKey('posts.pid'), nullable=False)


class PostReplies(Db.Model):
    __tablename__ = 'post_replies'
    __bind_key__ = 'forumdb'
    rid = Db.Column(Db.Integer, primary_key=True, autoincrement=True, nullable=False)
    post = Db.Column(Db.Integer, Db.ForeignKey('posts.pid'), nullable=False)
    author = Db.Column(Db.Integer, Db.ForeignKey('users.uid'), nullable=False)
    reply = Db.Column(Db.String, nullable=False)
    date = Db.Column(Db.TIMESTAMP, nullable=False, default=datetime.datetime.utcnow)
    edited = Db.Column(Db.Boolean, nullable=False, default=False)
    likes = Db.relationship('UserReactionReplies', backref='post_replies', lazy=True,
                            cascade="all, delete, delete-orphan")
    comments = Db.relationship('PostReplyComments', backref='post_replies', lazy=True,
                               cascade="all, delete, delete-orphan")


class UserReactionReplies(Db.Model):
    __tablename__ = 'user_reactions_replies'
    __bind_key__ = 'forumdb'
    pk = Db.Column(Db.Integer, primary_key=True, autoincrement=True)
    liked_rid = Db.Column(Db.Integer, Db.ForeignKey('post_replies.rid'), nullable=False)
    user_id = Db.Column(Db.Integer, nullable=False)
    post = Db.Column(Db.Integer, Db.ForeignKey('posts.pid'), nullable=False)


class PostReplyComments(Db.Model):
    __tablename__ = 'post_reply_comments'
    __bind_key__ = 'forumdb'
    cid = Db.Column(Db.Integer, primary_key=True, autoincrement=True, nullable=False)
    post = Db.Column(Db.Integer, Db.ForeignKey('posts.pid'), nullable=False)
    reply = Db.Column(Db.Integer, Db.ForeignKey('post_replies.rid'), nullable=False)
    author = Db.Column(Db.Integer, Db.ForeignKey('users.uid'), nullable=False)
    comment = Db.Column(Db.String, nullable=False)
    date = Db.Column(Db.TIMESTAMP, nullable=False, default=datetime.datetime.utcnow)
    edited = Db.Column(Db.Boolean, nullable=False, default=False)
    likes = Db.relationship('LikedComments', backref='post_reply_comments', lazy=True,
                            cascade="all, delete, delete-orphan")


class LikedComments(Db.Model):
    __tablename__ = 'liked_comments'
    __bind_key__ = 'forumdb'
    pk = Db.Column(Db.Integer, primary_key=True, autoincrement=True)
    user_id = Db.Column(Db.Integer, nullable=False)
    liked_cid = Db.Column(Db.Integer, Db.ForeignKey('post_reply_comments.cid'), nullable=False)
    reply = Db.Column(Db.Integer, Db.ForeignKey('post_replies.rid'), nullable=False)
    post = Db.Column(Db.Integer, Db.ForeignKey('posts.pid'), nullable=False)


class Favorites(Db.Model):
    __tablename__ = 'favorites'
    __bind_key__ = 'forumdb'
    fid = Db.Column(Db.Integer, primary_key=True, autoincrement=True)
    uid = Db.Column(Db.Integer, Db.ForeignKey('users.uid'), nullable=False)
    entity = Db.Column(Db.Text, nullable=False)

