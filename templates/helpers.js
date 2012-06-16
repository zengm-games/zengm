Handlebars.registerHelper("round", function(value, precision) {
    precision = typeof precision !== "undefined" ? parseInt(precision, 10) : 0;

    return parseFloat(value).toFixed(precision);
});

Handlebars.registerHelper("roundWinp", function(value) {
    output = parseFloat(value).toFixed(3);

    // Delete leading 0
    if (output[0] == "0") {
      output = output.slice(1, output.length);
    }

    return output;
});
