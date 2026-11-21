const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mount, readTime, testBothBuilds } = require("./browser.cjs");

testBothBuilds("Timepicker data contract", (openPage) => {
  test("ignores an invalid Date and commits focused text before submit listeners", async (t) => {
    const page = await openPage(t);
    await mount(page, "13:45:30");
    await page.evaluate(() => {
      jQuery("#time").timepicker("setTime", new Date(NaN));
      document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        window.posted = new FormData(event.target).get("Meeting[start]");
      });
    });
    assert.deepEqual(await page.evaluate(() => window.changes), []);

    await page.locator("#time").fill("2:05 pm");
    await page.evaluate(() => document.querySelector("form").requestSubmit());

    assert.equal(await page.evaluate(() => window.posted), "14:05:30");
    assert.deepEqual(await readTime(page), {
      visible: "02:05 PM",
      submitted: "14:05:30",
    });
  });

  test("uses the same form owner for external inputs and skips disabled controls", async (t) => {
    const page = await openPage(t);
    const result = await page.evaluate(() => {
      const form = document.querySelector("form");
      form.id = "external-owner";
      const input = document.querySelector("#time");
      input.setAttribute("form", form.id);
      input.disabled = true;
      input.value = "15:05:10";
      document.body.append(input);
      jQuery(input).timepicker({ template: false });

      const disabled = new FormData(form).get("Meeting[start]");
      input.disabled = false;
      return Promise.resolve().then(() => ({
        disabled,
        enabled: new FormData(form).get("Meeting[start]"),
        serialized: jQuery(form)
          .serializeArray()
          .find(({ name }) => name === "Meeting[start]").value,
      }));
    });
    assert.deepEqual(result, {
      disabled: null,
      enabled: "15:05:10",
      serialized: "15:05:10",
    });
  });
});
