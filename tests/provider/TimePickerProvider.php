<?php

declare(strict_types=1);

namespace yii2\extensions\timepicker\tests\provider;

use yii\base\DynamicModel;
use yii\web\JsExpression;
use yii2\extensions\timepicker\tests\TimePickerTest;
use yii2\extensions\timepicker\TimePickerAsset;

/**
 * Data provider for {@see TimePickerTest} markup, plugin option, asset file, Bootstrap adapter and invalid
 * configuration cases.
 */
final class TimePickerProvider
{
    public const string BOOTSTRAP3 = <<<'HTML'
        <div class="bootstrap-timepicker input-group">
        <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
        <span class="input-group-addon">
        <button type="button" class="timepicker-addon-button picker" aria-label="Choose a time">
        <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
        </button>
        </span>
        </div>
        HTML;
    public const string BOOTSTRAP4 = <<<'HTML'
        <div class="bootstrap-timepicker input-group">
        <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
        <div class="input-group-append">
        <span class="input-group-text">
        <button type="button" class="timepicker-addon-button picker" aria-label="Choose a time">
        <i class="far fa-clock" aria-hidden="true"></i>
        </button>
        </span>
        </div>
        </div>
        HTML;

    /**
     * @return iterable<string, array{array<string, mixed>, list<string>, list<string>, string|null}>
     */
    public static function assetFiles(): iterable
    {
        $published = str_replace('\\', '/', dirname(__DIR__, 2)) . '/src/assets';

        yield 'minified files' => [
            ['debug' => false],
            ['css/bootstrap-timepicker.min.css'],
            ['js/bootstrap-timepicker.min.js'],
            $published,
        ];
        yield 'aliased source path' => [
            ['debug' => true, 'sourcePath' => '@app/src/assets/'],
            ['css/bootstrap-timepicker.css'],
            ['js/bootstrap-timepicker.js'],
            $published,
        ];
        yield 'debug files with script opt-out' => [
            ['debug' => true, 'js' => TimePickerAsset::EMPTY_ASSET],
            ['css/bootstrap-timepicker.css'],
            [],
            $published,
        ];
        yield 'unpublished custom script with stylesheet opt-out' => [
            ['sourcePath' => TimePickerAsset::EMPTY_PATH, 'css' => TimePickerAsset::EMPTY_ASSET, 'js' => ['custom.js']],
            [],
            ['custom.js'],
            null,
        ];
    }

    /**
     * @return iterable<string, array{array<string, bool>, array<string, bool>, 3|4|5, bool, list<string>}>
     */
    public static function bootstrapAdapters(): iterable
    {
        yield 'default stylesheet adapter' => [
            [],
            [],
            3,
            true,
            ['yii\bootstrap\BootstrapAsset'],
        ];
        yield 'plugin flag adds the script adapter' => [
            [],
            ['bsPluginEnabled' => true],
            5,
            true,
            ['yii\bootstrap5\BootstrapAsset', 'yii\bootstrap5\BootstrapPluginAsset'],
        ];
        yield 'application opt-in' => [
            ['bsDependencyEnabled' => true],
            [],
            4,
            true,
            ['yii\bootstrap4\BootstrapAsset'],
        ];
        yield 'application opt-out' => [
            ['bsDependencyEnabled' => false],
            ['bsPluginEnabled' => true],
            5,
            true,
            [],
        ];
        yield 'asset opt-out' => [
            [],
            ['bsDependencyEnabled' => false, 'bsPluginEnabled' => true],
            5,
            true,
            [],
        ];
        yield 'asset opt-in overrides application opt-out' => [
            ['bsDependencyEnabled' => false],
            ['bsDependencyEnabled' => true],
            3,
            true,
            ['yii\bootstrap\BootstrapAsset'],
        ];
        yield 'asset opt-out overrides application opt-in' => [
            ['bsDependencyEnabled' => true],
            ['bsDependencyEnabled' => false],
            4,
            true,
            [],
        ];
        yield 'missing adapter' => [
            [],
            ['bsPluginEnabled' => true],
            4,
            false,
            [],
        ];
    }

    /**
     * @return iterable<string, array{0: array<string, mixed>, 1: string, 2?: array<string, mixed>}>
     */
    public static function invalidConfigurations(): iterable
    {
        $version = 'TimePicker requires Bootstrap 3, 4 or 5.';

        yield 'unsupported bootstrap version' => [
            ['bsVersion' => 6],
            $version,
        ];
        yield 'bootstrap version starting with a dot' => [
            ['bsVersion' => '.5.3.8'],
            $version,
        ];
        yield 'non-string application bootstrap version' => [
            [],
            $version,
            ['bsVersion' => 3.0],
        ];
        yield 'non-array addon buttonOptions' => [
            ['addonOptions' => ['buttonOptions' => 'incorrect']],
            'TimePicker addon buttonOptions must be an array.',
        ];
        yield 'non-string bootstrap 5 addon class' => [
            [
                'bsVersion' => 5,
                'addonOptions' => ['asButton' => true, 'class' => true],
            ],
            'TimePicker addon class must be a string or array.',
        ];
    }

    /**
     * @return iterable<string, array{0: array<string, mixed>, 1: string, 2?: array<string, mixed>}>
     */
    public static function markup(): iterable
    {
        yield 'bootstrap 3 from the application version' => [
            [],
            self::BOOTSTRAP3,
        ];
        yield 'bootstrap 3 without an application version' => [
            [],
            self::BOOTSTRAP3,
            [],
        ];
        yield 'bootstrap 4 from the application version' => [
            [],
            self::BOOTSTRAP4,
            ['bsVersion' => '4.x'],
        ];
        yield 'bootstrap 5 from the application version' => [
            [],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
            <button type="button" class="timepicker-addon-button picker input-group-text" aria-label="Choose a time">
            <i class="far fa-clock" aria-hidden="true"></i>
            </button>
            </div>
            HTML,
            ['bsVersion' => '5.x'],
        ];
        yield 'widget version overrides the application version' => [
            ['bsVersion' => '4.6.2'],
            self::BOOTSTRAP4,
            ['bsVersion' => '3.4.1'],
        ];
        yield 'bootstrap 3 button' => [
            ['addonOptions' => ['asButton' => true]],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
            <span class="input-group-btn">
            <button type="button" class="btn btn-default picker" aria-label="Choose a time">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </button>
            </span>
            </div>
            HTML,
        ];
        yield 'sized bootstrap 3 button with input defaults' => [
            [
                'size' => 'lg',
                'defaultOptions' => ['id' => 'start-time', 'data-default' => 'yes'],
                'addonOptions' => ['asButton' => true],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group input-group-lg">
            <input type="text" id="start-time" class="form-control" name="clock" data-default="yes" data-krajee-timepicker="{key}">
            <span class="input-group-btn">
            <button type="button" class="btn btn-default picker" aria-label="Choose a time">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </button>
            </span>
            </div>
            HTML,
        ];
        yield 'bootstrap 4 button with a caller class' => [
            [
                'bsVersion' => 4,
                'addonOptions' => [
                    'asButton' => true,
                    'buttonOptions' => ['class' => 'custom'],
                ],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
            <div class="input-group-append">
            <button type="button" class="custom picker" aria-label="Choose a time">
            <i class="far fa-clock" aria-hidden="true"></i>
            </button>
            </div>
            </div>
            HTML,
        ];
        yield 'disabled bootstrap 5 button with merged attributes' => [
            [
                'bsVersion' => 5,
                'disabled' => true,
                'addonOptions' => [
                    'data-owner' => 'wrapper',
                    'asButton' => true,
                    'buttonOptions' => ['data-owner' => 'button'],
                    'data-addon' => 'clock',
                ],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" disabled data-krajee-timepicker="{key}">
            <button type="button" class="btn btn-secondary picker disabled-addon" disabled data-owner="button" data-addon="clock" aria-label="Choose a time">
            <i class="far fa-clock" aria-hidden="true"></i>
            </button>
            </div>
            HTML,
        ];
        yield 'bootstrap 5 button with a literal PJAX ID and label' => [
            [
                'bsVersion' => '5.3',
                'pjaxContainerId' => 'appointments:pjax',
                'options' => ['id' => 'appointment:start'],
                'addonOptions' => [
                    'asButton' => true,
                    'class' => 'custom-addon',
                    'buttonOptions' => ['aria-label' => 'Open start time'],
                ],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="appointment:start" class="form-control" name="clock" data-krajee-timepicker="{key}" data-timepicker-pjax="appointments:pjax">
            <button type="button" class="btn btn-secondary picker custom-addon" aria-label="Open start time">
            <i class="far fa-clock" aria-hidden="true"></i>
            </button>
            </div>
            HTML,
        ];
        yield 'readonly field with a disabled opener' => [
            [
                'bsVersion' => 4,
                'readonly' => true,
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" readonly data-krajee-timepicker="{key}">
            <div class="input-group-append">
            <span class="disabled-addon input-group-text">
            <button type="button" class="timepicker-addon-button picker" disabled aria-label="Choose a time">
            <i class="far fa-clock" aria-hidden="true"></i>
            </button>
            </span>
            </div>
            </div>
            HTML,
        ];
        yield 'disabled readonly field with a custom addon and container' => [
            [
                'disabled' => true,
                'readonly' => true,
                'addon' => '<span>Clock</span>',
                'containerOptions' => ['data-role' => 'clock'],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group" data-role="clock">
            <input type="text" id="w0" class="form-control" name="clock" readonly disabled data-krajee-timepicker="{key}">
            <span class="disabled-addon input-group-addon">
            <button type="button" class="timepicker-addon-button picker" disabled aria-label="Choose a time">
            <span>Clock</span>
            </button>
            </span>
            </div>
            HTML,
        ];
        yield 'explicit flag overrides with sized bootstrap 4 inline defaults' => [
            [
                'bsVersion' => 4,
                'disabled' => true,
                'readonly' => true,
                'options' => ['disabled' => false, 'readonly' => false],
                'defaultPluginOptions' => ['template' => false],
                'addon' => false,
                'size' => 'lg',
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker bootstrap-timepicker4">
            <input type="text" id="w0" class="form-control form-control-lg" name="clock" data-krajee-timepicker="{key}">
            </div>
            HTML,
        ];
        yield 'bootstrap 3 inline icon' => [
            ['pluginOptions' => ['template' => false]],
            <<<'HTML'
            <div class="bootstrap-timepicker bootstrap-timepicker3">
            <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
            <span class="inline-addon">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </span>
            </div>
            HTML,
        ];
        yield 'small bootstrap 3 inline icon' => [
            [
                'size' => 'sm',
                'pluginOptions' => ['template' => false],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker bootstrap-timepicker3">
            <input type="text" id="w0" class="form-control input-sm" name="clock" data-krajee-timepicker="{key}">
            <span class="inline-addon inline-addon-sm">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </span>
            </div>
            HTML,
        ];
        yield 'dropdown template overrides the inline default' => [
            [
                'defaultPluginOptions' => ['template' => false],
                'pluginOptions' => ['template' => 'dropdown'],
            ],
            self::BOOTSTRAP3,
        ];
        yield 'input group without an addon' => [
            ['addon' => false],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="w0" class="form-control" name="clock" data-krajee-timepicker="{key}">
            </div>
            HTML,
        ];
        yield 'named input with ID, value and options' => [
            [
                'value' => '11:24 AM',
                'options' => ['id' => 'start-time'],
                'pluginOptions' => ['showSeconds' => true],
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="start-time" class="form-control" name="clock" value="11:24 AM" data-krajee-timepicker="{key}">
            <span class="input-group-addon">
            <button type="button" class="timepicker-addon-button picker" aria-label="Choose a time">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </button>
            </span>
            </div>
            HTML,
        ];
        yield 'model attribute' => [
            [
                'model' => new DynamicModel(['start_time' => '13:45']),
                'attribute' => 'start_time',
            ],
            <<<'HTML'
            <div class="bootstrap-timepicker input-group">
            <input type="text" id="dynamicmodel-start_time" class="form-control" name="DynamicModel[start_time]" value="13:45" data-krajee-timepicker="{key}">
            <span class="input-group-addon">
            <button type="button" class="timepicker-addon-button picker" aria-label="Choose a time">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </button>
            </span>
            </div>
            HTML,
        ];
        yield 'plain input without the plugin' => [
            [
                'value' => '13:45:30',
                'pluginOptions' => false,
            ],
            <<<'HTML'
            <input type="text" id="w0" class="form-control" name="clock" value="13:45:30">
            HTML,
        ];
    }

    /**
     * @return iterable<string, array{array<string, mixed>, string}>
     */
    public static function pluginOptions(): iterable
    {
        yield 'bootstrap 3 default icons' => [
            [],
            '{"upArrowStyle":"glyphicon glyphicon-chevron-up","downArrowStyle":"glyphicon glyphicon-chevron-down"}',
        ];
        yield 'bootstrap 5 default icons with a string callback' => [
            [
                'bsVersion' => 5,
                'pluginEvents' => [
                    'changeTime.timepicker' => 'function (event) { window.selected = event.time.canonicalValue; }',
                ],
            ],
            '{"upArrowStyle":"fas fa-chevron-up","downArrowStyle":"fas fa-chevron-down","events":'
            . '{"changeTime.timepicker":function (event) { window.selected = event.time.canonicalValue; }}}',
        ];
        yield 'custom icons with an expression callback' => [
            [
                'pluginEvents' => [
                    'changeTime.timepicker' => new JsExpression('function () { window.timeChanged = true; }'),
                ],
                'pluginOptions' => ['upArrowStyle' => 'custom-up', 'downArrowStyle' => 'custom-down'],
            ],
            '{"upArrowStyle":"custom-up","downArrowStyle":"custom-down","events":'
            . '{"changeTime.timepicker":function () { window.timeChanged = true; }}}',
        ];
    }
}
