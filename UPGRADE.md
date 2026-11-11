# Upgrade notes

## Next release

- Upgrade `kartik-v/yii2-krajee-base` to 3.x. Earlier versions lack `isBs()`, which TimePicker calls. Update other
  Krajee extensions together if their constraints prevent that upgrade.
