#!/bin/zsh
# One-click publish for the QUOVEX website.
# Called by the "Publish website.command" files; you don't run this directly.
#
#   publish.sh site        main website (QUOVEX WEB2)
#   publish.sh portfolio   portfolio page (also rebuilds the site's Portfolio page from it)
#   publish.sh repo        whatever is already in the GitHub folder
#
# It copies your latest files into the GitHub folder, saves them as a new
# version, pushes to GitHub (Vercel then puts it live by itself), waits
# until the live site really shows the new version, and opens it.
# Once it says "Done", you can close the Terminal window: the site stays live.

MODE="${1:-site}"
WEB2="$HOME/Desktop/QUOVEX WEB2"
PORT="$HOME/Desktop/quovex portfolio page"
REPO="$HOME/Desktop/ex-desktop/QUOVEX GITHUB"
UPLOAD="$HOME/Desktop/ex-desktop/QUOVEX UPLOAD/1 - site files (upload first)"
LIVE="https://quovex-five.vercel.app/"

bold(){ print -P "%B$1%b"; }
fail(){ print -P "%F{red}%B$1%b%f"; print; read -k1 "?Press any key to close..."; exit 1; }

clear
bold "QUOVEX  ·  publishing the website"
print

[[ -d "$REPO/.git" ]] || fail "Can't find the GitHub folder at: $REPO"

SYNC=(rsync -a --delete --exclude '.DS_Store' --exclude '.claude' --exclude '*.command' --exclude '.git')

if [[ "$MODE" == "portfolio" ]]; then
  bold "1/4  Updating the site's Portfolio page from the portfolio page…"
  python3 "$WEB2/tools/build_work_from_portfolio.py" || fail "Couldn't rebuild the Portfolio page."
  "${SYNC[@]}" "$PORT/" "$REPO/2 - portfolio page/" || fail "Couldn't copy the portfolio page."
fi
if [[ "$MODE" == "site" || "$MODE" == "portfolio" ]]; then
  bold "2/4  Copying the website into the GitHub folder…"
  "${SYNC[@]}" --exclude 'README.md' "$WEB2/" "$REPO/1 - site files (upload first)/" || fail "Couldn't copy the website files."
  [[ -d "$UPLOAD" ]] && "${SYNC[@]}" "$WEB2/" "$UPLOAD/"
fi

cd "$REPO" || fail "Can't open the GitHub folder."
# remember the GitHub token in the Mac's keychain after the first time
git config credential.helper osxkeychain

bold "3/4  Saving and pushing to GitHub…"
git add -A
if git diff --cached --quiet; then
  print "     No new changes to save."
else
  git commit -q -m "Website update $(date '+%Y-%m-%d %H:%M')" || fail "Couldn't save the changes."
  print "     Saved: $(git log -1 --pretty=%s)"
fi

# pick a changed page to check on the live site afterwards
CHECK="$(git diff --name-only origin/main HEAD 2>/dev/null | grep -E '^1 - site files \(upload first\)/[^/]+\.html$' | head -1)"

push(){ git pull -q --rebase origin main 2>/dev/null; git push origin main 2>&1; }
OUT="$(push)"; CODE=$?
if [[ $CODE -ne 0 && "$OUT" == *uthentication* ]]; then
  print
  print "GitHub needs you to sign in (only the first time)."
  print "  Username: quovexagency-ops"
  print "  Password: paste your GitHub token (it won't show while you paste), then press Return."
  printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase 2>/dev/null
  git push origin main; CODE=$?
elif [[ $CODE -ne 0 ]]; then
  print "$OUT"
fi
[[ $CODE -eq 0 ]] || fail "Push to GitHub failed (see above). Nothing on the live site changed."
print "     Pushed to GitHub."

bold "4/4  Waiting for Vercel to put it live…"
OPEN_URL="$LIVE"
[[ "$MODE" == "portfolio" ]] && OPEN_URL="${LIVE}work.html"
if [[ -n "$CHECK" ]]; then
  PAGE="${CHECK#1 - site files (upload first)/}"
  WANT="$(shasum < "$REPO/$CHECK" | cut -c1-40)"
  for i in {1..60}; do
    GOT="$(curl -sL -H 'Cache-Control: no-cache' "${LIVE}${PAGE}?check=$RANDOM" | shasum | cut -c1-40)"
    [[ "$GOT" == "$WANT" ]] && { print "     Live."; break; }
    printf "\r     still deploying… %ss " $((i*5)); sleep 5
  done
  print
else
  sleep 20
fi

open "${OPEN_URL}?v=$(date +%s)"
print
bold "Done. The website is live. You can close this window."
