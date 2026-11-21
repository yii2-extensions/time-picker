# Upgrade notes

## Time value and widget migration

- The picker now submits a 24-hour `HH:mm:ss` value instead of the displayed text: a field displaying `01:45 PM` can
  submit `13:45:30` even with seconds hidden. Update server-side validators and storage to accept it, map empty strings
  to `null` where appropriate and keep rejecting invalid text, as described in the
  [time value contract](https://github.com/yii2-extensions/time-picker/blob/master/docs/data-contract.md).
- A hidden companion input now carries the field name, and the visible input keeps its ID. Update client code that reads
  the value by name to use `FormData` or `event.time.canonicalValue`. Callbacks now run after the field changes.
- `defaultTime` now leaves a blank input empty instead of defaulting to `current`. Set
  `pluginOptions['defaultTime'] = 'current'` to restore the browser's local time.
- `TimePicker` now extends Yii's `InputWidget`. Remove Krajee-only settings such as `pluginLoading`, `pluginDestroyJs`
  and `pjaxDuplicationFix` from your TimePicker configuration. Keep Krajee installed if other widgets use it. Use Yii's
  asset manager to override the bundle. The `TimePickerAsset::EMPTY_ASSET` and `TimePickerAsset::EMPTY_PATH` constants
  support existing opt-out overrides.
- `template: 'modal'` now uses a native dialog. Bootstrap's modal plugin is no longer needed.
- DynamicForm client validation needs an adapter that reads the name of the adjacent `[data-timepicker-value]` input
  when renewing the validator for a time field. Older DynamicForm versions can clone and submit the field. Keep
  server-side validation for those rows until the DynamicForm adapter is updated.
- See [the installation guide](https://github.com/yii2-extensions/time-picker/blob/master/docs/installation.md) for
  jQuery and Bootstrap asset setup on Yii 22.

## Lowercase namespace

The namespace is now `yii2\extensions\timepicker`, matching Yii2 Extensions conventions. Update imports, fully qualified
class names and configuration strings, then regenerate Composer autoload files. The package name remains
`yii2-extensions/time-picker`. No legacy aliases are supplied.

## Minimum PHP version

PHP 8.3 is now the minimum for production and development. Upgrade the application runtime before adopting this
development line.
