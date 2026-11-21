<?php

declare(strict_types=1);

namespace yii2\extensions\timepicker\tests;

use PHPUnit\Framework\Attributes\{DataProviderExternal, PreserveGlobalState, RunInSeparateProcess};
use PHPUnit\Framework\TestCase;
use Yii;
use yii\base\InvalidConfigException;
use yii\di\Container;
use yii\i18n\MessageSource;
use yii\web\{Application, AssetBundle, View};
use yii\widgets\InputWidget;
use yii2\extensions\timepicker\{TimePicker, TimePickerAsset};
use yii2\extensions\timepicker\tests\provider\TimePickerProvider;

/**
 * Unit tests for {@see TimePicker} rendering and script registration, and {@see TimePickerAsset} file and adapter
 * selection.
 *
 * {@see TimePickerProvider} for test case data providers.
 */
final class TimePickerTest extends TestCase
{
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

        foreach ([...$asset->css, ...$asset->js] as $file) {
            self::assertFileExists(
                "{$asset->sourcePath}/{$file}",
                'Published asset source file must exist.',
            );
        }
    }

    public function testLocalizesTheOpener(): void
    {
        Yii::$app->getI18n()->translations['app'] = new class extends MessageSource {
            protected function loadMessages($category, $language): array
            {
                return $language === 'es' ? ['Choose a time' => 'Elegir hora'] : [];
            }
        };

        self::assertHtmlSame(
            str_replace('Choose a time', 'Elegir hora', TimePickerProvider::BOOTSTRAP3),
            TimePicker::widget(['name' => 'clock', 'language' => 'es']),
            'Opener label must use the configured language.',
        );
    }

    public function testPlainInputRegistersNoScripts(): void
    {
        TimePicker::widget(['name' => 'clock', 'pluginOptions' => false]);

        self::assertSame(
            [],
            Yii::$app->view->js,
            'Plain field must not register options or initialization.',
        );
    }

    public function testPreservesTheProtectedInputRenderingHook(): void
    {
        $widget = new class (['name' => 'clock']) extends TimePicker {
            public function readDefaultInput(): string
            {
                return parent::renderInput();
            }
        };

        self::assertHtmlSame(
            <<<'HTML'
            <input type="text" id="w0" class="form-control" name="clock">
            <span class="input-group-addon">
            <button type="button" class="timepicker-addon-button picker" aria-label="Choose a time">
            <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
            </button>
            </span>
            HTML,
            $widget->readDefaultInput(),
            'The inherited renderer retains the field and default addon.',
        );
    }

    public function testRegistersInitializationForTheLiteralInputId(): void
    {
        $html = TimePicker::widget(['name' => 'clock', 'options' => ['id' => 'appointment:start']]);

        preg_match('/data-krajee-timepicker="([^"]*)"/', $html, $match);

        $key = $match[1] ?? '';

        self::assertArrayHasKey(
            TimePickerAsset::class,
            Yii::$app->view->assetBundles,
            'Time picker assets must be registered.',
        );
        self::assertSame(
            ["jQuery(document.getElementById(\"appointment:start\")).timepicker(window.{$key});"],
            array_values(Yii::$app->view->js[View::POS_READY]),
            'Initialization must look up the ID as literal text and read the options variable.',
        );
    }

    #[DataProviderExternal(TimePickerProvider::class, 'pluginOptions')]
    public function testRegistersPluginOptions(array $config, string $options): void
    {
        $picker = new TimePicker(['name' => 'clock'] + $config);

        $picker->registerAssets();

        $key = $picker->options['data-krajee-timepicker'];

        self::assertSame(
            [$key => "window.{$key} = {$options};"],
            Yii::$app->view->js[View::POS_HEAD],
            'Options must be registered as executable JavaScript under their key.',
        );
    }

    #[DataProviderExternal(TimePickerProvider::class, 'bootstrapAdapters')]
    #[PreserveGlobalState(false)]
    #[RunInSeparateProcess]
    public function testRegistersTheSelectedBootstrapAdapter(
        array $params,
        array $bundle,
        int $version,
        bool $installed,
        array $expected,
    ): void {
        foreach (['yii\bootstrap', 'yii\bootstrap4', 'yii\bootstrap5'] as $namespace) {
            foreach (['BootstrapAsset', 'BootstrapPluginAsset'] as $name) {
                if ($installed && !class_exists("{$namespace}\\{$name}")) {
                    class_alias(AssetBundle::class, "{$namespace}\\{$name}");
                }
            }
        }

        if (!$installed) {
            // Hide every adapter class from the autoloaders of this process.
            foreach (spl_autoload_functions() as $loader) {
                spl_autoload_unregister($loader);
                spl_autoload_register(
                    static function (string $class) use ($loader): void {
                        if (!str_starts_with($class, 'yii\bootstrap')) {
                            $loader($class);
                        }
                    },
                );
            }
        }

        Yii::$app->params = $params + Yii::$app->params;
        Yii::$app->assetManager->bundles[TimePickerAsset::class] = $bundle;

        TimePicker::widget(['name' => 'clock', 'bsVersion' => $version]);

        self::assertSame(
            $expected,
            array_values(
                array_filter(
                    array_keys(Yii::$app->view->assetBundles),
                    static fn(string $name): bool => str_starts_with($name, 'yii\bootstrap'),
                ),
            ),
            'Registered Bootstrap adapter bundles must match.',
        );
    }

    #[DataProviderExternal(TimePickerProvider::class, 'markup')]
    public function testRendersMarkup(array $config, string $expected, array|null $params = null): void
    {
        if ($params !== null) {
            Yii::$app->params = $params;
        }

        self::assertHtmlSame(
            $expected,
            TimePicker::widget(['name' => 'clock'] + $config),
            'Rendered markup must match.',
        );
    }

    #[DataProviderExternal(TimePickerProvider::class, 'assetFiles')]
    public function testResolvesConfiguredAssetFiles(array $config, array $css, array $js, string|null $sourcePath): void
    {
        $asset = new TimePickerAsset($config);

        self::assertSame($css, $asset->css, 'Stylesheets must match.');
        self::assertSame($js, $asset->js, 'Scripts must match.');
        self::assertSame($sourcePath, $asset->sourcePath, 'Source path must match.');
    }

    public function testSharesOneOptionsKeyPerDistinctOptionsMap(): void
    {
        $keys = [];

        foreach ([1, 2, 1] as $index => $minuteStep) {
            $html = TimePicker::widget(['name' => "clock{$index}", 'pluginOptions' => ['minuteStep' => $minuteStep]]);

            preg_match('/data-krajee-timepicker="([^"]*)"/', $html, $match);

            $keys[] = $match[1] ?? '';
        }

        self::assertMatchesRegularExpression(
            '/^timepicker_[0-9a-f]{64}$/D',
            $keys[0],
            'Key must be a JavaScript identifier of the expected shape.',
        );
        self::assertNotSame($keys[0], $keys[1], 'Distinct options must get distinct keys.');
        self::assertSame($keys[0], $keys[2], 'Equal options must share their key.');
        self::assertSame(
            [$keys[0], $keys[1]],
            array_keys(Yii::$app->view->js[View::POS_HEAD]),
            'One options script must be registered per distinct key.',
        );
    }

    #[DataProviderExternal(TimePickerProvider::class, 'invalidConfigurations')]
    public function testThrowInvalidConfigExceptionForInvalidConfiguration(
        array $config,
        string $message,
        array|null $params = null,
    ): void {
        if ($params !== null) {
            Yii::$app->params = $params;
        }

        $this->expectException(InvalidConfigException::class);
        $this->expectExceptionMessage($message);

        TimePicker::widget(['name' => 'clock'] + $config);
    }

    protected function setUp(): void
    {
        parent::setUp();

        InputWidget::$counter = 0;

        Yii::$app = null;

        Yii::$container = new Container();

        $runtime = dirname(__DIR__) . '/runtime';

        if (!is_dir("{$runtime}/assets")) {
            mkdir("{$runtime}/assets", 0o777, true);
        }

        new Application(
            [
                'id' => 'time-picker-tests',
                'basePath' => dirname(__DIR__),
                'runtimePath' => $runtime,
                'vendorPath' => dirname(__DIR__) . '/vendor',
                'params' => ['bsVersion' => '3.x'],
                'aliases' => [
                    '@bower' => dirname(__DIR__) . '/vendor/bower-asset',
                    '@npm' => is_dir(dirname(__DIR__) . '/vendor/npm-asset')
                        ? dirname(__DIR__) . '/vendor/npm-asset'
                        : dirname(__DIR__) . '/node_modules',
                    '@npm/jquery' => is_dir(dirname(__DIR__) . '/vendor/npm-asset/jquery/dist')
                        ? dirname(__DIR__) . '/vendor/npm-asset/jquery'
                        : dirname(__DIR__) . '/node_modules/jquery',
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
            ],
        );
    }

    protected function tearDown(): void
    {
        Yii::$app = null;

        Yii::$container = new Container();

        parent::tearDown();
    }

    /**
     * Compares markup after removing fixture line breaks and replacing the opaque options key with `{key}`.
     */
    private static function assertHtmlSame(string $expected, string $actual, string $message): void
    {
        self::assertSame(
            str_replace("\n", '', $expected),
            preg_replace('/timepicker_[0-9a-f]{64}/', '{key}', $actual),
            $message,
        );
    }
}
