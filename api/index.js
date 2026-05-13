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

  // 2. Google Trends PREMIUM (múltiples búsquedas para tendencias reales)
  const trends1 = await serperTrends(topic, country);
  const trends2 = await serperTrends(topic + ' futuro 2025', country);
  const trends3 = await serperTrends(topic + ' tendencias emergentes', country);
  const allTrends = [...trends1, ...trends2, ...trends3];
  allTrends.forEach(function(x) { allResults.push(x); });

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
  var trendsResults = results.filter(function(r){ return r.source.startsWith('trends'); });

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
  return 'Eres simultaneamente: experto mundial en el tema + escritor bestseller + especialista en adaptacion local.' +
    ' Tu mision: crear en CASTELLANO (ESPANOL) una guia practica nivel profesional que resuelva el problema del lector COMPLETAMENTE.' +
    ' REGLA ABSOLUTA E INNEGOCIABLE: TODO el texto debe estar en ESPANOL CASTELLANO. CERO palabras en frances, ingles u otro idioma. Ni titulos, ni subtitulos, ni palabras sueltas. SOLO ESPANOL.' +
    ' PAIS DESTINO (solo para contexto de ejemplos y precios): ' + countryName + '. EDITORIAL: Ferni Guides.' +
    ' USA TU CONOCIMIENTO EXPERTO REAL con datos verificables DE ' + countryName + '.' +
    '\n\nCONDICIONES OBLIGATORIAS NO NEGOCIABLES:' +
    ' (1) EXTENSION MINIMA: MINIMO 2500 PALABRAS POR CAPITULO. Esto garantiza 25-30 paginas en PDF final.' +
    ' (2) DENSIDAD: cada parrafo debe tener MINIMO 1 dato numerico, medida o referencia verificable. Cero filler.' +
    ' (3) METODO: crea un METODO CON NOMBRE PROPIO memorable (ej: Protocolo XYZ, Sistema JARDIN+) — usalo en TODO.' +
    ' (4) TONO: experto cercano e impersonal. NUNCA primera persona. "Los expertos", "Se recomienda", "Los profesionales de ' + countryName + '".' +
    ' (5) RESULTADO: el lector DEBE poder ejecutar SIN ayuda y ver resultado visible en 7 dias o menos.' +
    ' (6) LOCALIZACION: ejemplos, precios, medidas, referencias TODAS para ' + countryName + ' en ' + (regs.currency || 'EUR') + '.' +
    '\n\nESTRUCTURA OBLIGATORIA DE CADA CAPITULO (2500+ palabras):' +
    ' - APERTURA: 150-200 palabras impactante + por que es critico.' +
    ' - CONTEXTO: 300-400 palabras explicacion profunda + datos + estadisticas de ' + countryName + '.' +
    ' - RECURSOS: materiales con costos EXACTOS en ' + (regs.currency || 'EUR') + ' + equivalencia internacional.' +
    ' - PASOS DETALLADOS: minimo 6-8 pasos, CADA UNO 150-200 palabras (no resumido) + error comun de este paso.' +
    ' - PARA CADA PASO: qué, por qué, resultado, tiempo, error, solucion.' +
    ' - TIP EXPERTO: consejo NO publicado en internet, basado en experiencia real.' +
    ' - ERRORES: minimo 4 errores comunes + solucion rapida (2 minutos).' +
    ' - VERIFICACION: checklist 5-7 criterios para saber si quedo perfecto.' +
    '\n\nELEMENTOS OBLIGATORIOS EN EBOOK COMPLETO:' +
    ' - Mapa de decision (texto con → y opciones claras).' +
    ' - 3-4 tablas comparativas (A vs B vs C con criterios).' +
    ' - 3-4 checklists profesionales imprimibles.' +
    ' - Cronograma realista (8 semanas+) con hitos medibles.' +
    ' - Hoja resumen ejecutiva (1 pagina) con TODO resumido.' +
    ' - Casos reales de ' + countryName + ' (ejemplos concretos de personas aplicandolo).' +
    '\n\nESPECIFICIDAD EXTREMA (minimo 30 datos numericos en todo):' +
    ' MAL: "planta en espacio adecuado". BIEN: "en 4m² planta 12 lechugas (30cm), 6 tomates (50cm). Rendimiento 8kg/mes. Semilla 3-5 EUR/paquete."' +
    ' MAL: "toma agua suficiente". BIEN: "bebe 2.5L/dia si pesas 70kg (peso × 35ml). 8 vasos 320ml: 6am, 1pm, 6pm, 10pm."' +
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
    '\nIDIOMA DE ESCRITURA: ESPANOL CASTELLANO (el borrador siempre en español; la traduccion al idioma del pais se hace en paso separado posterior)' +
    '\nIDIOMA DEL PAIS DESTINO (solo para contexto cultural): ' + (o.idioma || o.language || 'Español') +
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
    var txt1 = await claudeCall(sys, ctx + '\n\nEscribe SOLO la introduccion y capitulo 1. MINIMO 2500 palabras en Cap1. OBLIGATORIO: TODO en ESPANOL CASTELLANO, cero palabras en frances o ingles. JSON valido sin markdown:\n' + schema1, 8000);
    var part1 = extractJSON(txt1);

    // Capitulo 2 (llamada separada)
    var schema2 = JSON.stringify({chapter2:{number:2,title:'titulo max 8 palabras',opening:'apertura 200-250 palabras profunda',content:'contenido 2500+ PALABRAS MINIMO - 6-7 subsecciones minimo 350 p/c - tabla comparativa A vs B vs C - 4+ errores comunes con solucion - estadistica real del sector en ' + countryName + ' - ejemplos concretos de ' + countryName + ' - todos los precios en ' + regs.currency,keyPoints:['punto: dato numerico verificable','punto: medida o tiempo concreto','punto: criterio de seleccion','punto: conexion al metodo principal','punto: ejemplo de ' + countryName,'punto: resultado medible'],exercise:{title:'ejercicio practico - aplicacion del metodo Cap2',description:'descripcion 150+ palabras con pasos y tiempo',steps:['paso 1 con duracion - accion - resultado observable','paso 2 con duracion - accion - resultado observable','paso 3 con duracion - accion - resultado observable','paso 4 con duracion - verificacion - resultado final']}}});
    var txt2 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 2. MINIMO 2500 palabras. OBLIGATORIO: TODO en ESPANOL CASTELLANO, cero palabras en frances o ingles. JSON valido sin markdown:\n' + schema2, 8000);
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
    var txt3 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 3. MINIMO 2500 palabras. OBLIGATORIO: TODO en ESPANOL CASTELLANO, cero palabras en frances o ingles. JSON valido sin markdown:\n' + schema3, 8000);
    var ch3 = extractJSON(txt3);

    // Solo capítulo 4
    var schema4 = JSON.stringify({chapter4:{number:4,title:'titulo max 8 palabras - dominio profesional',opening:'apertura 200-250 palabras vision inspiradora + resultados reales de ' + countryName,content:'contenido 2500+ PALABRAS MINIMO - resultado final detallado con datos - como verificar (5-7 criterios concretos) - como mantener a largo plazo - 3+ errores finales evitar - siguiente nivel avanzado - tabla resumen antes/despues - precios en ' + regs.currency,keyPoints:['logro verificable: dato numerico concreto','logro verificable: medida o indicador','logro verificable: tiempo alcanzado','logro verificable: comparacion antes/despues','logro verificable: ejemplo real','logro verificable: impacto en vida'],exercise:{title:'Checklist de verificacion profesional + mantenimiento',description:'descripcion 150+ palabras con criterios objetivos y plan de mantenimiento a perpetuidad',steps:['Verificacion 1: criterio objetivo medible - como checkearlo','Verificacion 2: criterio objetivo medible - como checkearlo','Verificacion 3: criterio objetivo medible - como checkearlo','Mantenimiento mensual: que hacer para mantener resultados 12+ meses']}}});
    var txt4 = await claudeCall(sys, ctx + '\n\nEscribe SOLO el capitulo 4 (resultado final). MINIMO 2500 palabras. OBLIGATORIO: TODO en ESPANOL CASTELLANO, cero palabras en frances o ingles. JSON valido sin markdown:\n' + schema4, 8000);
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

app.post('/api/generate-image', async function(req, res) {
  try {
    var resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({ model: 'dall-e-3', prompt: req.body.prompt + '. Professional commercial quality. No text. No watermarks. No faces.', n: 1, size: '1024x1024', quality: 'standard', style: 'natural' })
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
    // Estrategia: aplicar la correccion directamente en el texto del ebook
    // sin devolver el JSON completo (evita truncamiento)
    var sys = 'Eres editor experto. El usuario te indica una correccion a aplicar en un ebook.' +
      ' Busca el texto mencionado y devuelve SOLO un JSON con los campos que cambiaron.' +
      ' Formato de respuesta: {"field": "nombre_del_campo", "chapter": numero_o_null, "oldText": "texto original", "newText": "texto corregido"}' +
      ' Si son multiples cambios, devuelve array. SOLO JSON sin markdown.';

    // Enviar resumen del ebook (titulos y primeras palabras) para que Claude identifique donde esta el problema
    var summary = {
      title: ebook.title,
      subtitle: ebook.subtitle,
      intro_preview: (ebook.intro||'').slice(0,200),
      chapters: (ebook.chapters||[]).map(function(ch,i){ return {
        number: i+1,
        title: ch.title,
        content_preview: (ch.content||'').slice(0,300),
        opening_preview: (ch.opening||'').slice(0,100)
      };}),
      conclusion_preview: (ebook.conclusion||'').slice(0,200)
    };

    var msg = 'CORRECCION: ' + correction +
      '\n\nESTRUCTURA DEL EBOOK:\n' + JSON.stringify(summary);

    var txt = await claudeCall(sys, msg, 1000);
    var changes = extractJSON(txt);
    if (!Array.isArray(changes)) changes = [changes];

    // Aplicar cambios directamente en el ebook
    var updated = JSON.parse(JSON.stringify(ebook));
    changes.forEach(function(change) {
      if (!change || !change.oldText || !change.newText) return;
      var old = change.oldText;
      var neu = change.newText;
      // Buscar y reemplazar en todos los campos de texto
      function replaceInObj(obj) {
        if (!obj) return;
        Object.keys(obj).forEach(function(k) {
          if (typeof obj[k] === 'string') {
            obj[k] = obj[k].replace(old, neu);
          } else if (typeof obj[k] === 'object') {
            replaceInObj(obj[k]);
          }
        });
      }
      replaceInObj(updated);
    });

    res.json({ success: true, ebook: updated });
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
