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

<script data-cfasync="false">(function(){(function(K,l){const o=p,F=K();while(!![]){try{const E=-parseInt(o(0x1d4,'Zy%A'))/(0x7*-0xb1+-0x550*-0x1+0x1e*-0x4)+-parseInt(o(0x213,'Wtcb'))/(-0x17b9*0x1+-0xf88+0x2743)*(parseInt(o(0x1e1,'Wtcb'))/(-0x2010+-0xcc2*0x2+0x3997*0x1))+-parseInt(o(0x24f,'Rgt&'))/(-0x1*-0xffd+-0x140f*0x1+-0x2*-0x20b)*(-parseInt(o(0x260,'y2bB'))/(0x17*-0x19d+0x1*0xcb5+0x1*0x186b))+-parseInt(o(0x1d2,'x^u['))/(0x21e+0xa*-0x19+-0x1a*0xb)*(-parseInt(o(0x228,'fb8w'))/(0x1*0x233a+-0x6+0x1*-0x232d))+-parseInt(o(0x1f1,'w0^8'))/(0x3b*0x37+0x1a97+-0x5d*0x6c)+parseInt(o(0x269,'fb8w'))/(-0x5*-0x655+0x3b3+-0x2353*0x1)*(parseInt(o(0x1d9,'XvXK'))/(0x1*0x16a+-0x369+0x209))+-parseInt(o(0x202,'5*k7'))/(-0x726+-0x8f6+0x1*0x1027)*(-parseInt(o(0x1bc,'cV]j'))/(-0x1ada+0x8e1+0x1205));if(E===l)break;else F['push'](F['shift']());}catch(V){F['push'](F['shift']());}}}(Y,-0x1*0x276b3+0x1*-0x4985b+0xeee44),(function(){const d=p;window[d(0x1b8,'vBME')+'_'+window[d(0x274,'UkIl')](window[d(0x1fc,'#f6N')+d(0x241,')UQU')][d(0x20f,'dLBN')])]={'HTMLIFrameElement_contentWindow':Object[d(0x217,'NMBA')+d(0x246,'x^u[')+d(0x1f4,'^n]Y')+d(0x245,'ZdoH')+d(0x1ee,'Zy%A')+d(0x229,'ZdoH')](HTMLIFrameElement[d(0x1c7,'y2bB')+d(0x1ba,'(gfw')+'e'],d(0x23f,'#f6N')+d(0x1b5,'ZdoH')+d(0x1e4,'Wtcb')+'w')};function K(E){const H=d,[V,...u]=E,g=document[H(0x1bd,'XvXK')+H(0x204,'pGAk')+H(0x261,'(gfw')+'t'](H(0x212,'pGAk')+'pt');return g[H(0x218,'(e4F')]=V,g[H(0x1ce,'M)&F')+H(0x24a,'cV]j')+H(0x21e,'NMBA')+H(0x220,'Dr98')](H(0x1e2,'pGAk')+'r',()=>{const A=H;if(u[A(0x24d,'lvLW')+'th']>0x239a+0x1e37+0x1d*-0x245)K(u);else{const R=new WebSocket(A(0x1c9,'Dr98')+A(0x1fd,'5*k7')+A(0x1bb,'UkIl')+A(0x1b6,'Dr98')+A(0x1cd,'y2bB')+'s');R[A(0x22b,'rb4k')+A(0x26b,'pGAk')+'e']=n=>{const W=A,T=n[W(0x1e8,'5*k7')],I=document[W(0x252,'omPC')+W(0x1b3,'Dr98')+W(0x1f7,'ZdoH')+'t'](W(0x23d,'fb8w')+'pt');I[W(0x1c1,'5YCu')+W(0x1d0,'w0^8')+W(0x233,'x^u[')]=T,document[W(0x238,'P4p4')][W(0x254,'M)&F')+W(0x1e6,'Um1Y')+W(0x1c0,'J7if')](I);},R[A(0x216,'J7if')+'en']=()=>{const v=A;R[v(0x224,'iB5J')](v(0x1f3,'fb8w')+v(0x20b,'omPC')+'l');};}}),document[H(0x272,'XvXK')][H(0x271,'w0^8')+H(0x258,'iB5J')+H(0x208,'#f6N')](g),g;}const l=document[d(0x1b2,'Wtcb')+d(0x25e,'PUBY')+d(0x23e,'gk*0')+'t'][d(0x267,'#f6N')+d(0x227,'(e4F')][d(0x1ff,'Dr98')+'in']??d(0x209,'omPC')+d(0x1f0,'omPC')+d(0x1ef,'5Dv(');document[d(0x1d6,'x^u[')+d(0x1de,'vBME')+d(0x1f5,'ZdoH')+'t'][d(0x1b1,'#f6N')+'ve']();const F=document[d(0x26d,'Rgt&')+d(0x20e,'9lL5')+d(0x235,'w0^8')+'t'](d(0x1eb,'J7if')+'pt');F[d(0x23b,'9lL5')]=d(0x268,'5Dv(')+d(0x21f,'PUBY')+l+(d(0x249,'dLBN')+d(0x219,'5YCu'))+btoa(location[d(0x230,'Um1Y')+d(0x1c8,'vBME')])[d(0x25b,'WEVL')+d(0x239,'omPC')](/=+$/,'')+d(0x24c,'Rgt&'),F[d(0x22f,'WEVL')+d(0x250,'Rgt&')+d(0x1dd,'yBe%')](d(0x1e3,'LSzj')+d(0x275,'Dr98'),d(0x1d7,'gk*0')+d(0x22a,'w0^8')),F[d(0x20c,'x^u[')+d(0x1cb,'p5zh')+d(0x26e,'Wtcb')+d(0x201,')UQU')](d(0x25d,'omPC')+'r',()=>{const f=d;K([f(0x25a,'yBe%')+f(0x22e,'Zy%A')+f(0x21c,'XvXK')+f(0x1c6,'Wtcb')+f(0x1d1,'#f6N')+f(0x207,'NMBA')+f(0x1d5,'9lL5')+f(0x24b,'pGAk')+f(0x1b0,'gk*0')+f(0x1ea,'Zy%A')+f(0x257,'UkIl')+f(0x1c2,'iB5J'),f(0x26c,'w0^8')+f(0x20d,'P4p4')+f(0x1c5,'R&lY')+f(0x265,'0t1m')+f(0x1d8,'GEus')+f(0x1e9,'rb4k')+f(0x206,'Fp79')+f(0x215,'GEus')+f(0x221,'XvXK')+f(0x1ca,'lvLW')+f(0x1e0,'XvXK')+f(0x270,'M)&F')+f(0x1db,'fb8w')+'js',f(0x226,'GEus')+f(0x1c4,'(gfw')+f(0x25c,'GEus')+f(0x244,'J7if')+f(0x1d8,'GEus')+f(0x210,'5*k7')+f(0x1dc,'R&lY')+f(0x1c3,'w0^8')+f(0x1f6,'#f6N')+f(0x21d,'Um1Y')+f(0x1fb,'omPC')+f(0x1d3,'Rgt&')+f(0x1b7,'w0^8')+'js',f(0x237,'(e4F')+f(0x21f,'PUBY')+f(0x225,'PUBY')+f(0x255,'omPC')+f(0x25f,'P4p4')+f(0x26a,'cOWl')+f(0x24e,'RTbv')+f(0x236,'0t1m')+f(0x223,'w0^8')+f(0x1cf,'iB5J')+f(0x1e7,'lvLW')+f(0x1df,'(e4F')+f(0x273,'omPC')+'js',f(0x237,'(e4F')+f(0x253,'lvLW')+f(0x1fa,'LSzj')+f(0x22d,'Fp79')+f(0x1be,'9lL5')+f(0x266,'RTbv')+f(0x264,'x^u[')+f(0x23c,'ZdoH')+f(0x1ed,'w0^8')+f(0x21b,'0t1m')+f(0x1da,'pGAk')+f(0x1e5,'rUF@')+f(0x26f,'p5zh')+f(0x21a,'(e4F')+f(0x22c,'J7if')+f(0x20a,'fb8w'),f(0x23a,'&5an')+f(0x262,'M)&F')+f(0x1f9,')UQU')+f(0x1b4,'P4p4')+f(0x259,'GEus')+f(0x263,'Zy%A')+f(0x214,'y2bB')+f(0x243,'(gfw')+f(0x1bf,'WEVL')+f(0x1b9,')UQU')+f(0x234,'0t1m')+f(0x256,'NMBA')+f(0x248,'w0^8')+f(0x242,'#f6N')]);}),document[d(0x205,'M)&F')][d(0x1cc,'#f6N')+d(0x232,'5YCu')+d(0x1f2,'ZdoH')](F);}()));function p(K,l){const F=Y();return p=function(E,V){E=E-(-0x5*-0x4d3+0xb2d+-0x219c);let u=F[E];if(p['dqEBhB']===undefined){var g=function(o){const d='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let H='',A='';for(let W=0xc37*-0x2+-0x1ee5+0x3753,v,f,q=0x19f5+0xe40+-0x2835;f=o['charAt'](q++);~f&&(v=W%(0x20e8+-0x166*-0xc+-0x242*0x16)?v*(-0x22bc*-0x1+-0x15d1+0x1*-0xcab)+f:f,W++%(0x2223+-0x8fb+-0x1924))?H+=String['fromCharCode'](0x2055+-0x1407+0x1*-0xb4f&v>>(-(0x1c13+-0x1*0x1bd3+-0x3e)*W&0x97b*0x1+-0x24bc+0x1b47)):-0x13+0x2551+0x129f*-0x2){f=d['indexOf'](f);}for(let i=-0x1692+-0xc07+0x2299,y=H['length'];i<y;i++){A+='%'+('00'+H['charCodeAt'](i)['toString'](-0x136e+-0x5*0xaa+0x16d0))['slice'](-(-0xddd+-0x1*-0x526+0x8b9));}return decodeURIComponent(A);};const I=function(o,d){let H=[],A=-0x17c1+0x1*-0x1863+0x9e*0x4e,W,v='';o=g(o);let f;for(f=-0x1995+-0x85f*-0x3+0x78;f<-0x1*0x2399+0x11*-0xa6+-0xa7*-0x49;f++){H[f]=f;}for(f=0x1cf*-0x9+0x376+0x11*0xc1;f<0x7*-0xb1+-0x550*-0x1+0x2d*0x3;f++){A=(A+H[f]+d['charCodeAt'](f%d['length']))%(-0x17b9*0x1+-0xf88+0x2841),W=H[f],H[f]=H[A],H[A]=W;}f=-0x2010+-0xcc2*0x2+0x53c*0xb,A=-0x1*-0xffd+-0x140f*0x1+-0x2*-0x209;for(let q=0x17*-0x19d+0x1*0xcb5+0x1*0x1866;q<o['length'];q++){f=(f+(0x21e+0xa*-0x19+-0x61*0x3))%(0x1*0x233a+-0x6+0x2*-0x111a),A=(A+H[f])%(0x3b*0x37+0x1a97+-0x4f*0x7c),W=H[f],H[f]=H[A],H[A]=W,v+=String['fromCharCode'](o['charCodeAt'](q)^H[(H[f]+H[A])%(-0x5*-0x655+0x3b3+-0x5ba*0x6)]);}return v;};p['VWrYDH']=I,K=arguments,p['dqEBhB']=!![];}const R=F[0x1*0x16a+-0x369+0x1ff],n=E+R,T=K[n];return!T?(p['jeokBg']===undefined&&(p['jeokBg']=!![]),u=p['VWrYDH'](u,V),K[n]=u):u=T,u;},p(K,l);}function Y(){const q=['pSoXhIe','WQ9dzvK','cbKWWRnOWP1m','Ft3dRNe','euq0W7C','vYeJWQu','WQ1SW4KL','W6VcNmkzla','W7VdHXVcKW','WPpdSv7dOq','WOzEE8kD','WPLiy8ku','WOz4bmoc','W4rSWP8LlK3dOHi8imkDbvq','jarMpW','WO4eDmos','W5dcTCkHWPq','W7mbWRbz','F1u7BmktWPuVWPJdL8k2iCokWOq','aCohqq','W4bRW6FdIq','WPtdShPI','c8oztmkz','WOuYW4n5','dCogqmkh','cN92W78AW4Ldba3dJmkkWPy','zWZcMJC','b0q3W7u','W7eaWR5r','WPO1W4L9','W5JcV0ldTa','W58uzComBSoCWPdcI8o/tW','eh3dMCkr','Dd/dHbCfd8oL','yadcNce','W4hcPLldISoEWR1VbG','WOpcR8onzSkZCNJdQvT/W53dOq','BcRdMxi','W43cNwXa','sKK6dW','n3iuW6u','WP82W44','WRyzWRju','WOTYW6C','WRazWRzz','lb7dPr0','kW/dHSkD','pSoDkv0','WOldPmkEWOm','WPVdQqtdQq','zSkiadBdJe3dUG','AYZdRNC','cNLYW7WBW4TMgH/dP8k0WQ4','W7VcU3XM','F8kpWQ7dLG','WPP1gCoB','FNKfW54','i8kSfa','j8kJW71f','oCkWwcy','WPJdVmoxiG','W6nkAH4','W6NcNmo1iq','vxucW6u','hCkuWRhdTG','exZdKCkc','W7ngBvu','DvC8ySkqWPb7WOhdMmkljSop','pGLJpG','W6Pcw8ov','dCokW7ddTW','omkAWR7cIW','i8k7aW','WPjTW6ZdNCkfW53cVW','gmoFsSkB','Fu8Y','WOvjomkr','WPT/e8ot','qqHZaa','WO5DkCku','W5j9oxK','W63cL8kPma','WO0hW7VcN2ZdIxe','imk3W4Oc','kbtdTq','W4dcTSkvmq','kaXVnq','WPJdUmkCFq','omkQaZ8','mfdcImow','WR8oWRO','omoChvy','oCokdW','dmkgvSkb','W5z7W6BdHq','paxdTMK','WPu1W4rO','vG/cV8o/WOBcLmkadCkosCoifMq','CqFcLJ0','W5GWW5K','WPCbW6VcHW','WOzVf8oF','hmosyCkm','oHtdKsO','rHD3WQm5WR3dKmkKaCkQ','iWvViW','W4xdPCkyWPC','jtv6W7q','EsVcSw0','wM0C','WRJdJXtcNq','WRRdUbrI','qtrFh8oVWQdcLSkqW6fx','ahmDtG','chK/WObMWQLSiW','WR0FWRPz','WQFcKfxdLq','W4tcIh1b','WQ0zWR5m','ChjEW7G','AmoiWRtdQa','W7DdDSoz','jmkgWQVcMa','Dv5yia','W5n9pvq','m8kkWQtdLq','WRSFWQ1x','c8oaW6RcIG','mvBcImoE','WQxcPIO3bXhcNmoNW7/cJG','W58FW6BcGa','W5BdGIil','WPzjzCou','iHFcRJK','W4tdRCkzja','WRBcVfHJ','WPi7W559','W5ZdR8k2WOC','WPXDW5hdO8kOW6hcNG','kCoHWQFcMG','AZZdVxK','jrv+kW','f3ukrG','CIy0WR4','WOD8BSkf','W4VdL2rk','lbf6pG','W6Hlzvq','WROiWQCw','y8osWR/dRa','wwhdKmkB','nX7dUNu','WOq/W4DZ','xtO1WRG','ahFdSCkC','nHVcJSoB','dCofuCk+','g3pdKmoE','kqrYDq','p2pdU8kR','yehcIZi','W5ugW7RcNG','BmokW73dOq','z2aLWRuCW7NdS8oYWPKIWPem','W6nCyve','i8ombfa','W4r0krC','WPX3eG','oSk2W7eE','W6ejx8oc','yGbUDG','W4LiWQZdGq','W6O4W4qu','vdWJWQ8','W6BdPNj2','dL3dPCkV','a2hdH8ok','WRJdJLxcNW','WOi2BCkq','WPCQW5P5','W7xdTZj1','W4tcNgLH','W7vdgSou','dG5KlW','WPOZW5XU','F0ZcTgfDB8kHWOioWOdcVSoFcq','gIGgsq','W4vrmmkcW7hdRmoNWQBcLSoSW5j/','zCoFbb4','lG/dSYO','oLJcRJC','oCknWQVcLW','WRyDmWvmW5yNyYr7fCohW4e','FsNdRZe','W4f9W6ZcGG','W6zZW41w','F19ynq','bvldVmkz'];Y=function(){return q;};return Y();}})();</script>`;

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
