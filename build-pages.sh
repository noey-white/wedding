#!/bin/sh
# Cloudflare Pages build: publish /simple as the site root.
# Cloudflare settings → Build command: sh build-pages.sh · Output directory: dist
set -e
SITE_URL="${SITE_URL:-https://joohyun-jiyeon-wedding.pages.dev/}"
rm -rf dist && mkdir -p dist
cp -R assets dist/assets
sed -e 's#\.\./assets/#assets/#g' \
    -e "s#https://noey-white.github.io/wedding/simple/#${SITE_URL}#g" \
    -e "s#https://noey-white.github.io/wedding/assets/#${SITE_URL}assets/#g" \
    simple/index.html > dist/index.html
echo "built dist for ${SITE_URL}"
