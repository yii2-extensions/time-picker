<?php

/**
 * @copyright Copyright &copy; Kartik Visweswaran, Krajee.com, 2014 - 2021
 * @package yii2-widgets
 * @subpackage yii2-widget-timepicker
 * @version 1.0.5
 */

namespace Yii2\Extensions\TimePicker;

use kartik\base\AssetBundle;

/**
 * Asset bundle for TimePicker Widget
 *
 * @author Kartik Visweswaran <kartikv2@gmail.com>
 * @since 1.0
 */
class TimePickerAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init()
    {
        $this->setSourcePath(__DIR__ . '/assets');
        $this->setupAssets('css', ['css/bootstrap-timepicker']);
        $this->setupAssets('js', ['js/bootstrap-timepicker']);
        parent::init();
    }
}
