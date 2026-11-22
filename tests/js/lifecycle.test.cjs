const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mount, readTime, testBothBuilds } = require("./browser.cjs");

testBothBuilds("Timepicker lifecycle", (openPage) => {
  test("preserves one instance on repeated initialization and restores the original field on destroy", async (t) => {
    const page = await openPage(t);
    await mount(page, "13:45:30");
    const result = await page.evaluate(() => {
      const $input = jQuery("#time");
      const original = $input.data("timepicker");
      $input.timepicker({ defaultTime: "current" });
      const same = $input.data("timepicker") === original;
      $input.timepicker("showWidget");
      $input.timepicker("destroy").timepicker("remove");
      const restored = {
        name: $input[0].name,
        value: $input.val(),
        open: original.isOpen,
        instance: $input.data("timepicker"),
      };
      $input.timepicker();
      return {
        same,
        restored,
        count: document.querySelectorAll("[data-timepicker-popup]").length,
      };
    });
    assert.deepEqual(result, {
      same: true,
      restored: {
        name: "Meeting[start]",
        value: "13:45:30",
        open: false,
        instance: undefined,
      },
      count: 1,
    });
    await page.getByRole("button", { name: "Open time picker" }).click();
    await page.getByRole("button", { name: "Increase hour" }).click();
    assert.equal(
      await page.evaluate(
        () => window.changes.filter(({ type }) => type === "changeTime").length,
      ),
      1,
    );
  });

  test("keeps the opener's popup ID distinct from IDs in the containing page", async (t) => {
    const page = await openPage(t);
    await page.evaluate(() => {
      document.getElementById("end").id = "bootstrap-timepicker-1";
      document.getElementById("outside").id = "bootstrap-timepicker-2";
    });
    await mount(page, "13:45:30");

    const opener = page.getByRole("button", { name: "Open time picker" });
    await opener.click();
    const controlsItsPopup = await opener.evaluate((button) => {
      const id = button.getAttribute("aria-controls");
      const popup = button.parentElement.querySelector(
        "[data-timepicker-popup]",
      );
      return (
        document.getElementById(id) === popup &&
        document.querySelectorAll(`[id="${id}"]`).length === 1
      );
    });
    assert.equal(controlsItsPopup, true);
    assert.equal(await page.getByRole("dialog").isVisible(), true);
  });

  test("closing one instance leaves the other instance's outside-click handler active", async (t) => {
    const page = await openPage(t);
    await mount(page, "08:00");
    await page.evaluate(() => {
      jQuery("#end").timepicker();
      jQuery("#time, #end").timepicker("showWidget");
      jQuery("#time").timepicker("hideWidget");
    });
    assert.equal(
      await page.locator(".bootstrap-timepicker-widget:visible").count(),
      1,
    );
    await page.getByRole("button", { name: "Outside" }).click();
    assert.equal(
      await page.locator(".bootstrap-timepicker-widget:visible").count(),
      0,
    );
  });

  test("keeps both popups usable when a cloned row shares their form container", async (t) => {
    const page = await openPage(t);
    await mount(page, "13:45:30", { appendWidgetTo: "form" });
    await page.evaluate(() => {
      const field = document.getElementById("time");
      const clone = field.parentElement.cloneNode(true);
      clone.querySelector("input").id = "copy";
      clone.querySelector("[data-timepicker-value]").name = "Meeting[copy]";
      field.form.append(clone);
      jQuery("#copy").timepicker({ appendWidgetTo: "form" });
    });
    for (const id of ["time", "copy"]) {
      await page.locator(`#${id}`).press("F4");
      const popup = page.getByRole("dialog", { name: "Choose a time" });
      assert.equal(await popup.count(), 1, `${id} keeps its own popup`);
      await popup.getByRole("button", { name: "Increase hour" }).click();
      await popup
        .getByRole("button", { name: "Increase hour" })
        .press("Escape");
    }
    const values = await page.evaluate(() => {
      const form = document.getElementById("time").form;
      const data = new FormData(form);
      return [data.get("Meeting[start]"), data.get("Meeting[copy]")];
    });
    assert.deepEqual(values, ["14:45:30", "14:45:30"]);
  });

  test("blocks readonly edits and restores the opener when the picker is remounted", async (t) => {
    const page = await openPage(t);
    const field = page.locator("#time");
    const opener = page.getByRole("button", { name: "Open time picker" });
    await field.evaluate((input) => {
      input.readOnly = true;
    });
    await mount(page, "13:45:30");
    assert.equal(await opener.isDisabled(), true);
    await field.press("ArrowUp");
    await field.press("F4");
    assert.equal(
      await page.locator(".bootstrap-timepicker-widget:visible").count(),
      0,
    );
    assert.deepEqual(await readTime(page), {
      visible: "01:45 PM",
      submitted: "13:45:30",
    });

    await field.evaluate((input) => {
      jQuery(input).timepicker("destroy");
    });
    assert.equal(await opener.isEnabled(), true);
    await field.evaluate((input) => {
      input.readOnly = false;
      jQuery(input).timepicker({ defaultTime: false });
    });
    await opener.click();
    const popup = page.getByRole("dialog", { name: "Choose a time" });
    await popup.getByRole("button", { name: "Increase hour" }).click();
    assert.deepEqual(await readTime(page), {
      visible: "02:45 PM",
      submitted: "14:45:30",
    });
  });

  test("moves between time units with Tab and Shift+Tab and lets focus leave the field", async (t) => {
    const page = await openPage(t);
    await mount(page, "13:45", { showMeridian: false });
    const input = page.locator("#time");
    await input.press("ArrowRight");
    await input.press("Tab");
    assert.equal(await input.evaluate((element) => element.selectionStart), 3);
    await input.press("Shift+Tab");
    assert.equal(await input.evaluate((element) => element.selectionStart), 0);
    await input.press("ArrowRight");
    await input.press("Tab");
    assert.equal(
      await page
        .getByRole("button", { name: "Open time picker" })
        .evaluate((element) => element === document.activeElement),
      true,
    );
  });

  test("opens a native modal with configurable names and closes it once on Escape", async (t) => {
    const page = await openPage(t);
    await mount(page, "", {
      template: "modal",
      labels: {
        title: "Elegir hora",
        close: "Listo",
        incrementHour: "Sumar hora",
      },
    });
    await page.evaluate(() => {
      window.popupCloseCount = 0;
      jQuery("#time").on("hide.timepicker", () => {
        window.popupCloseCount++;
      });
    });
    const opener = page.getByRole("button", { name: "Open time picker" });
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Elegir hora" });
    assert.equal(await dialog.isVisible(), true);
    await dialog.getByRole("button", { name: "Sumar hora" }).click();
    assert.equal(
      await dialog.getByRole("button", { name: "Listo" }).isVisible(),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await page.evaluate(() => window.popupCloseCount), 1);
    assert.equal(
      await opener.evaluate((element) => element === document.activeElement),
      true,
    );
  });

  test("replaces a cloned popup and keeps each row's renamed canonical field", async (t) => {
    const page = await openPage(t);
    await mount(page, "13:45:30");
    const result = await page.evaluate(async () => {
      const source = document.querySelector("#time").parentElement;
      const row = source.cloneNode(true);
      source.after(row);
      const input = row.querySelector("input:not([type=hidden])");
      input.id = "cloned-time";
      input.setAttribute("data-krajee-timepicker", "timepickerOptions");
      row.querySelector("[data-timepicker-value]").name = "Meeting[1][start]";
      window.timepickerOptions = { defaultTime: false };
      jQuery(input).timepicker(
        window[input.getAttribute("data-krajee-timepicker")],
      );
      row.querySelector("[data-timepicker-value]").name = "Meeting[0][start]";
      const popups = Array.from(
        document.querySelectorAll("[data-timepicker-popup]"),
      );
      const names = Array.from(new FormData(input.form));
      const removed = jQuery(input).data("timepicker");
      row.remove();
      await Promise.resolve();
      return {
        unique: new Set(popups.map(({ id }) => id)).size,
        count: popups.length,
        names: names.filter(([name]) => name.startsWith("Meeting")),
        destroyed: removed.destroyed,
      };
    });
    assert.deepEqual(result, {
      unique: 2,
      count: 2,
      names: [
        ["Meeting[start]", "13:45:30"],
        ["Meeting[0][start]", "13:45:30"],
        ["Meeting[end]", "18:00"],
      ],
      destroyed: true,
    });
  });
});
