#!/bin/sh
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_NAME" = "Claude" ]; then
    export GIT_AUTHOR_NAME="Antigravity IDE"
    export GIT_AUTHOR_EMAIL="bot@antigravity.dev"
    export GIT_COMMITTER_NAME="Antigravity IDE"
    export GIT_COMMITTER_EMAIL="bot@antigravity.dev"
elif [ "$GIT_AUTHOR_NAME" != "leomemonbwn-maker" ] && [ "$GIT_AUTHOR_NAME" != "Leo Memon" ] && [ "$GIT_AUTHOR_NAME" != "Antigravity IDE" ]; then
    export GIT_AUTHOR_NAME="Leo Memon"
    export GIT_AUTHOR_EMAIL="leomemonbwn-maker@users.noreply.github.com"
    export GIT_COMMITTER_NAME="Leo Memon"
    export GIT_COMMITTER_EMAIL="leomemonbwn-maker@users.noreply.github.com"
fi
' --tag-name-filter cat -- --branches --tags
