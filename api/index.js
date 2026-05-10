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

const LOCAL_FORUMS = {
  France: ['site:doctissimo.fr', 'site:aufeminin.com', 'site:marmiton.org', 'site:reddit.com/r/france'],
  Germany: ['site:gutefrage.net', 'site:reddit.com/r/de', 'site:forum.helpster.de'],
  Italy: ['site:reddit.com/r/italy', 'site:cercasalute.it'],
  Spain: ['site:reddit.com/r/es', 'site:forocoches.com'],
  Portugal: ['site:reddit.com/r/portugal', 'site:sapo.pt'],
  'United Kingdom': ['site:reddit.com/r/unitedkingdom', 'site:mumsnet.com'],
  Netherlands: ['site:reddit.com/r/netherlands', 'site:forum.viva.nl'],
  USA: ['site:reddit.com', 'site:quora.com'],
  Canada: ['site:reddit.com/r/canada', 'site:quora.com']
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  const parts = countryStr.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : countryStr;
}

function getRegs(country) {
  return REGS[country] || REGS.France;
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
      body: JSON.stringify({ q: query, num: 5 })
    });
    if (r.ok) {
      const d = await r.json();
      return (d.organic || []).map(function(x) {
        return { title: x.title, snippet: x.snippet, url: x.link, query: query };
      });
    }
  } catch (e) {}
  return [];
}

async function searchWithSerper(country, niche, language) {
  const forums = LOCAL_FORUMS[country] || [];
  const localQueries = getLocalQueries(country, niche);
  
  const allQueries = [
    niche + ' problems ' + country + ' Reddit forum 2024',
    niche + ' questions ' + country + ' Quora',
    'best selling ' + niche + ' books ' + country + ' Amazon',
    niche + ' YouTube ' + country + ' most viewed',
    niche + ' ' + country + ' solution forum help',
    niche + ' ' + country + ' ' + language + ' problem',
  ];

  if (forums.length > 0) {
    allQueries.push(forums[0] + ' ' + niche + ' probleme aide');
    allQueries.push(forums[1] ? forums[1] + ' ' + niche + ' solution' : niche + ' forum ' + country);
  }

  localQueries.forEach(function(q) { allQueries.push(q); });

  const allResults = [];
  for (let i = 0; i < Math.min(allQueries.length, 10); i++) {
    const results = await serperSearch(allQueries[i]);
    results.forEach(function(r) { allResults.push(r); });
  }
  return allResults;
}

function getLocalQueries(country, niche) {
  const map = {
    France: {
      salud: ['migraine solution naturelle doctissimo', 'menopause symptomes aufeminin forum', 'anxiete insomnie remede naturel france', 'enfant autiste crise calmer forum', 'fatigue chronique femme france forum', 'douleur dos chronique solution france'],
      finanzas: ['credit immobilier france forum', 'investissement bourse debutant france', 'epargne retraite france conseil'],
      belleza: ['soin peau naturel france forum', 'chute cheveux femme solution france', 'anti age naturel france astuce'],
      ansiedad: ['anxiete chronique solution france forum', 'attaque panique que faire france', 'stress travail burnout france forum'],
      menopausia: ['menopause prise de poids solution france', 'symptomes menopause france forum', 'menopause naturelle traitement france'],
      crianza: ['enfant autiste france aide parents', 'troubles apprentissage enfant france', 'hyperactivite enfant france forum'],
      fitness: ['perdre poids rapidement france methode', 'sport maison france programme', 'regime efficace france forum']
    },
    Germany: {
      salud: ['Rueckenschmerzen Loesung Forum Deutschland', 'Burnout Symptome Deutschland Forum', 'Schlafprobleme Loesung Deutschland', 'Wechseljahre Beschwerden Forum'],
      ansiedad: ['Angststoerung Hilfe Forum Deutschland', 'Panikattacke was tun Deutschland'],
      menopausia: ['Wechseljahre Gewicht Forum Deutschland', 'Klimakterium Symptome Hilfe']
    },
    'United Kingdom': {
      salud: ['chronic pain UK forum Reddit', 'menopause symptoms UK Mumsnet', 'anxiety depression UK forum help', 'perimenopause UK Reddit forum'],
      ansiedad: ['anxiety UK forum help Reddit', 'panic attacks UK what to do']
    },
    USA: {
      salud: ['chronic pain Reddit forum 2024', 'perimenopause symptoms Reddit r/Menopause', 'long covid fatigue Reddit forum', 'anxiety without medication Reddit'],
      ansiedad: ['anxiety natural remedies Reddit forum', 'panic disorder help Reddit USA'],
      menopausia: ['perimenopause Reddit r/Menopause forum', 'menopause weight gain help Reddit']
    }
  };

  if (map[country] && map[country][niche]) return map[country][niche];
  if (map[country] && map[country].salud) return map[country].salud.slice(0, 3);
  return [niche + ' problems ' + country + ' forum help desperate'];
}

async function analyzeWithGPT4(results, country, niche, language) {
  const sys = 'Eres un analista senior de investigacion de mercado especializado en productos digitales para Europa y USA. IMPORTANTE: Responde TODO en ESPANOL. El campo problemaEnIdioma debe estar en ' + language + '. El campo busquedaExacta debe estar en ' + language + '. Analiza los resultados de busqueda reales de multiples plataformas (Google, Reddit, Amazon, YouTube, foros locales) y extrae SOLO problemas genuinos y monetizables de personas en ' + country + ' sobre el tema ' + niche + '. Devuelve SOLO un JSON array valido con 6 oportunidades ordenadas por scoreMonetizacion descendente. Cada oportunidad DEBE tener TODOS estos campos exactos: problema (en espanol), problemaEnIdioma (en ' + language + '), busquedaExacta (en ' + language + ' como buscan realmente), necesidad (espanol), emocion (espanol), intencionCompra, rangoEdad, genero, distribucionGenero, claseSocial, pais, idioma, volumenBusqueda, volumenEstimado, tendencia, competencia, nivelCompetenciaDetalle, oportunidadMonetizacion, tipoProducto, tituloEbook (espanol), promesaEbook (espanol), precioHotmart, scoreMonetizacion (numero 1-100), urlFuente, keyword (en ' + language + '), keywordES (espanol), dolorEmocional (espanol), urgencia, prioridad, porQueEstaOportunidad (espanol con evidencia de los resultados), fuentesConsultadas (array de fuentes), datosDetallados (objeto con: busquedasPorGenero, busquedasPorEdad, busquedasPorClase, keywordsEncontradas array en ' + language + ', competidoresDetectados array, precioPromedioMercado, tendenciaMensual, plataformasDetectadas array).';

  const userMsg = 'Pais: ' + country + '\nNicho: ' + niche + '\nIdioma del pais: ' + language + '\n\nResultados de multiples plataformas (Google, Reddit, Amazon, YouTube, foros locales):\n' +
    results.slice(0, 30).map(function(r) {
      return 'PLATAFORMA/BUSQUEDA: ' + r.query + '\nTITULO: ' + r.title + '\nCONTENIDO: ' + r.snippet + '\nURL: ' + r.url;
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
    const country = req.body.country;
    const niche = req.body.niche;
    const language = req.body.language;
    const serperResults = await searchWithSerper(country, niche, language);
    const opportunities = await analyzeWithGPT4(serperResults, country, niche, language);
    res.json({ success: true, opportunities: opportunities, searchCount: serperResults.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/chat', async function(req, res) {
  try {
    const sys = 'Eres FERNI, AI experta en market intelligence y creacion de ebooks vendibles para Europa y USA. Contexto: ' + req.body.context + '. Responde SIEMPRE en espanol, conciso y accionable. Maximo 3 parrafos.';
    const reply = await claudeCall(sys, req.body.message, 1000);
    res.json({ success: true, reply: reply });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-ebook', async function(req, res) {
  const o = req.body.opportunity;
  const author = req.body.author;
  const countryName = getCountryName(o.pais || o.country || 'France');
  const regs = getRegs(countryName);
  const year = new Date().getFullYear();

  const ctx = 'PROBLEMA: ' + (o.problema || o.problem || '') +
    ' NECESIDAD: ' + (o.necesidad || o.need || '') +
    ' PUBLICO: ' + (o.rangoEdad || o.ageRange || '') + ' ' + (o.genero || o.gender || '') + ' ' + countryName +
    ' TITULO: ' + (o.tituloEbook || o.ebookTitle || '') +
    ' PROMESA: ' + (o.promesaEbook || o.ebookPromise || '') +
    ' EMOCION: ' + (o.emocion || o.emotion || '') +
    ' DOLOR: ' + (o.dolorEmocional || o.emotionalPain || '') +
    ' AUTOR: ' + author + ' PAIS: ' + countryName +
    ' REGULACIONES: ' + regs.legal + ' PROHIBIDO: ' + regs.forbidden;

  const baseSys = 'Eres escritor profesional de bestsellers para Europa y USA. Escribes en espanol. Contenido especifico emocional accionable nunca generico. Tono empatico cientifico pero accesible. REGULACIONES ' + countryName + ': ' + regs.legal + '. PROHIBIDO: ' + regs.forbidden + '. Disclaimer obligatorio: ' + regs.healthDisclaimer;

  try {
    const p1 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 1 del ebook. SOLO JSON valido: {"title":"titulo impactante","subtitle":"subtitulo vendedor","tagline":"frase corta maxima 10 palabras","intro":"introduccion de minimo 500 palabras emocionalmente poderosa que haga al lector sentirse completamente identificado","chapter1":{"number":1,"title":"titulo capitulo 1","opening":"historia apertura minimo 150 palabras que el lector sienta como propia","content":"contenido minimo 500 palabras con tecnicas especificas y datos reales","keyPoints":["punto clave 1","punto clave 2","punto clave 3","punto clave 4"],"exercise":{"title":"nombre del ejercicio","description":"descripcion y proposito del ejercicio","steps":["paso especifico 1","paso 2","paso 3","paso 4","paso 5"]}},"chapter2":{"number":2,"title":"titulo capitulo 2","opening":"historia apertura minimo 150 palabras","content":"contenido minimo 500 palabras","keyPoints":["punto 1","punto 2","punto 3","punto 4"],"exercise":{"title":"nombre","description":"descripcion","steps":["paso 1","paso 2","paso 3","paso 4","paso 5"]}}}', 6000)).replace(/```json|```/g, '').trim());

    const p2 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 2 del ebook. SOLO JSON valido: {"chapter3":{"number":3,"title":"titulo capitulo 3","opening":"historia apertura minimo 150 palabras","content":"contenido minimo 500 palabras con tecnicas probadas y ejercicios","keyPoints":["punto 1","punto 2","punto 3","punto 4"],"exercise":{"title":"nombre","description":"descripcion","steps":["paso 1","paso 2","paso 3","paso 4","paso 5"]}},"chapter4":{"number":4,"title":"titulo capitulo 4","opening":"historia apertura minimo 150 palabras","content":"contenido minimo 500 palabras","keyPoints":["punto 1","punto 2","punto 3","punto 4"],"exercise":{"title":"nombre","description":"descripcion","steps":["paso 1","paso 2","paso 3","paso 4","paso 5"]}}}', 6000)).replace(/```json|```/g, '').trim());

    const p3 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 3 del ebook. SOLO JSON valido: {"conclusion":"conclusion motivadora minimo 350 palabras con plan de accion claro","actionPlan":["accion concreta esta semana","accion concreta este mes","accion concreta proximos 3 meses"],"authorNote":"nota personal minimo 120 palabras calida y autentica firmada por ' + author + '","resources":["recurso especifico 1","recurso 2","recurso 3","recurso 4"],"legalSection":{"healthDisclaimer":"' + regs.healthDisclaimer + '","guarantee":"' + regs.guarantee + '","dataProtection":"' + regs.dataProtection + '","copyright":"Copyright ' + year + ' ' + author + '. Todos los derechos reservados."}}', 3000)).replace(/```json|```/g, '').trim());

    res.json({ success: true, ebook: { title: p1.title, subtitle: p1.subtitle, tagline: p1.tagline, intro: p1.intro, chapters: [p1.chapter1, p1.chapter2, p2.chapter3, p2.chapter4], conclusion: p3.conclusion, actionPlan: p3.actionPlan, authorNote: p3.authorNote, resources: p3.resources, legalSection: p3.legalSection } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/translate-ebook', async function(req, res) {
  const ebook = req.body.ebook;
  const language = req.body.language;
  const country = req.body.country;
  const author = req.body.author;
  const regs = getRegs(country);
  const sys = 'Traductor literario experto en ' + language + ' para ' + country + '. Traduce espanol a ' + language + ' de manera completamente nativa. Adapta culturalmente. Mantener nombre ' + author + ' sin cambios. Regulaciones: ' + regs.legal + '. Devuelve SOLO JSON con misma estructura. Sin markdown.';
  try {
    const t1 = JSON.parse((await claudeCall(sys, JSON.stringify({ title: ebook.title, subtitle: ebook.subtitle, tagline: ebook.tagline, intro: ebook.intro, chapter1: ebook.chapters[0], chapter2: ebook.chapters[1] }), 6000)).replace(/```json|```/g, '').trim());
    const t2 = JSON.parse((await claudeCall(sys, JSON.stringify({ chapter3: ebook.chapters[2], chapter4: ebook.chapters[3], conclusion: ebook.conclusion, actionPlan: ebook.actionPlan, authorNote: ebook.authorNote, resources: ebook.resources, legalSection: ebook.legalSection }), 6000)).replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook: { title: t1.title, subtitle: t1.subtitle, tagline: t1.tagline, intro: t1.intro, chapters: [t1.chapter1, t1.chapter2, t2.chapter3, t2.chapter4], conclusion: t2.conclusion, actionPlan: t2.actionPlan, authorNote: t2.authorNote, resources: t2.resources, legalSection: t2.legalSection } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-image', async function(req, res) {
  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({ model: 'dall-e-3', prompt: req.body.prompt + '. Professional commercial quality. No text. No watermarks. No faces.', n: 1, size: '1024x1024', quality: 'hd', style: 'natural' })
    });
    const d = await resp.json();
    if (d.data && d.data[0]) res.json({ success: true, url: d.data[0].url });
    else res.status(500).json({ success: false, error: 'No image generated' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-hotmart', async function(req, res) {
  const o = req.body.opportunity;
  const author = req.body.author;
  const language = req.body.language;
  const countryName = getCountryName(o.pais || o.country || 'France');
  const regs = getRegs(countryName);
  try {
    const sys = 'Copywriter experto Hotmart para Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. Garantia: ' + regs.guarantee + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: productName, headline, subheadline, shortDesc, longDesc, benefits array 6, bullets array 6, salesPageTitle, salesPageBody, guarantee, bonus array 3, upsell, orderBump, category, cta, facebookPost, instagramCaption, instagramStory, emailSubject, emailBody.';
    const userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Promesa: ' + (o.promesaEbook || o.ebookPromise) + ' Problema: ' + (o.problema || o.problem) + ' Publico: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) + ' ' + countryName + ' Precio: ' + (o.precioHotmart || o.hotmartPrice) + ' Autor: ' + author + ' Emocion: ' + (o.emocion || o.emotion) + ' Dolor: ' + (o.dolorEmocional || o.emotionalPain);
    const txt = await claudeCall(sys, userMsg, 4000);
    res.json({ success: true, kit: JSON.parse(txt.replace(/```json|```/g, '').trim()) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async function(req, res) {
  const o = req.body.opportunity;
  const language = req.body.language;
  const countryName = getCountryName(o.pais || o.country || 'France');
  const regs = getRegs(countryName);
  try {
    const sys = 'Estratega Meta Ads para productos digitales Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: segmentation con age gender interests array 6 behaviors array 4 painPoints array 5 excludeAudiences array 3 lookalike budget. ads array 5 con angle platform format headline max40chars primaryText 150palabras description max30chars cta dallePrompt en ingles sin texto ni caras targetEmotion. landingPage con headline subheadline body 400palabras socialProof cta urgency. retargeting con headline copy cta offer. emailSequence array 3 con subject y body 200palabras. Genera 5 anuncios angulos: dolor urgencia testimonio curiosidad autoridad.';
    const userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Problema: ' + (o.problema || o.problem) + ' Publico: ' + (o.rangoEdad || o.ageRange) + ' ' + (o.genero || o.gender) + ' ' + countryName + ' Emocion: ' + (o.emocion || o.emotion) + ' Dolor: ' + (o.dolorEmocional || o.emotionalPain) + ' Precio: ' + (o.precioHotmart || o.hotmartPrice);
    const txt = await claudeCall(sys, userMsg, 5000);
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
