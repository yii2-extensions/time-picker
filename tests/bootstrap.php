<?php

declare(strict_types=1);

defined('YII_DEBUG') || define('YII_DEBUG', getenv('TIME_PICKER_DEBUG') !== '0');
defined('YII_ENABLE_ERROR_HANDLER') || define('YII_ENABLE_ERROR_HANDLER', false);
defined('YII_ENV') || define('YII_ENV', 'test');

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/vendor/yiisoft/yii2/Yii.php';

