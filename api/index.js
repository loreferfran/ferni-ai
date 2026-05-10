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

async function searchWithSerper(country, niche) {
  const queries = buildQueries(country, niche);
  const results = [];
  for (let i = 0; i < Math.min(queries.length, 8); i++) {
    try {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: queries[i], num: 5 })
      });
      if (r.ok) {
        const d = await r.json();
        (d.organic || []).forEach(function(x) {
          results.push({ title: x.title, snippet: x.snippet, url: x.link, query: queries[i] });
        });
      }
    } catch (e) {}
  }
  return results;
}

async function analyzeWithGPT4(results, country, niche, language) {
  const sys = 'Eres un analista senior de investigacion de mercado especializado en productos digitales para Europa y USA. IMPORTANTE: Responde TODO en ESPANOL. Analiza los resultados de busqueda reales y extrae SOLO problemas genuinos y monetizables de personas en ' + country + ' sobre el tema ' + niche + '. Devuelve SOLO un JSON array valido con 6 oportunidades ordenadas por scoreMonetizacion descendente. Cada oportunidad debe tener los campos: problema, problemaEnIdioma, busquedaExacta, necesidad, emocion, intencionCompra, rangoEdad, genero, distribucionGenero, claseSocial, pais, idioma, volumenBusqueda, volumenEstimado, tendencia, competencia, nivelCompetenciaDetalle, oportunidadMonetizacion, tipoProducto, tituloEbook, promesaEbook, precioHotmart, scoreMonetizacion, urlFuente, keyword, keywordES, dolorEmocional, urgencia, prioridad, porQueEstaOportunidad, fuentesConsultadas, datosDetallados. El campo datosDetallados incluye: busquedasPorGenero, busquedasPorEdad, busquedasPorClase, keywordsEncontradas, competidoresDetectados, precioPromedioMercado, tendenciaMensual.';

  const userMsg = 'Pais: ' + country + '\nNicho: ' + niche + '\nIdioma: ' + language + '\n\nResultados Serper:\n' +
    results.slice(0, 25).map(function(r) {
      return 'BUSQUEDA: ' + r.query + '\nTITULO: ' + r.title + '\nDESCRIPCION: ' + r.snippet + '\nURL: ' + r.url;
    }).join('\n---\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
      temperature: 0.3,
      max_tokens: 5000
    })
  });
  const d = await resp.json();
  return JSON.parse(d.choices[0].message.content.replace(/```json|```/g, '').trim());
}

app.post('/api/search', async function(req, res) {
  try {
    const serperResults = await searchWithSerper(req.body.country, req.body.niche);
    const opportunities = await analyzeWithGPT4(serperResults, req.body.country, req.body.niche, req.body.language);
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
    ' PUBLICO: ' + (o.rangoEdad || o.ageRange || '') + ', ' + (o.genero || o.gender || '') + ', ' + countryName +
    ' TITULO: ' + (o.tituloEbook || o.ebookTitle || '') +
    ' PROMESA: ' + (o.promesaEbook || o.ebookPromise || '') +
    ' EMOCION: ' + (o.emocion || o.emotion || '') +
    ' DOLOR: ' + (o.dolorEmocional || o.emotionalPain || '') +
    ' AUTOR: ' + author + ' PAIS: ' + countryName;

  const baseSys = 'Eres escritor profesional de bestsellers para Europa y USA. Escribes en espanol. Contenido especifico, emocional, accionable. Tono empatico, cientifico pero accesible. REGULACIONES ' + countryName + ': ' + regs.legal + '. PROHIBIDO: ' + regs.forbidden;

  try {
    const p1 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 1. SOLO JSON: {"title":"","subtitle":"","tagline":"","intro":"500 palabras minimo","chapter1":{"number":1,"title":"","opening":"150 palabras","content":"500 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"","description":"","steps":["s1","s2","s3","s4","s5"]}},"chapter2":{"number":2,"title":"","opening":"150 palabras","content":"500 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"","description":"","steps":["s1","s2","s3","s4","s5"]}}}', 6000)).replace(/```json|```/g, '').trim());

    const p2 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 2. SOLO JSON: {"chapter3":{"number":3,"title":"","opening":"150 palabras","content":"500 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"","description":"","steps":["s1","s2","s3","s4","s5"]}},"chapter4":{"number":4,"title":"","opening":"150 palabras","content":"500 palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"","description":"","steps":["s1","s2","s3","s4","s5"]}}}', 6000)).replace(/```json|```/g, '').trim());

    const p3 = JSON.parse((await claudeCall(baseSys, ctx + ' Escribe PARTE 3. SOLO JSON: {"conclusion":"350 palabras minimo","actionPlan":["accion semana","accion mes","accion 3 meses"],"authorNote":"120 palabras firmada por ' + author + '","resources":["r1","r2","r3","r4"],"legalSection":{"healthDisclaimer":"' + regs.healthDisclaimer + '","guarantee":"' + regs.guarantee + '","dataProtection":"' + regs.dataProtection + '","copyright":"Copyright ' + year + ' ' + author + '. Todos los derechos reservados."}}', 3000)).replace(/```json|```/g, '').trim());

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
  const sys = 'Traductor literario experto en ' + language + ' para ' + country + '. Traduce espanol a ' + language + ' de manera nativa. Adapta culturalmente. Mantener nombre ' + author + ' sin cambios. Devuelve SOLO JSON con misma estructura. Sin markdown.';
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
    const sys = 'Copywriter experto Hotmart para Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. Garantia: ' + regs.guarantee + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: productName, headline, subheadline, shortDesc, longDesc, benefits(array 6), bullets(array 6), salesPageTitle, salesPageBody, guarantee, bonus(array 3), upsell, orderBump, category, cta, facebookPost, instagramCaption, instagramStory, emailSubject, emailBody.';
    const userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Promesa: ' + (o.promesaEbook || o.ebookPromise) + ' Problema: ' + (o.problema || o.problem) + ' Publico: ' + (o.rangoEdad || o.ageRange) + ', ' + (o.genero || o.gender) + ', ' + countryName + ' Precio: ' + (o.precioHotmart || o.hotmartPrice) + ' Autor: ' + author + ' Emocion: ' + (o.emocion || o.emotion) + ' Dolor: ' + (o.dolorEmocional || o.emotionalPain);
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
    const sys = 'Estratega Meta Ads para productos digitales Europa y USA. Todo en ' + language + ' para ' + countryName + '. REGULACIONES: ' + regs.legal + '. PROHIBIDO: ' + regs.forbidden + '. Devuelve SOLO JSON con: segmentation(age,gender,interests array 6,behaviors array 4,painPoints array 5,excludeAudiences array 3,lookalike,budget), ads(array 5 con angle,platform,format,headline max40chars,primaryText 150palabras,description max30chars,cta,dallePrompt en ingles sin texto ni caras,targetEmotion), landingPage(headline,subheadline,body 400palabras,socialProof,cta,urgency), retargeting(headline,copy,cta,offer), emailSequence(array 3 con subject y body 200palabras). 5 anuncios: dolor,urgencia,testimonio,curiosidad,autoridad.';
    const userMsg = 'Producto: ' + (o.tituloEbook || o.ebookTitle) + ' Problema: ' + (o.problema || o.problem) + ' Publico: ' + (o.rangoEdad || o.ageRange) + ', ' + (o.genero || o.gender) + ', ' + countryName + ' Emocion: ' + (o.emocion || o.emotion) + ' Dolor: ' + (o.dolorEmocional || o.emotionalPain) + ' Precio: ' + (o.precioHotmart || o.hotmartPrice);
    const txt = await claudeCall(sys, userMsg, 5000);
    res.json({ success: true, kit: JSON.parse(txt.replace(/```json|```/g, '').trim()) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildQueries(country, niche) {
  const b = [
    'most searched ' + niche + ' problems in ' + country + ' 2024',
    country + ' ' + niche + ' pain points Reddit forum',
    'best selling ' + niche + ' ebooks ' + country + ' Amazon',
    country + ' ' + niche + ' questions Quora',
    country + ' ' + niche + ' YouTube most searched',
    country + ' ' + niche + ' forum help desperate'
  ];
  const loc = {
    France: ['comment soulager migraine rapidement', 'douleur chronique solution naturelle', 'anxiete insomnie remede naturel', 'menopause prise de poids que faire', 'enfant autiste crise comment calmer', 'fatigue chronique femme solution'],
    Germany: ['Rueckenschmerzen Loesung natuerlich', 'Burnout Anzeichen was tun', 'Angstzustaende Schlafprobleme Loesung', 'Wechseljahre Gewicht verlieren'],
    Italy: ['emicrania rimedi naturali efficaci', 'ansia insonnia soluzioni naturali', 'menopausa sintomi cura naturale'],
    Spain: ['migrana remedios naturales eficaces', 'ansiedad insomnio foro ayuda', 'menopausia sintomas soluciones'],
    Portugal: ['enxaqueca remedios naturais', 'ansiedade insonia forum', 'menopausa sintomas solucoes'],
    'United Kingdom': ['chronic pain relief natural UK', 'anxiety insomnia help UK', 'menopause weight gain UK'],
    Netherlands: ['rugpijn oplossing natuurlijk', 'angststoornis slapeloosheid', 'overgangsklachten gewicht'],
    Sweden: ['ryggsmarta naturlig losning', 'angest somnproblem', 'klimakteriet viktnedgang'],
    Switzerland: ['Rueckenschmerzen Loesung Schweiz', 'Burnout Hilfe Schweiz', 'Wechseljahre Beschwerden'],
    Austria: ['Rueckenschmerzen Loesung Oesterreich', 'Burnout Symptome Hilfe', 'Wechseljahre Gewicht'],
    Poland: ['bol plecow naturalne rozwiazanie', 'lek bezsennosc pomoc', 'menopauza przyrost wagi'],
    USA: ['chronic pain relief without medication', 'anxiety insomnia natural solutions', 'perimenopause symptoms Reddit', 'long covid fatigue solutions 2024']
  };
  if (loc[country]) loc[country].forEach(function(q) { b.push(q); });
  return b;
}

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('FERNI AI Pro running on port ' + PORT); });
module.exports = app;
