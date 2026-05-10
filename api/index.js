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
  'France': { legal:'RGPD, Loi Hamon (garantie 14 jours), Directive UE 2011/83, Code de la consommation', healthDisclaimer:'Ce guide est fourni à titre informatif uniquement et ne remplace pas l\'avis d\'un professionnel de santé. Consultez votre médecin avant tout changement.', guarantee:'Garantie satisfait ou remboursé 14 jours conformément à la loi Hamon', dataProtection:'Données protégées conformément au RGPD. Droit d\'accès, rectification et suppression garanti.', forbidden:'Pas de promesses de résultats garantis en santé. Pas de claims médicaux non prouvés.', language:'French', currency:'EUR' },
  'Germany': { legal:'DSGVO, Heilmittelwerbegesetz HWG, UWG, Fernabsatzrecht', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung. Konsultieren Sie immer einen Arzt.', guarantee:'14-tägiges Widerrufsrecht gemäß deutschem Fernabsatzrecht', dataProtection:'Daten werden gemäß DSGVO verarbeitet.', forbidden:'Keine garantierten Heilversprechen. Keine irreführende Werbung gemäß HWG.', language:'German', currency:'EUR' },
  'Italy': { legal:'GDPR italiano, Codice del Consumo D.lgs 206/2005, Direttiva UE 2011/83', healthDisclaimer:'Questa guida ha scopo puramente informativo e non sostituisce il parere medico. Consultare sempre un medico prima di modificare il proprio stile di vita.', guarantee:'Diritto di recesso 14 giorni ai sensi del Codice del Consumo', dataProtection:'Dati trattati in conformità al GDPR.', forbidden:'Vietate promesse di risultati garantiti in salute.', language:'Italian', currency:'EUR' },
  'Spain': { legal:'LOPDGDD, LGDCU, LSSI, Directiva UE 2011/83', healthDisclaimer:'Esta guía tiene fines exclusivamente informativos y no sustituye el consejo médico. Consulte a su médico antes de realizar cambios en su estilo de vida.', guarantee:'Derecho de desistimiento 14 días conforme a normativa europea', dataProtection:'Datos protegidos conforme a LOPDGDD y RGPD.', forbidden:'Prohibidas promesas de resultados garantizados en salud.', language:'Spanish', currency:'EUR' },
  'Portugal': { legal:'RGPD, Lei de Defesa do Consumidor, Decreto-Lei 24/2014', healthDisclaimer:'Este guia tem fins exclusivamente informativos e não substitui o aconselhamento médico.', guarantee:'Direito de arrependimento 14 dias', dataProtection:'Dados protegidos de acordo com o RGPD.', forbidden:'Proibidas promessas de resultados garantidos em saúde.', language:'Portuguese', currency:'EUR' },
  'United Kingdom': { legal:'UK GDPR, Consumer Rights Act 2015, ASA Advertising Standards', healthDisclaimer:'This guide is for informational purposes only and does not replace professional medical advice. Always consult your doctor before making lifestyle changes.', guarantee:'14-day cooling-off period under UK Consumer Rights Act', dataProtection:'Data protected under UK GDPR.', forbidden:'No guaranteed health claims. No misleading advertising per ASA.', language:'English', currency:'GBP' },
  'Netherlands': { legal:'AVG GDPR, Wet handhaving consumentenbescherming', healthDisclaimer:'Deze gids is uitsluitend informatief en vervangt geen professioneel medisch advies.', guarantee:'14 dagen bedenktijd conform Europese regelgeving', dataProtection:'Persoonsgegevens verwerkt conform AVG.', forbidden:'Geen gegarandeerde gezondheidsbeloften.', language:'Dutch', currency:'EUR' },
  'Belgium': { legal:'RGPD Belgique, Code de droit économique', healthDisclaimer:'Ce guide est fourni à titre informatif et ne remplace pas l\'avis médical professionnel.', guarantee:'Droit de rétractation 14 jours', dataProtection:'Données protégées conformément au RGPD.', forbidden:'Pas de promesses de résultats garantis en santé.', language:'French', currency:'EUR' },
  'Sweden': { legal:'GDPR Sverige, Konsumentköplagen, Distansavtalslagen', healthDisclaimer:'Denna guide är endast informativ och ersätter inte professionell medicinsk rådgivning.', guarantee:'14 dagars ångerrätt enligt distansavtalslagen', dataProtection:'Personuppgifter behandlas enligt GDPR.', forbidden:'Inga garanterade hälsoresultat.', language:'Swedish', currency:'SEK' },
  'Switzerland': { legal:'nDSG, OR Obligationenrecht, UWG', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.', guarantee:'14-tägiges Widerrufsrecht', dataProtection:'Daten gemäß nDSG geschützt.', forbidden:'Keine Heilversprechen.', language:'German', currency:'CHF' },
  'Austria': { legal:'DSGVO Österreich, Konsumentenschutzgesetz, ECG', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.', guarantee:'14-tägiges Rücktrittsrecht', dataProtection:'Daten gemäß DSGVO verarbeitet.', forbidden:'Keine garantierten Heilversprechen.', language:'German', currency:'EUR' },
  'Poland': { legal:'RODO GDPR Polska, Ustawa o prawach konsumenta', healthDisclaimer:'Ten przewodnik służy wyłącznie celom informacyjnym i nie zastępuje porady medycznej.', guarantee:'14-dniowe prawo do odstąpienia od umowy', dataProtection:'Dane chronione zgodnie z RODO.', forbidden:'Zakaz gwarantowanych obietnic zdrowotnych.', language:'Polish', currency:'PLN' },
  'USA': { legal:'FTC Regulations, CAN-SPAM Act, CCPA California', healthDisclaimer:'This guide is for informational purposes only. Results may vary. Consult your healthcare provider before making health-related decisions. These statements have not been evaluated by the FDA.', guarantee:'30-day money-back guarantee as required by FTC guidelines', dataProtection:'Data protected per Privacy Policy. California residents have additional rights under CCPA.', forbidden:'No guaranteed health results per FTC. Must include income/results disclaimers.', language:'English', currency:'USD' },
  'Canada': { legal:'PIPEDA, CASL Anti-Spam, Consumer Protection Acts by province', healthDisclaimer:'This guide is for informational purposes only and does not replace professional medical advice.', guarantee:'Satisfaction guarantee per provincial consumer protection laws', dataProtection:'Data protected under PIPEDA.', forbidden:'No guaranteed health claims. Comply with CASL.', language:'English', currency:'CAD' }
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  const parts = countryStr.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : countryStr;
}

function getRegs(country) {
  return REGS[country] || REGS['France'];
}

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
  const sys = `You are a senior market research analyst specialized in digital products for Europe and USA. Analyze real search results and extract ONLY genuine monetizable problems people have in ${country} regarding ${niche}. Remove all noise. Focus on real human problems with purchase intent. Return ONLY valid JSON array of 6 opportunities sorted by monetizationScore descending. Each: {problem,searchQuery,need,emotion,purchaseIntent,ageRange,gender,country,language,searchVolume,trend,competition,monetizationOpportunity,productType,ebookTitle,ebookPromise,hotmartPrice,monetizationScore,sourceURL,keyword,keywordES,emotionalPain,urgency,priorityLevel,whyThisOpportunity}`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Country: ${country}\nNiche: ${niche}\nLanguage: ${language}\n\nSerper results:\n${results.slice(0,25).map(r=>`QUERY: ${r.query}\nTITLE: ${r.title}\nSNIPPET: ${r.snippet}`).join('\n---\n')}` }
      ],
      temperature: 0.3,
      max_tokens: 4000
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
        system: `Eres FERNI, AI experta en market intelligence y creación de ebooks vendibles para Europa y USA. Contexto: ${context}. Responde en español, conciso y accionable. Máximo 3 párrafos.`,
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
  const countryName = getCountryName(o.country);
  const regs = getRegs(countryName);
  const year = new Date().getFullYear();
  const sys = `Eres un escritor profesional de bestsellers de no-ficción para el mercado europeo y americano. MISIÓN: Crear un ebook COMPLETO en español que sea tan bueno que el lector sienta que ya recuperó su inversión con solo leer la introducción.

REGULACIONES OBLIGATORIAS PARA ${countryName.toUpperCase()}:
Marco legal: ${regs.legal}
Disclaimer salud: "${regs.healthDisclaimer}"
Garantía: "${regs.guarantee}"
Protección datos: "${regs.dataProtection}"
PROHIBIDO: ${regs.forbidden}

CALIDAD NIVEL BESTSELLER:
- Introducción 500+ palabras emocionalmente poderosas
- Cada capítulo: historia apertura 150+ palabras + contenido 600+ palabras + puntos clave + ejercicio 5 pasos
- Tono: empático, científico pero accesible, esperanzador
- Específico para el problema detectado, nunca genérico

Devuelve SOLO JSON válido sin markdown:
{"title":"","subtitle":"","tagline":"frase corta máx 10 palabras","intro":"500+ palabras","chapters":[{"number":1,"title":"","opening":"150+ palabras historia apertura","content":"600+ palabras contenido real","keyPoints":["punto 1","punto 2","punto 3","punto 4"],"exercise":{"title":"","description":"","steps":["paso 1","paso 2","paso 3","paso 4","paso 5"]}}],"conclusion":"350+ palabras","actionPlan":["acción semana","acción mes","acción 3 meses"],"authorNote":"100+ palabras nota personal","resources":["recurso 1","recurso 2","recurso 3","recurso 4"],"legalSection":{"healthDisclaimer":"${regs.healthDisclaimer}","guarantee":"${regs.guarantee}","dataProtection":"${regs.dataProtection}","copyright":"© ${year} ${author}. All rights reserved."}}

Genera 4 capítulos completos.`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: sys,
        messages: [{ role: 'user', content: `PROBLEMA: ${o.problem}\nNECESIDAD: ${o.need}\nPÚBLICO: ${o.ageRange}, ${o.gender}, ${countryName}\nTÍTULO: ${o.ebookTitle}\nPROMESA: ${o.ebookPromise}\nEMOCIÓN: ${o.emotion}\nDOLOR: ${o.emotionalPain}\nEVIDENCIA: ${o.whyThisOpportunity}\nAUTOR: ${author}\nIDIOMA BORRADOR: Español\nIDIOMA FINAL: ${o.language}\nPAÍS: ${countryName}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const ebook = JSON.parse(txt.replace(/```json|```/g,'').trim());
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
        system: `Eres un traductor literario experto en ${language} para ${country}. Traduce este ebook de español a ${language} de manera completamente nativa. NO traduzcas literalmente. Adapta culturalmente. El lector NO debe saber que fue traducido. Mantén el nombre "${author}" sin cambios. Regulaciones de ${country}: ${regs.legal}. Devuelve SOLO el JSON traducido con la misma estructura. Sin markdown.`,
        messages: [{ role: 'user', content: JSON.stringify(ebook) }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const translated = JSON.parse(txt.replace(/```json|```/g,'').trim());
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
    else res.status(500).json({ success: false, error: 'No image', details: d });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-hotmart', async (req, res) => {
  const { opportunity, author, language } = req.body;
  const o = opportunity;
  const countryName = getCountryName(o.country);
  const regs = getRegs(countryName);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: `Eres un copywriter experto en ventas digitales en Hotmart para Europa y USA. Escribe TODO en ${language} para ${countryName}. Copy emocionalmente poderoso y legalmente correcto. REGULACIONES: ${regs.legal}. Garantía obligatoria: ${regs.guarantee}. PROHIBIDO: ${regs.forbidden}. Devuelve SOLO JSON: {"productName":"","headline":"","subheadline":"","shortDesc":"150 palabras","longDesc":"400+ palabras","benefits":["b1","b2","b3","b4","b5","b6"],"bullets":["b1","b2","b3","b4","b5","b6"],"salesPageTitle":"","salesPageBody":"600+ palabras","guarantee":"${regs.guarantee}","bonus":["bonus1","bonus2","bonus3"],"upsell":"","orderBump":"","category":"","cta":"","facebookPost":"200+ palabras","instagramCaption":"con emojis y hashtags","instagramStory":"","emailSubject":"","emailBody":"300+ palabras"}`,
        messages: [{ role: 'user', content: `Producto: ${o.ebookTitle}\nPromesa: ${o.ebookPromise}\nProblema: ${o.problem}\nPúblico: ${o.ageRange}, ${o.gender}, ${countryName}\nPrecio: ${o.hotmartPrice}\nAutor: ${author}\nEmoción: ${o.emotion}\nDolor: ${o.emotionalPain}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g,'').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async (req, res) => {
  const { opportunity, language } = req.body;
  const o = opportunity;
  const countryName = getCountryName(o.country);
  const regs = getRegs(countryName);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 5000,
        system: `Eres estratega experto en Meta Ads para productos digitales en Europa y USA. Todo en ${language} para ${countryName}. REGULACIONES: ${regs.legal}. PROHIBIDO EN ANUNCIOS: ${regs.forbidden}. Devuelve SOLO JSON: {"segmentation":{"age":"","gender":"","interests":["i1","i2","i3","i4","i5","i6"],"behaviors":["b1","b2","b3","b4"],"painPoints":["p1","p2","p3","p4","p5"],"excludeAudiences":["e1","e2","e3"],"lookalike":"","budget":""},"ads":[{"angle":"","platform":"","format":"","headline":"máx 40 chars","primaryText":"150-200 palabras","description":"máx 30 chars","cta":"","dallePrompt":"prompt inglés DALL-E sin texto ni caras","targetEmotion":""}],"landingPage":{"headline":"","subheadline":"","body":"400+ palabras","socialProof":"","cta":"","urgency":""},"retargeting":{"headline":"","copy":"","cta":"","offer":""},"emailSequence":[{"subject":"","body":"200+ palabras"},{"subject":"","body":"200+ palabras"},{"subject":"","body":"200+ palabras"}]}. Genera 5 anuncios: dolor, urgencia, testimonio, curiosidad, autoridad.`,
        messages: [{ role: 'user', content: `Producto: ${o.ebookTitle}\nProblema: ${o.problem}\nPúblico: ${o.ageRange}, ${o.gender}, ${countryName}\nEmoción: ${o.emotion}\nDolor: ${o.emotionalPain}\nPrecio: ${o.hotmartPrice}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g,'').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildQueries(country, niche) {
  const b = [`most searched ${niche} problems in ${country} 2024`,`${country} ${niche} pain points Reddit forum`,`best selling ${niche} ebooks ${country} Amazon`,`${country} ${niche} questions Quora`,`${country} ${niche} YouTube most searched`,`${country} ${niche} forum help`];
  const loc = {'France':['comment soulager migraine rapidement','douleur chronique solution naturelle','anxiété insomnie remède naturel','ménopause prise de poids que faire','enfant autiste crise comment calmer'],'Germany':['Rückenschmerzen Lösung natürlich','Burnout Anzeichen was tun','Angstzustände Schlafprobleme Lösung','Wechseljahre Gewicht verlieren'],'Italy':['emicrania rimedi naturali efficaci','ansia insonnia soluzioni naturali','menopausa sintomi cura naturale'],'Spain':['migraña remedios naturales eficaces','ansiedad insomnio foro ayuda','menopausia síntomas soluciones'],'Portugal':['enxaqueca remédios naturais','ansiedade insónia fórum','menopausa sintomas soluções'],'United Kingdom':['chronic pain relief natural UK','anxiety insomnia help UK','menopause weight gain UK'],'Netherlands':['rugpijn oplossing natuurlijk','angststoornis slapeloosheid','overgangsklachten gewicht'],'Sweden':['ryggsmärta naturlig lösning','ångest sömnproblem','klimakteriet viktuppgång'],'Switzerland':['Rückenschmerzen Lösung Schweiz','Burnout Hilfe Schweiz','Wechseljahre Beschwerden'],'Austria':['Rückenschmerzen Lösung Österreich','Burnout Symptome Hilfe','Wechseljahre Gewicht'],'Poland':['ból pleców naturalne rozwiązanie','lęk bezsenność pomoc','menopauza przyrost wagi'],'USA':['chronic pain relief without medication','anxiety insomnia natural solutions','perimenopause symptoms Reddit','long covid fatigue solutions 2024']};
  if (loc[country]) b.push(...loc[country]);
  return b;
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FERNI AI Pro running on port ${PORT}`));
module.exports = app;
