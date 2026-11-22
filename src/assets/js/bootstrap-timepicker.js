/*!
 * Timepicker Component for Twitter Bootstrap (upstream bootstrap-timepicker v0.2.3)
 *
 * Improvements by:
 * - Kartik Visweswaran, Krajee.com, 2014 - 2021
 * - Stefano Mtangoo<mwinjilisti@gmail.com> and contributors, 2024 -
 *
 * Copyright (c) 2013 Joris de Wit
 *
 * Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
 *
 * MIT License. For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function ($, window, document, undefined) {
    'use strict';

    if ($.fn.timepicker && $.fn.timepicker.yii2Extensions) {
        return;
    }

    var secondsPerDay = 24 * 60 * 60;
    var sequence = 0;
    var instances = new Set();
    var observer = new MutationObserver(function (records) {
        if (records.some(function (record) { return record.removedNodes.length > 0; })) {
            instances.forEach(function (instance) {
                if (!instance.element.isConnected) {
                    instance.destroy();
                }
            });
        }
    });

    function visitForm(event, callback) {
        instances.forEach(function (instance) {
            if (instance.element.form === event.target) {
                callback(instance);
            }
        });
    }

    function submitForm(event) {
        visitForm(event, function (instance) {
            instance.commit(instance.readEditedValue());
        });
    }

    function resetForm(event) {
        visitForm(event, function (instance) {
            window.clearTimeout(instance.resetTimer);
            instance.resetTimer = window.setTimeout(function () {
                if (!event.defaultPrevented) {
                    instance.commit(instance.initialValue, true);
                }
            }, 0);
        });
    }

    function track(instance) {
        if (!instances.size) {
            observer.observe(document.documentElement, { childList: true, subtree: true });
            document.addEventListener('submit', submitForm, true);
            document.addEventListener('reset', resetForm);
        }
        instances.add(instance);
    }

    function untrack(instance) {
        instances.delete(instance);
        if (!instances.size) {
            observer.disconnect();
            document.removeEventListener('submit', submitForm, true);
            document.removeEventListener('reset', resetForm);
        }
    }

    function pad(value) {
        return value < 10 ? '0' + value : String(value);
    }

    function parseTime(value, defaultSecond) {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime())
                ? undefined
                : value.getHours() * 3600 + value.getMinutes() * 60 + value.getSeconds();
        }
        if (value === null || value === false) {
            return '';
        }
        if (typeof value !== 'string') {
            return undefined;
        }
        var text = value.trim();
        if (!text) {
            return '';
        }
        var match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?: (AM|PM))?$/i.exec(text);
        if (!match) {
            return value;
        }
        var hour = Number(match[1]);
        var minute = Number(match[2]);
        var second = match[3] === undefined ? defaultSecond : Number(match[3]);
        if (minute > 59 || second > 59) {
            return value;
        }
        if (match[4]) {
            if (hour < 1 || hour > 12) {
                return value;
            }
            hour = hour % 12 + (match[4].toUpperCase() === 'PM' ? 12 : 0);
        } else if (match[1].length !== 2 || hour > 23) {
            return value;
        }
        return hour * 3600 + minute * 60 + second;
    }

    function canonicalValue(value) {
        if (typeof value !== 'number') {
            return value;
        }
        return pad(Math.floor(value / 3600)) + ':' +
            pad(Math.floor(value / 60) % 60) + ':' + pad(value % 60);
    }

    function actionName(unit, direction) {
        return unit === 'meridian' ? 'toggleMeridian' : direction + unit[0].toUpperCase() + unit.slice(1);
    }

    function stepSize(value) {
        var step = Number(value);
        return Number.isInteger(step) && step >= 1 && step <= 59 ? step : 15;
    }

    var Timepicker = function (element, options) {
        this.$element = $(element);
        this.element = element;
        this.defaultTime = options.defaultTime;
        this.disableFocus = options.disableFocus;
        this.isOpen = false;
        do {
            this.popupId = 'bootstrap-timepicker-' + ++sequence;
        } while (document.getElementById(this.popupId));
        this.namespace = '.timepicker' + sequence;
        this.minuteStep = stepSize(options.minuteStep);
        this.modalBackdrop = options.modalBackdrop;
        this.secondStep = stepSize(options.secondStep);
        this.showInputs = options.showInputs;
        this.showMeridian = options.showMeridian;
        this.showSeconds = options.showSeconds;
        this.template = options.template;
        this.labels = $.extend({}, $.fn.timepicker.defaults.labels, options.labels);
        this.events = options.events;
        this.appendWidgetTo = options.appendWidgetTo;
        this.upArrowStyle = options.upArrowStyle;
        this.downArrowStyle = options.downArrowStyle;
        this.containerClass = options.containerClass;

        this._init();
    };

    Timepicker.prototype = {
        constructor: Timepicker,
        _init: function () {
            var self = this;
            var containerClass = this.containerClass.replace(/^\./, '');
            var $group = this.$element.parents().filter(function () {
                return this.classList.contains(containerClass);
            }).first();
            this.$addon = $group.find('.picker').first();
            if (!this.$addon.length) {
                this.$addon = $group.find('.input-group-addon').first();
            }
            this.addonDisabled = this.$addon.is(':disabled') && this.canEdit();
            this.bindValue();
            this.$widget = this.template === false ? false : this.createWidget($group);

            this.$element.on('click' + this.namespace, this.highlightUnit.bind(this));
            this.$element.on('keydown' + this.namespace, this.elementKeydown.bind(this));
            this.$element.on('blur' + this.namespace, this.blurElement.bind(this));
            $.each(this.events, function (event, handler) {
                // jQuery splits event names only on HTML whitespace.
                self.$element.on(event.replace(/\S+/g, '$&' + self.namespace).replace(/\s/g, ' '), handler);
            });

            if (this.$widget) {
                if (this.$addon.length) {
                    this.$addon.attr({
                        'aria-controls': this.popupId,
                        'aria-haspopup': 'dialog',
                        'aria-expanded': 'false'
                    });
                    this.$addon.on('click' + this.namespace, function () {
                        self.showWidget(true);
                    });
                    if (!this.$addon.is('button')) {
                        this.$addon.attr({ role: 'button', tabindex: 0 });
                        this.$addon.on('keydown' + this.namespace, function (event) {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                self.showWidget(true);
                            }
                        });
                    } else {
                        this.originalButtonDisabled = this.$addon.prop('disabled');
                        // The widget disables the opener of a disabled or readonly input; any other is explicit.
                        this.addonDisabled = this.addonDisabled || (this.originalButtonDisabled &&
                            !this.element.disabled && !this.element.readOnly);
                    }
                } else {
                    this.$element.attr('data-timepicker-popup-id', this.popupId).on('click' + this.namespace, function () {
                        self.showWidget();
                    });
                }
                this.$widget.on('input' + this.namespace, 'input', function () {
                    self.widgetEdited = true;
                });
                this.$widget.on('click' + this.namespace, '[data-action]', this.widgetClick.bind(this));
                this.$widget.on('keydown' + this.namespace, this.widgetKeydown.bind(this));
                if (this.template === 'modal') {
                    this.$widget.on('cancel' + this.namespace, function (event) {
                        event.preventDefault();
                        self.hideWidget(true);
                    });
                    this.$widget.on('close' + this.namespace, function () {
                        if (!self.$widget[0].open) {
                            self.hideWidget();
                        }
                    });
                }
            }

            this.setDefaultTime(this.defaultTime);
            this.initialValue = this.value;
            this.syncControls();
            track(this);
        },
        createWidget: function ($group) {
            var $target = this.$element.parents(this.appendWidgetTo).first();
            if (!$target.length) {
                $target = $group;
            }
            var anchor = this.companion || this.element;
            // Cached or cloned markup can include a popup without its owning instance.
            var oldId = this.$addon.attr('aria-controls') || this.$element.attr('data-timepicker-popup-id');
            if (oldId) {
                var $previousPopups = $target.length ? $target.children('[data-timepicker-popup]') :
                    $(anchor).next('[data-timepicker-popup]');
                $previousPopups.filter(function () {
                    var popup = this;
                    return popup.id === oldId && !Array.from(instances).some(function (instance) {
                        return instance.$widget && instance.$widget[0] === popup;
                    });
                }).remove();
            }
            var $widget = this.getTemplate();
            if ($target.length) {
                return $widget.appendTo($target);
            }
            return $widget.insertAfter(anchor);
        },
        bindValue: function () {
            var input = this.element;
            var companion = input.nextElementSibling;
            if (!companion || !companion.hasAttribute('data-timepicker-value')) {
                companion = null;
                if (input.name) {
                    companion = document.createElement('input');
                    companion.type = 'hidden';
                    companion.name = input.name;
                    companion.toggleAttribute('data-timepicker-value');
                    input.after(companion);
                }
            }
            this.companion = companion;
            if (companion) {
                input.removeAttribute('name');
                this.syncCompanion();
            }
            this.attributes = new MutationObserver(this.syncControls.bind(this));
            this.attributes.observe(input, { attributes: true, attributeFilter: ['disabled', 'readonly', 'form'] });

            var self = this;
            this.$element.on('input' + this.namespace, function () {
                self.writeSubmission(self.readValue());
            });
            this.captureChange = function (event) {
                if (event !== self.changeEvent) {
                    self.commit(self.readValue(), false, event);
                }
            };
            input.addEventListener('change', this.captureChange, true);
        },
        canEdit: function () {
            return !this.element.readOnly && !this.element.matches(':disabled');
        },
        syncControls: function () {
            if (this.companion) {
                this.syncCompanion();
            }
            if (this.$widget && this.$addon.length) {
                var editable = this.canEdit() && !this.addonDisabled;
                var disabled = !editable;
                if (this.$addon.is('button')) {
                    // A disabled ancestor fieldset disables the button natively and cannot be observed on the input.
                    disabled = this.addonDisabled || this.element.disabled || this.element.readOnly;
                    this.$addon.prop('disabled', disabled);
                }
                this.$addon.attr('aria-disabled', String(disabled));
                if (!editable) {
                    this.hideWidget();
                }
            }
        },
        syncCompanion: function () {
            var formId = this.element.getAttribute('form');
            this.companion.disabled = this.element.disabled;
            if (formId === null) {
                this.companion.removeAttribute('form');
            } else {
                this.companion.setAttribute('form', formId);
            }
        },
        unbindValue: function () {
            this.element.removeEventListener('change', this.captureChange, true);
            window.clearTimeout(this.resetTimer);
            this.attributes.disconnect();
            if (this.companion) {
                this.element.name = this.companion.name;
                this.element.value = this.companion.value;
                this.companion.remove();
            }
        },
        readValue: function () {
            return parseTime(this.element.value, this.hiddenSecond());
        },
        hiddenSecond: function () {
            return !this.showSeconds && typeof this.value === 'number' ? this.value % 60 : 0;
        },
        writeSubmission: function (value) {
            if (this.companion) {
                this.syncCompanion();
                this.companion.value = canonicalValue(value);
            }
        },
        blurElement: function () {
            this.highlightedUnit = undefined;
            this.updateFromElementVal();
        },
        clear: function () {
            this.commit('');
        },
        decrementHour: function () {
            this.step(-3600);
        },
        decrementMinute: function (step) {
            this.step(-(step || this.minuteStep) * 60);
        },
        decrementSecond: function () {
            this.step(-this.secondStep);
        },
        elementKeydown: function (event) {
            var key = event.key;
            if (key === 'Escape') {
                this.hideWidget(true);
                return;
            }
            if (!this.canEdit() || event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }
            if ((key === 'F4' || (key === 'ArrowDown' && event.shiftKey)) && this.$widget) {
                event.preventDefault();
                this.showWidget(true);
                return;
            }
            var units = this.units();
            var index = units.indexOf(this.highlightedUnit);
            if (key === 'Tab') {
                var next = index + (event.shiftKey ? -1 : 1);
                if (index >= 0 && next >= 0 && next < units.length) {
                    event.preventDefault();
                    this.updateFromElementVal();
                    this.highlight(units[next]);
                }
            } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
                event.preventDefault();
                var direction = key === 'ArrowLeft' ? -1 : 1;
                this.highlight(units[index < 0 ? 0 : (index + direction + units.length) % units.length]);
            } else if (key === 'ArrowUp' || key === 'ArrowDown') {
                event.preventDefault();
                var unit = units[Math.max(0, index)];
                this.adjust(unit, key === 'ArrowUp' ? 'increment' : 'decrement');
                this.highlight(unit);
            }
        },
        units: function () {
            var units = ['hour', 'minute'];
            if (this.showSeconds) {
                units.push('second');
            }
            if (this.showMeridian) {
                units.push('meridian');
            }
            return units;
        },
        adjust: function (unit, direction) {
            this[actionName(unit, direction)]();
        },
        getTemplate: function () {
            var modal = this.template === 'modal';
            var $widget = $(modal ? '<dialog>' : '<div>').attr({
                id: this.popupId,
                role: 'dialog',
                'aria-label': this.labels.title,
                'data-timepicker-popup': ''
            }).addClass('bootstrap-timepicker-widget');
            if (modal) {
                $widget.toggleClass('timepicker-backdrop', Boolean(this.modalBackdrop));
                $('<div>').addClass('timepicker-title').text(this.labels.title).appendTo($widget);
            } else {
                $widget.addClass('dropdown-menu').prop('hidden', true);
            }

            var self = this;
            var $table = $('<table>').appendTo($widget);
            var $up = $('<tr>').appendTo($table);
            var $values = $('<tr>').appendTo($table);
            var $down = $('<tr>').appendTo($table);

            this.units().forEach(function (unit, index) {
                if (index) {
                    $('<td>').addClass('separator').appendTo($up);
                    $('<td>').addClass('separator').text(unit === 'meridian' ? ' ' : ':').appendTo($values);
                    $('<td>').addClass('separator').appendTo($down);
                }
                function arrow($row, direction, icon) {
                    var action = actionName(unit, direction);
                    var $button = $('<button>').attr({
                        type: 'button',
                        'data-action': action,
                        'aria-label': self.labels[action]
                    }).appendTo($('<td>').appendTo($row));
                    $('<i>').addClass(icon).attr('aria-hidden', 'true').appendTo($button);
                }
                arrow($up, 'increment', self.upArrowStyle);
                arrow($down, 'decrement', self.downArrowStyle);

                var $part = $(self.showInputs ? '<input>' : '<span>').addClass('bootstrap-timepicker-' + unit);
                if (self.showInputs) {
                    $part.addClass('form-control').attr({
                        type: 'text',
                        maxlength: 2,
                        'data-unit': unit,
                        'aria-label': self.labels[unit]
                    });
                }
                $('<td>').append($part).appendTo($values);
            });

            if (modal) {
                $('<button>').attr({ type: 'button', 'data-action': 'close' }).text(this.labels.close).appendTo($widget);
            }
            return $widget;
        },
        getTime: function () {
            return typeof this.value === 'number'
                ? pad(this.hour) + ':' + pad(this.minute) + (this.showSeconds ? ':' + pad(this.second) : '') +
                    (this.showMeridian ? ' ' + this.meridian : '')
                : this.value;
        },
        hideWidget: function (restoreFocus) {
            if (!this.isOpen) {
                return;
            }

            this.isOpen = false;
            $(document).off(this.namespace);
            this.$addon.attr('aria-expanded', 'false');
            if (this.template === 'modal') {
                this.$widget[0].close();
            } else {
                this.$widget.removeClass('open').prop('hidden', true);
            }
            if (this.widgetEdited) {
                this.commit(this.readEditedValue());
            }
            if (restoreFocus) {
                (this.$addon[0] || this.element).focus();
            }
            this.$element.trigger({ type: 'hide.timepicker', time: this.timeDetails() });
        },
        highlightUnit: function () {
            if (this.element.selectionStart === this.element.selectionEnd) {
                var units = this.units();
                var index = Math.min(Math.floor((this.element.selectionStart || 0) / 3), units.length - 1);
                this.highlight(units[index]);
            }
        },
        highlight: function (unit) {
            this.highlightedUnit = unit;
            if (this.element.selectionStart !== null) {
                var start = this.units().indexOf(unit) * 3;
                this.element.setSelectionRange(start, start + 2);
            }
        },
        step: function (seconds) {
            if (!Number.isInteger(seconds)) {
                return;
            }
            this.commit(((this.editedSeconds() + seconds) % secondsPerDay + secondsPerDay) % secondsPerDay);
        },
        editedSeconds: function () {
            var value = this.readEditedValue();
            return typeof value === 'number' ? value : 0;
        },
        incrementHour: function () {
            this.step(3600);
        },
        incrementMinute: function (step) {
            var minute = Math.floor(this.editedSeconds() / 60) % 60;
            this.step((step || this.minuteStep - minute % this.minuteStep) * 60);
        },
        incrementSecond: function () {
            var second = this.editedSeconds() % 60;
            this.step(this.secondStep - second % this.secondStep);
        },
        destroy: function () {
            if (this.destroyed) {
                return;
            }
            this.destroyed = true;
            untrack(this);
            $(document).off(this.namespace);
            this.$addon.off(this.namespace).removeAttr('aria-controls aria-haspopup aria-expanded aria-disabled');
            // jQuery leaves the property unchanged if no button state was captured.
            this.$addon.prop('disabled', this.originalButtonDisabled);
            if (this.$widget) {
                this.$widget.remove();
            }
            this.isOpen = false;
            this.$element.off(this.namespace).removeData('timepicker').removeAttr('data-timepicker-popup-id');
            this.unbindValue();
        },
        remove: function () {
            this.destroy();
        },
        setDefaultTime: function (defaultTime) {
            var value = parseTime(this.element.value, 0);
            if (value === '' && defaultTime === 'current') {
                var now = new Date();
                value = now.getHours() * 3600 +
                    Math.floor(now.getMinutes() / this.minuteStep) * this.minuteStep * 60 +
                    Math.floor(now.getSeconds() / this.secondStep) * this.secondStep;
            } else if (value === '') {
                value = parseTime(defaultTime, 0);
            } else if (this.companion && typeof value === 'number') {
                // A cloned row may carry hidden seconds alongside its formatted input.
                var submitted = parseTime(this.companion.value, 0);
                if (!this.showSeconds && typeof submitted === 'number' && this.element.value.split(':').length < 3 &&
                    Math.floor(value / 60) === Math.floor(submitted / 60)) {
                    value = submitted;
                }
            }
            this.commit(value === undefined ? '' : value, true);
        },
        setTime: function (time) {
            var value = parseTime(time, 0);
            if (value !== undefined) {
                this.commit(value);
            }
        },
        showWidget: function (focusPopup) {
            if (this.destroyed || this.isOpen || !this.$widget || !this.canEdit()) {
                return;
            }
            this.updateFromElementVal();
            if (this.destroyed) {
                return;
            }
            this.isOpen = true;
            this.$addon.attr('aria-expanded', 'true');

            if (this.template === 'modal') {
                this.$widget[0].showModal();
            } else {
                var self = this;
                var $inside = this.$widget.add(this.element).add(this.$addon);
                this.$widget.prop('hidden', false).addClass('open');
                $(document).on('mousedown' + this.namespace, function (event) {
                    if (!$(event.target).closest($inside).length) {
                        self.hideWidget();
                    }
                });
                if (focusPopup) {
                    this.$widget.find('input, button').first().trigger('focus');
                } else if (this.disableFocus) {
                    this.$element.trigger('blur');
                }
            }
            this.$element.trigger({ type: 'show.timepicker', time: this.timeDetails() });
        },
        toggleMeridian: function () {
            this.step(12 * 3600);
        },
        timeDetails: function () {
            return {
                value: this.getTime(),
                canonicalValue: canonicalValue(this.value),
                hours: this.hour,
                minutes: this.minute,
                seconds: this.second,
                meridian: this.meridian
            };
        },
        commit: function (value, silent, nativeChange) {
            var changed = this.value !== value;
            this.value = value;

            var hour = typeof value === 'number' ? Math.floor(value / 3600) : null;
            this.meridian = hour !== null && this.showMeridian ? (hour < 12 ? 'AM' : 'PM') : null;
            this.hour = this.meridian ? (hour % 12 || 12) : hour;
            this.minute = hour === null ? null : Math.floor(value / 60) % 60;
            this.second = hour === null ? null : value % 60;

            if (this.element.value !== this.getTime()) {
                this.element.value = this.getTime();
            }
            this.writeSubmission(value);
            this.updateWidget();

            if (silent || !changed) {
                if (nativeChange) {
                    nativeChange.stopImmediatePropagation();
                }
                return;
            }
            if (value === '' || typeof value === 'number') {
                this.$element.trigger({ type: 'changeTime.timepicker', time: this.timeDetails() });
            }
            if (nativeChange && this.value !== value) {
                // A changeTime listener committed a newer value and already published its own change.
                nativeChange.stopImmediatePropagation();
            } else if (!nativeChange && !this.destroyed && this.value === value) {
                var event = new Event('change', { bubbles: true });
                this.changeEvent = event;
                this.element.dispatchEvent(event);
                this.changeEvent = null;
            }
        },
        updateFromElementVal: function () {
            this.commit(this.readValue());
        },
        updateWidget: function () {
            if (this.$widget === false) {
                return;
            }

            this.widgetEdited = false;
            var values = {
                hour: this.hour,
                minute: this.minute,
                second: this.second,
                meridian: this.meridian
            };
            var self = this;
            Object.keys(values).forEach(function (unit) {
                var value = values[unit];
                var part = self.$widget.find('.bootstrap-timepicker-' + unit);
                var text = typeof value === 'number' ? pad(value) : (value || '');
                if (self.showInputs) {
                    part.val(text);
                } else {
                    part.text(text);
                }
            });
        },
        readEditedValue: function () {
            if (!this.widgetEdited) {
                return this.readValue();
            }
            var widget = this.$widget;
            function part(unit) {
                var text = widget.find('[data-unit="' + unit + '"]').val().trim();
                return /^\d$/.test(text) ? '0' + text : text;
            }
            var hour = part('hour');
            var minute = part('minute');
            var second = this.showSeconds ? part('second') : '';
            var meridian = this.showMeridian ? part('meridian') : '';
            var text = hour + ':' + minute + (this.showSeconds ? ':' + second : '') +
                (this.showMeridian ? ' ' + meridian : '');
            return hour || minute || second || meridian ? parseTime(text, this.hiddenSecond()) : '';
        },
        widgetClick: function (event) {
            event.preventDefault();
            var action = event.currentTarget.getAttribute('data-action');
            if (action === 'close') {
                this.hideWidget(true);
            } else if (this.canEdit()) {
                this[action]();
            }
        },
        widgetKeydown: function (event) {
            var unit = event.target.getAttribute('data-unit');
            if (event.key === 'Escape' || (event.key === 'Enter' && unit)) {
                event.preventDefault();
                this.hideWidget(true);
            } else if (unit && this.canEdit() && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                event.preventDefault();
                this.adjust(unit, event.key === 'ArrowUp' ? 'increment' : 'decrement');
                event.target.select();
            }
        }
    };

    var methods = new Set([
        'clear', 'decrementHour', 'decrementMinute', 'decrementSecond', 'destroy', 'getTime', 'hideWidget',
        'incrementHour', 'incrementMinute', 'incrementSecond', 'remove', 'setTime', 'showWidget', 'toggleMeridian'
    ]);

    $.fn.timepicker = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var $input = $(this);
            var instance = $input.data('timepicker');
            if (!instance) {
                if (option === 'destroy' || option === 'remove') {
                    return;
                }
                var options = typeof option === 'object' ? option : {};
                instance = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options, $input.data()));
                $input.data('timepicker', instance);
            }
            if (methods.has(option)) {
                instance[option].apply(instance, args);
            }
        });
    };

    $.fn.timepicker.yii2Extensions = true;

    function pjaxInputs(container) {
        return $(container).find('[data-timepicker-pjax]').filter(function () {
            return this.getAttribute('data-timepicker-pjax') === container.id;
        });
    }

    $(document).on('pjax:beforeReplace.yii2Timepicker', function (event) {
        pjaxInputs(event.target).timepicker('destroy');
    }).on('pjax:complete.yii2Timepicker pjax:end.yii2Timepicker', function (event) {
        pjaxInputs(event.target).each(function () {
            var options = window[this.getAttribute('data-krajee-timepicker')];
            if (options) {
                $(this).timepicker(options);
            }
        });
    });

    $.fn.timepicker.defaults = {
        defaultTime: false,
        disableFocus: false,
        minuteStep: 15,
        modalBackdrop: false,
        secondStep: 15,
        showSeconds: false,
        showInputs: true,
        showMeridian: true,
        template: 'dropdown',
        appendWidgetTo: '.bootstrap-timepicker',
        upArrowStyle: 'glyphicon glyphicon-chevron-up',
        downArrowStyle: 'glyphicon glyphicon-chevron-down',
        containerClass: 'bootstrap-timepicker',
        events: {},
        labels: {
            title: 'Choose a time',
            close: 'Done',
            hour: 'Hour',
            minute: 'Minute',
            second: 'Second',
            meridian: 'AM or PM',
            incrementHour: 'Increase hour',
            incrementMinute: 'Increase minute',
            incrementSecond: 'Increase second',
            decrementHour: 'Decrease hour',
            decrementMinute: 'Decrease minute',
            decrementSecond: 'Decrease second',
            toggleMeridian: 'Toggle AM or PM'
        }
    };

    $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);
