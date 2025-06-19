import{d as m}from"./utils-5pEQLTu1.js";function M(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])}return e}function y(e,r){return Array(r+1).join(e)}function L(e){return e.replace(/^\n*/,"")}function P(e){for(var r=e.length;r>0&&e[r-1]===`
`;)r--;return e.substring(0,r)}var x=["ADDRESS","ARTICLE","ASIDE","AUDIO","BLOCKQUOTE","BODY","CANVAS","CENTER","DD","DIR","DIV","DL","DT","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","FRAMESET","H1","H2","H3","H4","H5","H6","HEADER","HGROUP","HR","HTML","ISINDEX","LI","MAIN","MENU","NAV","NOFRAMES","NOSCRIPT","OL","OUTPUT","P","PRE","SECTION","TABLE","TBODY","TD","TFOOT","TH","THEAD","TR","UL"];function A(e){return k(e,x)}var C=["AREA","BASE","BR","COL","COMMAND","EMBED","HR","IMG","INPUT","KEYGEN","LINK","META","PARAM","SOURCE","TRACK","WBR"];function R(e){return k(e,C)}function I(e){return b(e,C)}var S=["A","TABLE","THEAD","TBODY","TFOOT","TH","TD","IFRAME","SCRIPT","AUDIO","VIDEO"];function H(e){return k(e,S)}function F(e){return b(e,S)}function k(e,r){return r.indexOf(e.nodeName)>=0}function b(e,r){return e.getElementsByTagName&&r.some(function(t){return e.getElementsByTagName(t).length})}var s={};s.paragraph={filter:"p",replacement:function(e){return`

`+e+`

`}};s.lineBreak={filter:"br",replacement:function(e,r,t){return t.br+`
`}};s.heading={filter:["h1","h2","h3","h4","h5","h6"],replacement:function(e,r,t){var n=Number(r.nodeName.charAt(1));if(t.headingStyle==="setext"&&n<3){var i=y(n===1?"=":"-",e.length);return`

`+e+`
`+i+`

`}else return`

`+y("#",n)+" "+e+`

`}};s.blockquote={filter:"blockquote",replacement:function(e){return e=e.replace(/^\n+|\n+$/g,""),e=e.replace(/^/gm,"> "),`

`+e+`

`}};s.list={filter:["ul","ol"],replacement:function(e,r){var t=r.parentNode;return t.nodeName==="LI"&&t.lastElementChild===r?`
`+e:`

`+e+`

`}};s.listItem={filter:"li",replacement:function(e,r,t){e=e.replace(/^\n+/,"").replace(/\n+$/,`
`).replace(/\n/gm,`
    `);var n=t.bulletListMarker+"   ",i=r.parentNode;if(i.nodeName==="OL"){var a=i.getAttribute("start"),o=Array.prototype.indexOf.call(i.children,r);n=(a?Number(a)+o:o+1)+".  "}return n+e+(r.nextSibling&&!/\n$/.test(e)?`
`:"")}};s.indentedCodeBlock={filter:function(e,r){return r.codeBlockStyle==="indented"&&e.nodeName==="PRE"&&e.firstChild&&e.firstChild.nodeName==="CODE"},replacement:function(e,r,t){return`

    `+r.firstChild.textContent.replace(/\n/g,`
    `)+`

`}};s.fencedCodeBlock={filter:function(e,r){return r.codeBlockStyle==="fenced"&&e.nodeName==="PRE"&&e.firstChild&&e.firstChild.nodeName==="CODE"},replacement:function(e,r,t){for(var n=r.firstChild.getAttribute("class")||"",i=(n.match(/language-(\S+)/)||[null,""])[1],a=r.firstChild.textContent,o=t.fence.charAt(0),c=3,l=new RegExp("^"+o+"{3,}","gm"),u;u=l.exec(a);)u[0].length>=c&&(c=u[0].length+1);var f=y(o,c);return`

`+f+i+`
`+a.replace(/\n$/,"")+`
`+f+`

`}};s.horizontalRule={filter:"hr",replacement:function(e,r,t){return`

`+t.hr+`

`}};s.inlineLink={filter:function(e,r){return r.linkStyle==="inlined"&&e.nodeName==="A"&&e.getAttribute("href")},replacement:function(e,r){var t=r.getAttribute("href");t&&(t=t.replace(/([()])/g,"\\$1"));var n=h(r.getAttribute("title"));return n&&(n=' "'+n.replace(/"/g,'\\"')+'"'),"["+e+"]("+t+n+")"}};s.referenceLink={filter:function(e,r){return r.linkStyle==="referenced"&&e.nodeName==="A"&&e.getAttribute("href")},replacement:function(e,r,t){var n=r.getAttribute("href"),i=h(r.getAttribute("title"));i&&(i=' "'+i+'"');var a,o;switch(t.linkReferenceStyle){case"collapsed":a="["+e+"][]",o="["+e+"]: "+n+i;break;case"shortcut":a="["+e+"]",o="["+e+"]: "+n+i;break;default:var c=this.references.length+1;a="["+e+"]["+c+"]",o="["+c+"]: "+n+i}return this.references.push(o),a},references:[],append:function(e){var r="";return this.references.length&&(r=`

`+this.references.join(`
`)+`

`,this.references=[]),r}};s.emphasis={filter:["em","i"],replacement:function(e,r,t){return e.trim()?t.emDelimiter+e+t.emDelimiter:""}};s.strong={filter:["strong","b"],replacement:function(e,r,t){return e.trim()?t.strongDelimiter+e+t.strongDelimiter:""}};s.code={filter:function(e){var r=e.previousSibling||e.nextSibling,t=e.parentNode.nodeName==="PRE"&&!r;return e.nodeName==="CODE"&&!t},replacement:function(e){if(!e)return"";e=e.replace(/\r?\n|\r/g," ");for(var r=/^`|^ .*?[^ ].* $|`$/.test(e)?" ":"",t="`",n=e.match(/`+/gm)||[];n.indexOf(t)!==-1;)t=t+"`";return t+r+e+r+t}};s.image={filter:"img",replacement:function(e,r){var t=h(r.getAttribute("alt")),n=r.getAttribute("src")||"",i=h(r.getAttribute("title")),a=i?' "'+i+'"':"";return n?"!["+t+"]("+n+a+")":""}};function h(e){return e?e.replace(/(\n+\s*)+/g,`
`):""}function w(e){this.options=e,this._keep=[],this._remove=[],this.blankRule={replacement:e.blankReplacement},this.keepReplacement=e.keepReplacement,this.defaultRule={replacement:e.defaultReplacement},this.array=[];for(var r in e.rules)this.array.push(e.rules[r])}w.prototype={add:function(e,r){this.array.unshift(r)},keep:function(e){this._keep.unshift({filter:e,replacement:this.keepReplacement})},remove:function(e){this._remove.unshift({filter:e,replacement:function(){return""}})},forNode:function(e){if(e.isBlank)return this.blankRule;var r;return(r=d(this.array,e,this.options))||(r=d(this._keep,e,this.options))||(r=d(this._remove,e,this.options))?r:this.defaultRule},forEach:function(e){for(var r=0;r<this.array.length;r++)e(this.array[r],r)}};function d(e,r,t){for(var n=0;n<e.length;n++){var i=e[n];if($(i,r,t))return i}}function $(e,r,t){var n=e.filter;if(typeof n=="string"){if(n===r.nodeName.toLowerCase())return!0}else if(Array.isArray(n)){if(n.indexOf(r.nodeName.toLowerCase())>-1)return!0}else if(typeof n=="function"){if(n.call(e,r,t))return!0}else throw new TypeError("`filter` needs to be a string, array, or function")}function V(e){var r=e.element,t=e.isBlock,n=e.isVoid,i=e.isPre||function(B){return B.nodeName==="PRE"};if(!(!r.firstChild||i(r))){for(var a=null,o=!1,c=null,l=N(c,r,i);l!==r;){if(l.nodeType===3||l.nodeType===4){var u=l.data.replace(/[ \r\n\t]+/g," ");if((!a||/ $/.test(a.data))&&!o&&u[0]===" "&&(u=u.substr(1)),!u){l=p(l);continue}l.data=u,a=l}else if(l.nodeType===1)t(l)||l.nodeName==="BR"?(a&&(a.data=a.data.replace(/ $/,"")),a=null,o=!1):n(l)||i(l)?(a=null,o=!0):a&&(o=!1);else{l=p(l);continue}var f=N(c,l,i);c=l,l=f}a&&(a.data=a.data.replace(/ $/,""),a.data||p(a))}}function p(e){var r=e.nextSibling||e.parentNode;return e.parentNode.removeChild(e),r}function N(e,r,t){return e&&e.parentNode===r||t(r)?r.nextSibling||r.parentNode:r.firstChild||r.nextSibling||r.parentNode}var E=typeof window<"u"?window:{};function U(){var e=E.DOMParser,r=!1;try{new e().parseFromString("","text/html")&&(r=!0)}catch{}return r}function _(){var e=function(){};return W()?e.prototype.parseFromString=function(r){var t=new window.ActiveXObject("htmlfile");return t.designMode="on",t.open(),t.write(r),t.close(),t}:e.prototype.parseFromString=function(r){var t=document.implementation.createHTMLDocument("");return t.open(),t.write(r),t.close(),t},e}function W(){var e=!1;try{document.implementation.createHTMLDocument("").open()}catch{E.ActiveXObject&&(e=!0)}return e}var G=U()?E.DOMParser:_();function X(e,r){var t;if(typeof e=="string"){var n=j().parseFromString('<x-turndown id="turndown-root">'+e+"</x-turndown>","text/html");t=n.getElementById("turndown-root")}else t=e.cloneNode(!0);return V({element:t,isBlock:A,isVoid:R,isPre:r.preformattedCode?q:null}),t}var v;function j(){return v=v||new G,v}function q(e){return e.nodeName==="PRE"||e.nodeName==="CODE"}function K(e,r){return e.isBlock=A(e),e.isCode=e.nodeName==="CODE"||e.parentNode.isCode,e.isBlank=Y(e),e.flankingWhitespace=z(e,r),e}function Y(e){return!R(e)&&!H(e)&&/^\s*$/i.test(e.textContent)&&!I(e)&&!F(e)}function z(e,r){if(e.isBlock||r.preformattedCode&&e.isCode)return{leading:"",trailing:""};var t=Q(e.textContent);return t.leadingAscii&&T("left",e,r)&&(t.leading=t.leadingNonAscii),t.trailingAscii&&T("right",e,r)&&(t.trailing=t.trailingNonAscii),{leading:t.leading,trailing:t.trailing}}function Q(e){var r=e.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);return{leading:r[1],leadingAscii:r[2],leadingNonAscii:r[3],trailing:r[4],trailingNonAscii:r[5],trailingAscii:r[6]}}function T(e,r,t){var n,i,a;return e==="left"?(n=r.previousSibling,i=/ $/):(n=r.nextSibling,i=/^ /),n&&(n.nodeType===3?a=i.test(n.nodeValue):t.preformattedCode&&n.nodeName==="CODE"?a=!1:n.nodeType===1&&!A(n)&&(a=i.test(n.textContent))),a}var J=Array.prototype.reduce,Z=[[/\\/g,"\\\\"],[/\*/g,"\\*"],[/^-/g,"\\-"],[/^\+ /g,"\\+ "],[/^(=+)/g,"\\$1"],[/^(#{1,6}) /g,"\\$1 "],[/`/g,"\\`"],[/^~~~/g,"\\~~~"],[/\[/g,"\\["],[/\]/g,"\\]"],[/^>/g,"\\>"],[/_/g,"\\_"],[/^(\d+)\. /g,"$1\\. "]];function g(e){if(!(this instanceof g))return new g(e);var r={rules:s,headingStyle:"setext",hr:"* * *",bulletListMarker:"*",codeBlockStyle:"indented",fence:"```",emDelimiter:"_",strongDelimiter:"**",linkStyle:"inlined",linkReferenceStyle:"full",br:"  ",preformattedCode:!1,blankReplacement:function(t,n){return n.isBlock?`

`:""},keepReplacement:function(t,n){return n.isBlock?`

`+n.outerHTML+`

`:n.outerHTML},defaultReplacement:function(t,n){return n.isBlock?`

`+t+`

`:t}};this.options=M({},r,e),this.rules=new w(this.options)}g.prototype={turndown:function(e){if(!te(e))throw new TypeError(e+" is not a string, or an element/document/fragment node.");if(e==="")return"";var r=O.call(this,new X(e,this.options));return ee.call(this,r)},use:function(e){if(Array.isArray(e))for(var r=0;r<e.length;r++)this.use(e[r]);else if(typeof e=="function")e(this);else throw new TypeError("plugin must be a Function or an Array of Functions");return this},addRule:function(e,r){return this.rules.add(e,r),this},keep:function(e){return this.rules.keep(e),this},remove:function(e){return this.rules.remove(e),this},escape:function(e){return Z.reduce(function(r,t){return r.replace(t[0],t[1])},e)}};function O(e){var r=this;return J.call(e.childNodes,function(t,n){n=new K(n,r.options);var i="";return n.nodeType===3?i=n.isCode?n.nodeValue:r.escape(n.nodeValue):n.nodeType===1&&(i=re.call(r,n)),D(t,i)},"")}function ee(e){var r=this;return this.rules.forEach(function(t){typeof t.append=="function"&&(e=D(e,t.append(r.options)))}),e.replace(/^[\t\r\n]+/,"").replace(/[\t\r\n\s]+$/,"")}function re(e){var r=this.rules.forNode(e),t=O.call(this,e),n=e.flankingWhitespace;return(n.leading||n.trailing)&&(t=t.trim()),n.leading+r.replacement(t,e,this.options)+n.trailing}function D(e,r){var t=P(e),n=L(r),i=Math.max(e.length-t.length,r.length-n.length),a=`

`.substring(0,i);return t+a+n}function te(e){return e!=null&&(typeof e=="string"||e.nodeType&&(e.nodeType===1||e.nodeType===9||e.nodeType===11))}function ne(){try{const e=document.body.cloneNode(!0);e.querySelectorAll("script, style, link, svg, iframe, nav, header, footer, aside").forEach(o=>o.remove());let r=e.querySelector("article")||e.querySelector("main")||e.querySelector('[role="main"]')||e;m("Main content element:",r);let t=r.innerHTML;t=t.replace(/\s{2,}/g," ").trim();const n=new g({headingStyle:"atx",hr:"---",bulletListMarker:"*",codeBlockStyle:"fenced",emDelimiter:"_"});n.keep(["figure","figcaption"]),n.addRule("images",{filter:"img",replacement:function(o,c){const l=c.alt||"",u=c.getAttribute("src")||"";return u?`![${l}](${u})`:l}});let i=n.turndown(t);m("Markdown content:",i),i=i.trim().replace(/\n{3,}/g,`

`);const a=15e3;return i.length>a&&(i=i.substring(0,a)+"... (content truncated)"),i}catch(e){return console.error("Error getting page content as Markdown:",e),"Error processing page content: "+e.message}}chrome.runtime.onMessage.addListener((e,r,t)=>{if(m("Message received in content script:",e),e.action==="getPageContent"){const n=ne();m("Sending markdown to side panel (approx length):",n.length),t({content:n})}return!0});
