# AI assistance

The package-owned [yii2-time-picker](../skills/yii2-time-picker/SKILL.md) skill covers the actual integration contract
of `yii2-extensions/time-picker`. It does not install dependencies, grant permissions or prove browser behavior.

## Install in an application

Use the [one-time Composer setup](https://yii2-framework.github.io/docs/project/ai-agents/#composer-installation) for
the application's installed `llm/skills` synchronizer. Explicitly trust `yii2-extensions/time-picker` in its
configuration, then inspect the installed donor and synchronization result. The package declares `extra.skills.source`
as `skills`. Composer alone does not register a dependency's skill at the application's root.

```bash
composer install
composer skills:show
# When automatic synchronization is disabled:
composer skills:update
```

Run these skill commands only when the synchronizer is installed and configured. For an optional project-scoped
installation from a checkout or installed donor that contains the skill:

```bash
npx skills@1.7.2 add /absolute/path/to/time-picker --list
npx skills@1.7.2 add /absolute/path/to/time-picker --skill yii2-time-picker --agent claude-code codex opencode
```

Listing proves installer source discovery only. Do not use a remote branch as proof that unpublished local work exists
there. Keep a copied skill refreshed when its package is upgraded.

## Discovery and activation

Open a fresh client session in the project, confirm that `yii2-time-picker` appears in its skill list, then invoke
`$yii2-time-picker` in Codex or `/yii2-time-picker` in Claude Code. In OpenCode, use its native skill-loading tool.
Verify the loaded path and actual load evidence; simply reading the file manually or injecting its body into a prompt is
not native activation.

## Example prompts

Explicit Codex invocation (adapt the invocation to your client's supported mechanism):

```text
$yii2-time-picker
Configure a model-bound time field for Bootstrap 5 with explicit icons and a change event. Show the rendered input and asset dependencies.
Do not install dependencies or change runtime code without approval.
```

Natural selection, without naming the skill:

```text
I use this time picker with Bootstrap 5. Why do the arrows disappear, and how can I verify that widget markup and assets use the same Bootstrap version?
```

## Verify the result

Follow the skill's [Verify and report](../skills/yii2-time-picker/SKILL.md#verify-and-report) section. A listed skill or
a PHP syntax check alone is not a completed integration test.

[Back to README](../README.md)
