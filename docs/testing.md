# Testing

Use PHP 8.3 or later and an npm-supported Node.js version (22.22.2+, 24.15.0+ on the 24 line, or 26+).

```bash
composer update --no-plugins
npm ci --ignore-scripts
npx playwright install --only-shell chromium
TIME_PICKER_DEBUG=1 composer --no-plugins tests
TIME_PICKER_DEBUG=0 composer --no-plugins tests
npm test
npm run test:dom
```

PHPUnit covers framework integration and Bootstrap markup. The browser suite tests display, form values, events,
keyboard controls and lifecycle against both asset flavors. The jsdom suite exercises the source used to build the
distributed files. Local browser checks use Chromium by default. CI runs Chromium, Firefox and WebKit.

```bash
npx playwright install --with-deps --only-shell chromium firefox webkit
TIME_PICKER_BROWSERS='chromium firefox webkit' npm test
```

## Verify installed consumers

This script creates a Composer archive, installs the package in an isolated application and exercises its published
assets, popup placement and editing, ActiveForm, PJAX replacement and HTTP POST. Use `TIME_PICKER_BROWSERS` to select
the engines for this script as well.

```bash
bash scripts/verify-consumer.sh 2.0.55
TIME_PICKER_DEPENDENCIES=lowest bash scripts/verify-consumer.sh 2.0.55
bash scripts/verify-consumer.sh 22.0.x-dev
```

## Verify build and quality

```bash
npm run build
npm run check:assets
composer --no-plugins quality
composer --no-plugins static
composer --no-plugins ecs-check
composer --no-plugins check-dependencies
```

The build regenerates the minified JavaScript and CSS and preserves the license banners. The check compares their bytes
with the distributed files.

## Coverage and mutation

Install PCOV for Infection.

```bash
composer --no-plugins mutation
npm run coverage
npm run mutation
```

The build workflow produces PHP coverage and reports it to Codecov. PHPStan, ECS, Composer Require Checker and Infection
are hard gates; Infection requires 100% MSI with uncovered code included. JavaScript line, function and branch coverage
and Stryker require 100%; the minified assets are checked by `npm run check:assets` and the browser suites.

`composer quality` uses the repository's formatting and workflow linters. `composer security` uses Zizmor and Gitleaks.
