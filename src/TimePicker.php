<?php

declare(strict_types=1);

namespace yii2\extensions\timepicker;

use Yii;
use yii\base\InvalidConfigException;
use yii\helpers\{ArrayHelper, Html, Json};
use yii\web\{JsExpression, View};
use yii\widgets\InputWidget;

use function array_map;
use function array_replace;
use function explode;
use function hash;
use function is_array;
use function is_int;
use function is_string;

/**
 * Renders a Timepicker bound to a model attribute or a named input.
 *
 * @see https://github.com/rendom/bootstrap-3-timepicker
 * @see https://github.com/jdewit/bootstrap-timepicker
 */
class TimePicker extends InputWidget
{
    /**
     * Trusted HTML for the addon, `false` to render no addon, or `null` for the Bootstrap version's clock icon.
     */
    public string|false|null $addon = null;
    /**
     * @var array<string, mixed> Addon attributes, including optional asButton and buttonOptions.
     */
    public array $addonOptions = [];
    /**
     * Bootstrap major version or dotted version; defaults to the application setting or Bootstrap 3.
     */
    public int|string|null $bsVersion = null;
    /**
     * @var array<array-key, mixed> Outer wrapper attributes.
     */
    public array $containerOptions = [];
    /**
     * @var array<string, mixed> Defaults merged before the supplied HTML attributes.
     */
    public array $defaultOptions = [];
    /**
     * @var array<string, mixed> Defaults merged before the supplied plugin options.
     */
    public array $defaultPluginOptions = [];
    /**
     * Sets the disabled HTML attribute unless options already specifies it.
     */
    public bool $disabled = false;
    /**
     * Yii view position for the JavaScript option variable.
     */
    public int $hashVarLoadPosition = View::POS_HEAD;
    /**
     * Language passed to Yii message translation for the popup opener.
     */
    public string|null $language = null;
    /**
     * Optional PJAX container ID used to reinitialize replaced fields.
     */
    public string|null $pjaxContainerId = null;
    /**
     * @var array<string, string|JsExpression> JavaScript callbacks keyed by jQuery event name.
     */
    public array $pluginEvents = [];
    /**
     * @var array<string, mixed>|false JavaScript options, or false to keep a plain input.
     */
    public array|false $pluginOptions = [];
    /**
     * Sets the readonly HTML attribute unless options already specifies it.
     */
    public bool $readonly = false;
    /**
     * @var string|null Bootstrap input sizing suffix.
     */
    public string|null $size = null;
    /**
     * @var 3|4|5
     */
    private int $bootstrapVersion;

    /**
     * Merges input defaults and resolves the Bootstrap major version.
     */
    public function init(): void
    {
        $this->options = ArrayHelper::merge($this->defaultOptions, $this->options);

        if ($this->disabled) {
            $this->options['disabled'] ??= true;
        }
        if ($this->readonly) {
            $this->options['readonly'] ??= true;
        }

        $version = $this->bsVersion ?? Yii::$app->params['bsVersion'] ?? 3;

        $version = is_int($version) || is_string($version) ? (string) $version : '';

        $this->bootstrapVersion = match (explode('.', $version)[0]) {
            '3' => 3,
            '4' => 4,
            '5' => 5,
            default => throw new InvalidConfigException(
                'TimePicker requires Bootstrap 3, 4 or 5.',
            ),
        };

        parent::init();
    }

    /**
     * Registers the local assets and the initial options used by the jQuery and DynamicForm entry points.
     */
    public function registerAssets(): void
    {
        $view = $this->getView();

        TimePickerAsset::register($view)->registerBootstrap($view, $this->bootstrapVersion);

        if ($this->pluginOptions === false) {
            return;
        }

        $options = ArrayHelper::merge($this->defaultPluginOptions, $this->pluginOptions);

        $icon = $this->bootstrapVersion === 3 ? 'glyphicon glyphicon-' : 'fas fa-';

        $options['upArrowStyle'] ??= "{$icon}chevron-up";
        $options['downArrowStyle'] ??= "{$icon}chevron-down";

        if ($this->pluginEvents !== []) {
            $options['events'] = array_map(
                static fn(string|JsExpression $handler): JsExpression => $handler instanceof JsExpression
                    ? $handler
                    : new JsExpression($handler),
                $this->pluginEvents,
            );
        }

        $encoded = Json::htmlEncode($options);

        $key = 'timepicker_' . hash('sha256', $encoded);

        $this->options['data-krajee-timepicker'] = $key;

        if ($this->pjaxContainerId !== null) {
            $this->options['data-timepicker-pjax'] = $this->pjaxContainerId;
        }

        $view->registerJs("window.$key = $encoded;", $this->hashVarLoadPosition, $key);

        $id = Json::htmlEncode($this->options['id']);

        $view->registerJs("jQuery(document.getElementById($id)).timepicker(window.$key);", key: "timepicker-$id");
    }

    /**
     * Registers the assets and renders the time picker or a plain text input.
     */
    public function run(): string
    {
        $this->registerAssets();

        if ($this->pluginOptions === false) {
            Html::addCssClass($this->options, 'form-control');

            return $this->renderInputHtml('text');
        }

        $input = $this->renderInput();

        return Html::tag('div', $input, $this->containerOptions);
    }

    /**
     * Renders the Bootstrap version's input group and addon.
     */
    protected function renderInput(): string
    {
        $bs3 = $this->bootstrapVersion === 3;

        $icon = $this->addon ?? (
            $bs3
                ? '<i class="glyphicon glyphicon-time" aria-hidden="true"></i>'
                : '<i class="far fa-clock" aria-hidden="true"></i>'
        );

        $addonOptions = $this->addonOptions;

        $asButton = ArrayHelper::remove($addonOptions, 'asButton') === true;
        $buttonOptions = ArrayHelper::remove($addonOptions, 'buttonOptions') ?? [];

        Html::addCssClass($this->options, 'form-control');

        $inline = ($this->pluginOptions['template'] ?? $this->defaultPluginOptions['template'] ?? true) === false;

        if ($inline) {
            Html::addCssClass($this->containerOptions, ['bootstrap-timepicker', 'bootstrap-timepicker' . ($bs3 ? '3' : '4')]);
            Html::addCssClass($addonOptions, 'inline-addon');

            if ($this->size !== null) {
                Html::addCssClass($this->options, ($bs3 ? 'input-' : 'form-control-') . $this->size);
                Html::addCssClass($addonOptions, 'inline-addon-' . $this->size);
            }
        } else {
            Html::addCssClass($this->containerOptions, ['bootstrap-timepicker', 'input-group']);

            if ($this->size !== null) {
                Html::addCssClass($this->containerOptions, 'input-group-' . $this->size);
            }
        }

        return $this->renderInputHtml('text') . match (true) {
            $icon === false => '',
            $inline => Html::tag('span', $icon, $addonOptions),
            default => $this->renderAddon($icon, $addonOptions, $buttonOptions, $asButton),
        };
    }

    /**
     * @param array<array-key, mixed> $addonOptions
     * @param mixed $buttonOptions Legacy nested addon configuration.
     */
    private function renderAddon(string $icon, array $addonOptions, mixed $buttonOptions, bool $asButton): string
    {
        if (!is_array($buttonOptions)) {
            throw new InvalidConfigException(
                'TimePicker addon buttonOptions must be an array.',
            );
        }

        $bs3 = $this->bootstrapVersion === 3;

        $buttonOptions['type'] = 'button';

        $buttonOptions['aria-label'] ??= Yii::t('app', 'Choose a time', [], $this->language);

        if (($this->options['disabled'] ?? false) !== false || ($this->options['readonly'] ?? false) !== false) {
            $buttonOptions['disabled'] = true;
            Html::addCssClass($addonOptions, 'disabled-addon');
        }

        if ($asButton) {
            $buttonOptions['class'] ??= $bs3 ? 'btn btn-default' : 'btn btn-secondary';
            if ($this->bootstrapVersion !== 5) {
                Html::addCssClass($addonOptions, $bs3 ? 'input-group-btn' : 'input-group-append');
            }
        } else {
            Html::addCssClass($addonOptions, $bs3 ? 'input-group-addon' : 'input-group-text');
            Html::addCssClass($buttonOptions, 'timepicker-addon-button');
        }

        Html::addCssClass($buttonOptions, 'picker');

        if ($this->bootstrapVersion === 5) {
            $classes = $addonOptions['class'] ?? [];
            if (!is_array($classes) && !is_string($classes)) {
                throw new InvalidConfigException('TimePicker addon class must be a string or array.');
            }
            Html::addCssClass($buttonOptions, $classes);
            return Html::button($icon, array_replace($addonOptions, $buttonOptions));
        }

        $addon = Html::tag($bs3 || !$asButton ? 'span' : 'div', Html::button($icon, $buttonOptions), $addonOptions);

        return $bs3 || $asButton ? $addon : Html::tag('div', $addon, ['class' => 'input-group-append']);
    }
}
