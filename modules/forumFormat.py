import datetime
import timeago


def getTimeAgo(event_time):
    current_time = datetime.datetime.now(tz=datetime.timezone.utc)
    TimeNotation = timeago.format(event_time, current_time)
    return TimeNotation


def formatInput(user_input):
    if "'" in user_input:
        user_input = user_input.replace("'", "&apos;")
    if "\"" in user_input:
        user_input = user_input.replace("\"", "&quot;")
    if "\n" in user_input:
        user_input = user_input.replace("\n", "<br>")
    return user_input


# Do not use this function in python for JSON
def toJSBoolean(boolean):
    return 'true' if boolean is True else 'false'


def getEntityID(category, pid, rid=None, cid=None):
    return category[:1] + f'{pid}{("_" + str(rid)) if rid is not None else ""}' \
                          f'{("_" + str(cid)) if cid is not None else ""}'


def readEntity(eid):
    def readCategory(c):
        # python implementation of 'case'
        return {
            'p': 'post',
            # 'r': 'reply',
            # 'c': 'comment'
        }.get(c, 'p')

    def readIDs(id_category, ids):
        if not ids:
            raise ValueError

        if id_category == "post":
            return dict(pid=ids[0])
        # elif id_category == "reply":
        #     return dict(pid=ids[0], rid=ids[1])
        # elif id_category == "comment":
        #     return dict(pid=ids[0], rid=ids[1], cid=ids[2])
        else:
            raise NameError

    category = readCategory(eid[:1])
    ids_dict = readIDs(category, eid[1:].split("_"))
    return dict(category=category, **ids_dict)


def readPost(cPost, session_uid=-1, latest_reply_time=None, basic_info_only=False):
    if basic_info_only:
        return dict(pid=cPost.pid, title=cPost.title, body=cPost.body,
                    date=getTimeAgo(max(d for d in [cPost.date, latest_reply_time] if d is not None)),
                    likes=len(cPost.likes.all()), views=cPost.views, replies=len(cPost.replies),
                    edited=cPost.edited
                    )
    return dict(pid=cPost[1].pid, username=cPost[0].username, picture=cPost[0].picture,
                title=cPost[1].title, body=cPost[1].body,
                date=getTimeAgo(max(d for d in [cPost[1].date, latest_reply_time] if d is not None)),
                likes=len(cPost[1].likes.all()), views=cPost[1].views, replies=len(cPost[1].replies),
                likedByUser=bool(len(cPost[1].likes.filter_by(user_id=session_uid).all())),
                edited=cPost[1].edited,
                postedByUser=cPost[0].uid == session_uid
                )





