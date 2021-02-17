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

const bySport = object => {
	const sport = process.env.SPORT ?? "basketball";
	if (object.hasOwnProperty(sport)) {
		return object[sport];
	}

	if (object.hasOwnProperty("default")) {
		return object.default;
	}

	throw new Error("No value for sport and no default");
};

const setSport = () => {
	replace({
		regex: "GAME_NAME",
		replacement: bySport({
			basketball: "Basketball GM",
			football: "Football GM",
			hockey: "ZenGM Hockey",
		}),
		paths: ["build/index.html"],
		silent: true,
	});
	replace({
		regex: "SPORT",
		replacement: bySport({
			basketball: "basketball",
			football: "football",
			hockey: "hockey",
		}),
		paths: ["build/index.html"],
		silent: true,
	});
	replace({
		regex: "WEBSITE_ROOT",
		replacement: bySport({
			basketball: "basketball-gm.com",
			football: "football-gm.com",
			hockey: "hockey.zengm.com",
		}),
		paths: ["build/index.html"],
		silent: true,
	});
	replace({
		regex: "PLAY_SUBDOMAIN",
		replacement: bySport({
			basketball: "play.basketball-gm.com",
			football: "play.football-gm.com",
			hockey: "hockey.zengm.com",
		}),
		paths: ["build/index.html"],
		silent: true,
	});
	replace({
		regex: "BETA_SUBDOMAIN",
		replacement: bySport({
			basketball: "beta.basketball-gm.com",
			football: "beta.football-gm.com",
			hockey: "beta.hockey.zengm.com",
		}),
		paths: ["build/index.html"],
		silent: true,
	});
};

const copyFiles = () => {
	const foldersToIgnore = ["basketball", "css", "football", "hockey"];

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

	// Quantcast Choice. Consent Manager Tag v2.0 (for TCF 2.0)
	const bannerAdsCode = `<script type="text/javascript" async=true>
(function() {
  var host = '${bySport({
		basketball: "basketball-gm.com",
		football: "football-gm.com",
		hockey: "zengm.com",
	})}';
  var element = document.createElement('script');
  var firstScript = document.getElementsByTagName('script')[0];
  var url = 'https://quantcast.mgr.consensu.org'
    .concat('/choice/', 'M1Q1fpfqa7Vk4', '/', host, '/choice.js')
  var uspTries = 0;
  var uspTriesLimit = 3;
  element.async = true;
  element.type = 'text/javascript';
  element.src = url;

  firstScript.parentNode.insertBefore(element, firstScript);

  function makeStub() {
    var TCF_LOCATOR_NAME = '__tcfapiLocator';
    var queue = [];
    var win = window;
    var cmpFrame;

    function addFrame() {
      var doc = win.document;
      var otherCMP = !!(win.frames[TCF_LOCATOR_NAME]);

      if (!otherCMP) {
        if (doc.body) {
          var iframe = doc.createElement('iframe');

          iframe.style.cssText = 'display:none';
          iframe.name = TCF_LOCATOR_NAME;
          doc.body.appendChild(iframe);
        } else {
          setTimeout(addFrame, 5);
        }
      }
      return !otherCMP;
    }

    function tcfAPIHandler() {
      var gdprApplies;
      var args = arguments;

      if (!args.length) {
        return queue;
      } else if (args[0] === 'setGdprApplies') {
        if (
          args.length > 3 &&
          args[2] === 2 &&
          typeof args[3] === 'boolean'
        ) {
          gdprApplies = args[3];
          if (typeof args[2] === 'function') {
            args[2]('set', true);
          }
        }
      } else if (args[0] === 'ping') {
        var retr = {
          gdprApplies: gdprApplies,
          cmpLoaded: false,
          cmpStatus: 'stub'
        };

        if (typeof args[2] === 'function') {
          args[2](retr);
        }
      } else {
        queue.push(args);
      }
    }

    function postMessageEventHandler(event) {
      var msgIsString = typeof event.data === 'string';
      var json = {};

      try {
        if (msgIsString) {
          json = JSON.parse(event.data);
        } else {
          json = event.data;
        }
      } catch (ignore) {}

      var payload = json.__tcfapiCall;

      if (payload && window.__tcfapi) {
        window.__tcfapi(
          payload.command,
          payload.version,
          function(retValue, success) {
            var returnMsg = {
              __tcfapiReturn: {
                returnValue: retValue,
                success: success,
                callId: payload.callId
              }
            };
            if (msgIsString) {
              returnMsg = JSON.stringify(returnMsg);
			}
			if (event.source) {
			  event.source.postMessage(returnMsg, '*');
			}
          },
          payload.parameter
        );
      }
    }

    while (win) {
      try {
        if (win.frames[TCF_LOCATOR_NAME]) {
          cmpFrame = win;
          break;
        }
      } catch (ignore) {}

      if (win === window.top) {
        break;
      }
      win = win.parent;
    }
    if (!cmpFrame) {
      addFrame();
      win.__tcfapi = tcfAPIHandler;
      win.addEventListener('message', postMessageEventHandler, false);
    }
  };

  makeStub();

  var uspStubFunction = function() {
    var arg = arguments;
    if (typeof window.__uspapi !== uspStubFunction) {
      setTimeout(function() {
        if (typeof window.__uspapi !== 'undefined') {
          window.__uspapi.apply(window.__uspapi, arg);
        }
      }, 500);
    }
  };

  var checkIfUspIsReady = function() {
    uspTries++;
    if (window.__uspapi === uspStubFunction && uspTries < uspTriesLimit) {
      console.warn('USP is not accessible');
    } else {
      clearInterval(uspInterval);
    }
  };

  if (typeof window.__uspapi === 'undefined') {
    window.__uspapi = uspStubFunction;
    var uspInterval = setInterval(checkIfUspIsReady, 6000);
  }
})();
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
