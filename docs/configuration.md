# Configuration

TimePicker extends `kartik\base\InputWidget`. Configure it with a `name` and `value`, or with a `model` and `attribute`.

- `options` contains the input HTML attributes.
- `pluginOptions` configures the bundled jQuery time picker, including `showSeconds`, `showMeridian`, `minuteStep`,
  `defaultTime` and `template`.
- `pluginEvents` maps plugin event names to JavaScript handlers.
- `containerOptions` contains the outer wrapper HTML attributes.
- `addon` supplies trusted HTML for the clock control. Do not put untrusted text into it without encoding.
- `addonOptions` contains addon attributes. Set `asButton` and `buttonOptions` to render a button.
- `size` selects an input-group size such as `sm` or `lg`.
- `disabled` and `readonly` are inherited Krajee properties.

Set `params['bsVersion']` in the application to the Bootstrap major version you installed. A per-widget `bsVersion` can
otherwise disagree with the version selected by its globally registered asset bundle.

For Bootstrap 4 addon buttons, set a Bootstrap-compatible button class explicitly:

```php
'addonOptions' => [
    'asButton' => true,
    'buttonOptions' => ['class' => 'btn btn-secondary'],
],
```

For Bootstrap 5, use the default span addon rather than `asButton`: the current button markup does not receive the
selector used by the plugin to open the picker.

For an inline input without the popup template, set `pluginOptions['template']` to `false`.

`TimePickerAsset` inherits Krajee's asset overrides and debug/minified file selection. Preserve those settings when
customizing the application asset manager.

The `data-krajee-timepicker` attribute and its named options variable are used by dynamic-form integrations. Preserve
these contracts when customizing client initialization or cloning widgets.
