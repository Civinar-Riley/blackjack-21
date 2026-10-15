(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const c of r)if(c.type==="childList")for(const f of c.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&i(f)}).observe(document,{childList:!0,subtree:!0});function n(r){const c={};return r.integrity&&(c.integrity=r.integrity),r.referrerPolicy&&(c.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?c.credentials="include":r.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function i(r){if(r.ep)return;r.ep=!0;const c=n(r);fetch(r.href,c)}})();const h=1024*1024;function p(e){return"gameHall_sv_"+String(e).toLowerCase().replace(/[^a-z0-9._-]+/g,"_")}function w(e){if(!e||typeof e!="object"||e.__opgSave!==1||typeof e.file!="string"||!e.file||!e.data||typeof e.data!="object"||Array.isArray(e.data))return null;let t=0;for(const n of Object.keys(e.data)){if(typeof e.data[n]!="string")return null;t+=n.length+e.data[n].length}return t>h?null:{file:e.file,data:e.data}}function S(e,t){return`<script>(function(){
  var FILE=${JSON.stringify(e).replace(/</g,"\\u003c")};
  var m=${t.replace(/</g,"\\u003c")};
  function post(){try{parent.postMessage({__opgSave:1,file:FILE,data:m},'*')}catch(e){}}
  function shim(){
    return {
      getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},
      setItem:function(k,v){m[String(k)]=String(v);post()},
      removeItem:function(k){delete m[String(k)];post()},
      clear:function(){m={};post()},
      key:function(i){return Object.keys(m)[i]||null},
      get length(){return Object.keys(m).length}
    };
  }
  var s=null;
  try{s=window.localStorage}catch(e){}
  try{
    if(!s){Object.defineProperty(window,'localStorage',{configurable:true,value:shim()});}
    else{
      /* 极少数真 localStorage 可用环境（如非沙箱直开）：仍用垫片接管，保证存档走桥 */
      Object.defineProperty(window,'localStorage',{configurable:true,value:shim()});
    }
  }catch(e){/* defineProperty 失败：保持原样，仅丢持久化不崩游戏 */}
  window.addEventListener('pagehide',post);
})();<\/script>`}const d=[{file:"blackjack.html",icon:"🃏",name:"21 点 - 黑杰克",desc:"经典黑杰克：下注、要牌、加倍、分牌，40 个成就等你解锁"},{file:"minesweeper.html",icon:"💣",name:"扫雷",desc:"经典扫雷：扫开所有安全格，别踩到雷"},{file:"horse-racing.html",icon:"🏇",name:"赛马场",desc:"赛马竞速：看准马儿下注，体验一把赌马"},{file:"match-pairs.html",icon:"🀄",name:"连连看",desc:"连连看消消乐：把相同的牌全部配对消除"}],a=(e,t)=>document.querySelector(e),k=(e,t)=>Array.from(document.querySelectorAll(e));function m(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}let o=null;const g=new Set;function L(e){try{return JSON.parse(localStorage.getItem(p(e))||"{}")||{}}catch{return{}}}function b(e,t){try{localStorage.setItem(p(e),JSON.stringify(t))}catch{}}let y=null,l=null;function u(){l&&(Object.keys(l).forEach(e=>b(e,l[e])),l=null)}window.addEventListener("pagehide",u);window.addEventListener("message",e=>{if(!g.has(e.source))return;const t=w(e.data);t&&(l=l||{},l[t.file]=t.data,clearTimeout(y),y=setTimeout(u,300))});function E(e,t){const n=S(t,JSON.stringify(L(t)));return/<head[^>]*>/i.test(e)?e.replace(/<head[^>]*>/i,i=>i+n):n+e}function v(){a("#viewWall").classList.remove("view-hidden"),a("#viewPlayer").classList.add("view-hidden"),document.title="🎮 游戏厅"}function O(){u(),o=null;const e=a("#gameFrame");g.delete(e.contentWindow),e.removeAttribute("srcdoc"),v()}async function s(e){const t=d[e];if(!t)return;u(),o=e,k(".game-card").forEach((i,r)=>i.classList.toggle("active",r===e)),a("#playerTitle").textContent=`${t.icon} ${t.name}`,a("#viewWall").classList.add("view-hidden"),a("#viewPlayer").classList.remove("view-hidden"),document.title=`${t.icon} ${t.name} - 游戏厅`;const n=a("#gameFrame");a("#playerTip").textContent="🎮 加载中…";try{const i=await fetch(`games/${t.file}`);if(!i.ok)throw new Error(`HTTP ${i.status}`);const r=await i.text();g.add(n.contentWindow),n.srcdoc=E(r,t.file),a("#playerTip").textContent="游戏在独立沙箱中运行，存档自动保存（刷新不丢）"}catch(i){a("#playerTip").textContent=`⚠️ 游戏加载失败：${m(i.message)}`}}function $(){const e=a("#gamesWall");e.innerHTML=d.map((t,n)=>`
        <div class="game-card" data-i="${n}" role="button" tabindex="0">
            <span class="g-icon">${t.icon}</span>
            <div class="g-name">${m(t.name)}</div>
            <div class="g-desc">${m(t.desc)}</div>
            <span class="g-play">▶ 开始游戏</span>
        </div>`).join(""),e.addEventListener("click",t=>{const n=t.target.closest(".game-card");n&&s(+n.dataset.i)}),e.addEventListener("keydown",t=>{if(t.key!=="Enter"&&t.key!==" ")return;const n=t.target.closest(".game-card");n&&s(+n.dataset.i)}),a("#btnBack").addEventListener("click",O),a("#btnReload").addEventListener("click",()=>{o!=null&&s(o)}),a("#btnFull").addEventListener("click",()=>{const t=a("#playerStage");document.fullscreenElement?document.exitFullscreen():t.requestFullscreen&&t.requestFullscreen()}),a("#btnClearSave").addEventListener("click",()=>{if(o==null)return;const t=d[o];if(confirm(`确定清空「${t.name}」的存档吗？`)){try{localStorage.removeItem(p(t.file))}catch{}s(o)}}),v(),console.log("🎮 游戏厅已加载，共",d.length,"个游戏")}$();
