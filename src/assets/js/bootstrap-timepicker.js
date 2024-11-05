/*!
 * Timepicker Component for Twitter Bootstrap
 * 
 * Improvements by: 
 * - Kartik Visweswaran, Krajee.com, 2014 - 2021
 * - Stefano Mtangoo<mwinjilisti@gmail.com> and contributors, 2024 - 
 *
 * Copyright 2013 Joris de Wit
 *
 * Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function ($, window, document, undefined) {
    'use strict';

    // TIMEPICKER PUBLIC CLASS DEFINITION
    var Timepicker = function (element, options) {
        this.widget = '';
        this.$element = $(element);
        this.defaultTime = options.defaultTime;
        this.disableFocus = options.disableFocus;
        this.isOpen = options.isOpen;
        this.minuteStep = options.minuteStep;
        this.modalBackdrop = options.modalBackdrop;
        this.secondStep = options.secondStep;
        this.showInputs = options.showInputs;
        this.showMeridian = options.showMeridian;
        this.showSeconds = options.showSeconds;
        this.template = options.template;
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

            if (this.$element.parent().hasClass('bootstrap-timepicker')) {
                if (this.$element.parent('.bootstrap-timepicker').find('.picker').length) {
                    this.$element.parent('.bootstrap-timepicker').find('.picker').on({
                        'click.timepicker': $.proxy(this.showWidget, this)
                    });
                } else {
                    this.$element.closest(this.containerClass).find('.input-group-addon').on({
                        'click.timepicker': $.proxy(this.showWidget, this)
                    });
                }

                this.$element.on({
                    'focus.timepicker': $.proxy(this.highlightUnit, this),
                    'click.timepicker': $.proxy(this.highlightUnit, this),
                    'keydown.timepicker': $.proxy(this.elementKeydown, this),
                    'blur.timepicker': $.proxy(this.blurElement, this)
                });
            } else {
                if (this.template) {
                    this.$element.on({
                        'focus.timepicker': $.proxy(this.showWidget, this),
                        'click.timepicker': $.proxy(this.showWidget, this),
                        'blur.timepicker': $.proxy(this.blurElement, this)
                    });
                } else {
                    this.$element.on({
                        'focus.timepicker': $.proxy(this.highlightUnit, this),
                        'click.timepicker': $.proxy(this.highlightUnit, this),
                        'keydown.timepicker': $.proxy(this.elementKeydown, this),
                        'blur.timepicker': $.proxy(this.blurElement, this)
                    });
                }
            }

            if (this.template !== false) {
                this.$widget = $(this.getTemplate()).prependTo(this.$element.parents(this.appendWidgetTo)).on('click', $.proxy(this.widgetClick, this));
            } else {
                this.$widget = false;
            }

            if (this.showInputs && this.$widget !== false) {
                this.$widget.find('input').each(function () {
                    $(this).on({
                        'click.timepicker': function () {
                            $(this).select();
                        },
                        'keydown.timepicker': $.proxy(self.widgetKeydown, self)
                    });
                });
            }

            this.setDefaultTime(this.defaultTime);
        },
        blurElement: function () {
            this.highlightedUnit = undefined;
            this.updateFromElementVal();
        },
        clear: function () {
            this.hour = '';
            this.minute = '';
            this.second = '';
            this.meridian = '';

            this.$element.val('');
        },
        decrementHour: function () {
            if (this.showMeridian) {
                if (this.hour === 1) {
                    this.hour = 12;
                } else if (this.hour === 12) {
                    this.hour--;

                    return this.toggleMeridian();
                } else if (this.hour === 0) {
                    this.hour = 11;

                    return this.toggleMeridian();
                } else {
                    this.hour--;
                }
            } else {
                if (this.hour === 0) {
                    this.hour = 23;
                } else {
                    this.hour--;
                }
            }
            this.update();
        },
        decrementMinute: function (step) {
            var newVal;

            if (step) {
                newVal = this.minute - step;
            } else {
                newVal = this.minute - this.minuteStep;
            }

            if (newVal < 0) {
                this.decrementHour();
                this.minute = newVal + 60;
            } else {
                this.minute = newVal;
            }
            this.update();
        },
        decrementSecond: function () {
            var newVal = this.second - this.secondStep;

            if (newVal < 0) {
                this.decrementMinute(true);
                this.second = newVal + 60;
            } else {
                this.second = newVal;
            }
            this.update();
        },
        elementKeydown: function (e) {
            switch (e.keyCode) {
                case 9: //tab
                    this.updateFromElementVal();

                    switch (this.highlightedUnit) {
                        case 'hour':
                            e.preventDefault();
                            this.highlightNextUnit();
                            break;
                        case 'minute':
                            if (this.showMeridian || this.showSeconds) {
                                e.preventDefault();
                                this.highlightNextUnit();
                            }
                            break;
                        case 'second':
                            if (this.showMeridian) {
                                e.preventDefault();
                                this.highlightNextUnit();
                            }
                            break;
                    }
                    break;
                case 27: // escape
                    this.updateFromElementVal();
                    break;
                case 37: // left arrow
                    e.preventDefault();
                    this.highlightPrevUnit();
                    this.updateFromElementVal();
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    switch (this.highlightedUnit) {
                        case 'hour':
                            this.incrementHour();
                            this.highlightHour();
                            break;
                        case 'minute':
                            this.incrementMinute();
                            this.highlightMinute();
                            break;
                        case 'second':
                            this.incrementSecond();
                            this.highlightSecond();
                            break;
                        case 'meridian':
                            this.toggleMeridian();
                            this.highlightMeridian();
                            break;
                    }
                    break;
                case 39: // right arrow
                    e.preventDefault();
                    this.updateFromElementVal();
                    this.highlightNextUnit();
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    switch (this.highlightedUnit) {
                        case 'hour':
                            this.decrementHour();
                            this.highlightHour();
                            break;
                        case 'minute':
                            this.decrementMinute();
                            this.highlightMinute();
                            break;
                        case 'second':
                            this.decrementSecond();
                            this.highlightSecond();
                            break;
                        case 'meridian':
                            this.toggleMeridian();
                            this.highlightMeridian();
                            break;
                    }
                    break;
            }
        },
        formatTime: function (hour, minute, second, meridian) {
            hour = hour < 10 ? '0' + hour : hour;
            minute = minute < 10 ? '0' + minute : minute;
            second = second < 10 ? '0' + second : second;

            return hour + ':' + minute + (this.showSeconds ? ':' + second : '') + (this.showMeridian ? ' ' + meridian : '');
        },
        getCursorPosition: function () {
            var input = this.$element.get(0);

            if ('selectionStart' in input) {// Standard-compliant browsers

                return input.selectionStart;
            } else if (document.selection) {// IE fix
                input.focus();
                var sel = document.selection.createRange(),
                    selLen = document.selection.createRange().text.length;

                sel.moveStart('character', -input.value.length);

                return sel.text.length - selLen;
            }
        },
        getTemplate: function () {
            var template,
                hourTemplate,
                minuteTemplate,
                secondTemplate,
                meridianTemplate,
                templateContent;

            if (this.showInputs) {
                hourTemplate = '<input type="text" name="hour" class="bootstrap-timepicker-hour form-control" maxlength="2"/>';
                minuteTemplate = '<input type="text" name="minute" class="bootstrap-timepicker-minute form-control" maxlength="2"/>';
                secondTemplate = '<input type="text" name="second" class="bootstrap-timepicker-second form-control" maxlength="2"/>';
                meridianTemplate = '<input type="text" name="meridian" class="bootstrap-timepicker-meridian form-control" maxlength="2"/>';
            } else {
                hourTemplate = '<span class="bootstrap-timepicker-hour"></span>';
                minuteTemplate = '<span class="bootstrap-timepicker-minute"></span>';
                secondTemplate = '<span class="bootstrap-timepicker-second"></span>';
                meridianTemplate = '<span class="bootstrap-timepicker-meridian"></span>';
            }

            templateContent = '<table>' +
                '<tr>' +
                '<td><a href="#" data-action="incrementHour"><i class="' + this.upArrowStyle + '"></i></a></td>' +
                '<td class="separator">&nbsp;</td>' +
                '<td><a href="#" data-action="incrementMinute"><i class="' + this.upArrowStyle + '"></i></a></td>' +
                (this.showSeconds ?
                    '<td class="separator">&nbsp;</td>' +
                    '<td><a href="#" data-action="incrementSecond"><i class="' + this.upArrowStyle + '"></i></a></td>'
                    : '') +
                (this.showMeridian ?
                    '<td class="separator">&nbsp;</td>' +
                    '<td class="meridian-column"><a href="#" data-action="toggleMeridian"><i class="' + this.upArrowStyle + '"></i></a></td>'
                    : '') +
                '</tr>' +
                '<tr>' +
                '<td>' + hourTemplate + '</td> ' +
                '<td class="separator">:</td>' +
                '<td>' + minuteTemplate + '</td> ' +
                (this.showSeconds ?
                    '<td class="separator">:</td>' +
                    '<td>' + secondTemplate + '</td>'
                    : '') +
                (this.showMeridian ?
                    '<td class="separator">&nbsp;</td>' +
                    '<td>' + meridianTemplate + '</td>'
                    : '') +
                '</tr>' +
                '<tr>' +
                '<td><a href="#" data-action="decrementHour"><i class="' + this.downArrowStyle + '"></i></a></td>' +
                '<td class="separator"></td>' +
                '<td><a href="#" data-action="decrementMinute"><i class="' + this.downArrowStyle + '"></i></a></td>' +
                (this.showSeconds ?
                    '<td class="separator">&nbsp;</td>' +
                    '<td><a href="#" data-action="decrementSecond"><i class="' + this.downArrowStyle + '"></i></a></td>'
                    : '') +
                (this.showMeridian ?
                    '<td class="separator">&nbsp;</td>' +
                    '<td><a href="#" data-action="toggleMeridian"><i class="' + this.downArrowStyle + '"></i></a></td>'
                    : '') +
                '</tr>' +
                '</table>';

            switch (this.template) {
                case 'modal':
                    template = '<div class="bootstrap-timepicker-widget modal hide fade in" data-backdrop="' + (this.modalBackdrop ? 'true' : 'false') + '">' +
                        '<div class="modal-header">' +
                        '<a href="#" class="close" data-dismiss="modal">×</a>' +
                        '<h3>Pick a Time</h3>' +
                        '</div>' +
                        '<div class="modal-content">' +
                        templateContent +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<a href="#" class="btn btn-primary" data-dismiss="modal">OK</a>' +
                        '</div>' +
                        '</div>';
                    break;
                case 'dropdown':
                    template = '<div class="bootstrap-timepicker-widget dropdown-menu">' + templateContent + '</div>';
                    break;
            }

            return template;
        },
        getTime: function () {
            return this.formatTime(this.hour, this.minute, this.second, this.meridian);
        },
        hideWidget: function () {
            if (this.isOpen === false) {
                return;
            }

            if (this.showInputs) {
                this.updateFromWidgetInputs();
            }

            this.$element.trigger({
                'type': 'hide.timepicker',
                'time': {
                    'value': this.getTime(),
                    'hours': this.hour,
                    'minutes': this.minute,
                    'seconds': this.second,
                    'meridian': this.meridian
                }
            });

            if (this.template === 'modal' && this.$widget.modal) {
                this.$widget.modal('hide');
            } else {
                this.$widget.removeClass('open');
            }

            $(document).off('mousedown.timepicker');

            this.isOpen = false;
        },
        highlightUnit: function () {
            this.position = this.getCursorPosition();
            if (this.position >= 0 && this.position <= 2) {
                this.highlightHour();
            } else if (this.position >= 3 && this.position <= 5) {
                this.highlightMinute();
            } else if (this.position >= 6 && this.position <= 8) {
                if (this.showSeconds) {
                    this.highlightSecond();
                } else {
                    this.highlightMeridian();
                }
            } else if (this.position >= 9 && this.position <= 11) {
                this.highlightMeridian();
            }
        },
        highlightNextUnit: function () {
            switch (this.highlightedUnit) {
                case 'hour':
                    this.highlightMinute();
                    break;
                case 'minute':
                    if (this.showSeconds) {
                        this.highlightSecond();
                    } else if (this.showMeridian) {
                        this.highlightMeridian();
                    } else {
                        this.highlightHour();
                    }
                    break;
                case 'second':
                    if (this.showMeridian) {
                        this.highlightMeridian();
                    } else {
                        this.highlightHour();
                    }
                    break;
                case 'meridian':
                    this.highlightHour();
                    break;
            }
        },
        highlightPrevUnit: function () {
            switch (this.highlightedUnit) {
                case 'hour':
                    this.highlightMeridian();
                    break;
                case 'minute':
                    this.highlightHour();
                    break;
                case 'second':
                    this.highlightMinute();
                    break;
                case 'meridian':
                    if (this.showSeconds) {
                        this.highlightSecond();
                    } else {
                        this.highlightMinute();
                    }
                    break;
            }
        },
        highlightHour: function () {
            var $element = this.$element.get(0);

            this.highlightedUnit = 'hour';

            if ($element.setSelectionRange) {
                setTimeout(function () {
                    $element.setSelectionRange(0, 2);
                }, 0);
            }
        },
        highlightMinute: function () {
            var $element = this.$element.get(0);

            this.highlightedUnit = 'minute';

            if ($element.setSelectionRange) {
                setTimeout(function () {
                    $element.setSelectionRange(3, 5);
                }, 0);
            }
        },
        highlightSecond: function () {
            var $element = this.$element.get(0);

            this.highlightedUnit = 'second';

            if ($element.setSelectionRange) {
                setTimeout(function () {
                    $element.setSelectionRange(6, 8);
                }, 0);
            }
        },
        highlightMeridian: function () {
            var $element = this.$element.get(0);

            this.highlightedUnit = 'meridian';

            if ($element.setSelectionRange) {
                if (this.showSeconds) {
                    setTimeout(function () {
                        $element.setSelectionRange(9, 11);
                    }, 0);
                } else {
                    setTimeout(function () {
                        $element.setSelectionRange(6, 8);
                    }, 0);
                }
            }
        },
        incrementHour: function () {
            if (this.showMeridian) {
                if (this.hour === 11) {
                    this.hour++;
                    return this.toggleMeridian();
                } else if (this.hour === 12) {
                    this.hour = 0;
                }
            }
            if (this.hour === 23) {
                this.hour = 0;

                return;
            }
            this.hour++;
            this.update();
        },
        incrementMinute: function (step) {
            var newVal;

            if (step) {
                newVal = this.minute + step;
            } else {
                newVal = this.minute + this.minuteStep - (this.minute % this.minuteStep);
            }

            if (newVal > 59) {
                this.incrementHour();
                this.minute = newVal - 60;
            } else {
                this.minute = newVal;
            }
            this.update();
        },
        incrementSecond: function () {
            var newVal = this.second + this.secondStep - (this.second % this.secondStep);

            if (newVal > 59) {
                this.incrementMinute(true);
                this.second = newVal - 60;
            } else {
                this.second = newVal;
            }
            this.update();
        },
        remove: function () {
            $('document').off('.timepicker');
            if (this.$widget) {
                this.$widget.remove();
            }
            delete this.$element.data().timepicker;
        },
        setDefaultTime: function (defaultTime) {
            if (!this.$element.val()) {
                if (defaultTime === 'current') {
                    var dTime = new Date(),
                        hours = dTime.getHours(),
                        minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
                        seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
                        meridian = 'AM';

                    if (this.showMeridian) {
                        if (hours === 0) {
                            hours = 12;
                        } else if (hours >= 12) {
                            if (hours > 12) {
                                hours = hours - 12;
                            }
                            meridian = 'PM';
                        } else {
                            meridian = 'AM';
                        }
                    }

                    this.hour = hours;
                    this.minute = minutes;
                    this.second = seconds;
                    this.meridian = meridian;

                    this.update(true);

                } else if (defaultTime === false) {
                    this.hour = 0;
                    this.minute = 0;
                    this.second = 0;
                    this.meridian = 'AM';
                } else {
                    this.setTime(defaultTime);
                }
            } else {
                this.updateFromElementVal();
            }
        },
        setTime: function (time, ignoreWidget) {
            if (!time) {
                this.clear();
                return;
            }

            var timeMode,
                timeArray,
                hour,
                minute,
                second,
                meridian;

            if (typeof time === 'object' && time.getMonth) {
                // this is a date object
                hour = time.getHours();
                minute = time.getMinutes();
                second = time.getSeconds();

                if (this.showMeridian) {
                    meridian = 'AM';
                    if (hour > 12) {
                        meridian = 'PM';
                        hour = hour % 12;
                    }

                    if (hour === 12) {
                        meridian = 'PM';
                    }
                }
            } else {
                timeMode = ((/a/i).test(time) ? 1 : 0) + ((/p/i).test(time) ? 2 : 0); // 0 = none, 1 = AM, 2 = PM, 3 = BOTH.
                if (timeMode > 2) { // If both are present, fail.
                    this.clear();
                    return;
                }

                timeArray = time.replace(/[^0-9\:]/g, '').split(':');

                hour = timeArray[0] ? timeArray[0].toString() : timeArray.toString();

                if (this.explicitMode && hour.length > 2 && (hour.length % 2) !== 0) {
                    this.clear();
                    return;
                }

                minute = timeArray[1] ? timeArray[1].toString() : '';
                second = timeArray[2] ? timeArray[2].toString() : '';

                // adaptive time parsing
                if (hour.length > 4) {
                    second = hour.slice(-2);
                    hour = hour.slice(0, -2);
                }

                if (hour.length > 2) {
                    minute = hour.slice(-2);
                    hour = hour.slice(0, -2);
                }

                if (minute.length > 2) {
                    second = minute.slice(-2);
                    minute = minute.slice(0, -2);
                }

                hour = parseInt(hour, 10);
                minute = parseInt(minute, 10);
                second = parseInt(second, 10);

                if (isNaN(hour)) {
                    hour = 0;
                }
                if (isNaN(minute)) {
                    minute = 0;
                }
                if (isNaN(second)) {
                    second = 0;
                }

                // Adjust the time based upon unit boundary.
                // NOTE: Negatives will never occur due to time.replace() above.
                if (second > 59) {
                    second = 59;
                }

                if (minute > 59) {
                    minute = 59;
                }

                if (hour >= this.maxHours) {
                    // No day/date handling.
                    hour = this.maxHours - 1;
                }

                if (this.showMeridian) {
                    if (hour > 12) {
                        // Force PM.
                        timeMode = 2;
                        hour -= 12;
                    }
                    if (!timeMode) {
                        timeMode = 1;
                    }
                    if (hour === 0) {
                        hour = 12; // AM or PM, reset to 12.  0 AM = 12 AM.  0 PM = 12 PM, etc.
                    }
                    meridian = timeMode === 1 ? 'AM' : 'PM';
                } else if (hour < 12 && timeMode === 2) {
                    hour += 12;
                } else {
                    if (hour >= this.maxHours) {
                        hour = this.maxHours - 1;
                    } else if ((hour < 0) || (hour === 12 && timeMode === 1)) {
                        hour = 0;
                    }
                }
            }

            this.hour = hour;
            if (this.snapToStep) {
                this.minute = this.changeToNearestStep(minute, this.minuteStep);
                this.second = this.changeToNearestStep(second, this.secondStep);
            } else {
                this.minute = minute;
                this.second = second;
            }
            this.meridian = meridian;

            this.update(ignoreWidget);
        },

        showWidget: function () {
            if (this.isOpen) {
                return;
            }

            if (this.$element.is(':disabled')) {
                return;
            }

            var self = this;
            $(document).on('mousedown.timepicker', function (e) {
                // Clicked outside the timepicker, hide it
                if ($(e.target).closest('.bootstrap-timepicker-widget').length === 0) {
                    self.hideWidget();
                }
            });

            this.$element.trigger({
                'type': 'show.timepicker',
                'time': {
                    'value': this.getTime(),
                    'hours': this.hour,
                    'minutes': this.minute,
                    'seconds': this.second,
                    'meridian': this.meridian
                }
            });

            if (this.disableFocus) {
                this.$element.blur();
            }

            this.updateFromElementVal();

            if (this.template === 'modal' && this.$widget.modal) {
                this.$widget.modal('show').on('hidden', $.proxy(this.hideWidget, this));
            } else {
                if (this.isOpen === false) {
                    this.$widget.addClass('open');
                }
            }

            this.isOpen = true;
        },
        toggleMeridian: function () {
            this.meridian = this.meridian === 'AM' ? 'PM' : 'AM';
            this.update();
        },
        update: function (skipChange) {
            this.$element.trigger({
                'type': 'changeTime.timepicker',
                'time': {
                    'value': this.getTime(),
                    'hours': this.hour,
                    'minutes': this.minute,
                    'seconds': this.second,
                    'meridian': this.meridian
                }
            });

            this.updateElement(skipChange);
            this.updateWidget();
        },
        updateElement: function (skipChange) {
            var $el = this.$element;
            $el.val(this.getTime());
            if (!skipChange) {
                $el.change();
            }
        },
        updateFromElementVal: function () {
            var val = this.$element.val();

            if (val) {
                this.setTime(val);
            }
        },
        updateWidget: function () {
            if (this.$widget === false) {
                return;
            }

            var hour = this.hour < 10 ? '0' + this.hour : this.hour,
                minute = this.minute < 10 ? '0' + this.minute : this.minute,
                second = this.second < 10 ? '0' + this.second : this.second;

            if (this.showInputs) {
                this.$widget.find('input.bootstrap-timepicker-hour').val(hour);
                this.$widget.find('input.bootstrap-timepicker-minute').val(minute);

                if (this.showSeconds) {
                    this.$widget.find('input.bootstrap-timepicker-second').val(second);
                }
                if (this.showMeridian) {
                    this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
                }
            } else {
                this.$widget.find('span.bootstrap-timepicker-hour').text(hour);
                this.$widget.find('span.bootstrap-timepicker-minute').text(minute);

                if (this.showSeconds) {
                    this.$widget.find('span.bootstrap-timepicker-second').text(second);
                }
                if (this.showMeridian) {
                    this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
                }
            }
        },
        updateFromWidgetInputs: function () {
            if (this.$widget === false) {
                return;
            }
            var time = $('input.bootstrap-timepicker-hour', this.$widget).val() + ':' +
                $('input.bootstrap-timepicker-minute', this.$widget).val() +
                (this.showSeconds ? ':' + $('input.bootstrap-timepicker-second', this.$widget).val() : '') +
                (this.showMeridian ? ' ' + $('input.bootstrap-timepicker-meridian', this.$widget).val() : '');

            this.setTime(time);
        },
        widgetClick: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var action = $(e.target).closest('a').data('action');
            if (action) {
                this[action]();
            }
        },
        widgetKeydown: function (e) {
            var $input = $(e.target).closest('input'),
                name = $input.attr('name');

            switch (e.keyCode) {
                case 9: //tab
                    if (this.showMeridian) {
                        if (name === 'meridian') {
                            return this.hideWidget();
                        }
                    } else {
                        if (this.showSeconds) {
                            if (name === 'second') {
                                return this.hideWidget();
                            }
                        } else {
                            if (name === 'minute') {
                                return this.hideWidget();
                            }
                        }
                    }

                    this.updateFromWidgetInputs();
                    break;
                case 27: // escape
                    this.hideWidget();
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    switch (name) {
                        case 'hour':
                            this.incrementHour();
                            break;
                        case 'minute':
                            this.incrementMinute();
                            break;
                        case 'second':
                            this.incrementSecond();
                            break;
                        case 'meridian':
                            this.toggleMeridian();
                            break;
                    }
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    switch (name) {
                        case 'hour':
                            this.decrementHour();
                            break;
                        case 'minute':
                            this.decrementMinute();
                            break;
                        case 'second':
                            this.decrementSecond();
                            break;
                        case 'meridian':
                            this.toggleMeridian();
                            break;
                    }
                    break;
            }
        }
    };


    //TIMEPICKER PLUGIN DEFINITION
    $.fn.timepicker = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        return this.each(function () {
            var $this = $(this),
                data = $this.data('timepicker'),
                options = typeof option === 'object' && option;

            if (!data) {
                $this.data('timepicker', (data = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options, $(this).data()))));
            }

            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.timepicker.defaults = {
        defaultTime: 'current',
        disableFocus: false,
        isOpen: false,
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
        containerClass: 'bootstrap-timepicker'
    };

    $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);
