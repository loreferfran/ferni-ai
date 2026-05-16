const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
let googleTrends; try { googleTrends = require('google-trends-api'); } catch(e) { googleTrends = null; }

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

const REGS = {
  France: { legal: 'RGPD, Loi Hamon garantie 14 jours, Directive UE 2011/83', healthDisclaimer: 'Ce guide est fourni a titre informatif uniquement et ne remplace pas lavis dun professionnel de sante.', guarantee: 'Garantie satisfait ou rembourse 14 jours', dataProtection: 'Donnees protegees conformement au RGPD.', forbidden: 'Pas de promesses de resultats garantis en sante.', language: 'French', currency: 'EUR' },
  Germany: { legal: 'DSGVO, Heilmittelwerbegesetz HWG, UWG, Fernabsatzrecht', healthDisclaimer: 'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.', guarantee: '14-taegiges Widerrufsrecht', dataProtection: 'Daten werden gemass DSGVO verarbeitet.', forbidden: 'Keine garantierten Heilversprechen.', language: 'German', currency: 'EUR' },
  Italy: { legal: 'GDPR italiano, Codice del Consumo D.lgs 206/2005', healthDisclaimer: 'Questa guida ha scopo puramente informativo e non sostituisce il parere medico.', guarantee: 'Diritto di recesso 14 giorni', dataProtection: 'Dati trattati in conformita al GDPR.', forbidden: 'Vietate promesse di risultati garantiti in salute.', language: 'Italian', currency: 'EUR' },
  Spain: { legal: 'LOPDGDD, LGDCU, LSSI, Directiva UE 2011/83', healthDisclaimer: 'Esta guia tiene fines exclusivamente informativos y no sustituye el consejo medico.', guarantee: 'Derecho de desistimiento 14 dias', dataProtection: 'Datos protegidos conforme a LOPDGDD y RGPD.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'EUR' },
  Portugal: { legal: 'RGPD, Lei de Defesa do Consumidor, Decreto-Lei 24/2014', healthDisclaimer: 'Este guia tem fins exclusivamente informativos e nao substitui o aconselhamento medico.', guarantee: 'Direito de arrependimento 14 dias', dataProtection: 'Dados protegidos de acordo com o RGPD.', forbidden: 'Proibidas promessas de resultados garantidos.', language: 'Portuguese', currency: 'EUR' },
  'United Kingdom': { legal: 'UK GDPR, Consumer Rights Act 2015, ASA Advertising Standards', healthDisclaimer: 'This guide is for informational purposes only and does not replace professional medical advice.', guarantee: '14-day cooling-off period under UK Consumer Rights Act', dataProtection: 'Data protected under UK GDPR.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'GBP' },
  Netherlands: { legal: 'AVG GDPR, Wet handhaving consumentenbescherming', healthDisclaimer: 'Deze gids is uitsluitend informatief en vervangt geen professioneel medisch advies.', guarantee: '14 dagen bedenktijd', dataProtection: 'Persoonsgegevens verwerkt conform AVG.', forbidden: 'Geen gegarandeerde gezondheidsbeloften.', language: 'Dutch', currency: 'EUR' },
  Belgium: { legal: 'RGPD Belgique, Code de droit economique', healthDisclaimer: 'Ce guide est fourni a titre informatif et ne remplace pas lavis medical.', guarantee: 'Droit de retractation 14 jours', dataProtection: 'Donnees protegees conformement au RGPD.', forbidden: 'Pas de promesses garanties en sante.', language: 'French', currency: 'EUR' },
  Sweden: { legal: 'GDPR Sverige, Konsumentkoeplagen, Distansavtalslagen', healthDisclaimer: 'Denna guide ar endast informativ och ersatter inte medicinsk radgivning.', guarantee: '14 dagars angeratt', dataProtection: 'Personuppgifter behandlas enligt GDPR.', forbidden: 'Inga garanterade halsoresultat.', language: 'Swedish', currency: 'SEK' },
  Switzerland: { legal: 'nDSG, OR Obligationenrecht, UWG', healthDisclaimer: 'Dieser Leitfaden dient nur zu Informationszwecken.', guarantee: '14-taegiges Widerrufsrecht', dataProtection: 'Daten gemass nDSG geschuetzt.', forbidden: 'Keine Heilversprechen.', language: 'German', currency: 'CHF' },
  Austria: { legal: 'DSGVO Oesterreich, Konsumentenschutzgesetz', healthDisclaimer: 'Dieser Leitfaden dient nur zu Informationszwecken.', guarantee: '14-taegiges Ruecktrittsrecht', dataProtection: 'Daten gemass DSGVO verarbeitet.', forbidden: 'Keine garantierten Heilversprechen.', language: 'German', currency: 'EUR' },
  Poland: { legal: 'RODO GDPR Polska, Ustawa o prawach konsumenta', healthDisclaimer: 'Ten przewodnik sluzy wylacznie celom informacyjnym.', guarantee: '14-dniowe prawo do odstapienia', dataProtection: 'Dane chronione zgodnie z RODO.', forbidden: 'Zakaz gwarantowanych obietnic zdrowotnych.', language: 'Polish', currency: 'PLN' },
  USA: { legal: 'FTC Regulations, CAN-SPAM Act, CCPA California', healthDisclaimer: 'This guide is for informational purposes only. Results may vary. These statements have not been evaluated by the FDA.', guarantee: '30-day money-back guarantee as required by FTC', dataProtection: 'Data protected per Privacy Policy. California residents have additional rights under CCPA.', forbidden: 'No guaranteed health results per FTC.', language: 'English', currency: 'USD' },
  Canada: { legal: 'PIPEDA, CASL Anti-Spam, Consumer Protection Acts', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: 'Satisfaction guarantee per provincial laws', dataProtection: 'Data protected under PIPEDA.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'CAD' },
  // ASIA
  Japan: { legal: 'Act on Specified Commercial Transactions, Consumer Contract Act', healthDisclaimer: 'This guide is for informational purposes only and does not replace professional medical advice.', guarantee: '8-day cooling-off period', dataProtection: 'Data protected under APPI (Act on the Protection of Personal Information).', forbidden: 'No guaranteed health claims.', language: 'Japanese', currency: 'JPY' },
  'South Korea': { legal: 'Act on Consumer Protection in Electronic Commerce, Framework Act on Consumers', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '7-day withdrawal period', dataProtection: 'Data protected under Personal Information Protection Act.', forbidden: 'No guaranteed health claims.', language: 'Korean', currency: 'KRW' },
  India: { legal: 'Consumer Protection Act 2019, Information Technology Act', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: 'Cancellation within 7 days as per rules', dataProtection: 'Data protected under IT Act and PDP Bill.', forbidden: 'No guaranteed health claims.', language: 'Hindi', currency: 'INR' },
  China: { legal: 'E-commerce Law, Consumer Rights Protection Law', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '7-day return policy', dataProtection: 'Data protected under Cybersecurity Law.', forbidden: 'No guaranteed health claims.', language: 'Chinese', currency: 'CNY' },
  Singapore: { legal: 'Consumer Protection (Fair Trading) Act, Personal Data Protection Act', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '7-day cancellation period', dataProtection: 'Data protected under PDPA.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'SGD' },
  Thailand: { legal: 'Consumer Protection Act, Personal Data Protection Act', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '7-day right of withdrawal', dataProtection: 'Data protected under PDPA.', forbidden: 'No guaranteed health claims.', language: 'Thai', currency: 'THB' },
  // AFRICA
  'South Africa': { legal: 'Consumer Protection Act 68 of 2008, POPIA', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '6-month cooling-off period for direct marketing', dataProtection: 'Data protected under POPIA.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'ZAR' },
  Nigeria: { legal: 'Consumer Protection Council Act, Nigeria Data Protection Regulation', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: 'Refund within 7 days as per NCC guidelines', dataProtection: 'Data protected under NDPR.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'NGN' },
  Kenya: { legal: 'Consumer Protection Act, Data Protection Act', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '7-day cooling-off period', dataProtection: 'Data protected under Data Protection Act.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'KES' },
  UAE: { legal: 'Federal Law No. 15 of 2020 on Consumer Protection, Federal Law No. 45 of 2021 on Personal Data', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '15-day return period', dataProtection: 'Data protected under PDP Law.', forbidden: 'No guaranteed health claims.', language: 'Arabic', currency: 'AED' },
  // OCEANIA
  Australia: { legal: 'Australian Consumer Law, Privacy Act 1988', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: 'Cooling-off period varies by state', dataProtection: 'Data protected under Privacy Act.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'AUD' },
  'New Zealand': { legal: 'Consumer Guarantees Act 1993, Privacy Act 2020', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '5 working days to cancel', dataProtection: 'Data protected under Privacy Act.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'NZD' }
};

const POPULATION = {
  France: '68 millones total, 55 millones adultos',
  Germany: '84 millones total, 70 millones adultos',
  Italy: '60 millones total, 50 millones adultos',
  Spain: '47 millones total, 39 millones adultos',
  Portugal: '10 millones total, 8 millones adultos',
  'United Kingdom': '67 millones total, 55 millones adultos',
  Netherlands: '18 millones total, 15 millones adultos',
  Belgium: '11 millones total, 9 millones adultos',
  Sweden: '10 millones total, 8 millones adultos',
  Switzerland: '8.5 millones total, 7 millones adultos',
  Austria: '9 millones total, 7.5 millones adultos',
  Poland: '38 millones total, 31 millones adultos',
  USA: '335 millones total, 260 millones adultos',
  Canada: '40 millones total, 32 millones adultos'
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  const parts = countryStr.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : countryStr;
}

function getCountryContext(country) {
  const contexts = {
    'France': 'clima templado europeo, arquitectura francesa, paisaje parisiense/rural, verano cálido, invierno frío',
    'Germany': 'clima continental, arquitectura alemana moderna/clasica, paisaje verde, invierno nevado',
    'Italy': 'clima mediterráneo soleado, arquitectura italiana, paisaje costero/campo, terracota, colores cálidos',
    'Spain': 'clima mediterráneo/continental, arquitectura española, paisaje seco/campo, verano muy caluroso',
    'Portugal': 'clima templado atlántico, arquitectura portuguesa, paisaje costero verde, luz dorada',
    'United Kingdom': 'clima templado húmedo, arquitectura británica, paisaje verde/urbano, cielo frecuentemente nublado',
    'Netherlands': 'clima templado, paisaje plano con canales, arquitectura holandesa, bicicletas',
    'Belgium': 'clima templado, paisaje europeo, arquitectura medieval/moderna, cobblestone streets',
    'Sweden': 'clima nórdico frío, paisaje escandinavo boscoso, invierno largo nevado, luz natural extrema',
    'Switzerland': 'clima alpino, paisaje montañoso, arquitectura suiza, naturaleza pristina',
    'Austria': 'clima continental, paisaje alpino, arquitectura vienesa elegante, naturaleza montañosa',
    'Poland': 'clima continental, paisaje europeo central, arquitectura diversa, invierno frío',
    'USA': 'clima variado (tropical/subtropical sur, continental/desértico oeste, templado noreste), arquitectura moderna, paisaje diverso',
    'Canada': 'clima frío boreal, paisaje montañoso/boscoso, arquitectura moderna canadiense, luz natural extrema'
  };
  return contexts[country] || 'clima templado europeo estándar, paisaje diverso, arquitectura contemporánea';
}

function getRegs(country) { return REGS[country] || REGS.France; }

// Genera queries de busqueda inteligentes basadas en el pais, nicho e idioma
const GEO_CODES = {
  'France':'FR','Germany':'DE','Italy':'IT','Spain':'ES','Portugal':'PT',
  'United Kingdom':'GB','Netherlands':'NL','Belgium':'BE','Sweden':'SE',
  'Switzerland':'CH','Austria':'AT','Poland':'PL','USA':'US','Canada':'CA',
  'Japan':'JP','South Korea':'KR','India':'IN','China':'CN','Singapore':'SG',
  'Thailand':'TH','South Africa':'ZA','Nigeria':'NG','Kenya':'KE','UAE':'AE',
  'Australia':'AU','New Zealand':'NZ'
};

async function getRealTrends(keyword, country) {
  if (!googleTrends) return [];
  const geo = GEO_CODES[country] || 'FR';
  const results = [];
  try {
    // Interés a lo largo del tiempo (últimos 3 meses)
    const raw1 = await googleTrends.interestOverTime({ keyword, startTime: new Date(Date.now() - 90*24*60*60*1000), geo });
    const d1 = JSON.parse(raw1);
    const points = (d1.default && d1.default.timelineData) || [];
    if (points.length) {
      const values = points.map(function(p){ return p.value[0]; });
      const avg = Math.round(values.reduce(function(a,b){return a+b;},0)/values.length);
      const last = values[values.length-1];
      const trend = last > avg ? 'subiendo' : last < avg ? 'bajando' : 'estable';
      results.push({ title: 'Google Trends: ' + keyword, snippet: 'Score actual: ' + last + '/100. Promedio 3 meses: ' + avg + '/100. Tendencia: ' + trend + ' en ' + country, source: 'trends_real', query: keyword });
    }
  } catch(e) {}
  try {
    // Búsquedas relacionadas en alza (las más valiosas — "breakout" = +5000%)
    const raw2 = await googleTrends.relatedQueries({ keyword, geo });
    const d2 = JSON.parse(raw2);
    const rising = (d2.default && d2.default.rankedList && d2.default.rankedList[1] && d2.default.rankedList[1].rankedKeyword) || [];
    rising.slice(0, 6).forEach(function(item) {
      var growth = item.value === 'Breakout' ? '+5000% BREAKOUT' : '+' + item.value + '%';
      results.push({ title: 'Trending: ' + item.query, snippet: 'Búsqueda en alza: ' + growth + ' en ' + country + '. Alta demanda emergente.', source: 'trends_rising', query: item.query });
    });
  } catch(e) {}
  try {
    // Temas relacionados en alza
    const raw3 = await googleTrends.relatedTopics({ keyword, geo });
    const d3 = JSON.parse(raw3);
    const risingTopics = (d3.default && d3.default.rankedList && d3.default.rankedList[1] && d3.default.rankedList[1].rankedKeyword) || [];
    risingTopics.slice(0, 4).forEach(function(item) {
      var growth = item.value === 'Breakout' ? '+5000% BREAKOUT' : '+' + item.value + '%';
      results.push({ title: 'Tema en alza: ' + item.topic.title, snippet: 'Crecimiento: ' + growth + ' en ' + country + '. Tipo: ' + item.topic.type, source: 'trends_topics', query: item.topic.title });
    });
  } catch(e) {}
  return results;
}

// Traducción de nichos del español al idioma del país de búsqueda
const NICHE_TRANSLATIONS = {
  'manualidades':    { German:'Basteln DIY Handarbeit', French:'bricolage artisanat DIY', Italian:'fai da te artigianato', Portuguese:'artesanato DIY', Dutch:'knutselen handwerk', Swedish:'pyssel hantverk', Polish:'rękodzieło DIY', English:'crafts DIY handmade' },
  'jardinería':      { German:'Gartenarbeit Gärtnern', French:'jardinage', Italian:'giardinaggio', Portuguese:'jardinagem', Dutch:'tuinieren', Swedish:'trädgårdsarbete', Polish:'ogrodnictwo', English:'gardening' },
  'cocina':          { German:'Kochen Rezepte', French:'cuisine recettes', Italian:'cucina ricette', Portuguese:'culinária receitas', Dutch:'koken recepten', Swedish:'matlagning recept', Polish:'gotowanie przepisy', English:'cooking recipes' },
  'fitness':         { German:'Fitness Sport Training', French:'fitness sport', Italian:'fitness allenamento', Portuguese:'fitness treino', Dutch:'fitness sport', Swedish:'fitness träning', Polish:'fitness trening', English:'fitness workout' },
  'finanzas':        { German:'Finanzen Geld sparen', French:'finances argent', Italian:'finanze soldi', Portuguese:'finanças dinheiro', Dutch:'financiën geld', Swedish:'ekonomi pengar', Polish:'finanse oszczędzanie', English:'personal finance money' },
  'idiomas':         { German:'Sprachen lernen', French:'apprendre langues', Italian:'imparare lingue', Portuguese:'aprender idiomas', Dutch:'talen leren', Swedish:'lära språk', Polish:'nauka języków', English:'learn languages' },
  'programación':    { German:'Programmieren lernen', French:'apprendre programmation', Italian:'imparare programmazione', Portuguese:'aprender programação', Dutch:'programmeren leren', Swedish:'lära programmering', Polish:'programowanie nauka', English:'learn programming coding' },
  'decoración':      { German:'Wohnen Einrichten Dekoration', French:'décoration intérieur', Italian:'arredamento decorazione', Portuguese:'decoração casa', Dutch:'wonen inrichten', Swedish:'inredning dekoration', Polish:'dekoracja wnętrz', English:'home decor interior design' },
  'belleza':         { German:'Beauty Schönheit Pflege', French:'beauté soins', Italian:'bellezza cura', Portuguese:'beleza cuidados', Dutch:'beauty schoonheid', Swedish:'skönhet vård', Polish:'uroda pielęgnacja', English:'beauty skincare' },
  'salud':           { German:'Gesundheit Wohlbefinden', French:'santé bien-être', Italian:'salute benessere', Portuguese:'saúde bem-estar', Dutch:'gezondheid welzijn', Swedish:'hälsa välmående', Polish:'zdrowie dobre samopoczucie', English:'health wellness' },
  'meditación':      { German:'Meditation Achtsamkeit', French:'méditation pleine conscience', Italian:'meditazione mindfulness', Portuguese:'meditação mindfulness', Dutch:'meditatie mindfulness', Swedish:'meditation mindfulness', Polish:'medytacja uważność', English:'meditation mindfulness' },
  'yoga':            { German:'Yoga Übungen', French:'yoga exercices', Italian:'yoga esercizi', Portuguese:'yoga exercícios', Dutch:'yoga oefeningen', Swedish:'yoga övningar', Polish:'joga ćwiczenia', English:'yoga exercises' },
  'crianza':         { German:'Kindererziehung Eltern', French:'parentalité enfants', Italian:'genitorialità bambini', Portuguese:'parentalidade filhos', Dutch:'opvoeding kinderen', Swedish:'föräldraskap barn', Polish:'wychowanie dzieci', English:'parenting children' },
  'negocios':        { German:'Online Business verdienen', French:'business en ligne gagner', Italian:'business online guadagnare', Portuguese:'negócio online ganhar', Dutch:'online business verdienen', Swedish:'online business tjäna', Polish:'biznes online zarabianie', English:'online business make money' },
  'fotografía':      { German:'Fotografie lernen', French:'photographie apprendre', Italian:'fotografia imparare', Portuguese:'fotografia aprender', Dutch:'fotografie leren', Swedish:'fotografi lära', Polish:'fotografia nauka', English:'photography learn' },
  'maquillaje':      { German:'Make-up Schminken', French:'maquillage beauté', Italian:'trucco makeup', Portuguese:'maquiagem beleza', Dutch:'make-up schminken', Swedish:'smink makeup', Polish:'makijaż uroda', English:'makeup beauty tutorials' },
  'costura':         { German:'Nähen Schneidern', French:'couture coudre', Italian:'cucito sartoria', Portuguese:'costura', Dutch:'naaien', Swedish:'sömnad', Polish:'szycie krawiectwo', English:'sewing tutorials' },
  'dibujo':          { German:'Zeichnen lernen', French:'dessin apprendre', Italian:'disegno imparare', Portuguese:'desenho aprender', Dutch:'tekenen leren', Swedish:'rita lära', Polish:'rysowanie nauka', English:'drawing learn' },
  'pintura':         { German:'Malen lernen', French:'peinture apprendre', Italian:'pittura imparare', Portuguese:'pintura aprender', Dutch:'schilderen leren', Swedish:'målning lära', Polish:'malarstwo nauka', English:'painting learn' },
  'música':          { German:'Musik Instrument lernen', French:'musique instrument apprendre', Italian:'musica strumento', Portuguese:'música instrumento', Dutch:'muziek instrument leren', Swedish:'musik instrument', Polish:'muzyka instrument nauka', English:'music instrument learn' },
};

function translateNiche(niche, language) {
  if (!niche) return '';
  var lower = niche.toLowerCase().trim();
  // Buscar coincidencia exacta o parcial
  for (var key in NICHE_TRANSLATIONS) {
    if (lower === key || lower.indexOf(key) !== -1 || key.indexOf(lower) !== -1) {
      return NICHE_TRANSLATIONS[key][language] || NICHE_TRANSLATIONS[key]['English'] || niche;
    }
  }
  return niche; // Si no hay traducción, usar tal cual (muchos términos funcionan en inglés)
}

// DataForSEO — volumen real de búsquedas por país
const DFS_LOCATION_CODES = {
  'France':2250,'Germany':2276,'Italy':2380,'Spain':2724,'Portugal':2620,
  'United Kingdom':2826,'Netherlands':2528,'Belgium':2056,'Sweden':2752,
  'Switzerland':2756,'Austria':2040,'Poland':2616,'USA':2840,'Canada':2124,
  'Japan':2392,'South Korea':2410,'India':2356,'China':2156,'Singapore':2702,
  'Thailand':2764,'South Africa':2710,'Nigeria':2566,'Kenya':2404,'UAE':2784,
  'Australia':2036,'New Zealand':2554
};

const DFS_LANG_CODES = {
  French:'fr',German:'de',Italian:'it',Spanish:'es',Portuguese:'pt',
  English:'en',Dutch:'nl',Swedish:'sv',Polish:'pl',Japanese:'ja',
  Korean:'ko',Hindi:'hi',Arabic:'ar',Chinese:'zh-CN',Thai:'th'
};

function buildSeedKeywords(niche, language) {
  if (!niche || niche === 'general') return [];
  var topic = translateNiche(niche, language);
  var seeds = [topic];
  // Palabras individuales del tema si es multi-palabra
  topic.split(' ').forEach(function(w){ if (w.length > 3) seeds.push(w); });
  // Variantes de intención
  var pfxMap = { French:'comment apprendre ',German:'wie lernt man ',Italian:'come imparare ',
    Spanish:'como aprender ',Portuguese:'como aprender ',English:'how to learn ',
    Dutch:'hoe leer je ',Swedish:'hur lär man sig ',Polish:'jak nauczyć się ' };
  var sfxMap = { French:' débutant',German:' für Anfänger',Italian:' per principianti',
    Spanish:' principiantes',Portuguese:' iniciantes',English:' for beginners',
    Dutch:' beginners',Swedish:' för nybörjare',Polish:' dla początkujących' };
  var pfx = pfxMap[language] || pfxMap.English;
  var sfx = sfxMap[language] || sfxMap.English;
  seeds.push(pfx + topic);
  seeds.push(topic + sfx);
  seeds.push(topic + ' pdf');
  seeds.push(topic + ' guide');
  // Deduplicar y limitar
  return seeds.filter(function(s,i,arr){ return s && arr.indexOf(s)===i; }).slice(0, 15);
}

async function getDataForSEOVolumes(keywords, country, language) {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD || !keywords.length) return [];
  try {
    var auth = Buffer.from(DATAFORSEO_LOGIN + ':' + DATAFORSEO_PASSWORD).toString('base64');
    var locationCode = DFS_LOCATION_CODES[country] || 2250;
    var languageCode = DFS_LANG_CODES[language] || 'en';
    var resp = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keywords: keywords.slice(0,20), location_code: locationCode, language_code: languageCode }])
    });
    if (!resp.ok) return [];
    var data = await resp.json();
    if (!data.tasks || !data.tasks[0] || !data.tasks[0].result) return [];
    return data.tasks[0].result.map(function(item) {
      return { keyword: item.keyword, searchVolume: item.search_volume||0, cpc: item.cpc||0, competition: item.competition||0 };
    }).filter(function(k){ return k.searchVolume > 0; }).sort(function(a,b){ return b.searchVolume - a.searchVolume; });
  } catch (e) {
    console.error('DataForSEO error:', e.message);
    return [];
  }
}

function buildSmartQueries(country, niche, language) {
  const isGeneral = !niche || niche.trim() === '' || niche === 'general' || niche === 'salud bienestar';
  const topic = isGeneral ? '' : translateNiche(niche, language);
  const lang = language || 'French';

  // ── Prefijos de intención principal (cómo busca la gente real en su idioma) ──
  const prefixes = {
    French:     ['comment faire', 'comment apprendre', 'guide pour', 'etapes pour', 'tutoriel', 'erreurs de', 'meilleure facon de', 'aide pour', 'conseils pour', 'debutant', 'methode facile', 'resultats rapides', 'depuis chez soi', 'sans experience', 'checklist', 'pdf', 'modele'],
    German:     ['wie macht man', 'wie lernt man', 'anleitung fuer', 'schritt fuer schritt', 'tutorial', 'fehler bei', 'beste art zu', 'hilfe bei', 'tipps fuer', 'anfaenger', 'einfache methode', 'schnelle ergebnisse', 'von zu hause', 'ohne erfahrung', 'checkliste', 'pdf', 'ratgeber'],
    Italian:    ['come fare', 'come imparare', 'guida per', 'passo dopo passo', 'tutorial', 'errori nel', 'modo migliore per', 'aiuto per', 'consigli per', 'principianti', 'metodo facile', 'risultati veloci', 'da casa', 'senza esperienza', 'checklist', 'pdf', 'modello'],
    Spanish:    ['como hacer', 'como aprender', 'guia para', 'paso a paso', 'tutorial', 'errores al', 'mejor forma de', 'ayuda con', 'consejos para', 'principiantes', 'metodo facil', 'resultados rapidos', 'desde casa', 'sin experiencia', 'checklist', 'pdf', 'plantilla'],
    Portuguese: ['como fazer', 'como aprender', 'guia para', 'passo a passo', 'tutorial', 'erros ao', 'melhor forma de', 'ajuda com', 'dicas para', 'iniciantes', 'metodo facil', 'resultados rapidos', 'de casa', 'sem experiencia', 'checklist', 'pdf', 'modelo'],
    English:    ['how to', 'how to learn', 'guide for', 'step by step', 'tutorial', 'mistakes when', 'best way to', 'help with', 'tips for', 'beginners', 'easy method', 'fast results', 'from home', 'without experience', 'checklist', 'pdf', 'template'],
    Dutch:      ['hoe maak je', 'hoe leer je', 'gids voor', 'stap voor stap', 'tutorial', 'fouten bij', 'beste manier om', 'hulp bij', 'tips voor', 'beginners', 'gemakkelijke methode', 'snelle resultaten', 'thuis', 'zonder ervaring', 'checklist', 'pdf', 'sjabloon'],
    Swedish:    ['hur man gor', 'hur man larer sig', 'guide for', 'steg for steg', 'tutorial', 'misstag nar', 'basta sattet att', 'hjalp med', 'tips for', 'nyborjare', 'enkel metod', 'snabba resultat', 'hemma', 'utan erfarenhet', 'checklista', 'pdf', 'mall'],
    Polish:     ['jak zrobic', 'jak nauczyc sie', 'przewodnik po', 'krok po kroku', 'tutorial', 'bledy przy', 'najlepszy sposob', 'pomoc z', 'wskazowki dla', 'dla poczatkujacych', 'prosta metoda', 'szybkie wyniki', 'w domu', 'bez doswiadczenia', 'lista kontrolna', 'pdf', 'szablon']
  };

  // ── Prefijos de intención de aprendizaje profunda ──
  const learnPfx = {
    French:     ['apprendre a faire', 'apprendre facilement', 'tutoriel debutant', 'je veux apprendre', 'formation rapide', 'cours gratuit'],
    German:     ['lernen wie man', 'einfach lernen', 'tutorial fuer anfaenger', 'ich moechte lernen', 'schnell lernen', 'kostenloser kurs'],
    Italian:    ['imparare a fare', 'imparare facilmente', 'tutorial principianti', 'voglio imparare', 'corso gratuito'],
    Spanish:    ['aprender a hacer', 'aprender facilmente', 'tutorial principiantes', 'quiero aprender', 'aprender desde cero', 'curso gratis'],
    Portuguese: ['aprender a fazer', 'aprender facilmente', 'tutorial iniciantes', 'quero aprender', 'aprender do zero', 'curso gratuito'],
    English:    ['learn how to', 'learn easily', 'beginner tutorial', 'I want to learn', 'learn from scratch', 'free course'],
    Dutch:      ['leren hoe', 'makkelijk leren', 'tutorial beginners', 'gratis cursus'],
    Swedish:    ['lara sig hur', 'latt att lara', 'nybörjare tutorial', 'gratis kurs'],
    Polish:     ['nauczyc sie jak', 'latwo sie nauczyc', 'kurs dla poczatkujacych', 'darmowy kurs']
  };

  // ── Sufijos de intención de compra/deseo (se pegan al final del topic) ──
  const desireSfx = {
    French:     [' resultats en 7 jours', ' methode efficace', ' sans echouer', ' idees creatives', ' inspiration'],
    German:     [' Ergebnisse in 7 Tagen', ' effektive Methode', ' ohne Fehler', ' kreative Ideen', ' Inspiration'],
    Italian:    [' risultati in 7 giorni', ' metodo efficace', ' senza fallire', ' idee creative', ' ispirazione'],
    Spanish:    [' resultados en 7 dias', ' metodo efectivo', ' sin fallar', ' ideas creativas', ' inspiracion'],
    Portuguese: [' resultados em 7 dias', ' metodo eficaz', ' sem falhar', ' ideias criativas', ' inspiracao'],
    English:    [' results in 7 days', ' effective method', ' without failing', ' creative ideas', ' inspiration'],
    Dutch:      [' resultaten in 7 dagen', ' effectieve methode', ' zonder mislukken', ' creatieve ideeen'],
    Swedish:    [' resultat pa 7 dagar', ' effektiv metod', ' utan att misslyckas', ' kreativa ideer'],
    Polish:     [' wyniki w 7 dni', ' skuteczna metoda', ' bez porazki', ' kreatywne pomysly']
  };

  const pfx = prefixes[lang] || prefixes['English'];
  const lpfx = learnPfx[lang] || learnPfx['English'];
  const dsfx = desireSfx[lang] || desireSfx['English'];
  const queries = [];

  if (topic) {
    // BLOQUE 1 — Intención principal (cómo, guía, errores, sin experiencia, checklist...)
    pfx.slice(0, 10).forEach(function(p) { queries.push(p + ' ' + topic + ' ' + country); });

    // BLOQUE 2 — Intención de aprendizaje (quiero aprender, desde cero, curso...)
    lpfx.slice(0, 4).forEach(function(p) { queries.push(p + ' ' + topic + ' ' + country); });

    // BLOQUE 3 — Deseos y resultados (resultados en 7 días, ideas creativas...)
    dsfx.slice(0, 3).forEach(function(sfx) { queries.push(topic + sfx + ' ' + country); });

    // BLOQUE 4 — Plataformas con alta señal de demanda real
    queries.push('site:reddit.com ' + topic + ' ' + country + ' help question');
    queries.push('site:quora.com ' + topic + ' ' + country);
    queries.push(topic + ' tiktok viral ' + country + ' 2025');
    queries.push(topic + ' pinterest ideas ' + country);
    queries.push(topic + ' udemy hotmart curso ' + country);
    queries.push('amazon bestseller ' + topic + ' ' + country);
    queries.push(topic + ' youtube tutorial mas visto ' + country);
    queries.push(topic + ' forum preguntas frecuentes ' + country);

  } else {
    // MODO GENERAL — busca tendencias de alta demanda en el país
    const generalQueries = {
      French: [
        'tendances 2025 quoi apprendre en ligne France',
        'site:doctissimo.fr probleme courant solution',
        'site:quora.com questions frequentes France 2025',
        'amazon.fr bestseller guides pratiques 2025',
        'reddit france probleme solution aide',
        'youtube tutoriels plus vus France 2025',
        'tiktok tendances France 2025 apprendre',
        'pinterest idees populaires France 2025',
        'hotmart udemy cours populaires France',
        'formation en ligne France tendance 2025',
        'ebook pdf guide pratique France populaire',
        'forum france questions recurrentes aide'
      ],
      German: [
        'Trends Deutschland 2025 online lernen',
        'site:gutefrage.net haeufige Probleme Loesung',
        'site:quora.com haeufige Fragen Deutschland',
        'amazon.de Bestseller Ratgeber 2025',
        'reddit Deutschland Problem Hilfe',
        'youtube meistgesehene Tutorials Deutschland 2025',
        'tiktok Trends Deutschland 2025 lernen',
        'pinterest Ideen Deutschland populaer',
        'udemy hotmart Kurse Deutschland',
        'Online Kurs Deutschland Trend 2025'
      ],
      English: [
        'most searched how to guides 2025',
        'site:quora.com most asked questions 2025',
        'amazon bestseller practical guides 2025',
        'reddit most helpful guides problems 2025',
        'youtube most viewed tutorial 2025',
        'tiktok trending learning topics 2025',
        'pinterest most saved ideas 2025',
        'udemy bestseller courses 2025',
        'hotmart most sold digital products',
        'trending online courses 2025'
      ],
      Italian: [
        'tendenze 2025 cosa imparare online Italia',
        'site:quora.com domande frequenti Italia',
        'amazon.it bestseller guide pratiche 2025',
        'reddit italia problema soluzione aiuto',
        'youtube tutorial piu visti Italia 2025',
        'tiktok tendenze Italia 2025',
        'pinterest idee popolari Italia',
        'udemy hotmart corsi popolari Italia'
      ],
      Spanish: [
        'tendencias 2025 que aprender online Espana',
        'site:quora.com preguntas frecuentes Espana',
        'amazon.es bestseller guias practicas 2025',
        'reddit Espana problema solucion ayuda',
        'youtube tutorial mas vistos Espana 2025',
        'tiktok tendencias Espana 2025 aprender',
        'pinterest ideas populares Espana',
        'hotmart udemy cursos populares Espana'
      ],
      Portuguese: [
        'tendencias 2025 o que aprender online Portugal Brasil',
        'site:quora.com perguntas frequentes Portugal',
        'amazon bestseller guias praticas 2025',
        'reddit Portugal Brasil problema solucao ajuda',
        'youtube tutoriais mais vistos 2025',
        'tiktok tendencias Portugal Brasil 2025',
        'pinterest ideias populares Portugal',
        'hotmart udemy cursos populares Portugal Brasil'
      ]
    };
    const gq = generalQueries[lang] || generalQueries['English'];
    gq.forEach(function(q) { queries.push(q); });
  }

  return queries.slice(0, 20);
}

async function claudeCall(system, userContent, maxTokens) {
  maxTokens = maxTokens || 4000;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system: system, messages: [{ role: 'user', content: userContent }] })
  });
  const raw = await resp.text();
  let d;
  try { d = JSON.parse(raw); } catch (e) {
    throw new Error('Claude API returned non-JSON: ' + raw.slice(0, 200));
  }
  if (!resp.ok || d.error) {
    const msg = (d.error && d.error.message) || ('HTTP ' + resp.status);
    throw new Error('Claude API error: ' + msg);
  }
  if (!d.content || !Array.isArray(d.content)) {
    throw new Error('Claude API unexpected response shape: ' + JSON.stringify(d).slice(0, 200));
  }
  return d.content.map(function(c) { return c.text || ''; }).join('');
}

// Busqueda Google organica + People Also Ask
async function serperSearch(query) {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 10, hl: 'fr' })
    });
    if (r.ok) {
      const d = await r.json();
      var results = (d.organic || []).map(function(x) {
        return { title: x.title, snippet: x.snippet, url: x.link, source: 'google', query: query };
      });
      if (d.peopleAlsoAsk) {
        d.peopleAlsoAsk.forEach(function(paa) {
          results.push({ title: paa.question, snippet: paa.snippet || paa.question, url: paa.link || '', source: 'people_also_ask', query: 'PAA: ' + query });
        });
      }
      if (d.relatedSearches) {
        d.relatedSearches.forEach(function(rs) {
          results.push({ title: rs.query, snippet: rs.query, url: '', source: 'related_search', query: 'Related: ' + query });
        });
      }
      return results;
    }
  } catch (e) {}
  return [];
}

// Busqueda Google Trends via Serper - MEJORADA PARA TENDENCIAS REALES
async function serperTrends(keyword, country) {
  try {
    // Búsqueda principal de tendencias
    const r1 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword + ' tendencias 2024 2025 ' + country, num: 8, tbs: 'qdr:m' })
    });

    // Búsqueda de "rising queries" (tendencias emergentes)
    const r2 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword + ' tendencias emergentes 2025 ' + country, num: 6, tbs: 'qdr:m' })
    });

    // Búsqueda de "qué está buscando la gente"
    const r3 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'qué busca la gente sobre ' + keyword + ' ' + country + ' 2025', num: 6, tbs: 'qdr:m' })
    });

    const results = [];

    // Procesar resultados principales
    if (r1.ok) {
      const d1 = await r1.json();
      (d1.organic || []).slice(0, 4).forEach(function(x) {
        results.push({ title: x.title, snippet: x.snippet, url: x.link, source: 'trends_main', query: 'TRENDS: ' + keyword });
      });
    }

    // Procesar tendencias emergentes
    if (r2.ok) {
      const d2 = await r2.json();
      (d2.organic || []).slice(0, 3).forEach(function(x) {
        results.push({ title: x.title, snippet: x.snippet, url: x.link, source: 'trends_rising', query: 'RISING: ' + keyword });
      });
    }

    // Procesar búsquedas de la gente
    if (r3.ok) {
      const d3 = await r3.json();
      (d3.organic || []).slice(0, 3).forEach(function(x) {
        results.push({ title: x.title, snippet: x.snippet, url: x.link, source: 'trends_people', query: 'PEOPLE: ' + keyword });
      });
    }

    return results;
  } catch (e) {
    return [];
  }
}

// Busqueda Reddit via Serper
async function serperReddit(topic, country, language) {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'site:reddit.com ' + topic + ' ' + country, num: 8 })
    });
    if (r.ok) {
      const d = await r.json();
      return (d.organic || []).map(function(x) {
        return { title: x.title, snippet: x.snippet, url: x.link, source: 'reddit', query: 'REDDIT: ' + topic };
      });
    }
  } catch (e) {}
  return [];
}

// Busqueda YouTube via Serper
async function serperYoutube(topic, country) {
  try {
    const r = await fetch('https://google.serper.dev/videos', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: topic + ' ' + country + ' tutorial guide 2024 2025', num: 6 })
    });
    if (r.ok) {
      const d = await r.json();
      return (d.videos || []).map(function(x) {
        return { title: x.title, snippet: (x.snippet||'') + ' Views: ' + (x.views||'?'), url: x.link, source: 'youtube', query: 'YOUTUBE: ' + topic };
      });
    }
  } catch (e) {}
  return [];
}

// Busqueda Amazon bestsellers via Serper
async function serperAmazon(topic, country, currency) {
  const amazonDomain = { France: 'amazon.fr', Germany: 'amazon.de', Italy: 'amazon.it', Spain: 'amazon.es', 'United Kingdom': 'amazon.co.uk', USA: 'amazon.com', Canada: 'amazon.ca' }[country] || 'amazon.fr';
  try {
    const r = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: topic + ' ebook guide pdf bestseller site:' + amazonDomain, num: 6 })
    });
    if (r.ok) {
      const d = await r.json();
      return (d.shopping || []).map(function(x) {
        return { title: x.title, snippet: 'Precio: ' + (x.price||'?') + ' Rating: ' + (x.rating||'?') + ' Reviews: ' + (x.reviews||'?'), url: x.link, source: 'amazon', query: 'AMAZON: ' + topic };
      });
    }
  } catch (e) {}
  return [];
}

// Motor de busqueda profunda multi-fuente
async function searchWithSerper(country, niche, language) {
  const queries = buildSmartQueries(country, niche, language);
  const topic = niche || 'tendencias digitales';
  const currency = (REGS[country] && REGS[country].currency) || 'EUR';
  const allResults = [];

  // 1. Busquedas Google organicas (queries principales)
  for (var i = 0; i < Math.min(queries.length, 8); i++) {
    var r = await serperSearch(queries[i]);
    r.forEach(function(x) { allResults.push(x); });
  }

  // 2. Google Trends REAL (con fallback a Serper si Google bloquea)
  const realTrends = await getRealTrends(topic, country);
  if (realTrends.length > 0) {
    realTrends.forEach(function(x) { allResults.push(x); });
  } else {
    // Fallback: Serper trends si Google Trends no responde
    const trends1 = await serperTrends(topic, country);
    const trends2 = await serperTrends(topic + ' tendencias emergentes', country);
    [...trends1, ...trends2].forEach(function(x) { allResults.push(x); });
  }

  // 3. Reddit (comunidad real, problemas reales)
  var redditResults = await serperReddit(topic, country, language);
  redditResults.forEach(function(x) { allResults.push(x); });

  // 4. YouTube (demanda de video = demanda de contenido)
  var ytResults = await serperYoutube(topic, country);
  ytResults.forEach(function(x) { allResults.push(x); });

  // 5. Amazon bestsellers (productos que ya venden = demanda validada)
  var amzResults = await serperAmazon(topic, country, currency);
  amzResults.forEach(function(x) { allResults.push(x); });

  return allResults;
}

async function analyzeWithGPT4(results, country, niche, language, dfsVolumes) {
  const pop = POPULATION[country] || '50 millones total, 40 millones adultos';
  const isGeneral = !niche || niche === 'general' || niche === 'salud bienestar';

  const sys = 'Eres un sistema avanzado de inteligencia de mercado y analisis de demanda real. Tu mision: detectar oportunidades REALES de productos digitales basadas en comportamiento de busqueda humano.' +
    ' NO inventas ideas — solo detectas lo que la gente ya esta buscando, repitiendo, comprando y pagando.' +
    ' Pais objetivo: ' + country + ' (poblacion: ' + pop + '). Idioma de busqueda: ' + language + '.' +
    ' RESPONDE TODO EN ESPANOL excepto los campos que requieren el idioma local del pais.' +

    '\n\n=== PASO 1: CLUSTERING SEMANTICO (OBLIGATORIO) ===' +
    '\nAntes de analizar, AGRUPA las busquedas con intencion similar en clusters. Ejemplo:' +
    '\n"como bajar de peso" + "quemar grasa rapido" + "perder grasa abdominal" + "deficit calorico" + "adelgazar sin dieta"' +
    '\n→ CLUSTER: "Perdida de peso" — 5 variaciones = señal FUERTE de demanda real.' +
    '\nREGLA: Un cluster con 3+ variaciones en multiples fuentes = demanda confirmada.' +
    '\nUn resultado aislado en 1 sola fuente = señal DEBIL — no lo priorices.' +
    '\nUsa el campo clusterKeywords para listar las variaciones que conforman cada cluster.' +

    '\n\n=== PASO 2: DETECCION DE DEMANDA REAL ===' +
    '\nAnaliza y detecta patrones de intencion recurrente de la gente de ' + country + (isGeneral ? '' : ' sobre "' + niche + '"') + ':' +
    '\n• Intencion dominante y frecuencia de repeticion entre fuentes' +
    '\n• Problemas que reaparecen en Google + Reddit + YouTube + Amazon' +
    '\n• Metas de aprendizaje recurrentes (quiero aprender, como hacer, tutorial)' +
    '\n• Deseos y necesidades practicas con alta intensidad emocional' +
    '\n• Intencion de busqueda: informacional (aprender) / comercial (comprar) / transaccional (resolver ya)' +
    '\n\nLa gente PAGA cuando:' +
    '\n1. AHORRA TIEMPO: el metodo rapido, el atajo, el sistema que evita horas de prueba y error.' +
    '\n2. APRENDEN UNA HABILIDAD: dominar algo practico (manualidades, idioma, herramienta, cocina, musica, video, IA, etc.).' +
    '\n3. RESUELVEN UN PROBLEMA RECURRENTE: algo que les frustra y nadie explica bien en su idioma.' +
    '\n4. ALGO VIRAL O EN TENDENCIA: explota en TikTok, YouTube, Reddit — millones de vistas y gente pidiendo "donde aprendo esto".' +
    '\n5. ORGANIZAN O SIMPLIFICAN: vida, negocio, hogar, salud, finanzas, crianza.' +

    '\n\n=== SEÑALES DE QUE LA GENTE PAGARA ===' +
    '\nBusca estas señales de compra en los datos recibidos:' +
    '\n• Misma pregunta en multiples fuentes (Reddit + YouTube + Google = señal FUERTE)' +
    '\n• Videos con 100k+ vistas sobre el tema' +
    '\n• Comentarios tipo "alguien sabe donde aprendo X" o "me pasa lo mismo"' +
    '\n• Productos similares vendiendose en Amazon/Hotmart/Udemy (demanda validada)' +
    '\n• Busquedas en alza en Google Trends (especialmente Breakout +5000%)' +
    '\n• Foros con muchos "yo tambien tengo ese problema"' +
    '\n• Tutoriales con muchos likes pero la gente pide mas detalle' +

    '\n\n=== REGLAS ANTI-ALUCINACION (CRITICO) ===' +
    '\nNO ESTA PERMITIDO:' +
    '\n✗ Inventar oportunidades sin evidencia directa en los datos recibidos' +
    '\n✗ Priorizar busquedas aisladas (1 sola fuente = señal debil, no es oportunidad top)' +
    '\n✗ Confundir curiosidad pasiva con intencion de compra real' +
    '\n✗ Confundir contenido SEO antiguo indexado con demanda activa ACTUAL' +
    '\n  → Ejemplo: busquedas de "adornos navidenos" en mayo pueden ser SEO viejo, NO demanda actual.' +
    '\n✗ Generar oportunidades ficticias para completar 10 si los datos no las soportan' +
    '\nSI ESTA PERMITIDO: extrapolar razonablemente si los datos son escasos pero el patron de mercado es conocido — indicando que es extrapolacion.' +

    '\n\n=== TIPOS DE DEMANDA A DETECTAR ===' +
    '\n- APRENDIZAJE: "aprender a hacer X", "como aprender X facilmente", "tutorial X para principiantes", "curso gratis"' +
    '\n- HABILIDAD PRACTICA: manualidades, cocina, jardineria, costura, carpinteria, ceramica, pintura, instrumentos' +
    '\n- TECNOLOGIA NUEVA: usar IA, apps, herramientas digitales que estan en tendencia' +
    '\n- AHORRO DE TIEMPO: plantillas, checklists, sistemas, metodos rapidos, resultados en 7 dias' +
    '\n- NEGOCIO DESDE CASA: como vender, como ganar dinero con X habilidad, sin experiencia' +
    '\n- BIENESTAR: recetas saludables, ejercicios, mindfulness, sueno, energia, desde casa' +
    '\n- CRIANZA Y FAMILIA: educacion hijos, organizacion hogar, relaciones de pareja' +
    '\n- VIRAL: cualquier cosa que explote en redes y que la gente quiera aprender o resolver YA' +

    '\n\n=== ANALISIS DE ESTACIONALIDAD (OBLIGATORIO) ===' +
    '\nHoy es ' + new Date().toLocaleDateString('es-ES', {month:'long', year:'numeric'}) + '. Para CADA oportunidad clasifica su ciclo de demanda:' +
    '\n• EVERGREEN: demanda constante todo el ano (finanzas personales, aprender idiomas, recetas, fitness, productividad)' +
    '\n• ESTACIONAL: picos predecibles en meses concretos (Navidad, verano, vuelta al cole, San Valentin). Especifica mesesPico.' +
    '\n• TENDENCIA-TEMPORAL: crecimiento reciente pero incierto a largo plazo. Puede durar meses o un año.' +
    '\n• VIRAL: explosion subita por redes sociales, puede desaparecer en semanas.' +
    '\nREGLA PENALIZACION: si es muy estacional Y esta fuera de temporada ahora, baja scoreMonetizacion 20-30 puntos.' +
    '\nREGLA SEO VIEJO: no confundas contenido historico indexado con demanda real ACTUAL — analiza con criterio.' +

    '\n\n=== CRITERIOS DE OPORTUNIDAD VALIDA ===' +
    '\nUna oportunidad debe cumplir AL MENOS 2 de estos criterios para ser incluida:' +
    '\n✓ Señales repetidas en 2+ fuentes distintas (Google + Reddit, YouTube + Amazon, etc.)' +
    '\n✓ Intencion de busqueda clara: informacional (quiero aprender) o comercial (quiero comprar/resolver)' +
    '\n✓ Resolucion posible con producto digital: PDF, ebook, guia, checklist, plantilla, mini-curso, pack digital' +
    '\n✓ Potencial de monetizacion realista en ' + country + ' al precio de mercado local' +

    '\n\n=== REGLAS DE INCLUSION ===' +
    '\nSIEMPRE devuelve exactamente 10 oportunidades ordenadas por scoreMonetizacion descendente.' +
    ' Refleja la diferencia de calidad de señal en el score: señal fuerte = score alto, señal debil = score bajo.' +
    ' Si los datos son escasos, extrapola razonablemente con patrones de mercados similares e indicalo en porQueEstaOportunidad.' +

    '\n\nDevuelve SOLO JSON array con 10 oportunidades. NINGUN texto fuera del JSON.' +
    ' scoreMonetizacion = viralidad(0-25) + repeticion-multifuente(0-25) + intencion-pago(0-25) + oportunidad-nicho(0-25).' +
    '\n\nCampos obligatorios por oportunidad:' +
    ' problema, problemaEnIdioma (en ' + language + '), busquedaExacta (en ' + language + ' como busca la gente real),' +
    ' necesidad, tipoDemanda (problema/aprendizaje/habilidad/viral/ahorro-tiempo/negocio/bienestar/crianza/tecnologia/otro),' +
    ' tipoCiclo (evergreen/estacional/tendencia-temporal/viral),' +
    ' mesesPico (array de meses, solo si tipoCiclo es estacional — ejemplo: ["diciembre","enero"]),' +
    ' clusterKeywords (array con 3-6 variaciones de busqueda reales que conforman el cluster detectado),' +
    ' repeticionFuentes (numero de fuentes distintas donde aparecio este patron: 1=debil, 2=medio, 3+=fuerte),' +
    ' porQueViral (señal concreta de viralidad o repeticion detectada en los datos),' +
    ' ahorroTiempo (como este producto ahorra tiempo al comprador),' +
    ' motivacionProfunda (por que buscan esto realmente: deseo oculto, miedo, aspiracion, frustracion),' +
    ' emocion, intencionCompra (alta/media/baja), rangoEdad, genero, distribucionGenero,' +
    ' claseSocial, pais, idioma, volumenBusqueda (alto/medio/bajo), volumenEstimado,' +
    ' tendencia (creciendo/estable/bajando), competencia (alta/media/baja), nivelCompetenciaDetalle,' +
    ' oportunidadMonetizacion, tipoProductoDigital (PDF/ebook/guia/checklist/plantilla/mini-curso/pack),' +
    ' tituloEbook, promesaEbook, precioHotmart (en ' + (REGS[country] ? REGS[country].currency : 'EUR') + '),' +
    ' scoreMonetizacion (1-100), urlFuente, keyword (en ' + language + '), keywordES,' +
    ' dolorODeseo, urgencia (alta/media/baja), prioridad (ALTA/MEDIA/BAJA),' +
    ' porQueEstaOportunidad (evidencia concreta de los datos recibidos — cita las fuentes),' +
    ' recomendacion (CREAR/VALIDAR MAS/DESCARTAR),' +
    ' fuentesConsultadas,' +
    ' datosDetallados (keywordsEncontradas, competidoresDetectados, precioPromedioMercado, tendenciaMensual, plataformasDetectadas, señalesViralidad array, señalesValidas array).';

  // Separar resultados por fuente para dar contexto mas rico a GPT-4o
  var googleResults = results.filter(function(r){ return r.source === 'google' || r.source === 'people_also_ask' || r.source === 'related_search'; });
  var redditResults = results.filter(function(r){ return r.source === 'reddit'; });
  var youtubeResults = results.filter(function(r){ return r.source === 'youtube'; });
  var amazonResults = results.filter(function(r){ return r.source === 'amazon'; });
  var trendsResults = results.filter(function(r){ return r.source.startsWith('trends'); });

  var userMsg = 'PAIS: ' + country + ' (poblacion: ' + pop + ')\n' +
    'NICHO: ' + (niche || 'general') + '\n' +
    'IDIOMA: ' + language + '\n\n';

  // DataForSEO — volumen real de búsquedas (va al principio para que GPT-4o lo priorice)
  if (dfsVolumes && dfsVolumes.length > 0) {
    userMsg += '=== VOLUMEN REAL DE BÚSQUEDAS (DataForSEO / Google Ads) ===\n' +
      'Datos reales mensuales en ' + country + ' (' + language + '):\n' +
      dfsVolumes.map(function(kw) {
        var vol = kw.searchVolume.toLocaleString() + ' búsquedas/mes';
        var cpc = kw.cpc > 0 ? ' | CPC: $' + kw.cpc.toFixed(2) : '';
        var comp = kw.competition > 0 ? ' | Competencia: ' + Math.round(kw.competition * 100) + '%' : '';
        return '• "' + kw.keyword + '": ' + vol + cpc + comp;
      }).join('\n') + '\n' +
      'REGLA: usa estos números reales en volumenEstimado. >10.000/mes=alto, 1.000-10.000=medio, <1.000=bajo.\n\n';
  }

  if (trendsResults.length) {
    userMsg += '=== TENDENCIAS RECIENTES (ultimo mes) ===\n' +
      trendsResults.map(function(r){ return '- ' + r.title + ': ' + r.snippet; }).join('\n') + '\n\n';
  }
  if (redditResults.length) {
    userMsg += '=== REDDIT (problemas y preguntas reales de la comunidad) ===\n' +
      redditResults.map(function(r){ return '- ' + r.title + ': ' + r.snippet; }).join('\n') + '\n\n';
  }
  if (youtubeResults.length) {
    userMsg += '=== YOUTUBE (demanda de contenido video - alto interes) ===\n' +
      youtubeResults.map(function(r){ return '- ' + r.title + ' | ' + r.snippet; }).join('\n') + '\n\n';
  }
  if (amazonResults.length) {
    userMsg += '=== AMAZON BESTSELLERS (productos que ya venden = demanda validada) ===\n' +
      amazonResults.map(function(r){ return '- ' + r.title + ' | ' + r.snippet; }).join('\n') + '\n\n';
  }
  userMsg += '=== GOOGLE BUSQUEDAS ORGANICAS + PREGUNTAS FRECUENTES ===\n' +
    googleResults.slice(0, 40).map(function(r) {
      return '[' + (r.source||'google').toUpperCase() + '] ' + r.query + '\n  ' + r.title + '\n  ' + r.snippet;
    }).join('\n---\n');

  userMsg += '\n\n=== INSTRUCCION FINAL ===' +
    '\n1. Aplica clustering semantico: agrupa busquedas similares antes de evaluar.' +
    '\n2. Solo oportunidades con evidencia en los datos anteriores (minimo 2 fuentes o señal muy fuerte en 1).' +
    '\n3. Evalua estacionalidad: clasifica cada oportunidad como evergreen/estacional/tendencia-temporal/viral.' +
    '\n4. No confundas contenido SEO viejo con demanda actual — usa criterio.' +
    '\n5. Devuelve SOLO el JSON array, sin texto introductorio ni explicaciones fuera del JSON.';

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
      temperature: 0.5,
      max_tokens: 8000
    })
  });
  const d = await resp.json();
  return JSON.parse(d.choices[0].message.content.replace(/```json|```/g, '').trim());
}

app.post('/api/search', async function(req, res) {
  try {
    var country = req.body.country;
    var niche = req.body.niche;
    var language = req.body.language;
    var seedKws = buildSeedKeywords(niche, language);
    var results = await Promise.all([
      searchWithSerper(country, niche, language),
      getDataForSEOVolumes(seedKws, country, language)
    ]);
    var serperResults = results[0];
    var dfsVolumes = results[1];
    var opportunities = await analyzeWithGPT4(serperResults, country, niche, language, dfsVolumes);
    res.json({ success: true, opportunities: opportunities, searchCount: serperResults.length, dfsKeywords: dfsVolumes.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/chat', async function(req, res) {
  try {
    var sys = 'Eres FERNI, AI experta en market intelligence y creacion de productos digitales vendibles para Europa y USA. Contexto: ' + req.body.context + '. Responde SIEMPRE en espanol, conciso y accionable. Maximo 3 parrafos.';
    var reply = await claudeCall(sys, req.body.message, 1000);
    res.json({ success: true, reply: reply });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildEbookSystem(countryName, regs) {
  return 'You are a Premium Ebook Creative Director, Market Psychologist, Editorial Designer, and Digital Product Architect.' +
    ' Your job is to create a sellable premium PDF ebook adapted to the niche, audience, emotional context, and commercial objective.' +
    ' This ebook must NOT use a generic design.' +
    ' Before creating the ebook, analyze: (1) Who will buy this PDF? (2) Who will read or use this PDF? (3) What visual style attracts that audience? (4) What colors fit the niche and emotional goal? (5) What tone of voice should be used? (6) What type of images make the product more desirable? (7) What layout style increases perceived value? (8) What would make this PDF feel worth paying for?' +
    '\n\nIMPORTANT AUDIENCE CONTEXT RULE: Always design the ebook according to the final audience.' +
    ' If the ebook is for children: use playful colors, friendly illustrations, simple language, large readable text, fun icons, cheerful layouts, visual storytelling, safe and positive emotional tone, educational but entertaining structure.' +
    ' If the ebook is for parents: use warm trustworthy colors, calm professional design, clear guidance, reassuring tone, practical checklists, family-friendly visuals.' +
    ' If the ebook is for business owners: use clean corporate design, strong structure, charts, frameworks, dashboards, persuasive but professional tone.' +
    ' If the ebook is for women\'s beauty: use elegant, soft, premium visuals, clean beauty aesthetics, emotional transformation language, aspirational imagery.' +
    ' If the ebook is for fitness: use energetic visuals, strong contrast, action-based language, progress trackers and routines.' +
    ' The design must always match: niche, target audience, buyer psychology, emotional desire, market positioning, price perception.' +
    '\n\nPAGE 1 RULE: Page 1 must be completely reserved for the cover image. Do not place text, index, introduction, titles, subtitles, page numbers, headers, footers, or decorative elements on page 1. The written ebook content must start on page 2.' +
    '\n\nPREMIUM PDF REQUIREMENTS: The ebook must feel like a high-value digital product, not a simple document. It must include: strong visual hierarchy, niche-appropriate color palette, premium typography style, clean spacing, professional structure, attractive chapter openings, visually separated sections, image placement suggestions, boxes, highlights, checklists, frameworks, or worksheets when useful, consistent design style from beginning to end.' +
    '\n\nCOMMERCIAL OBJECTIVE: This ebook is created to be sold as an infoproduct. Every decision must increase: perceived value, trust, attractiveness, readability, transformation, buyer satisfaction, resale potential. Do not create a generic ebook. Create a niche-adapted premium PDF experience that feels designed specifically for the audience and commercially ready to sell.' +
    '\n\nIMPORTANT PREMIUM EBOOK RULE: Do not create the ebook as a plain text document. The ebook must feel like a premium workbook, guided experience, or high-value digital course material. To increase perceived value and make the PDF feel more professional and sellable, include visual and interactive content elements throughout the ebook when appropriate. Examples: checklists, quick action steps, practical exercises, trackers, progress sections, "Expert Tip" boxes, "Common Mistakes" sections, "Pro Tip" callouts, highlighted key points, summaries, action plans, routines, worksheets, step-by-step blocks, reflection prompts, before/after examples, challenge sections, implementation sections. The ebook should NOT feel like long walls of text. Pages must breathe visually and maintain a premium editorial rhythm. Use: shorter visual sections, cleaner spacing, structured formatting, educational visual hierarchy, premium workbook-style presentation. The final result must feel like a premium digital guide, a professional workbook, a luxury educational product, a paid online course companion, a high-end infoproduct — NOT a generic AI-generated PDF document.' +
    '\n\nEres simultaneamente: experto mundial en el tema + escritor bestseller + especialista en adaptacion local.' +
    ' Tu mision: crear una guia practica nivel profesional que resuelva el problema del lector COMPLETAMENTE.' +
    ' PAIS DESTINO (solo para contexto de ejemplos y precios): ' + countryName + '. EDITORIAL: Ferni Guides.' +
    ' USA TU CONOCIMIENTO EXPERTO REAL con datos verificables DE ' + countryName + '.' +

    '\n\n=== BLOQUE DE INSTRUCCION ABSOLUTA — IDIOMA DEL EBOOK (FASE 1) ===' +
    '\nEste ebook de Fase 1 debe estar escrito EXCLUSIVAMENTE en español castellano.' +
    '\nEsta regla NO tiene excepciones.' +
    '\n\nIMPORTANTE — Lee esto con atencion:' +
    '\n- Las busquedas web pueden realizarse en cualquier idioma (ingles, frances, aleman, etc.)' +
    '\n- El pais investigado puede ser cualquier pais (Francia, Alemania, Italia, etc.)' +
    '\n- Los resultados de busqueda pueden aparecer en otros idiomas' +
    '\n- NADA de lo anterior afecta el idioma del ebook' +
    '\n\nEl ebook se entrega SIEMPRE en español, independientemente de:' +
    '\n❌ Que pais fue buscado' +
    '\n❌ En que idioma estan las fuentes consultadas' +
    '\n❌ Como se llama el pais en su propio idioma' +
    '\n   (NO escribas "Germany", "Deutschland", "France", "Italia" en italiano —' +
    '\n   SIEMPRE escribe el nombre en español: "Alemania", "Francia", "Italia", etc.)' +
    '\n❌ Ninguna palabra, titulo, subtitulo, oracion o termino puede aparecer en otro idioma' +
    '\n\nChecklist OBLIGATORIO antes de entregar el ebook:' +
    '\n✅ ¿Todos los titulos estan en español? → Si no: reescribirlos' +
    '\n✅ ¿Todos los subtitulos estan en español? → Si no: reescribirlos' +
    '\n✅ ¿El cuerpo del texto esta 100% en español? → Si no: reescribirlo' +
    '\n✅ ¿Todos los nombres de paises y ciudades estan escritos en español? → Si no: corregirlos' +
    '\n✅ ¿Hay alguna palabra en frances, aleman, ingles u otro idioma? → Si la hay: eliminarla' +
    '\n\nLa traduccion al idioma local del pais investigado ocurrira SOLO en Fase 2,' +
    '\ndespues de que el usuario haya revisado, corregido y aprobado explicitamente el ebook en español.' +
    '\nHasta recibir esa aprobacion, NO traduzcas, mezcles ni insertes ninguna palabra de otro idioma bajo ninguna circunstancia.' +
    '\n=== FIN BLOQUE IDIOMA ===' +
    '\n\nFILTRO OBLIGATORIO DE VERIFICACION DE HECHOS (aplicar INTERNAMENTE antes de escribir cada estadistica, dato o cifra):' +
    ' Antes de incluir cualquier estadistica, porcentaje, cifra o dato numerico, aplica este filtro de tres preguntas:' +
    ' (1) ¿Puedo identificar la organizacion exacta, el año y el tipo de documento donde aparece este dato?' +
    ' (2) ¿Estoy atribuyendo el dato a la fuente correcta o lo estoy generalizando como "el gobierno", "estudios dicen" o "investigadores afirman"?' +
    ' (3) ¿Estoy presentando una proyeccion o escenario hipotetico como un hecho absoluto y confirmado?' +
    ' Si alguna respuesta es incierta, SOLO tienes tres opciones validas:' +
    ' (a) Usar la fuente correcta y nombrarla exactamente con organizacion especifica + año (ej: "segun el INE 2023", "segun McKinsey 2024", "segun la ONS 2022").' +
    ' (b) Presentarlo como estimacion o proyeccion con su rango: "se estima que", "aproximadamente entre X e Y", "las proyecciones sugieren".' +
    ' (c) Eliminarlo del contenido y no mencionarlo.' +
    ' PROHIBIDO ABSOLUTO: inventar estadisticas, aproximar fuentes, atribuir datos a organizaciones incorrectas o presentar cifras sin respaldo real.' +
    ' ES PREFERIBLE TENER MENOS DATOS QUE TENER DATOS INCORRECTOS O MAL ATRIBUIDOS.' +
    '\n\nCONDICIONES DE CALIDAD (aplica a cada seccion dentro del limite de extension indicado en el prompt):' +
    ' (1) DENSIDAD: cada parrafo con minimo 1 dato numerico, medida o referencia verificable. Cero filler.' +
    ' (2) METODO: crea un METODO CON NOMBRE PROPIO memorable (ej: Protocolo XYZ, Sistema ABC) — usalo en TODO.' +
    ' (3) TONO: experto cercano. NUNCA primera persona. "Los expertos", "Se recomienda", "Los profesionales de ' + countryName + '".' +
    ' (4) RESULTADO: el lector DEBE poder ejecutar SIN ayuda y ver resultado visible en 7 dias o menos.' +
    ' (5) LOCALIZACION: ejemplos, precios, medidas, referencias TODAS para ' + countryName + ' en ' + (regs.currency || 'EUR') + '.' +
    '\n\nNORMAS DE FORMATO (el PDF usa estas normas):' +
    '\n  LISTAS: usa viñetas asi (una por linea): • Elemento 1 • Elemento 2' +
    '\n  TABLAS: formato markdown: | Columna A | Columna B | fila1 | fila2 |' +
    '\n  SUBTITULOS: usa ## para subtitulos dentro del capitulo.' +
    '\n  NUNCA listas como texto corrido. NUNCA tablas comparativas como parrafo.' +
    '\n\nELEMENTOS RECOMENDADOS (incluir segun el contenido lo requiera):' +
    ' tabla comparativa, checklist practico, tip experto, errores comunes + solucion, ejemplo real de ' + countryName + '.' +
    '\n\nESPECIFICIDAD: usa datos concretos siempre.' +
    ' MAL: "espacio adecuado". BIEN: "en 4m² caben 12 lechugas a 30cm. Semilla 3-5 ' + (regs.currency||'EUR') + '/paquete."' +
    '\n\nELEMENTOS VISUALES INTEGRADOS EN EL TEXTO (usa estos tags cuando el contenido lo requiera):' +
    '\n  [TABLE: titulo | col1 | col2 | col3 ... | fila1col1 | fila1col2 | ...] — para comparaciones, rankings o datos por categoria. Incluye todos los datos completos.' +
    '\n  [BAR CHART: titulo | etiqueta1:valor1 | etiqueta2:valor2 | ...] — para porcentajes, tendencias o comparaciones numericas.' +
    '\n  [LINE CHART: titulo | periodo1:valor1 | periodo2:valor2 | ...] — para evolucion o tendencias en el tiempo.' +
    '\n  [HIGHLIGHT BOX: dato clave o estadistica importante que el lector no debe perderse. Fuente: origen del dato.] — para estadisticas clave, citas importantes o datos criticos.' +
    '\n  [CHECKLIST: item1 | item2 | item3 | ...] — para listas de acciones o verificacion. Cada item debe ser concreto y medible.' +
    '\n  [ICON + TITLE: titulo de seccion o concepto clave] — para separar secciones o destacar conceptos dentro del texto.' +
    '\n  REGLAS: (1) Solo incluirlos cuando aporten valor real y aclaren el contenido, nunca como decoracion. (2) Cada tag debe incluir TODOS los datos necesarios para construir el elemento, nunca vacios. (3) Para contenido con muchos datos numericos, prioriza tablas y graficos. (4) Para guias practicas o narrativas, prioriza highlight boxes y checklists.' +
    '\n\nPROHIBIDO ABSOLUTO:' +
    ' - Primera persona (yo, mi, he). NUNCA.' +
    ' - Experiencias personales inventadas.' +
    ' - Relleno motivacional (max 1 linea/seccion).' +
    ' - Menos de 150 palabras por concepto importante.' +
    ' - ' + regs.forbidden;
}

function buildEbookContext(o, author, countryName, regs) {
  return 'PROBLEMA QUE RESUELVE: ' + (o.problema || o.problem || '') +
    '\nNECESIDAD ESPECIFICA DEL LECTOR: ' + (o.necesidad || o.need || '') +
    '\nTIPO DE DEMANDA: ' + (o.tipoDemanda || 'aprendizaje') +
    '\nPUBLICO OBJETIVO: ' + (o.rangoEdad || o.ageRange || '') + ', ' + (o.genero || o.gender || '') + ', ciudadanos de ' + countryName +
    '\nTITULO EBOOK: ' + (o.tituloEbook || o.ebookTitle || '') +
    '\nPROMESA AL LECTOR: ' + (o.promesaEbook || o.ebookPromise || '') +
    '\nEMOCION PRINCIPAL: ' + (o.emocion || o.emotion || '') +
    '\nDOLOR O DESEO PROFUNDO: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain || '') +
    '\nBUSQUEDA EXACTA: "' + (o.busquedaExacta || o.keyword || '') + '"' +
    '\nPRECIO QUE PAGARA: ' + (o.precioHotmart || o.hotmartPrice || '') + ' ' + regs.currency +
    '\nAUTOR: ' + author +
    '\nPAIS: ' + countryName +
    '\nMONEDA: ' + regs.currency +
    '\nIDIOMA DE ESCRITURA: ESPAÑOL CASTELLANO — FASE 1. REGLA ABSOLUTA SIN EXCEPCIONES:' +
    '\n  - Todo titulo, subtitulo, parrafo, lista, tabla y nota: en ESPAÑOL.' +
    '\n  - El nombre del pais destino: SIEMPRE en español ("Alemania" no "Germany"/"Deutschland", "Francia" no "France", "Italia" no "Italy").' +
    '\n  - Las busquedas y fuentes pueden estar en otro idioma — eso NO afecta el idioma del ebook.' +
    '\n  - CERO palabras en frances, aleman, ingles u otro idioma en el ebook.' +
    '\n  - La traduccion al idioma local ocurre en Fase 2, SOLO despues de aprobacion del usuario.' +
    '\n\nADAPTACION LOCAL OBLIGATORIA:' +
    '\n- TODOS los precios deben estar en ' + regs.currency + ' con equivalencia a otras monedas si aplica' +
    '\n- Las medidas deben ser del sistema usado en ' + countryName + ' (metrico si Europa, imperial si USA/UK)' +
    '\n- Los ejemplos DEBEN ser reales de ' + countryName + ': marcas locales, ciudades, plataformas populares, costumbres' +
    '\n- Las referencias culturales deben ser autenticas y respetuosas con ' + countryName +
    '\n- El clima, estaciones, y contexto natural DEBEN ser los de ' + countryName +
    '\n- Si hay regulaciones legales de ' + countryName + ' que apliquen, mencionarlas' +
    '\n\nMISION CRITICA: Esta persona pago ' + (o.precioHotmart || o.hotmartPrice || 'dinero real') + ' por este ebook.' +
    '\nTiene exactamente este problema: "' + (o.dolorODeseo || o.problema || o.problem || '') + '"' +
    '\nAl terminar DEBE resolver ese problema completamente.' +
    '\nCada capitulo DEBE tener: minimo 3 datos numericos verificables, 1 ejemplo real de ' + countryName + ', pasos que se pueden ejecutar HOY.' +
    '\nEl lector debe quedar ENCANTADO sintiendo que pago poco por tanta calidad.'
}

function extractJSON(txt) {
  // Intento 1: limpiar markdown y parsear directo
  try { return JSON.parse(txt.replace(/```json|```/g, '').trim()); } catch(e) {}
  // Intento 2: encontrar primer { y ultimo }
  var start = txt.indexOf('{');
  var end = txt.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(txt.slice(start, end + 1)); } catch(e) {}
  }
  // Intento 3: buscar bloque ```json ... ```
  var m = txt.match(/```json\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch(e) {} }
  // Intento 4: buscar bloque ``` ... ```
  var m2 = txt.match(/```\s*([\s\S]*?)```/);
  if (m2) { try { return JSON.parse(m2[1].trim()); } catch(e) {} }
  // Intento 5: reparar JSON truncado (dentro de string o en llaves)
  if (start !== -1) {
    var partial = txt.slice(start);
    // Probar distintos cierres: texto truncado dentro de un string de contenido
    var suffixes = ['', '"', '"}', '"}}', '"}}', '"}}}}', '"}]}', '"]}}}'];
    for (var si = 0; si < suffixes.length; si++) {
      var attempt = partial + suffixes[si];
      var opens = (attempt.match(/{/g)||[]).length;
      var closes = (attempt.match(/}/g)||[]).length;
      var arrOpens = (attempt.match(/\[/g)||[]).length;
      var arrCloses = (attempt.match(/\]/g)||[]).length;
      var missingArr = arrOpens - arrCloses;
      var missingObj = opens - closes;
      if (missingArr >= 0 && missingObj >= 0) {
        var repaired = attempt + ']'.repeat(missingArr) + '}'.repeat(missingObj);
        try { return JSON.parse(repaired); } catch(e) {}
      }
    }
  }
  throw new Error('No valid JSON in Claude response. Preview: ' + txt.slice(0, 300));
}

// Verificación de hechos — segundo Claude independiente que audita el contenido generado
app.post('/api/verify-content', async function(req, res) {
  var content = (req.body.content || '').trim();
  var isModule1 = req.body.isModule1 === true;
  if (!content) return res.json({ ok: true, approved: true, result: 'VERIFICACION APROBADA' });

  var module1Warning = isModule1
    ? 'IMPORTANTE: Este contenido fue generado con datos que primero pasaron por un modelo de IA externo (OpenAI) antes de llegar a Claude. Por ello, trata TODO dato numerico y TODA atribucion de fuente como sospechoso hasta validarlo internamente. Se especialmente estricto con estadisticas, cifras exactas y nombres de organizaciones, ya que pudieron haber sido distorsionados o mal resumidos antes de llegar al generador.\n\n'
    : '';

  var verifierPrompt = module1Warning +
    'Eres un editor especializado en verificacion de hechos para contenido de infoproductos digitales. Tu unica funcion es identificar problemas de verificacion factual.\n\n' +
    'Revisa el siguiente contenido e identifica:\n' +
    '1. Cualquier estadistica o dato sin fuente explicitamente nombrada (organizacion especifica + año)\n' +
    '2. Datos atribuidos a "el gobierno", "estudios dicen", "investigadores", "expertos" u otra entidad generica en lugar de la organizacion especifica (ONS, CIPD, McKinsey, WEF, INE, Eurostat, etc.)\n' +
    '3. Proyecciones o peores escenarios presentados como hechos absolutos y confirmados\n' +
    '4. Años que parezcan incorrectos o anacrónicos para el dato citado\n' +
    '5. Herramientas, plataformas, apps o recursos mencionados que no existan o esten desactualizados\n' +
    '6. Datos que parezcan haber sido resumidos o alterados respecto a su fuente original\n\n' +
    'Por cada problema encontrado devuelve exactamente este formato:\n' +
    'PROBLEMA: descripcion del problema\n' +
    'UBICACION: frase exacta donde aparece\n' +
    'CORRECCION: version corregida o instruccion de eliminarlo\n\n' +
    'Si no se encuentran problemas devuelve unicamente: VERIFICACION APROBADA\n\n' +
    'Devuelve SOLO la lista de problemas o VERIFICACION APROBADA. Sin texto adicional, sin introduccion, sin conclusion.\n\n' +
    'CONTENIDO A VERIFICAR:\n' + content.slice(0, 14000);

  try {
    var resp = await claudeClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: verifierPrompt }]
    });
    var result = (resp.content[0].text || '').trim();
    var approved = result === 'VERIFICACION APROBADA' || result === 'VERIFICACIÓN APROBADA';
    res.json({ ok: true, approved: approved, result: result });
  } catch (e) {
    console.error('verify-content error:', e.message);
    res.json({ ok: false, approved: true, result: 'Error en verificacion: ' + e.message });
  }
});

// Generación por capítulo individual — 1 Claude call por sección, sin riesgo de timeout
app.post('/api/generate-chapter', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var section = req.body.section; // 'header' | 'outline' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ending'
  var ebookDefs = req.body.ebookDefs || null;     // diccionario de nombres fijos (del step 'header')
  var ebookOutline = req.body.ebookOutline || null; // plan de capitulos (del step 'outline')
  var userInstructions = (req.body.userInstructions || '').trim();
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var ctx = buildEbookContext(o, author, countryName, regs);
  if (userInstructions) {
    ctx += '\n\nINSTRUCCIONES ADICIONALES DEL AUTOR (obligatorio seguirlas, se suman a las reglas generales — tienen prioridad sobre cualquier regla genérica si hay conflicto):\n' + userInstructions;
  }
  var sys = buildEbookSystem(countryName, regs);
  var year = new Date().getFullYear();

  var defsRule = ebookDefs
    ? ' DICCIONARIO OBLIGATORIO — usa EXACTAMENTE estos nombres en todo el capitulo, NUNCA los cambies ni inventes alternativas: ' + JSON.stringify(ebookDefs) + '.'
    : '';
  var espInstruction = 'TODO en ESPANOL CASTELLANO. El pais se llama en espanol (Alemania no Germany, Francia no France).' +
    ' REGLAS DE PRECIOS Y PRODUCTOS: (1) NUNCA uses precios exactos — usa siempre rangos: "entre X y Y ' + regs.currency + '" o "desde X ' + regs.currency + '". (2) Cuando menciones donde conseguir un producto, da SIEMPRE 2 o 3 opciones de lugares (tiendas, farmacias, supermercados, online) propias de ' + countryName + ', no solo uno.' +
    ' ESTADISTICAS Y DATOS: cuando uses porcentajes o cifras estadisticas escribe SIEMPRE "aproximadamente" antes del numero (ej: "aproximadamente el 60% de las personas..."). NUNCA presentes estadisticas como datos exactos certificados.' +
    defsRule +
    ' AUTOVERIFICACION OBLIGATORIA — antes de entregar el JSON, revisa internamente todo el contenido generado:' +
    ' (1) ¿Cada estadistica o cifra tiene su fuente nombrada con organizacion especifica + año?' +
    ' (2) ¿Algun dato esta atribuido a "el gobierno", "estudios dicen" u entidad generica? Si es asi, corrigelo con la organizacion real o convierte el dato en estimacion.' +
    ' (3) ¿Alguna proyeccion aparece como hecho absoluto confirmado? Si es asi, agrega "se proyecta que" o "se estima que".' +
    ' (4) ¿Todas las herramientas, apps o plataformas mencionadas existen y estan activas en ' + countryName + '?' +
    ' Corrige cualquier error encontrado antes de entregar el JSON.' +
    ' RESPONDE UNICAMENTE CON EL OBJETO JSON. SIN bloques markdown, SIN ``` antes o despues. Empieza con { y termina con }:\n';

  // Calcula regla de estructura para capitulos 1-4 basada en el outline
  function buildOutlineRule(chNum) {
    if (!ebookOutline) return '';
    var myPlan = (ebookOutline['ch' + chNum] || {});
    var myTopics = myPlan.topics || [];
    var prevTopics = [];
    for (var pi = 1; pi < chNum; pi++) {
      prevTopics = prevTopics.concat((ebookOutline['ch' + pi] || {}).topics || []);
    }
    var rule = '';
    if (myTopics.length) rule += ' TEMAS ASIGNADOS A ESTE CAPITULO (cubrir todos, sin salirse): ' + JSON.stringify(myTopics) + '.';
    if (prevTopics.length) rule += ' TEMAS YA EXPLICADOS EN CAPITULOS ANTERIORES — NO los repitas, NO los menciones en detalle, NO repitas sus procesos paso a paso: ' + JSON.stringify(prevTopics) + '. Si necesitas hacer referencia a algo anterior, menciona solo "como vimos en el capitulo anterior" sin repetir el proceso.';
    return rule;
  }

  try {
    var schema, prompt, maxTokens;

    if (section === 'header') {
      schema = JSON.stringify({
        definitions: {
          methodName: 'nombre unico e inspirador para el metodo/sistema central del ebook (2-4 palabras). Se usara identico en TODOS los capitulos.',
          procedures: 'array de 2-4 strings: nombres de procedimientos o tecnicas especificas que se usaran en el ebook. Cada nombre debe ser coherente y constante en todos los capitulos.',
          keyTerms: 'objeto con 2-4 pares clave-valor: terminos del nicho que deben escribirse siempre igual en todo el ebook. Solo incluir si hay terminologia que podria escribirse de formas distintas.'
        },
        title: 'titulo impactante max 10 palabras',
        subtitle: 'subtitulo vendedor max 12 palabras',
        tagline: 'tagline max 8 palabras',
        intro: 'introduccion 350-450 palabras: gancho emocional + dato real de ' + countryName + ' + promesa clara + por que este metodo funciona'
      });
      prompt = 'Antes de escribir el ebook, define el diccionario de nombres que usaras en TODOS los capitulos (definitions). Luego escribe titulo, subtitulo, tagline e introduccion. ' + espInstruction + schema;
      maxTokens = 1800;

    } else if (section === 'outline') {
      // Paso de planificacion: Claude define exactamente que cubre cada capitulo sin repetirse
      schema = JSON.stringify({
        ch1: { title: 'titulo del capitulo 1', topics: ['subtema 1a exclusivo de cap 1','subtema 1b exclusivo de cap 1','subtema 1c exclusivo de cap 1','subtema 1d exclusivo de cap 1'] },
        ch2: { title: 'titulo del capitulo 2', topics: ['subtema 2a exclusivo de cap 2','subtema 2b exclusivo de cap 2','subtema 2c exclusivo de cap 2','subtema 2d exclusivo de cap 2'] },
        ch3: { title: 'titulo del capitulo 3', topics: ['subtema 3a exclusivo de cap 3','subtema 3b exclusivo de cap 3','subtema 3c exclusivo de cap 3','subtema 3d exclusivo de cap 3'] },
        ch4: { title: 'titulo del capitulo 4', topics: ['subtema 4a exclusivo de cap 4','subtema 4b exclusivo de cap 4','subtema 4c exclusivo de cap 4','subtema 4d exclusivo de cap 4'] }
      });
      prompt = 'Planifica los 4 capitulos del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.' +
        ' REGLA CRITICA: cada capitulo debe tener 4 subtemas UNICOS que NO aparecen en ningun otro capitulo.' +
        ' La estructura logica debe ser: Cap1=fundamentos/diagnostico, Cap2=metodo paso a paso, Cap3=aplicacion avanzada/casos practicos, Cap4=resultados/mantenimiento.' +
        ' NINGUN proceso, tecnica o concepto puede repetirse entre capitulos — si algo se explica en el cap 1, el cap 2 no puede volver a explicarlo aunque cambie las palabras.' +
        ' ' + espInstruction + schema;
      maxTokens = 1000;

    } else if (section === 'ch1') {
      var outRule1 = buildOutlineRule(1);
      schema = JSON.stringify({chapter1:{number:1,title:'titulo max 8 palabras',opening:'120-150 palabras: apertura impactante + dato real de ' + countryName + ' + por que es urgente resolver esto',content:'700-900 palabras: 4 subsecciones practicas con ejemplos reales de ' + countryName + ', datos numericos, lista de recursos con precios en ' + regs.currency + ', 2-3 errores comunes y como evitarlos',keyPoints:['dato numerico real de ' + countryName,'medida o tiempo concreto','consejo practico verificable','ejemplo del metodo','resultado medible'],exercise:{title:'Ejercicio practico — 30 minutos hoy',steps:['Paso 1: accion concreta con tiempo estimado','Paso 2: accion concreta con tiempo estimado','Paso 3: verificacion del resultado']}}});
      prompt = 'Escribe el capitulo 1 del ebook.' + outRule1 + ' LIMITE ESTRICTO DE EXTENSION: opening MAXIMO 150 palabras, content MAXIMO 900 palabras. La calidad premium viene de PRECISION y DENSIDAD, no de longitud. Cumple el JSON completo dentro del limite. ' + espInstruction + schema;
      maxTokens = 4000;

    } else if (section === 'ch2') {
      var outRule2 = buildOutlineRule(2);
      schema = JSON.stringify({chapter2:{number:2,title:'titulo max 8 palabras',opening:'120-150 palabras: apertura que conecta brevemente con el cap 1 + nuevo angulo del tema en ' + countryName,content:'700-900 palabras: 4 subsecciones con metodo paso a paso, tabla comparativa de opciones con precios en ' + regs.currency + ', errores frecuentes y soluciones, estadisticas de ' + countryName,keyPoints:['dato verificable del sector','tiempo o costo exacto','criterio de eleccion claro','ejemplo practico de ' + countryName,'resultado esperado'],exercise:{title:'Ejercicio practico — aplicar metodo',steps:['Paso 1: accion concreta','Paso 2: accion concreta','Paso 3: verificacion del avance']}}});
      prompt = 'Escribe el capitulo 2 del ebook.' + outRule2 + ' LIMITE ESTRICTO DE EXTENSION: opening MAXIMO 150 palabras, content MAXIMO 900 palabras. La calidad premium viene de PRECISION y DENSIDAD, no de longitud. Cumple el JSON completo dentro del limite. ' + espInstruction + schema;
      maxTokens = 4000;

    } else if (section === 'ch3') {
      var outRule3 = buildOutlineRule(3);
      schema = JSON.stringify({chapter3:{number:3,title:'titulo max 8 palabras',opening:'120-150 palabras: apertura que profundiza en la transformacion con ejemplos de ' + countryName,content:'700-900 palabras: plan paso a paso con tiempos exactos, 4-5 tips expertos unicos, checklist de control, ejemplos avanzados de ' + countryName + ', precios reales en ' + regs.currency,keyPoints:['tip experto no obvio','tiempo o medida exacta','criterio de calidad verificable','ejemplo avanzado','resultado observable en dias'],exercise:{title:'Plan de accion — proximas 2 semanas',steps:['Semana 1: que hacer exactamente con resultado esperado','Semana 2: que hacer exactamente con verificacion','Control final: como saber que funciono']}}});
      prompt = 'Escribe el capitulo 3 del ebook.' + outRule3 + ' LIMITE ESTRICTO DE EXTENSION: opening MAXIMO 150 palabras, content MAXIMO 900 palabras. La calidad premium viene de PRECISION y DENSIDAD, no de longitud. Cumple el JSON completo dentro del limite. ' + espInstruction + schema;
      maxTokens = 4000;

    } else if (section === 'ch4') {
      var outRule4 = buildOutlineRule(4);
      schema = JSON.stringify({chapter4:{number:4,title:'titulo max 8 palabras',opening:'120-150 palabras: vision del resultado final + casos reales de ' + countryName,content:'700-900 palabras: como verificar el exito (5 criterios concretos), como mantener resultados a largo plazo, errores finales a evitar, tabla resumen antes/despues, proximo nivel y recursos en ' + regs.currency,keyPoints:['logro medible concreto','indicador de exito verificable','habito de mantenimiento clave','comparacion antes/despues real','impacto en calidad de vida'],exercise:{title:'Checklist de verificacion final',steps:['Verificacion 1: criterio objetivo y como medirlo','Verificacion 2: criterio objetivo y como medirlo','Mantenimiento: que hacer cada mes para mantener resultados']}}});
      prompt = 'Escribe el capitulo 4 del ebook.' + outRule4 + ' LIMITE ESTRICTO DE EXTENSION: opening MAXIMO 150 palabras, content MAXIMO 900 palabras. La calidad premium viene de PRECISION y DENSIDAD, no de longitud. Cumple el JSON completo dentro del limite. ' + espInstruction + schema;
      maxTokens = 4000;

    } else if (section === 'ending') {
      prompt = 'Escribe la conclusion, plan de accion, recursos y aviso legal del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.' +
        ' conclusion: 250-350 palabras inspiradoras con resultados esperados y llamada a accion.' +
        ' actionPlan: array con exactamente 3 strings — cada string es una accion concreta y especifica del tema del ebook (NO ejemplos genericos), con tiempo estimado y resultado esperado. Ejemplo real: "Esta tarde dedica 20 minutos a identificar tu tipo de piel con el test del papel secante: presiona suavemente en frente y mejillas. Si el papel se impregna en T eres mixta, si es seco eres normal/seca."' +
        ' resources: array con 3 strings — recursos reales y utiles para el tema (apps, webs, libros, comunidades) disponibles en ' + countryName + '.' +
        ' legalSection: objeto con healthDisclaimer, guarantee, dataProtection, copyright.' +
        ' ' + espInstruction +
        JSON.stringify({conclusion:'[texto conclusion]',actionPlan:['[accion 1 especifica del ebook con tiempo y resultado]','[accion 2 especifica del ebook con tiempo y resultado]','[accion 3 especifica del ebook con tiempo y resultado]'],resources:['[recurso 1 real]','[recurso 2 real]','[recurso 3 real]'],legalSection:{healthDisclaimer:regs.healthDisclaimer,guarantee:regs.guarantee,dataProtection:regs.dataProtection,copyright:'© '+year+' Ferni Guides | Editorial especializada en guias practicas'}});
      maxTokens = 2000;

    } else {
      return res.status(400).json({ success: false, error: 'section invalida: ' + section });
    }

    var txt = await claudeCall(sys, ctx + '\n\n' + prompt, maxTokens);
    var data = extractJSON(txt);
    res.json({ success: true, section: section, data: data });
  } catch (e) {
    console.error('generate-chapter error [' + section + ']:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Endpoint separado para cada parte - evita timeout de Vercel
app.post('/api/generate-ebook-p1', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var ctx = buildEbookContext(o, author, countryName, regs);
  var sys = buildEbookSystem(countryName, regs);
  try {
    // Intro + capitulo 1 (llamada separada para evitar truncamiento)
    var schema1 = JSON.stringify({title:'titulo impactante max 10 palabras',subtitle:'subtitulo vendedor max 12 palabras',tagline:'tagline max 8 palabras',intro:'introduccion 400-500 palabras - gancho emocional profundo + historia real de ' + countryName + ' + promesa clara + por que ESTE metodo funciona + dato del problema',chapter1:{number:1,title:'titulo max 8 palabras',opening:'apertura 200-250 palabras impactante + contexto + por que es critico',content:'contenido 2500+ PALABRAS MINIMO - explicacion profunda 6-7 subsecciones minimo 350 p/c - datos numericos reales de ' + countryName + ' - lista detallada recursos con precios en ' + regs.currency + ' - tabla comparativa - checklist - 3+ errores comunes + solucion',keyPoints:['punto clave: dato numerico especifico de ' + countryName,'punto clave: medida tiempo o costo exacto','punto clave: criterio verificable','punto clave: conexion al metodo','punto clave: ejemplo real de ' + countryName,'punto clave: dato sorprendente'],exercise:{title:'Plan 60 minutos - ejercicio practico HOY',description:'descripcion 150+ palabras con pasos concretos, tiempo por paso, resultado esperado al final',steps:['paso 1 con tiempo - accion concreta - resultado esperado','paso 2 con tiempo - accion concreta - resultado esperado','paso 3 con tiempo - accion concreta - resultado esperado','paso 4 con tiempo - verificacion objetiva - resultado final medible']}}});
    var txt1 = await claudeCall(sys, ctx + '\n\nEscribe SOLO la introduccion y capitulo 1. MINIMO 2500 palabras en Cap1. OBLIGATORIO FASE 1: TODO en ESPANOL CASTELLANO. CERO palabras en frances, aleman, ingles u otro idioma. El pais destino se llama en español (Alemania, Francia, Italia — NUNCA Germany, France, Italy). La traduccion es Fase 2 y aun no ocurre. JSON valido sin markdown:\n' + schema1, 8000);
    var part1 = extractJSON(txt1);

    // Capitulo 2 (llamada separada)
    var schema2 = JSON.stringify({chapter2:{number:2,title:'titulo max 8 palabras',opening:'apertura 200-250 palabras profunda',content:'contenido 2500+ PALABRAS MINIMO - 6-7 subsecciones minimo 350 p/c - tabla comparativa A vs B vs C - 4+ errores comunes con solucion - estadistica real del sector en ' + countryName + ' - ejemplos concretos de ' + countryName + ' - todos los precios en ' + regs.currency,keyPoints:['punto: dato numerico verificable','punto: medida o tiempo concreto','punto: criterio de seleccion','punto: conexion al metodo principal','punto: ejemplo de ' + countryName,'punto: resultado medible'],exercise:{title:'ejercicio practico - aplicacion del metodo Cap2',description:'descripcion 150+ palabras con pasos y tiempo',steps:['paso 1 con duracion - accion - resultado observable','paso 2 con duracion - accion - resultado observable','paso 3 con duracion - accion - resultado observable','paso 4 con duracion - verificacion - resultado final']}}});
    var txt2 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 2. MINIMO 2500 palabras. OBLIGATORIO FASE 1: TODO en ESPANOL CASTELLANO. CERO palabras en frances, aleman, ingles u otro idioma. El pais destino se llama en español (Alemania, Francia, Italia — NUNCA Germany, France, Italy). La traduccion es Fase 2 y aun no ocurre. JSON valido sin markdown:\n' + schema2, 8000);
    var part2 = extractJSON(txt2);

    res.json({ success: true, part: { title: part1.title, subtitle: part1.subtitle, tagline: part1.tagline, intro: part1.intro, chapter1: part1.chapter1, chapter2: part2.chapter2 } });
  } catch (e) {
    console.error('p1 error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-ebook-p2', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var ctx = buildEbookContext(o, author, countryName, regs);
  var sys = buildEbookSystem(countryName, regs);
  try {
    // Solo capítulo 3 para evitar truncamiento
    var schema3 = JSON.stringify({chapter3:{number:3,title:'titulo max 8 palabras - aplicacion avanzada',opening:'apertura 200-250 palabras profunda',content:'contenido 2500+ PALABRAS MINIMO - 6-7 subsecciones minimo 350 p/c - plan paso a paso detallado con tiempos exactos - 5+ tips expertos unicos no en internet - tabla comparativa - checklist avanzado - ejemplos de ' + countryName + ' - precios en ' + regs.currency,keyPoints:['punto: dato numerico con contexto','punto: tiempo o medida exacta','punto: tip experto no publicado','punto: conexion con metodo','punto: ejemplo avanzado','punto: resultado observable'],exercise:{title:'Aplicacion avanzada - cronograma 8 semanas',description:'descripcion 150+ palabras - cronograma real con hitos medibles - tiempo estimado total - resultado esperado final',steps:['Semana 1-2: preparacion - que hacer exactamente - resultado esperado','Semana 3-4: implementacion basica - tareas concretas - verificacion','Semana 5-6: optimizacion - ajustes - medicion resultados','Semana 7-8: resultados finales - verificacion profesional - siguiente nivel']}}});
    var txt3 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 3. MINIMO 2500 palabras. OBLIGATORIO FASE 1: TODO en ESPANOL CASTELLANO. CERO palabras en frances, aleman, ingles u otro idioma. El pais destino se llama en español (Alemania, Francia, Italia — NUNCA Germany, France, Italy). La traduccion es Fase 2 y aun no ocurre. JSON valido sin markdown:\n' + schema3, 8000);
    var ch3 = extractJSON(txt3);

    // Solo capítulo 4
    var schema4 = JSON.stringify({chapter4:{number:4,title:'titulo max 8 palabras - dominio profesional',opening:'apertura 200-250 palabras vision inspiradora + resultados reales de ' + countryName,content:'contenido 2500+ PALABRAS MINIMO - resultado final detallado con datos - como verificar (5-7 criterios concretos) - como mantener a largo plazo - 3+ errores finales evitar - siguiente nivel avanzado - tabla resumen antes/despues - precios en ' + regs.currency,keyPoints:['logro verificable: dato numerico concreto','logro verificable: medida o indicador','logro verificable: tiempo alcanzado','logro verificable: comparacion antes/despues','logro verificable: ejemplo real','logro verificable: impacto en vida'],exercise:{title:'Checklist de verificacion profesional + mantenimiento',description:'descripcion 150+ palabras con criterios objetivos y plan de mantenimiento a perpetuidad',steps:['Verificacion 1: criterio objetivo medible - como checkearlo','Verificacion 2: criterio objetivo medible - como checkearlo','Verificacion 3: criterio objetivo medible - como checkearlo','Mantenimiento mensual: que hacer para mantener resultados 12+ meses']}}});
    var txt4 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 4 (resultado final). MINIMO 2500 palabras. OBLIGATORIO FASE 1: TODO en ESPANOL CASTELLANO. CERO palabras en frances, aleman, ingles u otro idioma. El pais destino se llama en español (Alemania, Francia, Italia — NUNCA Germany, France, Italy). La traduccion es Fase 2 y aun no ocurre. JSON valido sin markdown:\n' + schema4, 8000);
    var ch4 = extractJSON(txt4);

    res.json({ success: true, part: { chapter3: ch3.chapter3, chapter4: ch4.chapter4 } });
  } catch (e) {
    console.error('p2 error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-ebook-p3', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var year = new Date().getFullYear();
  var ctx = buildEbookContext(o, author, countryName, regs);
  var sys = buildEbookSystem(countryName, regs);
  try {
    var schema = JSON.stringify({conclusion:'conclusion inspiradora 300-400 palabras - resumen del metodo - resultados esperados - llamada a accion - proximos pasos - impacto en vida',actionPlan:['Accion 1 (hoy): tarea concreta con tiempo estimado y resultado esperado','Accion 2 (esta semana): tarea concreta con detalles y resultado medible','Accion 3 (este mes): hito importante - criterio de exito - conexion a siguiente nivel'],resources:['recurso 1 con descripcion de por que es util','recurso 2 con descripcion de por que es util','recurso 3 con descripcion de por que es util','plantilla o checklist bonus si aplica'],legalSection:{healthDisclaimer:regs.healthDisclaimer,guarantee:regs.guarantee,dataProtection:regs.dataProtection,copyright:'© '+year+' Ferni Guides | Editorial especializada en guías prácticas'}});
    var txt = await claudeCall(sys, ctx + '\n\nEscribe PARTE 3 del ebook: conclusion + plan + recursos + legal. IMPORTANTE: conclusion 300-400 palabras (NO CORTA), cada plan de accion 80+ palabras, recursos con descripcion, legal completo. Adapta TODO a ' + countryName + '. Responde SOLO JSON valido sin markdown:\n' + schema, 2500);
    var p3 = extractJSON(txt);
    res.json({ success: true, part: p3 });
  } catch (e) {
    console.error('p3 error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Keep old endpoint for compatibility
app.post('/api/generate-ebook', async function(req, res) {
  res.json({ success: false, error: 'Use /api/generate-ebook-p1, p2, p3 separately' });
});

app.post('/api/translate-ebook', async function(req, res) {
  var ebook = req.body.ebook;
  var language = req.body.language;
  var country = req.body.country;
  var author = req.body.author;
  var regs = getRegs(country);
  var sys = 'Eres traductor literario nativo de ' + language + ' + especialista en localizacion cultural para ' + country + '.' +
    ' Tu trabajo NO es solo traducir, sino ADAPTAR a ' + country + ' en TODO:' +
    '\n\nREGLAS OBLIGATORIAS:' +
    ' 1. Traduce al ' + language + ' mas natural posible — el lector debe sentir que fue escrito ORIGINALMENTE en ' + language + '.' +
    ' 2. CONSERVA EXACTAMENTE todos los numeros, medidas, cantidades — estos NO se cambian.' +
    ' 3. Adapta monedas: si hay EUR, cambia a moneda local con equivalencia aprox. Si hay USD, idem.' +
    ' 4. Adapta medidas: si hay km/kg, mantén metrico. Si es USA/UK, cambia a millas/libras con conversion.' +
    ' 5. Adapta EJEMPLOS y REFERENCIAS a ' + country + ' — ciudades locales, marcas locales, plataformas populares en ' + country + ', costumbres, clima.' +
    ' 6. Adapta idiomas y expresiones a lo natural de ' + language + ' en ' + country + ' (modismos, tonalidad, humor local).' +
    ' 7. Nombre del autor: ' + author + ' — NO traducir.' +
    ' 8. Regulaciones legales: ' + regs.legal + ' — si es relevante, menciona.' +
    ' 9. Devuelve SOLO JSON con la misma estructura, sin markdown, sin texto extra.' +
    ' 10. Si hay referencias a estaciones/clima, adapta a ' + country + '.' +
    '\n\nEJEMPLOS DE ADAPTACION:' +
    ' - INGLES: "In California, plant in spring" → ESPAÑA: "En el clima del Mediterráneo español, planta en abril-mayo cuando haya pasado el riesgo de heladas"' +
    ' - INGLES: "$50/month" → ESPAÑA: "50 EUR/mes (equivalente a unos $55 USD)"' +
    ' - INGLES: "Facebook Marketplace" → ESPAÑA: "Marketplace de Facebook o plataformas locales como Milanuncios o Wallapop"';
  try {
    var t1 = JSON.parse((await claudeCall(sys, JSON.stringify({ title: ebook.title, subtitle: ebook.subtitle, tagline: ebook.tagline, intro: ebook.intro, chapter1: ebook.chapters[0], chapter2: ebook.chapters[1] }), 6000)).replace(/```json|```/g, '').trim());
    var t2 = JSON.parse((await claudeCall(sys, JSON.stringify({ chapter3: ebook.chapters[2], chapter4: ebook.chapters[3], conclusion: ebook.conclusion, actionPlan: ebook.actionPlan, authorNote: ebook.authorNote, resources: ebook.resources, legalSection: ebook.legalSection }), 6000)).replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook: { title: t1.title, subtitle: t1.subtitle, tagline: t1.tagline, intro: t1.intro, chapters: [t1.chapter1, t1.chapter2, t2.chapter3, t2.chapter4], conclusion: t2.conclusion, actionPlan: t2.actionPlan, authorNote: t2.authorNote, resources: t2.resources, legalSection: t2.legalSection } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Traducción libre a cualquier idioma (sin adaptación cultural específica)
app.post('/api/translate-custom', async function(req, res) {
  var ebook = req.body.ebook;
  var language = req.body.language;
  var targetMarket = req.body.targetMarket || '';
  var author = req.body.author || 'Ferni Guides';
  var marketRule = targetMarket
    ? ' TARGET MARKET: ' + targetMarket + '. This is critical — ' + language + ' for ' + targetMarket + ' has specific cultural nuances, idioms, expressions, and tone different from other ' + language + '-speaking markets. Adapt vocabulary, expressions, cultural references, and tone to sound completely native to ' + targetMarket + '. For example: English for Canada uses different expressions than UK or USA. French for Canada (Quebec) differs from France. Portuguese for Brazil differs from Portugal. Spanish for Mexico differs from Spain. Do NOT use generic translated text — use market-specific native language.'
    : '';
  var sys = 'You are a professional literary translator and cultural adaptation specialist expert in ' + language + (targetMarket ? ' for the ' + targetMarket + ' market' : '') + '.' +
    ' Your job is to translate the following ebook JSON into ' + language + ' in a natural, fluent, market-native way.' +
    '\nRULES:' +
    ' 1. Translate to the most natural ' + language + (targetMarket ? ' specifically for ' + targetMarket : '') + ' — the reader must feel it was written originally in this language for this market.' +
    ' 2. Preserve EXACTLY all numbers, measurements and quantities.' +
    ' 3. Preserve the author name: ' + author + ' — do NOT translate.' +
    ' 4. Preserve all JSON structure and keys identical.' +
    ' 5. Return ONLY valid JSON, no markdown, no extra text.' +
    ' 6. If the language uses right-to-left script (Arabic, Hebrew), translate normally but keep keys in English.' +
    marketRule;
  function safeParseTranslation(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      // Intentar recuperar JSON truncado añadiendo cierre
      var fixed = cleaned;
      if (!fixed.endsWith('}')) fixed += '"}}}';
      try { return JSON.parse(fixed); } catch(e2) {
        throw new Error('JSON truncado — el capítulo es demasiado largo para traducir en un solo bloque');
      }
    }
  }
  try {
    var p1 = safeParseTranslation(await claudeCall(sys, JSON.stringify({ title: ebook.title, subtitle: ebook.subtitle, tagline: ebook.tagline, intro: ebook.intro }), 8000));
    var p2 = safeParseTranslation(await claudeCall(sys, JSON.stringify({ chapter1: ebook.chapters[0], chapter2: ebook.chapters[1] }), 8000));
    var p3 = safeParseTranslation(await claudeCall(sys, JSON.stringify({ chapter3: ebook.chapters[2], chapter4: ebook.chapters[3] }), 8000));
    var p4 = safeParseTranslation(await claudeCall(sys, JSON.stringify({ conclusion: ebook.conclusion, actionPlan: ebook.actionPlan, resources: ebook.resources, disclaimer: ebook.disclaimer }), 6000));
    res.json({ success: true, ebook: {
      title: p1.title, subtitle: p1.subtitle, tagline: p1.tagline,
      intro: p1.intro,
      chapters: [p2.chapter1, p2.chapter2, p3.chapter3, p3.chapter4],
      conclusion: p4.conclusion, actionPlan: p4.actionPlan,
      resources: p4.resources, disclaimer: p4.disclaimer
    }});
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Módulo Directo: GPT-4o genera el brief de producción sin búsqueda Serper
app.post('/api/quick-brief', async function(req, res) {
  var topic = (req.body.topic || '').trim();
  var lang = req.body.lang || 'Español';
  var country = req.body.country || 'España';
  if (!topic) return res.status(400).json({ success: false, error: 'Topic is required' });

  var sys = 'You are a Premium Ebook Creative Director, Market Psychologist, Editorial Designer, and Digital Product Architect.' +
    ' This system does NOT use external search engines. The user directly provides a PDF topic.' +
    ' Your job: deeply analyze the topic, identify the target audience and buyer psychology, and produce a complete PREMIUM EBOOK PRODUCTION BRIEF.' +
    '\n\nAUDIENCE ADAPTATION RULE: Always adapt the ebook to the final audience.' +
    ' Children → playful colors, fun icons, simple language, entertaining structure.' +
    ' Parents → warm trustworthy colors, calm professional design, practical checklists.' +
    ' Business → clean corporate design, frameworks, charts, dashboards.' +
    ' Beauty → elegant feminine design, luxury color palettes, emotional aspirational tone.' +
    ' Fitness → energetic visuals, motivational structure, dynamic formatting.' +
    ' Finance → trustworthy authority-driven layouts.' +
    ' Always adapt: colors, typography, tone, formatting, visual hierarchy to niche and audience.' +
    '\n\nCOMMERCIAL OBJECTIVE: This ebook is created to be sold as an infoproduct on platforms like Hotmart, Gumroad, Kiwify, Payhip, Etsy.' +
    ' Every decision must increase: perceived value, trust, attractiveness, readability, transformation, buyer satisfaction, resale potential.' +
    ' Do NOT create a generic ebook. Create a niche-adapted premium PDF experience commercially ready to sell.' +
    '\n\nIMPORTANT PREMIUM EBOOK RULE: Do not create the ebook as a plain text document. The ebook must feel like a premium workbook, guided experience, or high-value digital course material. Include throughout: checklists, quick action steps, practical exercises, trackers, progress sections, Expert Tip boxes, Common Mistakes sections, Pro Tip callouts, highlighted key points, summaries, action plans, routines, worksheets, step-by-step blocks, reflection prompts, before/after examples, challenge sections, implementation sections. The ebook must NOT feel like long walls of text. Pages must breathe visually. Use: shorter visual sections, cleaner spacing, structured formatting, educational visual hierarchy, premium workbook-style presentation. The final result must feel like a premium digital guide, a professional workbook, a luxury educational product — NOT a generic AI-generated PDF.' +
    '\n\nReturn ONLY valid JSON (no markdown, no explanation) with EXACTLY this structure:\n' +
    '{\n' +
    '  "tituloEbook": "compelling title in Spanish",\n' +
    '  "promesaEbook": "clear transformation promise in Spanish",\n' +
    '  "problema": "specific problem solved (Spanish)",\n' +
    '  "necesidad": "specific reader need (Spanish)",\n' +
    '  "tipoDemanda": "aprendizaje|transformacion|entretenimiento|referencia",\n' +
    '  "rangoEdad": "age range e.g. 25-45",\n' +
    '  "genero": "mujeres|hombres|ambos",\n' +
    '  "emocion": "primary emotional driver (Spanish)",\n' +
    '  "dolorODeseo": "deep pain or desire (Spanish)",\n' +
    '  "nicho": "niche in Spanish",\n' +
    '  "busquedaExacta": "main keyword in Spanish",\n' +
    '  "precioHotmart": "suggested price e.g. 17 EUR",\n' +
    '  "pais": "' + country + '",\n' +
    '  "country": "' + country + '",\n' +
    '  "idioma": "' + lang + '",\n' +
    '  "language": "' + lang + '",\n' +
    '  "scoreMonetizacion": 80,\n' +
    '  "estiloVisual": "brief visual style description for images",\n' +
    '  "colorPalette": "main colors for the niche",\n' +
    '  "tono": "tone of voice description"\n' +
    '}';

  var userMsg = 'Create a complete premium ebook production brief for this topic: "' + topic + '"' +
    '\nTarget country: ' + country +
    '\nDelivery language: ' + lang +
    '\nAnalyze who will buy and read this, what emotional tone fits, what visual style matches the audience, and what makes it commercially valuable.' +
    '\nRespond ONLY with the JSON object described in your instructions.';

  try {
    var resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }], temperature: 0.6, max_tokens: 800 })
    });
    var d = await resp.json();
    var raw = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (!raw) return res.status(500).json({ success: false, error: 'No response from GPT-4o' });
    var brief = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ success: true, opportunity: brief });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-image', async function(req, res) {
  try {
    var imageType = req.body.imageType || 'chapter';
    var size = imageType === 'cover' ? '1024x1536' : '1024x1024';
    var niche = (req.body.niche || '').toLowerCase();
    var nicheComposition = (function(){
      if (/beauty|belleza|skin|piel|maquill|makeup|nail|uña|cabello|hair|serum|crema|skincare/.test(niche))
        return 'BEAUTY NICHE: Place the main subject (person, face, product) in the center-right zone. The upper third and lower third must be clean, blurred background or empty space for text overlay. Face must NOT appear in the upper or lower 30% of the image. Elegant, soft, premium aesthetic. Warm or pastel colors.';
      if (/kid|niño|infant|bebe|baby|child|juego|educacion|escuela|multiplicacion|aprend/.test(niche))
        return 'CHILDREN NICHE: Place characters, illustrations or fun elements in the center and lower zone. The upper 35% must be clean empty space for a large title. Use playful bright colors. Keep bottom 20% relatively clear for subtitle.';
      if (/fitness|gym|ejercicio|workout|yoga|pilates|deporte|sport|entrena/.test(niche))
        return 'FITNESS NICHE: Place the athlete or action scene in the center zone. The upper third must be clean dark sky or solid-ish background for a bold title. Lower third clean for subtitle. High energy, strong contrast.';
      if (/business|negocio|empresa|startup|emprendimiento|marketing|venta|finanz|inversion|cripto|dinero/.test(niche))
        return 'BUSINESS NICHE: Use abstract, architectural, or minimal visual. Upper third must be clean professional background for title. Center shows the key visual element. Lower third clean for subtitle. Dark, trustworthy, premium colors.';
      if (/cocina|recipe|receta|food|comida|cook|chef/.test(niche))
        return 'FOOD NICHE: Place the food or dish in the center-lower zone. Upper third must be clean table surface or neutral background for title text. Lower third clean space for subtitle. Warm appetizing lighting.';
      if (/jardin|garden|plant|planta|flower|flor|nature|naturaleza/.test(niche))
        return 'NATURE NICHE: Place plants or natural elements in center and lower zones. Upper third sky or blurred foliage for title. Fresh, organic, premium aesthetic. Lower third clean for subtitle.';
      return 'Place the main visual subject in the center zone. The upper third must be clean background space for the title. The lower third must be clean background space for the subtitle. Maintain clear negative space in both text areas.';
    })();
    var coverInstructions = imageType === 'cover'
      ? ' IMPORTANT — THIS IS A COVER BACKGROUND IMAGE. Do NOT include any text, letters, words, numbers, titles, subtitles, logos, watermarks, or symbols of any kind. Zero text. The app will render all text on top of this image programmatically. ' + nicheComposition + ' General rules: no cropped elements, safe margins, no elements touching edges, vertical portrait composition 1024x1536, marketplace-ready premium infoproduct style, high perceived value.'
      : ' IMPORTANT SIZE AND LAYOUT INSTRUCTIONS: Image size must be exactly 1400 x 900 pixels. Landscape orientation for internal ebook page, centered composition, safe margins, balanced layout, no cropped elements, professional editorial style, optimized for PDF ebook formatting. Create a professional internal ebook image designed for the inside pages of a high-quality PDF guide. The image must be designed specifically for the inside pages of an ebook, not as a cover. Use a clean, professional, visually appealing style that matches the ebook topic. The composition must be centered, balanced, and easy to place inside a PDF page layout. Keep all important elements fully visible inside safe margins — do not crop the main subject, do not cut off objects, do not place important elements too close to the edges, avoid excessive zoom or close-up framing. Leave enough empty space around the borders to ensure the image fits naturally inside an ebook page. Do not include any text, letters, words, titles, subtitles, logos, watermarks, or promotional text. Use professional lighting, realistic details, polished composition, and premium editorial quality. Modern, clean, elegant, suitable for educational content, tutorials, guides, checklists, lessons, or informational sections. High resolution, professional publishing quality, no distorted elements, no cropped details, optimized for PDF ebook formatting and digital product presentation.';
    var prompt = req.body.prompt + coverInstructions;
    var resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: prompt, n: 1, size: size, quality: 'medium', output_format: 'jpeg' })
    });
    var d = await resp.json();
    if (d.data && d.data[0]) {
      var img = d.data[0];
      var url = img.url || ('data:image/jpeg;base64,' + img.b64_json);
      res.json({ success: true, url: url });
    } else {
      var errMsg = (d.error && d.error.message) ? d.error.message : JSON.stringify(d);
      console.error('Image error:', errMsg);
      res.status(500).json({ success: false, error: errMsg });
    }
  } catch (e) {
    console.error('generate-image catch:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildMarketingSystemPrompt(language, countryName, regs, section) {
  var core = 'You are an elite direct response copywriter, Meta Ads strategist, Hotmart launch expert, luxury branding specialist, social media growth marketer, conversion-focused ecommerce advertiser, and premium infoproduct marketing team.' +
    '\n\nIMPORTANT: PREMIUM DIGITAL PRODUCT MARKETING SYSTEM' +
    '\nThe objective is to create a COMPLETE SALES ECOSYSTEM ready to publish and advertise professionally across multiple platforms.' +
    '\n\nCORE RULE — NATIVE MARKET ADAPTATION:' +
    '\nAll marketing materials must: match the ebook niche, match the target audience, match the emotional transformation, match the target country cultural buying psychology, sound native to that market.' +
    '\nAdapt tone, persuasion style, vocabulary, emotional triggers, formatting, urgency, expressions, and branding style according to: language, target country, target audience, niche.' +
    '\nExamples: English + USA → stronger direct-response style. English + UK → more elegant and restrained. French + France → premium editorial tone. German + Germany → structured and trust-focused. Do NOT create generic translated marketing. Create NATIVE MARKET-ADAPTED marketing.' +
    '\n\nLanguage: ' + language + '. Target market: ' + countryName + '. REGULATIONS: ' + regs.legal + '. Guarantee: ' + regs.guarantee + '. PROHIBITED: ' + regs.forbidden + '.' +
    '\n\nRespond ONLY with valid JSON. No markdown, no explanation.';
  return core + '\n\n' + section;
}

app.post('/api/generate-hotmart', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var language = req.body.language;
  var targetMarket = req.body.targetMarket || '';
  var countryName = targetMarket || getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  function safeParseKit(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      var fixed = cleaned; if (!fixed.endsWith('}')) fixed += '"}';
      try { return JSON.parse(fixed); } catch(e2) { throw new Error('JSON truncado en kit Hotmart'); }
    }
  }
  try {
    var userMsg = 'Product: ' + (o.tituloEbook || o.ebookTitle) +
      ' | Promise: ' + (o.promesaEbook || o.ebookPromise) +
      ' | Topic: ' + (o.problema || o.problem) +
      ' | Type: ' + (o.tipoDemanda || 'learning') +
      ' | Audience: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) +
      ' | Market: ' + countryName +
      ' | Price: ' + (o.precioHotmart || o.hotmartPrice) +
      ' | Author: ' + author +
      ' | Emotional driver: ' + (o.emocion || o.emotion) +
      ' | Pain or desire: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain);

    var hmSection1 = 'HOTMART PRODUCT LISTING — Generate JSON with: productName (compelling title string), premiumSubtitle (string), emotionalHook (1 powerful sentence string), shortDesc (100 words max string), longDesc (persuasive 250 words string), transformationPromise (string), benefits (array 6 strings), highlights (array 4 strings), targetAudience (string), category (string), pricing (PLAIN STRING with amount and currency, e.g. "27 EUR" or "19 USD" — NOT an object), guarantee (PLAIN STRING e.g. "7-day money back guarantee" — NOT an object), bonus (array 3 strings — short names of bonus digital PDF items to include), upsell (array 2 strings — CRITICAL: suggest ONLY additional ebooks or PDF guides that could be created as a premium upsell digital product — NEVER suggest services, consultations, coaching programs, courses requiring personal delivery, or anything that is not a downloadable PDF — example format: "Advanced Guide: [specific topic]" or "Complete Workbook: [specific topic]").';
    var hmSection2 = 'HOTMART ADVANCED STRATEGY — Generate JSON with: cta (array 3 different CTAs), urgencyAngles (array 3 urgency hooks), objectionHandling (array 3, each object with objection and answer), seoKeywords (array 8 marketplace keywords), thumbnailTitleIdeas (array 3 short catchy titles), emotionalPositioning (brand positioning statement), faq (array 3, each object with q and a).';

    var p1 = safeParseKit(await claudeCall(buildMarketingSystemPrompt(language, countryName, regs, hmSection1), userMsg, 5000));
    var p2 = safeParseKit(await claudeCall(buildMarketingSystemPrompt(language, countryName, regs, hmSection2), userMsg, 5000));
    res.json({ success: true, kit: Object.assign({}, p1, p2) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-bonuses', async function(req, res) {
  var bonuses = req.body.bonuses || [];
  var language = req.body.language || 'French';
  var targetMarket = req.body.targetMarket || '';
  var niche = req.body.niche || '';
  var ebookTitle = req.body.ebookTitle || '';
  if (!bonuses.length) return res.status(400).json({ success: false, error: 'No bonuses provided' });
  function safeParseBonus(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      if (!cleaned.endsWith('}')) cleaned += '"}]}';
      try { return JSON.parse(cleaned); } catch(e2) { throw new Error('JSON truncado en bonos'); }
    }
  }
  try {
    var sys = 'You are an expert creator of premium digital bonus resources for infoproduct sellers.' +
      ' You create high-quality, practical, and beautifully structured bonus documents that complement a main ebook.' +
      ' Language: ' + language + (targetMarket ? '. Target market: ' + targetMarket : '') + '.' +
      ' Niche: ' + niche + '. Main ebook: ' + ebookTitle + '.' +
      ' IMPORTANT: Write all content in ' + language + (targetMarket ? ' adapted for ' + targetMarket : '') + '.' +
      ' Each bonus must feel like a standalone premium resource worth paying for on its own.' +
      ' Respond ONLY with valid JSON. No markdown, no explanation.';
    var userMsg = 'Generate the COMPLETE CONTENT for these ' + bonuses.length + ' bonus resources:\n' +
      bonuses.map(function(b, i) { return (i+1) + '. ' + b; }).join('\n') +
      '\n\nFor EACH bonus return a JSON object with:' +
      '\n- title: the bonus title (string)' +
      '\n- subtitle: brief description (string)' +
      '\n- type: one of "checklist", "guide", "tracker", "worksheet", "glossary"' +
      '\n- sections: array of sections, each with heading (string) and items (array of strings for checklist/tracker/glossary) OR content (string paragraph for guide)' +
      '\n\nReturn JSON: { "bonuses": [ {...}, {...}, {...} ] }' +
      '\n\nMake each bonus genuinely useful, detailed, and premium quality. Minimum 10-15 items per checklist, minimum 8 terms per glossary, minimum 4 sections per guide.';
    var result = safeParseBonus(await claudeCall(sys, userMsg, 6000));
    res.json({ success: true, bonuses: result.bonuses || [] });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async function(req, res) {
  var o = req.body.opportunity;
  var language = req.body.language;
  var targetMarket = req.body.targetMarket || '';
  var countryName = targetMarket || getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  function safeParseKit(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      var fixed = cleaned; if (!fixed.endsWith('}')) fixed += '"}}}';
      try { return JSON.parse(fixed); } catch(e2) { throw new Error('JSON truncado en kit Meta'); }
    }
  }
  try {
    var userMsg = 'Product: ' + (o.tituloEbook || o.ebookTitle) +
      ' | Topic: ' + (o.problema || o.problem) +
      ' | Audience: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) +
      ' | Market: ' + countryName +
      ' | Emotional driver: ' + (o.emocion || o.emotion) +
      ' | Pain or desire: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain) +
      ' | Price: ' + (o.precioHotmart || o.hotmartPrice) +
      ' | Promise: ' + (o.promesaEbook || o.ebookPromise);

    var metaSection = 'META ADS SYSTEM — Generate JSON with: segmentation (object: age, gender, interests array 6, behaviors array 4, painPoints array 5, excludeAudiences array 3, lookalike, budget). ads (array 5, each: angle, platform, format, headline, primaryText, shortCopy, longCopy, emotionalHook, cta, targetEmotion). Angles: problem, urgency, aspiration, curiosity, authority.';
    var socialSection = 'FACEBOOK + INSTAGRAM KIT — Generate JSON with: facebook (object: post string, storytellingPost string, authorityPost string, viralHook string, engagementPost string, commentCTA string). instagram (object: caption string, carouselIdeas array 3 strings, reelHooks array 3 strings, storyHooks array 3 strings, hashtags array 15 strings, shortHooks array 3 strings). emailSequence (array 3, each: subject, body). retargeting (object: headline, copy, cta, offer).';

    var p1 = safeParseKit(await claudeCall(buildMarketingSystemPrompt(language, countryName, regs, metaSection), userMsg, 6000));
    var p2 = safeParseKit(await claudeCall(buildMarketingSystemPrompt(language, countryName, regs, socialSection), userMsg, 6000));
    res.json({ success: true, kit: Object.assign({}, p1, p2) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});



app.post('/api/plan-images', async function(req, res) {
  var ebook = req.body.ebook;
  var opportunity = req.body.opportunity;
  var o = opportunity;
  var countryName = getCountryName(o.pais || o.country || 'France');

  var sys = 'Eres un director de arte experto en ebooks digitales profesionales para vender en Hotmart.' +
    ' Tu trabajo es planificar imagenes PERFECTAS y ULTRA-ESPECIFICAS para este ebook, BASADAS EN EL CONTENIDO REAL DE CADA CAPITULO.' +
    ' ANALIZA el texto de cada capitulo y EXTRA elementos especificos: medidas (ej: 2x3 metros), objetos (cercos, pasto, herramientas), pasos del metodo, ejemplos locales.' +
    ' - Ebooks de jardineria, decoracion, cocina, manualidades, construccion, belleza: MUCHAS imagenes (6-10)' +
    ' - Ebooks de salud, fitness, crianza, hogar: MODERADAS imagenes (4-6)' +
    ' - Ebooks de finanzas, productividad, negocios, desarrollo: POCAS imagenes (2-4)' +
    ' REGLAS PARA PROMPTS DALLE-3:' +
    ' 1. Especificidad visual: describe EXACTAMENTE qué se ve (colores, objetos, composicion, estilo), INCLUYENDO medidas y elementos del texto.' +
    ' 2. Contexto cultural: adapta a ' + countryName + ' (arquitectura, paisaje, objetos locales, clima).' +
    ' 3. Calidad profesional: especifica "professional stock photo quality, 8k, premium, commercial license ready".' +
    ' 4. Estilo consistente: elige un estilo visual para todo el ebook (fotografia realista, ilustracion moderna, etc).' +
    ' 5. SIN texto, SIN caras identificables, SIN marcas registradas.' +
    ' 6. Composicion: especifica si es landscape, portrait, flat lay, close-up, overhead shot, etc.' +
    ' 7. ENFOQUE: si el capitulo habla de construir un jardin 3x4m con cercos verdes, la imagen DEBE mostrar exactamente eso.' +
    ' Devuelve SOLO JSON con: totalImages, coverPrompt, images array con location, purpose, prompt DETALLADO en ingles.';

  var userMsg = 'Tema: ' + (o.problema || o.problem || '') + ' | Titulo: ' + (ebook.title || '') + ' | Tipo: ' + (o.tipoDemanda || 'aprendizaje') + ' | Pais: ' + countryName + ' | Clima/Contexto: ' + getCountryContext(countryName) + ' | Adapta TODO a ' + countryName + '.' +
    ' CONTENIDO DE CAPITULOS PARA ANALIZAR:' + (ebook.chapters || []).map(function(ch, i2) {
      return 'CAPITULO ' + (i2+1) + ' - ' + (ch.title || '') + ': ' + (ch.content || '').substring(0, 500) + '...';
    }).join(' | ') + ' | Genera PROMPTS ULTRA-DETALLADOS basados en elementos especificos del texto (medidas, objetos, pasos).';

  try {
    var txt = await claudeCall(sys, userMsg, 2500);
    var plan = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, plan: plan });
  } catch (e) {
    // Fallback plan if Claude fails
    var fallback = {
      totalImages: 4,
      coverPrompt: 'Professional ebook cover for ' + (ebook.title || 'guide') + ', elegant design, beautiful photography, no text, no watermarks, commercial quality',
      images: (ebook.chapters || []).map(function(ch, i) {
        return {
          location: 'chapter' + (i+1),
          purpose: 'Illustration for chapter ' + (i+1),
          prompt: 'Professional illustration for ' + (ch.title || 'chapter') + ', beautiful photography, no text, no faces, commercial quality'
        };
      })
    };
    res.json({ success: true, plan: fallback });
  }

  try {
    var txt = await claudeCall(sys, userMsg, 2000);
    var plan = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, plan: plan });
  } catch (e) {
    // Fallback plan if Claude fails
    var fallback = {
      totalImages: 4,
      coverPrompt: 'Professional ebook cover for ' + (ebook.title || 'guide') + ', elegant design, beautiful photography, no text, no watermarks, commercial quality',
      images: (ebook.chapters || []).map(function(ch, i) {
        return {
          location: 'chapter' + (i+1),
          purpose: 'Illustration for chapter ' + (i+1),
          prompt: 'Professional illustration for ' + (ch.title || 'chapter') + ', beautiful photography, no text, no faces, commercial quality'
        };
      })
    };
    res.json({ success: true, plan: fallback });
  }
});

app.post('/api/generate-pdf-html', async function(req, res) {
  var ebook = req.body.ebook;
  var opportunity = req.body.opportunity;
  var author = req.body.author;
  var images = req.body.images || {};
  var o = opportunity;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var year = new Date().getFullYear();
  var lang = o.idioma || o.language || 'French';

  var coverImg = images.cover || '';
  var imageMap = images.imageMap || {}; // location -> url map

  var chapterColor = ['#6c5ce7','#00b894','#e17055','#0984e3'];
  var chapterBg = ['#f3f0ff','#f0fff8','#fff5f3','#f0f7ff'];

  // Contador de páginas para numeración
  var pageCounter = 1;
  
  var chaptersHtml = (ebook.chapters || []).map(function(ch, i) {
    var img = imageMap['chapter'+(i+1)] || imageMap['chapter'+(i+1)+'_main'] || '';
    var color = chapterColor[i % chapterColor.length];
    var bg = chapterBg[i % chapterBg.length];
    var keyPts = (ch.keyPoints || []).map(function(k) {
      return '<li style="margin-bottom:8px;padding-left:8px;">' + k + '</li>';
    }).join('');
    var steps = ch.exercise ? (ch.exercise.steps || []).map(function(s, si) {
      return '<div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;"><div style="background:' + color + ';color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;flex-shrink:0;">' + (si+1) + '</div><div style="font-size:13px;line-height:1.6;">' + s + '</div></div>';
    }).join('') : '';

    return '<div style="page-break-before:always;position:relative;">' +
      '<div style="background:' + color + ';color:white;padding:30px 40px;margin-bottom:0;">' +
        '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;margin-bottom:8px;">Capítulo ' + (i+1) + '</div>' +
        '<div style="font-size:26px;font-weight:800;line-height:1.3;">' + (ch.title || '') + '</div>' +
      '</div>' +
      (img ? '<img src="' + img + '" style="width:100%;height:280px;object-fit:cover;display:block;" />' : '<div style="background:' + bg + ';height:8px;"></div>') +
      '<div style="padding:32px 40px;">' +
        (ch.opening ? '<div style="background:' + bg + ';border-left:4px solid ' + color + ';padding:16px 20px;margin-bottom:24px;font-style:italic;font-size:14px;line-height:1.8;color:#444;border-radius:0 8px 8px 0;">' + ch.opening + '</div>' : '') +
        '<div style="font-size:14px;line-height:1.9;color:#2d3436;margin-bottom:24px;">' + (ch.content || '').replace(/\n/g,'<br>') + '</div>' +
        (keyPts ? '<div style="background:' + bg + ';border-radius:12px;padding:20px 24px;margin-bottom:24px;"><div style="font-size:13px;font-weight:700;color:' + color + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Points Cles / Key Points</div><ul style="margin:0;padding-left:20px;list-style:none;">' + keyPts.replace(/<li/g,'<li style="margin-bottom:8px;padding-left:8px;list-style:none;position:relative;"><span style="color:' + color + ';position:absolute;left:-16px;">✓</span>') + '</ul></div>' : '') +
        (ch.exercise ? '<div style="border:2px solid ' + color + ';border-radius:12px;padding:24px;margin-top:16px;"><div style="font-size:14px;font-weight:700;color:' + color + ';margin-bottom:6px;">Exercice / Exercise: ' + (ch.exercise.title || '') + '</div><div style="font-size:13px;color:#636e72;margin-bottom:16px;">' + (ch.exercise.description || '') + '</div>' + steps + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  var actionPlanHtml = (ebook.actionPlan || []).map(function(a, i) {
    var labels = ["Aujourd'hui / Today", "Cette semaine / This week", "Ce mois / This month"];
    var colors2 = ['#6c5ce7','#00b894','#0984e3'];
    return '<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start;"><div style="background:' + colors2[i] + ';color:white;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">' + (labels[i]||'Action') + '</div><div style="font-size:13px;line-height:1.6;padding-top:4px;">' + a + '</div></div>';
  }).join('');

  var resourcesHtml = (ebook.resources || []).map(function(r) {
    return '<div style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">→ ' + r + '</div>';
  }).join('');

  var legal = ebook.legalSection || {};

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    '@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap");' +
    '*{margin:0;padding:0;box-sizing:border-box;}' +
    'body{font-family:"Inter",Arial,sans-serif;color:#2d3436;background:white;}' +
    '@media print{' +
      '.no-print{display:none!important;}' +
      'body{margin:0;}' +
      '@page{margin:0;size:A4;}' +
    '}' +
    '.print-btn{position:fixed;top:20px;right:20px;background:#6c5ce7;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;z-index:9999;box-shadow:0 4px 15px rgba(108,92,231,0.4);}' +
    '.print-btn:hover{background:#5b4ecc;}' +
    '</style>' +
    '</head><body>' +

    '<button class="print-btn no-print" onclick="window.print()">⬇ Guardar como PDF</button>' +

    // COVER PAGE
    '<div style="height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;">' +
      (coverImg ? '<img src="' + coverImg + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" />' : '<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1a1a6e,#6c5ce7,#00cec9);"></div>') +
      '<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.7));"></div>' +
      '<div style="position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 40px;">' +
        '<div style="font-family:Playfair Display,serif;font-size:42px;font-weight:800;color:white;line-height:1.2;margin-bottom:20px;text-shadow:0 2px 20px rgba(0,0,0,0.5);">' + (ebook.title || '') + '</div>' +
        '<div style="font-size:18px;color:rgba(255,255,255,0.9);font-style:italic;margin-bottom:30px;line-height:1.5;max-width:500px;">' + (ebook.subtitle || '') + '</div>' +
        '<div style="background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:50px;padding:10px 30px;color:white;font-size:14px;font-weight:600;letter-spacing:1px;margin-bottom:40px;">' + (ebook.tagline || '') + '</div>' +
        '<div style="border-top:1px solid rgba(255,255,255,0.3);padding-top:24px;color:rgba(255,255,255,0.8);font-size:15px;letter-spacing:2px;">par ' + author + '</div>' +
        '<div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:8px;">© ' + year + ' ' + author + '</div>' +
      '</div>' +
    '</div>' +

    // TABLE OF CONTENTS
    '<div style="page-break-before:always;padding:60px 40px;background:#fafafa;min-height:60vh;">' +
      '<div style="font-family:Playfair Display,serif;font-size:32px;font-weight:700;color:#2d3180;margin-bottom:8px;">Tabla de contenidos</div>' +
      '<div style="font-size:13px;color:#6c5ce7;letter-spacing:2px;text-transform:uppercase;margin-bottom:40px;">Índice completo</div>' +
      '<div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">' +
        '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee;font-style:italic;color:#636e72;font-size:14px;"><span>Introducción</span><span>p. 1</span></div>' +
        (ebook.chapters || []).map(function(ch, i) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #eee;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              '<div style="background:' + chapterColor[i % chapterColor.length] + ';color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + (i+1) + '</div>' +
              '<div style="font-size:14px;font-weight:600;color:#2d3436;">' + (ch.title || '') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#636e72;"><span>Conclusion</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:14px;color:#636e72;"><span>Plan d’action / Resources</span></div>' +
      '</div>' +
    '</div>' +

    // INTRODUCTION
    '<div style="page-break-before:always;padding:60px 40px;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6c5ce7;margin-bottom:12px;">Introducción</div>' +
      '<div style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#2d3180;margin-bottom:32px;line-height:1.3;">Por qué esta guía puede cambiar tu situación</div>' +
      '<div style="font-size:14px;line-height:1.9;color:#2d3436;">' + (ebook.intro || '').replace(/\n/g,'<br><br>') + '</div>' +
    '</div>' +

    // CHAPTERS
    chaptersHtml +

    // CONCLUSION
    '<div style="page-break-before:always;padding:60px 40px;background:linear-gradient(135deg,#f3f0ff,#f0fff8);">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6c5ce7;margin-bottom:12px;">Conclusión</div>' +
      '<div style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#2d3180;margin-bottom:32px;">Tu transformación comienza hoy</div>' +
      '<div style="font-size:14px;line-height:1.9;color:#2d3436;margin-bottom:32px;">' + (ebook.conclusion || '').replace(/\n/g,'<br><br>') + '</div>' +
      '<div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);margin-bottom:24px;">' +
        '<div style="font-size:13px;font-weight:700;color:#6c5ce7;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Plan de acción</div>' +
        actionPlanHtml +
      '</div>' +
      (resourcesHtml ? '<div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">' +
        '<div style="font-size:13px;font-weight:700;color:#00b894;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Recursos y Referencias</div>' +
        resourcesHtml +
      '</div>' : '') +
    '</div>' +

    // AUTHOR NOTE - REMOVED - PDFs are from Ferni Guides editorial, impersonal expert content
    // (ebook.authorNote ? '<div style="page-break-before:always;padding:60px 40px;background:#2d3180;color:white;">' +
    //   '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:12px;">Nota de la autora</div>' +
    //   '<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;margin-bottom:24px;">' + author + '</div>' +
    //   '<div style="font-size:14px;line-height:1.9;color:rgba(255,255,255,0.85);">' + ebook.authorNote + '</div>' +
    // '</div>' : '') +

    // LEGAL
    '<div style="padding:40px;background:#f8f9fa;border-top:1px solid #eee;">' +
      '<div style="font-size:11px;color:#636e72;line-height:1.8;">' +
        '<div style="margin-bottom:8px;font-weight:600;">Aviso / Disclaimer</div>' +
        '<div style="margin-bottom:12px;">' + (legal.healthDisclaimer || regs.healthDisclaimer) + '</div>' +
        '<div style="margin-bottom:8px;">' + (legal.dataProtection || regs.dataProtection) + '</div>' +
        '<div style="margin-bottom:8px;">' + (legal.guarantee || regs.guarantee) + '</div>' +
        '<div style="font-weight:600;">' + (legal.copyright || 'Copyright ' + year + ' ' + author) + '</div>' +
      '</div>' +
    '</div>' +

    '</body></html>';

  res.json({ success: true, html: html });
});



app.post('/api/correct-ebook', async function(req, res) {
  var ebook = req.body.ebook;
  var correction = req.body.correction;
  var language = req.body.language || 'Spanish';
  try {
    var sys = 'Eres un editor experto de ebooks. El año actual es 2026.' +
      ' El usuario pide una corrección. Haz cambios INTELIGENTES y COMPLETOS.' +
      ' REGLAS:' +
      ' 1) NUNCA dejes newText vacío — siempre reemplaza con algo mejor.' +
      ' 2) Años desactualizados (2022-2024): actualiza a 2025 o 2026, o reformula sin fecha.' +
      ' 3) Si el usuario copia un fragmento exacto, ESE es el oldText aunque ya hayas cambiado algo parecido antes — busca y aplica EN ESE FRAGMENTO ESPECÍFICO.' +
      ' 4) Si dice "elimina/cambia todos los X" o "en todo el ebook": devuelve UN cambio con oldText=la palabra/frase y se aplicará globalmente en todo el ebook.' +
      ' 5) Mejora la frase completa para que quede natural.' +
      ' Responde SIEMPRE JSON puro sin markdown:' +
      ' Un cambio: {"oldText":"fragmento exacto","newText":"texto mejorado","summary":"resumen corto","global":false}' +
      ' Cambio global (aplica en todo el ebook): {"oldText":"palabra o frase","newText":"reemplazo","summary":"resumen","global":true}' +
      ' Varios cambios: array de objetos. No puedes proceder: {"clarify":"pregunta en español"}.' +
      ' NUNCA texto fuera del JSON.';

    // Incluir TODO el contenido: intro, capítulos completos con keyPoints, conclusión
    var summary = {
      title: ebook.title,
      subtitle: ebook.subtitle,
      intro: (ebook.intro||'').slice(0,800),
      chapters: (ebook.chapters||[]).map(function(ch,i){ return {
        number: i+1,
        title: ch.title,
        opening: (ch.opening||'').slice(0,400),
        content: (ch.content||'').slice(0,800),
        keyPoints: (ch.keyPoints||[])
      };}),
      conclusion: (ebook.conclusion||'').slice(0,500),
      actionPlan: (ebook.actionPlan||[])
    };

    var msg = 'INSTRUCCION: ' + correction +
      '\n\nCONTENIDO COMPLETO DEL EBOOK:\n' + JSON.stringify(summary);

    var txt = await claudeCall(sys, msg, 1500);
    var changes = extractJSON(txt);

    if (changes && changes.clarify) {
      return res.json({ success: false, clarify: changes.clarify });
    }

    if (!Array.isArray(changes)) changes = [changes];

    // Función recursiva que reemplaza en TODO el objeto (split+join = reemplaza TODAS las ocurrencias)
    function replaceInObj(obj, oldStr, newStr, globalMode) {
      if (!obj) return false;
      var applied = false;
      Object.keys(obj).forEach(function(k) {
        if (typeof obj[k] === 'string') {
          if (obj[k].includes(oldStr)) {
            // split+join reemplaza TODAS las ocurrencias, no solo la primera
            obj[k] = obj[k].split(oldStr).join(newStr);
            applied = true;
            if (!globalMode) return; // si no es global, con encontrar una vez basta
          }
        } else if (Array.isArray(obj[k])) {
          obj[k] = obj[k].map(function(item) {
            if (typeof item === 'string' && item.includes(oldStr)) {
              applied = true;
              return item.split(oldStr).join(newStr);
            }
            if (typeof item === 'object') { replaceInObj(item, oldStr, newStr, globalMode); }
            return item;
          });
        } else if (typeof obj[k] === 'object') {
          if (replaceInObj(obj[k], oldStr, newStr, globalMode)) applied = true;
        }
      });
      return applied;
    }

    var updated = JSON.parse(JSON.stringify(ebook));
    var appliedSummaries = [];
    changes.forEach(function(change) {
      if (!change || !change.oldText || !change.newText) return;
      var applied = replaceInObj(updated, change.oldText, change.newText, !!change.global);
      if (applied && change.summary) appliedSummaries.push(change.summary);
    });

    res.json({ success: true, ebook: updated, summaries: appliedSummaries });
  } catch(e) {
    console.error('correct-ebook error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/chat-raw', async function(req, res) {
  var system = req.body.system || '';
  var message = req.body.message || '';
  var maxTokens = req.body.maxTokens || 4000;
  try {
    var txt = await claudeCall(system, message, maxTokens);
    res.json({ success: true, reply: txt });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Bonus Pack — Claude elige los 4 mejores mini-productos según el tipo de ebook
app.post('/api/generate-extras', async function(req, res) {
  var ebook = req.body.ebook;
  var o = req.body.opportunity;
  var language = req.body.language || 'Español';
  var countryName = getCountryName((o && (o.pais || o.country)) || 'France');
  try {
    var chapsFull = (ebook.chapters || []).map(function(c, i) {
      return '=== CAPÍTULO ' + (i+1) + ': ' + (c.title||'') + ' ===\n' + (c.content||'').substring(0,600);
    }).join('\n');

    var sys = 'Eres el mejor diseñador de infoproductos digitales premium del mundo.' +
      ' Analizas el contenido REAL de un ebook y decides cuáles son los 4 mini-productos complementarios' +
      ' que más valor añaden, más sentido tienen para ese nicho específico, y más se pueden vender por separado.' +
      ' Tus productos son de calidad PROFESIONAL — tan buenos que la gente los compraría aunque no tuviera el ebook.' +
      ' Todo el contenido en ' + language + '. Devuelve SOLO JSON array con exactamente 4 objetos.' +

      '\n\n=== CATÁLOGO DE TIPOS DISPONIBLES ===' +
      '\nElige los 4 que mejor encajen con el ebook. NO uses siempre los mismos — elige según el nicho:' +
      '\n• "checklist" — Lista de verificación por etapas (ideal para procesos, proyectos, aprendizaje)' +
      '\n• "poster" — Afiche/póster motivacional A4 imprimible (ideal para fitness, bienestar, motivación, habilidades)' +
      '\n• "tarjetas" — Tarjetas de referencia rápida recortables (ideal para idiomas, recetas, ejercicios, tips técnicos)' +
      '\n• "plan30" — Plan de 30 días con tareas diarias (ideal para hábitos, fitness, aprendizaje, proyectos)' +
      '\n• "plantilla" — Hoja de trabajo/seguimiento semanal (ideal para finanzas, productividad, crianza, negocios)' +
      '\n• "recetas" — Tarjetas de recetas imprimibles (SOLO para cocina, nutrición, bienestar alimentario)' +
      '\n• "calendario" — Calendario mensual de actividades (ideal para jardinería, crianza, proyectos, hábitos)' +
      '\n• "tracker" — Hoja de seguimiento de progreso con métricas (ideal para fitness, finanzas, aprendizaje)' +
      '\n• "materiales" — Lista detallada de materiales/herramientas (ideal para manualidades, jardinería, decoración, construcción)' +
      '\n• "guiarapida" — Cheat sheet / guía de referencia rápida (ideal para programación, idiomas, técnicas, trucos)' +
      '\n• "rutina" — Hoja de rutina diaria/semanal estructurada (ideal para crianza, productividad, fitness, bienestar)' +
      '\n• "presupuesto" — Hoja de presupuesto/cálculo de costes (ideal para finanzas, negocios, manualidades con materiales)' +

      '\n\n=== REGLAS DE CALIDAD ABSOLUTA ===' +
      '\n1. CONTENIDO HIPERSPECÍFICO: cada item, paso, tarea o receta debe extraerse DIRECTAMENTE del contenido del ebook. Nada genérico.' +
      '\n2. LISTO PARA IMPRIMIR: diseñado para verse perfecto en A4.' +
      '\n3. VENDIBLE SOLO: tan completo y útil que alguien lo compraría sin el ebook.' +
      '\n4. VOLUMEN: checklist mínimo 30 items, tarjetas mínimo 8, plan30 mínimo 28 días, recetas mínimo 5 tarjetas completas.' +
      '\n5. TODO en ' + language + ' — cero palabras en otro idioma.';

    var userMsg = 'EBOOK: "' + (ebook.title||'') + '"\nSUBTÍTULO: ' + (ebook.subtitle||'') +
      '\nTEMA: ' + ((o && (o.problema||o.problem)) || '') +
      '\nNICHO: ' + ((o && (o.tipoDemanda||'')) || 'aprendizaje') +
      '\nPAÍS: ' + countryName + ' | IDIOMA: ' + language +
      '\n\n' + chapsFull +
      '\n\n=== INSTRUCCIÓN ===' +
      '\nAnaliza el ebook y elige los 4 tipos de productos que más sentido tienen para ESTE ebook específico.' +
      '\nGenera el contenido completo y ultra-específico para cada uno.' +
      '\n\nFORMATO JSON (adapta los campos según el tipo elegido):' +
      '\n[' +
      '\n  {' +
      '\n    "type": "checklist|poster|tarjetas|plan30|plantilla|recetas|calendario|tracker|materiales|guiarapida|rutina|presupuesto",' +
      '\n    "title": "título atractivo y vendible en ' + language + '",' +
      '\n    "subtitle": "propuesta de valor en 1 línea — qué consigue el lector",' +
      '\n    "precio": "precio sugerido en EUR (entre 3.90 y 8.90)",' +
      '\n    "porQueEsteProducto": "justificación breve de por qué elegiste este tipo para este ebook",' +
      '\n    // Para checklist: "items": ["paso concreto 1",...mínimo 30...]' +
      '\n    // Para poster: "quote": "frase poderosa ≤15 palabras", "claves": ["clave 1",...6...]' +
      '\n    // Para tarjetas: "tarjetas": [{"titulo":"nombre tarjeta","contenido":["punto 1","punto 2",...5 puntos...]},...mínimo 8 tarjetas...]' +
      '\n    // Para plan30: "semanas": [{"num":1,"titulo":"Semana 1: Nombre","dias":[{"num":1,"tarea":"acción MUY específica"},...7 días...]},...4 semanas...]' +
      '\n    // Para plantilla: "semanas": [{"num":1,"objetivo":"objetivo semana","dias":[{"dia":"Lunes","tarea":"tarea específica"},... 5 días...]},...4 semanas...]' +
      '\n    // Para recetas: "recetas": [{"nombre":"nombre receta","tiempo":"X min","porciones":"X","ingredientes":["item1",...8+...],"pasos":["paso1",...6+...]},...5+ recetas...]' +
      '\n    // Para calendario: "meses": [{"mes":"Mes 1","semanas":[{"semana":1,"actividades":["actividad1","actividad2",...]},...4 semanas...]}]' +
      '\n    // Para tracker: "metricas": [{"nombre":"métrica","unidad":"kg/cm/veces/etc","filas":["Semana 1","Semana 2",...8 filas...]},...4-6 métricas...]' +
      '\n    // Para materiales: "categorias": [{"nombre":"categoría","items":[{"material":"nombre","cantidad":"X","notas":"nota útil"},...]},...3-5 categorías...]' +
      '\n    // Para guiarapida: "secciones": [{"titulo":"sección","items":["tip/regla/comando concreto",...8+ por sección...]},...4-5 secciones...]' +
      '\n    // Para rutina: "bloques": [{"hora":"07:00","actividad":"actividad concreta","duracion":"15 min","notas":"por qué importa"},...10-15 bloques...]' +
      '\n    // Para presupuesto: "categorias": [{"nombre":"categoría","items":[{"concepto":"nombre","costeEstimado":"X EUR","frecuencia":"mensual/único/anual"},...]},...4-5 categorías...]' +
      '\n  },...3 objetos más...' +
      '\n]';

    var txt = await claudeCall(sys, userMsg, 7000);
    var extras = JSON.parse(txt.replace(/```json|```/g,'').trim());
    res.json({ success: true, extras: extras });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Endpoint de diagnostico — lista modelos disponibles para la key actual
app.get('/api/test-openai', async function(req, res) {
  try {
    var keyPreview = OPENAI_KEY ? OPENAI_KEY.substring(0, 15) + '...(len:' + OPENAI_KEY.length + ')' : 'NO KEY';
    var r = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY }
    });
    var d = await r.json();
    var imageModels = (d.data || []).filter(function(m){ return m.id.includes('dall') || m.id.includes('image'); }).map(function(m){ return m.id; });
    res.json({ keyPreview: keyPreview, status: r.status, imageModels: imageModels, error: d.error || null });
  } catch(e) {
    res.json({ error: e.message });
  }
});

// Endpoint de config - expone solo la key de OpenAI para generacion de imagenes en frontend
app.get('/api/config', function(req, res) {
  res.json({ 
    ready: !!(process.env.CLAUDE_API_KEY && process.env.OPENAI_API_KEY && process.env.SERPER_API_KEY),
    openaiKey: process.env.OPENAI_API_KEY || ''
  });
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('FERNI AI Pro running on port ' + PORT); });
module.exports = app;
