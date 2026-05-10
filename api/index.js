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
  'France': { legal:'RGPD, Loi Hamon (garantie 14 jours), Directive UE 2011/83', healthDisclaimer:'Ce guide est fourni à titre informatif uniquement et ne remplace pas l\'avis d\'un professionnel de santé.', guarantee:'Garantie satisfait ou remboursé 14 jours conformément à la loi Hamon', dataProtection:'Données protégées conformément au RGPD.', forbidden:'Pas de promesses de résultats garantis en santé.', language:'French', currency:'EUR' },
  'Germany': { legal:'DSGVO, Heilmittelwerbegesetz HWG, UWG, Fernabsatzrecht', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.', guarantee:'14-tägiges Widerrufsrecht gemäß deutschem Fernabsatzrecht', dataProtection:'Daten werden gemäß DSGVO verarbeitet.', forbidden:'Keine garantierten Heilversprechen.', language:'German', currency:'EUR' },
  'Italy': { legal:'GDPR italiano, Codice del Consumo D.lgs 206/2005', healthDisclaimer:'Questa guida ha scopo puramente informativo e non sostituisce il parere medico.', guarantee:'Diritto di recesso 14 giorni', dataProtection:'Dati trattati in conformità al GDPR.', forbidden:'Vietate promesse di risultati garantiti in salute.', language:'Italian', currency:'EUR' },
  'Spain': { legal:'LOPDGDD, LGDCU, LSSI, Directiva UE 2011/83', healthDisclaimer:'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico.', guarantee:'Derecho de desistimiento 14 días', dataProtection:'Datos protegidos conforme a LOPDGDD y RGPD.', forbidden:'Prohibidas promesas de resultados garantizados en salud.', language:'Spanish', currency:'EUR' },
  'Portugal': { legal:'RGPD, Lei de Defesa do Consumidor, Decreto-Lei 24/2014', healthDisclaimer:'Este guia tem fins exclusivamente informativos e não substitui o aconselhamento médico.', guarantee:'Direito de arrependimento 14 dias', dataProtection:'Dados protegidos de acordo com o RGPD.', forbidden:'Proibidas promessas de resultados garantidos.', language:'Portuguese', currency:'EUR' },
  'United Kingdom': { legal:'UK GDPR, Consumer Rights Act 2015, ASA Advertising Standards', healthDisclaimer:'This guide is for informational purposes only and does not replace professional medical advice.', guarantee:'14-day cooling-off period under UK Consumer Rights Act', dataProtection:'Data protected under UK GDPR.', forbidden:'No guaranteed health claims.', language:'English', currency:'GBP' },
  'Netherlands': { legal:'AVG GDPR, Wet handhaving consumentenbescherming', healthDisclaimer:'Deze gids is uitsluitend informatief en vervangt geen professioneel medisch advies.', guarantee:'14 dagen bedenktijd', dataProtection:'Persoonsgegevens verwerkt conform AVG.', forbidden:'Geen gegarandeerde gezondheidsbeloften.', language:'Dutch', currency:'EUR' },
  'Belgium': { legal:'RGPD Belgique, Code de droit économique', healthDisclaimer:'Ce guide est fourni à titre informatif et ne remplace pas l\'avis médical.', guarantee:'Droit de rétractation 14 jours', dataProtection:'Données protégées conformément au RGPD.', forbidden:'Pas de promesses garanties en santé.', language:'French', currency:'EUR' },
  'Sweden': { legal:'GDPR Sverige, Konsumentköplagen, Distansavtalslagen', healthDisclaimer:'Denna guide är endast informativ och ersätter inte medicinsk rådgivning.', guarantee:'14 dagars ångerrätt', dataProtection:'Personuppgifter behandlas enligt GDPR.', forbidden:'Inga garanterade hälsoresultat.', language:'Swedish', currency:'SEK' },
  'Switzerland': { legal:'nDSG, OR Obligationenrecht, UWG', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken.', guarantee:'14-tägiges Widerrufsrecht', dataProtection:'Daten gemäß nDSG geschützt.', forbidden:'Keine Heilversprechen.', language:'German', currency:'CHF' },
  'Austria': { legal:'DSGVO Österreich, Konsumentenschutzgesetz', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken.', guarantee:'14-tägiges Rücktrittsrecht', dataProtection:'Daten gemäß DSGVO verarbeitet.', forbidden:'Keine garantierten Heilversprechen.', language:'German', currency:'EUR' },
  'Poland': { legal:'RODO GDPR Polska, Ustawa o prawach konsumenta', healthDisclaimer:'Ten przewodnik służy wyłącznie celom informacyjnym.', guarantee:'14-dniowe prawo do odstąpienia', dataProtection:'Dane chronione zgodnie z RODO.', forbidden:'Zakaz gwarantowanych obietnic zdrowotnych.', language:'Polish', currency:'PLN' },
  'USA': { legal:'FTC Regulations, CAN-SPAM Act, CCPA California', healthDisclaimer:'This guide is for informational purposes only. Results may vary. These statements have not been evaluated by the FDA.', guarantee:'30-day money-back guarantee as required by FTC', dataProtection:'Data protected per Privacy Policy. California residents have additional rights under CCPA.', forbidden:'No guaranteed health results per FTC.', language:'English', currency:'USD' },
  'Canada': { legal:'PIPEDA, CASL Anti-Spam, Consumer Protection Acts', healthDisclaimer:'This guide is for informational purposes only.', guarantee:'Satisfaction guarantee per provincial laws', dataProtection:'Data protected under PIPEDA.', forbidden:'No guaranteed health claims.', language:'English', currency:'CAD' }
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  const parts = countryStr.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : countryStr;
}
function getRegs(country) { return REGS[country] || REGS['France']; }

async function searchWithSerper(country, niche) {
  const queries = buildQueries(country, niche);
  let results = [];
  for (let i = 0; i < Math.min(queries.length, 8); i++) {
    try {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: queries[i], num: 5 })
      });
      if (r.ok) {
        const d = await r.json();
        results.push(...(d.organic || []).map(x => ({ title: x.title, snippet: x.snippet, url: x.link, query: queries[i] })));
      }
    } catch (e) {}
  }
  return results;
}

async function analyzeWithGPT4(results, country, niche, language) {
  const sys = `Eres un analista senior de investigación de mercado especializado en productos digitales para Europa y USA.

IMPORTANTE: Responde TODO en ESPAÑOL. Todos los campos de texto deben estar en español.

Analiza los resultados de búsqueda reales y extrae SOLO problemas genuinos y monetizables que tienen las personas en ${country} sobre "${niche}".

Devuelve SOLO un JSON array válido con 6 oportunidades ordenadas por scoreMonetizacion descendente.

Cada oportunidad DEBE tener TODOS estos campos:
{
  "problema": "problema específico en español",
  "problemaEnIdioma": "el mismo problema en ${language}",
  "busquedaExacta": "búsqueda exacta en ${language}",
  "necesidad": "necesidad real en español",
  "emocion": "desesperación/frustración/vergüenza/miedo/agotamiento",
  "intencionCompra": "alta/media/baja",
  "rangoEdad": "rango de edad",
  "genero": "Mujer/Hombre/Ambos",
  "distribucionGenero": "ej: 70% mujeres, 30% hombres",
  "claseSocial": "clase media/clase media-alta/todas las clases",
  "pais": "país con emoji bandera",
  "idioma": "${language}",
  "volumenBusqueda": "alto/medio/bajo",
  "volumenEstimado": "ej: 50.000 búsquedas/mes",
  "tendencia": "creciendo/estable/bajando",
  "competencia": "alta/media/baja",
  "nivelCompetenciaDetalle": "descripción del nivel de competencia",
  "oportunidadMonetizacion": "descripción en español",
  "tipoProducto": "Ebook",
  "tituloEbook": "título atractivo en español",
  "promesaEbook": "promesa principal en español",
  "precioHotmart": "precio en moneda local",
  "scoreMonetizacion": número 1-100,
  "urlFuente": "URL más relevante",
  "keyword": "keyword en ${language}",
  "keywordES": "keyword en español",
  "dolorEmocional": "dolor emocional profundo en español",
  "urgencia": "alta/media/baja",
  "prioridad": "ALTA/MEDIA/BAJA",
  "porQueEstaOportunidad": "razón basada en evidencia en español",
  "fuentesConsultadas": ["fuente1", "fuente2", "fuente3"],
  "datosDetallados": {
    "busquedasPorGenero": "distribución estimada por género",
    "busquedasPorEdad": "distribución estimada por edad",
    "busquedasPorClase": "distribución estimada por clase social",
    "keywordsEncontradas": ["kw1 en ${language}", "kw2", "kw3", "kw4", "kw5"],
    "competidoresDetectados": ["competidor1", "competidor2"],
    "precioPromedioMercado": "precio promedio productos similares",
    "tendenciaMensual": "descripción tendencia mensual"
  }
}`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `País: ${country}\nNicho: ${niche}\nIdioma: ${language}\n\nResultados Serper:\n${results.slice(0,25).map(r=>`BÚSQUEDA: ${r.query}\nTÍTULO: ${r.title}\nDESCRIPCIÓN: ${r.snippet}\nURL: ${r.url}`).join('\n---\n')}` }
      ],
      temperature: 0.3,
      max_tokens: 5000
    })
  });
  const d = await resp.json();
  return JSON.parse(d.choices[0].message.content.replace(/```json|```/g,'').trim());
}

app.post('/api/search', async (req, res) => {
  const { country, niche, language } = req.body;
  try {
    const serperResults = await searchWithSerper(country, niche);
    const opportunities = await analyzeWithGPT4(serperResults, country, niche, language);
    res.json({ success: true, opportunities, searchCount: serperResults.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: `Eres FERNI, AI experta en market intelligence y creación de ebooks vendibles para Europa y USA. Contexto: ${context}. Responde SIEMPRE en español, conciso y accionable. Máximo 3 párrafos.`,
        messages: [{ role: 'user', content: message }]
      })
    });
    const d = await resp.json();
    res.json({ success: true, reply: d.content.map(c => c.text || '').join('') });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-ebook', async (req, res) => {
  const { opportunity, author } = req.body;
  const o = opportunity;
  const countryName = getCountryName(o.pais || o.country || 'France');
  const regs = getRegs(countryName);
  const year = new Date().getFullYear();
  const sys = `Eres un escritor profesional de bestsellers para el mercado europeo y americano. MISIÓN: Crear un ebook COMPLETO en español que sea tan bueno que el lector sienta que ya recuperó su inversión con solo leer la introducción.

REGULACIONES PARA ${countryName.toUpperCase()}:
Legal: ${regs.legal}
Disclaimer salud: "${regs.healthDisclaimer}"
Garantía: "${regs.guarantee}"
Protección datos: "${regs.dataProtection}"
PROHIBIDO: ${regs.forbidden}

CALIDAD NIVEL BESTSELLER:
- Introducción 500+ palabras emocionalmente poderosas
- 4 capítulos: historia apertura 150+ palabras + contenido 600+ palabras + puntos clave + ejercicio 5 pasos
- Tono: empático, científico pero accesible, esperanzador, nunca genérico

Devuelve SOLO JSON válido sin markdown:
{"title":"","subtitle":"","tagline":"frase corta máx 10 palabras","intro":"500+ palabras","chapters":[{"number":1,"title":"","opening":"150+ palabras","content":"600+ palabras","keyPoints":["p1","p2","p3","p4"],"exercise":{"title":"","description":"","steps":["s1","s2","s3","s4","s5"]}}],"conclusion":"350+ palabras","actionPlan":["a1","a2","a3"],"authorNote":"100+ palabras","resources":["r1","r2","r3","r4"],"legalSection":{"healthDisclaimer":"${regs.healthDisclaimer}","guarantee":"${regs.guarantee}","dataProtection":"${regs.dataProtection}","copyright":"© ${year} ${author}. All rights reserved."}}`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: sys,
        messages: [{ role: 'user', content: `PROBLEMA: ${o.problema||o.problem}\nNECESIDAD: ${o.necesidad||o.need}\nPÚBLICO: ${o.rangoEdad||o.ageRange}, ${o.genero||o.gender}, ${countryName}\nTÍTULO: ${o.tituloEbook||o.ebookTitle}\nPROMESA: ${o.promesaEbook||o.ebookPromise}\nEMOCIÓN: ${o.emocion||o.emotion}\nDOLOR: ${o.dolorEmocional||o.emotionalPain}\nAUTOR: ${author}\nIDIOMA FINAL: ${o.idioma||o.language}\nPAÍS: ${countryName}` }]
      })
    });
    const d = await resp.json();
    const ebook = JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim());
    res.json({ success: true, ebook });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/translate-ebook', async (req, res) => {
  const { ebook, language, country, author } = req.body;
  const regs = getRegs(country);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: `Traductor literario experto en ${language} para ${country}. Traduce de español a ${language} de manera completamente nativa. NO traduzcas literalmente. Adapta culturalmente. Mantén "${author}" sin cambios. Regulaciones: ${regs.legal}. Devuelve SOLO JSON traducido con misma estructura. Sin markdown.`,
        messages: [{ role: 'user', content: JSON.stringify(ebook) }]
      })
    });
    const d = await resp.json();
    const translated = JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim());
    res.json({ success: true, ebook: translated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt: prompt + '. Professional commercial quality. No text. No watermarks. No faces.', n: 1, size: '1024x1024', quality: 'hd', style: 'natural' })
    });
    const d = await resp.json();
    if (d.data && d.data[0]) res.json({ success: true, url: d.data[0].url });
    else res.status(500).json({ success: false, error: 'No image' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-hotmart', async (req, res) => {
  const { opportunity, author, language } = req.body;
  const o = opportunity;
  const countryName = getCountryName(o.pais||o.country||'France');
  const regs = getRegs(countryName);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: `Copywriter experto Hotmart para Europa y USA. Todo en ${language} para ${countryName}. REGULACIONES: ${regs.legal}. Garantía: ${regs.guarantee}. PROHIBIDO: ${regs.forbidden}. Devuelve SOLO JSON: {"productName":"","headline":"","subheadline":"","shortDesc":"","longDesc":"400+palabras","benefits":["b1","b2","b3","b4","b5","b6"],"bullets":["b1","b2","b3","b4","b5","b6"],"salesPageTitle":"","salesPageBody":"600+palabras","guarantee":"${regs.guarantee}","bonus":["bonus1","bonus2","bonus3"],"upsell":"","orderBump":"","category":"","cta":"","facebookPost":"200+palabras","instagramCaption":"","instagramStory":"","emailSubject":"","emailBody":"300+palabras"}`,
        messages: [{ role: 'user', content: `Producto: ${o.tituloEbook||o.ebookTitle}\nPromesa: ${o.promesaEbook||o.ebookPromise}\nProblema: ${o.problema||o.problem}\nPúblico: ${o.rangoEdad||o.ageRange}, ${o.genero||o.gender}, ${countryName}\nPrecio: ${o.precioHotmart||o.hotmartPrice}\nAutor: ${author}\nEmoción: ${o.emocion||o.emotion}\nDolor: ${o.dolorEmocional||o.emotionalPain}` }]
      })
    });
    const d = await resp.json();
    const kit = JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async (req, res) => {
  const { opportunity, language } = req.body;
  const o = opportunity;
  const countryName = getCountryName(o.pais||o.country||'France');
  const regs = getRegs(countryName);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 5000,
        system: `Estratega Meta Ads para productos digitales Europa y USA. Todo en ${language} para ${countryName}. REGULACIONES: ${regs.legal}. PROHIBIDO: ${regs.forbidden}. Devuelve SOLO JSON: {"segmentation":{"age":"","gender":"","interests":["i1","i2","i3","i4","i5","i6"],"behaviors":["b1","b2","b3","b4"],"painPoints":["p1","p2","p3","p4","p5"],"excludeAudiences":["e1","e2","e3"],"lookalike":"","budget":""},"ads":[{"angle":"","platform":"","format":"","headline":"máx40chars","primaryText":"150-200palabras","description":"máx30chars","cta":"","dallePrompt":"prompt inglés DALL-E sin texto ni caras","targetEmotion":""}],"landingPage":{"headline":"","subheadline":"","body":"400+palabras","socialProof":"","cta":"","urgency":""},"retargeting":{"headline":"","copy":"","cta":"","offer":""},"emailSequence":[{"subject":"","body":"200+palabras"},{"subject":"","body":"200+palabras"},{"subject":"","body":"200+palabras"}]}. 5 anuncios: dolor,urgencia,testimonio,curiosidad,autoridad.`,
        messages: [{ role: 'user', content: `Producto: ${o.tituloEbook||o.ebookTitle}\nProblema: ${o.problema||o.problem}\nPúblico: ${o.rangoEdad||o.ageRange}, ${o.genero||o.gender}, ${countryName}\nEmoción: ${o.emocion||o.emotion}\nDolor: ${o.dolorEmocional||o.emotionalPain}\nPrecio: ${o.precioHotmart||o.hotmartPrice}` }]
      })
    });
    const d = await resp.json();
    const kit = JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildQueries(country, niche) {
  const b = [`most searched ${niche} problems in ${country} 2024`,`${country} ${niche} pain points Reddit forum`,`best selling ${niche} ebooks ${country} Amazon`,`${country} ${niche} questions Quora`,`${country} ${niche} YouTube most searched`,`${country} ${niche} forum help`];
  const loc = {'France':['comment soulager migraine rapidement','douleur chronique solution naturelle','anxiété insomnie remède naturel','ménopause prise de poids que faire','enfant autiste crise comment calmer','fatigue chronique femme solution'],'Germany':['Rückenschmerzen Lösung natürlich','Burnout Anzeichen was tun','Angstzustände Schlafprobleme Lösung','Wechseljahre Gewicht verlieren'],'Italy':['emicrania rimedi naturali efficaci','ansia insonnia soluzioni naturali','menopausa sintomi cura naturale'],'Spain':['migraña remedios naturales eficaces','ansiedad insomnio foro ayuda','menopausia síntomas soluciones'],'Portugal':['enxaqueca remédios naturais','ansiedade insónia fórum','menopausa sintomas soluções'],'United Kingdom':['chronic pain relief natural UK','anxiety insomnia help UK','menopause weight gain UK'],'Netherlands':['rugpijn oplossing natuurlijk','angststoornis slapeloosheid','overgangsklachten gewicht'],'Sweden':['ryggsmärta naturlig lösning','ångest sömnproblem','klimakteriet viktuppgång'],'Switzerland':['Rückenschmerzen Lösung Schweiz','Burnout Hilfe Schweiz','Wechseljahre Beschwerden'],'Austria':['Rückenschmerzen Lösung Österreich','Burnout Symptome Hilfe','Wechseljahre Gewicht'],'Poland':['ból pleców naturalne rozwiązanie','lęk bezsenność pomoc','menopauza przyrost wagi'],'USA':['chronic pain relief without medication','anxiety insomnia natural solutions','perimenopause symptoms Reddit','long covid fatigue solutions 2024']};
  if (loc[country]) b.push(...loc[country]);
  return b;
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FERNI AI Pro running on port ${PORT}`));
module.exports = app;
