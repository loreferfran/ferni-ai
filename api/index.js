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

// Busqueda Google Trends via Serper
async function serperTrends(keyword, country) {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword + ' tendencias 2025 ' + country, num: 5, tbs: 'qdr:m' })
    });
    if (r.ok) {
      const d = await r.json();
      return (d.organic || []).slice(0, 4).map(function(x) {
        return { title: x.title, snippet: x.snippet, url: x.link, source: 'trends', query: 'TRENDS: ' + keyword };
      });
    }
  } catch (e) {}
  return [];
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

  // 2. Google Trends (ultimos 30 dias)
  var trendsQueries = [topic + ' ' + country, topic + ' tendencia 2025'];
  for (var i = 0; i < trendsQueries.length; i++) {
    var tr = await serperTrends(trendsQueries[i], country);
    tr.forEach(function(x) { allResults.push(x); });
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

  // Separar resultados por fuente para dar contexto mas rico a GPT-4o
  var googleResults = results.filter(function(r){ return r.source === 'google' || r.source === 'people_also_ask' || r.source === 'related_search'; });
  var redditResults = results.filter(function(r){ return r.source === 'reddit'; });
  var youtubeResults = results.filter(function(r){ return r.source === 'youtube'; });
  var amazonResults = results.filter(function(r){ return r.source === 'amazon'; });
  var trendsResults = results.filter(function(r){ return r.source === 'trends'; });

  var userMsg = 'PAIS: ' + country + ' (poblacion: ' + pop + ')\n' +
    'NICHO: ' + (niche || 'general') + '\n' +
    'IDIOMA: ' + language + '\n\n';

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

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
      temperature: 0.2,
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

function buildEbookSystem(countryName, regs) {
  return 'Eres simultaneamente: el mejor experto mundial en el tema solicitado + escritor bestseller + pedagogo excepcional.' +
    ' Tu mision es escribir en espanol un ebook que resuelva el problema del lector COMPLETAMENTE.' +
    ' PAIS DESTINO: ' + countryName + '.' +
    ' USA TU INTELIGENCIA Y CONOCIMIENTO REAL sobre el tema:' +
    ' - Si el tema es jardineria: aplica conocimiento real de botanica, medidas exactas, tipos de suelo, plantas compatibles, ciclos de crecimiento.' +
    ' - Si el tema es salud/bienestar: aplica conocimiento medico real, remedios probados, mecanismos fisiologicos explicados simplemente.' +
    ' - Si el tema es finanzas: aplica calculos reales, tasas, estrategias probadas con ejemplos numericos concretos.' +
    ' - Si el tema es crianza: aplica psicologia del desarrollo real, edades especificas, tecnicas con nombres y origen.' +
    ' - Cualquier tema: aplica el conocimiento experto real que tienes sobre ese campo.' +
    ' REGLAS DE ORO:' +
    ' 1. ESPECIFICIDAD TOTAL: numeros reales, medidas exactas, estadisticas, porcentajes, nombres cientificos cuando aplique.' +
    '    MAL: "planta en un espacio adecuado".' +
    '    BIEN: "en 4m² puedes plantar 12 lechugas (30cm entre plantas), 6 tomates cherry (50cm entre plantas) y un borde de albahaca (20cm). Rinde aprox. 8kg de vegetales al mes."' +
    ' 2. SOLUCION COMPLETA: el lector no necesita buscar mas informacion despues de leer. Todo esta aqui.' +
    ' 3. PROGRESION NARRATIVA: cap 1=diagnstico/comprension del problema, caps 2-3=herramientas y metodos, cap 4=implementacion paso a paso.' +
    ' 4. TONO: experto amigable — como un amigo que sabe mucho y te lo explica con calidez y precision.' +
    ' 5. EJERCICIOS REALES: cada ejercicio produce un resultado tangible y verificable al terminarlo.' +
    ' 6. CONTEXTO LOCAL: adapta ejemplos, marcas, lugares y situaciones tipicas de ' + countryName + '.' +
    ' 7. DATOS CON FUENTE IMPLICITA: "Segun estudios de la Universidad X", "Los jardineros profesionales recomiendan", "La OMS indica".' +
    ' PROHIBIDO: ' + regs.forbidden +
    ' PROHIBIDO ABSOLUTO:' +
    ' (1) Vaguedad, relleno, generalidades, repeticion disfrazada, consejos obvios.' +
    ' (2) Frases autorreferentes inventadas: "He disenado 40 jardines", "En mis anos de experiencia", "Mis clientes me dicen", "Yo personalmente..." — NUNCA.' +
    ' (3) Primera persona singular (yo, mi, mis, me). SIEMPRE usar voz experta impersonal.' +
    ' VOZ CORRECTA: "Los paisajistas profesionales recomiendan...", "Los estudios demuestran...", "La tecnica X consiste en...", "El metodo mas efectivo es...", "Los expertos coinciden en...".' +
    ' La autoridad viene del CONOCIMIENTO, no de experiencias personales inventadas.' +
    ' EDITORIAL: Ferni Guides — nunca escribas como si fuera una persona individual.';
}

function buildEbookContext(o, author, countryName, regs) {
  return 'PROBLEMA QUE RESUELVE ESTE EBOOK: ' + (o.problema || o.problem || '') +
    '\nNECESIDAD ESPECIFICA DEL LECTOR: ' + (o.necesidad || o.need || '') +
    '\nTIPO: ' + (o.tipoDemanda || 'aprendizaje') +
    '\nPUBLICO: ' + (o.rangoEdad || o.ageRange || '') + ', ' + (o.genero || o.gender || '') + ', vive en ' + countryName +
    '\nTITULO: ' + (o.tituloEbook || o.ebookTitle || '') +
    '\nPROMESA AL LECTOR: ' + (o.promesaEbook || o.ebookPromise || '') +
    '\nEMOCION QUE SIENTE EL LECTOR AHORA: ' + (o.emocion || o.emotion || '') +
    '\nDOLOR O DESEO PROFUNDO: ' + (o.dolorODeseo || o.dolorEmocional || o.emotionalPain || '') +
    '\nASI BUSCA SOLUCIONES EN GOOGLE: "' + (o.busquedaExacta || o.keyword || '') + '"' +
    '\nPRECIO QUE PAGARA: ' + (o.precioHotmart || o.hotmartPrice || '') +
    '\nEDITORIAL: Ferni Guides (voz experta impersonal, NUNCA primera persona singular ni experiencias personales inventadas)' +
    '\nPAIS: ' + countryName +
    '\n\nMISION CRITICA: Esta persona pago ' + (o.precioHotmart || o.hotmartPrice || 'dinero real') + ' por este ebook.' +
    ' Tiene exactamente este problema: "' + (o.dolorODeseo || o.problema || o.problem || '') + '".' +
    ' Al terminar de leer DEBE poder resolver ese problema completamente.' +
    ' USA TU CONOCIMIENTO EXPERTO REAL sobre "' + (o.problema || o.problem || '') + '" para dar:' +
    ' medidas exactas, pasos concretos con numeros, ejemplos reales de ' + countryName + ', resultados verificables.' +
    ' CADA CAPITULO debe incluir: minimo 3 datos especificos (numeros, medidas, estadisticas), 1 ejemplo tipico de ' + countryName + ', pasos que se ejecutan hoy mismo.' +
    ' El lector debe quedar ENCANTADO y sentir que pago poco por tanta informacion de calidad.' +' RECUERDA: escribe en nombre de Ferni Guides — voz de experto impersonal, nunca primera persona singular.';
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
  // Intento 5: reparar JSON truncado agregando cierre
  if (start !== -1) {
    var partial = txt.slice(start);
    // Contar llaves abiertas y cerrar las que faltan
    var opens = (partial.match(/{/g)||[]).length;
    var closes = (partial.match(/}/g)||[]).length;
    var missing = opens - closes;
    if (missing > 0) {
      var repaired = partial + '}'.repeat(missing);
      try { return JSON.parse(repaired); } catch(e) {}
    }
  }
  throw new Error('No valid JSON in Claude response. Preview: ' + txt.slice(0, 300));
}

// Endpoint separado para cada parte - evita timeout de Vercel
app.post('/api/generate-ebook-p1', async function(req, res) {
  var o = req.body.opportunity;
  var author = req.body.author;
  var countryName = getCountryName(o.pais || o.country || 'France');
  var regs = getRegs(countryName);
  var ctx = buildEbookContext(o, author, countryName, regs);
  var sys = buildEbookSystem(countryName, regs);
  try {
    var schema = JSON.stringify({title:'titulo impactante max 10 palabras',subtitle:'subtitulo vendedor max 12 palabras',tagline:'tagline max 8 palabras',intro:'introduccion emotiva MAX 150 palabras - gancho emocional + promesa + que lograra el lector',chapter1:{number:1,title:'titulo max 8 palabras',opening:'apertura MAX 60 palabras - frase impactante que engancha',content:'contenido practico MAX 200 palabras - datos especificos numeros medidas pasos concretos',keyPoints:['punto clave especifico con dato','punto clave especifico con dato','punto clave especifico con dato'],exercise:{title:'nombre del ejercicio',description:'descripcion MAX 50 palabras',steps:['paso 1 concreto','paso 2 concreto','paso 3 concreto']}},chapter2:{number:2,title:'titulo max 8 palabras',opening:'apertura MAX 60 palabras',content:'contenido MAX 200 palabras con datos especificos',keyPoints:['punto especifico','punto especifico','punto especifico'],exercise:{title:'nombre',description:'MAX 50 palabras',steps:['paso 1','paso 2','paso 3']}}});
    var txt = await claudeCall(sys, ctx + '\n\nEscribe PARTE 1 del ebook. Responde SOLO con JSON valido (sin texto previo, sin markdown):\n' + schema, 5000);
    var p1 = extractJSON(txt);
    res.json({ success: true, part: p1 });
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
    var schema = JSON.stringify({chapter3:{number:3,title:'titulo max 8 palabras',opening:'apertura MAX 60 palabras',content:'contenido MAX 200 palabras con datos especificos numeros pasos',keyPoints:['punto especifico con dato','punto especifico con dato','punto especifico con dato'],exercise:{title:'nombre ejercicio',description:'MAX 50 palabras',steps:['paso 1 concreto','paso 2 concreto','paso 3 concreto']}},chapter4:{number:4,title:'titulo max 8 palabras - capitulo resultado final',opening:'apertura MAX 60 palabras - vision del resultado logrado',content:'contenido MAX 200 palabras - como queda el resultado final con datos concretos',keyPoints:['logro especifico con dato','logro especifico con dato','logro especifico con dato'],exercise:{title:'ejercicio final de consolidacion',description:'MAX 50 palabras',steps:['paso 1','paso 2','paso 3']}}});
    var txt = await claudeCall(sys, ctx + '\n\nEscribe PARTE 2 del ebook. Responde SOLO con JSON valido (sin texto previo, sin markdown):\n' + schema, 5000);
    var p2 = extractJSON(txt);
    res.json({ success: true, part: p2 });
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
    var schema = JSON.stringify({conclusion:'conclusion motivadora MAXIMO 100 palabras',actionPlan:['accion concreta 1','accion concreta 2','accion concreta 3'],authorNote:'nota personal MAXIMO 50 palabras autor '+author,resources:['recurso 1','recurso 2','recurso 3'],legalSection:{healthDisclaimer:'Aviso salud '+countryName,guarantee:'Garantia '+countryName,dataProtection:'Datos '+countryName,copyright:'Copyright '+year+' '+author}});
    var txt = await claudeCall(sys, ctx + '\n\nEscribe PARTE 3 del ebook. IMPORTANTE: respuestas CORTAS, MAXIMO 100 palabras por campo. Responde SOLO con JSON valido sin texto previo ni markdown:\n' + schema, 1500);
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
  var sys = 'Eres traductor literario nativo de ' + language + ' especializado en contenido practico para ' + country + '.' +
    ' REGLAS: 1. Traduce al ' + language + ' mas natural posible, el lector debe sentir que fue escrito originalmente en ese idioma.' +
    ' 2. CONSERVA TODOS LOS DATOS NUMERICOS EXACTOS: medidas, estadisticas, porcentajes, dimensiones.' +
    ' 3. ADAPTA referencias culturales a ' + country + ' cuando sea posible.' +
    ' 4. Nombre del autor: ' + author + ' — NO traducir.' +
    ' 5. Regulaciones: ' + regs.legal +
    ' 6. Devuelve SOLO JSON con exactamente la misma estructura. Sin markdown. Sin texto extra.';
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



app.post('/api/plan-images', async function(req, res) {
  var ebook = req.body.ebook;
  var opportunity = req.body.opportunity;
  var o = opportunity;
  var countryName = getCountryName(o.pais || o.country || 'France');

  var sys = 'Eres un director de arte experto en ebooks digitales profesionales para vender en Hotmart.' +
    ' Tu trabajo es decidir exactamente cuantas imagenes necesita este ebook y que debe mostrar cada una para hacerlo visualmente atractivo y vendible.' +
    ' Analiza el tema del ebook y decide de manera inteligente:' +
    ' - Ebooks de jardineria, decoracion, cocina, manualidades, construccion, belleza: necesitan MUCHAS imagenes (6-10)' +
    ' - Ebooks de salud, fitness, crianza, hogar practico: necesitan imagenes MODERADAS (4-6)' +
    ' - Ebooks de finanzas, productividad, negocios, desarrollo personal: necesitan POCAS imagenes (2-4)' +
    ' Devuelve SOLO JSON valido con esta estructura:' +
    ' {' +
    '   "totalImages": numero total de imagenes,' +
    '   "coverPrompt": "prompt detallado en ingles para la portada - debe ser una imagen impactante y profesional sin texto",' +
    '   "images": [' +
    '     {' +
    '       "location": "intro/chapter1/chapter1_extra/chapter2/etc",' +
    '       "purpose": "que muestra esta imagen y por que es necesaria",' +
    '       "prompt": "prompt detallado en ingles para DALL-E 3 - muy especifico, describe composicion colores estilo - sin texto sin caras identificables sin marcas"' +
    '     }' +
    '   ]' +
    ' }';

  var userMsg = 'Tema: ' + (o.problema || o.problem || '') + ' Titulo: ' + (ebook.title || '') + ' Tipo: ' + (o.tipoDemanda || 'aprendizaje') + ' Pais: ' + countryName + ' Capitulos: ' + (ebook.chapters || []).map(function(ch, i2) { return (i2+1) + '. ' + (ch.title || ''); }).join(', ') + ' Genera prompts perfectos para DALL-E 3.';

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

    return '<div style="page-break-before:always;">' +
      '<div style="background:' + color + ';color:white;padding:30px 40px;margin-bottom:0;">' +
        '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;margin-bottom:8px;">Chapitre ' + (i+1) + ' / Chapter ' + (i+1) + '</div>' +
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
      '<div style="font-family:Playfair Display,serif;font-size:32px;font-weight:700;color:#2d3180;margin-bottom:8px;">Table des matières</div>' +
      '<div style="font-size:13px;color:#6c5ce7;letter-spacing:2px;text-transform:uppercase;margin-bottom:40px;">Contents</div>' +
      '<div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">' +
        '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee;font-style:italic;color:#636e72;font-size:14px;"><span>Introduction</span></div>' +
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
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6c5ce7;margin-bottom:12px;">Introduction</div>' +
      '<div style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#2d3180;margin-bottom:32px;line-height:1.3;">Pourquoi ce guide peut changer votre situation</div>' +
      '<div style="font-size:14px;line-height:1.9;color:#2d3436;">' + (ebook.intro || '').replace(/\n/g,'<br><br>') + '</div>' +
    '</div>' +

    // CHAPTERS
    chaptersHtml +

    // CONCLUSION
    '<div style="page-break-before:always;padding:60px 40px;background:linear-gradient(135deg,#f3f0ff,#f0fff8);">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6c5ce7;margin-bottom:12px;">Conclusion</div>' +
      '<div style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#2d3180;margin-bottom:32px;">Votre transformation commence aujourd’hui</div>' +
      '<div style="font-size:14px;line-height:1.9;color:#2d3436;margin-bottom:32px;">' + (ebook.conclusion || '').replace(/\n/g,'<br><br>') + '</div>' +
      '<div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);margin-bottom:24px;">' +
        '<div style="font-size:13px;font-weight:700;color:#6c5ce7;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Plan d’action / Action Plan</div>' +
        actionPlanHtml +
      '</div>' +
      (resourcesHtml ? '<div style="background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">' +
        '<div style="font-size:13px;font-weight:700;color:#00b894;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Ressources / Resources</div>' +
        resourcesHtml +
      '</div>' : '') +
    '</div>' +

    // AUTHOR NOTE
    (ebook.authorNote ? '<div style="page-break-before:always;padding:60px 40px;background:#2d3180;color:white;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:12px;">Note de l’auteur</div>' +
      '<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;margin-bottom:24px;">' + author + '</div>' +
      '<div style="font-size:14px;line-height:1.9;color:rgba(255,255,255,0.85);">' + ebook.authorNote + '</div>' +
    '</div>' : '') +

    // LEGAL
    '<div style="padding:40px;background:#f8f9fa;border-top:1px solid #eee;">' +
      '<div style="font-size:11px;color:#636e72;line-height:1.8;">' +
        '<div style="margin-bottom:8px;font-weight:600;">Avertissement / Disclaimer</div>' +
        '<div style="margin-bottom:12px;">' + (legal.healthDisclaimer || regs.healthDisclaimer) + '</div>' +
        '<div style="margin-bottom:8px;">' + (legal.dataProtection || regs.dataProtection) + '</div>' +
        '<div style="margin-bottom:8px;">' + (legal.guarantee || regs.guarantee) + '</div>' +
        '<div style="font-weight:600;">' + (legal.copyright || 'Copyright ' + year + ' ' + author) + '</div>' +
      '</div>' +
    '</div>' +

    '</body></html>';

  res.json({ success: true, html: html });
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

// Endpoint de config - NO expone keys sensibles
app.get('/api/config', function(req, res) {
  res.json({ 
    ready: !!(process.env.CLAUDE_API_KEY && process.env.OPENAI_API_KEY && process.env.SERPER_API_KEY)
  });
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('FERNI AI Pro running on port ' + PORT); });
module.exports = app;



