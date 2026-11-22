# Time value contract

The visible input uses the configured display format. The initialized picker submits a separate value under the original
field name.

## Values and form submission

| State        | Visible text                                                                                           | Submitted value under the original input name       |
| ------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Valid time   | Zero-padded `HH:mm` or `HH:mm:ss`, followed by a space and `AM` or `PM` when `showMeridian` is enabled | Zero-padded 24-hour `HH:mm:ss`                      |
| Empty time   | Empty string                                                                                           | Empty string. The application can map it to `null`. |
| Invalid text | Original text                                                                                          | Original text, so the server can reject it.         |

- Accept `HH:mm` and `HH:mm:ss` as 24-hour input irrespective of display mode. Accept `h:mm AM` and `h:mm:ss PM` with
  one or two hour digits and case-insensitive meridian. Ignore surrounding whitespace when parsing. Treat
  whitespace-only input as empty. For example, `12:30` and `12:30 PM` both mean noon, and `12:30 AM` means `00:30:00`.
- Read the browser-local hour, minute and second of a valid JavaScript `Date`. An invalid `Date` leaves the current
  value untouched. A submitted time represents a wall-clock time without a date or timezone.
- Keep supplied seconds even when `showSeconds` is false. Initial values and explicit `setTime` calls without seconds
  use `00`. User edits to the displayed hours or minutes preserve the existing seconds when they are hidden. An edit
  starting from an empty or invalid value uses `00` if it supplies no seconds. Step settings affect stepping and the
  explicit `current` default. Loading or typing a valid time keeps its precision.
- Omitting `defaultTime` or setting it to `false` or `null` keeps an empty field empty. Opening and closing without an
  edit preserves the value, including empty and invalid states. A configured default applies only to an initially empty
  input. Set `defaultTime` to `current` to populate an empty field with the local time.
- Keep the original name for a standalone field or a Yii model attribute. Keep the visible input ID for labels and
  existing selectors. A named, enabled widget contributes exactly one value to `FormData`; a disabled or unnamed widget
  contributes none. Popup controls have no submitted names. Commit pending text when the field is left or the form is
  submitted. Server-side validation remains responsible for checking the submitted value.
- Initialize the picker on an input that is already attached to the document. The hidden `data-timepicker-value` sibling
  that carries the submitted value and the popup are inserted next to the input and need a parent node, and a picker
  whose input is no longer in the document is released. Move or clone the visible input together with that sibling; an
  input moved or cloned alone leaves the submitted value behind.
- Call `setTime`, `clear`, `showWidget`, `hideWidget`, `destroy` and `remove` through the chainable
  `.timepicker('method')` dispatch, and read `getTime()` from the instance in `.data('timepicker')`. `destroy` and
  `remove` restore the original name and the last submitted value to the visible input, and the field can be initialized
  again.

## Events

- Initialize silently. A user action or API call that changes the effective value commits the visible field, the
  submitted value and the popup together before listeners run. An hour, minute or second rollover produces one final
  state, including when stepping forward or backward across midnight.
- Emit one `changeTime.timepicker` for a transition to a valid time or an empty value. Preserve `event.time.value` as
  the visible formatted value and add `event.time.canonicalValue` for the submitted value. Keep the `hours`, `minutes`,
  `seconds` and `meridian` fields. Hours match the display mode, seconds include hidden precision, and meridian is
  `null` in 24-hour mode. For an empty value both strings are empty and all four parts are `null`.
- Preserve the bubbling `change` notification once per effective edit, including an invalid text edit. Invalid text
  produces no `changeTime.timepicker` event. Reformatting equivalent input and opening or closing without an edit
  produce no plugin-generated change notifications. Keep `show.timepicker` and `hide.timepicker` for popup transitions.

See [UPGRADE.md](../UPGRADE.md) for migration from 1.x.
