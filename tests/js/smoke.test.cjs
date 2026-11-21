const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mount, testBothBuilds } = require("./browser.cjs");

testBothBuilds("Timepicker smoke tests", (openPage) => {
  test("preserves jQuery dispatch, options and display formatting", async (t) => {
    const page = await openPage(t);
    await mount(page, "", { showSeconds: true, template: false });

    const result = await page.evaluate(() => {
      const $input = jQuery("#time");
      const instance = $input.data("timepicker");
      const returned = $input.timepicker("setTime", "13:45:30");
      return {
        chainable: returned === $input,
        constructor: instance instanceof jQuery.fn.timepicker.Constructor,
        visible: $input.val(),
        time: instance.getTime(),
      };
    });

    assert.deepEqual(result, {
      chainable: true,
      constructor: true,
      visible: "01:45:30 PM",
      time: "01:45:30 PM",
    });
  });

  test("opens with the addon, updates with an arrow and closes on outside click", async (t) => {
    const page = await openPage(t);
    await mount(page, "09:20", { showMeridian: false });
    await page.evaluate(() => {
      window.lifecycle = [];
      jQuery("#time").on("show.timepicker hide.timepicker", (event) => {
        window.lifecycle.push(event.type);
      });
    });

    await page.getByRole("button", { name: "Open time picker" }).click();
    await page.locator('[data-action="incrementHour"]').click();
    assert.equal(await page.locator("#time").inputValue(), "10:20");
    await page.getByRole("button", { name: "Outside" }).click();

    assert.equal(
      await page.locator(".bootstrap-timepicker-widget").isVisible(),
      false,
    );
    assert.deepEqual(await page.evaluate(() => window.lifecycle), [
      "show",
      "hide",
    ]);
  });
});
