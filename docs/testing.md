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

## Repository quality checks

Make the CLI tools used by the shared quality workflow available on `PATH`: actionlint with its ShellCheck helper,
codespell, EditorConfig Checker, markdownlint-cli2, Prettier and yamllint. Run all checks:

```bash
composer --no-plugins quality
```

Each tool also has its own script:

```bash
composer --no-plugins actionlint
composer --no-plugins codespell
composer --no-plugins editorconfig-checker
composer --no-plugins markdownlint
composer --no-plugins prettier
composer --no-plugins yamllint
```

The linter configuration lives in `.github/linters`, and the Prettier configuration in `.prettierrc.json` and
`.prettierignore`. CI uses the same files.

## Workflow security checks

Make zizmor and Gitleaks available on `PATH`. Audit the current workflow files with the same pedantic persona used by
the shared security workflow:

```bash
composer --no-plugins zizmor
```

Scan Git history for secrets with the repository's Gitleaks configuration:

```bash
composer --no-plugins gitleaks
```

Run both checks. Findings make the command fail; inspect them rather than disabling the checks.

```bash
composer --no-plugins security
```

Zizmor needs GitHub API access for its online audits. If the tool runs offline, report that limit separately. To request
an offline audit explicitly:

```bash
composer --no-plugins zizmor -- --offline
```

Report hosted CI execution and its PHP/OS matrix separately from these local commands. Keep generated reports in ignored
`internal/`.

## Tool references

- [Actionlint](https://github.com/rhysd/actionlint) for GitHub Actions workflow linting.
- [Codespell](https://github.com/codespell-project/codespell) for spelling checks.
- [Composer Require Checker](https://github.com/maglnet/ComposerRequireChecker) for dependency definition checks.
- [Easy Coding Standard (ECS)](https://github.com/easy-coding-standard/easy-coding-standard) for coding standards.
- [EditorConfig Checker](https://github.com/editorconfig-checker/editorconfig-checker) for EditorConfig compliance.
- [Gitleaks](https://github.com/gitleaks/gitleaks) for secret scanning.
- [Infection](https://infection.github.io/) for mutation testing.
- [Markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) for Markdown linting.
- [PHPStan](https://phpstan.org/) for static analysis.
- [PHPUnit](https://phpunit.de/) for unit tests.
- [Prettier](https://prettier.io/) for Markdown and YAML formatting checks.
- [Yamllint](https://github.com/adrienverge/yamllint) for YAML linting.
- [Zizmor](https://github.com/zizmorcore/zizmor) for GitHub Actions security audits.
