#!/usr/bin/env bash
# Upload the built PWA to a Bunny storage zone through the S3 API, then prune
# old assets. Usage: upload-bunny.sh <dist dir>
#
# Needs BUNNY_STORAGE_ZONE, BUNNY_S3_ENDPOINT and the AWS_* credentials.
# ASSET_KEEP_DAYS (default 30) sets how long the assets of a replaced version
# stay available for clients that still run it.
set -euo pipefail

: "${BUNNY_STORAGE_ZONE:?BUNNY_STORAGE_ZONE is required}"
: "${BUNNY_S3_ENDPOINT:?BUNNY_S3_ENDPOINT is required}"
dist="${1:?Pass the built PWA directory}"
work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT
keep_days="${ASSET_KEEP_DAYS:-30}"
bucket="s3://${BUNNY_STORAGE_ZONE}"

test -s "${dist}/index.html"
test -s "${dist}/sw.js"
test -d "${dist}/assets"

s3() {
  aws s3 "$@" --endpoint-url "${BUNNY_S3_ENDPOINT}" --only-show-errors
}

# Print the keys under a prefix, one per line. A failed listing stops the
# script, so prune never runs on a partial list.
list_keys() {
  aws s3api list-objects-v2 --bucket "${BUNNY_STORAGE_ZONE}" --prefix "$1" \
    --endpoint-url "${BUNNY_S3_ENDPOINT}" --query 'Contents[].Key' \
    --output text > "${work}/listing"
  tr '\t' '\n' < "${work}/listing" | { grep -v -e '^None$' -e '^$' || true; }
}

aws configure set default.s3.addressing_style path

# 1. Hashed assets first. Old assets stay, so open clients can still load
#    the chunks of their version.
s3 cp "${dist}/assets" "${bucket}/assets/" --recursive \
  --cache-control "public, max-age=31536000, immutable"

# 2. Other files, for example the Workbox runtime that sw.js loads.
s3 cp "${dist}" "${bucket}/" --recursive \
  --exclude "assets/*" --exclude "sw.js" --exclude "index.html" \
  --cache-control "no-cache"

# 3. Entry points last. index.html goes before sw.js, because the new
#    service worker precaches index.html when it installs.
for file in index.html sw.js; do
  s3 cp "${dist}/${file}" "${bucket}/${file}" --cache-control "no-cache"
done

# 4. Record the assets of this deploy. Prune uses these lists, not the
#    storage timestamps.
deploy="$(date -u +%Y%m%dT%H%M%SZ)"
(cd "${dist}" && find assets -type f | sort) > "${work}/${deploy}.txt"
s3 cp "${work}/${deploy}.txt" "${bucket}/deploys/${deploy}.txt" \
  --cache-control "no-cache"

# 5. Prune. Keep the assets of every deploy in the last keep_days days, and
#    of the newest deploy before that, because that version was live inside
#    the window. Without a deploy list older than the window, the history is
#    too short and nothing is pruned.
cutoff="$(date -u -d "-${keep_days} days" +%Y%m%dT%H%M%SZ)"
list_keys deploys/ | sed 's|^deploys/||' \
  | { grep -E '^[0-9]{8}T[0-9]{6}Z\.txt$' || true; } | sort > "${work}/lists"

keep_from=""
while IFS= read -r list; do
  if [[ "${list%.txt}" < "${cutoff}" ]]; then
    keep_from="${list}"
  fi
done < "${work}/lists"

if [ -z "${keep_from}" ]; then
  echo "Prune skipped: no deploy list is older than ${keep_days} days."
  exit 0
fi

: > "${work}/keep"
: > "${work}/old-lists"
while IFS= read -r list; do
  if [[ "${list}" < "${keep_from}" ]]; then
    echo "${list}" >> "${work}/old-lists"
  else
    s3 cp "${bucket}/deploys/${list}" - >> "${work}/keep"
  fi
done < "${work}/lists"
# The current deploy must be in the keep set, also if the listing missed it.
cat "${work}/${deploy}.txt" >> "${work}/keep"
sort -u -o "${work}/keep" "${work}/keep"

list_keys assets/ | sort > "${work}/stored"
comm -23 "${work}/stored" "${work}/keep" > "${work}/delete"

echo "Prune: keep $(wc -l < "${work}/keep") assets from deploy ${keep_from%.txt} on," \
  "delete $(wc -l < "${work}/delete") assets and $(wc -l < "${work}/old-lists") deploy lists."
sed 's|^|deploys/|' "${work}/old-lists" >> "${work}/delete"
xargs -P 8 -I '{}' aws s3 rm "${bucket}/{}" \
  --endpoint-url "${BUNNY_S3_ENDPOINT}" --only-show-errors < "${work}/delete"
