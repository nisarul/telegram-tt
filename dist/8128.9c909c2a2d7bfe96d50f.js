(()=>{"use strict";var t,e,i={98128:(t,e,i)=>{var r=i(35802);const o=("undefined"!=typeof window&&window.innerHeight,Math.round(450),new Set(["newMessage","newScheduledMessage","deleteMessages","deleteScheduledMessages","deleteHistory"]),new Set(["image/png","image/jpeg","image/gif"])),a=new Set(["video/mp4"]);new Set(["audio/mp3","audio/ogg","audio/wav","audio/mpeg","audio/flac","audio/aac","audio/m4a","audio/mp4","audio/x-m4a"]),new Set([...o,...a]),new Set(["t.me","web.t.me","a.t.me","k.t.me","z.t.me"]),new Set(["AU","BD","CA","CO","EG","HN","IE","IN","JO","MX","MY","NI","NZ","PH","PK","SA","SV","US"]);const s=new Map,n=function(){const t=new Set;function e(e){t.delete(e)}return{runCallbacks:function(){for(var e=arguments.length,i=new Array(e),r=0;r<e;r++)i[r]=arguments[r];t.forEach((t=>{t(...i)}))},addCallback:function(i){return t.add(i),()=>{e(i)}},removeCallback:e,hasCallbacks:function(){return Boolean(t.size)}}}();function c(t,e){function i(t,i){t.channel=e,i?postMessage(t,i):postMessage(t)}!function(t){self.onerror=e=>{console.error(e),t({type:"unhandledError",error:{message:e.error.message||"Uncaught exception in worker"}})},self.addEventListener("unhandledrejection",(e=>{console.error(e),t({type:"unhandledError",error:{message:e.reason.message||"Uncaught rejection in worker"}})}))}(i),n.addCallback((r=>{r.data?.channel===e&&async function(t,e,i,r){switch(r||(r=t=>{i({type:"update",update:t})}),e.type){case"init":{const{args:i}=e,o="function"==typeof t?t("init",r,...i):t.init?.(r,...i);await o;break}case"callMethod":{const{messageId:r,name:o,args:a,withCallback:n}=e;try{if("function"!=typeof t&&!t[o])return;if(r&&n){const t=function(){for(var t=arguments.length,e=new Array(t),o=0;o<t;o++)e[o]=arguments[o];const a=e[e.length-1];i({type:"methodCallback",messageId:r,callbackArgs:e},d(a)?[a]:void 0)};s.set(r,t),a.push(t)}const e="function"==typeof t?await t(o,...a):await t[o](...a),{arrayBuffer:c}="object"==typeof e&&"arrayBuffer"in e&&e||{};r&&i({type:"methodResponse",messageId:r,response:e},c?[c]:void 0)}catch(t){r&&i({type:"methodResponse",messageId:r,error:{message:t.message}})}r&&s.delete(r);break}case"cancelProgress":{const t=s.get(e.messageId);t&&(t.isCanceled=!0);break}}}(t,r.data,i)}))}function d(t){return t instanceof ArrayBuffer||t instanceof ImageBitmap}let l;onmessage=n.runCallbacks,importScripts(new URL(i(4269),i.b));const h=new Promise((t=>{Module.onRuntimeInitialized=()=>{l={init:Module.cwrap("lottie_init","",[]),destroy:Module.cwrap("lottie_destroy","",["number"]),resize:Module.cwrap("lottie_resize","",["number","number","number"]),buffer:Module.cwrap("lottie_buffer","number",["number"]),render:Module.cwrap("lottie_render","",["number","number"]),loadFromData:Module.cwrap("lottie_load_from_data","number",["number","number"])},t()}})),u=new Map;async function f(t){const e=await fetch(t);if(e.headers.get("Content-Type")?.startsWith("text/"))return e.text();const i=await e.arrayBuffer();return(0,r.inflate)(i,{to:"string"})}function p(t,e,i){const r=e?30:60,o=JSON.parse(t).fr||r,a=o%r==0?o/r:1;return{reduceFactor:a,msPerFrame:1e3/(o/a),reducedFramesCount:Math.ceil(i/a)}}c({"rlottie:init":async function(t,e,i,r,o,a){l||await h;const s=await f(e),n=allocate(intArrayFromString(s),"i8",0),c=l.init(),d=l.loadFromData(c,n);l.resize(c,i,i);const m=new ImageData(i,i),{reduceFactor:_,msPerFrame:y,reducedFramesCount:w}=p(s,r,d);u.set(t,{imgSize:i,reduceFactor:_,handle:c,imageData:m,customColor:o}),a(_,y,w)},"rlottie:changeData":async function(t,e,i,r){l||await h;const o=await f(e),a=allocate(intArrayFromString(o),"i8",0),{handle:s}=u.get(t),n=l.loadFromData(s,a),{reduceFactor:c,msPerFrame:d,reducedFramesCount:m}=p(o,i,n);r(c,d,m)},"rlottie:renderFrames":async function(t,e,i){l||await h;const{imgSize:r,reduceFactor:o,handle:a,imageData:s,customColor:n}=u.get(t),c=e*o;l.render(a,c);const d=l.buffer(a),f=Module.HEAPU8.subarray(d,d+r*r*4);if(n){const t=new Uint8ClampedArray(f);!function(t,e){for(let i=0;i<t.length;i+=4)t[i]=e[0],t[i+1]=e[1],t[i+2]=e[2]}(t,n),s.data.set(t)}else s.data.set(f);i(e,await createImageBitmap(s))},"rlottie:destroy":function t(e){let i=arguments.length>1&&void 0!==arguments[1]&&arguments[1];try{const t=u.get(e);l.destroy(t.handle),u.delete(e)}catch(r){i||setTimeout((()=>t(e,!0)),1e3)}}});var m=i(32041);const _=new Map;function y(t,e,i){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var r=i.call(t,e);if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t,"string");return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}self.addEventListener("message",(t=>{const{type:e,messageId:i,result:r}=t.data;if("partResponse"===e){const t=_.get(i);t&&t.resolve(r)}}));const w=1024;var v=function(t){return t.loading="loading",t.ready="ready",t.closed="closed",t}(v||{});class g{constructor(t,e){let{onConfig:i,onChunk:r,stepOffset:o,stepMultiplier:a,isPolyfill:s,maxFrames:n}=e;y(this,"url",void 0),y(this,"file",void 0),y(this,"status",v.loading),y(this,"stepOffset",void 0),y(this,"stepMultiplier",void 0),y(this,"maxFrames",void 0),y(this,"isPolyfill",void 0),y(this,"decodedSamples",new Set),y(this,"lastSample",0),y(this,"onConfig",void 0),y(this,"onChunk",void 0),this.url=t,this.stepOffset=o,this.stepMultiplier=a,this.maxFrames=n,this.isPolyfill=s,this.onConfig=i,this.onChunk=r,this.file=m.createFile(),this.file.onError=t=>{console.error(t)},this.file.onReady=this.onReady.bind(this),this.file.onSamples=this.onSamples.bind(this),this.loadMetadata()}async loadMetadata(){let t=0;for(;void 0!==t;){try{t=await this.requestPart(t,131072)}catch(t){console.error(t)}if(this.status===v.ready)break}}async loadNextFrames(t,e,i){let r=t*this.stepOffset,o=0,a=this.file.seek(r,!0);for(;this.status!==v.closed;)try{if(await this.requestPart(a.offset,i),r>e)break;this.lastSample>1&&o<this.lastSample&&(r+=t*this.stepMultiplier,o=this.lastSample),a=this.file.seek(r,!0)}catch(t){console.error(t)}this.file.flush()}async requestPart(t,e){let i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];const r=t%w,o=t-r,a=o+e-1;let s=await function(t){const e=Date.now().toString(36)+Math.random().toString(36).slice(2),i={};let r=!1;const o=Promise.race([new Promise((t=>{setTimeout((()=>t()),3e4)})).then((()=>r?void 0:Promise.reject(new Error("ERROR_PART_TIMEOUT")))),new Promise(((t,e)=>{Object.assign(i,{resolve:t,reject:e})}))]);return _.set(e,i),o.catch((()=>{})).finally((()=>{_.delete(e),r=!0})),postMessage({type:"requestPart",messageId:e,params:t}),o}({url:this.url,start:o,end:a});if(!s)return;r&&(s=s.slice(r)),s.fileStart=t;const n=this.file.appendBuffer(s);return i?n:t+s.byteLength}description(t){const e=this.file.getTrackById(t.id);for(const t of e.mdia.minf.stbl.stsd.entries)if(t.avcC||t.hvcC||t.av1C){const e=new m.DataStream(void 0,0,m.DataStream.BIG_ENDIAN);return t.avcC?t.avcC.write(e):t.hvcC?t.hvcC.write(e):t.av1C&&t.av1C.write(e),new Uint8Array(e.buffer,8)}throw new Error("avcC, hvcC ro av1C not found")}onReady(t){const e=t.videoTracks[0];let i=e.codec;i.startsWith("avc1")&&(i="avc1.4d001f"),this.onConfig({codec:i,codedHeight:e.video.height,codedWidth:e.video.width,description:this.description(e)});const r=t.duration/t.timescale,o=this.isPolyfill?24:12,a=(s=e.bitrate/o)+w-s%w;var s;const n=function(t,e){return Math.round((t+e)/e)}(r,this.maxFrames);this.file.setExtractionOptions(e.id,void 0,{nbSamples:1}),this.file.start(),this.status=v.ready,this.loadNextFrames(n,r,a)}onSamples(t,e,i){if(this.status===v.ready)for(const e of i){const i=e.cts/e.timescale,r=e.is_sync?"key":"delta",o=`${r}${e.number}`;this.decodedSamples.has(o)||(this.onChunk(new EncodedVideoChunk({type:r,timestamp:1e6*i,duration:1e6*e.duration/e.timescale,data:e.data})),this.decodedSamples.add(o),this.lastSample=parseInt(e.number,10),e.is_sync&&this.file.releaseUsedSamples(t,e.number))}}close(){this.file.flush(),this.file.stop(),this.status=v.closed}}function b(t,e,i){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var r=i.call(t,e);if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t,"string");return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}const S=class{constructor(t){b(this,"type",void 0),b(this,"timestamp",void 0),b(this,"duration",void 0),b(this,"byteLength",void 0),b(this,"_data",void 0),this.type=t.type,this.timestamp=t.timestamp,this.duration=t.duration||0;const e=this._data=new Uint8Array(t.data.buffer||t.data,t.data.byteOffset||0);this.byteLength=e.byteLength}_libavGetData(){return this._data}copyTo(t){new Uint8Array(t.buffer||t,t.byteOffset||0).set(this._data)}};function A(t,e,i){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var r=i.call(t,e);if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t,"string");return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}let I=null;class P{constructor(t,e){A(this,"format",void 0),A(this,"codedWidth",void 0),A(this,"codedHeight",void 0),A(this,"codedRect",void 0),A(this,"visibleRect",void 0),A(this,"displayWidth",void 0),A(this,"displayHeight",void 0),A(this,"duration",void 0),A(this,"timestamp",void 0),A(this,"colorSpace",void 0),A(this,"_layout",void 0),A(this,"_data",void 0),A(this,"_nonSquarePixels",void 0),A(this,"_sar_num",void 0),A(this,"_sar_den",void 0),t instanceof ArrayBuffer||t.buffer instanceof ArrayBuffer?this._constructBuffer(t,e):this._constructCanvas(t,e)}_constructCanvas(t,e){null===I&&(I=document.createElement("canvas"),I.style.display="none",document.body.appendChild(I));let i=0,r=0;if(t.naturalWidth?(i=t.naturalWidth,r=t.naturalHeight):t.videoWidth?(i=t.videoWidth,r=t.videoHeight):t.width&&(i=t.width,r=t.height),!i||!r)throw new DOMException("Could not determine dimensions","InvalidStateError");I.width=i,I.height=r;const o=I.getContext("2d");o.clearRect(0,0,i,r),o.drawImage(t,0,0),this._constructBuffer(o.getImageData(0,0,i,r).data,{format:"RGBA",codedWidth:i,codedHeight:r,timestamp:e.timestamp,duration:e.duration||0,layout:[{offset:0,stride:4*i}],displayWidth:e.displayWidth||i,displayHeight:e.displayHeight||r})}_constructBuffer(t,e){const i=this.format=e.format,r=this.codedWidth=e.codedWidth,o=this.codedHeight=e.codedHeight;this.visibleRect=new DOMRect(0,0,r,o);const a=this.displayWidth=e.displayWidth||e.codedWidth,s=this.displayHeight=e.displayHeight||e.codedHeight;if(a!==r||s!==o?(this._nonSquarePixels=!0,this._sar_num=a*o,this._sar_den=s*r):this._nonSquarePixels=!1,this.timestamp=e.timestamp,e.duration&&(this.duration=e.duration),e.layout)this._layout=e.layout;else{const t=M(i),e=[];let a=0;for(let s=0;s<t;s++){const t=V(i,s),n=O(i,s),c=~~(r/t);e.push({offset:a,stride:c}),a+=c*~~(o/n)}this._layout=e}this._data=new Uint8Array(t.buffer||t,t.byteOffset||0)}_libavGetData(){return this._data}allocationSize(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(null===this._data)throw new DOMException("Detached","InvalidStateError");if(null===this.format)throw new DOMException("Not supported","NotSupportedError");return this._parseVideoFrameCopyToOptions(t).allocationSize}_parseVideoFrameCopyToOptions(t){const e=this.visibleRect,i=t.rect?new DOMRect(t.rect.x,t.rect.y,t.rect.width,t.rect.height):null,r=this._parseVisibleRect(e,i),o=t.layout||null;return this._computeLayoutAndAllocationSize(r,o)}_parseVisibleRect(t,e){let i=t;if(e){if(0===e.width||0===e.height)throw new TypeError("Invalid rectangle");if(e.x+e.width>this.codedWidth)throw new TypeError("Invalid rectangle");if(e.y+e.height>this.codedHeight)throw new TypeError("Invalid rectangle");i=e}if(!this._verifyRectSampleAlignment(i))throw new TypeError("Invalid alignment");return i}_computeLayoutAndAllocationSize(t,e){const i=M(this.format);if(e&&e.length!==i)throw new TypeError("Invalid layout");let r=0;const o=[],a=[];let s=0;for(;s<i;){const i=E(this.format,s),n=V(this.format,s),c=O(this.format,s),d=n*i,l={destinationOffset:0,destinationStride:0,sourceTop:~~(t.y/c),sourceHeight:~~(t.height/c),sourceLeftBytes:~~(t.x/d),sourceWidthBytes:~~(t.width/d)};if(e){const t=e[s];if(t.stride<l.sourceWidthBytes)throw new TypeError("Invalid stride");l.destinationOffset=t.offset,l.destinationStride=t.stride}else l.destinationOffset=r,l.destinationStride=l.sourceWidthBytes;const h=l.destinationStride*l.sourceHeight,u=h+l.destinationOffset;if(h>=4294967296||u>=4294967296)throw new TypeError("Plane too large");a.push(u),u>r&&(r=u);let f=0;for(;f<s;){if(!(u<=o[f].destinationOffset||a[f]<=l.destinationOffset))throw new TypeError("Invalid plane layout");f++}o.push(l),s++}return{computedLayouts:o,allocationSize:r}}_verifyRectSampleAlignment(t){if(!this.format)return!0;let e=0;const i=M(this.format);for(;e<i;){const i=V(this.format,e),r=O(this.format,e),o=t.x/i;if(o!==~~o)return!1;const a=t.width/i;if(a!==~~a)return!1;const s=t.y/r;if(s!==~~s)return!1;const n=t.height/r;if(n!==~~n)return!1;e++}return!0}async copyTo(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const i=new Uint8Array(t.buffer||t,t.byteOffset||0);if(null===this._data)throw new DOMException("Detached","InvalidStateError");if(!this.format)throw new DOMException("No format","NotSupportedError");const r=this._parseVideoFrameCopyToOptions(e);if(t.byteLength<r.allocationSize)throw new TypeError("Insufficient space");const o=[];M(this.format);let a=0;for(;a<r.computedLayouts.length;){const t=this._layout[a].stride,e=r.computedLayouts[a];let s=e.sourceTop*t;s+=e.sourceLeftBytes;let n=e.destinationOffset;const c=e.sourceWidthBytes;let d=0;for(;d<e.sourceHeight;)i.set(this._data.subarray(s,s+c),n),s+=t,n+=e.destinationStride,d++;a++,o.push({offset:e.destinationOffset,stride:e.destinationStride})}return o}clone(){return new P(this._data,{format:this.format,codedWidth:this.codedWidth,codedHeight:this.codedHeight,timestamp:this.timestamp,duration:this.duration,layout:this._layout})}close(){this._data=null}}function M(t){switch(t){case"I420":case"I422":case"I444":return 3;case"I420A":return 4;case"NV12":return 2;case"RGBA":case"RGBX":case"BGRA":case"BGRX":return 1;default:throw new DOMException("Unsupported video pixel format","NotSupportedError")}}function E(t,e){switch(t){case"I420":case"I420A":case"I422":case"I444":return 1;case"NV12":return 1===e?2:1;case"RGBA":case"RGBX":case"BGRA":case"BGRX":return 4;default:throw new DOMException("Unsupported video pixel format","NotSupportedError")}}function V(t,e){if(0===e)return 1;switch(t){case"I420":case"I422":case"NV12":return 2;case"I420A":return 3===e?1:2;case"I444":case"RGBA":case"RGBX":case"BGRA":case"BGRX":return 1;default:throw new DOMException("Unsupported video pixel format","NotSupportedError")}}function O(t,e){if(0===e)return 1;switch(t){case"I420":case"NV12":return 2;case"I420A":return 3===e?1:2;case"I422":case"I444":case"RGBA":case"RGBX":case"BGRA":case"BGRX":return 1;default:throw new DOMException("Unsupported video pixel format","NotSupportedError")}}const C=[];let k={},x=null;function B(t){k=t}async function R(){return C.length?C.shift():LibAV.LibAV(k)}function T(t){C.push(t)}async function D(){x=await async function(){const t=await R(),e=[];for(const[i,r]of[["libaom-av1","av01"],["h264","avc1"],["hevc","hvc1"]])await t.avcodec_find_decoder_by_name(i)&&e.push(r);return T(t),e}()}function F(t){if("string"==typeof t){let e=t=t.replace(/\..*/,"");switch(t){case"av01":e="libaom-av1";break;case"avc1":e="h264";break;case"hvc1":e="hevc";break;default:return null}return x.indexOf(t)>=0?{codec:e}:null}return t.libavjs}function G(t,e){const i={};for(const r of e)r in t&&(i[r]=t[r]);return i}function W(t,e,i){return(e=function(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var r=i.call(t,e);if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t,"string");return"symbol"==typeof e?e:String(e)}(e))in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}class H{constructor(t){W(this,"state",void 0),W(this,"decodeQueueSize",void 0),W(this,"_output",void 0),W(this,"_error",void 0),W(this,"_p",void 0),W(this,"_libav",void 0),W(this,"_codec",void 0),W(this,"_c",void 0),W(this,"_pkt",void 0),W(this,"_frame",void 0),this._output=t.output,this._error=t.error,this.state="unconfigured",this.decodeQueueSize=0,this._p=Promise.all([]),this._libav=null,this._codec=this._c=this._pkt=this._frame=0}configure(t){const e=this;if("closed"===this.state)throw new DOMException("Decoder is closed","InvalidStateError");this._libav&&(this._p=this._p.then((()=>this._free()))),this.state="configured",this._p=this._p.then((async()=>{const i=F(t.codec);if(i){const r=e._libav=await R(),o=await r.malloc(t.description.length);await r.copyin_u8(o,t.description);const a=await r.calloc(1,1024);await r.AVCodecParameters_extradata_s(a,o),await r.AVCodecParameters_extradata_size_s(a,t.description.length),[e._codec,e._c,e._pkt,e._frame]=await r.ff_init_decoder(i.codec,a),await r.AVCodecContext_time_base_s(e._c,1,1e3),await r.free(o),await r.free(a)}else e._closeVideoDecoder(new DOMException("Unsupported codec","NotSupportedError"))})).catch(this._error)}async _free(){this._c&&(await this._libav.ff_free_decoder(this._c,this._pkt,this._frame),this._codec=this._c=this._pkt=this._frame=0),this._libav&&(T(this._libav),this._libav=null)}_closeVideoDecoder(t){this._resetVideoDecoder(t),this.state="closed",this._p=this._p.then((()=>this._free())),"AbortError"!==t.name&&(this._p=this._p.then((()=>{this._error(t)})))}_resetVideoDecoder(t){if("closed"===this.state)throw new DOMException("Decoder closed","InvalidStateError");this.state="unconfigured",this._p=this._p.then((()=>this._free()))}decode(t){const e=this;if("configured"!==this.state)throw new DOMException("Unconfigured","InvalidStateError");this.decodeQueueSize++,this._p=this._p.then((async()=>{const i=e._libav,r=e._c,o=e._pkt,a=e._frame;let s=null;try{const e=Math.floor(t.timestamp/1e3),n=e%4294967296,c=~~(e/4294967296),d={data:t._libavGetData(),pts:n,ptshi:c,dts:n,dtshi:c};t.duration&&(d.duration=Math.floor(t.duration/1e3),d.durationhi=0),s=await i.ff_decode_multi(r,o,a,[d])}catch(t){e._p=e._p.then((()=>{e._closeVideoDecoder(t)}))}e.decodeQueueSize--,s&&e._outputVideoFrames(s)})).catch(this._error)}_outputVideoFrames(t){const e=this._libav;for(const i of t){let t;switch(i.format){case e.AV_PIX_FMT_YUV420P:t="I420";break;case e.AV_PIX_FMT_YUVA420P:t="I420A";break;case e.AV_PIX_FMT_YUV422P:t="I422";break;case e.AV_PIX_FMT_YUV444P:t="I444";break;case e.AV_PIX_FMT_NV12:t="NV12";break;case e.AV_PIX_FMT_RGBA:t="RGBA";break;case e.AV_PIX_FMT_BGRA:t="BGRA";break;default:throw new DOMException("Unsupported libav format!","EncodingError")}const r=i.width,o=i.height;let a=r,s=o;if(i.sample_aspect_ratio[0]){const t=i.sample_aspect_ratio;t[0]>t[1]?a=~~(r*t[0]/t[1]):s=~~(o*t[1]/t[0])}const n=1e3*(4294967296*i.ptshi+i.pts);let c;{let e=0;const r=M(t),o=[],a=[],s=[];for(let e=0;e<r;e++)o.push(E(t,e)),a.push(V(t,e)),s.push(O(t,e));for(let t=0;t<r;t++)e+=i.width*i.height*o[t]/a[t]/s[t];c=new Uint8Array(e);let n=0;for(let t=0;t<r;t++){const e=i.data[t];for(let r=0;r<i.height/s[t];r++){const o=e[r].subarray(0,i.width/a[t]);c.set(o,n),n+=o.length}}}const d=new P(c,{format:t,codedWidth:r,codedHeight:o,displayWidth:a,displayHeight:s,timestamp:n});this._output(d)}}flush(){const t=this,e=this._p.then((async()=>{if(!t._c)return;const e=t._libav,i=t._c,r=t._pkt,o=t._frame;let a=null;try{a=await e.ff_decode_multi(i,r,o,[],!0)}catch(e){t._p=t._p.then((()=>{t._closeVideoDecoder(e)}))}a&&t._outputVideoFrames(a)}));return this._p=e,e}reset(){this._resetVideoDecoder(new DOMException("Reset","AbortError"))}close(){this._closeVideoDecoder(new DOMException("Close","AbortError"))}static async isConfigSupported(t){const e=F(t.codec);let i=!1;if(e){const t=await R();try{const[,r,o,a]=await t.ff_init_decoder(e.codec);await t.ff_free_decoder(r,o,a),i=!0}catch(t){}await T(t)}return{supported:i,config:G(t,["codec","codedWidth","codedHeight"])}}}let j=null,U=null,N=null;async function X(t,e){j=await LibAV.LibAV({noworker:!0}),U=await LibAV.LibAV(t),N=i.g.createImageBitmap,e&&(i.g.createImageBitmap=z)}function z(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!(t instanceof P))return N.apply(i.g,arguments);let r=U.AV_PIX_FMT_RGBA;switch(t.format){case"I420":r=U.AV_PIX_FMT_YUV420P;break;case"I420A":r=U.AV_PIX_FMT_YUVA420P;break;case"I422":r=U.AV_PIX_FMT_YUV422P;break;case"I444":r=U.AV_PIX_FMT_YUV444P;break;case"NV12":r=U.AV_PIX_FMT_NV12;break;case"RGBA":case"RGBX":r=U.AV_PIX_FMT_RGBA;break;case"BGRA":case"BGRX":r=U.AV_PIX_FMT_BGRA}const o="number"==typeof e.resizeWidth?e.resizeWidth:t.displayWidth,a="number"==typeof e.resizeHeight?e.resizeHeight:t.displayHeight,s=new ImageData(o,a);return(async()=>{const[e,i,n]=await Promise.all([U.sws_getContext(t.codedWidth,t.codedHeight,r,o,a,U.AV_PIX_FMT_RGBA,2,0,0,0),U.av_frame_alloc(),U.av_frame_alloc()]),c=t._libavGetData();let d=0;const l=[],h=M(t.format);for(let e=0;e<h;e++){const i=[];l.push(i);const r=E(t.format,e),o=V(t.format,e),a=O(t.format,e),s=~~(t.codedWidth*r/o),n=~~(t.codedHeight/a);for(let t=0;t<n;t++)i.push(c.subarray(d,d+s)),d+=s}const[,,u]=await Promise.all([U.ff_copyin_frame(i,{data:l,format:r,width:t.codedWidth,height:t.codedHeight}),U.sws_scale_frame(e,n,i),U.ff_copyout_frame(n),U.av_frame_free_js(n),U.av_frame_free_js(i),U.sws_freeContext(e)]);let f=0;for(let e=0;e<u.data.length;e++){const i=u.data[e];for(let e=0;e<i.length;e++){const r=i[e].subarray(0,4*t.codedWidth);s.data.set(r,f),f+=r.length}}return await N(s)})()}class L extends Error{constructor(){super("The requested configuration is not supported")}}let Y,q,$,Q=!1;const J={"video-preview:init":async function(t,e,r,o,a){const s="VideoDecoder"in globalThis;s||await async function(){Q||(importScripts(new URL(i(8849),i.b)),await async function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};const e={};t.libavOptions&&Object.assign(e,t.libavOptions),B(e),await D(),t.polyfill&&(globalThis.VideoDecoder=H,globalThis.VideoFrame=P,globalThis.EncodedVideoChunk=S),await X(e,!!t.polyfill)}({polyfill:!0,libavOptions:{noworker:!0,nosimd:!0}}),Q=!0)}();const n=new Set;return Y=new VideoDecoder({async output(t){const e=t.timestamp/1e6,i=Math.floor(e);if(!n.has(i)){const e=await createImageBitmap(t);n.add(i),a(i,e)}t.close()},error(t){console.error("[Video Preview] error",t)}}),q=new g(t,{stepOffset:r,stepMultiplier:o,isPolyfill:!s,maxFrames:e,onConfig(t){Y?.configure(t)},onChunk(t){"configured"===Y?.state&&Y?.decode(t)}}),new Promise((t=>{$=t}))},"video-preview:destroy":function(){try{Y?.close(),q?.close()}catch{}Y=void 0,q=void 0,$?.()}};c(J)},4269:(t,e,i)=>{t.exports=i.p+"rlottie-wasm.5e3833cedb8fb71c8d8e.js"},8849:(t,e,i)=>{t.exports=i.p+"libav-3.10.5.1.2-webcodecs.67c3416e7e2c2a6523bf.js"}},r={};function o(t){var e=r[t];if(void 0!==e)return e.exports;var a=r[t]={exports:{}};return i[t].call(a.exports,a,a.exports,o),a.exports}o.m=i,o.x=()=>{var t=o.O(void 0,[5802,2041],(()=>o(98128)));return o.O(t)},t=[],o.O=(e,i,r,a)=>{if(!i){var s=1/0;for(l=0;l<t.length;l++){for(var[i,r,a]=t[l],n=!0,c=0;c<i.length;c++)(!1&a||s>=a)&&Object.keys(o.O).every((t=>o.O[t](i[c])))?i.splice(c--,1):(n=!1,a<s&&(s=a));if(n){t.splice(l--,1);var d=r();void 0!==d&&(e=d)}}return e}a=a||0;for(var l=t.length;l>0&&t[l-1][2]>a;l--)t[l]=t[l-1];t[l]=[i,r,a]},o.f={},o.e=t=>Promise.all(Object.keys(o.f).reduce(((e,i)=>(o.f[i](t,e),e)),[])),o.u=t=>t+"."+{2041:"3bace9c76cb8e496a2a9",5802:"207c1d379140a8835f7e"}[t]+".js",o.miniCssF=t=>{},o.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{var t;o.g.importScripts&&(t=o.g.location+"");var e=o.g.document;if(!t&&e&&(e.currentScript&&(t=e.currentScript.src),!t)){var i=e.getElementsByTagName("script");i.length&&(t=i[i.length-1].src)}if(!t)throw new Error("Automatic publicPath is not supported in this browser");t=t.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),o.p=t})(),(()=>{o.b=self.location+"";var t={8128:1};o.f.i=(e,i)=>{t[e]||importScripts(o.p+o.u(e))};var e=self.webpackChunktelegram_t=self.webpackChunktelegram_t||[],i=e.push.bind(e);e.push=e=>{var[r,a,s]=e;for(var n in a)o.o(a,n)&&(o.m[n]=a[n]);for(s&&s(o);r.length;)t[r.pop()]=1;i(e)}})(),e=o.x,o.x=()=>Promise.all([o.e(5802),o.e(2041)]).then(e),o.x()})();
//# sourceMappingURL=8128.9c909c2a2d7bfe96d50f.js.map