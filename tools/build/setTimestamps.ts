import { bySport } from "../lib/bySport.ts";
import { replace } from "./replace.ts";

export const setTimestamps = (rev: string, watch: boolean = false) => {
	if (watch) {
		replace({
			paths: ["build/index.html"],
			replaces: [
				{
					searchValue: "-REV_GOES_HERE.js",
					replaceValue: ".js",
				},
				{
					searchValue: '-" + bbgmVersion + "',
					replaceValue: "",
				},
				{
					searchValue: /-CSS_HASH_(LIGHT|DARK)/g,
					replaceValue: "",
				},
				{
					searchValue: "REV_GOES_HERE",
					replaceValue: rev,
				},
			],
		});
	} else {
		replace({
			paths: [
				"build/index.html",

				// This is currently just for lastChangesVersion, so don't worry about it not working in watch mode
				`build/gen/worker-${rev}.js`,
				`build/gen/worker-legacy-${rev}.js`,
			],
			replaces: [
				{
					searchValue: "REV_GOES_HERE",
					replaceValue: rev,
				},
			],
		});
	}

	// Quantcast Choice. Consent Manager Tag v2.0 (for TCF 2.0)
	const bannerAdsCode = `<script type="text/javascript" async=true>
(function() {
  if (!window.enableLogging) {
	return;
  }
  var host = '${bySport({
		basketball: "basketball-gm.com",
		football: "football-gm.com",
		default: "zengm.com",
	})}';
  var element = document.createElement('script');
  var firstScript = document.getElementsByTagName('script')[0];
  var url = 'https://cmp.inmobi.com'
    .concat('/choice/', 'M1Q1fpfqa7Vk4', '/', host, '/choice.js?tag_version=V3');
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
        if(args[0] === 'init' && typeof args[3] === 'object') {
          args[3] = Object.assign(args[3], { tag_version: 'V3' });
        }
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
            if (event && event.source && event.source.postMessage) {
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

<link rel="preconnect" href="https://a.pub.network/" crossorigin />
<link rel="preconnect" href="https://b.pub.network/" crossorigin />
<link rel="preconnect" href="https://c.pub.network/" crossorigin />
<link rel="preconnect" href="https://d.pub.network/" crossorigin />
<link rel="preconnect" href="https://c.amazon-adsystem.com" crossorigin />
<link rel="preconnect" href="https://s.amazon-adsystem.com" crossorigin />
<link rel="preconnect" href="https://btloader.com/" crossorigin />
<link rel="preconnect" href="https://api.btloader.com/" crossorigin />
<link rel="preconnect" href="https://cdn.confiant-integrations.net" crossorigin />
<script type="text/javascript">
var freestar = freestar || {};
freestar.hitTime = Date.now();
freestar.queue = freestar.queue || [];
freestar.config = freestar.config || {};
freestar.debug = window.location.search.indexOf('fsdebug') === -1 ? false : true;
freestar.config.enabled_slots = [];
if (window.enableLogging) {
  !function(a,b){var c=b.getElementsByTagName("script")[0],d=b.createElement("script"),e="https://a.pub.network/${bySport(
		{
			basketball: "basketball-gm-com",
			football: "football-gm-com",
			default: "zengm-com",
		},
	)}";e+=freestar.debug?"/qa/pubfig.min.js":"/pubfig.min.js",d.async=!0,d.src=e,c.parentNode.insertBefore(d,c)}(window,document);
}
</script>`;

	if (!watch) {
		replace({
			paths: [`build/gen/ui-legacy-${rev}.js`],
			replaces: [
				{
					searchValue: "/gen/worker-",
					replaceValue: "/gen/worker-legacy-",
				},
			],
		});
	}

	replace({
		paths: ["build/index.html"],
		replaces: [
			{
				searchValue: "BANNER_ADS_CODE",
				replaceValue: bannerAdsCode,
			},
			{
				searchValue: "GOOGLE_ANALYTICS_ID",
				replaceValue: bySport({
					basketball: "UA-38759330-1",
					football: "UA-38759330-2",
					default: "UA-38759330-3",
				}),
			},
			{
				searchValue: "BUGSNAG_API_KEY",
				replaceValue: bySport({
					baseball: "37b1fd32d021f7716dc0e1d4a3e619bc",
					basketball: "c10b95290070cb8888a7a79cc5408555",
					football: "fed8957cbfca2d1c80997897b840e6cf",
					hockey: "449e8ed576f7cbccf5c7649e936ab9ff",
				}),
			},
		],
	});

	return rev;
};
