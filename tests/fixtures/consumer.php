<?php

declare(strict_types=1);

use yii\base\DynamicModel;
use yii\helpers\{Html, Json};
use yii\web\Application;
use yii\widgets\{ActiveForm, Pjax};
use yii2\extensions\timepicker\TimePicker;

$debug = ($_GET['debug'] ?? '1') === '1';
define('YII_DEBUG', $debug);
define('YII_ENV', 'test');

$root = dirname(__DIR__);
require "$root/vendor/autoload.php";
require "$root/vendor/yiisoft/yii2/Yii.php";

$app = new Application([
    'id' => 'time-picker-consumer',
    'basePath' => $root,
    'bootstrap' => class_exists(\yii\jquery\Bootstrap::class) ? [\yii\jquery\Bootstrap::class] : [],
    'aliases' => [
        '@bower' => "$root/vendor/bower-asset",
        '@npm' => "$root/node_modules",
    ],
    'params' => ['bsVersion' => '5.x'],
    'components' => [
        'request' => ['enableCsrfValidation' => false, 'cookieValidationKey' => 'local-fixture'],
        'assetManager' => ['basePath' => __DIR__ . '/assets', 'baseUrl' => '/assets'],
    ],
]);
$refreshed = isset($_GET['refresh']);
$model = new DynamicModel(['start' => $refreshed ? '09:10:20' : '13:45:30']);
$model->addRule('start', 'required');
$model->addRule('start', 'match', [
    'pattern' => '/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/D',
    'enableClientValidation' => false,
]);

if ($app->getRequest()->getIsPost()) {
    $model->load($app->getRequest()->getBodyParams());
    $valid = $model->validate();
    header('Content-Type: application/json');
    echo Json::encode(['start' => $model->start, 'valid' => $valid]);
    exit;
}

$mode = $debug ? '1' : '0';
$appointment = $refreshed ? 'refreshed' : 'initial';
$view = $app->getView();
$view->registerCssFile('/bootstrap.css');
$view->beginPage();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>TimePicker consumer</title>
    <?php $view->head(); ?>
</head>
<body>
<?php
$view->beginBody();
Pjax::begin(['id' => 'appointment-pjax', 'timeout' => 5000]);
echo Html::a('Refresh appointment', "/?refresh=1&debug=$mode");
$form = ActiveForm::begin([
    'id' => 'appointment',
    'action' => "/?debug=$mode",
    'options' => ['data-pjax' => false],
]);
echo $form->field($model, 'start')->widget(TimePicker::class, [
    'pjaxContainerId' => 'appointment-pjax',
    'pluginOptions' => ['minuteStep' => $refreshed ? 11 : 7],
    'pluginEvents' => [
        'changeTime.timepicker' => "function () { (window.timeChanges ??= []).push('$appointment'); }",
    ],
    'addonOptions' => ['asButton' => true],
]);
echo TimePicker::widget([
    'name' => 'fallback',
    'value' => '15:20:40',
    'addon' => false,
    'options' => ['id' => 'fallback'],
    'pjaxContainerId' => 'appointment-pjax',
]);
echo Html::submitButton('Save');
ActiveForm::end();
Pjax::end();
$view->endBody();
?>
</body>
</html>
<?php $view->endPage(); ?>
