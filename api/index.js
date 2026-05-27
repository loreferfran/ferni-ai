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
  'New Zealand': { legal: 'Consumer Guarantees Act 1993, Privacy Act 2020', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: '5 working days to cancel', dataProtection: 'Data protected under Privacy Act.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'NZD' },
  // LATAM
  Mexico: { legal: 'LFPDPPP, Ley Federal de Protección al Consumidor, PROFECO', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico profesional.', guarantee: 'Derecho de cancelación conforme a PROFECO', dataProtection: 'Datos protegidos conforme a la LFPDPPP.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'MXN' },
  Colombia: { legal: 'Ley 1581 de 2012 protección de datos, Estatuto del Consumidor Ley 1480', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no reemplaza el consejo médico.', guarantee: 'Derecho de retracto 5 días hábiles conforme a Ley 1480', dataProtection: 'Datos protegidos bajo Ley 1581 de 2012.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'COP' },
  Argentina: { legal: 'Ley 25326 protección de datos personales, Ley 24240 defensa del consumidor', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico.', guarantee: 'Derecho de arrepentimiento 10 días hábiles conforme a Ley 24240', dataProtection: 'Datos protegidos bajo Ley 25326.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'ARS' },
  Chile: { legal: 'Ley 19628 protección de datos, Ley 19496 protección al consumidor, SERNAC', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no reemplaza el consejo médico.', guarantee: 'Derecho a retracto 10 días conforme a Ley 19496', dataProtection: 'Datos protegidos bajo Ley 19628.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'CLP' },
  Peru: { legal: 'Ley 29733 protección de datos, Código de Protección al Consumidor Ley 29571, INDECOPI', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico.', guarantee: 'Derecho de arrepentimiento conforme al Código de Protección al Consumidor', dataProtection: 'Datos protegidos bajo Ley 29733.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'PEN' },
  Uruguay: { legal: 'Ley 18331 protección de datos, Ley 17189 relaciones de consumo, AGESIC', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no reemplaza el consejo médico.', guarantee: 'Derecho de rescisión conforme a Ley 17189', dataProtection: 'Datos protegidos bajo Ley 18331.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'UYU' },
  Ecuador: { legal: 'LOPDP Ley Orgánica de Protección de Datos, Ley Orgánica de Defensa del Consumidor', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico.', guarantee: 'Derecho de devolución conforme a Ley de Defensa del Consumidor', dataProtection: 'Datos protegidos bajo LOPDP.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'USD' },
  Brazil: { legal: 'LGPD Lei Geral de Proteção de Dados, CDC Código de Defesa do Consumidor', healthDisclaimer: 'Este guia tem fins exclusivamente informativos e não substitui o aconselhamento médico.', guarantee: 'Direito de arrependimento 7 dias conforme CDC', dataProtection: 'Dados protegidos conforme LGPD.', forbidden: 'Proibidas promessas de resultados garantidos em saúde.', language: 'Portuguese', currency: 'BRL' },
  LatAm: { legal: 'Normativas locales de protección al consumidor y protección de datos de cada país de la región (LFPDPPP, Ley 1581, Ley 25326, Ley 19628, Ley 29733, LGPD y equivalentes)', healthDisclaimer: 'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico profesional.', guarantee: 'Derecho de arrepentimiento según la legislación de cada país', dataProtection: 'Datos protegidos conforme a la normativa vigente del país del usuario.', forbidden: 'Prohibidas promesas de resultados garantizados en salud.', language: 'Spanish', currency: 'USD', panRegion: true }
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
  Canada: '40 millones total, 32 millones adultos',
  Mexico: '130 millones total, 95 millones adultos',
  Colombia: '52 millones total, 38 millones adultos',
  Argentina: '46 millones total, 34 millones adultos',
  Chile: '19 millones total, 14 millones adultos',
  Peru: '33 millones total, 24 millones adultos',
  Uruguay: '3.5 millones total, 2.7 millones adultos',
  Ecuador: '18 millones total, 13 millones adultos',
  Brazil: '215 millones total, 160 millones adultos',
  LatAm: '680 millones total (región completa), 500 millones adultos hispanohablantes + brasileños'
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  // Primero: si el string completo existe en REGS, usarlo directamente
  if (REGS[countryStr]) return countryStr;
  // Si empieza con emoji (ej: "🇬🇧 United Kingdom"), quitar el primer token
  const parts = countryStr.split(' ');
  if (parts.length > 1) { var rest = parts.slice(1).join(' '); if (REGS[rest]) return rest; }
  return countryStr;
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
    'Canada': 'clima frío boreal, paisaje montañoso/boscoso, arquitectura moderna canadiense, luz natural extrema',
    'Mexico': 'clima cálido tropical/seco, arquitectura colonial y moderna, paisaje desértico/tropical/urbano, colores vibrantes',
    'Colombia': 'clima tropical variado por altitud, arquitectura colonial y moderna, paisaje montañoso/costero/selvático, verde exuberante',
    'Argentina': 'clima templado/frío sur, arquitectura europea rioplatense, paisaje pampeano/patagónico/urbano, luz clara',
    'Chile': 'clima variado (desértico norte, mediterráneo centro, frío sur), arquitectura moderna/colonial, paisaje montañoso costero',
    'Peru': 'clima variado (desértico costa, frío sierra, tropical selva), arquitectura colonial/inca, paisaje andino/amazónico',
    'Uruguay': 'clima templado, arquitectura colonial rioplatense, paisaje costero atlántico, playas, campo verde',
    'Ecuador': 'clima tropical variado, arquitectura colonial andina, paisaje montañoso/costero/amazónico, naturaleza exuberante',
    'Brazil': 'clima tropical cálido, arquitectura colonial y moderna, paisaje costero/selva amazónica/urbano, colores vibrantes'
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
  'Australia':'AU','New Zealand':'NZ',
  'Mexico':'MX','Colombia':'CO','Argentina':'AR','Chile':'CL',
  'Peru':'PE','Uruguay':'UY','Ecuador':'EC','Brazil':'BR'
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
  'Australia':2036,'New Zealand':2554,
  'Mexico':2484,'Colombia':2170,'Argentina':2032,'Chile':2152,
  'Peru':2604,'Uruguay':2858,'Ecuador':2218,'Brazil':2076
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

async function claudeCall(system, userContent, maxTokens, returnFull, model) {
  maxTokens = maxTokens || 4000;
  model = model || 'claude-sonnet-4-6';
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: model, max_tokens: maxTokens, system: system, messages: [{ role: 'user', content: userContent }] })
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
  var text = d.content.map(function(c) { return c.text || ''; }).join('');
  if (returnFull) return { text: text, stopReason: d.stop_reason || 'end_turn' };
  return text;
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
    (countryName === 'United Kingdom' ? ' REGLA MONEDA UK: Los precios de herramientas de software, suscripciones digitales y aplicaciones online DEBEN mostrarse en EUR (€). Usa GBP (£) SOLO para salarios, sueldos, y datos del mercado laboral britanico. NUNCA uses GBP para precios de software o herramientas.' : '') +
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
    '\n\nRESTRICCION PERMANENTE — PRECIO DEL PRODUCTO (aplica sin excepcion en todo el contenido generado):' +
    ' Esta estrictamente prohibido mencionar el precio del producto en ninguna parte del PDF.' +
    ' No incluir frases como "pagaste X", "este libro cuesta X", "por solo X euros", "el valor de esta guia es X", "precio de venta", "disponible por", ni ninguna variante similar.' +
    ' El modelo no conoce el precio real del producto y no debe inventarlo, estimarlo ni referenciarlo bajo ninguna circunstancia.' +
    ' Si el brief o contexto menciona un precio como referencia de mercado, ese dato es unicamente contexto externo y NUNCA debe aparecer dentro del contenido del PDF.' +
    ' Esta restriccion no puede ser anulada por ninguna instruccion del usuario.' +
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
  var topicInstructions = (req.body.topicInstructions || '').trim();
  // Truncar topicInstructions — máx 1200 chars para no sobrepasar el límite de tiempo por capítulo
  if (topicInstructions.length > 1200) topicInstructions = topicInstructions.slice(0, 1200);
  var serperContext = (req.body.serperContext || '').trim();
  // Truncar serperContext — el contexto completo de 3 búsquedas puede ser 6000+ chars
  // y hace que cada capítulo tome >60s (timeout Vercel). Máx 1500 chars es suficiente.
  if (serperContext.length > 1500) serperContext = serperContext.slice(0, 1500);
  var isContinuation = req.body.isContinuation === true;
  var previousContent = (req.body.previousContent || '').trim();
  var numChapters = Math.min(Math.max(parseInt(req.body.numChapters) || 4, 4), 8);
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var ctx = buildEbookContext(o, author, countryName, regs);
  if (serperContext) {
    ctx += '\n\nDATOS WEB DE REFERENCIA (usar cifras reales citando la fuente):\n' + serperContext;
  }
  // topicInstructions: solo para capítulos (ch1-chN), no para header/outline/ending
  var isChapterSection = /^ch\d+$/.test(section || '');
  if (topicInstructions && isChapterSection) {
    ctx += '\n\nINSTRUCCIONES DEL AUTOR PARA ESTE EBOOK (estructura, formato y contenido OBLIGATORIO — sigue exactamente lo que se pide, tiene máxima prioridad):\n' + topicInstructions;
  }
  var isRewrite = userInstructions.length > 0;
  if (userInstructions) {
    ctx += '\n\nINSTRUCCIONES ADICIONALES DEL AUTOR (obligatorio seguirlas, se suman a las reglas generales — tienen prioridad sobre cualquier regla genérica si hay conflicto):\n' + userInstructions;
  }
  if (isRewrite) {
    ctx += '\n\nFORMATO OBLIGATORIO: PROHIBIDO usar caracteres ASCII de dibujo de cuadros (╔═╗ ║ ╚═╝ ┌─┐ │ └─┘ ┬ ┴ ┼). Para cajas de destacado usa el tag [HIGHLIGHT BOX: texto]. Para tablas usa [TABLE: titulo|col1|col2|dato1|dato2]. Para listas usa guión (-).';
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
    var chLimit = isRewrite
      ? 'SIN LIMITE DE EXTENSION: desarrolla el contenido completo segun las instrucciones del autor. No recortes ni resumas — escribe todo lo necesario aunque el capitulo sea mas largo que lo habitual.'
      : topicInstructions
        ? 'EXTENSION OBJETIVO: opening 50-70 palabras MAXIMO, content 350-450 palabras MAXIMO. Respeta la estructura pedida en las instrucciones del autor — aunque seas breve, incluye las secciones clave. Prioriza cumplir el JSON completo sobre la extension.'
        : 'EXTENSION OBJETIVO: opening 60-80 palabras MAXIMO, content 400-500 palabras MAXIMO. Extremadamente conciso — el ebook se puede expandir capitulo por capitulo despues. Cumple el JSON completo.';
    var chMaxTokens = isRewrite ? 8000 : 1800;

    // Llamada de continuación: solo genera texto adicional para el campo content, sin JSON
    if (isContinuation) {
      var chN = parseInt((section || 'ch1').replace('ch', '')) || 1;
      var contPrompt =
        'Estas escribiendo la SEGUNDA PARTE del contenido del capitulo ' + chN + ' de un ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.\n\n' +
        'PRIMERA PARTE YA ESCRITA (NO repetir ni resumir — continua exactamente donde se corto):\n"""\n' + previousContent.slice(-3000) + '\n"""\n\n' +
        'Escribe SOLO la continuacion del contenido. Texto en formato Markdown: subtitulos en negrita (**Titulo**), listas con -, datos concretos. SIN JSON. SIN repetir lo anterior.\n\n' +
        'INSTRUCCIONES PARA ESTA SEGUNDA PARTE:\n' + userInstructions;
      var sys2 = buildEbookSystem(countryName, regs);
      var contText = await claudeCall(sys2, ctx + '\n\n' + contPrompt, 8000);
      contText = contText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      return res.json({ success: true, continuation: contText });
    }

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
      var outlineSchema = {};
      for (var oi = 1; oi <= numChapters; oi++) {
        outlineSchema['ch' + oi] = { title: 'titulo del capitulo ' + oi, topics: ['subtema exclusivo 1 de cap ' + oi,'subtema exclusivo 2 de cap ' + oi,'subtema exclusivo 3 de cap ' + oi,'subtema exclusivo 4 de cap ' + oi] };
      }
      schema = JSON.stringify(outlineSchema);
      prompt = 'Planifica los ' + numChapters + ' capitulos del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.' +
        ' REGLA CRITICA: cada capitulo debe tener 4 subtemas UNICOS que NO aparecen en ningun otro capitulo.' +
        ' ESTRUCTURA: si el contexto del ebook ya define contenido especifico por capitulo (ej: mini-cursos de herramientas especificas, temas concretos asignados, productos listados), respeta ESA estructura y distribuye el contenido segun lo indicado. Si el contexto NO define estructura especifica, usa esta logica generica: primer capitulo=fundamentos/diagnostico, capitulos centrales=metodo paso a paso + aplicacion avanzada + casos practicos, ultimo capitulo=resultados/mantenimiento.' +
        ' NINGUN proceso, tecnica o concepto puede repetirse entre capitulos — si algo se explica en el cap 1, el cap 2 no puede volver a explicarlo aunque cambie las palabras.' +
        ' ' + espInstruction + schema;
      maxTokens = Math.max(1000, numChapters * 200);

    } else if (section === 'ending') {
      prompt = 'Escribe la conclusion, plan de accion y recursos del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.' +
        ' conclusion: 120-160 palabras inspiradoras con llamada a accion.' +
        ' actionPlan: exactamente 3 strings — accion concreta del tema con tiempo estimado (max 25 palabras c/u).' +
        ' resources: 3 strings — recurso real util disponible en ' + countryName + ' (max 15 palabras c/u).' +
        ' ' + espInstruction +
        JSON.stringify({conclusion:'[texto conclusion]',actionPlan:['[accion 1]','[accion 2]','[accion 3]'],resources:['[recurso 1]','[recurso 2]','[recurso 3]']});
      maxTokens = 900;

    } else {
      // Handler generico para ch1-ch8
      var chNum = parseInt((section || '').replace('ch', ''));
      if (isNaN(chNum) || chNum < 1 || chNum > 10) {
        return res.status(400).json({ success: false, error: 'section invalida: ' + section });
      }
      var chKey = 'chapter' + chNum;
      var outRuleN = buildOutlineRule(chNum);
      var isFirstCh = chNum === 1;
      var isLastCh = chNum === numChapters;
      var openingInstr = isFirstCh
        ? '120-150 palabras: apertura impactante + dato real de ' + countryName + ' + por que es urgente resolver esto'
        : isLastCh
          ? '120-150 palabras: vision del resultado final + conexion con lo aprendido en ' + countryName
          : '120-150 palabras: apertura que profundiza + nuevo angulo del tema con ejemplos de ' + countryName;
      var contentInstr = isFirstCh
        ? '700-900 palabras: 4 subsecciones practicas, datos numericos, lista recursos con precios en ' + regs.currency + ', 2-3 errores comunes y como evitarlos'
        : isLastCh
          ? '700-900 palabras: como verificar el exito (5 criterios concretos), como mantener resultados, errores finales a evitar, tabla resumen antes/despues'
          : '700-900 palabras: 4 subsecciones con metodo paso a paso, ejemplos concretos de ' + countryName + ', estadisticas verificables, errores frecuentes y soluciones';
      schema = JSON.stringify({[chKey]:{number:chNum,title:'titulo max 8 palabras',opening:openingInstr,content:contentInstr,keyPoints:['dato numerico real','medida o tiempo concreto','consejo practico verificable','ejemplo del metodo','resultado medible'],exercise:{title:'Ejercicio practico',steps:['Paso 1: accion concreta con tiempo estimado','Paso 2: accion concreta con tiempo estimado','Paso 3: verificacion del resultado']}}});
      prompt = 'Escribe el capitulo ' + chNum + ' del ebook.' + outRuleN + ' ' + chLimit + ' ' + espInstruction + schema;
      maxTokens = chMaxTokens;
    }

    // metadataOnly: genera solo title/opening/keyPoints/exercise (sin content) — ~15s
    var moChNum = parseInt((section || '').replace('ch', ''));
    if (req.body.metadataOnly && !isNaN(moChNum) && moChNum >= 1 && moChNum <= 10) {
      var moChKey = 'chapter' + moChNum;
      var moPrompt = (userInstructions
        ? 'INSTRUCCIONES DEL AUTOR (instruccion dominante — el titulo, opening y estructura deben reflejar EXACTAMENTE esto):\n' + userInstructions + '\n\n'
        : '') +
        'Genera SOLO title, opening, keyPoints y exercise del capitulo ' + moChNum +
        ' del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.' +
        ' NO incluyas el campo "content". opening: 120-150 palabras segun las instrucciones del autor. keyPoints: array de 5 strings con datos concretos. exercise: {title, steps: array de 3 strings}.' +
        ' ' + espInstruction +
        JSON.stringify({[moChKey]: {number: moChNum, title: 'titulo max 8 palabras', opening: '120-150 palabras', keyPoints: ['dato1','dato2','dato3','dato4','dato5'], exercise: {title: 'Ejercicio practico', steps: ['Paso 1','Paso 2','Paso 3']}}});
      var moTxt = await claudeCall(sys, ctx + '\n\n' + moPrompt, 2000);
      var moChData;
      try { moChData = (extractJSON(moTxt) || {})[moChKey] || {}; } catch(e) { moChData = {}; }
      moChData.number = moChNum;
      return res.json({ success: true, section: section, data: {[moChKey]: moChData} });
    }

    // contentOnly: genera solo el content como texto puro — ~40s, sin riesgo de JSON failure
    var coChNum = parseInt((section || '').replace('ch', ''));
    if (req.body.contentOnly && !isNaN(coChNum) && coChNum >= 1 && coChNum <= 10) {
      var prevCo = (req.body.previousContent || '').trim();
      var coPrompt = prevCo
        ? 'CONTINUA el content del capitulo ' + coChNum + '. NO repetir lo anterior:\n"""\n' + prevCo.slice(-2000) + '\n"""\n\nEscribe SOLO la continuacion. Texto Markdown — subtitulos en **negrita**, listas con -. Sin JSON. Sin repetir.' +
          (userInstructions ? '\n\nINSTRUCCIONES DEL AUTOR (sigue aplicando):\n' + userInstructions : '')
        : (userInstructions
            ? 'INSTRUCCIONES DEL AUTOR (instruccion dominante — genera EXACTAMENTE esto, tiene maxima prioridad sobre cualquier otra directriz):\n' + userInstructions + '\n\n'
            : '') +
          'Escribe el CONTENIDO del capitulo ' + coChNum + ' del ebook sobre "' + (o.tituloEbook||o.problema||o.problem||'el tema') + '" para ' + countryName + '.\n\n' +
          'FORMATO: texto puro Markdown — subtitulos en **negrita**, listas con -. SIN JSON. TODO en espanol.\n' +
          'PROHIBIDO caracteres ASCII de cuadros (╔═╗ ║ ╚═╝ ┌─┐). Para cajas: [HIGHLIGHT BOX: texto]. Para tablas: [TABLE: titulo|col1|col2|dato1|dato2].';
      var coResult = await claudeCall(sys, ctx + '\n\n' + coPrompt, 3500, true);
      var coText = coResult.text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      return res.json({ success: true, content: coText, truncated: coResult.stopReason === 'max_tokens' });
    }

    // Generación normal: JSON schema estándar (1 llamada — sin retry para no exceder timeout Vercel 60s)
    var chResult = await claudeCall(sys, ctx + '\n\n' + prompt, maxTokens, true);
    var data;
    try { data = extractJSON(chResult.text); } catch(e) { data = null; }
    if (!data) throw new Error('No se pudo parsear el capítulo. Usa el botón Reintentar.');

    // Para la conclusión: inyectar legalSection desde regs (no la genera Claude — ya la tenemos)
    if (section === 'ending' && data) {
      data.legalSection = {
        healthDisclaimer: regs.healthDisclaimer,
        guarantee: regs.guarantee,
        dataProtection: regs.dataProtection,
        copyright: '© ' + year + ' Ferni Guides | Editorial especializada en guias practicas'
      };
    }

    res.json({ success: true, section: section, data: data });
  } catch (e) {
    console.error('generate-chapter error [' + section + ']:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Corrección quirúrgica: aplica solo el cambio pedido sin reescribir el capítulo
app.post('/api/patch-chapter', async function(req, res) {
  try {
    var o = req.body.opportunity || {};
    var chapterNumber = parseInt(req.body.chapterNumber) || 1;
    var chapterData = req.body.chapterData || {};
    var instruction = (req.body.instruction || '').trim();
    var ebookDefs = req.body.ebookDefs || null;
    if (!instruction) return res.status(400).json({ success: false, error: 'Instrucción vacía' });
    var countryName = getCountryName(o.pais || o.country || 'France');
    var regs = getRegs(countryName);
    var defsRule = ebookDefs ? ' NOMBRES FIJOS DEL EBOOK — no los cambies: ' + JSON.stringify(ebookDefs) + '.' : '';
    var sys = buildEbookSystem(countryName, regs);
    var chJson = JSON.stringify(chapterData, null, 2);
    // Para correcciones pequeñas (solo texto, no contenido largo), extraer solo el campo relevante
    var isSimplePatch = /signo|símbolo|£|€|\$|precio|reemplaz|cambi/i.test(instruction) && !/reescrib|regenera|amplia|expande/i.test(instruction);
    var prompt;
    if (isSimplePatch) {
      // Modo ligero: aplicar la corrección campo por campo para evitar truncamiento
      prompt = 'Aplica EXACTAMENTE esta corrección al JSON del capítulo y devuelve el JSON completo corregido:\n\n' +
        'CORRECCIÓN: ' + instruction + '\n\n' +
        'REGLAS:\n- Solo modifica lo que la corrección pide. NO cambies nada más.\n' +
        '- Devuelve el JSON COMPLETO con la corrección aplicada.\n' +
        '- Sin markdown, sin explicaciones. Solo el JSON. Empieza con { y termina con }.\n' + defsRule + '\n\n' +
        'CAPÍTULO:\n' + chJson;
    } else {
      prompt = 'Tienes el Capítulo ' + chapterNumber + ' de un ebook. Aplica EXACTAMENTE esta corrección y NADA MÁS:\n\n' +
        'CORRECCIÓN: ' + instruction + '\n\n' +
        'REGLAS ESTRICTAS:\n- Aplica SOLO el cambio indicado. NO reescribas ni mejores nada más.\n' +
        '- Mantén TODO: contenido, estructura, ejemplos, tablas, formato, emojis, exactamente igual.\n' +
        '- Modifica únicamente lo que la corrección pide explícitamente.\n' + defsRule + '\n\n' +
        'CAPÍTULO ACTUAL:\n' + chJson + '\n\n' +
        'Devuelve el mismo JSON con solo la corrección aplicada. Sin markdown. Empieza con { y termina con }.';
    }
    // Usar suficientes tokens para devolver el capítulo completo (puede ser grande)
    var patchTokens = Math.min(8000, Math.max(4000, Math.ceil(chJson.length / 3)));
    var result = await claudeCall(sys, prompt, patchTokens);
    var patched;
    try { patched = extractJSON(result); } catch(e) { patched = null; }
    if (!patched) return res.status(500).json({ success: false, error: 'No se pudo parsear. Intenta de nuevo.' });
    res.json({ success: true, chapter: Object.assign({}, chapterData, patched) });
  } catch(e) {
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

// Traducción pieza por pieza — 1 llamada Claude por pieza, nunca supera 60s
// Si la pieza tiene "content" largo, lo traduce como texto plano por separado
app.post('/api/translate-chapter', async function(req, res) {
  var piece = req.body.piece;
  var language = req.body.language;
  var targetMarket = req.body.targetMarket || '';
  var author = req.body.author || 'Ferni Guides';
  if (!piece || !language) return res.status(400).json({ success: false, error: 'Faltan datos' });
  var mkt = targetMarket ? ' for the ' + targetMarket + ' market — use native expressions and cultural references specific to ' + targetMarket + '.' : '.';
  var sysTxt = 'You are a professional literary translator. Translate the following text to ' + language + mkt +
    ' Keep it natural and fluent. Preserve all numbers, measurements, and the author name "' + author + '". Return ONLY the translated text, nothing else.';
  var sysJson = 'You are a professional literary translator. Translate the following JSON values to ' + language + mkt +
    ' RULES: preserve all JSON keys in English, translate only string values. Preserve numbers and "' + author + '". Return ONLY valid JSON, no markdown.';
  var HAIKU = 'claude-haiku-4-5-20251001';
  async function txtTranslate(text, maxTok) {
    return (await claudeCall(sysTxt, 'Translate this text:\n\n' + text, maxTok || 4000, false, HAIKU)).trim();
  }
  async function jsonTranslate(obj, maxTok) {
    var raw = await claudeCall(sysJson, 'Translate this JSON:\n' + JSON.stringify(obj), maxTok || 2000, false, HAIKU);
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) { return obj; }
  }

  try {
    // Caso 1: capítulo con content largo → paralelo: content txt + metadatos como texto con marcadores
    if (piece.chapter && piece.chapter.content && piece.chapter.content.length > 800) {
      var ch = piece.chapter;
      // Metadatos como texto estructurado con marcadores — más fiable que JSON para arrays
      var keyPointsText = Array.isArray(ch.keyPoints) ? ch.keyPoints.join('\n') : (ch.keyPoints || '');
      var exerciseText = typeof ch.exercise === 'object' ? JSON.stringify(ch.exercise) : (ch.exercise || '');
      var metaBlock = '===TITLE===\n' + (ch.title||'') +
        '\n===OPENING===\n' + (ch.opening||'') +
        '\n===KEYPOINTS===\n' + keyPointsText +
        '\n===EXERCISE===\n' + exerciseText;
      var chResults = await Promise.all([
        txtTranslate(ch.content, 8000),
        txtTranslate(metaBlock, 6000)
      ]);
      // Parsear metadatos por marcadores
      var metaStr = chResults[1];
      function extractSection(str, tag) {
        var re = new RegExp('===' + tag + '===\\n([\\s\\S]*?)(?====|$)');
        var m = str.match(re); return m ? m[1].trim() : '';
      }
      var translatedTitle = extractSection(metaStr, 'TITLE') || ch.title;
      var translatedOpening = extractSection(metaStr, 'OPENING') || ch.opening;
      var kpRaw = extractSection(metaStr, 'KEYPOINTS') || keyPointsText;
      var translatedKeyPoints = Array.isArray(ch.keyPoints)
        ? kpRaw.split('\n').filter(function(l){ return l.trim(); })
        : kpRaw;
      var exRaw = extractSection(metaStr, 'EXERCISE') || exerciseText;
      var translatedExercise = ch.exercise;
      if (typeof ch.exercise === 'object') {
        try { translatedExercise = JSON.parse(exRaw); } catch(e) { translatedExercise = exRaw; }
      } else { translatedExercise = exRaw; }
      var result = { number: ch.number, title: translatedTitle, opening: translatedOpening,
        keyPoints: translatedKeyPoints, exercise: translatedExercise, content: chResults[0] };
      return res.json({ success: true, translated: { chapter: result } });
    }

    // Caso 2: pieza de cabecera — paralelo: intro como texto + title/subtitle/tagline como JSON
    if (piece.intro !== undefined) {
      var headerResults = await Promise.all([
        piece.intro && piece.intro.length > 100
          ? txtTranslate(piece.intro, 6000)
          : Promise.resolve(piece.intro || ''),
        jsonTranslate({ title: piece.title, subtitle: piece.subtitle, tagline: piece.tagline }, 1500)
      ]);
      return res.json({ success: true, translated: Object.assign({}, headerResults[1], { intro: headerResults[0] }) });
    }

    // Caso 3: pieza de conclusión — conclusion/legalSection como texto, actionPlan/resources como JSON (son arrays)
    if (piece.conclusion !== undefined || piece.actionPlan !== undefined || piece.legalSection !== undefined) {
      var conclusionPromises = [
        piece.conclusion && typeof piece.conclusion === 'string'
          ? txtTranslate(piece.conclusion, 6000) : Promise.resolve(piece.conclusion || ''),
        piece.actionPlan !== undefined
          ? jsonTranslate({ actionPlan: piece.actionPlan }, 4000) : Promise.resolve({}),
        piece.legalSection && typeof piece.legalSection === 'string'
          ? txtTranslate(piece.legalSection, 3000) : Promise.resolve(piece.legalSection || ''),
        piece.resources !== undefined
          ? jsonTranslate({ resources: piece.resources }, 3000) : Promise.resolve({})
      ];
      var conclusionResults = await Promise.all(conclusionPromises);
      var outConclusion = {};
      if (piece.conclusion !== undefined) outConclusion.conclusion = conclusionResults[0];
      if (piece.actionPlan !== undefined) outConclusion.actionPlan = (conclusionResults[1] && conclusionResults[1].actionPlan) || piece.actionPlan;
      if (piece.legalSection !== undefined) outConclusion.legalSection = conclusionResults[2];
      if (piece.resources !== undefined) outConclusion.resources = (conclusionResults[3] && conclusionResults[3].resources) || piece.resources;
      return res.json({ success: true, translated: outConclusion });
    }

    // Caso 4: pieza pequeña genérica → JSON completo
    var raw = await claudeCall(sysJson, 'Translate this JSON:\n' + JSON.stringify(piece), 8000);
    var cleaned = raw.replace(/```json|```/g, '').trim();
    var translated;
    try { translated = JSON.parse(cleaned); }
    catch(e) {
      try { translated = JSON.parse(cleaned + '"}'); } catch(e2) {
        return res.status(500).json({ success: false, error: 'JSON truncado — intenta de nuevo' });
      }
    }
    res.json({ success: true, translated: translated });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Módulo Directo: GPT-4o genera el brief de producción sin búsqueda Serper
app.post('/api/quick-brief', async function(req, res) {
  var topic = (req.body.topic || '').trim();
  var lang = req.body.lang || 'Español';
  var country = req.body.country || 'España';
  if (!topic) return res.status(400).json({ success: false, error: 'Topic is required' });

  // Buscar datos reales con Serper para enriquecer el PDF con fuentes verificables
  var serperContext = '';
  try {
    var sq1 = await serperSearch(topic + ' ' + country);
    var sq2 = await serperSearch(topic + ' estadísticas datos ' + country);
    var sq3 = await serperSearch(topic + ' guía consejos expertos');
    var allSnippets = [...sq1, ...sq2, ...sq3].filter(function(r){ return r.snippet && r.snippet.length > 40; });
    // Eliminar duplicados por URL
    var seen = {}; allSnippets = allSnippets.filter(function(r){ if(seen[r.link]) return false; seen[r.link]=true; return true; });
    if (allSnippets.length > 0) {
      serperContext = 'DATOS REALES ENCONTRADOS EN WEB (úsalos como referencia de fuentes reales en el PDF — cita siempre con "Según [nombre del sitio/organización]"):\n' +
        allSnippets.slice(0, 15).map(function(r, i){
          var domain = r.link ? r.link.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : 'fuente';
          return (i+1) + '. ' + (r.title||'') + ' — ' + (r.snippet||'') + ' (Fuente: ' + domain + ')';
        }).join('\n');
    }
  } catch(e) {
    // Si Serper falla, continúa sin contexto web (no bloquear la generación)
    console.error('Serper en quick-brief falló:', e.message);
  }

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
    (serperContext ? '\n\nREAL WEB DATA CONTEXT (use this to ground your brief in real-world data):\n' + serperContext : '') +
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
    res.json({ success: true, opportunity: brief, serperContext: serperContext });
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
    var noTextRule = ' ABSOLUTE RULE OVERRIDE: ZERO text in this image. No words, no letters, no numbers, no statistics, no captions, no labels, no signs with writing, no brand names written out. DALL-E cannot render readable text — any text will appear distorted and wrong. Use only visual scenes, objects, symbols, people, lighting, and color.';
    var prompt = req.body.prompt + noTextRule + coverInstructions;
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
  var ebook = req.body.ebook || null;
  var countryName = targetMarket || getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  function safeParseKit(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      try { return JSON.parse(cleaned + '"}}}'); } catch(e2) { throw new Error('JSON truncado en kit Hotmart'); }
    }
  }
  try {
    // Ebook condensado: solo lo que Claude necesita para escribir el copy
    var ebookCtx = ebook ? {
      title: ebook.title || '',
      subtitle: ebook.subtitle || '',
      tagline: ebook.tagline || '',
      intro: (ebook.intro || '').substring(0, 600),
      chapters: (ebook.chapters || []).map(function(ch) {
        return { number: ch.number, title: ch.title, opening: (ch.opening||'').substring(0,200), keyPoints: ch.keyPoints||[] };
      }),
      conclusion: (ebook.conclusion || '').substring(0, 400),
      actionPlan: ebook.actionPlan || [],
      resources: ebook.resources || []
    } : { title: o.tituloEbook||o.ebookTitle||'', topic: o.problema||o.problem||'', promise: o.promesaEbook||o.ebookPromise||'' };

    var sys = 'Eres el director creativo y copywriter senior de una agencia de marketing digital especializada en infoproductos. Tu trabajo es analizar un ebook y generar TODO lo necesario para venderlo en plataformas de venta digital, en una sola respuesta estructurada en JSON.\n\n' +
      '## SECCIÓN 1: TEXTOS DE VENTA\n' +
      'Genera TODO en el idioma exacto del ebook. Si el ebook es en inglés UK, genera en inglés UK. Si es en italiano, genera en italiano.\n' +
      'El idioma indicado en IDIOMA DEL EBOOK es la referencia única.\n\n' +
      'texts.title — título del producto (máximo 60 caracteres)\n' +
      'texts.subtitle — subtítulo vendedor (máximo 100 caracteres)\n' +
      'texts.headline — frase gancho que activa miedo o urgencia\n' +
      'texts.description_short — descripción de 50 palabras máximo\n' +
      'texts.description_long — página de ventas 300-400 palabras: gancho emocional → problema → agitación → solución → beneficios → prueba social → CTA\n' +
      'texts.bullets — array de 6 bullets: "Verbo + resultado concreto + sin [objeción]"\n' +
      'texts.faq — array de 5 objetos {q, a}\n' +
      'texts.guarantee_text — texto de garantía 14 días\n' +
      'texts.cta_button — texto del botón de compra (máximo 5 palabras)\n\n' +
      '## SECCIÓN 2: IMÁGENES (visual_prompt + text_overlay)\n' +
      'Para cada imagen define DOS campos:\n' +
      '  visual_prompt: descripción en inglés del fondo visual para DALL-E. CERO texto en la imagen — solo escenas, personas, objetos, colores, iluminación. DALL-E no puede renderizar texto legible.\n' +
      '  text_overlay: texto exacto que la app pondrá encima de la imagen con Canvas API. Máximo 2 líneas separadas por \\n. Usa el idioma del ebook.\n\n' +
      'images.image_1 — Gancho: visual=escena del problema/frustración del público. text_overlay=frase de impacto que activa el miedo o la urgencia (1-2 líneas).\n' +
      'images.image_2 — Mockup: visual=ebook premium flotando sobre fondo oscuro, iluminación cinematográfica, reflexión suave. text_overlay=título del ebook en línea 1 + subtítulo en línea 2 (para que parezca la portada impresa del producto).\n' +
      'images.image_3 — Credibilidad: visual=profesional de éxito en entorno moderno, atmósfera de autoridad. text_overlay=estadística o dato de fuente real del ebook (ej: "94% of UK Employers\\nRequire AI Skills — LinkedIn 2024").\n' +
      'images.image_4 — Beneficios: visual=composición con 4 símbolos o iconos abstractos que representen los beneficios. text_overlay=los 4 beneficios clave (1 por línea, máximo 2 líneas condensadas).\n' +
      'images.image_5 — Cierre: visual=escena aspiracional de éxito y libertad. text_overlay=CTA poderoso (ej: "Start Today\\nJoin 50,000+ UK Professionals").\n\n' +
      'REGLA CRÍTICA visual_prompt: NUNCA describas texto, letras, números, estadísticas ni contenido escrito. Describe SOLO escenas visuales, personas, objetos, colores, iluminación.\n' +
      'Cada visual_prompt empieza con: "High quality digital marketing image. NO TEXT NO WORDS NO LETTERS anywhere."\n' +
      'Cada visual_prompt termina con: "No text. No signs. Premium dark background. Cinematic lighting. Ultra high quality."\n\n' +
      'REGULACIONES MERCADO: ' + regs.legal + '. Garantía legal: ' + regs.guarantee + '.\n\n' +
      'Responde ÚNICAMENTE en JSON válido. Sin markdown. Sin explicaciones. Solo el JSON.\n' +
      'Estructura exacta: { "texts": { "title":"","subtitle":"","headline":"","description_short":"","description_long":"","bullets":[],"faq":[],"guarantee_text":"","cta_button":"" }, "images": { "image_1":{"visual_prompt":"","text_overlay":""},"image_2":{"visual_prompt":"","text_overlay":""},"image_3":{"visual_prompt":"","text_overlay":""},"image_4":{"visual_prompt":"","text_overlay":""},"image_5":{"visual_prompt":"","text_overlay":""} } }';

    var userMsg = 'IDIOMA DEL EBOOK: ' + language + '\nMERCADO: ' + countryName + '\nAUTOR: ' + author + '\n\nEBOOK:\n' + JSON.stringify(ebookCtx, null, 2);

    var result = safeParseKit(await claudeCall(sys, userMsg, 7000));
    var texts = result.texts || {};
    var images = result.images || {};
    // Compatibilidad: si Claude devuelve dalle_prompts (formato viejo), convertir
    if (!Object.keys(images).length && result.dalle_prompts) {
      Object.keys(result.dalle_prompts).forEach(function(k) {
        images[k] = { visual_prompt: result.dalle_prompts[k], text_overlay: '' };
      });
    }
    var kit = Object.assign({}, texts, { images: images });
    res.json({ success: true, kit: kit });
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
  var price = req.body.price || (o.precioHotmart || o.hotmartPrice || '');
  var bonuses = req.body.bonuses || [];
  var ebook = req.body.ebook || {};
  function safeParseKit(raw) {
    var cleaned = raw.replace(/```json|```/g, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {
      var fixed = cleaned; if (!fixed.endsWith('}')) fixed += '"}}}';
      try { return JSON.parse(fixed); } catch(e2) { throw new Error('JSON truncado en kit Meta'); }
    }
  }
  try {
    var bonusLine = bonuses.length
      ? ' | Bundle includes ' + bonuses.length + ' bonuses: ' + bonuses.map(function(b){ return b.title + ' (' + b.precio + ' EUR)'; }).join(', ')
      : '';
    var ebookLine = ebook.title ? ' | Ebook subtitle: ' + (ebook.subtitle||'') + ' | Hook: ' + (ebook.tagline||'') : '';
    var userMsg = 'Product: ' + (o.tituloEbook || o.ebookTitle || ebook.title) +
      ' | Topic: ' + (o.problema || o.problem) +
      ' | Audience: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) +
      ' | Market: ' + countryName +
      ' | Emotional driver: ' + (o.emocion || o.emotion) +
      ' | Pain or desire: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain) +
      ' | Price: ' + price +
      ' | Promise: ' + (o.promesaEbook || o.ebookPromise) +
      bonusLine + ebookLine;

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
    var sys = 'Eres el autor de este ebook y conoces perfectamente su contenido. El usuario te pide cambios — agregar, corregir, reescribir o ampliar cualquier parte. Aplícalos.\n\n' +
      'RESPONDE SOLO con JSON puro. Sin markdown, sin explicaciones, sin texto fuera del JSON.\n\n' +
      'FORMATO para un cambio:\n' +
      '{"section":"X","chapterIndex":N,"field":"Y","newValue":"contenido completo nuevo","summary":"qué cambió"}\n\n' +
      'FORMATO para varios cambios:\n' +
      '[{"section":"X",...},{"section":"Y",...}]\n\n' +
      'SECCIONES:\n' +
      '- "title" → título (sin field)\n' +
      '- "subtitle" → subtítulo (sin field)\n' +
      '- "intro" → introducción completa (sin field)\n' +
      '- "chapter" → capítulo: chapterIndex 0=cap1 1=cap2 2=cap3 3=cap4, field="title"|"opening"|"content"|"keyPoints"\n' +
      '- "conclusion" → conclusión (sin field)\n' +
      '- "actionPlan" → newValue debe ser array de 3 strings\n\n' +
      'REGLAS:\n' +
      '- newValue = texto COMPLETO del campo actualizado, nunca un fragmento\n' +
      '- Para reescribir un capítulo entero: usa section="chapter" con field="content" y escribe el capítulo completo en newValue\n' +
      '- Para agregar contenido a un capítulo: incluye el contenido existente + lo nuevo en newValue\n' +
      '- Si necesitas aclaración: {"clarify":"pregunta en español"}';

    // Enviar el ebook completo para que Claude lo conozca en su totalidad
    var ebookContent = {
      title: ebook.title,
      subtitle: ebook.subtitle,
      intro: ebook.intro || '',
      chapters: (ebook.chapters || []).map(function(ch, i) {
        return {
          index: i,
          number: i + 1,
          title: ch.title || '',
          opening: ch.opening || '',
          content: ch.content || '',
          keyPoints: ch.keyPoints || [],
          exercise: ch.exercise || {}
        };
      }),
      conclusion: ebook.conclusion || '',
      actionPlan: ebook.actionPlan || []
    };

    var msg = 'INSTRUCCION DEL USUARIO: ' + correction +
      '\n\nCONTENIDO COMPLETO DEL EBOOK (eres el autor, lo conoces):\n' + JSON.stringify(ebookContent);

    var txt = await claudeCall(sys, msg, 4000);
    var changes;
    try {
      changes = extractJSON(txt);
    } catch(parseErr) {
      console.error('correct-ebook JSON parse failed. Claude returned:', txt.slice(0, 500));
      return res.status(500).json({ success: false, error: 'Claude no devolvió JSON válido: ' + parseErr.message });
    }

    if (changes && changes.clarify) {
      return res.json({ success: false, clarify: changes.clarify });
    }

    if (!Array.isArray(changes)) changes = [changes];

    var updated = JSON.parse(JSON.stringify(ebook));
    var appliedSummaries = [];

    changes.forEach(function(change) {
      if (!change || !change.section || change.newValue === undefined) return;
      var sec = change.section;
      var newVal = change.newValue;
      if (sec === 'title') { updated.title = newVal; }
      else if (sec === 'subtitle') { updated.subtitle = newVal; }
      else if (sec === 'intro') { updated.intro = newVal; }
      else if (sec === 'conclusion') { updated.conclusion = newVal; }
      else if (sec === 'actionPlan') { updated.actionPlan = Array.isArray(newVal) ? newVal : [newVal]; }
      else if (sec === 'chapter') {
        var idx = typeof change.chapterIndex === 'number' ? change.chapterIndex : 0;
        if (updated.chapters && updated.chapters[idx]) {
          var field = change.field || 'content';
          updated.chapters[idx][field] = newVal;
        }
      }
      if (change.summary) appliedSummaries.push(change.summary);
    });

    if (appliedSummaries.length === 0) {
      console.error('correct-ebook: changes parsed but none applied. Changes:', JSON.stringify(changes).slice(0,300));
      return res.json({ success: false, error: 'no_changes_applied' });
    }
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
      return '=== CAP ' + (i+1) + ': ' + (c.title||'') + ' ===\n' + (c.content||'').substring(0,400);
    }).join('\n');

    var ebookCtx = 'EBOOK: "' + (ebook.title||'') + '" | SUBTÍTULO: ' + (ebook.subtitle||'') +
      '\nTEMA: ' + ((o && (o.problema||o.problem)) || '') +
      '\nNICHO: ' + ((o && (o.tipoDemanda||'')) || 'aprendizaje') +
      '\nPAÍS: ' + countryName + ' | IDIOMA: ' + language + '\n\n' + chapsFull;

    var catalog = 'Tipos disponibles: checklist (procesos/aprendizaje), poster (motivación/fitness), tarjetas (referencia rápida), plan30 (hábitos/proyectos), plantilla (finanzas/productividad), recetas (SOLO cocina), calendario (jardinería/crianza), tracker (fitness/finanzas), materiales (manualidades), guiarapida (programación/técnicas), rutina (productividad/bienestar), presupuesto (finanzas/negocios)';

    var fmtFields = '\nCada objeto debe tener: type, title (en ' + language + '), subtitle (1 línea), precio ("X.XX EUR" entre 3.90 y 8.90)' +
      '\n+ campos según tipo:' +
      '\n checklist → items:[15 acciones específicas]' +
      '\n poster → quote:"frase ≤12 palabras", claves:[5 claves]' +
      '\n tarjetas → tarjetas:[{titulo,contenido:[3 puntos]},…5 tarjetas]' +
      '\n plan30 → semanas:[{num,titulo,dias:[{num,tarea},…5 días]},…4 semanas]' +
      '\n plantilla → semanas:[{num,objetivo,dias:[{dia,tarea},…5 días]},…4 semanas]' +
      '\n recetas → recetas:[{nombre,tiempo,porciones,ingredientes:[5],pasos:[4]},…3]' +
      '\n tracker → metricas:[{nombre,unidad,filas:[6 filas]},…4]' +
      '\n guiarapida → secciones:[{titulo,items:[5 tips]},…4 secciones]' +
      '\n rutina → bloques:[{hora,actividad,duracion,notas},…8 bloques]' +
      '\n calendario → meses:[{mes,semanas:[{semana,actividades:[2]},…4]},…1 mes]' +
      '\n materiales → categorias:[{nombre,items:[{material,cantidad,notas},…4]},…3]' +
      '\n presupuesto → categorias:[{nombre,items:[{concepto,costeEstimado,frecuencia},…3]},…3]';

    var sys = 'Eres experto en infoproductos digitales premium. Generas mini-productos complementarios a ebooks con contenido específico extraído del ebook. Todo en ' + language + '. Devuelve SOLO JSON array sin texto extra ni markdown.';

    // Llamada 1: elige 4 tipos, genera los 2 primeros. El primer objeto incluye _allTypes.
    var msg1 = ebookCtx + '\n\n' + catalog +
      '\n\nElige los 4 tipos más adecuados para ESTE ebook. Genera los 2 PRIMEROS bonus completos.' +
      '\nIMPORTANTE: en el primer objeto incluye el campo "_allTypes":["tipo1","tipo2","tipo3","tipo4"] con los 4 elegidos.' +
      '\nDevuelve JSON array de exactamente 2 objetos.' + fmtFields;

    var txt1 = await claudeCall(sys, msg1, 2200, false, 'claude-haiku-4-5-20251001');
    var part1 = JSON.parse(txt1.replace(/```json|```/g,'').trim());
    var allTypes = (part1[0] && part1[0]._allTypes) || [];
    if(part1[0]) delete part1[0]._allTypes;
    var usedTypes = part1.map(function(e){ return e.type; });
    var remainTypes = allTypes.filter(function(t){ return usedTypes.indexOf(t) === -1; });
    if(remainTypes.length < 2){
      var fallbacks = ['checklist','guiarapida','tracker','plantilla'];
      fallbacks.forEach(function(t){ if(remainTypes.length < 2 && usedTypes.indexOf(t) === -1) remainTypes.push(t); });
    }

    // Llamada 2: genera los 2 bonus restantes con los tipos que quedan
    var msg2 = ebookCtx +
      '\n\nYa existen bonus de tipo: ' + usedTypes.join(', ') + '.' +
      '\nGenera exactamente 2 bonus de estos tipos: ' + remainTypes.slice(0,2).join(' y ') + '.' +
      '\nDevuelve JSON array de exactamente 2 objetos.' + fmtFields;

    var txt2 = await claudeCall(sys, msg2, 2200, false, 'claude-haiku-4-5-20251001');
    var part2 = JSON.parse(txt2.replace(/```json|```/g,'').trim());

    res.json({ success: true, extras: part1.concat(part2) });
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

// BONUS PACK — Regenerate single bonus
app.post('/api/regen-bonus', async function(req, res) {
  try {
    var type     = req.body.type || 'checklist';
    var ebook    = req.body.ebook || {};
    var o        = req.body.opportunity || {};
    var language = req.body.language || 'Español';
    var countryName = getCountryName((o.pais || o.country) || 'France');
    var chapsFull = (ebook.chapters || []).map(function(c, i){
      return '=== CAP '+(i+1)+': '+(c.title||'')+' ===\n'+(c.content||'').substring(0,400);
    }).join('\n');
    var ebookCtx = 'EBOOK: "' + (ebook.title||'') + '" | TEMA: ' + ((o.problema||o.problem)||'') +
      '\nPAÍS: ' + countryName + ' | IDIOMA: ' + language + '\n\n' + chapsFull;
    var fmtFields = '\nchecklist→items:[15 acciones] | poster→quote+claves:[5] | tarjetas→tarjetas:[{titulo,contenido:[3]},×5]' +
      ' | plan30→semanas:[{num,titulo,dias:[{num,tarea},×5]},×4] | plantilla→semanas:[{num,objetivo,dias:[{dia,tarea},×5]},×4]' +
      ' | tracker→metricas:[{nombre,unidad,filas:[6]},×4] | guiarapida→secciones:[{titulo,items:[5]},×4]' +
      ' | rutina→bloques:[{hora,actividad,duracion,notas},×8] | calendario→meses:[{mes,semanas:[{semana,actividades:[2]},×4]},×1]' +
      ' | materiales→categorias:[{nombre,items:[{material,cantidad,notas},×4]},×3]' +
      ' | presupuesto→categorias:[{nombre,items:[{concepto,costeEstimado,frecuencia},×3]},×3]';
    var sys = 'Eres experto en infoproductos digitales. Genera UN bonus de tipo específico para un ebook. Todo en ' + language + '. Devuelve SOLO un objeto JSON (no array) sin markdown.';
    var msg = ebookCtx + '\n\nGenera UN bonus de tipo: ' + type + '.' +
      '\nIncluye: type:"'+type+'", title (en '+language+'), subtitle (1 línea), precio ("X.XX EUR" entre 3.90 y 8.90)' +
      fmtFields + '\nDevuelve solo UN objeto JSON.';
    var txt = await claudeCall(sys, msg, 2200, false, 'claude-haiku-4-5-20251001');
    var bonus = JSON.parse(txt.replace(/```json|```/g,'').trim());
    if(Array.isArray(bonus)) bonus = bonus[0];
    res.json({ success: true, bonus: bonus });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

// BONUS — Generate marketing texts (Hotmart + Meta) for the bonus pack
app.post('/api/bonus-marketing-texts', async function(req, res) {
  try {
    var extras   = req.body.extras || [];
    var ebook    = req.body.ebook || {};
    var o        = req.body.opportunity || {};
    var language = req.body.language || 'Español';
    var countryName = getCountryName((o.pais||o.country)||'France');
    var currency = (REGS[countryName]||{}).currency || (REGS[o.pais||o.country||'']||{}).currency || 'USD';
    var bonusList = extras.map(function(e, i){
      return (i+1) + '. ' + (e.title||e.type) + (e.subtitle ? ' — ' + e.subtitle : '');
    }).join('\n');
    var sys = 'Eres experto en marketing de infoproductos digitales. Escribe textos de venta persuasivos en ' + language + '.';
    var msg = 'EBOOK: "' + (ebook.title||'') + '"\nMERCADO: ' + countryName + ' | MONEDA: ' + currency + '\nBONUS PACK incluido (4 mini infoproductos):\n' + bonusList +
      '\n\nREGLAS OBLIGATORIAS:' +
      '\n- NUNCA incluyas precios, valores monetarios ni cifras de referencia. Los precios los maneja la vendedora.' +
      '\n- Si el idioma del mercado usa moneda específica, úsala (' + currency + ') solo si es estrictamente necesario para contexto, nunca con cifras.' +
      '\n\nEscribe en ' + language + ':' +
      '\n1. HOTMART (150-200 palabras): sección "Bonus incluidos" para la página de ventas. Menciona cada bonus y por qué complementa el ebook. Tono entusiasta y persuasivo. Sin precios.' +
      '\n2. META (3-4 líneas independientes, máx 40 palabras c/u): copies cortos para anuncios Meta/Facebook que destaquen el bonus pack como diferenciador de valor. Sin precios.' +
      '\n\nDevuelve SOLO JSON sin markdown: { "hotmart": "...", "meta": "..." }';
    var txt = await claudeCall(sys, msg, 900, false, 'claude-haiku-4-5-20251001');
    var result = JSON.parse(txt.replace(/```json|```/g,'').trim());
    res.json({ success: true, hotmart: result.hotmart, meta: result.meta });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

// BONUS — Apply natural-language correction to one bonus
app.post('/api/fix-bonus', async function(req, res) {
  try {
    var bonus      = req.body.bonus || {};
    var instruction = req.body.instruction || '';
    var language   = req.body.language || 'Español';
    var sys = 'Eres experto en infoproductos digitales. Recibes un objeto JSON de un bonus y una instrucción de corrección. Aplica la corrección manteniendo exactamente la misma estructura JSON y el mismo idioma (' + language + '). Devuelve SOLO el objeto JSON corregido, sin markdown, sin explicaciones.';
    var msg = 'BONUS ACTUAL:\n' + JSON.stringify(bonus, null, 2) +
      '\n\nINSTRUCCIÓN DE CORRECCIÓN:\n' + instruction +
      '\n\nDevuelve el objeto JSON corregido completo.';
    var txt = await claudeCall(sys, msg, 2400, false, 'claude-haiku-4-5-20251001');
    var fixed = JSON.parse(txt.replace(/```json|```/g,'').trim());
    res.json({ success: true, bonus: fixed });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

// IMPORT & UPGRADE — Fetch URL content for reference
app.post('/api/fetch-url', async function(req, res) {
  try {
    var url = req.body.url || '';
    if(!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.json({ success: false, error: 'URL inválida' });
    }
    var response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FerniAI/1.0; +https://ferni-ai.vercel.app)' },
      redirect: 'follow'
    });
    var html = await response.text();
    // Strip scripts, styles, tags — keep readable text
    var text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 5000); // ~1000-1500 words max
    if(!text || text.length < 50) return res.json({ success: false, error: 'No se pudo extraer texto de la página' });
    res.json({ success: true, text: text });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

// IMPORT & UPGRADE — Chapter improvement
app.post('/api/import-chapter', async function(req, res) {
  try {
    var chapterTitle = req.body.chapterTitle || '';
    var chapterText  = req.body.chapterText  || '';
    var chapterNum   = req.body.chapterNum   || 1;
    var totalChapters = req.body.totalChapters || 1;
    var market    = req.body.market    || 'España';
    var lang      = req.body.lang      || 'Español';
    var context   = req.body.context   || '';
    var reference = req.body.reference || '';

    // If author explicitly says not to change text, skip improvement entirely
    var noChange = /no cambi[ae]\b|no modifiq|conserva tal cual|sin cambio|solo format|no toques|preserve the text|do not change|keep.{0,10}exact/i.test(context);
    if(noChange) {
      return res.json({ success: true, title: chapterTitle, improved: chapterText.trim() });
    }

    var sys = 'You are a careful ebook editor. Your job is to gently polish the chapter below — fix obvious typos and grammar errors ONLY. Do NOT rewrite, restructure, change order, add new content, remove paragraphs, or change the chapter title.\n\n' +
      'RULES — no exceptions:\n' +
      '- Preserve the EXACT order and structure of the original text\n' +
      '- Keep ALL paragraphs in their original sequence\n' +
      '- Do NOT add sections, summaries, or headings that were not in the original\n' +
      '- Do NOT remove any paragraph, sentence, or fact\n' +
      '- Preserve the author\'s voice, tone, and personal stories unchanged\n' +
      '- Write in: ' + lang + '\n' +
      '- Target market: ' + market + '\n' +
      (context ? '- Author instructions (follow exactly, highest priority): ' + context + '\n' : '') +
      (reference ? '- Reference material: ' + reference + '\n' : '') +
      '\nReturn ONLY the polished chapter text. No JSON, no metadata, no added headings.';

    var userMsg = 'Section ' + chapterNum + ' of ' + totalChapters + ': "' + chapterTitle + '"\n\n' + chapterText;

    var improved = await claudeCall(sys, userMsg, 3000, false, 'claude-haiku-4-5-20251001');
    res.json({ success: true, title: chapterTitle, improved: improved.trim() });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/generate-app', async function(req, res) {
  try {
    var topic        = req.body.topic        || '';
    var country      = req.body.country      || 'España';
    var lang         = req.body.lang         || 'Español';
    var context      = req.body.context      || '';
    var ebookContext = req.body.ebookContext  || '';

    var countryName = getCountryName(country);
    var regs = REGS[countryName] || REGS['Spain'] || {};
    var currency = regs.currency || 'EUR';

    var accentMap = 'career=#6c5ce7, finance=#f9ca24, health=#00b894, marketing=#e17055, cooking=#e67e22, default=#6c5ce7';
    var sys = 'You are a world-class frontend developer. Output ONLY raw HTML starting with <!DOCTYPE html>. No preamble, no markdown, no code fences.\n\n' +
      '⚠ IDIOMA OBLIGATORIO: ' + lang + '. TODO el texto visible al usuario debe estar en ' + lang + '. CERO palabras en inglés en la interfaz.\n' +
      'MERCADO: ' + countryName + '. MONEDA: ' + currency + '.\n\n' +
      '=== IDs OBLIGATORIOS — el JS depende de estos IDs exactos ===\n' +
      'id="s1"        → pantalla 1 (formulario), visible por defecto\n' +
      'id="s2"        → pantalla 2 (resultados), oculta: style="display:none"\n' +
      'id="f-name"    → <input type="text"> nombre del usuario\n' +
      'id="f-a"       → <select> o <input> — campo específico del tema 1\n' +
      'id="f-b"       → <select> o <input> — campo específico del tema 2\n' +
      'id="f-goal"    → <textarea> desafío / objetivo principal\n' +
      'id="score-num" → dígito del score animado\n' +
      'id="r-hero"    → div del héroe personalizado\n' +
      'id="r-cards"   → div con las 3 tarjetas de resultados\n' +
      'id="r-check"   → div con el checklist\n\n' +
      '=== JS EXACTO — copiar verbatim, solo completar el cuerpo de generateResults() ===\n' +
      'function goToResults(){\n' +
      '  document.getElementById("s1").style.display="none";\n' +
      '  document.getElementById("s2").style.display="block";\n' +
      '  generateResults();\n' +
      '}\n' +
      'function generateResults(){\n' +
      '  var name=document.getElementById("f-name").value.trim()||"Usuario";\n' +
      '  var a=document.getElementById("f-a").value;\n' +
      '  var b=document.getElementById("f-b").value;\n' +
      '  var goal=document.getElementById("f-goal").value.trim()||"alcanzar tus objetivos";\n' +
      '  /* COMPLETAR: animar score, poblar r-hero, r-cards, r-check usando name/a/b/goal */\n' +
      '  /* Animación: var n=0,max=87;var t=setInterval(function(){n++;document.getElementById("score-num").textContent=n;if(n>=max)clearInterval(t);},14); */\n' +
      '  /* Usar innerHTML para poblar r-hero, r-cards, r-check. El nombre debe aparecer 3+ veces. */\n' +
      '  /* Checklist localStorage clave: "chk_"+i. Restaurar con DOMContentLoaded. */\n' +
      '}\n\n' +
      '=== CSS (copiar exacto, ajustar --ac al acento del tema) ===\n' +
      ':root{--ac:#6c5ce7}\n' +
      'Elegir --ac según tema: ' + accentMap + '\n' +
      'body{background:#0a0a14;color:#e0dff5;font-family:system-ui,sans-serif;margin:0;padding:20px;max-width:680px;margin-left:auto;margin-right:auto}\n' +
      '.card{background:#1a1a35;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px;margin-bottom:14px}\n' +
      '.r-card{border-left:4px solid var(--ac)}\n' +
      'input,select,textarea{background:#0d0d20;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px;color:#e0dff5;width:100%;box-sizing:border-box;margin-top:6px;font-size:14px}\n' +
      'label{font-size:13px;color:#a09ab5;display:block;margin-top:14px}\n' +
      '.btn{width:100%;padding:14px;background:var(--ac);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-top:20px}\n' +
      '.progress{background:#1a1a35;border-radius:8px;height:8px;margin:10px 0}\n' +
      '.progress-bar{background:var(--ac);height:100%;border-radius:8px;transition:width .3s}\n' +
      '.score-big{font-size:72px;font-weight:900;color:var(--ac);line-height:1}\n' +
      'h1{margin:0 0 4px;font-size:22px} h2{margin:0 0 12px;font-size:18px} h3{margin:0 0 8px;font-size:15px;color:var(--ac)}\n' +
      'ul{margin:6px 0;padding-left:18px;line-height:1.7}\n\n' +
      '=== CONTENIDO A GENERAR (100% específico al ebook y al tema) ===\n' +
      'PANTALLA 1 (id="s1"):\n' +
      '- Título de la app (h1) + subtítulo en una línea dentro de .card\n' +
      '- 4 campos con los IDs exactos de arriba: f-name siempre para el nombre; f-a y f-b deben ser 100% específicos al tema (selects/números); f-goal es textarea\n' +
      '- <button class="btn" onclick="goToResults()">Texto del botón en ' + lang + '</button>\n\n' +
      'PANTALLA 2 (id="s2", display:none):\n' +
      '- id="r-hero": tarjeta héroe — mostrar nombre del usuario de forma destacada\n' +
      '- Tarjeta del score: <div class="score-big" id="score-num">0</div> + etiqueta del score en ' + lang + '\n' +
      '- id="r-cards": 3 divs .card.r-card con h3 + ul — contenido generado por generateResults()\n' +
      '- id="r-check": tarjeta checklist con 5 checkboxes + .progress + .progress-bar\n' +
      '- <button class="btn" onclick="window.print()">Imprimir</button>\n\n' +
      'Be concise. Every tag closed. All 10 mandatory IDs present. generateResults() must be complete.';

    var userMsg;
    if(ebookContext && !topic) {
      userMsg = 'Read this ebook data carefully. Design the PERFECT companion app for it — the one tool that, once the reader uses it, makes them say "I needed this exactly." The app must:\n' +
        '- Be 100% specific to this ebook\'s topic and target audience\n' +
        '- Ask for inputs that only make sense in THIS ebook\'s context\n' +
        '- Show results that directly apply the ebook\'s core concepts and advice\n' +
        '- Feel like the natural digital extension of the ebook\n\n' +
        'Ebook data:\n' + ebookContext +
        (context ? '\n\nAdditional requirements from author: ' + context : '');
    } else {
      userMsg = 'Create a premium interactive tool for: "' + topic + '"\n\n' +
        'The tool must feel purpose-built for this exact topic — not a generic template adapted to it. ' +
        'Every field, every result, every label must prove it was designed specifically for this use case.\n\n' +
        (ebookContext ? 'Related ebook context:\n' + ebookContext + '\n\n' : '') +
        (context ? 'Author requirements: ' + context : '');
    }

    var result = await claudeCall(sys, userMsg, 6500, true, 'claude-sonnet-4-6');
    var html = (result.text || result || '').trim();
    // Strip markdown fences (case-insensitive, any variant)
    html = html.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/i, '').trim();
    // Find start of HTML if there's preamble text
    var htmlLow = html.toLowerCase();
    if(!htmlLow.startsWith('<!doctype') && !htmlLow.startsWith('<html')) {
      var idx = htmlLow.indexOf('<!doctype');
      if(idx === -1) idx = htmlLow.indexOf('<html');
      if(idx > 0) html = html.slice(idx);
    }
    if(!html || html.length < 200) {
      return res.json({ success: false, error: 'La herramienta generada quedó vacía o incompleta. Intenta de nuevo.' });
    }
    // Validate mandatory IDs are present — if any missing, mark truncated so UI warns user
    var mandatoryIds = ['id="s1"','id="s2"','id="f-name"','id="f-a"','id="f-b"','id="f-goal"','id="score-num"'];
    var missingId = mandatoryIds.some(function(id){ return html.indexOf(id) === -1; });
    // Extract product name from <title> tag
    var titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    var productName = titleMatch ? titleMatch[1].trim() : '';
    res.json({ success: true, html: html, productName: productName, truncated: result.stopReason === 'max_tokens' || missingId });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/generate-skill', async function(req, res) {
  try {
    var topic   = req.body.topic   || '';
    var country = req.body.country || 'España';
    var lang    = req.body.lang    || 'Español';

    var countryName = getCountryName(country);

    var ebookContext = req.body.ebookContext || '';
    var context = req.body.context || '';

    var sys = 'You are a senior UX/UI designer and AI prompt engineer. You create premium, self-contained single-file HTML Skill Packs — editorial documents that look and feel like a paid digital product worth $47+.\n\n' +
      'ABSOLUTE RULES:\n' +
      '1. Output ONLY raw HTML starting with <!DOCTYPE html>. No preamble, no markdown fences.\n' +
      '2. ONE file — all CSS in <style>, all JS in <script>. You MAY use Google Fonts via <link rel="stylesheet">.\n' +
      '3. Every word in ' + lang + '. Market: ' + countryName + '.\n' +
      '4. VISUAL DESIGN — premium dark editorial:\n' +
      '   - Background: #0a0a16. Cards: #12122a, border 1px solid rgba(255,255,255,0.07).\n' +
      '   - Headings: Playfair Display (serif) — color #f0e6d3. Body: DM Sans — color #c8c4bc.\n' +
      '   - Accent: ONE color by topic (career=#6c5ce7, health=#00b894, finance=#f9ca24, marketing=#e17055).\n' +
      '   - [FIELD] placeholders: <span class="field">[FIELD]</span> with accent bg at 15% opacity.\n' +
      '5. REQUIRED STRUCTURE:\n' +
      '   a) Header: title (Playfair, large), subtitle, topic badge.\n' +
      '   b) SYSTEM PROMPT card: crown icon, full system prompt text, copy button.\n' +
      '   c) Exactly 5 ACTION PROMPT CARDS — collapsed by default, click header to expand/collapse.\n' +
      '      Each card shows: number + title + one-line tip (collapsed). Expanded: full prompt + copy button + Pro Tip.\n' +
      '   d) Footer: one-line usage note.\n' +
      '6. JAVASCRIPT — use this exact toggle pattern for every card:\n' +
      '   <div class="card" onclick="this.classList.toggle(\'open\')">\n' +
      '     <div class="card-header">...</div>\n' +
      '     <div class="card-body">...</div>\n' +
      '   </div>\n' +
      '   CSS: .card-body{display:none} .card.open .card-body{display:block}\n' +
      '   Copy button: event.stopPropagation(); copies text; shows "✓" for 2s.\n' +
      '7. CRITICAL — BE COMPLETE: finish every tag and every JS function. All 5 cards must be present.\n' +
      '8. Write compact code. Do NOT mention prices.';

    var userMsg;
    if(ebookContext && !topic) {
      userMsg = 'Analyze this ebook and create a premium HTML Skill Pack with 6-8 prompts that directly help readers apply and deepen the ebook\'s specific topic. Each prompt must be unique, expert-level, and topic-specific — not generic.\n\nEbook data:\n' + ebookContext +
        (context ? '\n\nUser requirements: ' + context : '');
    } else {
      userMsg = 'Create a premium HTML Skill Pack for: "' + topic + '"\n\n' +
        'Include 6-8 unique, expert-level prompts covering different aspects of this topic.\n\n' +
        (ebookContext ? 'Complements this ebook:\n' + ebookContext + '\n\n' : '') +
        (context ? 'Additional requirements: ' + context : '');
    }

    var result = await claudeCall(sys, userMsg, 7000, true, 'claude-sonnet-4-6');
    var html = (result.text || result || '').trim();
    html = html.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/i, '').trim();
    var htmlLow = html.toLowerCase();
    if(!htmlLow.startsWith('<!doctype') && !htmlLow.startsWith('<html')) {
      var idx = htmlLow.indexOf('<!doctype');
      if(idx === -1) idx = htmlLow.indexOf('<html');
      if(idx > 0) html = html.slice(idx);
    }
    if(!html || html.length < 200) {
      return res.json({ success: false, error: 'El Skill Pack generado quedó vacío. Intenta de nuevo.' });
    }
    var titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    var productName = titleMatch ? titleMatch[1].trim() : '';
    res.json({ success: true, html: html, productName: productName, truncated: result.stopReason === 'max_tokens' });
  } catch(err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('FERNI AI Pro running on port ' + PORT); });
module.exports = app;
