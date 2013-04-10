/**
 * @name views.components
 * @namespace Small components/widgets, such as drop down menus to switch between seasons/teams.
 */
define(["globals", "ui", "lib/handlebars.runtime", "lib/jquery", "util/helpers"], function (g, ui, Handlebars, $, helpers) {
    "use strict";

    /**
     * Creates or updates a dropdown form.
     *
     * @param {string} formId DOM ID of the form element to fill.
     * @param {Array.<string>} fields Array of strings of the type of fields to allow (current acceptable values are "teams" and "seasons"). Each element represents a dropdown and a component of the URL - so if "teams" and "seasons" is passed, URLs will be generated like /l/1/.../ATL/2014.
     * @param {Array} selected Array of values corresponding to the default "selected" value of each field, like "CHI" or 2022 for "teams" or "seasons".
     * @param {string} updateEvent Update event describing what has changed in this reload.
     * @param {?string=} extraParam Any extra parameter to append to the URL, like /l/1/.../ATL/2014/extraParam. Default is to append nothing.
     */
    function dropdown(formId, fields, selected, updateEvent, extraParam) {
        var content, fieldId, formEl, i, j, newOption, newSelect, options;

        formEl = document.getElementById(formId);

        // Check if each field is already built
        newSelect = false;
        for (i = 0; i < fields.length; i++) {
            fieldId = formId + "-" + fields[i];
            if (!document.getElementById(fieldId)) {
console.log('load dropdown ' + fields[i]);
                if (fields[i] === "teams") {
                    options = helpers.getTeams(7);
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
                }
                content = Handlebars.templates.dropdown({field: fields[i], fieldId: fieldId, options: options});
                formEl.innerHTML += content;
                newSelect = true;
            }
        }

        // Check if extraParam is set correctly
        if (extraParam === undefined && extraParam === null) {
            formEl.dataset.extraParam = "";
        } else if (formEl.dataset.extraParam !== extraParam) {
            formEl.dataset.extraParam = extraParam;
        }

        // Check if any field needs to be updated
        for (i = 0; i < fields.length; i++) {
            if (fields[i] === "seasons") {
                if (updateEvent === "newPhase" && g.phase === g.PHASE.PRESEASON) {
console.log('update dropdown ' + fields[i]);
                    newOption = document.createElement('option');
                    newOption.text = g.season + " season";
                    newOption.value = g.season;
                    document.getElementById(formId + "-" + fields[i]).appendChild(newOption);
                }
            }
        }

        // Activate if a new select was added
        if (newSelect) {
console.log('activate dropdown');
            if (fields.length === 1) {
                ui.dropdown($("#" + formId + "-" + fields[0]));
            } else if (fields.length === 2) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]));
            }
        }
    }

    return {
        dropdown: dropdown
    };
});