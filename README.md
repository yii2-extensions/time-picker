<!-- markdownlint-disable MD041 -->
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://www.yiiframework.com/image/design/logo/yii3_full_for_dark.svg">
        <source media="(prefers-color-scheme: light)" srcset="https://www.yiiframework.com/image/design/logo/yii3_full_for_light.svg">
        <img src="https://www.yiiframework.com/image/design/logo/yii3_full_for_light.svg" alt="Yii Framework" width="80%">
    </picture>
    <h1 align="center">TimePicker</h1>
    <br>
</p>
<!-- markdownlint-enable MD041 -->

<p align="center">
    <a href="https://github.com/yii2-extensions/time-picker/actions/workflows/build.yml" target="_blank">
        <img src="https://img.shields.io/github/actions/workflow/status/yii2-extensions/time-picker/build.yml?style=for-the-badge&label=PHPUnit&logo=github" alt="PHPUnit">
    </a>
    <a href="https://codecov.io/github/yii2-extensions/time-picker" target="_blank">
        <img src="https://img.shields.io/codecov/c/github/yii2-extensions/time-picker.svg?style=for-the-badge&logo=codecov&logoColor=white&label=Coverage" alt="Coverage">
    </a>
</p>

<p align="center">
    <strong>Bootstrap time picker for Yii2 forms</strong><br>
    <em>Standalone and model-bound inputs, configurable display formats, and canonical form submission</em>
</p>

Select a time with the mouse or keyboard arrow keys. This extension grew out of Kartik Visweswaran's Krajee widget,
which wrapped [rendom's TimePicker plugin](https://github.com/rendom/bootstrap-3-timepicker), forked from
[jdewit's TimePicker](https://github.com/jdewit/bootstrap-timepicker).

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/time-picker-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="images/time-picker-light.png">
    <img src="images/time-picker-light.png" alt="Studio booking form with the start time picker open, a 24-hour end time field, and both submitted values in HH:mm:ss">
</picture>

## Features

<picture>
    <source media="(min-width: 768px)" srcset="https://raw.githubusercontent.com/yii2-extensions/time-picker/master/docs/svgs/features.svg">
    <img src="https://raw.githubusercontent.com/yii2-extensions/time-picker/master/docs/svgs/features-mobile.svg" alt="TimePicker features: Yii2 forms, Bootstrap 3/4/5, time formats, layouts and bundled assets" style="width: 100%;">
</picture>

## Quick start

### Installation

Install with [Composer](https://getcomposer.org/download/):

```bash
composer require yii2-extensions/time-picker
```

Load the Bootstrap CSS that matches your application's `bsVersion`. On Yii 2.0.55, you can use an installed Yii
Bootstrap asset adapter; on Yii 22, provide the Bootstrap CSS and npm jQuery assets in the application. See the
[installation guide](https://github.com/yii2-extensions/time-picker/blob/master/docs/installation.md) and
[upgrade notes](UPGRADE.md).

### Basic usage

Render a standalone input:

```php
use yii\helpers\Html;
use yii2\extensions\timepicker\TimePicker;

echo Html::label('Start time', 'start-time');
echo TimePicker::widget(
    [
        'name' => 'start_time',
        'value' => '11:24 AM',
        'options' => ['id' => 'start-time'],
        'pluginOptions' => [
            'showSeconds' => true,
        ],
    ],
);
```

Or bind the widget to a model attribute inside an existing ActiveForm:

```php
use yii2\extensions\timepicker\TimePicker;

echo $form
    ->field($model, 'start_time')
    ->widget(
        TimePicker::class, [
            'pluginOptions' => [
                'showMeridian' => false,
                'defaultTime' => false,
            ],
        ]
    );
```

## Documentation

Practical guides and usage examples for time inputs, Bootstrap integration and canonical form submission.

- [Installation guide](https://github.com/yii2-extensions/time-picker/blob/master/docs/installation.md): Composer,
  Bootstrap assets, icons and compatibility.
- [Configuration guide](https://github.com/yii2-extensions/time-picker/blob/master/docs/configuration.md): widget
  options, addons, events and asset overrides.
- [Usage examples](https://github.com/yii2-extensions/time-picker/blob/master/docs/examples.md): standalone inputs and
  model-bound forms.
- [Testing guide](https://github.com/yii2-extensions/time-picker/blob/master/docs/testing.md): PHPUnit, quality checks
  and verification limits.
- [Upgrade notes](UPGRADE.md): requirements and migration steps.
- [Changelog](CHANGELOG.md): current work and historical release changes.

## AI assistance

AI agents: read the [documentation index](https://yii2-framework.github.io/docs/llms.txt) and fetch the Markdown version
of a page by appending `index.md` to its URL. The
[AI agents guide](https://yii2-framework.github.io/docs/project/ai-agents/) covers skill installation, client setup and
verification.

- 🤖 [`yii2-time-picker` skill](https://github.com/yii2-extensions/time-picker/blob/master/docs/agents.md): configure
  Bootstrap markup, icons, and plugin options; verify submitted time values and form behavior.

See the [repository guides](#documentation), the [skill source](skills/yii2-time-picker/SKILL.md), the source PHPDoc,
and the [changelog](CHANGELOG.md). Check the guides against the installed revision before applying examples.

## Package information

[![PHP](https://img.shields.io/badge/%3E%3D8.3-777BB4.svg?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/releases/8.3/en.php)
[![Yii 2.0.55+](https://img.shields.io/badge/%3E%3D2.0.55-0073AA.svg?style=for-the-badge&logo=yii&logoColor=white)](https://github.com/yiisoft/yii2/releases/tag/2.0.55)
[![Yii 22.0.x](https://img.shields.io/badge/22.0.x-0073AA.svg?style=for-the-badge&logo=yii&logoColor=white)](https://github.com/yiisoft/yii2/tree/22.0)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-3%20%7C%204%20%7C%205-7952B3.svg?style=for-the-badge&logo=bootstrap&logoColor=white)](https://github.com/yii2-extensions/time-picker/blob/master/docs/installation.md)
[![Latest Stable Version](https://img.shields.io/packagist/v/yii2-extensions/time-picker.svg?style=for-the-badge&logo=packagist&logoColor=white&label=Stable)](https://packagist.org/packages/yii2-extensions/time-picker)
[![Total Downloads](https://img.shields.io/packagist/dt/yii2-extensions/time-picker.svg?style=for-the-badge&logo=composer&logoColor=white&label=Downloads)](https://packagist.org/packages/yii2-extensions/time-picker)

## Project status

[![PHPStan Level Max](https://img.shields.io/badge/PHPStan-Level%20Max-4F5D95.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yii2-extensions/time-picker/actions/workflows/static.yml)
[![Quality](https://img.shields.io/github/actions/workflow/status/yii2-extensions/time-picker/quality.yml?style=for-the-badge&label=Quality&logo=github)](https://github.com/yii2-extensions/time-picker/actions/workflows/quality.yml)

## Security

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yii2-extensions/time-picker/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/yii2-extensions/time-picker)
[![Zizmor](https://img.shields.io/github/actions/workflow/status/yii2-extensions/time-picker/security.yml?style=for-the-badge&label=Zizmor&logo=github)](https://github.com/yii2-extensions/time-picker/actions/workflows/security.yml)

## Built with AI

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757.svg?style=for-the-badge&logo=claude&logoColor=white)](https://claude.com/claude-code)
[![Built with Codex](https://img.shields.io/badge/Built%20with-Codex-10A37F.svg?style=for-the-badge&logo=openaigym&logoColor=white)](https://openai.com/codex)
[![Reviewed by CodeRabbit](https://img.shields.io/badge/Reviewed%20by-CodeRabbit-FF570A.svg?style=for-the-badge&logo=coderabbit&logoColor=white)](https://www.coderabbit.ai)

## Special thanks

Originally developed by Kartik Visweswaran as [Krajee TimePicker](https://github.com/kartik-v/yii2-widget-timepicker).
Stefano Mtangoo adapted the extension for Yii2 Extensions. The upstream copyright and BSD-3-Clause terms remain in
[LICENSE.md](LICENSE.md).

## Our social networks

[![Follow on X](https://img.shields.io/badge/-Follow%20on%20X-1DA1F2.svg?style=for-the-badge&logo=x&logoColor=white&labelColor=000000)](https://x.com/Terabytesoftw)
[![Follow on Facebook](https://img.shields.io/badge/-Follow%20on%20Facebook-1877F2.svg?style=for-the-badge&logo=facebook&logoColor=white&labelColor=000000)](https://www.facebook.com/wilmer.arambula.9)
[![Join our Subreddit](https://img.shields.io/badge/-Join%20our%20Subreddit-FF4500.svg?style=for-the-badge&logo=reddit&logoColor=white&labelColor=000000)](https://www.reddit.com/r/Yii2/)
[![Join on Telegram](https://img.shields.io/badge/-Join%20on%20Telegram-26A5E4.svg?style=for-the-badge&logo=telegram&logoColor=white&labelColor=000000)](https://t.me/yii_framework_in_english)

## License

[![License](https://img.shields.io/badge/License-BSD--3--Clause-brightgreen.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=555555)](LICENSE.md)

The bundled Bootstrap Timepicker JavaScript and CSS also carry Joris de Wit's [MIT notice](src/assets/LICENSE).
