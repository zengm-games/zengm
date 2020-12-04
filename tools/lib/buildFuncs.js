const CleanCSS = require("clean-css");
const crypto = require("crypto");
const fs = require("fs");
const fse = require("fs-extra");
const sass = require("node-sass");
const path = require("path");
const replace = require("replace");
const getSport = require("./getSport");

const fileHash = contents => {
	// https://github.com/sindresorhus/rev-hash
	return crypto.createHash("md5").update(contents).digest("hex").slice(0, 10);
};

const buildCSS = (watch /*: boolean*/ = false) => {
	const filenames = ["light", "dark"];
	for (const filename of filenames) {
		const start = process.hrtime();

		// If more Sass files are needed, then create them and @import them into this main Sass file.
		const sassFilePath = `public/css/${filename}.scss`;
		const sassResult = sass.renderSync({
			file: sassFilePath,
		});
		const source = sassResult.css.toString();

		let outFilename;
		if (watch) {
			outFilename = `build/gen/${filename}.css`;

			replace({
				regex: `-CSS_HASH_${filename.toUpperCase()}`,
				replacement: "",
				paths: ["build/index.html"],
				silent: true,
			});
		} else {
			const hash = fileHash(source);
			outFilename = `build/gen/${filename}-${hash}.css`;

			replace({
				regex: `CSS_HASH_${filename.toUpperCase()}`,
				replacement: hash,
				paths: ["build/index.html"],
				silent: true,
			});
		}

		let output;
		if (!watch) {
			const result = new CleanCSS().minify(source);
			if (result.errors.length > 0) {
				console.log("clean-css errors", result.errors);
			}
			if (result.warnings.length > 0) {
				console.log("clean-css warnings", result.warnings);
			}
			output = result.styles;
		} else {
			output = source;
		}

		fs.writeFileSync(outFilename, output);

		if (!watch) {
			const bytes = Buffer.byteLength(output, "utf8");

			const diff = process.hrtime(start);
			const NS_PER_SECOND = 10 ** 9;
			const timeInS = diff[0] + diff[1] / NS_PER_SECOND;

			console.log(
				`${(bytes / 1024 / 1024).toFixed(
					2,
				)} MB written to ${outFilename} (${timeInS.toFixed(
					2,
				)} seconds) at ${new Date().toLocaleTimeString()}`,
			);
		}
	}
};

const setSport = () => {
	if (process.env.SPORT === "football") {
		replace({
			regex: "basketball",
			replacement: "football",
			paths: ["build/index.html"],
			silent: true,
		});
		replace({
			regex: "Basketball",
			replacement: "Football",
			paths: ["build/index.html"],
			silent: true,
		});

		// lol
		replace({
			regex: "football-gm.com/prebid",
			replacement: "basketball-gm.com/prebid",
			paths: ["build/index.html"],
			silent: true,
		});
	}
};

const copyFiles = () => {
	const foldersToIgnore = ["basketball", "css", "football"];

	fse.copySync("public", "build", {
		filter: filename => {
			// Loop through folders to ignore.
			for (const folder of foldersToIgnore) {
				if (filename.startsWith(path.join("public", folder))) {
					return false;
				}
			}

			return true;
		},
	});

	let sport = process.env.SPORT;
	if (typeof sport !== "string") {
		sport = "basketball";
	}

	fse.copySync(path.join("public", sport), "build", {
		filter: filename => !filename.includes(".gitignore"),
	});

	// Remove the empty folders created by the "filter" function.
	for (const folder of foldersToIgnore) {
		fse.removeSync(`build/${folder}`);
	}

	const realPlayerDataFilename = path.join(
		"data",
		`real-player-data-${sport}.json`,
	);
	if (fs.existsSync(realPlayerDataFilename)) {
		fse.copySync(realPlayerDataFilename, "build/gen/real-player-data.json");
	}

	setSport();
};

const genRev = () => {
	const d = new Date();
	const date = d.toISOString().split("T")[0].replace(/-/g, ".");
	const minutes = String(d.getUTCMinutes() + 60 * d.getUTCHours()).padStart(
		4,
		"0",
	);
	const rev = `${date}.${minutes}`;

	return rev;
};

const reset = () => {
	fse.removeSync("build");
	fs.mkdirSync("build/gen", { recursive: true });
};

const upperCaseFirstLetter = string => {
	return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
};

const setTimestamps = (rev /*: string*/, watch /*: boolean*/ = false) => {
	const sport = getSport();

	replace({
		regex: "REV_GOES_HERE",
		replacement: rev,
		paths: watch
			? ["build/index.html"]
			: [
					"build/index.html",
					`build/gen/ui-${rev}.js`,
					`build/gen/ui-legacy-${rev}.js`,
					`build/gen/worker-${rev}.js`,
					`build/gen/worker-legacy-${rev}.js`,
			  ],
		silent: true,
	});

	const bannerAdsCode = `<script type="text/javascript">
var cmpConfig = {
  global: false,
  publisherName: "${upperCaseFirstLetter(sport)} GM",
  publisherLogo: "https://${sport}-gm.com/files/logo.png",
};
function cmpFactory(cmpConfig) {
  var cssToAdd = cmpConfig.customCSS ? cmpConfig.customCSS : ".qc-cmp-button.qc-cmp-secondary-button { border-color: #eee !important; background-color: #eee !important; }";
  var styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = cssToAdd;
  document.head.appendChild(styleSheet);

  var initArgs = {
    'Language': 'en',
    'Initial Screen Reject Button Text': 'I DO NOT ACCEPT',
    'Initial Screen Accept Button Text': 'I ACCEPT',
    'Purpose Screen Body Text': 'You can set your consent preferences and determine how you want your data to be used based on the purposes below. You may set your preferences for us independently from those of third-party partners. Each purpose has a description so that you know how we and partners use your data.',
    'Purpose Screen Vendor Link Text': 'See Vendors',
    'Purpose Screen Save and Exit Button Text': 'SAVE &amp; EXIT',
    'Vendor Screen Body Text': 'You can set consent preferences for individual third-party partners we work with below. Expand each company list item to see what purposes they use data for to help make your choices. In some cases, companies may use your data without asking for your consent, based on their legitimate interests. You can click on their privacy policy links for more information and to object to such processing. ',
    'Vendor Screen Accept All Button Text': 'ACCEPT ALL',
    'Vendor Screen Reject All Button Text': 'REJECT ALL',
    'Vendor Screen Purposes Link Text': 'Back to Purposes',
    'Vendor Screen Save and Exit Button Text': 'SAVE &amp; EXIT',
    'Initial Screen Body Text': 'We and our partners use technologies, such as cookies, and process personal data, such as IP addresses and cookie identifiers, to personalise ads and content based on your interests, measure the performance of ads and content, and derive insights about the audiences who saw ads and content. Click below to consent to the use of this technology and the processing of your personal data for these purposes. You can change your mind and change your consent choices at any time by returning to this site. ',
    'Initial Screen Body Text Option': 1,
    'Publisher Purpose IDs': [1,2,3,4,5],
    'Consent Scope': 'service',
  };
  if (cmpConfig.global) {
    initArgs['Display UI'] = 'always';
  }
  if (cmpConfig.publisherName) {
    initArgs['Publisher Name'] = cmpConfig.publisherName;
  }
  if (cmpConfig.publisherLogo) {
    initArgs['Publisher Logo'] = cmpConfig.publisherLogo;
  }

  var elem = document.createElement('script');
  elem.src = 'https://quantcast.mgr.consensu.org/cmp.js';
  elem.async = true;
  elem.type = "text/javascript";
  var scpt = document.getElementsByTagName('script')[0];
  scpt.parentNode.insertBefore(elem, scpt);
  (function() {
  var gdprAppliesGlobally = cmpConfig.global;
  function addFrame() {
    if (!window.frames['__cmpLocator']) {
    if (document.body) {
      var body = document.body,
        iframe = document.createElement('iframe');
      iframe.style = 'display:none';
      iframe.name = '__cmpLocator';
      body.appendChild(iframe);
    } else {
      // In the case where this stub is located in the head,
      // this allows us to inject the iframe more quickly than
      // relying on DOMContentLoaded or other events.
      setTimeout(addFrame, 5);
    }
    }
  }
  addFrame();
  function cmpMsgHandler(event) {
    var msgIsString = typeof event.data === "string";
    var json;
    if(msgIsString) {
    json = event.data.indexOf("__cmpCall") != -1 ? JSON.parse(event.data) : {};
    } else {
    json = event.data;
    }
    if (json.__cmpCall) {
    var i = json.__cmpCall;
    window.__cmp(i.command, i.parameter, function(retValue, success) {
      var returnMsg = {"__cmpReturn": {
      "returnValue": retValue,
      "success": success,
      "callId": i.callId
      }};
      if (event && event.source && event.source.postMessage) {
        event.source.postMessage(msgIsString ?
        JSON.stringify(returnMsg) : returnMsg, '*');
      }
    });
    }
  }
  window.__cmp = function (c) {
    var b = arguments;
    if (!b.length) {
    return __cmp.a;
    }
    else if (b[0] === 'ping') {
    b[2]({"gdprAppliesGlobally": gdprAppliesGlobally,
      "cmpLoaded": false}, true);
    } else if (c == '__cmp')
    return false;
    else {
    if (typeof __cmp.a === 'undefined') {
      __cmp.a = [];
    }
    __cmp.a.push([].slice.apply(b));
    }
  }
  window.__cmp.gdprAppliesGlobally = gdprAppliesGlobally;
  window.__cmp.msgHandler = cmpMsgHandler;
  if (window.addEventListener) {
    window.addEventListener('message', cmpMsgHandler, false);
  }
  else {
    window.attachEvent('onmessage', cmpMsgHandler);
  }
  })();
  window.__cmp('init', initArgs);
}
cmpFactory(cmpConfig);
</script>

<script type="text/javascript">
var freestar = freestar || {};
freestar.hitTime = Date.now();
freestar.queue = freestar.queue || [];
freestar.config = freestar.config || {};
freestar.debug = window.location.search.indexOf('fsdebug') === -1 ? false : true;
freestar.config.enabled_slots = [];
if (window.enableLogging) {
  !function(a,b){var c=b.getElementsByTagName("script")[0],d=b.createElement("script"),e="https://a.pub.network/${sport}-gm-com";e+=freestar.debug?"/qa/pubfig.min.js":"/pubfig.min.js",d.async=!0,d.src=e,c.parentNode.insertBefore(d,c)}(window,document);
  freestar.initCallback = function () { freestar.newAdSlots(freestar.config.enabled_slots); }
}
</script>`;

	replace({
		regex: "BANNER_ADS_CODE",
		replacement: bannerAdsCode,
		paths: ["build/index.html"],
		silent: true,
	});

	if (!watch) {
		replace({
			regex: "/gen/worker-",
			replacement: "/gen/worker-legacy-",
			paths: [`build/gen/ui-legacy-${rev}.js`],
			silent: true,
		});
	}

	replace({
		regex: "GOOGLE_ANALYTICS_ID",
		replacement: sport === "basketball" ? "UA-38759330-1" : "UA-38759330-2",
		paths: ["build/index.html"],
		silent: true,
	});

	replace({
		regex: "BBGM_ADS_FILENAME",
		replacement: sport === "basketball" ? "bbgm" : "fbgm",
		paths: ["build/index.html"],
		silent: true,
	});

	replace({
		regex: "BUGSNAG_API_KEY",
		replacement:
			sport === "basketball"
				? "c10b95290070cb8888a7a79cc5408555"
				: "fed8957cbfca2d1c80997897b840e6cf",
		paths: ["build/index.html"],
		silent: true,
	});

	let quantcastCode = "";
	if (!watch && sport === "basketball") {
		quantcastCode = `<script type="text/javascript">
if (window.enableLogging) {
var _qevents = _qevents || [];(function() {
var elem = document.createElement('script');
elem.src = (document.location.protocol == "https:" ? "https://secure" : "http://edge") + ".quantserve.com/quant.js";
elem.async = true;
elem.type = "text/javascript";
var scpt = document.getElementsByTagName('script')[0];
scpt.parentNode.insertBefore(elem, scpt);
})();_qevents.push({
qacct:"p-Ye5RY6xC03ZWz"
});
}
</script><noscript>
<div style="display:none;">
<img src="//pixel.quantserve.com/pixel/p-Ye5RY6xC03ZWz.gif" border="0" height="1" width="1" alt="Quantcast"/>
</div>
</noscript>`;
	}

	replace({
		regex: "QUANTCAST_CODE",
		replacement: quantcastCode,
		paths: ["build/index.html"],
		silent: true,
	});

	let facebookPixelCode = "";
	if (!watch) {
		facebookPixelCode = `<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${
			process.env.SPORT === "basketball"
				? "1285618145138713"
				: "216939956468092"
		}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${
			process.env.SPORT === "basketball"
				? "1285618145138713"
				: "216939956468092"
		}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
	}

	replace({
		regex: "FACEBOOK_PIXEL_CODE",
		replacement: facebookPixelCode,
		paths: ["build/index.html"],
		silent: true,
	});

	if (watch) {
		replace({
			regex: '-" \\+ bbgmVersion \\+ "',
			replacement: "",
			paths: ["build/index.html"],
			silent: true,
		});
	}

	return rev;
};

module.exports = {
	buildCSS,
	copyFiles,
	fileHash,
	genRev,
	reset,
	setTimestamps,
};
