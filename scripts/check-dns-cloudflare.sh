#!/usr/bin/env bash
# Checks the DNS move in page-cms-how-to-move-dns-to-cloudflare.md (step 8).
# Hand-run on macOS or Linux after the zone shows Active. Needs dig and curl.
#
#   scripts/check-dns-cloudflare.sh [domain] [how-to]
#
# Reads the "## Current records" table from the how-to and checks each filled-in
# row against Cloudflare's own nameservers, so a stale local cache cannot hide a
# missing record. Exits non-zero if anything fails.

set -u

DOMAIN=${1:-stpaulswarton.co.uk}
HOWTO=${2:-$(dirname "$0")/../docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md}

fails=0
pass() { printf 'PASS  %s\n' "$*"; }
fail() { printf 'FAIL  %s\n' "$*"; fails=$((fails + 1)); }
warn() { printf 'WARN  %s\n' "$*"; }

for tool in dig curl; do
  command -v "$tool" >/dev/null || { echo "$tool is not installed" >&2; exit 2; }
done
[ -f "$HOWTO" ] || { echo "how-to not found: $HOWTO" >&2; exit 2; }

# Lower case, no trailing dot, TXT strings unquoted and joined.
norm() { sed -e 's/" "//g' -e 's/"//g' -e 's/\.$//' | tr '[:upper:]' '[:lower:]'; }

# 1. Delegation: the .uk registry must point only at Cloudflare.
parent_ns=$(dig +short NS "$DOMAIN" @nsa.nic.uk +norec | norm | sort)
if [ -z "$parent_ns" ]; then
  parent_ns=$(dig +short NS "$DOMAIN" | norm | sort)
  warn "could not ask the .uk registry, using your resolver instead"
fi
if [ -n "$parent_ns" ] && ! grep -qv '\.ns\.cloudflare\.com$' <<<"$parent_ns"; then
  pass "nameservers are Cloudflare: $(tr '\n' ' ' <<<"$parent_ns")"
else
  fail "nameservers are not all Cloudflare: $(tr '\n' ' ' <<<"$parent_ns")"
fi
cf_ns=$(grep '\.ns\.cloudflare\.com$' <<<"$parent_ns" | head -n 1)

# 2. DNSSEC: a DS record left at the registry breaks resolution.
ds=$(dig +short DS "$DOMAIN" @nsa.nic.uk +norec)
if [ -z "$ds" ]; then
  pass "no DS record at the registry"
else
  dnskey=$(dig +short DNSKEY "$DOMAIN" ${cf_ns:+@$cf_ns})
  if [ -n "$dnskey" ]; then pass "DS record present and Cloudflare signs the zone"
  else fail "DS record at the registry but Cloudflare does not sign the zone: remove DS at the registrar"; fi
fi

# 3. Records table: every filled-in row answers the same from Cloudflare.
rows=$(awk '/^## Current records/{on=1; next} on && /^## /{exit} on && /^\|/' "$HOWTO" |
  awk -F'|' 'NF >= 6 {
    for (i = 2; i <= 4; i++) { gsub(/`/, "", $i); gsub(/^ +| +$/, "", $i) }
    if ($2 == "" || $2 == "Type" || $2 ~ /^-+$/ || $4 == "") next
    if ($2 == "NS" || $2 == "SOA" || $2 == "DS") next
    print $2 "\t" $3 "\t" $4 }')
if [ -z "$rows" ]; then
  fail "records table has no filled-in rows to check (step 1 not done?)"
fi
while IFS=$'\t' read -r type name value; do
  [ -n "$type" ] || continue
  case "$name" in
    @|"") fqdn=$DOMAIN ;;
    *"$DOMAIN"|*"$DOMAIN".) fqdn=${name%.} ;;
    *) fqdn=$name.$DOMAIN ;;
  esac
  want=$(norm <<<"$value")
  got=$(dig +short "$type" "$fqdn" ${cf_ns:+@$cf_ns} | norm)
  if grep -qxF -- "$want" <<<"$got"; then
    pass "$type $fqdn"
  else
    fail "$type $fqdn: want '$want', Cloudflare says '$(tr '\n' ' ' <<<"$got")'"
  fi
done <<<"$rows"

# 4. DNS only: the old site still answers itself, not through Cloudflare.
headers=$(curl -sI --max-time 20 "http://$DOMAIN/" | tr -d '\r')
status=$(head -n 1 <<<"$headers" | awk '{print $2}')
if [ "$status" = 200 ]; then pass "http://$DOMAIN/ returns 200"
else fail "http://$DOMAIN/ returns '${status:-nothing}'"; fi
if grep -qiE '^(cf-ray|server: cloudflare)' <<<"$headers"; then
  fail "responses come through Cloudflare: a record is proxied, set it to DNS only"
else
  pass "no Cloudflare headers, records are DNS only"
fi
if grep -qi '^set-cookie: arraffinity' <<<"$headers"; then pass "legacy App Service answers (ARRAffinity cookie)"
else warn "no ARRAffinity cookie, check the page in a browser"; fi

echo
echo "Still to do by hand: send a test email to a church address and get a reply."
if [ "$fails" -gt 0 ]; then
  echo "$fails check(s) failed. See Roll back in the how-to if you cannot fix them within an hour."
  exit 1
fi
echo "All checks passed."
