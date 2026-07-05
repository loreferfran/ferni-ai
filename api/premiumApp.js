'use strict';

function escH(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

var MOD_META = {
  dashboard:  { icon: '🏠', es:'Inicio',    en:'Home',    pt:'Início',    fr:'Accueil',   de:'Start',     it:'Inizio',    nl:'Home',         pl:'Start',       sv:'Hem'       },
  checklist:  { icon: '✅', es:'Pasos',     en:'Steps',   pt:'Etapas',    fr:'Étapes',    de:'Schritte',  it:'Passi',     nl:'Stappen',      pl:'Kroki',       sv:'Steg'      },
  simulator:  { icon: '📊', es:'Simular',   en:'Score',   pt:'Simular',   fr:'Score',     de:'Score',     it:'Punteggio', nl:'Score',        pl:'Wynik',       sv:'Poäng'     },
  comparador: { icon: '💳', es:'Comparar',  en:'Compare', pt:'Comparar',  fr:'Comparer',  de:'Vergleich', it:'Confronta', nl:'Vergelijk',    pl:'Porównaj',    sv:'Jämför'    },
  quiz:       { icon: '⚠️', es:'Test',      en:'Quiz',    pt:'Quiz',      fr:'Quiz',      de:'Quiz',      it:'Quiz',      nl:'Quiz',         pl:'Quiz',        sv:'Quiz'      },
  plan:       { icon: '📅', es:'Mi Plan',   en:'My Plan', pt:'Plano',     fr:'Mon Plan',  de:'Mein Plan', it:'Il Piano',  nl:'Mijn Plan',    pl:'Mój Plan',    sv:'Min Plan'  },
  glosario:   { icon: '📚', es:'Glosario',  en:'Glossary',pt:'Glossário', fr:'Glossaire', de:'Glossar',   it:'Glossario', nl:'Woordenlijst', pl:'Słownik',     sv:'Ordlista'  },
  logros:     { icon: '🏆', es:'Logros',    en:'Badges',  pt:'Conquistas',fr:'Succès',    de:'Erfolge',   it:'Traguardi', nl:'Badges',       pl:'Osiągnięcia', sv:'Utmärkelser'}
};

function modLabel(m, lang) {
  var meta = MOD_META[m]; if(!meta) return m;
  return meta[lang] || meta['es'] || m;
}

function buildPremiumApp(data, year) {
  var accent = (data.accentColor||'#6c5ce7').replace(/[^#0-9a-fA-F]/g,'').slice(0,7)||'#6c5ce7';
  var lang   = (data.lang||'es').toLowerCase().slice(0,2);
  var title  = data.appTitle   || 'Mi App';
  var tagline= data.appTagline || '';

  // Normalize module list
  var mods = (data.modules||[]).filter(function(m){ return !!data[m]; });
  if(mods.indexOf('dashboard')===-1) mods.unshift('dashboard');
  if(data.logros && mods.indexOf('logros')===-1) mods.push('logros');

  // ── CSS ───────────────────────────────────────────────────────────────────
  var css =
    '<style>\n' +
    '*{box-sizing:border-box;margin:0;padding:0}\n' +
    ':root{--a:'+accent+';--bg:#0a0a16;--bg2:#12122a;--bdr:rgba(255,255,255,0.07);--t:#f0e6d3;--t2:#c8c4bc;--mu:#7a7590;--green:#00b894;--yellow:#fdcb6e;--red:#e17055}\n' +
    'body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--t2);min-height:100vh;padding-bottom:74px}\n' +
    /* Onboarding */
    '#onb{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;text-align:center}\n' +
    '.onb-logo{font-size:44px;margin-bottom:14px}\n' +
    '.onb-title{font-size:24px;font-weight:700;color:var(--t);margin-bottom:8px;line-height:1.2}\n' +
    '.onb-tagline{font-size:13px;color:var(--mu);margin-bottom:28px;max-width:360px}\n' +
    '.onb-dots{display:flex;gap:7px;justify-content:center;margin-bottom:24px}\n' +
    '.od{width:8px;height:8px;border-radius:50%;background:var(--mu);transition:all .25s}\n' +
    '.od.on{background:var(--a);width:22px;border-radius:4px}\n' +
    '.onb-q{font-size:17px;font-weight:600;color:var(--t);margin-bottom:14px}\n' +
    '.onb-in{width:100%;max-width:380px;padding:13px 16px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:var(--t);font-size:16px;outline:none;text-align:center;margin-bottom:14px;font-family:inherit}\n' +
    '.onb-in:focus{border-color:var(--a)}\n' +
    '.onb-sel{width:100%;max-width:380px;padding:13px 16px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:var(--t);font-size:15px;outline:none;margin-bottom:14px;appearance:none;font-family:inherit}\n' +
    '.onb-sel option{background:#1a1a3a}\n' +
    '.onb-btn{background:var(--a);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;padding:14px 40px;cursor:pointer;width:100%;max-width:340px;font-family:inherit;transition:opacity .2s}\n' +
    '.onb-btn:hover{opacity:.88}\n' +
    '.onb-slide{display:none;flex-direction:column;align-items:center;width:100%}\n' +
    '.onb-slide.on{display:flex}\n' +
    /* App header */
    '.ahdr{background:linear-gradient(135deg,#0f0f28,#1a0a2e);border-bottom:1px solid var(--bdr);padding:14px 18px;display:none;align-items:center;gap:12px;position:sticky;top:0;z-index:100}\n' +
    '.ahdr-icon{width:38px;height:38px;background:var(--a);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}\n' +
    '.ahdr-name{font-size:16px;font-weight:700;color:var(--t)}\n' +
    '.ahdr-user{font-size:11px;color:var(--mu)}\n' +
    /* Nav */
    '.nav{position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,22,.97);border-top:1px solid var(--bdr);display:none;z-index:150;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}\n' +
    '.nav-inner{display:flex;overflow-x:auto;scrollbar-width:none}\n' +
    '.nav-inner::-webkit-scrollbar{display:none}\n' +
    '.nb{flex:1;min-width:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 4px;border:none;background:transparent;cursor:pointer;font-family:inherit}\n' +
    '.nb-icon{font-size:18px;line-height:1}\n' +
    '.nb-lbl{font-size:9px;color:var(--mu);letter-spacing:.3px;font-weight:500;white-space:nowrap}\n' +
    '.nb.on .nb-lbl{color:var(--a)}\n' +
    '.nb-dot{width:4px;height:4px;border-radius:50%;background:var(--a);opacity:0;transition:opacity .2s}\n' +
    '.nb.on .nb-dot{opacity:1}\n' +
    /* Modules */
    '.mod{display:none}\n' +
    '.mod.on{display:block}\n' +
    '.mhdr{background:linear-gradient(135deg,#0f0f28,#160a2a);padding:18px 18px 14px;border-bottom:1px solid var(--bdr)}\n' +
    '.mtitle{font-size:20px;font-weight:700;color:var(--t);margin-bottom:3px}\n' +
    '.msub{font-size:13px;color:var(--mu)}\n' +
    '.mbody{padding:14px}\n' +
    /* Dashboard */
    '.dhero{background:linear-gradient(135deg,rgba(108,92,231,.14),rgba(0,184,148,.07));border:1px solid var(--bdr);border-radius:14px;padding:18px;margin-bottom:12px;text-align:center}\n' +
    '.dgr{font-size:18px;font-weight:700;color:var(--t);margin-bottom:4px}\n' +
    '.dday{font-size:12px;color:var(--mu)}\n' +
    '.dpct{font-size:32px;font-weight:700;color:var(--a);text-align:center;margin:10px 0 2px}\n' +
    '.dpct-lbl{font-size:10px;color:var(--mu);text-align:center;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}\n' +
    '.dbar{height:8px;background:rgba(255,255,255,.07);border-radius:8px;overflow:hidden;margin-bottom:14px}\n' +
    '.dfill{height:100%;border-radius:8px;background:linear-gradient(90deg,var(--a),var(--green));transition:width .6s}\n' +
    '.dstats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}\n' +
    '.dstat{background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:10px;text-align:center}\n' +
    '.dsnum{font-size:20px;font-weight:700;color:var(--a);margin-bottom:2px}\n' +
    '.dslbl{font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}\n' +
    '.nact{background:rgba(108,92,231,.12);border:1px solid rgba(108,92,231,.3);border-left:4px solid var(--a);border-radius:10px;padding:14px;margin-bottom:12px}\n' +
    '.nalbl{font-size:10px;color:var(--a);font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px}\n' +
    '.natxt{font-size:13px;color:var(--t);line-height:1.6}\n' +
    '.journey{display:flex;margin-bottom:12px;overflow-x:auto;padding-bottom:2px}\n' +
    '.jst{flex:1;min-width:70px;text-align:center;position:relative;padding-top:6px}\n' +
    '.jst::before{content:"";position:absolute;top:13px;left:50%;right:-50%;height:2px;background:var(--bdr)}\n' +
    '.jst:last-child::before{display:none}\n' +
    '.jdot{width:20px;height:20px;border-radius:50%;border:2px solid var(--bdr);background:var(--bg);margin:0 auto 5px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;position:relative;z-index:1;transition:all .3s}\n' +
    '.jst.done .jdot{border-color:var(--green);background:var(--green);color:#fff}\n' +
    '.jst.cur .jdot{border-color:var(--a);background:var(--a);color:#fff}\n' +
    '.jlbl{font-size:10px;color:var(--mu);line-height:1.3;padding:0 2px}\n' +
    '.jst.done .jlbl{color:var(--green)}\n' +
    '.jst.cur .jlbl{color:var(--a)}\n' +
    /* Checklist */
    '.ph{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:10px;overflow:hidden}\n' +
    '.phhdr{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer}\n' +
    '.phprog{background:rgba(255,255,255,.06);border-radius:20px;font-size:11px;font-weight:600;color:var(--mu);padding:2px 9px;flex-shrink:0}\n' +
    '.phtitle{flex:1;font-size:14px;font-weight:600;color:var(--t)}\n' +
    '.pharr{font-size:18px;color:var(--mu);transition:transform .25s}\n' +
    '.ph.open .pharr{transform:rotate(90deg);color:var(--a)}\n' +
    '.phbody{border-top:1px solid var(--bdr);padding:12px 14px;display:none}\n' +
    '.ph.open .phbody{display:block}\n' +
    '.ti{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}\n' +
    '.ti:last-child{border-bottom:none}\n' +
    '.ti input[type=checkbox]{width:17px;height:17px;flex-shrink:0;accent-color:var(--a);margin-top:2px;cursor:pointer}\n' +
    '.ti label{font-size:13px;color:var(--t2);cursor:pointer;line-height:1.5}\n' +
    '.ti input:checked+label{text-decoration:line-through;color:var(--mu)}\n' +
    /* Simulator */
    '.simres{text-align:center;padding:18px 0 12px}\n' +
    '.simnum{font-size:58px;font-weight:700;color:var(--a);line-height:1;margin-bottom:6px}\n' +
    '.simzone{display:inline-block;font-size:14px;font-weight:600;padding:4px 16px;border-radius:20px;margin-bottom:4px}\n' +
    '.simlbl{font-size:12px;color:var(--mu)}\n' +
    '.sli{margin-bottom:16px}\n' +
    '.slhdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}\n' +
    '.slname{font-size:13px;font-weight:600;color:var(--t)}\n' +
    '.slval{font-size:12px;color:var(--a);font-weight:700}\n' +
    '.slinput{width:100%;height:6px;background:rgba(255,255,255,.08);border-radius:6px;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer}\n' +
    '.slinput::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--a);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}\n' +
    '.slwt{font-size:10px;color:var(--mu);margin-top:3px}\n' +
    /* Comparador */
    '.ccard{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;padding:14px;margin-bottom:10px;transition:opacity .3s}\n' +
    '.ccard.locked{opacity:.4;filter:grayscale(.7)}\n' +
    '.cname{font-size:15px;font-weight:700;color:var(--t);margin-bottom:2px}\n' +
    '.clevel{font-size:11px;color:var(--a);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}\n' +
    '.crow{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)}\n' +
    '.crow:last-child{border-bottom:none}\n' +
    '.ck{color:var(--mu)}\n' +
    '.cv{color:var(--t2);font-weight:500}\n' +
    '.clock-msg{font-size:11px;color:var(--mu);text-align:center;padding:6px 0}\n' +
    /* Quiz */
    '.qcard{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;padding:14px;margin-bottom:10px}\n' +
    '.qtxt{font-size:14px;color:var(--t);margin-bottom:10px;line-height:1.5}\n' +
    '.qopts{display:flex;gap:10px}\n' +
    '.qopt{flex:1;padding:9px;border-radius:10px;border:1px solid var(--bdr);background:transparent;color:var(--t2);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .15s}\n' +
    '.qopt.sy{border-color:var(--green);background:rgba(0,184,148,.15);color:var(--green)}\n' +
    '.qopt.sn{border-color:var(--red);background:rgba(225,112,85,.15);color:var(--red)}\n' +
    '.qres{background:var(--bg2);border-radius:14px;padding:20px;text-align:center;margin-top:14px;display:none}\n' +
    '.qricon{font-size:36px;margin-bottom:10px}\n' +
    '.qrlbl{font-size:18px;font-weight:700;margin-bottom:8px}\n' +
    '.qrmsg{font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:14px}\n' +
    /* Plan */
    '.pm{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:10px;overflow:hidden}\n' +
    '.pmhdr{display:flex;align-items:center;gap:10px;padding:13px 14px;cursor:pointer}\n' +
    '.pmnum{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.05);border:1.5px solid var(--bdr);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;color:var(--mu)}\n' +
    '.pm.cur .pmnum{border-color:var(--a);background:rgba(108,92,231,.2);color:var(--a)}\n' +
    '.pmtitle{flex:1;font-size:13px;font-weight:600;color:var(--t)}\n' +
    '.pmarr{font-size:17px;color:var(--mu);transition:transform .25s}\n' +
    '.pm.open .pmarr{transform:rotate(90deg)}\n' +
    '.pmbody{border-top:1px solid var(--bdr);padding:10px 14px;display:none}\n' +
    '.pm.open .pmbody{display:block}\n' +
    '.pmact{padding:6px 0;font-size:13px;color:var(--t2);border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:8px;line-height:1.5}\n' +
    '.pmact:last-child{border-bottom:none}\n' +
    '.pmact::before{content:"→";color:var(--a);flex-shrink:0}\n' +
    /* Glosario */
    '.gsearch{width:100%;padding:11px 13px;background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;color:var(--t);font-size:14px;outline:none;margin-bottom:12px;font-family:inherit}\n' +
    '.gsearch:focus{border-color:var(--a)}\n' +
    '.gterm{background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:7px;overflow:hidden}\n' +
    '.gthdr{padding:12px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}\n' +
    '.gtword{font-size:14px;font-weight:700;color:var(--t)}\n' +
    '.gtarr{font-size:15px;color:var(--mu);transition:transform .25s}\n' +
    '.gterm.open .gtarr{transform:rotate(90deg);color:var(--a)}\n' +
    '.gtbody{border-top:1px solid var(--bdr);padding:10px 14px;display:none;font-size:13px;color:var(--t2);line-height:1.7}\n' +
    '.gterm.open .gtbody{display:block}\n' +
    '.fitem{background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:7px;overflow:hidden}\n' +
    '.fhdr{padding:12px 14px;cursor:pointer;display:flex;gap:10px;align-items:flex-start}\n' +
    '.fqicon{color:var(--a);font-weight:700;flex-shrink:0}\n' +
    '.fqtxt{font-size:13px;font-weight:600;color:var(--t);flex:1;line-height:1.4}\n' +
    '.fbody{border-top:1px solid var(--bdr);padding:10px 14px;display:none;font-size:13px;color:var(--t2);line-height:1.7}\n' +
    '.fitem.open .fbody{display:block}\n' +
    /* Logros */
    '.bgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}\n' +
    '.bcard{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;padding:14px;text-align:center;opacity:.38;filter:grayscale(.8);transition:all .4s}\n' +
    '.bcard.ul{opacity:1;filter:none;border-color:var(--a);background:rgba(108,92,231,.08)}\n' +
    '.bicon{font-size:30px;margin-bottom:7px}\n' +
    '.btitle{font-size:13px;font-weight:700;color:var(--t);margin-bottom:3px}\n' +
    '.bdesc{font-size:11px;color:var(--mu);line-height:1.4}\n' +
    '.blocked{font-size:10px;color:var(--mu);margin-top:5px}\n' +
    /* Utility */
    '.btn-p{background:var(--a);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;cursor:pointer;font-family:inherit;width:100%;margin-top:12px;transition:opacity .2s}\n' +
    '.btn-p:hover{opacity:.85}\n' +
    '.slbl{font-size:10px;letter-spacing:3px;color:var(--mu);text-transform:uppercase;font-weight:600;margin:18px 0 9px}\n' +
    '</style>\n';

  // ── ONBOARDING ────────────────────────────────────────────────────────────
  var onbFields = (data.onboarding && data.onboarding.fields) || [];
  var slides = onbFields.map(function(f, i) {
    var inp = f.type === 'text'
      ? '<input type="text" class="onb-in" id="oi-'+escH(f.id)+'" placeholder="'+escH(f.placeholder||'')+'">'
      : '<select class="onb-sel" id="oi-'+escH(f.id)+'"><option value="">— elegir —</option>'+
          (f.options||[]).map(function(o){ return '<option>'+escH(o)+'</option>'; }).join('')+
        '</select>';
    return '<div class="onb-slide'+(i===0?' on':'')+'" id="osl-'+i+'">'+
      '<p class="onb-q">'+escH(f.label)+'</p>'+inp+'</div>';
  }).join('');
  var dots = onbFields.map(function(_,i){ return '<div class="od'+(i===0?' on':'')+'" id="od-'+i+'"></div>'; }).join('');
  var onbHtml =
    '<div id="onb">'+
      '<div class="onb-logo">✦</div>'+
      '<h1 class="onb-title">'+escH(title)+'</h1>'+
      '<p class="onb-tagline">'+escH(tagline)+'</p>'+
      '<div class="onb-dots">'+dots+'</div>'+
      slides+
      '<button class="onb-btn" id="onb-btn" onclick="onbNext()">Siguiente →</button>'+
    '</div>';

  // ── APP HEADER ───────────────────────────────────────────────────────────
  var appHdrHtml =
    '<div class="ahdr" id="ahdr">'+
      '<div class="ahdr-icon">✦</div>'+
      '<div><div class="ahdr-name">'+escH(title)+'</div><div class="ahdr-user" id="ahdr-u"></div></div>'+
    '</div>';

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  var dash = data.dashboard || {};
  var steps = (dash.steps || []);
  var journeyHtml = steps.map(function(s, i){
    return '<div class="jst" id="jst-'+i+'"><div class="jdot">'+(i+1)+'</div><div class="jlbl">'+escH(s)+'</div></div>';
  }).join('');
  var dashMod =
    '<div class="mod on" id="mod-dashboard">'+
      '<div class="mhdr"><div class="mtitle">'+escH(dash.title||'Panel')+'</div><div class="msub" id="dash-sub"></div></div>'+
      '<div class="mbody">'+
        '<div class="dhero"><div class="dgr" id="dgr">'+escH((dash.greeting||'¡Hola, [name]! 👋'))+'</div><div class="dday" id="dday">Día 1</div></div>'+
        '<div class="dpct" id="dpct">0%</div><div class="dpct-lbl">completado</div>'+
        '<div class="dbar"><div class="dfill" id="dfill" style="width:0%"></div></div>'+
        '<div class="dstats">'+
          '<div class="dstat"><div class="dsnum" id="ds-days">0</div><div class="dslbl">días</div></div>'+
          '<div class="dstat"><div class="dsnum" id="ds-done">0</div><div class="dslbl">hechos</div></div>'+
          '<div class="dstat"><div class="dsnum" id="ds-total">0</div><div class="dslbl">total</div></div>'+
        '</div>'+
        (steps.length ? '<div class="slbl">Tu recorrido</div><div class="journey">'+journeyHtml+'</div>' : '')+
        '<div class="nact"><div class="nalbl">'+escH(dash.nextActionLabel||'Tu próxima acción')+'</div><div class="natxt" id="natxt">'+escH((dash.nextActions&&dash.nextActions[0])||'Comienza el checklist')+'</div></div>'+
      '</div>'+
    '</div>';

  // ── CHECKLIST ────────────────────────────────────────────────────────────
  var chkMod = '';
  var chkPhases = [];
  if(data.checklist) {
    var chk = data.checklist;
    chkPhases = chk.phases || [];
    var phHtml = chkPhases.map(function(ph, pi){
      var tasks = ph.tasks || [];
      var taskHtml = tasks.map(function(t, ti){
        return '<div class="ti"><input type="checkbox" id="c_'+pi+'_'+ti+'" onchange="onChk()"><label for="c_'+pi+'_'+ti+'">'+escH(t.text)+'</label></div>';
      }).join('');
      return '<div class="ph" id="ph-'+pi+'">'+
        '<div class="phhdr" onclick="togPh('+pi+')">'+
          '<div class="phprog" id="pp-'+pi+'">0/'+tasks.length+'</div>'+
          '<div class="phtitle">'+escH(ph.title)+'</div>'+
          '<div class="pharr">›</div>'+
        '</div>'+
        '<div class="phbody" id="pb-'+pi+'">'+taskHtml+'</div>'+
      '</div>';
    }).join('');
    chkMod = '<div class="mod" id="mod-checklist">'+
      '<div class="mhdr"><div class="mtitle">'+escH(chk.title||'Checklist')+'</div><div class="msub">'+escH(chk.subtitle||'')+'</div></div>'+
      '<div class="mbody">'+phHtml+'</div></div>';
  }

  // ── SIMULATOR ────────────────────────────────────────────────────────────
  var simMod = '';
  if(data.simulator) {
    var sim = data.simulator;
    var sliders = (sim.sliders||[]).map(function(sl, si){
      return '<div class="sli">'+
        '<div class="slhdr"><span class="slname">'+escH(sl.label)+'</span><span class="slval" id="sv-'+si+'">'+(sl.defaultValue||50)+'</span></div>'+
        '<input type="range" class="slinput" min="0" max="100" value="'+(sl.defaultValue||50)+'" id="sl-'+si+'" oninput="calcSim()">'+
        (sl.weight ? '<div class="slwt">Peso: '+sl.weight+'%</div>' : '')+
      '</div>';
    }).join('');
    simMod = '<div class="mod" id="mod-simulator">'+
      '<div class="mhdr"><div class="mtitle">'+escH(sim.title||'Simulador')+'</div></div>'+
      '<div class="mbody">'+
        '<div class="simres"><div class="simnum" id="simnum">50</div><div class="simzone" id="simzone" style="background:rgba(255,255,255,.07)">—</div><div class="simlbl">'+escH(sim.metricName||'Puntuación')+'</div></div>'+
        sliders+
      '</div></div>';
  }

  // ── COMPARADOR ───────────────────────────────────────────────────────────
  var compMod = '';
  if(data.comparador) {
    var comp = data.comparador;
    // Support both new format (headers+values) and old (criteria array + item.criteria object)
    var headers = comp.headers || comp.criteria || [];
    var items = (comp.items||[]).map(function(item, ii){
      var vals = item.values || (headers.map(function(k){ return (item.criteria&&item.criteria[k])||''; }));
      var rows = headers.map(function(h, hi){
        return '<div class="crow"><span class="ck">'+escH(h)+'</span><span class="cv">'+escH(vals[hi]||'—')+'</span></div>';
      }).join('');
      return '<div class="ccard" id="cc-'+ii+'" data-min="'+(item.minLevel||0)+'">'+
        '<div class="cname">'+escH(item.name)+'</div>'+
        '<div class="clevel">'+escH(item.level||'')+'</div>'+
        rows+
        '<div class="clock-msg" id="cl-'+ii+'" style="display:none">🔒 Sube de nivel para acceder</div>'+
      '</div>';
    }).join('');
    compMod = '<div class="mod" id="mod-comparador">'+
      '<div class="mhdr"><div class="mtitle">'+escH(comp.title||'Comparador')+'</div></div>'+
      '<div class="mbody">'+
        '<div class="sli"><div class="slhdr"><span class="slname">'+escH(comp.sliderLabel||'Nivel')+'</span><span class="slval" id="cpv">0</span></div>'+
        '<input type="range" class="slinput" min="0" max="10" value="0" oninput="filComp(this.value)"></div>'+
        items+
      '</div></div>';
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  var quizMod = '';
  if(data.quiz) {
    var qz = data.quiz;
    var qHtml = (qz.questions||[]).map(function(q, qi){
      return '<div class="qcard">'+
        '<div class="qtxt">'+escH(q.text)+'</div>'+
        '<div class="qopts">'+
          '<button class="qopt" id="qy-'+qi+'" onclick="qAns('+qi+',true,this)">Sí</button>'+
          '<button class="qopt" id="qn-'+qi+'" onclick="qAns('+qi+',false,this)">No</button>'+
        '</div></div>';
    }).join('');
    quizMod = '<div class="mod" id="mod-quiz">'+
      '<div class="mhdr"><div class="mtitle">'+escH(qz.title||'Diagnóstico')+'</div><div class="msub">'+escH(qz.subtitle||'')+'</div></div>'+
      '<div class="mbody">'+
        qHtml+
        '<button class="btn-p" id="qsub" style="display:none" onclick="submitQ()">Ver mi diagnóstico</button>'+
        '<div class="qres" id="qres">'+
          '<div class="qricon" id="qricon">⚠️</div>'+
          '<div class="qrlbl" id="qrlbl">Resultado</div>'+
          '<div class="qrmsg" id="qrmsg"></div>'+
          '<button class="btn-p" onclick="resetQ()">Repetir test</button>'+
        '</div>'+
      '</div></div>';
  }

  // ── PLAN ─────────────────────────────────────────────────────────────────
  var planMod = '';
  if(data.plan) {
    var plan = data.plan;
    var mHtml = (plan.months||[]).map(function(m, mi){
      var acts = (m.actions||[]).map(function(a){ return '<div class="pmact">'+escH(a)+'</div>'; }).join('');
      return '<div class="pm'+(mi===0?' cur':'')+'" id="pm-'+mi+'">'+
        '<div class="pmhdr" onclick="togPm('+mi+')">'+
          '<div class="pmnum">'+(m.month||mi+1)+'</div>'+
          '<div class="pmtitle">'+escH(m.title||('Mes '+(m.month||mi+1)))+'</div>'+
          '<div class="pmarr">›</div>'+
        '</div>'+
        '<div class="pmbody">'+acts+'</div>'+
      '</div>';
    }).join('');
    planMod = '<div class="mod" id="mod-plan">'+
      '<div class="mhdr"><div class="mtitle">'+escH(plan.title||'Mi Plan')+'</div></div>'+
      '<div class="mbody">'+mHtml+'</div></div>';
  }

  // ── GLOSARIO ─────────────────────────────────────────────────────────────
  var glosMod = '';
  if(data.glosario) {
    var gl = data.glosario;
    var tHtml = (gl.terms||[]).map(function(t, ti){
      return '<div class="gterm" id="gt-'+ti+'">'+
        '<div class="gthdr" onclick="togG(\'gt-'+ti+'\')"><span class="gtword">'+escH(t.term)+'</span><span class="gtarr">›</span></div>'+
        '<div class="gtbody">'+escH(t.def)+'</div></div>';
    }).join('');
    var fHtml = (gl.faq||[]).map(function(f, fi){
      return '<div class="fitem" id="fi-'+fi+'">'+
        '<div class="fhdr" onclick="togG(\'fi-'+fi+'\')"><span class="fqicon">?</span><span class="fqtxt">'+escH(f.q)+'</span></div>'+
        '<div class="fbody">'+escH(f.a)+'</div></div>';
    }).join('');
    glosMod = '<div class="mod" id="mod-glosario">'+
      '<div class="mhdr"><div class="mtitle">'+escH(gl.title||'Glosario')+'</div></div>'+
      '<div class="mbody">'+
        '<input type="text" class="gsearch" placeholder="Buscar..." oninput="gSearch(this.value)">'+
        '<div class="slbl">Términos</div><div id="gl-list">'+tHtml+'</div>'+
        (fHtml ? '<div class="slbl">Preguntas frecuentes</div>'+fHtml : '')+
      '</div></div>';
  }

  // ── LOGROS ───────────────────────────────────────────────────────────────
  var logrosMod = '';
  if(data.logros) {
    var lg = data.logros;
    var bgHtml = (lg.badges||[]).map(function(b, bi){
      var bid = escH(b.id||'b'+bi);
      return '<div class="bcard" id="bc-'+bid+'">'+
        '<div class="bicon">'+escH(b.icon||'🏆')+'</div>'+
        '<div class="btitle">'+escH(b.title)+'</div>'+
        '<div class="bdesc">'+escH(b.desc)+'</div>'+
        '<div class="blocked">🔒 Por desbloquear</div>'+
      '</div>';
    }).join('');
    logrosMod = '<div class="mod" id="mod-logros">'+
      '<div class="mhdr"><div class="mtitle">'+escH(lg.title||'Logros')+'</div></div>'+
      '<div class="mbody"><div class="bgrid">'+bgHtml+'</div></div></div>';
  }

  // ── NAV ──────────────────────────────────────────────────────────────────
  var navHtml =
    '<nav class="nav" id="nav"><div class="nav-inner">'+
    mods.map(function(m, i){
      var meta = MOD_META[m] || { icon:'●' };
      return '<button class="nb'+(i===0?' on':'')+'" id="nb-'+m+'" onclick="showM(\''+m+'\')">'+
        '<div class="nb-icon">'+meta.icon+'</div>'+
        '<div class="nb-lbl">'+escH(modLabel(m, lang))+'</div>'+
        '<div class="nb-dot"></div>'+
      '</button>';
    }).join('')+
    '</div></nav>';

  // ── JAVASCRIPT ───────────────────────────────────────────────────────────
  var SK   = 'fpa_'+title.replace(/[^a-zA-Z0-9]/g,'_').slice(0,18);
  var phaseCounts = JSON.stringify(chkPhases.map(function(ph){ return (ph.tasks||[]).length; }));
  var simW = data.simulator ? JSON.stringify((data.simulator.sliders||[]).map(function(s){ return +(s.weight||25); })) : '[]';
  var simZ = data.simulator ? JSON.stringify(data.simulator.zones||[]) : '[]';
  var qRY  = data.quiz ? JSON.stringify((data.quiz.questions||[]).map(function(q){ return !!q.riskIfYes; })) : '[]';
  var qRL  = data.quiz ? JSON.stringify(data.quiz.riskLevels||[]) : '[]';
  var nas  = JSON.stringify((data.dashboard&&data.dashboard.nextActions)||['Comienza el checklist']);
  var lids = data.logros ? JSON.stringify((data.logros.badges||[]).map(function(b){ return b.id||'?'; })) : '[]';
  var onbIds = JSON.stringify(onbFields.map(function(f){ return f.id; }));
  var stepsLen = steps.length;

  var js =
    '<script>\n' +
    'var SK="'+SK.replace(/"/g,'\\"')+'",ST={name:"",ans:{},chk:{},start:null,quizA:[],logros:[]},ob=0;\n' +
    'var OBI='+onbIds+',PC='+phaseCounts+',SW='+simW+',SZ='+simZ+',QRY='+qRY+',QRL='+qRL+',NAS='+nas+',LID='+lids+',SL='+stepsLen+';\n' +
    'function sv(){try{localStorage.setItem(SK,JSON.stringify(ST));}catch(e){}}\n' +
    'function lv(){try{var s=localStorage.getItem(SK);if(s){Object.assign(ST,JSON.parse(s));return true;}}catch(e){}return false;}\n' +
    // ONBOARDING
    'function onbNext(){\n' +
    '  var fid=OBI[ob];var el=document.getElementById("oi-"+fid);var v=(el?el.value:"").trim();\n' +
    '  if(!v){if(el)el.focus();return;}\n' +
    '  if(ob===0)ST.name=v;else ST.ans[fid]=v;\n' +
    '  if(ob<OBI.length-1){\n' +
    '    document.getElementById("osl-"+ob).classList.remove("on");\n' +
    '    ob++;document.getElementById("osl-"+ob).classList.add("on");\n' +
    '    document.querySelectorAll(".od").forEach(function(d,i){d.classList.toggle("on",i===ob);});\n' +
    '    if(ob===OBI.length-1)document.getElementById("onb-btn").textContent="Comenzar ✓";\n' +
    '  }else{ST.start=new Date().toISOString();sv();launch();}\n' +
    '}\n' +
    'function launch(){\n' +
    '  document.getElementById("onb").style.display="none";\n' +
    '  document.getElementById("ahdr").style.display="flex";\n' +
    '  document.getElementById("nav").style.display="block";\n' +
    '  var u=document.getElementById("ahdr-u");if(u)u.textContent=ST.name||"";\n' +
    '  refreshD();\n' +
    '}\n' +
    // MODULE NAV
    'function showM(m){\n' +
    '  document.querySelectorAll(".mod").forEach(function(e){e.classList.remove("on");});\n' +
    '  document.querySelectorAll(".nb").forEach(function(b){b.classList.remove("on");});\n' +
    '  var mod=document.getElementById("mod-"+m);if(mod)mod.classList.add("on");\n' +
    '  var nb=document.getElementById("nb-"+m);if(nb)nb.classList.add("on");\n' +
    '  if(m==="dashboard")refreshD();\n' +
    '}\n' +
    // DASHBOARD
    'function refreshD(){\n' +
    '  var n=ST.name||"";var gr=document.getElementById("dgr");if(gr)gr.textContent=gr.textContent.replace("[name]",n).replace("[name]",n);\n' +
    '  var u=document.getElementById("ahdr-u");if(u)u.textContent=n;\n' +
    '  var days=ST.start?Math.max(0,Math.floor((Date.now()-new Date(ST.start).getTime())/864e5)):0;\n' +
    '  var el=document.getElementById("ds-days");if(el)el.textContent=days;\n' +
    '  var de=document.getElementById("dday");if(de)de.textContent="Día "+Math.max(1,days+1);\n' +
    '  var tot=0,done=0;\n' +
    '  PC.forEach(function(c,pi){tot+=c;for(var ti=0;ti<c;ti++){if(ST.chk["c_"+pi+"_"+ti])done++;}});\n' +
    '  var pct=tot>0?Math.round(done/tot*100):0;\n' +
    '  var pf=document.getElementById("dfill");if(pf)pf.style.width=pct+"%";\n' +
    '  var pp=document.getElementById("dpct");if(pp)pp.textContent=pct+"%";\n' +
    '  var ed=document.getElementById("ds-done");if(ed)ed.textContent=done;\n' +
    '  var et=document.getElementById("ds-total");if(et)et.textContent=tot;\n' +
    '  for(var ji=0;ji<SL;ji++){\n' +
    '    var je=document.getElementById("jst-"+ji);if(!je)continue;\n' +
    '    var jpc=PC[ji]||0;var jd=0;for(var jt=0;jt<jpc;jt++){if(ST.chk["c_"+ji+"_"+jt])jd++;}\n' +
    '    je.className="jst"+(jd===jpc&&jpc>0?" done":jd>0?" cur":"");\n' +
    '  }\n' +
    '  var naEl=document.getElementById("natxt");\n' +
    '  if(naEl){var ni=Math.min(Math.floor(pct/Math.max(1,100/(NAS.length-1))),NAS.length-1);naEl.textContent=NAS[ni]||NAS[0];}\n' +
    '  chkLogros(done,pct);\n' +
    '}\n' +
    // CHECKLIST
    'function togPh(pi){\n' +
    '  var e=document.getElementById("ph-"+pi);if(!e)return;\n' +
    '  e.classList.toggle("open");\n' +
    '  var b=document.getElementById("pb-"+pi);if(b)b.style.display=e.classList.contains("open")?"block":"none";\n' +
    '}\n' +
    'function onChk(){\n' +
    '  document.querySelectorAll(".ti input[type=checkbox]").forEach(function(cb){ST.chk[cb.id]=cb.checked;});\n' +
    '  PC.forEach(function(c,pi){var d=0;for(var ti=0;ti<c;ti++){if(ST.chk["c_"+pi+"_"+ti])d++;}var p=document.getElementById("pp-"+pi);if(p)p.textContent=d+"/"+c;});\n' +
    '  sv();\n' +
    '}\n' +
    'function restChk(){\n' +
    '  Object.keys(ST.chk||{}).forEach(function(id){var e=document.getElementById(id);if(e)e.checked=ST.chk[id];});\n' +
    '  onChk();\n' +
    '}\n' +
    // SIMULATOR
    'function calcSim(){\n' +
    '  if(!SW.length)return;var t=0,ws=0;\n' +
    '  SW.forEach(function(w,i){var e=document.getElementById("sl-"+i);var sv=document.getElementById("sv-"+i);if(e){var v=parseInt(e.value);if(sv)sv.textContent=v+"%";t+=v/100*w;ws+=w;}});\n' +
    '  var s=ws>0?Math.round(t/ws*100):50;\n' +
    '  var ne=document.getElementById("simnum");if(ne)ne.textContent=s;\n' +
    '  var ze=document.getElementById("simzone");\n' +
    '  if(ze){var z=SZ.find(function(z){return s>=z.min&&s<=z.max;});\n' +
    '  if(z){ze.textContent=z.label;ze.style.background=(z.color||"#6c5ce7")+"33";ze.style.color=z.color||"#6c5ce7";}}\n' +
    '}\n' +
    // COMPARADOR
    'function filComp(v){\n' +
    '  var n=parseInt(v)||0;var ce=document.getElementById("cpv");if(ce)ce.textContent=n;\n' +
    '  document.querySelectorAll(".ccard").forEach(function(c){\n' +
    '    var min=parseInt(c.dataset.min)||0;var lk=n<min;\n' +
    '    c.classList.toggle("locked",lk);\n' +
    '    var m=c.querySelector(".clock-msg");if(m)m.style.display=lk?"block":"none";\n' +
    '  });\n' +
    '}\n' +
    // QUIZ
    'var QA=[];\n' +
    'function qAns(qi,val,btn){\n' +
    '  QA[qi]=val;\n' +
    '  var y=document.getElementById("qy-"+qi);var n=document.getElementById("qn-"+qi);\n' +
    '  if(y)y.className="qopt"+(val?" sy":"");if(n)n.className="qopt"+(!val?" sn":"");\n' +
    '  var tot=document.querySelectorAll(".qcard").length;\n' +
    '  var ans=QA.filter(function(a){return a!==undefined;}).length;\n' +
    '  var s=document.getElementById("qsub");if(s)s.style.display=ans>=tot?"block":"none";\n' +
    '}\n' +
    'function submitQ(){\n' +
    '  var sc=0;QRY.forEach(function(ry,i){if(ry&&QA[i]===true)sc++;else if(!ry&&QA[i]===false)sc++;});\n' +
    '  var rl=QRL.find(function(r){return sc>=r.min&&sc<=r.max;})||QRL[0]||{label:"Resultado",message:"",color:"#6c5ce7"};\n' +
    '  var re=document.getElementById("qres");if(re)re.style.display="block";\n' +
    '  var le=document.getElementById("qrlbl");if(le){le.textContent=rl.label||"";le.style.color=rl.color||"";}\n' +
    '  var me=document.getElementById("qrmsg");if(me)me.textContent=rl.message||"";\n' +
    '  var ie=document.getElementById("qricon");if(ie)ie.textContent=sc<=2?"✅":sc<=5?"⚠️":"🚨";\n' +
    '  document.getElementById("qsub").style.display="none";\n' +
    '}\n' +
    'function resetQ(){\n' +
    '  QA=[];document.querySelectorAll(".qopt").forEach(function(b){b.className="qopt";});\n' +
    '  var r=document.getElementById("qres");if(r)r.style.display="none";\n' +
    '  var s=document.getElementById("qsub");if(s)s.style.display="none";\n' +
    '}\n' +
    // PLAN
    'function togPm(mi){\n' +
    '  var e=document.getElementById("pm-"+mi);if(!e)return;\n' +
    '  e.classList.toggle("open");\n' +
    '  var b=e.querySelector(".pmbody");if(b)b.style.display=e.classList.contains("open")?"block":"none";\n' +
    '}\n' +
    // GLOSARIO
    'function togG(id){\n' +
    '  var e=document.getElementById(id);if(!e)return;\n' +
    '  e.classList.toggle("open");\n' +
    '  var b=e.querySelector(".gtbody,.fbody");if(b)b.style.display=e.classList.contains("open")?"block":"none";\n' +
    '}\n' +
    'function gSearch(q){\n' +
    '  var ql=q.toLowerCase();\n' +
    '  document.querySelectorAll(".gterm").forEach(function(e){\n' +
    '    var w=(e.querySelector(".gtword")||{}).textContent||"";\n' +
    '    e.style.display=(!ql||w.toLowerCase().indexOf(ql)>-1)?"":"none";\n' +
    '  });\n' +
    '}\n' +
    // LOGROS
    'function chkLogros(done,pct){\n' +
    '  function ul(id){if(!id||ST.logros.indexOf(id)>-1)return;ST.logros.push(id);sv();var e=document.getElementById("bc-"+id);if(e){e.classList.add("ul");var lk=e.querySelector(".blocked");if(lk)lk.style.display="none";}}\n' +
    '  if(LID[0]&&done>=1)ul(LID[0]);\n' +
    '  if(LID[1]&&pct>=25)ul(LID[1]);\n' +
    '  if(LID[2]&&pct>=50)ul(LID[2]);\n' +
    '  if(LID[3]&&pct>=75)ul(LID[3]);\n' +
    '  if(LID[4]&&pct>=100)ul(LID[4]);\n' +
    '  (ST.logros||[]).forEach(function(id){var e=document.getElementById("bc-"+id);if(e){e.classList.add("ul");var lk=e.querySelector(".blocked");if(lk)lk.style.display="none";}});\n' +
    '}\n' +
    // INIT
    'window.addEventListener("DOMContentLoaded",function(){\n' +
    '  if(lv()&&ST.name){launch();restChk();calcSim();}\n' +
    '  calcSim();\n' +
    '  var pm0=document.getElementById("pm-0");if(pm0){pm0.classList.add("open");var pb=pm0.querySelector(".pmbody");if(pb)pb.style.display="block";}\n' +
    '});\n' +
    '<\/script>';

  // ── ASSEMBLE ─────────────────────────────────────────────────────────────
  return '<!DOCTYPE html>\n<html lang="'+lang+'">\n<head>\n'+
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">\n'+
    '<title>'+escH(title)+'</title>\n'+
    css+
    '</head>\n<body>\n'+
    onbHtml+appHdrHtml+
    dashMod+chkMod+simMod+compMod+quizMod+planMod+glosMod+logrosMod+
    navHtml+js+
    '\n</body>\n</html>';
}

module.exports = { buildPremiumApp: buildPremiumApp };
