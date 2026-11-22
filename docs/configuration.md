# Configuration

Use `name` and `value` for a standalone input, or `model` and `attribute` for an ActiveForm field.

- `options` sets input HTML attributes. `disabled` and `readonly` set those attributes when the input options leave them
  unspecified.
- `pluginOptions` configures the bundled plugin, including `showSeconds`, `showMeridian`, `minuteStep`, `secondStep`,
  `defaultTime`, `template`, `upArrowStyle` and `downArrowStyle`. Pass `false` to render a plain text input with its
  original name.
- `pluginEvents` maps jQuery event names to JavaScript handlers. The same configuration is available to cloned inputs
  through the `data-krajee-timepicker` option reference.
- `containerOptions` contains wrapper attributes. `size` sets a Bootstrap size such as `sm` or `lg`.
- `addon` supplies trusted HTML or `false` to omit the opener. `addonOptions['buttonOptions']` can set a custom
  accessible name and button attributes. Use `addonOptions['asButton'] = true` for Bootstrap button classes.
- `pjaxContainerId` identifies the Yii PJAX container for reinitialization after replacement.

The dropdown is the default popup. Set `template` to `false` for an inline input with keyboard adjustments or to
`'modal'` for a native dialog. `modalBackdrop: true` displays its backdrop. Customize `labels` within `pluginOptions` to
translate the title, unit names, arrow labels and close button. Use the opener's `aria-label` to override its Yii
application translation.

Click a unit or use the left and right arrows to select a unit in the text field. Up and down step the selected unit.
Tab and Shift+Tab navigate the selected units and continue through the form at either end. Use the opener button or F4
to open the popup and Escape to close it.

The asset manager can replace the bundle's CSS and JS. Set its `bsDependencyEnabled` to `false` if the application
registers its own Bootstrap styles.

- [Time value and events](data-contract.md)
