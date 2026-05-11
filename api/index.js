const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

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
  Canada: { legal: 'PIPEDA, CASL Anti-Spam, Consumer Protection Acts', healthDisclaimer: 'This guide is for informational purposes only.', guarantee: 'Satisfaction guarantee per provincial laws', dataProtection: 'Data protected under PIPEDA.', forbidden: 'No guaranteed health claims.', language: 'English', currency: 'CAD' }
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

function getRegs(country) { return REGS[country] || REGS.France; }

// Genera queries de busqueda inteligentes basadas en el pais, nicho e idioma
function buildSmartQueries(country, niche, language) {
  const isGeneral = !niche || niche.trim() === '' || niche === 'general' || niche === 'salud bienestar';
  const topic = isGeneral ? '' : niche;

  // Prefijos en el idioma del pais para buscar como busca la gente real
  const prefixes = {
    French: ['comment', 'comment faire', 'comment apprendre', 'guide pour', 'etapes pour', 'cours de', 'manuel de', 'idees de', 'problemes avec', 'erreurs de', 'meilleure facon de', 'debutant', 'depuis zero', 'pdf', 'tutoriel'],
    German: ['wie', 'wie macht man', 'wie lernt man', 'anleitung fuer', 'schritt fuer schritt', 'kurs fuer', 'handbuch fuer', 'ideen fuer', 'probleme mit', 'fehler bei', 'beste art zu', 'anfaenger', 'von null', 'pdf', 'ratgeber'],
    Italian: ['come', 'come fare', 'come imparare', 'guida per', 'passo dopo passo', 'corso di', 'manuale di', 'idee per', 'problemi con', 'errori nel', 'modo migliore per', 'principianti', 'da zero', 'pdf', 'tutorial'],
    Spanish: ['como', 'como hacer', 'como aprender', 'guia para', 'paso a paso', 'curso de', 'manual de', 'ideas de', 'problemas con', 'errores al', 'mejor forma de', 'principiantes', 'desde cero', 'pdf', 'plantilla'],
    Portuguese: ['como', 'como fazer', 'como aprender', 'guia para', 'passo a passo', 'curso de', 'manual de', 'ideias de', 'problemas com', 'erros ao', 'melhor forma de', 'iniciantes', 'do zero', 'pdf', 'tutorial'],
    English: ['how to', 'how to make', 'how to learn', 'guide for', 'step by step', 'course for', 'manual for', 'ideas for', 'problems with', 'mistakes when', 'best way to', 'beginners', 'from scratch', 'pdf', 'template'],
    Dutch: ['hoe', 'hoe maak je', 'hoe leer je', 'gids voor', 'stap voor stap', 'cursus voor', 'handleiding voor', 'ideeen voor', 'problemen met', 'fouten bij', 'beste manier om', 'beginners', 'van nul', 'pdf', 'sjabloon'],
    Swedish: ['hur', 'hur man gor', 'hur man larer sig', 'guide for', 'steg for steg', 'kurs i', 'handbok for', 'ideer for', 'problem med', 'misstag nar', 'basta sattet att', 'nyborjare', 'fran noll', 'pdf', 'mall'],
    Polish: ['jak', 'jak zrobic', 'jak nauczyc sie', 'przewodnik po', 'krok po kroku', 'kurs', 'poradnik', 'pomysly na', 'problemy z', 'bledy przy', 'najlepszy sposob', 'dla poczatkujacych', 'od zera', 'pdf', 'szablon']
  };

  const lang = language || 'French';
  const pfx = prefixes[lang] || prefixes['English'];
  const queries = [];

  if (topic) {
    // Con nicho especifico - busca como busca la gente real en su idioma
    pfx.slice(0, 10).forEach(function(p) {
      queries.push(p + ' ' + topic + ' ' + country);
    });
    // Busquedas en foros y plataformas
    queries.push(topic + ' forum ' + country + ' aide aide');
    queries.push(topic + ' reddit ' + country);
    queries.push('amazon bestseller ' + topic + ' ' + country);
    queries.push(topic + ' youtube ' + country + ' tutoriel');
    queries.push(topic + ' questions frequentes ' + country);
    queries.push(topic + ' debutant ' + country + ' conseil');
  } else {
    // Modo general - busca tendencias de alta demanda en el pais
    const generalQueries = {
      French: [
        'tendances numeriques France 2024 quoi apprendre',
        'site:doctissimo.fr probleme courant solution',
        'site:aufeminin.com conseil pratique quotidien',
        'comment resoudre probleme courant France forum',
        'quoi apprendre en ligne France 2024',
        'ebook pdf guide pratique France populaire',
        'amazon.fr bestseller guides pratiques 2024',
        'reddit france probleme solution aide',
        'formation en ligne France tendance 2024',
        'tutoriel populaire France youtube 2024',
        'guide pratique France populaire blog',
        'cours en ligne populaire France 2024'
      ],
      German: [
        'Trends Deutschland 2024 online lernen',
        'site:gutefrage.net Problem Loesung',
        'amazon.de Bestseller Ratgeber 2024',
        'reddit Deutschland Problem Hilfe Loesung',
        'Online Kurs Deutschland Trend 2024',
        'Anleitung Deutschland populaer Blog',
        'Handbuch Deutschland populaer 2024'
      ],
      English: [
        'most searched how to guides USA 2024',
        'amazon bestseller practical guides 2024',
        'reddit most helpful guides 2024',
        'youtube most viewed tutorial USA 2024',
        'trending online courses USA 2024',
        'most popular ebooks USA practical 2024',
        'site:quora.com most asked questions 2024'
      ],
      Italian: [
        'tendenze digitali Italia 2024 cosa imparare',
        'amazon.it bestseller guide pratiche 2024',
        'reddit italia problema soluzione aiuto',
        'youtube tutorial piu visti Italia 2024',
        'corso online popolare Italia 2024'
      ],
      Spanish: [
        'tendencias digitales Espana 2024 que aprender',
        'amazon.es bestseller guias practicas 2024',
        'reddit Espana problema solucion ayuda',
        'youtube tutorial mas vistos Espana 2024',
        'curso online popular Espana 2024'
      ]
    };
    const gq = generalQueries[lang] || generalQueries['English'];
    gq.forEach(function(q) { queries.push(q); });
  }

  return queries.slice(0, 12);
}

async function claudeCall(system, userContent, maxTokens) {
  maxTokens = maxTokens || 4000;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: maxTokens, system: system, messages: [{ role: 'user', content: userContent }] })
  });
  const d = await resp.json();
  return d.content.map(function(c) { return c.text || ''; }).join('');
}

async function serperSearch(query) {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 8 })
    });
    if (r.ok) {
      const d = await r.json();
      var results = (d.organic || []).map(function(x) {
        return { title: x.title, snippet: x.snippet, url: x.link, query: query };
      });
      // Agregar "People Also Ask" si existe
      if (d.peopleAlsoAsk) {
        d.peopleAlsoAsk.forEach(function(paa) {
          results.push({ title: paa.question, snippet: paa.snippet || paa.question, url: paa.link || '', query: 'People Also Ask: ' + query });
        });
      }
      return results;
    }
  } catch (e) {}
  return [];
}

async function searchWithSerper(country, niche, language) {
  const queries = buildSmartQueries(country, niche, language);
  const allResults = [];
  for (var i = 0; i < queries.length; i++) {
    var results = await serperSearch(queries[i]);
    results.forEach(function(r) { allResults.push(r); });
  }
  return allResults;
}

async function analyzeWithGPT4(results, country, niche, language) {
  const pop = POPULATION[country] || '50 millones total, 40 millones adultos';
  const isGeneral = !niche || niche === 'general' || niche === 'salud bienestar';

  const sys = 'Eres un motor de investigacion de demanda digital especializado en detectar oportunidades de productos digitales vendibles.' +
    ' Pais: ' + country + ' (poblacion: ' + pop + '). Idioma del pais: ' + language + '.' +
    ' IMPORTANTE: Responde TODO en ESPANOL excepto los campos que deben estar en ' + language + '.' +
    '\n\nTu tarea es analizar los resultados de busqueda reales y detectar que necesitan APRENDER, RESOLVER, MEJORAR, FABRICAR, REPARAR, ORGANIZAR, CUIDAR, VENDER, CREAR o ENTENDER las personas de ' + country + (isGeneral ? ' en cualquier tema' : ' sobre el tema: ' + niche) + '.' +
    '\n\nNO te limites solo a problemas emocionales o de salud. Detecta tambien:' +
    ' intereses de alta demanda, aprendizajes practicos, habilidades, manualidades, oficios, hogar, cocina, plantas, mascotas, tecnologia, negocios, belleza, crianza, finanzas, productividad, deportes, arte, construccion, reparaciones, costura, jardineria, o cualquier tema que pueda convertirse en un PDF, ebook, guia, checklist, plantilla o mini curso digital.' +
    '\n\nPara considerar una oportunidad VALIDA debe cumplir al menos 3 de estas señales:' +
    ' muchas personas preguntan lo mismo, aparece en varias fuentes distintas, hay videos con muchas visualizaciones, hay cursos o ebooks vendiendose, hay preguntas repetidas en foros o Reddit, hay busquedas tipo como hacer guia paso a paso, hay comentarios pidiendo ayuda, hay productos similares en Amazon Hotmart Udemy.' +
    '\n\nREGLAS IMPORTANTES:' +
    ' No entregues ideas inventadas sin señales de demanda.' +
    ' No confundas curiosidad con intencion de compra.' +
    ' Prioriza temas donde la gente quiera una solucion clara rapida y ordenada que pueda venderse como producto digital.' +
    ' Si hay mucha demanda y poca oferta clara es una OPORTUNIDAD FUERTE.' +
    '\n\nDevuelve SOLO un JSON array valido con 6 oportunidades ordenadas por scoreMonetizacion descendente.' +
    ' scoreMonetizacion: urgencia del tema (0-25) + volumen estimado (0-25) + intencion de compra (0-25) + baja competencia o nicho claro (0-25).' +
    '\n\nCada oportunidad DEBE tener TODOS estos campos:' +
    ' problema (en espanol - puede ser problema deseo habilidad o interes),' +
    ' problemaEnIdioma (en ' + language + '),' +
    ' busquedaExacta (frase exacta como busca la gente en ' + language + '),' +
    ' necesidad (que quiere lograr la gente en espanol),' +
    ' tipoDemanda (problema / aprendizaje / deseo / habilidad / oficio / manualidad / salud / negocio / crianza / hogar / belleza / tecnologia / otro),' +
    ' emocion (emocion o motivacion principal),' +
    ' intencionCompra (alta/media/baja),' +
    ' rangoEdad,' +
    ' genero,' +
    ' distribucionGenero (con porcentajes estimados),' +
    ' claseSocial,' +
    ' pais,' +
    ' idioma,' +
    ' volumenBusqueda (alto/medio/bajo),' +
    ' volumenEstimado (numero mensual estimado para ' + country + '),' +
    ' tendencia (creciendo/estable/bajando),' +
    ' competencia (alta/media/baja),' +
    ' nivelCompetenciaDetalle,' +
    ' oportunidadMonetizacion,' +
    ' tipoProductoDigital (PDF / ebook / guia / checklist / plantilla / mini curso / pack),' +
    ' tituloEbook (titulo comercial atractivo en espanol),' +
    ' promesaEbook (que lograra el lector),' +
    ' precioHotmart (precio realista en ' + (REGS[country] ? REGS[country].currency : 'EUR') + '),' +
    ' scoreMonetizacion (1-100),' +
    ' urlFuente,' +
    ' keyword (en ' + language + '),' +
    ' keywordES (en espanol),' +
    ' dolorODeseo (dolor o deseo principal en espanol),' +
    ' urgencia (alta/media/baja),' +
    ' prioridad (ALTA/MEDIA/BAJA),' +
    ' porQueEstaOportunidad (evidencia de los resultados de busqueda),' +
    ' recomendacion (CREAR / VALIDAR MAS / DESCARTAR),' +
    ' fuentesConsultadas (array de fuentes donde se detecto),' +
    ' datosDetallados (objeto con busquedasPorGenero, busquedasPorEdad, busquedasPorClase, keywordsEncontradas array en ' + language + ', competidoresDetectados, precioPromedioMercado, tendenciaMensual, plataformasDetectadas, señalesDeValidas array).';

  const userMsg = 'Pais: ' + country + ' (poblacion: ' + pop + ')\n' +
    'Nicho o tema: ' + (niche || 'general - detecta los temas con mayor demanda') + '\n' +
    'Idioma del pais: ' + language + '\n\n' +
    'Resultados reales de busquedas en Google, foros, Amazon, Reddit y otras plataformas:\n' +
    results.slice(0, 35).map(function(r) {
      return 'FUENTE: ' + r.query + '\nTITULO: ' + r.title + '\nCONTENIDO: ' + r.snippet + '\nURL: ' + r.url;
    }).join('\n---\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
      temperature: 0.3,
      max_tokens: 6000
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
    var serperResults = await searchWithSerper(country, niche, language);
    var opportunities = await analyzeWithGPT4(serperResults, country, niche, language);
    res.json({ success: true, opportunities: opportunities, searchCount: serperResults.length });
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

app.post('/api/generate-ebook', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var year = new Date().getFullYear();

  var ctx = 'TEMA: ' + (o.problema || o.problem || '') +
    ' NECESIDAD: ' + (o.necesidad || o.need || '') +
    ' TIPO DE DEMANDA: ' + (o.tipoDemanda || 'aprendizaje') +
    ' PUBLICO: ' + (o.rangoEdad || o.ageRange || '') + ' ' + (o.genero || o.gender || '') + ' ' + countryName +
    ' TITULO: ' + (o.tituloEbook || o.ebookTitle || '') +
    ' PROMESA: ' + (o.promesaEbook || o.ebookPromise || '') +
    ' EMOCION O MOTIVACION: ' + (o.emocion || o.emotion || '') +
    ' DOLOR O DESEO: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain || '') +
    ' AUTOR: ' + author + ' PAIS: ' + countryName +
    ' REGULACIONES: ' + regs.legal + ' PROHIBIDO: ' + regs.forbidden;

  var baseSys = 'Eres escritor profesional de bestsellers practicos para Europa y USA. Escribes en espanol.' +
    ' El contenido puede ser de cualquier tipo: salud, hogar, manualidades, negocios, tecnologia, crianza, cocina, jardineria, finanzas, etc.' +
    ' Contenido especifico emocional accionable nunca generico.' +
    ' Tono empatico practico y motivador.' +
    ' REGULACIONES ' + countryName + ': ' + regs.legal +
    ' PROHIBIDO: ' + regs.forbidden +
    ' Disclaimer: ' + regs.healthDisclaimer;

  try {
    var p1 = JSON.parse((await claudeCall(baseSys,
      ctx + ' Escribe PARTE 1 del ebook. Devuelve SOLO JSON valido sin texto adicional: {"title":"titulo","subtitle":"subtitulo","tagline":"tagline corto","intro":"introduccion 400 palabras minimo","chapter1":{"number":1,"title":"titulo cap 1","opening":"apertura 120 palabras","content":"contenido 400 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"ejercicio","description":"descripcion","steps":["s1","s2","s3","s4","s5"]}},"chapter2":{"number":2,"title":"titulo cap 2","opening":"apertura 120 palabras","content":"contenido 400 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"ejercicio","description":"descripcion","steps":["s1","s2","s3","s4","s5"]}}}',
      6000)).replace(/```json|```/g, '').trim());

    var p2 = JSON.parse((await claudeCall(baseSys,
      ctx + ' Escribe PARTE 2 del ebook. Devuelve SOLO JSON valido sin texto adicional: {"chapter3":{"number":3,"title":"titulo cap 3","opening":"apertura 120 palabras","content":"contenido 400 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"ejercicio","description":"descripcion","steps":["s1","s2","s3","s4","s5"]}},"chapter4":{"number":4,"title":"titulo cap 4","opening":"apertura 120 palabras","content":"contenido 400 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"ejercicio","description":"descripcion","steps":["s1","s2","s3","s4","s5"]}}}',
      6000)).replace(/```json|```/g, '').trim());

    var p3 = JSON.parse((await claudeCall(baseSys,
      ctx + ' Escribe PARTE 3 del ebook. Devuelve SOLO JSON valido sin texto adicional: {"conclusion":"conclusion motivadora 250 palabras","actionPlan":["accion para hoy","accion esta semana","accion este mes"],"authorNote":"nota personal 100 palabras firmada por ' + author + '","resources":["recurso especifico 1","recurso 2","recurso 3","recurso 4"],"legalSection":{"healthDisclaimer":"' + regs.healthDisclaimer + '","guarantee":"' + regs.guarantee + '","dataProtection":"' + regs.dataProtection + '","copyright":"Copyright ' + year + ' ' + author + '. Todos los derechos reservados."}}',
      3000)).replace(/```json|```/g, '').trim());

    res.json({ success: true, ebook: { title: p1.title, subtitle: p1.subtitle, tagline: p1.tagline, intro: p1.intro, chapters: [p1.chapter1, p1.chapter2, p2.chapter3, p2.chapter4], conclusion: p3.conclusion, actionPlan: p3.actionPlan, authorNote: p3.authorNote, resources: p3.resources, legalSection: p3.legalSection } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/translate-ebook', async function(req, res) {
  var ebook = req.body.ebook;
  var language = req.body.language;
  var country = req.body.country;
  var author = req.body.author;
  var regs = getRegs(country);
  var sys = 'Traductor literario experto en ' + language + ' para ' + country + '. Traduce espanol a ' + language + ' de manera completamente nativa. Adapta culturalmente cada frase. El lector NO debe saber que fue traducido. Mantener nombre ' + author + ' sin cambios. Regulaciones de ' + country + ': ' + regs.legal + '. Devuelve SOLO JSON con misma estructura. Sin markdown.';
  try {
    var t1 = JSON.parse((await claudeCall(sys, JSON.stringify({ title: ebook.title, subtitle: ebook.subtitle, tagline: ebook.tagline, intro: ebook.intro, chapter1: ebook.chapters[0], chapter2: ebook.chapters[1] }), 6000)).replace(/```json|```/g, '').trim());
    var t2 = JSON.parse((await claudeCall(sys, JSON.stringify({ chapter3: ebook.chapters[2], chapter4: ebook.chapters[3], conclusion: ebook.conclusion, actionPlan: ebook.actionPlan, authorNote: ebook.authorNote, resources: ebook.resources, legalSection: ebook.legalSection }), 6000)).replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook: { title: t1.title, subtitle: t1.subtitle, tagline: t1.tagline, intro: t1.intro, chapters: [t1.chapter1, t1.chapter2, t2.chapter3, t2.chapter4], conclusion: t2.conclusion, actionPlan: t2.actionPlan, authorNote: t2.authorNote, resources: t2.resources, legalSection: t2.legalSection } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-image', async function(req, res) {
  try {
    var resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({ model: 'dall-e-3', prompt: req.body.prompt + '. Professional commercial quality. No text. No watermarks. No faces.', n: 1, size: '1024x1024', quality: 'hd', style: 'natural' })
    });
    var d = await resp.json();
    if (d.data && d.data[0]) res.json({ success: true, url: d.data[0].url });
    else res.status(500).json({ success: false, error: 'No image generated' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-hotmart', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var language = req.body.language;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  try {
    var sys = 'Copywriter experto en ventas de productos digitales en Hotmart para Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. Garantia: ' + regs.guarantee + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: productName, headline, subheadline, shortDesc, longDesc, benefits array 6, bullets array 6, salesPageTitle, salesPageBody, guarantee, bonus array 3, upsell, orderBump, category, cta, facebookPost, instagramCaption, instagramStory, emailSubject, emailBody.';
    var userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Promesa: ' + (o.promesaEbook || o.ebookPromise) + ' Tema: ' + (o.problema || o.problem) + ' Tipo: ' + (o.tipoDemanda || 'aprendizaje') + ' Publico: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) + ' ' + countryName + ' Precio: ' + (o.precioHotmart || o.hotmartPrice) + ' Autor: ' + author + ' Motivacion: ' + (o.emocion || o.emotion) + ' Deseo o dolor: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain);
    var txt = await claudeCall(sys, userMsg, 4000);
    res.json({ success: true, kit: JSON.parse(txt.replace(/```json|```/g, '').trim()) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async function(req, res) {
  var o = req.body.opportunity;
  var language = req.body.language;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  try {
    var sys = 'Estratega experto en Meta Ads para productos digitales en Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: segmentation con age gender interests array 6 behaviors array 4 painPoints array 5 excludeAudiences array 3 lookalike budget. ads array 5 con angle platform format headline primaryText description cta dallePrompt en ingles sin texto ni caras targetEmotion. landingPage con headline subheadline body socialProof cta urgency. retargeting con headline copy cta offer. emailSequence array 3 con subject y body. 5 anuncios con angulos: problema urgencia aspiracion curiosidad autoridad.';
    var userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Tema: ' + (o.problema || o.problem) + ' Tipo demanda: ' + (o.tipoDemanda || 'aprendizaje') + ' Publico: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) + ' ' + countryName + ' Motivacion: ' + (o.emocion || o.emotion) + ' Deseo o dolor: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain) + ' Precio: ' + (o.precioHotmart || o.hotmartPrice);
    var txt = await claudeCall(sys, userMsg, 5000);
    res.json({ success: true, kit: JSON.parse(txt.replace(/```json|```/g, '').trim()) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('FERNI AI Pro running on port ' + PORT); });
module.exports = app;
