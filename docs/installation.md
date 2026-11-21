# Installation

TimePicker requires PHP 8.3 or later, Yii 2.0.55 or the official `22.0.x-dev` framework line, and jQuery. The Composer
package includes the picker JavaScript, CSS and licenses. Load Bootstrap 3, 4, or 5 through the application.

## Yii 2.0.55

Configure the asset repository at the application root if it does not already resolve Bower assets.

```bash
composer config repositories.asset-packagist composer https://asset-packagist.org
composer require yii2-extensions/time-picker
```

With Yii 2.0, the widget registers the installed Yii Bootstrap asset adapter for the chosen version. The corresponding
Composer packages are `yiisoft/yii2-bootstrap`, `yiisoft/yii2-bootstrap4`, and `yiisoft/yii2-bootstrap5`.

## Yii 22.0 development line

Require the official `yiisoft/yii2:22.0.x-dev` at the application root. Point Yii's `@npm` alias at the application's
npm directory. Yii 22 resolves its jQuery asset from `@npm/jquery/dist`. Install `yii2-pjax` there if the application
uses Yii's PJAX widget.

```bash
composer require yiisoft/yii2:22.0.x-dev yii2-extensions/time-picker
npm install jquery@3.7.1 bootstrap@5.3.8
# For Yii's PJAX widget:
npm install yii2-pjax@2.0.8
```

For Yii 22 client-side ActiveForm validation, install the official jQuery client-script extension and include
`yii\jquery\Bootstrap::class` in the application's `bootstrap` configuration.

```bash
composer require yiisoft/yii2-jquery:dev-master
```

The Yii Bootstrap 3/4/5 adapter releases that constrain Yii to 2.0 cannot be installed with Yii 22.

## Bootstrap version

Set `Yii::$app->params['bsVersion']` to `3.x`, `4.x` or `5.x`; Bootstrap 3 is the default. A widget's `bsVersion`
overrides that value for its markup and optional installed asset adapter. Bootstrap 3 uses Glyphicons. Bootstrap 4 and 5
use Font Awesome classes, which this package does not install: load Font Awesome or supply your own `addon` markup and
`upArrowStyle` and `downArrowStyle` classes in `pluginOptions`.

- [Configuration](configuration.md)
- [Usage examples](examples.md)
- [Testing](testing.md)
- [Upgrade notes](../UPGRADE.md)
