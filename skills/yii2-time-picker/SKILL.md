---
name: yii2-time-picker
description: Configure the native Yii2 TimePicker widget, Bootstrap version, icons, input markup and plugin events.
license: BSD-3-Clause
---

# Yii2 Time Picker

## Resolve the inspected revision

Read the actual installed source and its Composer metadata before choosing an API. In a checkout, inspect current HEAD
and working-tree changes; in a consumer resolve the installed path and selected reference, then compare the lockfile. A
lockfile, branch alias or latest hosted guide does not prove which files are running. Use matching-revision repository
guides when available, otherwise source/PHPDoc and report the documentation gap. Installing this skill does not install
runtime dependencies or authorize changes to application configuration.

## Apply the package contract

Use `yii2\extensions\timepicker\TimePicker`, which extends Yii's `InputWidget`. Verify the installed Yii and Bootstrap
versions. Yii 2.0.55 uses Bower jQuery assets. Official Yii 22 resolves npm assets and uses `yiisoft/yii2-jquery` for
client-side ActiveForm validation.

- Match `bsVersion` to the application's Bootstrap CSS. Yii Bootstrap adapters that require Yii 2.0 cannot supply assets
  to a Yii 22 consumer.
- Configure `pluginOptions` and `pluginEvents` against the bundled jQuery plugin. It retains `data-krajee-timepicker`
  for DynamicForm and publishes its own assets.
- `addonOptions` recognizes `asButton` and `buttonOptions`. Preserve true button semantics, disabled input behavior, the
  Bootstrap-specific wrapper and the `template: false` inline mode. Verify the rendered markup.
- For Bootstrap 4/5, default icon classes expect Font Awesome, which this package does not install. Provide compatible
  icons or explicitly supplied trusted addon markup. Do not treat raw addon markup as sanitized.
- Configure a model and attribute or standalone name and value. A valid submitted value is 24-hour `HH:mm:ss`. The
  display can hide seconds or use a meridian. Apply server-side validation.

Read the relevant installation and configuration guides in `docs/` when present, otherwise at
<https://github.com/yii2-extensions/time-picker> for the inspected revision, and the implementation in
`src/TimePicker.php` and its asset class. Verify input names, disabled markup, one plugin initialization and event
configuration in the PHP test harness; then check keyboard interaction and repeated PJAX initialization in a real
browser. PHP-only results do not certify those flows.

## Verify and report

Check model-bound and standalone names, Bootstrap 3/4/5 wrappers, disabled inputs and template=false. Run the existing
PHP suite with debug and minified assets, then verify keyboard and PJAX behavior separately.

Use the package's existing test commands after inspecting composer.json; do not invent a script name or install missing
dependencies automatically. Separate native skill discovery/loading from successful task execution, PHP tests from
browser checks, and local modifications from published releases. Keep any unperformed verification explicit.
