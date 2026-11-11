# Installation

TimePicker requires a compatible Yii application (the test baseline is Yii 2.0), `kartik-v/yii2-krajee-base` 3.x, jQuery
and the Yii Bootstrap extension matching your application. Install only the Bootstrap integration you use. The bundled
time picker JavaScript and CSS are included with this package.

Krajee versions below 3.0 do not provide the `isBs()` method used by this widget. Applications pinned to Krajee 2.x must
upgrade their Krajee extensions together before updating TimePicker.

## Composer

Configure the asset repository in the root application if it does not already resolve Yii's Bower assets:

```bash
composer config repositories.asset-packagist composer https://asset-packagist.org
composer require yii2-extensions/time-picker yiisoft/yii2-bootstrap
```

Composer does not inherit repositories from dependencies. Keep the application's existing asset resolver if it already
provides the required packages.

For Bootstrap 4 or 5, select the corresponding integration instead:

```bash
composer require yii2-extensions/time-picker yiisoft/yii2-bootstrap4
# Or:
composer require yii2-extensions/time-picker yiisoft/yii2-bootstrap5
```

Configure the same Bootstrap major version globally so the widget and its asset bundle agree:

```php
'params' => [
    'bsVersion' => '5.x',
],
```

Bootstrap 3 is the default. For Bootstrap 4 and 5, load compatible Font Awesome icons separately or provide your own
`addon`, `upArrowStyle` and `downArrowStyle` markup/classes. TimePicker does not install Font Awesome.

## Compatibility

This package retains the `Yii2\Extensions\TimePicker` namespace and Krajee parent classes. Yii 22 is not included in the
development test baseline: newer core revisions move the client assets used by Krajee to a separate package and
namespace. Earlier Yii 22 revisions may retain those symbols, but that does not establish compatibility with the current
core. A supported Yii 22 port needs a verified client-asset integration.

Yii remains an application-provided runtime prerequisite. Its direct Composer requirement is deferred until the Yii
2.0/Yii 22 support policy is established; installing only this package does not guarantee that Yii core is present.

The package does not introduce a new production PHP floor in this maintenance change. Select a PHP version supported by
your resolved Yii, Krajee and Bootstrap dependencies. The development test suite uses PHP 8.3 or later.

Krajee's inherited configuration remains available, including `bsVersion`, `pluginOptions`, `pluginEvents`,
`pjaxContainerId`, `disabled`, `readonly`, `language` and asset overrides. See the installed Krajee source for the
contract matching your version.

## Further reading

- [Configuration](configuration.md)
- [Usage examples](examples.md)
- [Testing](testing.md)
- [Upgrade notes](../UPGRADE.md)
