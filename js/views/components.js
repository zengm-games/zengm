/**
 * @name views.components
 * @namespace Small components/widgets, such as drop down menus to switch between seasons/teams.
 */
define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "lib/knockout", "util/helpers"], function (g, ui, Handlebars, $, ko, helpers) {
    "use strict";

    /**
     * Creates or updates a dropdown form.
     *
     * This should be called every time the page with the dropdown is loaded/updated so the dropdown can be appropriately managed.
     *
     * @memberOf  views.components
     * @param {string} formId DOM ID of the form element to fill. If this is the same as the value the previous time this was called, then an update will occur.
     * @param {Array.<string>} fields Array of strings of the type of fields to allow (current acceptable values are "teams" and "seasons"). Each element represents a dropdown and a component of the URL - so if "teams" and "seasons" is passed, URLs will be generated like /l/1/.../ATL/2014.
     * @param {Array} selected Array of values corresponding to the default "selected" value of each field, like "CHI" or 2022 for "teams" or "seasons".
     * @param {Array.<string>} updateEvents Update events describing what has changed in this reload.
     * @param {?string=} extraParam Any extra parameter to append to the URL, like /l/1/.../ATL/2014/extraParam. Default is to append nothing.
     */
    function dropdown(formId, fields, selected, updateEvents, vm, extraParam) {
        var content, currentSelected, fieldId, formEl, i, j, leagueContentEl, newOption, newSelect, options, selectEl;

        formEl = document.getElementById(formId);
        /*if (!formEl) {
            leagueContentEl = document.getElementById("league_content");
            leagueContentEl.innerHTML = '<form id="' + formId + '" class="form-inline pull-right"></form>' + leagueContentEl.innerHTML;
            formEl = document.getElementById(formId);
        }*/

        if (formEl.dataset.idLoaded !== formId || vm.dropdown === undefined) {
            // Build initial values
            vm.dropdown = {
                formId: ko.observable(),
                fields: ko.observable([])
            };
            vm.dropdown.formId(formId);
            vm.dropdown.fields([]);
            for (i = 0; i < fields.length; i++) {
                fieldId = formId + "-" + fields[i];
                if (fields[i] === "teams") {
                    options = helpers.getTeams(selected[i]);
                    for (j = 0; j < options.length; j++) {
                        options[j].key = options[j].abbrev;
                        options[j].val = options[j].region + " " + options[j].name;
                    }
                } else if (fields[i] === "seasons") {
                    options = helpers.getSeasons(selected[i]);
                    for (j = 0; j < options.length; j++) {
                        options[j].key = options[j].season;
                        options[j].val = options[j].season + " season";
                    }
                } else if (fields[i] === "shows") {
                    options = [
                        {
                            val: "Past 10 seasons",
                            key: "10"
                        },
                        {
                            val: "All seasons",
                            key: "all"
                        }
                    ];
                }
                vm.dropdown.fields().push({
                    id: fieldId,
                    name: fields[i],
                    options: ko.observableArray(options),
                    selected: ko.observable(selected[i])
                });
            }
console.log(vm.dropdown);

            formEl.innerHTML = Handlebars.templates.dropdown();
            formEl.dataset.idLoaded = formId;
            ko.applyBindings(vm.dropdown, document.getElementById(formId));

            if (fields.length === 1) {
                ui.dropdown($("#" + formId + "-" + fields[0]));
            } else if (fields.length === 2) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]));
            }
        }

        /*// Check if each field is already built
        newSelect = false;
        for (i = 0; i < fields.length; i++) {
            fieldId = formId + "-" + fields[i];
            selectEl = document.getElementById(fieldId);
            if (!selectEl) {
                // Create new select
                if (fields[i] === "teams") {
                    options = helpers.getTeams(selected[i]);
                    for (j = 0; j < options.length; j++) {
                        options[j].key = options[j].abbrev;
                        options[j].val = options[j].region + " " + options[j].name;
                    }
                } else if (fields[i] === "seasons") {
                    options = helpers.getSeasons(selected[i]);
                    for (j = 0; j < options.length; j++) {
                        options[j].key = options[j].season;
                        options[j].val = options[j].season + " season";
                    }
                } else if (fields[i] === "shows") {
                    options = [
                        {
                            val: "Past 10 seasons",
                            key: "10",
                            selected: selected[i] === "10"
                        },
                        {
                            val: "All seasons",
                            key: "all",
                            selected: selected[i] === "all"
                        }
                    ];
                }
                content = Handlebars.templates.dropdown({field: fields[i], fieldId: fieldId, options: options});
                formEl.innerHTML += content;
                newSelect = true;
            } else {
                // See if default value changed
                currentSelected = selectEl.options[selectEl.selectedIndex].value;
                if (currentSelected !== selected[i].toString()) {
                    selectEl.value = selected[i];
                }
            }
        }*/

        // Check if extraParam is set correctly
        if (extraParam === undefined || extraParam === null) {
            formEl.dataset.extraParam = "";
        } else if (formEl.dataset.extraParam !== extraParam) {
            formEl.dataset.extraParam = extraParam;
        }

        // Check if any field needs to be updated
        for (i = 0; i < vm.dropdown.fields().length; i++) {
            if (vm.dropdown.fields()[i].name === "seasons") {
                if (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) {
                    vm.dropdown.fields()[i].options.push({
                        val: g.season + " season",
                        key: g.season
                    });
                }
            }
        }

        // Activate if a select was added or changed
        /*if (newSelect) {
            if (fields.length === 1) {
                ui.dropdown($("#" + formId + "-" + fields[0]));
            } else if (fields.length === 2) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]));
            }
        }*/
    }

    return {
        dropdown: dropdown
    };
});