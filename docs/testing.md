# Testing

The development suite uses PHP 8.3 or later and PHPUnit 12.5. It exercises the legacy Yii 2.0 backend; the test matrix
does not declare a new production PHP minimum or Yii 22 compatibility.

```bash
composer install --no-plugins
composer tests
composer quality
composer security
```

The repository disables the Yii Composer plugin for its own development install. Tests configure Yii and asset aliases
explicitly; this does not change plugin settings in consuming applications.

The PHP suite covers standalone and model-bound inputs, Bootstrap 3/4/5 markup, options, plugin events, asset
dependencies and asset overrides. Run it with debug and minified asset selection:

```bash
TIME_PICKER_DEBUG=1 composer tests
TIME_PICKER_DEBUG=0 composer tests
```

Quality tools (`actionlint`, `codespell`, `editorconfig-checker`, `markdownlint-cli2`, `prettier` and `yamllint`) and
security tools (`zizmor` and `gitleaks`) must be available on the executable path. CI delegates to the pinned
organization workflows. Gitleaks in hosted CI requires the organization secret `GITLEAKS_LICENSE`.

Bundled upstream JavaScript/CSS and the original license are preserved rather than reformatted. PHP tests do not verify
browser interaction, keyboard controls or repeated PJAX initialization. Test those flows in a real application before a
release. PHPStan, ECS, mutation coverage and a Yii 22 build require a separate runtime modernization decision.
