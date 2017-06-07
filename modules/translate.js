const translate = require('google-translate-api');

class Translate {
    constructor() {

    }

    autoToEnglish(text) {
        return new Promise((resolve, reject) => {
            translate(text, { to: 'en' }).then(res => {
                resolve({lang: res.from.language.iso, text: res.text});
            }).catch(err => {
                reject(err);
            });
        })
    }
}

export default Translate;