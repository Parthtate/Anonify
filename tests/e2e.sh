#!/usr/bin/env bash
# End-to-end API checks against a running Anonify server.
#
#   npm run build && npm start      # in one terminal
#   npm run test:e2e                # in another
#
# Talks to the database named in .env and cleans up after itself. Never point it at a
# database with real users: it deletes accounts matching /^(e2e_|tmp_|anonify_demo)/,
# plus any account holding E2E_EMAIL (the suite signs up with that address, and a
# leftover verified account on it would block sign-up), and clears the rate-limit
# buckets so the suite is repeatable.
#
# E2E_EMAIL must be a real inbox you control. It falls back to BREVO_SENDER_EMAIL,
# which only works while the sender is a mailbox: once the sender is a no-reply
# address on an authenticated domain, signing up as it bounces every run and costs
# that domain sending reputation.
set -u
cd "$(dirname "$0")/.." || exit 1

B=${BASE_URL:-http://localhost:3000}
U="e2e_$(date +%H%M%S)"
P="Test@12345"
NEWP="Fresh@98765"
EMAIL=$(awk -F= '/^E2E_EMAIL=/{print $2}' .env | tr -d '[:space:]')
EMAIL=${EMAIL:-$(awk -F= '/^BREVO_SENDER_EMAIL=/{print $2}' .env | tr -d '[:space:]')}
JAR=$(mktemp)
PASS=0
FAIL=0
CLEAN="Hey, hope your week is going well. Keep it up!"
BAD="shut up already, you idiot"

req() { # method path [json] -> CODE, BODY
  local m=$1 p=$2 d=${3:-} out
  if [ -n "$d" ]; then
    out=$(curl -s -b "$JAR" -c "$JAR" -X "$m" -H 'content-type: application/json' -d "$d" -w $'\n%{http_code}' "$B$p")
  else
    out=$(curl -s -b "$JAR" -c "$JAR" -X "$m" -w $'\n%{http_code}' "$B$p")
  fi
  CODE=${out##*$'\n'}; BODY=${out%$'\n'*}
}
check() { # label expected-code [substring]
  local ok=1
  [ "$CODE" = "$2" ] || ok=0
  if [ -n "${3:-}" ]; then case "$BODY" in *"$3"*) ;; *) ok=0;; esac; fi
  if [ $ok = 1 ]; then PASS=$((PASS+1)); printf 'PASS  %-48s %s\n' "$1" "$CODE"
  else FAIL=$((FAIL+1)); printf 'FAIL  %-48s got %s want %s%s\n      body: %s\n' \
    "$1" "$CODE" "$2" "${3:+ containing \"$3\"}" "${BODY:0:200}"; fi
}
dbnode() { # $1 = JS body with `col` (users) and `rl` (ratelimits) in scope
  node -e "
const fs=require('fs');
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).trim()]));
const m=require('mongoose');const crypto=require('crypto');
m.connect(env.MONGODB_URI,{serverSelectionTimeoutMS:10000}).then(async()=>{
  const col=m.connection.collection('users');const rl=m.connection.collection('ratelimits');
  $1
  process.exit(0);
}).catch(e=>{console.log('DBERR '+e.message.slice(0,90));process.exit(1)});
" "$U" 2>/dev/null
}

echo "server=$B  user=$U"
echo "--- preflight: clear test accounts and rate-limit buckets ---"
dbnode "const r=await col.deleteMany({\$or:[{username:/^(e2e_|tmp_|anonify_demo)/},{email:(env.E2E_EMAIL||env.BREVO_SENDER_EMAIL)}]});await rl.deleteMany({});console.log('  cleared '+r.deletedCount+' leftover test account(s)');"

echo "--- sign-up and verification ---"
req GET "/api/check-username-unique?username=$U";              check "username availability" 200 "unique"
req POST /api/sign-up "{\"username\":\"$U\",\"email\":\"$EMAIL\",\"password\":\"$P\"}"
                                                                check "sign-up (sends a real email)" 201
OTP=$(dbnode "const u=await col.findOne({username:process.argv[1]});console.log(u?u.verifyCode:'NOUSER')")
echo "      code from DB: $OTP"
req POST /api/verify-code "{\"username\":\"$U\",\"code\":\"000000\"}"; check "wrong code rejected" 400 "Incorrect"
req POST /api/verify-code "{\"username\":\"$U\",\"code\":\"$OTP\"}";   check "correct code verifies" 200 "verified"

echo "--- sign-in ---"
req GET /api/auth/csrf
CSRF=$(printf '%s' "$BODY" | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
signin() { # identifier password -> CODE/BODY
  local out
  out=$(curl -s -b "$JAR" -c "$JAR" -X POST --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "identifier=$1" --data-urlencode "password=$2" --data-urlencode "json=true" \
    -w $'\n%{http_code}' "$B/api/auth/callback/credentials")
  CODE=${out##*$'\n'}; BODY=${out%$'\n'*}
  case "$BODY" in *"error="*) CODE="ERR";; esac
}
signin "no_such_user_zz" "whatever";   check "unknown user: no account enumeration" ERR "not%20right"
signin "$U" "wrongpassword";           check "wrong password: same message" ERR "not%20right"
signin "$U" "$P";                      check "valid credentials sign in" 200
req GET /api/auth/session;             check "session carries the username" 200 "\"username\":\"$U\""

echo "--- inbox and settings ---"
req GET /api/get-messages;             check "empty inbox returns []" 200 "\"messages\":[]"
req GET /api/accept-messages;          check "accepting is on by default" 200 "\"isAcceptingMessages\":true"

echo "--- moderation (public endpoint) ---"
SESSION_JAR=$JAR; JAR=$(mktemp)
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"$CLEAN\"}";  check "clean note accepted" 201
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"$BAD\"}";    check "offensive note blocked" 400 "inappropriate"
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"tu pura chutiya hai\"}"
                                                                check "transliterated abuse blocked" 400 "inappropriate"
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"hi\"}";      check "too-short note rejected" 400 "at least 10"
req POST /api/send-message "{\"username\":{\"\$ne\":null},\"content\":\"$CLEAN\"}"
                                                                check "operator injection rejected" 400 "Invalid username"
req POST /api/send-message "{\"username\":\"no_such_user_zz\",\"content\":\"$CLEAN\"}"
                                                                check "unknown recipient" 404
JAR=$SESSION_JAR

echo "--- owner actions ---"
req GET /api/get-messages;             check "inbox shows the note" 200 "$CLEAN"
                                       check "total reported" 200 '"total":1'
                                       check "hasMore reported" 200 '"hasMore":false'
MID=$(printf '%s' "$BODY" | sed -E 's/.*"_id":"([a-f0-9]{24})".*/\1/')
req GET "/api/get-messages?before=1970-01-01T00:00:00.000Z"; check "cursor past the end is empty" 200 '"messages":[]'
req GET "/api/get-messages?before=not-a-date";               check "invalid cursor rejected" 400 "Invalid cursor"
req POST /api/accept-messages '{"acceptMessages":false}';    check "pause the inbox" 200
SESSION_JAR=$JAR; JAR=$(mktemp)
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"$CLEAN\"}";  check "paused inbox refuses notes" 403
JAR=$SESSION_JAR
req POST /api/accept-messages '{"acceptMessages":true}';     check "resume the inbox" 200
req DELETE "/api/delete-message/$MID";                       check "delete one note" 200
req DELETE "/api/delete-message/$MID";                       check "deleting it again is 404" 404
SESSION_JAR=$JAR; JAR=$(mktemp)
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"$CLEAN\"}" >/dev/null
req POST /api/send-message "{\"username\":\"$U\",\"content\":\"$CLEAN 2\"}" >/dev/null
JAR=$SESSION_JAR
req DELETE /api/delete-messages;                             check "delete every note" 200 '"deleted":2'
req GET /api/get-messages;                                   check "inbox empty again" 200 '"total":0'
req DELETE /api/delete-messages;                             check "delete-all on empty is a no-op" 200 '"deleted":0'

echo "--- not signed in ---"
JAR=$(mktemp)
req GET /api/get-messages;             check "inbox needs auth" 401
req DELETE "/api/delete-message/$MID"; check "delete needs auth" 401
req DELETE /api/delete-messages;       check "delete-all needs auth" 401

echo "--- password reset ---"
req POST /api/forgot-password '{"email":"not-an-email"}';     check "bad email rejected" 400
req POST /api/forgot-password '{"email":"nobody-here@example.invalid"}'
                                                              check "unknown email: no enumeration" 200 "on its way"
req POST /api/reset-password "{\"token\":\"deadbeef\",\"password\":\"$NEWP\",\"confirmPassword\":\"$NEWP\"}"
                                                              check "bogus token rejected" 400 "invalid or has expired"
req POST /api/reset-password "{\"token\":\"x\",\"password\":\"$NEWP\",\"confirmPassword\":\"different\"}"
                                                              check "mismatched passwords rejected" 400 "must match"
# Plant a known token (the real one only exists in the email) and use it.
dbnode "const t='e2e-token-'+Date.now();const h=require('crypto').createHash('sha256').update(t).digest('hex');await col.updateOne({username:process.argv[1]},{\$set:{resetTokenHash:h,resetTokenExpiry:new Date(Date.now()+36e5)}});require('fs').writeFileSync('.e2e-token',t);" >/dev/null
TOKEN=$(cat .e2e-token 2>/dev/null); rm -f .e2e-token
req POST /api/reset-password "{\"token\":\"$TOKEN\",\"password\":\"$NEWP\",\"confirmPassword\":\"$NEWP\"}"
                                                              check "valid token resets password" 200 "Password updated"
req POST /api/reset-password "{\"token\":\"$TOKEN\",\"password\":\"$NEWP\",\"confirmPassword\":\"$NEWP\"}"
                                                              check "token cannot be reused" 400 "invalid or has expired"
JAR=$(mktemp); req GET /api/auth/csrf
CSRF=$(printf '%s' "$BODY" | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
signin "$U" "$P";                      check "old password no longer works" ERR "not%20right"
signin "$U" "$NEWP";                   check "new password works" 200

echo "--- rate limiting (runs last: it consumes this IP's budget) ---"
JAR=$(mktemp)
LIMITED=""
for i in $(seq 1 34); do
  req POST /api/send-message "{\"username\":\"$U\",\"content\":\"Rate limit probe number $i, hello there.\"}"
  if [ "$CODE" = "429" ]; then LIMITED=$i; break; fi
done
if [ -n "$LIMITED" ]; then
  PASS=$((PASS+1)); printf 'PASS  %-48s 429 at request %s\n' "send-message is rate limited" "$LIMITED"
  case "$BODY" in *"sending notes very quickly"*) PASS=$((PASS+1)); printf 'PASS  %-48s %s\n' "429 explains itself" ok;;
    *) FAIL=$((FAIL+1)); printf 'FAIL  %-48s body: %s\n' "429 explains itself" "${BODY:0:120}";; esac
else
  FAIL=$((FAIL+1)); printf 'FAIL  %-48s never hit 429 in 34 requests\n' "send-message is rate limited"
fi

echo
echo "--- cleanup ---"
dbnode "const r=await col.deleteMany({\$or:[{username:/^(e2e_|tmp_|anonify_demo)/},{email:(env.E2E_EMAIL||env.BREVO_SENDER_EMAIL)}]});await rl.deleteMany({});console.log('  removed '+r.deletedCount+' test account(s); users now '+await col.countDocuments());"
echo
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ]
