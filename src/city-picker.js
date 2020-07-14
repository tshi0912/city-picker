/*!
 * CityPicker v@VERSION
 * https://github.com/tshi0912/citypicker
 *
 * Copyright (c) 2015-@YEAR Tao Shi
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function (factory) {
        if (typeof define === "function" && define.amd) {
            // AMD. Register as anonymous module.
            define(["jquery", "ChineseDistricts"], factory);
        } else if (typeof exports === "object") {
            // Node / CommonJS
            factory(require("jquery"), require("ChineseDistricts"));
        } else {
            // Browser globals.
            factory(jQuery, ChineseDistricts);
        }
    }
)(function ($, ChineseDistricts) {

    'use strict';

    if (typeof ChineseDistricts === "undefined") {
        throw new Error('The file "city-picker.data.js" must be included first!');
    }
    const NAMESPACE = "citypicker";
    const EVENT_CHANGE = "change." + NAMESPACE;
    const PROVINCE = "province";
    const CITY = "city";
    const DISTRICT = "district";
    const TOWN = "town";
    const VILLAGE = "village";
    const COMMITTEE = "committee";

    function CityPicker(element, options) {
        this.$element = $(element);
        this.$dropdown = null;
        this.options = $.extend({}, CityPicker.DEFAULTS, $.isPlainObject(options) && options);
        this.active = false;
        this.dems = [];
        this.needBlur = false;
        this.init();
    }

    CityPicker.prototype = {
        constructor: CityPicker,
        init: function () {
            this.defineDems();
            this.render();
            this.bind();
            this.active = true;
            this.close(true);
        },
        render: function () {
            let p = this.getPosition(),
            placeholder = this.$element.attr("placeholder") || this.options.placeholder,
            textspan = `<span class="city-picker-span" style=" ${this.getWidthStyle(p.width)} height:${(p.height + 6)}px;line-height:${(p.height + 5)}px;"> ${placeholder ? '<span class="placeholder"> ${placeholder} </span>' : ""}  <span class="title"></span><div class="arrow"></div></span>`,
            dropdown = `<div class="city-picker-dropdown" style="left:0;top:100%; ${this.getWidthStyle(p.width, true)}">
                                <div class="city-select-wrap">
                                    <div class="city-select-tab">
                                        <a class="active" data-count="province">省份</a> 
                                        ${this.includeDem("city") ? '<a data-count="city">城市</a>' : ''}  
                                        ${this.includeDem("district") ? '<a data-count="district">区县</a>' : ''} 
                                        ${this.includeDem("town") ? '<a data-count="town">街道</a>' : '' } 
                                        ${this.includeDem("village") ? '<a data-count="village">居委</a>' : ''} 
                                        ${this.includeDem("committee") ? '<a data-count="committee">路</a>' : ''} 
                                    </div>
                                <div class="city-select-content">
                                    <div class="city-select province" data-count="province"></div>
                                    ${this.includeDem("city") ? '<div class="city-select city" data-count="city"></div>' : ''} 
                                    ${this.includeDem("district") ? '<div class="city-select district" data-count="district"></div>' : ''} 
                                    ${this.includeDem("town") ? '<div class="city-select town" data-count="town"></div>' : ''} 
                                    ${this.includeDem("village") ? '<div class="city-select village" data-count="village"></div>' : ''} 
                                    ${this.includeDem("committee") ? '<div class="city-select committee" data-count="committee"></div>' : ''} 
                                </div>
                             </div>`;
            this.$element.addClass("city-picker-input");
            this.$textspan = $(textspan).insertAfter(this.$element);
            this.$dropdown = $(dropdown).insertAfter(this.$textspan);
            const $select = this.$dropdown.find(".city-select");
            $.each(this.dems, $.proxy(function (i, type) {
                this["$" + type] = $select.filter("." + type + "");
            }, this));
            this.refresh();
        },
        refresh: function (force) {
            let $select = this.$dropdown.find(".city-select");
            $select.data("item", null);
            let val = this.$element.val() || "";
            val = val.split("/");
            $.each(this.dems, $.proxy(function (i, type) {
                if (val[i] && i < val.length) {
                    this.options[type] = val[i];
                } else {
                    if (force) {
                        this.options[type] = "";
                    }
                }
                this.output(type);
            }, this));
            this.tab(PROVINCE);
            this.feedText();
            this.feedVal();
        },
        defineDems: function () {
            let stop = false;
            $.each([PROVINCE, CITY, DISTRICT, TOWN, VILLAGE, COMMITTEE], $.proxy(function (i, type) {
                if (!stop) {
                    this.dems.push(type);
                }
                if (type === this.options.level) {
                    stop = true;
                }
            }, this));
        },
        includeDem: function (type) {
            return $.inArray(type, this.dems) !== -1;
        },
        getPosition: function () {
            let p, h, w, s, pw;
            p = this.$element.position();
            s = this.getSize(this.$element);
            h = s.height;
            w = s.width;
            if (this.options.responsive) {
                pw = this.$element.offsetParent().width();
                if (pw) {
                    w = w / pw;
                    if (w > 0.99) {
                        w = 1;
                    }
                    w = w * 100 + "%";
                }
            }
            return {top: p.top || 0, left: p.left || 0, height: h, width: w};
        },
        getSize: function ($dom) {
            let $wrap, $clone, sizes;
            if (!$dom.is(":visible")) {
                $wrap = $("<div />").appendTo($("body"));
                $wrap.css({
                    position: "absolute !important",
                    visibility: "hidden !important",
                    display: "block !important"
                });
                $clone = $dom.clone().appendTo($wrap);
                sizes = {width: $clone.outerWidth(), height: $clone.outerHeight()};
                $wrap.remove();
            } else {
                sizes = {width: $dom.outerWidth(), height: $dom.outerHeight()};
            }
            return sizes;
        },
        getWidthStyle: function (w, dropdown) {
            if (this.options.responsive && !$.isNumeric(w)) {
                return "width:" + w + ";";
            } else {
                return "width:" + (dropdown ? Math.max(320, w) : w) + "px;";
            }
        },
        bind: function () {
            let $this = this;
            $(document).on("click", (this._mouteclick = function (e) {
                let $target = $(e.target);
                let $dropdown, $span, $input;
                if ($target.is(".city-picker-span")) {
                    $span = $target;
                } else {
                    if ($target.is(".city-picker-span *")) {
                        $span = $target.parents(".city-picker-span");
                    }
                }
                if ($target.is(".city-picker-input")) {
                    $input = $target;
                }
                if ($target.is(".city-picker-dropdown")) {
                    $dropdown = $target;
                } else {
                    if ($target.is(".city-picker-dropdown *")) {
                        $dropdown = $target.parents(".city-picker-dropdown");
                    }
                }
                if ((!$input && !$span && !$dropdown) || ($span && $span.get(0) !== $this.$textspan.get(0)) || ($input && $input.get(0) !== $this.$element.get(0)) || ($dropdown && $dropdown.get(0) !== $this.$dropdown.get(0))) {
                    $this.close(true);
                }
            }));
            this.$element.on("change", (this._changeElement = $.proxy(function () {
                this.close(true);
                this.refresh(true);
            }, this))).on("focus", (this._focusElement = $.proxy(function () {
                this.needBlur = true;
                this.open();
            }, this))).on("blur", (this._blurElement = $.proxy(function () {
                if (this.needBlur) {
                    this.needBlur = false;
                    this.close(true);
                }
            }, this)));
            this.$textspan.on("click", function (e) {
                let $target = $(e.target), type;
                $this.needBlur = false;
                if ($target.is(".select-item")) {
                    type = $target.data("count");
                    $this.open(type);
                } else {
                    if ($this.$dropdown.is(":visible")) {
                        $this.close();
                    } else {
                        $this.open();
                    }
                }
            }).on("mousedown", function () {
                $this.needBlur = false;
            });
            this.$dropdown.on("click", ".city-select a", function () {
                let $select = $(this).parents(".city-select");
                let $active = $select.find("a.active");
                let last = $select.next().length === 0;
                $active.removeClass("active");
                $(this).addClass("active");
                if ($active.data("code") !== $(this).data("code")) {
                    $select.data("item", {address: $(this).attr("title"), code: $(this).data("code")});
                    $(this).trigger(EVENT_CHANGE);
                    $this.feedText();
                    $this.feedVal(true);
                    if (last) {
                        $this.close();
                    }
                }
            }).on("click", ".city-select-tab a", function () {
                if (!$(this).hasClass("active")) {
                    let type = $(this).data("count");
                    $this.tab(type);
                }
            }).on("mousedown", function () {
                $this.needBlur = false;
            });
            if (this.$province) {
                this.$province.on(EVENT_CHANGE, (this._changeProvince = $.proxy(function () {
                    this.output(CITY);
                    this.output(DISTRICT);
                    this.output(TOWN);
                    this.output(VILLAGE);
                    this.output(COMMITTEE);
                    this.tab(CITY);
                }, this)));
            }
            if (this.$city) {
                this.$city.on(EVENT_CHANGE, (this._changeCity = $.proxy(function () {
                    this.output(DISTRICT);
                    this.output(TOWN);
                    this.output(VILLAGE);
                    this.output(COMMITTEE);
                    this.tab(DISTRICT);
                }, this)));
            }
            if (this.$district) {
                this.$district.on(EVENT_CHANGE, (this._changeDistrict = $.proxy(function () {
                    this.output(TOWN);
                    this.output(VILLAGE);
                    this.output(COMMITTEE);
                    this.tab(TOWN);
                }, this)));
            }
            if (this.$town) {
                this.$town.on(EVENT_CHANGE, (this._changeTown = $.proxy(function () {
                    this.output(VILLAGE);
                    this.output(COMMITTEE);
                    this.tab(VILLAGE);
                }, this)));
            }
            if (this.$village) {
                this.$village.on(EVENT_CHANGE, (this._changeVillage = $.proxy(function () {
                    this.output(COMMITTEE);
                    this.tab(COMMITTEE);
                }, this)));
            }
            if (this.$committee) {
                this.$committee.on(EVENT_CHANGE, (this._changeCommittee = $.proxy(function () {
                }, this)));
            }
        },
        open: function (type) {
            type = type || PROVINCE;
            this.$dropdown.show();
            this.$textspan.addClass("open").addClass("focus");
            this.tab(type);
        },
        close: function (blur) {
            this.$dropdown.hide();
            this.$textspan.removeClass("open");
            if (blur) {
                this.$textspan.removeClass("focus");
            }
        },
        unbind: function () {
            $(document).off("click", this._mouteclick);
            this.$element.off("change", this._changeElement);
            this.$element.off("focus", this._focusElement);
            this.$element.off("blur", this._blurElement);
            this.$textspan.off("click");
            this.$textspan.off("mousedown");
            this.$dropdown.off("click");
            this.$dropdown.off("mousedown");
            if (this.$province) {
                this.$province.off(EVENT_CHANGE, this._changeProvince);
            }
            if (this.$city) {
                this.$city.off(EVENT_CHANGE, this._changeCity);
            }
            if (this.$district) {
                this.$district.off(EVENT_CHANGE, this._changeDistrict);
            }
            if (this.$town) {
                this.$town.off(EVENT_CHANGE, this._changeTown);
            }
            if (this.$village) {
                this.$village.off(EVENT_CHANGE, this._changeVillage);
            }
            if (this.$committee) {
                this.$committee.off(EVENT_CHANGE, this._changeCommittee);
            }
        },
        getText: function () {
            let text = "";
            this.$dropdown.find(".city-select").each(function () {
                let item = $(this).data("item"), type = $(this).data("count");
                if (item) {
                    text += ($(this).hasClass("province") ? "" : "/") + '<span class="select-item" data-count="' + type + '" data-code="' + item.code + '">' + item.address + "</span>";
                }
            });
            return text;
        },
        getPlaceHolder: function () {
            return this.$element.attr("placeholder") || this.options.placeholder;
        },
        feedText: function () {
            let text = this.getText();
            if (text) {
                this.$textspan.find(">.placeholder").hide();
                this.$textspan.find(">.title").html(this.getText()).show();
            } else {
                this.$textspan.find(">.placeholder").text(this.getPlaceHolder()).show();
                this.$textspan.find(">.title").html("").hide();
            }
        },
        getVal: function () {
            let text = "";
            this.$dropdown.find(".city-select").each(function () {
                let item = $(this).data("item");
                if (item) {
                    text += ($(this).hasClass("province") ? "" : "/") + item.address;
                }
            });
            return text;
        },
        feedVal: function (trigger) {
            this.$element.val(this.getVal());
            if (trigger) {
                this.$element.trigger("cp:updated");
            }
        },
        output: function (type) {
            let options = this.options;
            let $select = this["$" + type];
            let data = type === PROVINCE ? {} : [];
            let item;
            let districts;
            let code;
            let matched = null;
            let value;
            if (!$select || !$select.length) {
                return;
            }
            item = $select.data("item");
            value = (item ? item.address : null) || options[type];
            code = (type === PROVINCE ? 86 : type === CITY ? this.$province && this.$province.find(".active").data("code") : type === DISTRICT ? this.$city && this.$city.find(".active").data("code") : type === TOWN ? this.$district && this.$district.find(".active").data("code") : type === VILLAGE ? this.$town && this.$town.find(".active").data("code") : type === COMMITTEE ? this.$village && this.$village.find(".active").data("code") : code);
            districts = $.isNumeric(code) ? ChineseDistricts[code] : null;
            if ($.isPlainObject(districts)) {
                $.each(districts, function (code, address) {
                    let provs;
                    if (type === PROVINCE) {
                        provs = [];
                        for (let i = 0; i < address.length; i++) {
                            if (address[i].address === value) {
                                matched = {code: address[i].code, address: address[i].address};
                            }
                            provs.push({
                                code: address[i].code,
                                address: address[i].address,
                                selected: address[i].address === value
                            });
                        }
                        data[code] = provs;
                    } else {
                        if (address === value) {
                            matched = {code: code, address: address};
                        }
                        data.push({code: code, address: address, selected: address === value});
                    }
                });
            }
            $select.html(type === PROVINCE ? this.getProvinceList(data) : this.getList(data, type));
            $select.data("item", matched);
        },
        getProvinceList: function (data) {
            let list = [], $this = this, simple = this.options.simple;
            $.each(data, function (i, n) {
                list.push('<dl class="clearfix">');
                list.push("<dt>" + i + "</dt><dd>");
                $.each(n, function (j, m) {
                    list.push('<a title="' + (m.address || "") + '" data-code="' + (m.code || "") + '" class="' + (m.selected ? " active" : "") + '">' + (simple ? $this.simplize(m.address, PROVINCE) : m.address) + "</a>");
                });
                list.push("</dd></dl>");
            });
            return list.join("");
        },
        getList: function (data, type) {
            let list = [], $this = this, simple = this.options.simple;
            list.push('<dl class="clearfix"><dd>');
            $.each(data, function (i, n) {
                list.push('<a title="' + (n.address || "") + '" data-code="' + (n.code || "") + '" class="' + (n.selected ? " active" : "") + '">' + (simple ? $this.simplize(n.address, type) : n.address) + "</a>");
            });
            list.push("</dd></dl>");
            return list.join("");
        },
        simplize: function (address, type) {
            address = address || "";
            if (type === PROVINCE) {
                return address.replace(/[省,市,自治区,壮族,回族,维吾尔]/g, "");
            } else {
                if (type === CITY) {
                    return address.replace(/[市,地区,回族,蒙古,苗族,白族,傣族,景颇族,藏族,彝族,壮族,傈僳族,布依族,侗族]/g, "").replace("哈萨克", "").replace("自治州", "").replace(/自治县/, "");
                } else {
                    if (type === DISTRICT) {
                        return address.length > 2 ? address.replace(/[市,区,县,旗]/g, "") : address;
                    }
                }
            }
        },
        tab: function (type) {
            let $selects = this.$dropdown.find(".city-select");
            let $tabs = this.$dropdown.find(".city-select-tab > a");
            let $select = this["$" + type];
            let $tab = this.$dropdown.find('.city-select-tab > a[data-count="' + type + '"]');
            if ($select) {
                $selects.hide();
                $select.show();
                $tabs.removeClass("active");
                $tab.addClass("active");
            }
        },
        reset: function () {
            this.$element.val(null).trigger("change");
        },
        destroy: function () {
            this.unbind();
            this.$element.removeData(NAMESPACE).removeClass("city-picker-input");
            this.$textspan.remove();
            this.$dropdown.remove();
        },
        getAllVal: function () {
            const getCode = function (title, obj) {
                let mCode = obj.$element.next().find("span[data-count=" + title + "]").attr("data-code");
                return mCode === undefined ? "" : mCode;
            };
            const getText = function (title, obj) {
                let name = obj.$element.next().find("span[data-count=" + title + "]").html();
                return name === undefined ? "" : name;
            };
            return {
                province: {code: getCode("province", this), name: getText("province", this)},
                city: {code: getCode("city", this), name: getText("city", this)},
                district: {code: getCode("district", this), name: getText("district", this)},
                town: {code: getCode("town", this), name: getText("town", this)},
                village: {code: getCode("village", this), name: getText("village", this)},
                committee: {code: getCode("committee", this), name: getText("committee", this)}
            };
        }
    };
    CityPicker.DEFAULTS = {
        simple: false,
        responsive: true,
        placeholder: "请选择省/市/区/街道/居委",
        level: "village",
        province: "",
        city: "",
        district: "",
        town: "",
        village: "",
        committee: ""
    };
    CityPicker.setDefaults = function (options) {
        $.extend(CityPicker.DEFAULTS, options);
    };
    CityPicker.other = $.fn.citypicker;
    $.fn.citypicker = function (option) {
        let args = [].slice.call(arguments, 1);
        let value;
        this.each(function () {
            let $this = $(this);
            let data = $this.data(NAMESPACE);
            let options;
            let fn;
            if (!data) {
                if (/destroy/.test(option)) {
                    return;
                }
                options = $.extend({}, $this.data(), $.isPlainObject(option) && option);
                $this.data(NAMESPACE, (data = new CityPicker(this, options)));
            }
            if (typeof option === "string" && $.isFunction(fn = data[option])) {
                value = fn.apply(data, args);
            }
        });
        return value === undefined ? this : value;
    };
    $.fn.citypicker.Constructor = CityPicker;
    $.fn.citypicker.setDefaults = CityPicker.setDefaults;
    $.fn.citypicker.noConflict = function () {
        $.fn.citypicker = CityPicker.other;
        return this;
    };
    $(function () {
        $('[data-toggle="city-picker"]').citypicker();
    });
});