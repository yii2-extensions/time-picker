<?php

declare(strict_types=1);

namespace Yii2\Extensions\TimePicker\Tests;

use kartik\base\{AssetBundle, BaseAssetBundle, InputWidget, WidgetAsset};
use PHPUnit\Framework\TestCase;
use Yii;
use yii\base\DynamicModel;
use yii\di\Container;
use yii\web\{Application, View};
use Yii2\Extensions\TimePicker\{TimePicker, TimePickerAsset};

/**
 * Protects the public Krajee integration and server-rendered widget contracts.
 */
final class TimePickerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Yii::$app = null;
        Yii::$container = new Container();

        $runtime = dirname(__DIR__) . '/runtime';

        if (!is_dir("{$runtime}/assets")) {
            mkdir("{$runtime}/assets", 0777, true);
        }

        new Application([
            'id' => 'time-picker-tests',
            'basePath' => dirname(__DIR__),
            'runtimePath' => $runtime,
            'vendorPath' => dirname(__DIR__) . '/vendor',
            'params' => ['bsVersion' => '3.x'],
            'aliases' => [
                '@bower' => dirname(__DIR__) . '/vendor/bower-asset',
                '@npm' => dirname(__DIR__) . '/vendor/npm-asset',
            ],
            'components' => [
                'request' => [
                    'cookieValidationKey' => 'test-only-key',
                    'scriptFile' => __FILE__,
                    'scriptUrl' => '/index.php',
                ],
                'assetManager' => [
                    'basePath' => "{$runtime}/assets",
                    'baseUrl' => '/assets',
                ],
            ],
        ]);
    }

    protected function tearDown(): void
    {
        Yii::$app = null;
        Yii::$container = new Container();

        parent::tearDown();
    }

    public function testPreservesKrajeeParentClasses(): void
    {
        self::assertTrue(
            is_subclass_of(TimePicker::class, InputWidget::class),
            'Widget inheritance must be preserved.',
        );
        self::assertTrue(
            is_subclass_of(TimePickerAsset::class, AssetBundle::class),
            'Asset bundle inheritance must be preserved.',
        );
        self::assertTrue(
            method_exists(InputWidget::class, 'isBs'),
            'Bootstrap detection must remain available.',
        );
    }

    public function testRendersNamedInputAndRegistersPlugin(): void
    {
        $html = TimePicker::widget(
            [
                'name' => 'start_time',
                'value' => '11:24 AM',
                'options' => ['id' => 'start-time'],
                'pluginOptions' => ['showSeconds' => true],
            ],
        );

        self::assertStringContainsString(
            'name="start_time"',
            $html,
            'Input name must be rendered.',
        );
        self::assertStringContainsString(
            'value="11:24 AM"',
            $html,
            'Input value must be rendered.',
        );
        self::assertStringContainsString(
            'glyphicon glyphicon-time',
            $html,
            'Default addon icon must be rendered.',
        );
        self::assertStringContainsString(
            'bootstrap-timepicker input-group',
            $html,
            'Input group classes must be rendered.',
        );
        self::assertArrayHasKey(
            TimePickerAsset::class,
            Yii::$app->view->assetBundles,
            'Time picker assets must be registered.',
        );
        self::assertArrayHasKey(
            WidgetAsset::class,
            Yii::$app->view->assetBundles,
            'Krajee widget assets must be registered.',
        );

        $scripts = implode("\n", Yii::$app->view->js[View::POS_READY]);

        self::assertStringContainsString(
            '.timepicker(',
            $scripts,
            'Plugin initialization must be registered.',
        );
        self::assertStringContainsString(
            'start-time',
            $scripts,
            'Initialization must target the input ID.',
        );
    }

    public function testRendersModelInput(): void
    {
        $model = new DynamicModel(['start_time' => '13:45']);

        $html = TimePicker::widget(
            [
                'model' => $model,
                'attribute' => 'start_time',
            ],
        );

        self::assertStringContainsString(
            'name="DynamicModel[start_time]"',
            $html,
            'Model input name must be rendered.',
        );
        self::assertStringContainsString(
            'value="13:45"',
            $html,
            'Model attribute value must be rendered.',
        );
    }

    public function testRendersBootstrapVersionsAndMatchingAssets(): void
    {
        $boostrap = [
            '3' => 'bootstrap',
            '4' => 'bootstrap4',
            '5' => 'bootstrap5',
        ];

        foreach ($boostrap as $version => $namespace) {
            Yii::$app->params['bsVersion'] = $version . '.x';

            Yii::$app->set(
                'view',
                new View(),
            );
            Yii::$app->set(
                'assetManager',
                [
                    'class' => \yii\web\AssetManager::class,
                    'basePath' => Yii::$app->runtimePath . '/assets',
                    'baseUrl' => '/assets',
                ],
            );

            $html = TimePicker::widget(['name' => "time_{$version}"]);

            self::assertStringContainsString(
                $version === 3 ? 'input-group-addon' : 'input-group-text',
                $html,
                'Addon class must match the Bootstrap version.',
            );

            $bundle = Yii::$app->view->assetBundles[TimePickerAsset::class];

            self::assertArrayHasKey(
                'yii\\' . $namespace . '\\BootstrapAsset',
                Yii::$app->view->assetBundles,
                'Matching Bootstrap assets must be registered.',
            );
            self::assertContains(
                'yii\\' . $namespace . '\\BootstrapAsset',
                $bundle->depends,
                'Asset dependencies must match the Bootstrap version.',
            );
            self::assertContains(
                'yii\\web\\YiiAsset',
                $bundle->depends,
                'Yii assets must remain a dependency.',
            );
        }
    }

    public function testPreservesDisabledReadonlyAndCustomAddon(): void
    {
        $html = TimePicker::widget(
            [
                'name' => 'time',
                'disabled' => true,
                'readonly' => true,
                'addon' => '<span>Clock</span>',
                'containerOptions' => ['data-role' => 'clock'],
            ],
        );

        self::assertStringContainsString(
            'disabled',
            $html,
            'Disabled state must reach the input.',
        );
        self::assertStringContainsString(
            'readonly',
            $html,
            'Readonly state must reach the input.',
        );
        self::assertStringContainsString(
            'disabled-addon',
            $html,
            'Disabled state must reach the addon.',
        );
        self::assertStringContainsString(
            '<span>Clock</span>',
            $html,
            'Custom addon markup must be preserved.',
        );
        self::assertStringContainsString(
            'data-role="clock"',
            $html,
            'Container attributes must be rendered.',
        );
    }

    public function testRendersInlineInputAndSize(): void
    {
        $html = TimePicker::widget(
            [
                'name' => 'time',
                'size' => 'sm',
                'pluginOptions' => ['template' => false],
            ],
        );

        self::assertStringContainsString(
            'bootstrap-timepicker3',
            $html,
            'Inline template class must be rendered.',
        );
        self::assertStringContainsString(
            'input-sm',
            $html,
            'Small input class must be rendered.',
        );
        self::assertStringContainsString(
            'inline-addon-sm',
            $html,
            'Small addon class must be rendered.',
        );
    }

    public function testRegistersEventsAndCustomIcons(): void
    {
        $html = TimePicker::widget(
            [
                'name' => 'time',
                'pluginEvents' => ['changeTime.timepicker' => 'function () { window.timeChanged = true; }'],
                'pluginOptions' => [
                    'upArrowStyle' => 'custom-up',
                    'downArrowStyle' => 'custom-down',
                ],
            ],
        );

        self::assertStringContainsString(
            'data-krajee-timepicker',
            $html,
            'Widget data attribute must be rendered.',
        );

        $ready = implode("\n", Yii::$app->view->js[View::POS_READY]);
        $head = implode("\n", Yii::$app->view->js[View::POS_HEAD]);

        self::assertStringContainsString(
            'changeTime.timepicker',
            $ready,
            'Plugin event handler must be registered.',
        );
        self::assertStringContainsString(
            'window.timeChanged = true',
            $ready,
            'Event callback must be registered.',
        );
        self::assertStringContainsString(
            'custom-up',
            $head,
            'Custom up icon must be registered.',
        );
        self::assertStringContainsString(
            'custom-down',
            $head,
            'Custom down icon must be registered.',
        );
    }

    public function testAssetFilesMatchDebugModeAndExist(): void
    {
        $asset = new TimePickerAsset();

        $suffix = YII_DEBUG ? '' : '.min';

        self::assertSame(
            ['css/bootstrap-timepicker' . $suffix . '.css'],
            $asset->css,
            'Stylesheet path must match the debug mode.',
        );
        self::assertSame(
            ['js/bootstrap-timepicker' . $suffix . '.js'],
            $asset->js,
            'Script path must match the debug mode.',
        );

        foreach (array_merge($asset->css, $asset->js) as $file) {
            self::assertFileExists(
                "{$asset->sourcePath}/{$file}",
                'Published asset source file must exist.',
            );
        }
    }

    public function testPreservesAssetOverridesAndDependencyOptOut(): void
    {
        $asset = new TimePickerAsset(
            [
                'sourcePath' => BaseAssetBundle::EMPTY_PATH,
                'css' => BaseAssetBundle::EMPTY_ASSET,
                'js' => ['custom-timepicker.js'],
                'bsDependencyEnabled' => false,
            ],
        );

        self::assertNull(
            $asset->sourcePath,
            'Empty source path must disable asset publishing.',
        );
        self::assertSame(
            [],
            $asset->css,
            'Empty asset configuration must disable stylesheets.',
        );
        self::assertSame(
            ['custom-timepicker.js'],
            $asset->js,
            'Custom scripts must be preserved.',
        );
        self::assertSame(
            ['yii\\web\\YiiAsset'],
            $asset->depends,
            'Disabling Bootstrap dependency must preserve Yii assets.',
        );
    }
}
