const assert = require("node:assert/strict");
const { selectedBrowsers } = require("./browser.cjs");

async function verifyDropdownPosition(page) {
  const picker = page.locator(
    ".field-dynamicmodel-start [data-timepicker-popup]",
  );
  for (const width of [375, 1024]) {
    await page.setViewportSize({ width, height: 720 });
    const { groupBottom, popupTop } = await picker.evaluate((popup) => ({
      groupBottom: popup.parentElement.getBoundingClientRect().bottom,
      popupTop: popup.getBoundingClientRect().top,
    }));
    assert.ok(
      popupTop >= groupBottom - 1,
      `The dropdown overlaps its input group at ${width}px (${popupTop} < ${groupBottom}).`,
    );
  }
}

async function submitAppointment(page) {
  const [response] = await Promise.all([
    page.waitForResponse((item) => item.request().method() === "POST"),
    page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame()),
    page.getByRole("button", { name: "Save" }).click(),
  ]);
  await page.waitForLoadState();
  return response.json();
}

async function verifyPjaxHistory(page, initialReference, refreshedReference) {
  await page.evaluate(() => {
    window.cachedAppointments = 0;
    jQuery("#appointment-pjax").on("pjax:end", (_, xhr) => {
      if (xhr === null) window.cachedAppointments++;
    });
  });

  for (const [index, expected] of [
    {
      navigate: "goBack",
      display: "02:45 PM",
      submitted: "14:49:30",
      reference: initialReference,
    },
    {
      navigate: "goForward",
      display: "09:10 AM",
      submitted: "09:11:20",
      reference: refreshedReference,
    },
  ].entries()) {
    await page[expected.navigate]();
    await page.waitForFunction(
      (count) => window.cachedAppointments === count,
      index + 1,
    );
    const input = page.locator("#dynamicmodel-start");
    assert.equal(await input.inputValue(), expected.display);
    assert.equal(
      await input.getAttribute("data-krajee-timepicker"),
      expected.reference,
    );
    const opener = page.getByRole("button", { name: "Choose a time" });
    const popup = page.locator(
      ".field-dynamicmodel-start [data-timepicker-popup]",
    );
    assert.equal(await popup.count(), 1);
    const popupId = await opener.getAttribute("aria-controls");
    assert.ok(popupId, "The restored opener references its popup.");
    assert.equal(await popup.getAttribute("id"), popupId);
    assert.equal(
      await page.locator("[data-timepicker-popup]").count(),
      2,
      "Each restored field owns one popup, including the field without an addon.",
    );
    await opener.click();
    assert.equal(await opener.getAttribute("aria-expanded"), "true");
    await page.getByRole("button", { name: "Increase minute" }).click();
    assert.deepEqual(
      await input.evaluate((field) =>
        new FormData(field.form).getAll("DynamicModel[start]"),
      ),
      [expected.submitted],
    );
    const fallback = page.locator("#fallback");
    const fallbackPopup = page.locator("#fallback ~ [data-timepicker-popup]");
    await fallback.press("F4");
    assert.equal(await fallbackPopup.getAttribute("hidden"), null);
    await fallback.press("Escape");
  }
}

async function verify(browser, origin, debug) {
  const page = await browser.newPage();
  try {
    await page.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${origin}/?debug=${debug}`);
    assert.equal(response.status(), 200);
    await page.waitForFunction(() =>
      jQuery("#dynamicmodel-start").data("timepicker"),
    );
    await page.waitForFunction(() =>
      jQuery("#appointment").data("yiiActiveForm"),
    );
    const jqueryVersion = await page.evaluate(() => jQuery.fn.jquery);
    assert.equal(
      await page.locator("#dynamicmodel-start").inputValue(),
      "01:45 PM",
    );
    assert.equal(
      await page
        .locator("#appointment")
        .evaluate((form) => new FormData(form).get("DynamicModel[start]")),
      "13:45:30",
    );
    const published = await page
      .locator('script[src*="bootstrap-timepicker"]')
      .getAttribute("src");
    assert.match(
      published,
      debug === 1
        ? /bootstrap-timepicker\.js$/
        : /bootstrap-timepicker\.min\.js$/,
    );
    const notice = await page.request.get(
      new URL("../LICENSE", `${origin}${published}`).href,
    );
    assert.equal(notice.status(), 200);
    assert.match(await notice.text(), /Joris de Wit/);

    await page.getByRole("button", { name: "Choose a time" }).click();
    await verifyDropdownPosition(page);
    await page.getByRole("button", { name: "Increase hour" }).click();
    assert.deepEqual(await page.evaluate(() => window.timeChanges), [
      "initial",
    ]);
    const input = page.locator("#dynamicmodel-start");
    const initialReference = await input.getAttribute("data-krajee-timepicker");
    await page.getByRole("link", { name: "Refresh appointment" }).click();
    await page.waitForFunction(
      () => document.querySelector("#dynamicmodel-start").value === "09:10 AM",
    );
    assert.equal(await page.locator("[data-timepicker-popup]").count(), 2);
    const refreshedReference = await input.getAttribute(
      "data-krajee-timepicker",
    );
    assert.ok(initialReference && refreshedReference);
    assert.notEqual(initialReference, refreshedReference);
    await verifyPjaxHistory(page, initialReference, refreshedReference);
    assert.deepEqual(await page.evaluate(() => window.timeChanges), [
      "initial",
      "initial",
      "refreshed",
    ]);
    await page.getByRole("button", { name: "Increase hour" }).click();

    const minute = page.getByRole("textbox", { name: "Minute" });
    await minute.fill("27");
    await minute.press("Enter");
    assert.equal(
      await page.locator("#dynamicmodel-start").inputValue(),
      "10:27 AM",
    );
    assert.deepEqual(await page.evaluate(() => window.timeChanges), [
      "initial",
      "initial",
      "refreshed",
      "refreshed",
      "refreshed",
    ]);

    assert.deepEqual(await submitAppointment(page), {
      start: "10:27:20",
      valid: true,
    });

    await page.goto(`${origin}/?debug=${debug}`);
    await page.waitForFunction(() =>
      jQuery("#dynamicmodel-start").data("timepicker"),
    );
    await page.locator("#dynamicmodel-start").fill("25:00");
    assert.deepEqual(await submitAppointment(page), {
      start: "25:00",
      valid: false,
    });
    assert.deepEqual(errors, []);
    process.stdout.write(
      `Consumer ${origin}, ${browser.browserType().name()}, debug=${debug}, jQuery ${jqueryVersion}: publication, PJAX and history, popup placement and editing, ActiveForm and POST passed\n`,
    );
  } finally {
    await page.close();
  }
}

async function main() {
  const origin = process.argv[2];
  assert.ok(origin, "Provide the local consumer origin.");
  for (const browserType of selectedBrowsers()) {
    const browser = await browserType.launch();
    try {
      for (const debug of [1, 0]) {
        await verify(browser, origin, debug);
      }
    } finally {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
