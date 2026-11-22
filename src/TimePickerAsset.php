<?php

declare(strict_types=1);

namespace yii2\extensions\timepicker;

use Yii;
use yii\web\{AssetBundle, View, YiiAsset};

use function class_exists;

/**
 * Publishes the bundled Timepicker and optionally registers installed Yii Bootstrap assets.
 */
class TimePickerAsset extends AssetBundle
{
    /**
     * Retained for existing asset manager overrides that disable a file list.
     */
    public const string EMPTY_ASSET = 'N0/@$$3T$';
    /**
     * Retained for existing asset manager overrides that disable publication.
     */
    public const string EMPTY_PATH = 'N0/P@T#';

    /**
     * Bootstrap version mapping.
     */
    private const array BOOTSTRAP = [
        3 => 'bootstrap',
        4 => 'bootstrap4',
        5 => 'bootstrap5',
    ];
    /**
     * CSS files for the timepicker.
     */
    private const array CSS = [
        'css/bootstrap-timepicker.css',
    ];
    /**
     * JavaScript files for the timepicker.
     */
    private const array JS = [
        'js/bootstrap-timepicker.js',
    ];

    /**
     * Whether to register an installed Yii Bootstrap adapter.
     */
    public bool|null $bsDependencyEnabled = null;
    /**
     * Whether to register its JavaScript bundle as well as CSS.
     */
    public bool $bsPluginEnabled = false;
    /**
     * CSS files for the asset bundle.
     */
    public $css = self::CSS;
    /**
     * Overrides Yii debug mode when choosing the bundled asset files.
     */
    public bool|null $debug = null;
    /**
     * Asset bundles that this bundle depends on.
     */
    public $depends = [
        YiiAsset::class,
    ];
    /**
     * JavaScript files for the asset bundle.
     */
    public $js = self::JS;
    /**
     * Source path for the asset bundle.
     */
    public $sourcePath = __DIR__ . '/assets';

    /**
     * Normalizes the legacy empty asset sentinels before Yii configures its file lists.
     *
     * @param array<string, mixed> $config
     */
    public function __construct($config = [])
    {
        if (($config['css'] ?? null) === self::EMPTY_ASSET) {
            $config['css'] = [];
        }

        if (($config['js'] ?? null) === self::EMPTY_ASSET) {
            $config['js'] = [];
        }

        parent::__construct($config);
    }

    /**
     * Selects minified assets outside debug mode and normalizes the legacy empty path.
     */
    public function init(): void
    {
        $debug = $this->debug ?? YII_DEBUG;

        if ($this->sourcePath === self::EMPTY_PATH) {
            $this->sourcePath = null;
        }

        if (!$debug && $this->css === self::CSS) {
            $this->css = ['css/bootstrap-timepicker.min.css'];
        }

        if (!$debug && $this->js === self::JS) {
            $this->js = ['js/bootstrap-timepicker.min.js'];
        }

        parent::init();
    }

    /**
     * Registers the optional installed Bootstrap adapter for the widget's effective version.
     *
     * @param 3|4|5 $version
     */
    public function registerBootstrap(View $view, int $version): void
    {
        if (($this->bsDependencyEnabled ?? Yii::$app->params['bsDependencyEnabled'] ?? true) === false) {
            return;
        }

        $prefix = 'yii\\' . self::BOOTSTRAP[$version];

        $this->registerInstalledBootstrap($view, $prefix . '\\BootstrapAsset', $prefix . '\\BootstrapPluginAsset');
    }

    private function registerInstalledBootstrap(View $view, string $asset, string $plugin): void
    {
        if (class_exists($asset)) {
            $view->registerAssetBundle($asset);
            if ($this->bsPluginEnabled) {
                $view->registerAssetBundle($plugin);
            }
        }
    }
}
