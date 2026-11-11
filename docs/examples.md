# Usage examples

## Standalone input

```php
use Yii2\Extensions\TimePicker\TimePicker;
use yii\helpers\Html;

echo Html::label('Start time', 'start-time');
echo TimePicker::widget([
    'name' => 'start_time',
    'value' => '11:24 AM',
    'options' => ['id' => 'start-time'],
    'pluginOptions' => ['showSeconds' => true],
]);
```

## ActiveForm field

```php
use Yii2\Extensions\TimePicker\TimePicker;

echo $form->field($model, 'start_time')->widget(TimePicker::class, [
    'pluginOptions' => [
        'showMeridian' => false,
        'defaultTime' => null,
    ],
]);
```

## Client events

```php
use Yii2\Extensions\TimePicker\TimePicker;

echo TimePicker::widget([
    'name' => 'start_time',
    'pluginEvents' => [
        'changeTime.timepicker' => 'function (event) { console.log(event.time.value); }',
    ],
]);
```

Handlers and custom addon markup are executable/trusted application configuration.
