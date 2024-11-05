The TimePicker widget  allows you to easily select a time for a text input using your mouse or keyboards arrow keys. The widget is a wrapper enhancement of the <a href='https://github.com/rendom/bootstrap-3-timepicker' target='_blank'>TimePicker plugin</a> by rendom forked from  <a href='https://github.com/jdewit/bootstrap-timepicker' target='_blank'>jdewit's TimePicker</a>. This widget as used here has been specially enhanced for Yii framework 2.0 and Bootstrap 3. With release v1.0.4, the extension has been enhanced to support Bootstrap 4.x version.


## Installation

The preferred way to install this extension is through [composer](http://getcomposer.org/download/). Check the [composer.json](https://github.com/yii2-extensions/time-picker/blob/master/composer.json) for this extension's requirements and dependencies. Read this [web tip /wiki](http://webtips.krajee.com/setting-composer-minimum-stability-application/) on setting the `minimum-stability` settings for your application's composer.json.

To install, either run

```
$ php composer.phar require yii2-extensions/time-picker "^1.0"
```

or add

```
"yii2-extensions/time-picker": "*"
```

to the ```require``` section of your `composer.json` file.

## Release Changes

> NOTE: Refer the [CHANGE LOG](https://github.com/yii2-extensions/time-picker/blob/master/CHANGE.md) for details on changes to various releases.

## Usage

```php
use Yii2\Extensions\TimePicker\TimePicker;

// usage without model
echo '<label>Start Time</label>';
echo TimePicker::widget([
    'name' => 'start_time', 
    'value' => '11:24 AM',
    'pluginOptions' => [
        'showSeconds' => true
    ]
]);
```

or in a form

```php
<?= $form->field($model, 'start_time')->widget(TimePicker::class, [
    'pluginOptions' => [
        'showMeridian' => false,
        'defaultTime' => null
    ]
]); ?>
```

## License

**time-picker** extension is released under the BSD-3-Clause License. See the bundled `LICENSE.md` for details.