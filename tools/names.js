const _ = require("lodash");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Run this on the output of something like:
// $ wget --mirror --convert-links --adjust-extension --no-parent http://www.draftexpress.com
const folder = "/media/external/www.draftexpress.com/profile";

const upperCaseFirst = str => str.charAt(0).toUpperCase() + str.slice(1);

const getName = (untrimmedName, file) => {
    const name = untrimmedName.trim().replace(/\s\s+/g, " "); // Condense whitespace to just single spaces
    if (name === "") {
        throw new Error(
            `No name found in ${file}, probably it is not a valid player page`,
        );
    }

    // Handles rare first names with spaces manually, along with Nene having no last name and some typos
    const nameFixes = {
        "Billy Ray Bates": ["Billy Ray", "Bates"],
        "Hot Rod Williams": ["Hot Rod", "Williams"],
        "J. Robert Merritt": ["J. Robert", "Merritt"],
        Nene: ["Nene", ""],
        "St. Paul Latham": ["St. Paul", "Latham"],
    };
    let parts;
    if (nameFixes.hasOwnProperty(name)) {
        parts = nameFixes[name];
    } else {
        parts = name.split(" ").map(upperCaseFirst);
    }

    if (parts.length !== 2) {
        const juniors = [
            "II",
            "III",
            "Jr",
            "Jr.",
            "Junior",
            "Sr",
            "Sr.",
            "Senior",
        ];
        if (parts.length === 3 && juniors.includes(parts[2])) {
            return parts.slice(0, 2);
        }

        // Longest ones first, so they are checked first
        const middlesWithLast = [
            ["De", "La"],
            ["Van", "De"],
            ["Van", "Den"],
            ["Van", "Der"],
            ["Da"],
            ["De"],
            ["Del"],
            ["Della"],
            ["Di"],
            ["Dos"],
            ["La"],
            ["Le"],
            ["Li"],
            ["San"],
            ["Santa"],
            ["St."],
            ["Van"],
            ["Vander"],
            ["Von"],
        ];
        let stop = false;
        for (let i = 1; i < parts.length - 1; i++) {
            const middle = parts.slice(i, parts.length - 1);
            for (const middleWithLast of middlesWithLast) {
                if (_.isEqual(middleWithLast, middle)) {
                    parts = parts.slice(0, i).concat(parts.slice(i).join(" "));
                    stop = true;
                    break;
                }
            }
            if (stop) {
                break;
            }
        }

        // Some are like Joe Smith (College) to disambiguate two Joe Smiths, but we don't care about disambiguation
        if (parts.length > 2 && parts[2][0] === "(") {
            parts = parts.slice(0, 2);
        }

        // Keep repeated first names
        if (parts.length === 3 && parts[0] === parts[1]) {
            parts = [parts.slice(0, 2).join(" "), parts[2]];
        }

        // Like "Luc Mbah A Moute"
        if (
            parts.length > 3 &&
            (parts[parts.length - 2] === "A" || parts[parts.length - 2] === "a")
        ) {
            parts = [
                parts[0],
                parts.slice(parts.length - 3, parts.length).join(" "),
            ];
        }

        if (parts.length > 2) {
            console.log(`Dropping middle name from ${name}`);
            parts = [parts[0], parts[parts.length - 1]];
        }

        if (parts.length !== 2) {
            console.log(parts);
            throw new Error(
                `Unable to parse first name and last name from ${name} in ${file}`,
            );
        }
    }

    // Trim trailing _ which appears sometimes
    for (let i = 0; i < parts.length; i++) {
        if (parts[i][parts[i].length - 1] === "_") {
            parts[i] = parts[i].slice(0, parts[i].length - 1);
        }
    }

    // Fix improperly formatted abbrevations like D.J and J.r.
    let match = parts[0].match(/^([a-zA-Z])\.([a-zA-Z])\.?$/);
    if (!match) {
        // Fix improperly formatted abbreviations like DJ
        match = parts[0].match(/^([A-Z])([A-Z])$/);
    }
    if (match && match.length === 3) {
        const newFn = `${match[1]}.${match[2]}.`.toUpperCase();
        if (newFn !== parts[0]) {
            parts[0] = newFn;
        }
    }

    const fnFixes = {};
    if (fnFixes.hasOwnProperty(parts[0])) {
        parts[0] = fnFixes[parts[0]];
    }

    return parts;
};

const getCountry = (misc, file) => {
    const states = [
        "AL",
        "AK",
        "AS",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "DC",
        "FM",
        "FL",
        "GA",
        "GU",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MH",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "MP",
        "OH",
        "OK",
        "OR",
        "PW",
        "PA",
        "PR",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VI",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
    ];
    const provinces = ["AB", "BC", "MB", "NL", "NS", "ON", "QC", "QLD", "SK"];

    const hometownsToCountries = {
        "Belo Horizonte": "Brazil",
        "Benin City": "Nigeria",
        "Berry Islands": "Bahamas",
        "Comodoro Rivadavia": "Argentina",
        "Dar es Salaam": "Tanzania",
        "Diego Martin": "Trinidad and Tobago",
        "El Fuerte": "Mexico",
        "Gold Coast": "Australia",
        "Grand Turk": "Turks and Caicos Islands",
        "Gros-Islet": "Saint Lucia",
        "Hessisch Oldendorf": "Germany",
        "Joao Pessoa": "Brazil",
        "Jos Plateau": "Nigeria",
        "Kfar Saba": "Israel",
        "Klein-Gerau": "Germany",
        "La Ceiba": "Honduras",
        "La Vega": "USA",
        "Les Abymes": "Les Abymes",
        "Mill Bay": "USA",
        "Modbury Heights": "Australia",
        "Novi Sad": "Serbia",
        "Ocho Rios": "Jamaica",
        "Old Harbour": "Jamaica",
        "Quebec City": "Canada",
        "Richard-Toll": "Senegal",
        "San Fernando": "USA",
        "San Francisco de Macor": "Dominican Republic",
        "Santa Cruz": "USA",
        "Santo Andre": "Brazil",
        "Santo Domingo": "Dominican Republic",
        "Shanty Bay": "Canada",
        "St. Catharines": "Canada",
        "St. Catherine": "Egypt",
        "St. Gabriel": "USA",
        "Stoney Creek": "USA",
        "Tel Aviv": "Israel",
        "Velika Gorica": "Croatia",
        "West Launceston": "Tasmania",
        "White Rock": "USA",
        Abidjan: "Ivory Coast",
        Accra: "Ghana",
        Achern: "Germany",
        Akwukwu: "Nigeria",
        Alytus: "Lithuania",
        Amsterdam: "Netherlands",
        Andros: "Bahamas",
        Ankara: "Turkey",
        Antalya: "Turkey",
        Ara: "Brazil",
        Athens: "Greece",
        Badalona: "Spain",
        Baldivis: "Australia",
        Bamako: "Mali",
        Banjul: "Gambia",
        Barranquilla: "Colombia",
        Bendigo: "Australia",
        Bergen: "Norway",
        Berlin: "Germany",
        Birkenfield: "Germany",
        Birmingham: "England",
        Brampton: "Canada",
        Bratislava: "Slovakia",
        Brisbane: "Australia",
        Brussels: "Belgium",
        Cacak: "Serbia",
        Caetanopolis: "Brazil",
        Cali: "USA",
        Canberra: "Australia",
        Caracas: "Venezuela",
        Cedres: "Trinidad and Tobago",
        Cottingham: "England",
        Dakar: "Senegal",
        Dennery: "Saint Lucia",
        Dexheim: "Germany",
        Dhahran: "Saudi Arabia",
        Douala: "Cameroon",
        Dublin: "Ireland",
        Durban: "South Africa",
        Dzierzoniow: "Poland",
        Ebolowa: "Cameroon",
        Edinburgh: "Scotland",
        Edmonton: "Canada",
        Enugu: "Nigeria",
        Ermont: "France",
        Fairfield: "USA",
        Freeport: "USA",
        Galway: "Ireland",
        Garg: "Lithuania",
        Geelong: "Australia",
        Girona: "Spain",
        Guayaquil: "Ecuador",
        Hallam: "England",
        Hamburg: "Germany",
        Hannover: "Germany",
        Heidelberg: "Germany",
        Holetown: "Barbados",
        Ibadan: "Nigeria",
        Indjija: "Serbia",
        Jussara: "Brazil",
        Kaduna: "Nigeria",
        Kampala: "Uganda",
        Kano: "Nigeria",
        Kaunas: "Lithuania",
        Kingston: "Jamaica",
        Klaipeda: "Lithuania",
        Krakow: "Poland",
        Kraljevica: "Croatia",
        Lagos: "Nigeria",
        Launceston: "Australia",
        Laverune: "France",
        Libreville: "Gabon",
        Lim: "Costa Rica",
        Limeira: "Brazil",
        London: "England",
        Louga: "Senegal",
        Lublin: "Poland",
        Lugano: "Switzerland",
        Lusaka: "Zambia",
        Madrid: "Spain",
        Manchester: "England",
        Maputo: "Mozambique",
        Melbourne: "Australia",
        Melton: "Australia",
        Mesopotamia: "USA",
        Milford: "USA",
        Moe: "Australia",
        Monki: "USA",
        Montmorency: "Australia",
        Nairobi: "Kenya",
        Nassau: "Bahamas",
        Newcastle: "England",
        Norrkoping: "Sweden",
        Nowra: "Australia",
        Oldham: "England",
        Ontario: "Canada",
        Ottawa: "Canada",
        Ouagadougou: "Burkina Faso",
        Panevezys: "Lithuania",
        Paris: "France",
        Perth: "Australia",
        Petrolia: "Canada",
        Pikine: "Senegal",
        Plunge: "Lithuania",
        Podgorica: "Montenegro",
        Portsmouth: "USA",
        Recife: "Brazil",
        Rokiskis: "Lithuania",
        "Saint Kitts": "Saint Kitts and Nevis",
        "Santa Fe": "USA",
        Santiago: "Chile",
        Sarnia: "Canada",
        Scarborough: "USA",
        Segou: "Mali",
        Serrekunda: "Gambia",
        Sevres: "France",
        Sijbekarspel: "Netherlands",
        Sofia: "Bulgaria",
        Sombor: "Serbia",
        Split: "Croatia",
        Surrey: "England",
        Sydney: "Australia",
        Tamworth: "USA",
        Tenerife: "Spain",
        Thi: "Senegal",
        Thika: "Kenya",
        Thornleigh: "Australia",
        Toronto: "Canada",
        Townsville: "Australia",
        Trinite: "France",
        Vicenza: "Italy",
        Vilnius: "Lithuania",
        Vire: "France",
        Waterloo: "Canada",
        Wau: "South Sudan",
        Weilheim: "Germany",
        Wellington: "New Zealand",
        Whangarei: "New Zealand",
        Wilkinsburg: "USA",
        Windsor: "Canada",
        Winkler: "Canada",
        Wollongong: "Australia",
        Yaound: "Cameroon",
        Zadar: "Croatia",
        Zagreb: "Croatia",
        Zrenjanin: "Serbia",
    };

    const countryFixes = {
        Bosnia: "Bosnia and Herzegovina",
        Bsonia: "Bosnia and Herzegovina",
        "Chinese Taipei": "Taiwan",
        "Congo DR": "Congo",
        Cypus: "Cyprus",
        "Democratic Republic of the Congo": "Congo",
        GO: "Brazil",
        Guadaloupe: "Guadeloupe",
        "Les Abymes": "Guadeloupe",
        Macedonia: "North Macedonia",
        Nigera: "Nigeria",
        "Republic of Seychelles": "Seychelles",
        "Saint Vincent and Grenadines": "Saint Vincent and the Grenadines",
        SO: "Mexico",
        "St. Vincent": "Saint Vincent and the Grenadines",
        Taipei: "Taiwan",
        "Trinidad & Tobago": "Trinidad and Tobago",
        WC: "USA",
    };

    const matches = misc.match(/Hometown: (.*)/);
    let hometown;
    if (matches.length > 1) {
        hometown = matches[1].trim();
    } else {
        throw new Error(`Unable to find hometown in ${file}`);
    }

    if (hometown === "") {
        throw new Error(`Blank hometown in ${file}`);
    }

    if (hometownsToCountries.hasOwnProperty(hometown)) {
        return hometownsToCountries[hometown];
    }

    const hometownComponents = hometown.split(", ");
    if (hometownComponents.length !== 2) {
        throw new Error(`Unable to parse hometown ${hometown} in ${file}`);
    }

    let country = hometownComponents[1];
    country = states.includes(country) ? "USA" : country;
    country = provinces.includes(country) ? "Canada" : country;
    country = countryFixes.hasOwnProperty(country)
        ? countryFixes[country]
        : country;

    return country;
};

const fnsByCountry = {};
const lnsByCountry = {};
for (const filename of fs.readdirSync(folder)) {
    const file = path.join(folder, filename, "index.html");

    let contents;
    try {
        contents = fs.readFileSync(file, "utf8");
    } catch (err) {
        console.log(`Cannot open ${file}`);
        continue;
    }

    const $ = cheerio.load(contents);

    let fn;
    let ln;
    try {
        [fn, ln] = getName(
            $(".title")
                .first()
                .text(),
            file,
        );
    } catch (err) {
        console.log(err.message);
        continue;
    }

    let country;
    try {
        country = getCountry($('td[data-title="MISC"]').text(), file);
    } catch (err) {
        console.log(err.message);
        continue;
    }
    console.log(fn, "|", ln, "|", country);

    if (!fnsByCountry.hasOwnProperty(country)) {
        fnsByCountry[country] = {};
        lnsByCountry[country] = {};
    }

    const skipFN = ["Just-in'love", "Sir'Dominic"];
    if (!skipFN.includes(fn)) {
        if (!fnsByCountry[country].hasOwnProperty(fn)) {
            fnsByCountry[country][fn] = 0;
        }
        fnsByCountry[country][fn] += 1;
    }

    const skipLN = ["Kickingstallionsims"];
    if (!skipLN.includes(ln)) {
        if (!lnsByCountry[country].hasOwnProperty(ln)) {
            lnsByCountry[country][ln] = 0;
        }
        lnsByCountry[country][ln] += 1;
    }
}

// Minimum of (unique fns, unique lns) by country
const countsByCountry = {};
for (const country of Object.keys(fnsByCountry).sort()) {
    countsByCountry[country] = Math.min(
        Object.keys(fnsByCountry[country]).length,
        Object.keys(lnsByCountry[country]).length,
    );
}

// Restructure fns and lns so they are arrays of [name, cumsum] by country
const namesByCountryCumsum = namesByCountry => {
    const obj = {};

    for (const country of Object.keys(namesByCountry).sort()) {
        let cumsum = 0;
        obj[country] = Object.keys(namesByCountry[country])
            .sort()
            .map(name => {
                cumsum += namesByCountry[country][name];
                return [name, cumsum];
            });

        if (cumsum < 5) {
            console.log(`Dropping ${country} (${cumsum} players)`);
            delete obj[country];
        }
    }

    return obj;
};
const fnsByCountryCumsum = namesByCountryCumsum(fnsByCountry);
const lnsByCountryCumsum = namesByCountryCumsum(lnsByCountry);

console.log(JSON.stringify(Object.keys(fnsByCountry).sort(), null, 4));
console.log(
    JSON.stringify({ first: fnsByCountryCumsum, last: lnsByCountryCumsum }),
);
