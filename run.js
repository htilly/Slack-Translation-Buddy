require("babel-register")({
        "presets": ["es2015"]
});

require('./main.js');

// Playing with Travis.
// Just something that will return a value

module.exports = function(number, locale) {
    return number.toLocaleString(locale);
};
