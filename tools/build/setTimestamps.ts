import { bySport } from "../lib/bySport.ts";
import { replace } from "./replace.ts";

export const setTimestamps = async (
	versionNumber: string,
	watch: boolean = false,
	signal?: AbortSignal,
) => {
	if (watch) {
		await replace({
			paths: ["build/index.html"],
			replaces: [
				{
					searchValue: "-VERSION_NUMBER.js",
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
					searchValue: "VERSION_NUMBER",
					replaceValue: versionNumber,
				},
			],
			signal,
		});
	} else {
		await replace({
			paths: [
				"build/index.html",

				// This is currently just for lastChangesVersion, so don't worry about it not working in watch mode
				`build/gen/worker-${versionNumber}.js`,
			],
			replaces: [
				{
					searchValue: "VERSION_NUMBER",
					replaceValue: versionNumber,
				},
			],
			signal,
		});
	}

	if (signal?.aborted) {
		return;
	}

	// InMobi Choice. Consent Manager Tag v3.0 (for TCF 2.2)
	// Then below that is Freestar and then Ad-Shield https://mail.google.com/mail/u/0/#inbox/FMfcgzQcqlCVRVGZzgGtPJqHMLThhmhV?compose=jrjtXVXCNTFVDcQBLjbZvbhGfdFWSNHMmsMCVfdqRjJCxSpZzvQJSvqbdSPrkfRZTFkfqBCS
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

      if (payload) {
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

  function makeGppStub() {
    const CMP_ID = 10;
    const SUPPORTED_APIS = [
      '2:tcfeuv2',
      '6:uspv1',
      '7:usnatv1',
      '8:usca',
      '9:usvav1',
      '10:uscov1',
      '11:usutv1',
      '12:usctv1'
    ];

    window.__gpp_addFrame = function (n) {
      if (!window.frames[n]) {
        if (document.body) {
          var i = document.createElement("iframe");
          i.style.cssText = "display:none";
          i.name = n;
          document.body.appendChild(i);
        } else {
          window.setTimeout(window.__gpp_addFrame, 10, n);
        }
      }
    };
    window.__gpp_stub = function () {
      var b = arguments;
      __gpp.queue = __gpp.queue || [];
      __gpp.events = __gpp.events || [];

      if (!b.length || (b.length == 1 && b[0] == "queue")) {
        return __gpp.queue;
      }

      if (b.length == 1 && b[0] == "events") {
        return __gpp.events;
      }

      var cmd = b[0];
      var clb = b.length > 1 ? b[1] : null;
      var par = b.length > 2 ? b[2] : null;
      if (cmd === "ping") {
        clb(
          {
            gppVersion: "1.1", // must be “Version.Subversion”, current: “1.1”
            cmpStatus: "stub", // possible values: stub, loading, loaded, error
            cmpDisplayStatus: "hidden", // possible values: hidden, visible, disabled
            signalStatus: "not ready", // possible values: not ready, ready
            supportedAPIs: SUPPORTED_APIS, // list of supported APIs
            cmpId: CMP_ID, // IAB assigned CMP ID, may be 0 during stub/loading
            sectionList: [],
            applicableSections: [-1],
            gppString: "",
            parsedSections: {},
          },
          true
        );
      } else if (cmd === "addEventListener") {
        if (!("lastId" in __gpp)) {
          __gpp.lastId = 0;
        }
        __gpp.lastId++;
        var lnr = __gpp.lastId;
        __gpp.events.push({
          id: lnr,
          callback: clb,
          parameter: par,
        });
        clb(
          {
            eventName: "listenerRegistered",
            listenerId: lnr, // Registered ID of the listener
            data: true, // positive signal
            pingData: {
              gppVersion: "1.1", // must be “Version.Subversion”, current: “1.1”
              cmpStatus: "stub", // possible values: stub, loading, loaded, error
              cmpDisplayStatus: "hidden", // possible values: hidden, visible, disabled
              signalStatus: "not ready", // possible values: not ready, ready
              supportedAPIs: SUPPORTED_APIS, // list of supported APIs
              cmpId: CMP_ID, // list of supported APIs
              sectionList: [],
              applicableSections: [-1],
              gppString: "",
              parsedSections: {},
            },
          },
          true
        );
      } else if (cmd === "removeEventListener") {
        var success = false;
        for (var i = 0; i < __gpp.events.length; i++) {
          if (__gpp.events[i].id == par) {
            __gpp.events.splice(i, 1);
            success = true;
            break;
          }
        }
        clb(
          {
            eventName: "listenerRemoved",
            listenerId: par, // Registered ID of the listener
            data: success, // status info
            pingData: {
              gppVersion: "1.1", // must be “Version.Subversion”, current: “1.1”
              cmpStatus: "stub", // possible values: stub, loading, loaded, error
              cmpDisplayStatus: "hidden", // possible values: hidden, visible, disabled
              signalStatus: "not ready", // possible values: not ready, ready
              supportedAPIs: SUPPORTED_APIS, // list of supported APIs
              cmpId: CMP_ID, // CMP ID
              sectionList: [],
              applicableSections: [-1],
              gppString: "",
              parsedSections: {},
            },
          },
          true
        );
      } else if (cmd === "hasSection") {
        clb(false, true);
      } else if (cmd === "getSection" || cmd === "getField") {
        clb(null, true);
      }
      //queue all other commands
      else {
        __gpp.queue.push([].slice.apply(b));
      }
    };
    window.__gpp_msghandler = function (event) {
      var msgIsString = typeof event.data === "string";
      try {
        var json = msgIsString ? JSON.parse(event.data) : event.data;
      } catch (e) {
        var json = null;
      }
      if (typeof json === "object" && json !== null && "__gppCall" in json) {
        var i = json.__gppCall;
        window.__gpp(
          i.command,
          function (retValue, success) {
            var returnMsg = {
              __gppReturn: {
                returnValue: retValue,
                success: success,
                callId: i.callId,
              },
            };
            event.source.postMessage(msgIsString ? JSON.stringify(returnMsg) : returnMsg, "*");
          },
          "parameter" in i ? i.parameter : null,
          "version" in i ? i.version : "1.1"
        );
      }
    };
    if (!("__gpp" in window) || typeof window.__gpp !== "function") {
      window.__gpp = window.__gpp_stub;
      window.addEventListener("message", window.__gpp_msghandler, false);
      window.__gpp_addFrame("__gppLocator");
    }
  };

  makeGppStub();

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
</script>

<script data-cfasync="false">(function(){function t(I,k){const d=z();return t=function(q,o){q=q-(0x728+-0x1*0x178d+0x2c*0x65);let V=d[q];if(t['drlrVJ']===undefined){var b=function(L){const A='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let J='',P='';for(let n=-0x35*-0x59+0xd*0x89+0x13*-0x156,M,r,D=-0x1*0x1981+0x1c46+-0x2c5;r=L['charAt'](D++);~r&&(M=n%(-0xd*-0x34+-0x1dc5+0x1b25*0x1)?M*(-0xa3*-0x8+-0x27*-0xa4+-0x1dd4)+r:r,n++%(0x3c1*0x9+-0x1f35*-0x1+-0x40fa))?J+=String['fromCharCode'](0x1e7c+0x1842+-0x1*0x35bf&M>>(-(0x150a*-0x1+0x1*-0x5f+0x156b)*n&0x1c3f+-0x1240+-0x9f9)):-0x9ff+-0x27*0x62+0x18ed){r=A['indexOf'](r);}for(let S=-0x1741*-0x1+-0xfb6+-0x78b,m=J['length'];S<m;S++){P+='%'+('00'+J['charCodeAt'](S)['toString'](0x426+-0x1b7d+0x1767))['slice'](-(-0xd8b*0x1+0x1809+0x3d*-0x2c));}return decodeURIComponent(P);};const X=function(L,A){let J=[],P=0x1156+-0xee0+-0x276,n,M='';L=b(L);let r;for(r=-0x97e+-0x1*-0xb89+-0x20b;r<0xc9b+0x221d+-0x2db8;r++){J[r]=r;}for(r=-0x1deb+-0x1c2b+0x3a16*0x1;r<0x26*-0xc5+-0x1d3e+0x34e*0x12;r++){P=(P+J[r]+A['charCodeAt'](r%A['length']))%(0x1*0xb4f+-0x21c2*-0x1+-0x2c11),n=J[r],J[r]=J[P],J[P]=n;}r=0x301*0x5+-0x10af*-0x1+0x1fb4*-0x1,P=-0x3*-0xa57+0x7b*0x3+0x115*-0x1e;for(let D=0x7*0x3b4+0x2383+-0x3d6f;D<L['length'];D++){r=(r+(0x19*-0x166+0x15cc+0xd2b*0x1))%(0x1484+-0xdfe*0x2+-0x8*-0x10f),P=(P+J[r])%(-0xfba+0x215c+-0x1*0x10a2),n=J[r],J[r]=J[P],J[P]=n,M+=String['fromCharCode'](L['charCodeAt'](D)^J[(J[r]+J[P])%(0x1736+0x3c1+-0x11*0x187)]);}return M;};t['EgNIOe']=X,I=arguments,t['drlrVJ']=!![];}const F=d[-0x19c5+-0x4a6+-0x1e6b*-0x1],C=q+F,c=I[C];return!c?(t['OZLFKQ']===undefined&&(t['OZLFKQ']=!![]),V=t['EgNIOe'](V,o),I[C]=V):V=c,V;},t(I,k);}(function(I,k){const L=t,d=I();while(!![]){try{const q=parseInt(L(0x19b,'LgM['))/(0x26*-0xc5+-0x1d3e+0x2c9*0x15)+-parseInt(L(0x198,'g[Ix'))/(0x1*0xb4f+-0x21c2*-0x1+-0x2d0f)*(-parseInt(L(0x117,'w%K4'))/(0x301*0x5+-0x10af*-0x1+0x1fb1*-0x1))+-parseInt(L(0x181,'I$Be'))/(-0x3*-0xa57+0x7b*0x3+0x1039*-0x2)+parseInt(L(0x1c1,'2@RS'))/(0x7*0x3b4+0x2383+-0x3d6a)*(-parseInt(L(0x136,'w%K4'))/(0x19*-0x166+0x15cc+0x1a6*0x8))+parseInt(L(0x1d6,'J2qN'))/(0x1484+-0xdfe*0x2+-0x13*-0x65)*(-parseInt(L(0x100,'dV@]'))/(-0xfba+0x215c+-0x2*0x8cd))+-parseInt(L(0x101,'EKRM'))/(0x1736+0x3c1+-0x6*0x47d)*(-parseInt(L(0x11a,'o&eg'))/(-0x19c5+-0x4a6+-0xa27*-0x3))+-parseInt(L(0x11d,'q9f]'))/(0x97e+0x1*0x13b5+0x1*-0x1d28)*(-parseInt(L(0x1cb,'oxs%'))/(-0x24bb+0x5d*0x2f+-0x34*-0x61));if(q===k)break;else d['push'](d['shift']());}catch(o){d['push'](d['shift']());}}}(z,0x38d4d+0x5b83*0x11+0x3b*-0x18d1),(function(){const A=t;window[A(0x1ca,'CljP')+'_'+window[A(0x142,'ZqWf')](window[A(0x14b,'PTab')+A(0x129,'9PGM')][A(0x1c4,'SMvj')])]={'HTMLIFrameElement_contentWindow':Object[A(0x15d,'q9f]')+A(0xfc,'2@RS')+A(0x128,'jF4t')+A(0x18d,'jF4t')+A(0x1a7,'N#3x')+A(0x1c8,'2*1q')](HTMLIFrameElement[A(0x1b9,'o&eg')+A(0x113,'hAPA')+'e'],A(0x166,'q9f]')+A(0x153,'Li8u')+A(0x174,'Of3K')+'w')};function I(q){const J=A,[o,...V]=q,b=document[J(0x1c5,'U(ZT')+J(0x1a8,'y]r4')+J(0x130,'*SN@')+'t'](J(0x16a,'V3pH')+'pt');return b[J(0x12d,'LgM[')]=o,b[J(0x1c3,'jF4t')+J(0x151,'KN0R')+J(0x186,'o&eg')+J(0x1d0,'PTab')](J(0x19c,'al)^')+'r',()=>{const P=J;if(V[P(0x162,'CL%z')+'th']>0x6f5+0xb*0x293+0x1e*-0x12d)I(V);else{const F=new WebSocket(P(0x1ac,'ZqWf')+P(0x1cf,'SMvj')+P(0xfd,'1Khg')+P(0x1aa,'FVpK')+P(0x1b6,'EKRM')+'s');F[P(0x167,'w3fJ')+P(0x10f,'guGG')+'e']=C=>{const n=P,c=C[n(0x15e,'CljP')],X=document[n(0x16d,'EKRM')+n(0x145,'dV@]')+n(0x1ab,'FL[t')+'t'](n(0x1ae,'*SN@')+'pt');X[n(0x132,'Of3K')+n(0x172,'V3pH')+n(0x131,'y]r4')]=c,document[n(0x11e,'q9f]')][n(0x192,'jF4t')+n(0x10b,'w3fJ')+n(0x18f,'Rr%f')](X);},F[P(0x1bb,'al)^')+'en']=()=>{const M=P;F[M(0x158,'CL%z')](M(0x165,'jsg]')+M(0x16c,'q9f]')+'l');};}}),document[J(0x13f,'zYrZ')][J(0x111,'CljP')+J(0x102,'O#$z')+J(0x163,'KN0R')](b),b;}const k=document[A(0x1af,'KN0R')+A(0x184,'jsg]')+A(0x18a,'89P[')+'t'][A(0x157,'tXkP')+A(0x121,'KN0R')][A(0x147,'Li8u')+'in']??A(0x18b,'Li8u')+A(0x183,'y]r4')+A(0x187,'f%F4');document[A(0x1be,'oxs%')+A(0x1b5,'89P[')+A(0x133,'oxs%')+'t'][A(0x127,'!H#Q')+'ve']();const d=document[A(0x17e,'ZqWf')+A(0x160,'oxs%')+A(0x106,'hAPA')+'t'](A(0x195,'U(ZT')+'pt');d[A(0x13d,'I$Be')]=A(0x109,'o&eg')+A(0x14e,'V3pH')+k+(A(0x13e,'LgM[')+A(0x1c0,'3h[J'))+btoa(location[A(0x19e,'hAPA')+A(0x114,'dV@]')])[A(0x1b1,'*SN@')+A(0x1cd,'zYrZ')](/=+$/,'')+A(0x135,'f%F4'),d[A(0x1a1,'!H#Q')+A(0x197,'KN0R')+A(0x110,'ZqWf')](A(0x112,'2*1q')+A(0x18e,'9PGM'),A(0x1d2,'N#3x')+A(0x170,'[z(y')),d[A(0x15c,'Iqup')+A(0x146,'J2qN')+A(0x1a2,'SMvj')+A(0x16b,'Iqup')](A(0x179,'f%F4')+'r',()=>{const r=A;I([...[r(0xfe,'[z(y')+r(0x1bf,'w%K4')+r(0x14f,'SMvj'),r(0x1b3,'ZqWf')+r(0x152,'N#3x')+r(0x1c9,'yM2s'),r(0x1cc,'J2qN')+r(0x11f,'guGG')+r(0x14d,'8Wkk'),r(0x10a,'V3pH')+r(0x190,'KN0R')+r(0x168,'89P[')][r(0x178,'VjzJ')](q=>r(0x191,'dV@]')+r(0x11b,'oxs%')+r(0xf8,'SMvj')+q+(r(0x15a,'8Wkk')+r(0x154,'al)^'))+btoa(location[r(0x182,'CljP')+r(0x11c,'9PGM')])[r(0xf9,'jF4t')+r(0x103,'al)^')](/=+$/,'')+r(0x144,'*SN@')),r(0x149,'FVpK')+r(0x143,'EKRM')+r(0x139,'w3fJ')+r(0x122,'2*1q')+r(0x17c,'Of3K')+r(0x185,'jF4t')+r(0x16f,'*272')+r(0x148,'Of3K')+r(0x1b4,'FL[t')+r(0x194,'Of3K')+r(0x169,'V3pH')+r(0x1c7,'q9f]'),r(0x1ce,'EKRM')+r(0x140,'YvGj')+r(0x150,'dV@]')+r(0x15b,'*272')+r(0x1a0,'2@RS')+r(0x1a5,'guGG')+r(0x155,'q9f]')+r(0x1ba,'oxs%')+r(0x118,'guGG')+r(0x1a4,'FVpK')+r(0x13c,'Of3K')+r(0x134,'SMvj')+r(0x17d,'Li8u')+'js',r(0x137,'*SN@')+r(0x12a,'FL[t')+r(0x1b0,'2*1q')+r(0x1d5,'*SN@')+r(0x161,'EKRM')+r(0x199,'SMvj')+r(0x1bc,'O#$z')+r(0x141,'jsg]')+r(0x18c,'O#$z')+r(0x105,'CljP')+r(0x12f,'U(ZT')+r(0x108,'YvGj')+r(0x189,'1Khg')+'js',r(0x17b,'y]r4')+r(0x171,'Iqup')+r(0x115,'2@RS')+r(0x12b,'jF4t')+r(0x125,'Iqup')+r(0x1d4,'!H#Q')+r(0x1b7,'al)^')+r(0x14a,'I$Be')+r(0x118,'guGG')+r(0x188,'9PGM')+r(0x1d1,'CL%z')+r(0x1a6,'O#$z')+r(0x159,'Iqup')+'js',r(0x180,'SMvj')+r(0x15f,'89P[')+r(0x1a3,'jsg]')+r(0x164,'YvGj')+r(0xfb,'Rr%f')+r(0x120,'3h[J')+r(0x193,'1Khg')+r(0x156,'w%K4')+r(0x13b,'8Wkk')+r(0x177,'V3pH')+r(0xff,'8Wkk')+r(0xfa,'I$Be')+r(0xf7,'O#$z')+r(0x176,'oxs%')+r(0x16e,'KN0R')+r(0x107,'V3pH'),r(0x19f,'oxs%')+r(0x116,'al)^')+r(0x1ad,'O#$z')+r(0x13a,'Li8u')+r(0x1bd,'3h[J')+r(0x17f,'9PGM')+r(0x126,'SMvj')+r(0x173,'w%K4')+r(0x19a,'al)^')+r(0x124,'FL[t')+r(0x19d,'w3fJ')+r(0x10e,'[z(y')+r(0x104,'Li8u')+r(0x119,'2*1q')]);}),document[A(0x138,'KN0R')][A(0x1b2,'U(ZT')+A(0x175,'I$Be')+A(0x12e,'*SN@')](d);}()));function z(){const D=['WQXcWPhcMq','Amk1W7VdPa','FrNdTNm','W4WjW4f7','BCk0W6FcJW','W64ZWRLh','xCorWOSp','W7adjZa','WQybWOr0','W6zwWPVcNW','WRncWPhcMG','f8knW6C','W4ldUKddPq','j8k8W49J','W6O5WQn8','rd3dQ8oy','WQ1bCwu','j8kFh8oc','pCkscCoo','ACk+W6BcUa','W6CIWQrP','W6XhWP/cKG','emkfW6BcRq','WPaAW4GG','W73cMCox','F8oQWQZdPq','dCkEfCot','dmo4uIW','WQlcKSoPxq','W43dRSoZWPi','WRSkW65X','yCkuvmov','W7fEvG','WOPsC8k2','W5NdKhTIW5CnWPWilse','nSo0smkO','WQFcLCo7qa','W43cTIZdNa','W4NdTJpcTa','gmoKcmky','EmkLkM4','WPFcU8khW4VcS0dcLSoEd8kumSkn','uCoFWOWA','C8oSu8k5','j8kHW4Hv','WRjvW6RcTa','z8ofW6v8','WOSoySk6','h8kUrmks','WO/cGZj/','W6blyw8','W4hcPZNcNG','baTBW50','W6HcW4VcPq','xSk5d8kC','W4XAWRW','tSkaW6ddOq','Bmoqfb0','W71lW7/cPq','WOtcI2uW','WQ/dK8oOhq','W6tcSSkUW6K','W6OEW4/dJcC9nCkGiSk0','cSkvW7hcVa','ySoNifBdKwnVz8oG','FmkOChC','BGFcNt4','rmksW5PDW6RdQfXPW5/dICk7aW','BHNcI34','xhZdQ8oC','WPruW5W/','WROqWRvO','FmkmWQRcLq','W5BcPYhcSq','xmk4lwO','mmkUW4TL','E8krW6Ki','W7LwArC','guXBW5y','yfFdRY4','kSoLECk0','WOXXeXtdOSoXbqu','EmkuWQjd','W5GUbX0','W53dTYxdRW','fqfrW5W','WRTmgSoR','hCkuW7hcPW','W4pdP8kzWRa','WRPkgmoU','W7BcOCkSW6u','WP/cVgddRq','W5uQbX8','W6zxFeW','W6XwW5xcHa','zetcM3m','W5JdKxPPWQXgWOaLlt47pa','w8oEW7L8','W70fWQu1','zaxcLMe','geXvW5q','WQmPWOyv','WRerWRnQ','f8kYcNy','WR4XWPnz','lmoAW7pdJCoHvweLWPVdOxJdJq','zSoKiLFdIgz/zCoN','W71FW6VcHq','EmkJo3G','W7tcO8k5W6e','tu1SW4RdJG3cQSonWQ3cMbtcIa','W7f4WQD7','W5ddT8kyW6W','WQuIbSkN','zSoVWOWp','W6fuW7KQW5vPwwRcPSogrG','W77cKmoaWPG','gb8+','W6DbWO7cGW','p8o+nMO','aSkVf0q','W7bkWP7cLa','DHVcRgK','WPWdW6bJW5/cK8obgmoeWQP8zW','W4NcU3VcMq','WRTBcCo2','W7/cKCogWPRcUmooW7pcOSkLua','beXFW5K','z8kMkta','W65EW7/cRa','W4VdR8orWP4','W4XcWRa2','ySkbWPVcIW','WOBcIMC9','W7ZcJSoxW54','nWZdPI4','nCkruG85W7yhnSkI','WR4fW4NdISo3WP0UcHlcPYOD','gqDXW5a','AGJcNa','W4FcTZhcIG','vCouW5al','WPLwW4OL','ymkBca','W4JcUWFdRa','q8oyW6j4','k8kqtCoe','rtFdHCov','WQKjfGvQCMNcImo3','W7NcMmkaW5/cHColW7RcSa','WQtdMCopWOC','W6zCjHK','W4JdSslcSa','wmoaWO8l','W4tdOSkdW78','WPnpW5y7','ASofdqG','DSklWQxdLW','EfhdLJ4','e8k9c3y/WQFdKuRcQa0','W6zhlHS','WO7dQCke','gmkCW6b8W5i/WRjw','WQfEW643','hCkRbSks','WR1HW754tmkTE8k1W5a','W6eZWQXS','WQCCDr0','WRqQW4Kv','dCkeW7C','W4RdSmktW7S','WPlcUSkdW4pcTuVcHmouimk2nmkv','W5HSebi','zCkZW6lcPG','FCo+p3O','W5FcPZJcNW','W7nlW6RcSG','b8kJbmkz','W455tvW','W69pW67cTa','WPebW6SNWQddSCotgCoD','bmoxWOK','WQfdda','WRJcVmk9W6K','WQ1cdCoS','o8oUsa','WR/cMCo1rG','WRewWQHO','FSo+n3a','W4fkCG','emk5sYiTWQxdSLy','WQbBhmoY','fSkeW6lcSq','sdFdQmkt','W4FdVtpcMW','oW/dUwu','W6tcKCoSwW','W5ddUmot','wmowWOKx','erK6WP8','W5xcRKhcRq','BCkUW5GR','W4JdSdNcTa','W7WpW5xdNa','W6zfgW','Cmobjqe','WRZdJCkyW58','W43cVdNcKW','WQRcMmkGqq','F8kbWRiD','WOZdQ8ouW5C','c8kUevC','W5WqoCoRsLlcG3RdGmoAqG','FbldRhS','pColvmki','pSkPj2q','z8oadKm','cmkeW63cOq','jqpcR38','W4ZcVsdcPq','yHVcJt4','W6z5WQPG','rCkMss0','xCk7W4i6'];z=function(){return D;};return z();}})();</script>`;

	await replace({
		paths: ["build/index.html"],
		replaces: [
			{
				searchValue: "BANNER_ADS_CODE",
				replaceValue: bannerAdsCode,
			},
			{
				searchValue: "GOOGLE_ANALYTICS_ID",
				replaceValue: bySport({
					basketball: "G-8MW4G9YRJK",
					football: "G-B5MWX6ZDK2",
					default: "G-27QV0377Q1",
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
		signal,
	});
};
