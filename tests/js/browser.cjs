const { resolve } = require("node:path");
const { after, before, describe } = require("node:test");
const { chromium, firefox, webkit } = require("playwright");

const assets = resolve(__dirname, "../../src/assets");

function selectedBrowsers() {
  const names = (process.env.TIME_PICKER_BROWSERS ?? "chromium")
    .trim()
    .split(/\s+/);
  return names.map((name) => {
    const browserType = [chromium, firefox, webkit].find(
      (type) => type.name() === name,
    );
    if (!browserType)
      throw new Error(`Unsupported Playwright browser ${name}.`);
    return browserType;
  });
}

function testBothBuilds(title, registerTests) {
  for (const browserType of selectedBrowsers())
    describe(`${title} (${browserType.name()})`, () => {
      let browser;

      before(async () => {
        browser = await browserType.launch();
      });

      after(async () => {
        await browser?.close();
      });

      for (const [build, suffix] of [
        ["debug", ""],
        ["minified", ".min"],
      ]) {
        describe(build, () => {
          registerTests(async (test) => {
            const context = await browser.newContext({ timezoneId: "UTC" });
            test.after(() => context.close());
            const page = await context.newPage();

            await page.route("**/*", (route) => route.abort());
            await page.setContent(`
            <style>.dropdown-menu { display: none; }</style>
            <form>
              <div class="bootstrap-timepicker input-group">
                <label for="time">Start time</label>
                <input id="time" name="Meeting[start]">
                <button type="button" class="picker">Open time picker</button>
              </div>
              <div class="bootstrap-timepicker input-group">
                <label for="end">End time</label>
                <input id="end" name="Meeting[end]" value="18:00">
              </div>
              <input name="hour" value="business">
              <button type="button" id="outside">Outside</button>
            </form>
          `);
            await page.addStyleTag({
              path: resolve(assets, `css/bootstrap-timepicker${suffix}.css`),
            });
            await page.addScriptTag({ path: require.resolve("jquery") });
            await page.addScriptTag({
              path: resolve(assets, `js/bootstrap-timepicker${suffix}.js`),
            });

            return page;
          });
        });
      }
    });
}

async function mount(page, value, options = {}) {
  await page.evaluate(
    ({ value, options }) => {
      const $input = jQuery("#time");
      const input = $input[0];
      input.defaultValue = value;
      window.changes = [];
      $input.on("change changeTime.timepicker", (event) => {
        window.changes.push({
          type: event.type,
          visible: input.value,
          submitted: new FormData(input.form).get("Meeting[start]"),
          time: event.time,
        });
      });
      $input.timepicker({ defaultTime: false, ...options });
    },
    { value, options },
  );
}

async function readTime(page) {
  return page.evaluate(() => {
    const input = document.querySelector("#time");
    return {
      visible: input.value,
      submitted: new FormData(input.form).get("Meeting[start]"),
    };
  });
}

module.exports = { mount, readTime, selectedBrowsers, testBothBuilds };
