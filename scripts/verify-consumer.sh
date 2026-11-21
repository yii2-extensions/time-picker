#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
version=${1:?Pass the exact Composer requirement for Yii.}
directory=$(mktemp -d)
port=${TIME_PICKER_TEST_PORT:-18753}
php=${TIME_PICKER_PHP:-php}
server=

cleanup() {
    if [[ -n $server ]]; then
        kill "$server" 2>/dev/null || true
    fi
}
trap cleanup EXIT

printf 'Consumer logs and dependency lock: %s\n' "$directory"
composer -d "$root" archive --format=zip --dir="$directory" --file=time-picker
unzip -q "$directory/time-picker.zip" -d "$directory/package"
test -f "$directory/package/LICENSE.md"
test -f "$directory/package/src/assets/LICENSE"
for dev in internal tests vendor node_modules scripts package.json package-lock.json; do
    test ! -e "$directory/package/$dev"
done

cd "$directory"
composer init --no-interaction --name smoke/time-picker-consumer >/dev/null
composer config repositories.time-picker '{"type":"path","url":"'"$directory/package"'","options":{"symlink":false}}'
composer config repositories.asset-packagist composer https://asset-packagist.org
packages=("yiisoft/yii2:$version" "yii2-extensions/time-picker:@dev")
if [[ $version == 22.* ]]; then
    packages+=("yiisoft/yii2-jquery:dev-master")
fi
composer require --no-update --no-interaction --no-plugins "${packages[@]}"
resolution=()
if [[ ${TIME_PICKER_DEPENDENCIES:-highest} == lowest ]]; then
    resolution+=(--prefer-lowest --prefer-stable)
fi
composer update --no-interaction --no-plugins --no-scripts --no-progress --prefer-dist "${resolution[@]}"
printf '{"name":"time-picker-consumer","private":true}\n' > package.json
npm install --ignore-scripts --no-audit --no-fund \
    jquery@3.7.1 yii2-pjax@2.0.8 bootstrap@5.3.8
mkdir -p public/assets
cp "$root/tests/fixtures/consumer.php" public/index.php
cp node_modules/bootstrap/dist/css/bootstrap.min.css public/bootstrap.css

"$php" -S "127.0.0.1:$port" -t public > php-server.log 2>&1 &
server=$!
for attempt in {1..30}; do
    if curl -fsS -o /dev/null "http://127.0.0.1:$port/"; then
        break
    fi
    if ! kill -0 "$server" || [[ $attempt -eq 30 ]]; then
        cat php-server.log
        exit 1
    fi
    sleep 0.2
done

node "$root/tests/js/consumer.cjs" "http://127.0.0.1:$port"
