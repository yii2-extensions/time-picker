import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import jquery from "jquery";
import { test, vi } from "vitest";

async function loadPlugin() {
  vi.resetModules();
  await import("../../src/assets/js/bootstrap-timepicker.js");
}

async function setup(t, html = "") {
  const { window } = new JSDOM(`
    <form id="form"><section id="pjax">
      <div class="bootstrap-timepicker"><input id="time" name="start" value="13:45:30"><button class="picker" type="button">Open</button></div>
    </section>${html}<button id="outside" type="button">Outside</button></form>
  `);
  const document = window.document;
  const $ = jquery(window);
  const globals = {
    window,
    document,
    jQuery: $,
    MutationObserver: window.MutationObserver,
    Event: window.Event,
  };
  const original = Object.fromEntries(
    Object.keys(globals).map((key) => [key, globalThis[key]]),
  );
  Object.assign(globalThis, globals);
  await loadPlugin();
  t.onTestFinished(() => {
    $("input").timepicker("destroy");
    window.close();
    Object.assign(globalThis, original);
  });

  const field = $("#time");
  const input = field[0];
  const form = document.getElementById("form");
  const submit = () => new window.FormData(form).get("start");
  const notify = (type, target = input) =>
    target.dispatchEvent(
      new window.Event(type, { bubbles: true, cancelable: true }),
    );
  const key = (key, options = {}, target = input) =>
    target.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      }),
    );
  const spies = {
    added: vi.spyOn(document, "addEventListener"),
    removed: vi.spyOn(document, "removeEventListener"),
  };
  const listeners = (spy, type) =>
    spies[spy].mock.calls.filter(([name]) => name === type);
  return {
    $,
    document,
    window,
    field,
    input,
    form,
    submit,
    notify,
    key,
    listeners,
  };
}

function mountForPjax(field, window, options) {
  window.timepickerOptions = options;
  return field
    .attr({
      "data-timepicker-pjax": "pjax",
      "data-krajee-timepicker": "timepickerOptions",
    })
    .timepicker(options);
}

test("parses accepted strings, whitespace, meridian and invalid text", async (t) => {
  const { $, field, submit } = await setup(t);
  field.timepicker({ showSeconds: true });
  const samples = [
    [" 2:10:31 pm ", "02:10:31 PM", "14:10:31"],
    ["00:12", "12:12:00 AM", "00:12:00"],
    ["12:00", "12:00:00 PM", "12:00:00"],
    ["23:59:59", "11:59:59 PM", "23:59:59"],
    ["7:13 AM", "07:13:00 AM", "07:13:00"],
    ["10:14:10 AM", "10:14:10 AM", "10:14:10"],
    ["12:59 PM", "12:59:00 PM", "12:59:00"],
    ["12:15 AM", "12:15:00 AM", "00:15:00"],
    ["0:12 AM", "0:12 AM", "0:12 AM"],
    ["13:12 PM", "13:12 PM", "13:12 PM"],
    ["2:12", "2:12", "2:12"],
    ["24:00", "24:00", "24:00"],
    ["12:60", "12:60", "12:60"],
    ["12:12:60", "12:12:60", "12:12:60"],
    ["x12:00", "x12:00", "x12:00"],
    ["12:00x", "12:00x", "12:00x"],
    ["12:00  PM", "12:00  PM", "12:00  PM"],
    [" strange ", " strange ", " strange "],
    [" ", "", ""],
  ];
  for (const [value, display, posted] of samples) {
    field.timepicker("setTime", value);
    assert.equal(field.val(), display, value);
    assert.equal(submit(), posted, value);
  }
  field.timepicker("setTime", new Date(2020, 0, 1, 0, 0, 3));
  assert.equal(field.val(), "12:00:03 AM");
  assert.equal(submit(), "00:00:03");
  for (const value of [new Date(NaN), 42, undefined, {}]) {
    field.timepicker("setTime", value);
    assert.equal(submit(), "00:00:03");
  }
  field.timepicker("setTime", new Date(2020, 0, 1, 19, 7, 53));
  assert.equal(field.val(), "07:07:53 PM");
  assert.equal(submit(), "19:07:53");
  field.timepicker("setTime", false);
  assert.equal(submit(), "");
  field.timepicker("setTime", "09:10");
  field.timepicker("setTime", null);
  assert.equal(submit(), "");
  assert.deepEqual(
    $("[data-unit]")
      .map((_, part) => part.value)
      .get(),
    ["", "", "", ""],
  );
});

test("links the opener to its popup when candidate IDs are already in use", async (t) => {
  const { document, field, input } = await setup(
    t,
    '<div id="bootstrap-timepicker-2"></div>',
  );
  input.id = "bootstrap-timepicker-1";
  field.timepicker();

  const group = input.parentElement;
  const popup = group.querySelector("[data-timepicker-popup]");
  const id = group.querySelector(".picker").getAttribute("aria-controls");
  assert.equal(id, "bootstrap-timepicker-3");
  assert.equal(document.getElementById(id), popup);
  assert.equal(document.querySelectorAll(`[id="${id}"]`).length, 1);

  field.timepicker("destroy").timepicker();
  const replacement = group
    .querySelector(".picker")
    .getAttribute("aria-controls");
  assert.equal(replacement, "bootstrap-timepicker-4");
  assert.equal(document.getElementById(id), null);
  assert.equal(
    document.getElementById(replacement),
    group.querySelector("[data-timepicker-popup]"),
  );
});

test("synchronizes edits, form submit and form reset without duplicate notifications", async (t) => {
  const { field, input, form, submit, notify } = await setup(t);
  const events = [];
  field.on("change changeTime.timepicker", (event) =>
    events.push([event.type, submit()]),
  );
  field.timepicker();
  assert.deepEqual(events, []);
  input.value = "2:05 pm";
  notify("input");
  assert.equal(submit(), "14:05:30");
  assert.deepEqual(events, []);
  notify("change");
  notify("change");
  notify("blur");
  assert.deepEqual(events, [
    ["changeTime", "14:05:30"],
    ["change", "14:05:30"],
  ]);
  input.value = "incorrect";
  notify("change");
  assert.deepEqual(events.slice(2), [["change", "incorrect"]]);
  input.value = "12:10";
  notify("submit", form);
  assert.deepEqual(events.slice(-2), [
    ["changeTime", "12:10:00"],
    ["change", "12:10:00"],
  ]);
  form.reset();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(submit(), "13:45:30");
  assert.equal(field.val(), "01:45 PM");
});

test("steps through the day and keeps the display snapshot consistent", async (t) => {
  const { $, field, submit } = await setup(t);
  field.timepicker({
    minuteStep: 7,
    secondStep: 11,
    showSeconds: true,
    showInputs: false,
  });
  field.timepicker("setTime", "23:59:59");
  field.timepicker("incrementSecond");
  assert.equal(submit(), "00:00:06");
  field.timepicker("decrementSecond");
  assert.equal(submit(), "23:59:55");
  field.timepicker("incrementMinute");
  assert.equal(submit(), "00:03:55");
  field.timepicker("decrementMinute", 3);
  assert.equal(submit(), "00:00:55");
  field.timepicker("decrementHour");
  assert.equal(submit(), "23:00:55");
  field.timepicker("incrementHour");
  assert.equal(submit(), "00:00:55");
  field.timepicker("toggleMeridian");
  assert.equal(field.data("timepicker").getTime(), "12:00:55 PM");
  assert.equal($(".bootstrap-timepicker-second").text(), "55");
  field.data("timepicker").step(Infinity);
  assert.equal(submit(), "12:00:55");
  assert.equal($("[data-unit]").length, 0);
  field.timepicker("setTime", "incorrect").timepicker("incrementMinute");
  assert.equal(submit(), "00:07:00");
  field.timepicker("setTime", "incorrect").timepicker("incrementSecond");
  assert.equal(submit(), "00:00:11");
});

test("reads editable popup controls and commits the final operation once", async (t) => {
  const { $, field, submit, notify } = await setup(t);
  field.timepicker({ showSeconds: true });
  const changes = [];
  field.on("changeTime.timepicker", ({ time }) =>
    changes.push(time.canonicalValue),
  );
  field.timepicker("showWidget");
  $("[data-unit=hour]").val("3");
  notify("input", $("[data-unit=hour]")[0]);
  $(".dropdown-menu button[data-action=incrementMinute]").trigger("click");
  assert.equal(submit(), "16:00:30");
  assert.deepEqual(changes, ["16:00:30"]);
  $("[data-unit=second]").val("5");
  notify("input", $("[data-unit=second]")[0]);
  field.timepicker("hideWidget");
  assert.equal(submit(), "16:00:05");
  field.timepicker("showWidget");
  $("[data-unit=second]").val("99");
  notify("input", $("[data-unit=second]")[0]);
  field.timepicker("hideWidget");
  assert.equal(submit(), "04:00:99 PM");
  assert.deepEqual(changes, ["16:00:30", "16:00:05"]);
});

for (const [initial, defaultTime] of [
  ["", false],
  ["", null],
  ["09:20", false],
]) {
  test(`opens and closes ${initial || "an empty field"} with defaultTime=${defaultTime} silently`, async (t) => {
    const { $, field, input, submit } = await setup(t);
    input.value = initial;
    const events = [];
    field.on("change changeTime.timepicker", (event) => events.push(event));
    field.timepicker({ defaultTime, showMeridian: false });
    $(".picker")[0].click();
    $("#outside").trigger("mousedown");
    assert.equal(field.data("timepicker").isOpen, false);
    assert.equal(field.val(), initial);
    assert.equal(submit(), initial && `${initial}:00`);
    assert.deepEqual(events, []);
  });
}

for (const [operation, initial, options, time] of [
  [
    "incrementMinute",
    "11:45 AM",
    {},
    {
      value: "12:00 PM",
      canonicalValue: "12:00:00",
      hours: 12,
      minutes: 0,
      seconds: 0,
      meridian: "PM",
    },
  ],
  [
    "incrementSecond",
    "23:59:45",
    { showMeridian: false, showSeconds: true },
    {
      value: "00:00:00",
      canonicalValue: "00:00:00",
      hours: 0,
      minutes: 0,
      seconds: 0,
      meridian: null,
    },
  ],
  [
    "clear",
    "09:20",
    { showMeridian: false },
    {
      value: "",
      canonicalValue: "",
      hours: null,
      minutes: null,
      seconds: null,
      meridian: null,
    },
  ],
]) {
  test(`publishes the full time payload once after ${operation}`, async (t) => {
    const { field, input, submit } = await setup(t);
    input.value = initial;
    field.timepicker(options);
    const events = [];
    field.on("change changeTime.timepicker", (event) =>
      events.push([event.type, submit(), event.time]),
    );
    field.timepicker(operation);
    assert.equal(field.val(), time.value);
    assert.deepEqual(events, [
      ["changeTime", time.canonicalValue, time],
      ["change", time.canonicalValue, undefined],
    ]);
  });
}

test("supports optional defaults, popup opt-out and native disabled state", async (t) => {
  const { $, field, input, submit } = await setup(
    t,
    '<input id="optional" name="optional">',
  );
  $("#optional").timepicker({ template: false });
  $("#optional").timepicker("showWidget");
  assert.equal($("#optional").val(), "");
  assert.equal($("[data-timepicker-popup]").length, 0);
  $("#optional").timepicker("remove");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 18, 13, 47, 44));
  t.onTestFinished(() => vi.useRealTimers());
  $("#optional").timepicker({
    defaultTime: "current",
    template: false,
    minuteStep: 10,
    secondStep: 15,
    showSeconds: true,
  });
  assert.equal($("#optional").val(), "01:40:30 PM");

  input.disabled = true;
  field.timepicker({ showMeridian: false, minuteStep: 0, secondStep: 60 });
  assert.equal(submit(), null);
  assert.equal($(".picker").prop("disabled"), true);
  assert.equal(field.data("timepicker").minuteStep, 15);
  assert.equal(field.data("timepicker").secondStep, 15);
  input.disabled = false;
  await Promise.resolve();
  assert.equal(submit(), "13:45:30");
  assert.equal($(".picker").prop("disabled"), false);
  field.timepicker("showWidget");
  input.readOnly = true;
  await Promise.resolve();
  assert.equal(field.data("timepicker").isOpen, false);
  assert.equal(submit(), "13:45:30");
});

test("mounts replacement content on PJAX completion and preserves event callbacks", async (t) => {
  const { $, field, window } = await setup(t);
  window.calls = 0;
  mountForPjax(field, window, {
    events: {
      "changeTime.timepicker": () => {
        window.calls++;
      },
    },
  });
  $("#pjax").trigger("pjax:beforeReplace");
  assert.equal(field.data("timepicker"), undefined);
  assert.equal(field.attr("name"), "start");
  $("#pjax").trigger("pjax:end").trigger("pjax:end");
  assert.equal($("[data-timepicker-popup]").length, 1);
  field.timepicker("setTime", "14:40");
  assert.equal(window.calls, 1);
  field.timepicker("remove").timepicker("destroy");
  assert.equal($("[data-timepicker-popup]").length, 0);
});

test("replaces a cached popup for a field without an addon or wrapper", async (t) => {
  const { $, field, window, submit } = await setup(t);
  const container = $("#pjax");
  field.closest(".bootstrap-timepicker").replaceWith(field);
  mountForPjax(field, window, { minuteStep: 7 });
  const cached = container.contents().clone();

  container
    .trigger("pjax:beforeReplace")
    .empty()
    .append(cached)
    .trigger("pjax:end");

  const popup = container.find("[data-timepicker-popup]");
  assert.equal(popup.length, 1);
  const restored = container.find("#time");
  restored.trigger("click");
  assert.equal(popup.prop("hidden"), false);
  popup.find('[data-action="incrementMinute"]').trigger("click");
  assert.equal(submit(), "13:49:30");
  restored.timepicker("destroy");
  assert.equal(container.find("[data-timepicker-popup]").length, 0);
  assert.equal(restored.attr("data-timepicker-popup-id"), undefined);
});

for (const [scenario, arrange] of [
  [
    "an adjacent panel restored from a cached PJAX field",
    ({ $, field, window }) => {
      const container = $("#pjax");
      field.closest(".bootstrap-timepicker").replaceWith(field);
      mountForPjax(field, window, {});
      const cached = container.clone();
      const popup = cached.find("[data-timepicker-popup]");
      const panel = $("<details>", { id: popup.attr("id") });
      popup.replaceWith(panel);
      container
        .trigger("pjax:beforeReplace")
        .empty()
        .append(cached.contents())
        .trigger("pjax:end");
      assert.equal(container.find("[data-timepicker-popup]").length, 1);
      return [panel[0]];
    },
  ],
  [
    "addon targets that do not identify a previous popup",
    ({ $, document, field, input }) => {
      const panel = $("<div>", { id: "help" }).appendTo(input.parentElement);
      $(".picker").first().attr("aria-controls", panel.attr("id"));
      const anonymous = document.querySelector(
        '[data-timepicker-popup][id=""]',
      );
      field.timepicker();
      $("#other").timepicker();
      return [panel[0], anonymous];
    },
  ],
]) {
  test(`leaves foreign elements alone: ${scenario}`, async (t) => {
    const context = await setup(
      t,
      `
      <div class="bootstrap-timepicker">
        <input id="other" name="end" data-timepicker-popup-id="">
        <button class="picker" type="button" aria-controls="">End</button>
        <div data-timepicker-popup id=""></div>
      </div>
    `,
    );
    for (const element of arrange(context)) {
      assert.equal(element.isConnected, true);
    }
  });
}

test("releases instances when markup is removed and keeps other popups operable", async (t) => {
  const { $, field, document } = await setup(
    t,
    '<div class="bootstrap-timepicker"><input id="end" name="end" value="10:30"><button class="picker" type="button">End</button></div>',
  );
  $("#time, #end").timepicker().timepicker("showWidget");
  const removed = field.data("timepicker");
  field.closest(".bootstrap-timepicker").remove();
  await Promise.resolve();
  assert.equal(removed.destroyed, true);
  const remaining = $("#end").data("timepicker");
  assert.equal(remaining.isOpen, true);
  $("#outside").trigger("mousedown");
  assert.equal(remaining.isOpen, false);
  assert.equal(document.querySelectorAll("[data-timepicker-popup]").length, 1);
});

test("does not duplicate its registration when the same asset is evaluated again", async (t) => {
  const { $, field } = await setup(t);
  field.timepicker();
  const instance = field.data("timepicker");
  const plugin = $.fn.timepicker;
  await loadPlugin();
  field.timepicker();
  assert.equal($.fn.timepicker, plugin);
  assert.equal(field.data("timepicker"), instance);
  assert.equal($("[data-timepicker-popup]").length, 1);
});

test("supports the legacy span opener and an unnamed standalone field", async (t) => {
  const { $, field, input, document, key } = await setup(
    t,
    '<input id="standalone" value="15:34:20">',
  );
  $(".picker").replaceWith('<span class="input-group-addon">Open</span>');
  input.parentElement.className = "custom:group";
  field.timepicker({
    containerClass: ".custom:group",
    appendWidgetTo: ".missing",
  });
  const opener = $(".input-group-addon")[0];
  const popup = $("[data-timepicker-popup]")[0];
  assert.equal(popup.parentElement, input.parentElement);
  assert.equal(popup, input.parentElement.lastElementChild);
  assert.equal(opener.getAttribute("role"), "button");
  assert.equal(opener.getAttribute("tabindex"), "0");
  assert.equal("disabled" in opener, false);
  assert.equal(opener.getAttribute("aria-disabled"), "false");
  key("a", {}, opener);
  assert.equal(popup.hidden, true);
  key(" ", {}, opener);
  assert.equal(popup.hidden, false);
  assert.equal(opener.getAttribute("aria-expanded"), "true");
  field.timepicker("hideWidget");
  assert.equal(opener.getAttribute("aria-expanded"), "false");
  assert.equal(key("Enter", {}, opener), false);
  assert.equal(document.activeElement, $("[data-action=incrementHour]")[0]);
  field.timepicker("hideWidget");
  input.readOnly = true;
  await Promise.resolve();
  assert.equal(opener.getAttribute("aria-disabled"), "true");

  const standalone = document.getElementById("standalone");
  $(standalone).timepicker({ disableFocus: true });
  standalone.click();
  assert.equal(
    standalone.nextElementSibling.getAttribute("data-timepicker-popup"),
    "",
  );
  assert.equal(standalone.name, "");
  assert.equal($(standalone).data("timepicker").isOpen, true);
  key("Escape", {}, standalone);
  assert.equal(document.activeElement, standalone);
  assert.equal($(standalone).data("timepicker").isOpen, false);
});

test("selects units and commits keyboard changes in the field and popup", async (t) => {
  const { $, document, field, input, submit, key } = await setup(t);
  field.timepicker({ showSeconds: true, minuteStep: 5 });
  const closed = [];
  field.on("hide.timepicker", ({ time }) => closed.push(time.canonicalValue));

  input.setSelectionRange(4, 4);
  input.click();
  assert.equal(input.selectionStart, 3);
  assert.equal(key("ArrowUp"), false);
  assert.equal(submit(), "13:50:30");
  assert.equal(key("ArrowDown", { ctrlKey: true }), true);
  assert.equal(submit(), "13:50:30");
  assert.equal(key("Tab", { shiftKey: true }), false);
  assert.equal(input.selectionStart, 0);
  assert.equal(key("Tab", { shiftKey: true }), true);
  key("ArrowLeft");
  assert.equal(input.selectionStart, 9);
  key("ArrowDown");
  assert.equal(submit(), "01:50:30");
  key("F4");
  const minute = $("[data-unit=minute]")[0];
  key("ArrowDown", {}, minute);
  assert.equal(submit(), "01:45:30");
  key("Enter", {}, minute);
  const popup = minute.closest("[data-timepicker-popup]");
  const opener = $(".picker")[0];
  assert.equal(popup.hidden, true);
  assert.equal(document.activeElement, opener);
  assert.deepEqual(closed, ["01:45:30"]);

  input.focus();
  assert.equal(key("Escape"), true);
  assert.equal(document.activeElement, input);
  assert.equal(popup.hidden, true);
  assert.deepEqual(closed, ["01:45:30"]);
  assert.equal(submit(), "01:45:30");
});

test("handles the native dialog cancel, close button and external close", async (t) => {
  const { $, field, document, window } = await setup(t);
  field.timepicker({
    template: "modal",
    modalBackdrop: true,
    labels: { title: "Choose" },
  });
  const dialog = $("dialog")[0];
  // jsdom lacks the browser's dialog methods. Chromium covers the native implementation.
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    if (dialog.open) {
      dialog.open = false;
      dialog.dispatchEvent(new window.Event("close"));
    }
  };
  assert.equal(dialog.getAttribute("aria-label"), "Choose");
  assert.equal(
    dialog.querySelector("div.timepicker-title").textContent,
    "Choose",
  );
  assert.equal(dialog.classList.contains("timepicker-backdrop"), true);
  const closed = [];
  field.on("hide.timepicker", ({ time }) => closed.push(time.canonicalValue));
  field.timepicker("showWidget");
  assert.equal(dialog.open, true);
  // A queued close from an earlier opening must leave a reopened dialog alone.
  dialog.dispatchEvent(new window.Event("close"));
  assert.equal(dialog.open, true);
  const hour = dialog.querySelector("[data-unit=hour]");
  hour.focus();
  assert.equal(
    dialog.dispatchEvent(new window.Event("cancel", { cancelable: true })),
    false,
  );
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, $(".picker")[0]);
  field.timepicker("showWidget");
  hour.focus();
  $("[data-action=close]").trigger("click");
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, $(".picker")[0]);
  field.timepicker("showWidget");
  dialog.close();
  dialog.dispatchEvent(new window.Event("close"));
  assert.equal(dialog.open, false);
  assert.deepEqual(closed, ["13:45:30", "13:45:30", "13:45:30"]);
});

test("commits typed popup values on submit and preserves hidden seconds in a clone", async (t) => {
  const { $, field, input, form, window, notify } = await setup(t);
  field.timepicker();
  const original = input.parentElement;
  const clone = original.cloneNode(true);
  form.append(clone);
  const unrelated = form.ownerDocument.createElement("div");
  unrelated.id = "unrelated-popup";
  unrelated.setAttribute("data-timepicker-popup", "");
  clone.append(unrelated);
  const cloned = clone.querySelector("input");
  cloned.id = "new-time";
  clone.querySelector("[data-timepicker-value]").name = "end";
  $(cloned).timepicker();
  assert.equal(new window.FormData(form).get("end"), "13:45:30");
  assert.deepEqual(
    [...clone.querySelectorAll("[data-timepicker-popup]")].map(
      (popup) => popup.id,
    ),
    [
      "unrelated-popup",
      clone.querySelector(".picker").getAttribute("aria-controls"),
    ],
  );
  assert.notEqual(
    clone.querySelector(".picker").getAttribute("aria-controls"),
    original.querySelector("[data-timepicker-popup]").id,
  );
  field.timepicker("showWidget");
  const minute = original.querySelector("[data-unit=minute]");
  minute.value = "10";
  notify("input", minute);
  notify("submit", form);
  assert.equal(new window.FormData(form).get("start"), "13:10:30");
  original.querySelectorAll("[data-unit]").forEach((part) => {
    part.value = "";
    notify("input", part);
  });
  field.timepicker("hideWidget");
  assert.equal(new window.FormData(form).get("start"), "");
});

test("opens from a button, labels the controls and preserves focus behavior", async (t) => {
  const { $, document, field, form, input, window, submit, key } =
    await setup(t);
  field.timepicker({
    showSeconds: true,
    labels: { title: "Start time", incrementHour: "Later hour" },
    upArrowStyle: "arrow-up",
    downArrowStyle: "arrow-down",
  });
  assert.deepEqual([...new window.FormData(form)], [["start", "13:45:30"]]);
  const opener = $(".picker")[0];
  const popup = document.getElementById(opener.getAttribute("aria-controls"));
  const hourUp = popup.querySelector("[data-action=incrementHour]");
  const minuteDown = popup.querySelector("[data-action=decrementMinute]");
  const minute = popup.querySelector("[data-unit=minute]");
  assert.ok(minute.matches('input[type="text"]'));
  assert.equal(opener.getAttribute("role"), null);
  assert.equal(opener.getAttribute("tabindex"), null);
  assert.equal(opener.getAttribute("aria-expanded"), "false");
  assert.equal(opener.getAttribute("aria-haspopup"), "dialog");
  assert.equal(popup.getAttribute("aria-label"), "Start time");
  assert.equal(popup.getAttribute("role"), "dialog");
  assert.equal(hourUp.getAttribute("aria-label"), "Later hour");
  assert.equal(hourUp.type, "button");
  assert.equal(minute.maxLength, 2);
  assert.equal(minute.getAttribute("aria-label"), "Minute");
  assert.ok(minute.classList.contains("form-control"));
  assert.equal(minuteDown.firstElementChild.className, "arrow-down");
  assert.equal(hourUp.firstElementChild.className, "arrow-up");
  assert.equal(hourUp.firstElementChild.getAttribute("aria-hidden"), "true");
  assert.deepEqual(
    [...popup.querySelectorAll("tr:nth-child(2) .separator")].map(
      (cell) => cell.textContent,
    ),
    [":", ":", " "],
  );

  opener.click();
  assert.equal(document.activeElement, hourUp);
  assert.equal(opener.getAttribute("aria-expanded"), "true");
  assert.ok(popup.classList.contains("open"));
  for (const target of [minute, input, opener]) {
    target.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true }));
    assert.equal(popup.hidden, false);
  }
  assert.equal(key("a", {}, minute), true);
  assert.equal(submit(), "13:45:30");
  assert.equal(key("ArrowUp", {}, minute), false);
  assert.equal(submit(), "14:00:30");
  assert.equal(minute.selectionStart, 0);
  assert.equal(minute.selectionEnd, 2);
  key("Escape", {}, minute);
  assert.equal(popup.hidden, true);
  assert.equal(document.activeElement, opener);
  assert.equal(opener.getAttribute("aria-expanded"), "false");
  assert.equal(popup.classList.contains("open"), false);
});

test("follows the visible field's form owner and honors a canceled reset", async (t) => {
  const { document, field, input, form, window, submit, notify } =
    await setup(t);
  const alternate = document.createElement("form");
  alternate.id = "alternate";
  document.body.append(alternate);
  input.setAttribute("form", alternate.id);
  field.timepicker();
  const alternateValue = () => new window.FormData(alternate).get("start");
  const companion = input.nextElementSibling;
  assert.equal(companion.type, "hidden");
  const events = [];
  field.on("changeTime.timepicker", ({ time }) =>
    events.push(time.canonicalValue),
  );
  input.value = "11:08 PM";
  notify("submit", form);
  assert.equal(alternateValue(), "13:45:30");
  assert.deepEqual(events, []);
  const valuesAtSubmit = [];
  alternate.addEventListener("submit", () =>
    valuesAtSubmit.push(alternateValue()),
  );
  notify("submit", alternate);
  assert.deepEqual(valuesAtSubmit, ["23:08:30"]);
  assert.deepEqual(events, ["23:08:30"]);
  alternate.addEventListener("reset", (event) => event.preventDefault(), {
    once: true,
  });
  alternate.reset();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.equal(alternateValue(), "23:08:30");
  assert.equal(submit(), null);

  input.removeAttribute("form");
  await Promise.resolve();
  assert.equal(alternateValue(), null);
  assert.equal(submit(), "23:08:30");
  form.reset();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.equal(submit(), "13:45:30");
  assert.deepEqual(events, ["23:08:30"]);

  field.timepicker("showWidget");
  input.setAttribute("form", alternate.id);
  field.timepicker("setTime", "10:25");
  assert.equal(alternateValue(), "10:25:00");
  assert.equal(submit(), null);
  await Promise.resolve();
  assert.equal(document.querySelector("[data-timepicker-popup]").hidden, false);
});

test("commits on blur, clears both fields and publishes only the latest native change", async (t) => {
  const { field, input, submit, notify } = await setup(t);
  field.timepicker();
  const events = [];
  input.addEventListener("change", () => events.push(["native", submit()]));
  field.on("changeTime.timepicker", ({ time }) => {
    events.push(["plugin", time.canonicalValue]);
    if (time.canonicalValue === "08:01:30") {
      field.timepicker("setTime", "09:02:00");
    }
  });
  input.value = "08:01";
  notify("blur");
  assert.deepEqual(events, [
    ["plugin", "08:01:30"],
    ["plugin", "09:02:00"],
    ["native", "09:02:00"],
  ]);
  field.timepicker("clear");
  field.timepicker("clear");
  assert.equal(input.value, "");
  assert.equal(submit(), "");
  assert.deepEqual(events.slice(3), [
    ["plugin", ""],
    ["native", ""],
  ]);
});

test("stops a native change once a changeTime listener supersedes its value", async (t) => {
  const { field, input, form, submit, notify } = await setup(t);
  field.timepicker();
  const events = [];
  form.addEventListener("change", () => events.push(["change", submit()]));
  field.on("changeTime.timepicker", ({ time }) => {
    events.push(["changeTime", time.canonicalValue]);
    if (time.canonicalValue === "08:01:30") {
      field.timepicker("setTime", "09:02:00");
    }
  });
  for (const value of ["08:01", "10:03"]) {
    input.value = value;
    notify("change");
  }
  assert.deepEqual(events, [
    ["changeTime", "08:01:30"],
    ["changeTime", "09:02:00"],
    ["change", "09:02:00"],
    ["changeTime", "10:03:00"],
    ["change", "10:03:00"],
  ]);
});

test("can destroy during a change caused by opening and can destroy an old instance again", async (t) => {
  const { $, field, input, submit } = await setup(t);
  field.timepicker();
  const old = field.data("timepicker");
  let shown = 0;
  field.one("changeTime.timepicker", () => field.timepicker("destroy"));
  field.on("show.timepicker", () => shown++);
  input.value = "07:15";
  field.timepicker("showWidget");
  assert.equal(shown, 0);
  assert.equal(old.isOpen, false);
  assert.equal($("[data-timepicker-popup]").length, 0);
  assert.equal($(".picker").attr("aria-expanded"), undefined);
  assert.equal(input.name, "start");
  assert.equal(submit(), "07:15:30");

  field.timepicker();
  old.destroy();
  assert.equal($("[data-timepicker-popup]").length, 1);
  assert.equal(input.name, "");
  $(".picker").trigger("click");
  assert.equal(shown, 1);
});

test("navigates 24-hour fields and edits the 24-hour popup", async (t) => {
  const { $, field, input, submit, notify, key } = await setup(t);
  field.timepicker({ showMeridian: false, minuteStep: 59, secondStep: 1 });
  assert.equal(key("Tab"), true);
  assert.equal(key("ArrowLeft"), false);
  assert.equal(input.selectionStart, 0);
  notify("blur");
  assert.equal(key("ArrowRight"), false);
  assert.equal(input.selectionStart, 0);
  assert.equal(key("Tab"), false);
  assert.equal(input.selectionStart, 3);
  assert.equal(key("Tab"), true);
  assert.equal(key("ArrowRight"), false);
  assert.equal(input.selectionStart, 0);
  input.setSelectionRange(0, 5);
  input.click();
  assert.equal(input.selectionEnd, 5);
  assert.equal(key("a"), true);
  assert.equal(key("ArrowUp", { metaKey: true }), true);
  assert.equal(key("ArrowUp", { altKey: true }), true);
  assert.equal(submit(), "13:45:30");
  assert.equal(key("ArrowDown", { shiftKey: true }), false);
  assert.equal($("[data-unit=meridian]").length, 0);
  const hour = $("[data-unit=hour]")[0];
  hour.value = "21";
  notify("input", hour);
  assert.equal(key("Enter", {}, hour), false);
  assert.equal(submit(), "21:45:30");
  assert.equal(input.value, "21:45");
  field.timepicker("incrementMinute").timepicker("incrementSecond");
  assert.equal(submit(), "21:59:31");
  field.timepicker("clear").timepicker("incrementMinute");
  assert.equal(submit(), "00:59:00");
  field.timepicker("clear").timepicker("incrementSecond");
  assert.equal(submit(), "00:00:01");
});

test("keeps cloned popups scoped to their own opener in a shared container", async (t) => {
  const { $, field, form, input, submit } = await setup(
    t,
    `
    <div class="bootstrap-timepicker"><input id="other" name="end" value="09:00"><button class="picker" type="button">End</button></div>
  `,
  );
  const other = $("#other");
  field.timepicker({ appendWidgetTo: "form" });
  other.timepicker({ appendWidgetTo: "form" });
  const popupFor = (element) =>
    element.parentElement
      .querySelector(".picker")
      .getAttribute("aria-controls");
  const originalId = popupFor(input);
  const otherId = popupFor(other[0]);
  const clone = input.parentElement.cloneNode(true);
  const copy = clone.querySelector("input");
  copy.id = "new-time";
  copy.value = "03:10 PM";
  clone.querySelector("[data-timepicker-value]").name = "copy";
  form.append(clone);
  // The clone has no copy of the popup when the popup is appended to an ancestor.
  $(copy).timepicker({ appendWidgetTo: "form" });
  assert.ok(form.querySelector(`#${originalId}`));
  assert.ok(form.querySelector(`#${otherId}`));
  assert.notEqual(popupFor(copy), originalId);
  assert.equal(form.querySelector(`#${originalId}`).parentElement, form);
  assert.equal(form.querySelector(`#${popupFor(copy)}`).parentElement, form);
  assert.equal($(copy).next().val(), "15:10:00");
  assert.equal(submit(), "13:45:30");
});

test("isolates PJAX scopes and leaves fields without registered options untouched", async (t) => {
  const { $, field, window } = await setup(t);
  window.validOptions = { showSeconds: true };
  field.attr({
    "data-timepicker-pjax": "other",
    "data-krajee-timepicker": "validOptions",
  });
  field.timepicker("remove");
  assert.equal(field.data("timepicker"), undefined);
  $("#pjax").trigger("pjax:complete");
  assert.equal(field.data("timepicker"), undefined);
  field.attr({
    "data-timepicker-pjax": "pjax",
    "data-krajee-timepicker": "missingOptions",
  });
  $("#pjax").trigger("pjax:complete");
  assert.equal(field.data("timepicker"), undefined);
  field.attr("data-krajee-timepicker", "validOptions");
  $("#pjax").trigger("pjax:complete");
  assert.equal(field.val(), "01:45:30 PM");
  field.timepicker("valueOf");
  field.timepicker("unknownMethod");
  field.timepicker("");
  assert.equal(field.val(), "01:45:30 PM");
});

test("falls back from unsupported defaults and preserves a separately disabled opener", async (t) => {
  const { $, field, input, submit, key } = await setup(t);
  input.value = "";
  $(".picker").prop("disabled", true);
  field.timepicker({ defaultTime: new Date(NaN), template: "modal" });
  assert.equal(submit(), "");
  assert.equal($(".picker").prop("disabled"), true);
  assert.equal($(".picker").attr("aria-disabled"), "true");
  assert.equal($("dialog").hasClass("timepicker-backdrop"), false);
  const close = $("dialog [data-action=close]")[0];
  assert.equal(close.textContent, "Done");
  assert.equal(close.type, "button");
  field.timepicker("destroy").timepicker({ template: false });
  assert.equal($(".picker").attr("aria-disabled"), undefined);
  assert.equal($(".picker").prop("disabled"), true);
  assert.equal(key("ArrowDown", { shiftKey: true }), false);
  assert.equal(submit(), "23:00:00");
  assert.equal($("[data-timepicker-popup]").length, 0);
});

test("restores the enabled opener after destroying a readonly picker", async (t) => {
  const { $, field, input } = await setup(t);
  const opener = $(".picker");
  field.timepicker();
  input.readOnly = true;
  await Promise.resolve();
  assert.equal(opener.prop("disabled"), true);

  field.timepicker("destroy");
  assert.equal(opener.prop("disabled"), false);
  input.readOnly = false;
  field.timepicker();
  opener[0].click();
  assert.equal(opener.attr("aria-expanded"), "true");
});

function inDisabledFieldset(element) {
  const fieldset = element.ownerDocument.createElement("fieldset");
  fieldset.disabled = true;
  element.before(fieldset);
  fieldset.append(element);
  return () => {
    fieldset.disabled = false;
  };
}

for (const [scenario, arrange, disabled] of [
  [
    "enables an opener when its shared fieldset is enabled",
    (input) => inDisabledFieldset(input.parentElement),
    false,
  ],
  [
    "keeps an explicitly disabled opener when its shared fieldset is enabled",
    (input, opener) => {
      opener.disabled = true;
      return inDisabledFieldset(input.parentElement);
    },
    true,
  ],
  [
    "keeps an opener disabled by its own fieldset while the input is editable",
    (input, opener) => {
      inDisabledFieldset(opener);
      return () => {};
    },
    true,
  ],
  [
    "enables a rendered disabled opener when its readonly input becomes editable",
    (input, opener) => {
      opener.disabled = true;
      input.readOnly = true;
      return () => {
        input.readOnly = false;
      };
    },
    false,
  ],
  [
    "enables a rendered disabled opener when its disabled input is enabled",
    (input, opener) => {
      opener.disabled = true;
      input.disabled = true;
      return () => {
        input.disabled = false;
      };
    },
    false,
  ],
]) {
  test(scenario, async (t) => {
    const { $, field, input } = await setup(t);
    const opener = $(".picker");
    const release = arrange(input, opener[0]);
    field.timepicker();
    release();
    await Promise.resolve();
    assert.equal(opener.prop("disabled"), disabled);
    assert.equal(opener.attr("aria-disabled"), String(disabled));
    opener[0].click();
    assert.equal(opener.attr("aria-expanded"), String(!disabled));
  });
}

test("leaves unsupported selections alone and blocks edits before readonly sync", async (t) => {
  const { $, field, input, submit, window, key } = await setup(
    t,
    '<input id="native" type="time" value="13:45">',
  );
  const native = $("#native");
  native.timepicker({ showMeridian: false, template: false });
  const errors = [];
  window.addEventListener("error", (event) => {
    event.preventDefault();
    errors.push(event.error);
  });
  native[0].click();
  assert.equal(native[0].selectionStart, null);
  assert.equal(native.data("timepicker").highlightedUnit, "hour");
  assert.deepEqual(errors, []);

  field.timepicker().timepicker("showWidget");
  input.readOnly = true;
  $("[data-action=incrementHour]").trigger("click");
  const minute = $("[data-unit=minute]")[0];
  assert.equal(key("ArrowUp", {}, minute), true);
  assert.equal(submit(), "13:45:30");
  await Promise.resolve();
  assert.equal($("[data-timepicker-popup]").prop("hidden"), true);
});

test("keeps default controls, supports grouped callbacks and avoids duplicate open events", async (t) => {
  const { $, field, input, window, document, submit, notify } = await setup(t);
  assert.equal($.fn.timepicker.defaults.defaultTime, false);
  assert.equal($.fn.timepicker.defaults.template, "dropdown");
  const events = [];
  field.timepicker({
    showSeconds: true,
    defaultTime: "current",
    events: {
      "  show.timepicker\t\n hide.timepicker  ": (event) =>
        events.push(event.type),
      "  ": () => assert.fail("A blank event key must not invoke its handler"),
    },
  });
  assert.equal(submit(), "13:45:30");
  const popup = $(".bootstrap-timepicker-widget.dropdown-menu")[0];
  assert.equal(popup.getAttribute("aria-label"), "Choose a time");
  assert.deepEqual(
    [...popup.querySelectorAll("[data-unit]")].map((part) =>
      part.getAttribute("aria-label"),
    ),
    ["Hour", "Minute", "Second", "AM or PM"],
  );
  assert.deepEqual(
    [...popup.querySelectorAll("[data-action]")].map((button) =>
      button.getAttribute("aria-label"),
    ),
    [
      "Increase hour",
      "Increase minute",
      "Increase second",
      "Toggle AM or PM",
      "Decrease hour",
      "Decrease minute",
      "Decrease second",
      "Toggle AM or PM",
    ],
  );
  assert.equal(popup.querySelectorAll("tr:first-child .separator").length, 3);
  assert.equal(popup.querySelectorAll("tr:last-child .separator").length, 3);
  assert.equal(
    popup.querySelector("[data-action=incrementHour] i").className,
    "glyphicon glyphicon-chevron-up",
  );
  assert.equal(
    popup.querySelector("[data-action=decrementHour] i").className,
    "glyphicon glyphicon-chevron-down",
  );
  assert.equal(popup.querySelector("[data-action=close]"), null);

  input.focus();
  field.timepicker("showWidget").timepicker("showWidget");
  assert.deepEqual(events, ["show"]);
  assert.equal(document.activeElement, input);
  const minute = popup.querySelector("[data-unit=minute]");
  minute.value = " 7 ";
  notify("input", minute);
  const action = popup.querySelector("[data-action=incrementHour]");
  assert.equal(
    action.dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true }),
    ),
    false,
  );
  assert.equal(submit(), "14:07:30");
  const meridian = popup.querySelector("[data-action=toggleMeridian]");
  meridian.click();
  assert.equal(submit(), "02:07:30");
  minute.focus();
  field.timepicker("hideWidget");
  assert.equal(document.activeElement, minute);
  assert.deepEqual(events, ["show", "hide"]);
  field.timepicker("destroy");
  field.trigger("show.timepicker").trigger("hide.timepicker");
  assert.deepEqual(events, ["show", "hide"]);
});

test("commits typed time while moving focus and respects disableFocus", async (t) => {
  const { $, field, input, document, submit, key } = await setup(t);
  field.timepicker();
  input.focus();
  input.setSelectionRange(0, 0);
  input.click();
  input.value = "02:53 PM";
  const bubbled = [];
  input.form.addEventListener("change", () => bubbled.push(submit()));
  assert.equal(key("Tab"), false);
  assert.equal(submit(), "14:53:30");
  assert.deepEqual(bubbled, ["14:53:30"]);
  assert.equal(key("ArrowRight"), false);
  assert.equal(input.selectionStart, 6);
  assert.equal(key("F4"), false);
  assert.equal(document.activeElement, $("[data-action=incrementHour]")[0]);
  $("[data-action=incrementHour]").trigger(
    $.Event("keydown", { key: "ArrowUp" }),
  );
  assert.equal(submit(), "14:53:30");
  field.timepicker("destroy").timepicker({ disableFocus: true });
  input.focus();
  field.timepicker("showWidget");
  assert.notEqual(document.activeElement, input);
});

test("shares one document listener per form event across mounted fields", async (t) => {
  const { $, field, listeners } = await setup(
    t,
    '<input id="second" value="08:00" name="end">',
  );
  field.timepicker();
  $("#second").timepicker();

  assert.equal(listeners("added", "submit").length, 1);
  assert.equal(listeners("added", "reset").length, 1);
});

test("releases the document outside-click hook when closing the last popup", async (t) => {
  const { field, listeners } = await setup(t);
  field.timepicker("showWidget");
  const [outsideClick] = listeners("added", "mousedown");
  assert.ok(outsideClick, "Opening a dropdown must listen for outside clicks.");

  field.timepicker("hideWidget");
  assert.ok(
    listeners("removed", "mousedown").some(
      ([, handler]) => handler === outsideClick[1],
    ),
    "Closing the last dropdown must release the same document listener.",
  );
});

test("releases hooks after destroy, and preserves form listeners for surviving fields", async (t) => {
  const { $, field, input, form, window, notify, submit, listeners } =
    await setup(t, '<input id="second" value="08:00" name="end">');
  const released = (type) => listeners("removed", type);
  const disconnect = vi.spyOn(window.MutationObserver.prototype, "disconnect");
  const clearTimer = vi.spyOn(window, "clearTimeout");
  field.timepicker("destroy");
  assert.equal(field.data("timepicker"), undefined);
  const second = $("#second");
  field.timepicker();
  second.timepicker();
  field.timepicker("showWidget");
  const first = field.data("timepicker");
  form.reset();
  const firstReset = first.resetTimer;
  form.reset();
  assert.ok(clearTimer.mock.calls.some(([id]) => id === firstReset));
  const lastReset = first.resetTimer;
  field.timepicker("destroy");
  assert.ok(clearTimer.mock.calls.some(([id]) => id === lastReset));
  assert.ok(released("mousedown").length);
  assert.equal(disconnect.mock.calls.length, 1);
  assert.equal(submit(), "13:45:30");
  assert.deepEqual(new window.FormData(form).getAll("start"), ["13:45:30"]);
  assert.equal(
    input.nextElementSibling.matches("[data-timepicker-value]"),
    false,
  );
  assert.equal(released("submit").length + released("reset").length, 0);
  $("#outside").trigger("mousedown");
  second[0].value = "10:35";
  notify("submit", form);
  assert.equal(new window.FormData(form).get("end"), "10:35:00");

  second.timepicker("destroy");
  assert.equal(disconnect.mock.calls.length, 3);
  assert.ok(released("submit").some(([, , capture]) => capture === true));
  assert.ok(released("reset").length);
});

test("observes removal while leaving prepared detached fields intact during insertions", async (t) => {
  const { $, field, document, form } = await setup(t);
  field.timepicker();
  const detached = document.createElement("input");
  detached.name = "detached";
  $(detached).timepicker({ template: false });
  const instance = $(detached).data("timepicker");
  t.onTestFinished(() => instance.destroy());
  const wrapper = document.createElement("div");
  form.append(wrapper);
  await Promise.resolve();
  assert.equal(instance.destroyed, undefined);
  wrapper.append(detached);
  $(detached).timepicker("setTime", "10:30");
  assert.equal(detached.value, "10:30 AM");
  wrapper.remove();
  await Promise.resolve();
  assert.equal(instance.destroyed, true);
});

test("replaces invalid text with an edited popup time and starts hidden seconds at zero", async (t) => {
  const { $, field, window, submit, notify } = await setup(t);
  field.timepicker({ showMeridian: false });
  const find = vi.spyOn($.fn, "find");
  const edit = (unit, value) => {
    const input = $(`[data-unit=${unit}]`)[0];
    input.value = value;
    notify("input", input);
  };
  field.timepicker("setTime", "15").timepicker("showWidget");
  edit("hour", "23");
  edit("minute", "40");
  field.timepicker("hideWidget");
  assert.equal(submit(), "23:40:00");
  const stylesheet = new window.CSSStyleSheet();
  for (const [selector] of find.mock.calls) {
    if (typeof selector === "string" && selector.startsWith("[data-unit")) {
      // The stylesheet parser rejects unclosed attribute selectors that modern query APIs repair.
      assert.doesNotThrow(() => stylesheet.insertRule(`${selector} {}`));
    }
  }

  field.timepicker("showWidget");
  edit("hour", "");
  edit("minute", "");
  field.timepicker("hideWidget");
  assert.equal(submit(), "");

  field.timepicker("clear").timepicker("showWidget");
  edit("minute", "7");
  field.timepicker("hideWidget");
  assert.equal(submit(), ":07");
});

test("keeps explicit visible seconds when initializing a clone with a stale companion", async (t) => {
  const samples = [
    ["01:45:02 PM", true, "13:45:02"],
    ["13:45", true, "13:45:00"],
    ["13:45:02", false, "13:45:02"],
    ["13:45:00", false, "13:45:00"],
    ["13:45", false, "13:45:30"],
    ["01:45 PM", false, "13:45:30"],
    ["13:46", false, "13:46:00"],
  ];
  const { $, form, window } = await setup(
    t,
    samples
      .map(
        ([visible], index) =>
          `<input id="copy${index}" value="${visible}"><input type="hidden" name="copy${index}" value="13:45:30" data-timepicker-value>`,
      )
      .join(""),
  );
  samples.forEach(([, showSeconds], index) =>
    $(`#copy${index}`).timepicker({ showSeconds }),
  );
  const values = new window.FormData(form);
  assert.deepEqual(
    samples.map((sample, index) => [...sample, values.get(`copy${index}`)]),
    samples.map((sample) => [...sample, sample[2]]),
  );
});

test("uses a supplied initial time and keeps a literal dot in a group class", async (t) => {
  const { $, field, input, submit, key } = await setup(t);
  input.value = "";
  input.parentElement.className = "custom.group";
  field.timepicker({ defaultTime: "16:07:02", containerClass: "custom.group" });
  assert.equal(submit(), "16:07:02");
  $(".picker")[0].click();
  assert.equal($("[data-timepicker-popup]").prop("hidden"), false);
  assert.equal(
    $("[data-timepicker-popup]")[0].parentElement,
    input.parentElement,
  );

  field.timepicker("hideWidget").timepicker("setTime", "a long invalid time");
  input.setSelectionRange(input.value.length, input.value.length);
  input.click();
  assert.equal(input.selectionStart, 6);
  key("ArrowUp");
  assert.equal(submit(), "12:00:00");
  assert.equal(input.selectionStart, 6);
  assert.equal(input.selectionEnd, 8);
});

test("starts horizontal keyboard navigation at the hour in the meridian layout", async (t) => {
  const { field, input, key } = await setup(t);
  field.timepicker();
  assert.equal(key("ArrowLeft"), false);
  assert.equal(input.selectionStart, 0);
  assert.equal(input.selectionEnd, 2);
});

test("leaves a visible draft pending when an unedited dropdown closes", async (t) => {
  const { $, field, input, form, submit, notify } = await setup(t);
  const hiddenTimes = [];
  field.on("hide.timepicker", ({ time }) =>
    hiddenTimes.push(time.canonicalValue),
  );
  field.timepicker().timepicker("showWidget");
  const popup = $("[data-timepicker-popup]")[0];
  for (const name of ["cancel", "close"]) {
    assert.equal(notify(name, popup), true);
    assert.equal(popup.hidden, false);
  }

  input.value = "02:35 PM";
  notify("input", popup.querySelector("button"));
  field.timepicker("hideWidget");
  assert.equal(input.value, "02:35 PM");
  assert.equal(submit(), "13:45:30");
  assert.deepEqual(hiddenTimes, ["13:45:30"]);
  notify("submit", form);
  assert.equal(submit(), "14:35:30");
});

test("keeps invalid numeric text distinct from a cloned companion's valid time", async (t) => {
  const { $, form, window } = await setup(
    t,
    `
    <input id="invalid-display" value="63"><input type="hidden" name="invalid-display" value="00:01:44" data-timepicker-value>
    <input id="invalid-companion" value="00:01"><input type="hidden" name="invalid-companion" value="63" data-timepicker-value>
  `,
  );
  $("#invalid-display, #invalid-companion").timepicker();
  const values = new window.FormData(form);
  assert.equal($("#invalid-display").val(), "63");
  assert.equal(values.get("invalid-display"), "63");
  assert.equal($("#invalid-companion").val(), "12:01 AM");
  assert.equal(values.get("invalid-companion"), "00:01:00");
});

test("preserves native defaultValue updates on an untouched field", async (t) => {
  const { $, form, window, notify } = await setup(
    t,
    '<input id="empty" name="empty">',
  );
  const field = $("#empty").timepicker();
  field[0].defaultValue = "12:10";
  assert.equal(field.val(), "12:10");
  notify("submit", form);
  assert.equal(new window.FormData(form).get("empty"), "12:10:00");
});

test("leaves an unmounted field untouched when asked to remove its picker", async (t) => {
  const { $, input, field } = await setup(t);
  input.value = "  ";
  field.timepicker("remove");
  assert.equal(input.value, "  ");
  assert.equal(field.data("timepicker"), undefined);
  assert.equal($("[data-timepicker-popup], [data-timepicker-value]").length, 0);
});

test("ignores a callback passed in place of the plugin options object", async (t) => {
  const { $, field } = await setup(t);
  const callback = vi.fn();
  callback.template = false;
  field.timepicker(callback);
  assert.equal($("[data-timepicker-popup].dropdown-menu").length, 1);
  assert.equal(callback.mock.calls.length, 0);
});

test("associates the companion before registering consumer event hooks", async (t) => {
  const { $, field, input, document } = await setup(t);
  const alternate = document.createElement("form");
  alternate.id = "external-form";
  document.body.append(alternate);
  input.setAttribute("form", alternate.id);
  input.disabled = true;
  const observed = [];
  $.event.special.timepickerProbe = {
    setup() {
      const companion = this.nextElementSibling;
      observed.push([companion.form, companion.disabled]);
    },
  };

  field.timepicker({ events: { "timepickerProbe.timepicker": () => {} } });

  assert.deepEqual(observed, [[alternate, true]]);
});
