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

// ============================================================
// SEARCH ENDPOINT
// ============================================================
app.post('/api/search', async (req, res) => {
  const { country, niche, language } = req.body;
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
        results.push(...(d.organic || []).map(x => ({
          t: x.title, s: x.snippet, u: x.link, q: queries[i]
        })));
      }
    } catch (e) {}
  }

  const sys = `You are an AI Market Intelligence Analyst specializing in digital product monetization for Europe and USA. Analyze real web search results from ${country} in the "${niche}" niche. Return ONLY a valid JSON array of 6 opportunities sorted by monetizationScore descending. Each must have ALL these fields: problem, searchQuery, need, emotion, purchaseIntent, ageRange, gender, country, language, searchVolume, trend, competition, monetizationOpportunity, productType, ebookTitle, ebookPromise, hotmartPrice, monetizationScore (1-100), sourceURL, keyword, keywordES, emotionalPain, urgency, priorityLevel, whyThisOpportunity. No markdown, just JSON array.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: sys,
        messages: [{ role: 'user', content: `Country: ${country}\nNiche: ${niche}\nLanguage: ${language}\nSearch results:\n${results.slice(0, 20).map(r => `Q: ${r.q}\nTitle: ${r.t}\nSnippet: ${r.s}\nURL: ${r.u}`).join('\n---\n')}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const opps = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, opportunities: opps, searchCount: results.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// CHAT ENDPOINT
// ============================================================
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Eres FERNI, una AI experta en market intelligence, creación de ebooks vendibles y marketing digital para Europa y USA. Eres directa, profesional, empática y muy útil. Contexto actual: ${context}. Responde SIEMPRE en español, de forma concisa y accionable. Máximo 3 párrafos cortos.`,
        messages: [{ role: 'user', content: message }]
      })
    });
    const d = await resp.json();
    const reply = d.content.map(c => c.text || '').join('');
    res.json({ success: true, reply });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// GENERATE EBOOK ENDPOINT
// ============================================================
app.post('/api/generate-ebook', async (req, res) => {
  const { opportunity, author } = req.body;
  const o = opportunity;

  const sys = `Eres un escritor profesional experto en ebooks de no-ficción vendibles para el mercado europeo y USA. Escribe SIEMPRE en español (es el borrador para revisión del autor).

Genera un ebook COMPLETO, profesional y emocionalmente poderoso. Cada capítulo debe tener MÍNIMO 500 palabras de contenido real, específico y accionable. El contenido debe ser tan bueno que el lector sienta que ya vale su dinero solo con leer la introducción.

REGLAS DE ESCRITURA:
- Tono: cálido, empático, directo y esperanzador
- Cada capítulo comienza con una historia real o escenario identificable
- Incluye datos, estudios o referencias específicas cuando sea posible
- Los ejercicios deben ser muy específicos con pasos numerados
- La introducción debe hacer llorar o sentir profundamente identificado al lector

Devuelve SOLO JSON válido con esta estructura exacta:
{
  "title": "título del ebook",
  "subtitle": "subtítulo vendedor",
  "tagline": "frase corta impactante para la portada",
  "intro": "introducción emotiva de 400+ palabras",
  "chapters": [
    {
      "number": 1,
      "title": "título del capítulo",
      "opening": "párrafo de apertura con historia o escenario de 100+ palabras",
      "content": "contenido principal de 500+ palabras",
      "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
      "exercise": {
        "title": "título del ejercicio",
        "description": "descripción del ejercicio",
        "steps": ["paso 1", "paso 2", "paso 3", "paso 4", "paso 5"]
      }
    }
  ],
  "conclusion": "conclusión motivadora de 300+ palabras",
  "actionPlan": ["acción 1 para esta semana", "acción 2 para este mes", "acción 3 para los próximos 90 días"],
  "authorNote": "nota personal del autor",
  "resources": ["recurso 1", "recurso 2", "recurso 3"],
  "disclaimer": "aviso legal"
}

Genera 4 capítulos completos. IMPORTANTE: devuelve SOLO el JSON, sin markdown.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: sys,
        messages: [{
          role: 'user',
          content: `Escribe el ebook completo con estas especificaciones:
Tema: ${o.problem}
Necesidad real: ${o.need}
Público: ${o.ageRange}, ${o.gender}, ${o.country}
Título: ${o.ebookTitle}
Promesa: ${o.ebookPromise}
Emoción principal: ${o.emotion}
Dolor emocional: ${o.emotionalPain}
Autor: ${author}
Idioma del borrador: Español
Idioma final al aprobar: ${o.language}`
        }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const ebook = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// TRANSLATE EBOOK ENDPOINT
// ============================================================
app.post('/api/translate-ebook', async (req, res) => {
  const { ebook, language, country, author } = req.body;

  const sys = `Translate this ebook JSON from Spanish to ${language}. Keep the exact JSON structure. Make the translation emotionally powerful, natural and culturally adapted for ${country}. Keep the author name "${author}" unchanged. The translation must feel like it was originally written in ${language}, not translated. Return ONLY valid JSON, no markdown.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: sys,
        messages: [{ role: 'user', content: JSON.stringify(ebook) }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const translated = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook: translated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// GENERATE IMAGE (DALL-E)
// ============================================================
app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd' })
    });
    const d = await resp.json();
    if (d.data && d.data[0]) {
      res.json({ success: true, url: d.data[0].url });
    } else {
      res.status(500).json({ success: false, error: 'No image generated' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// GENERATE HOTMART KIT
// ============================================================
app.post('/api/generate-hotmart', async (req, res) => {
  const { opportunity, author, language } = req.body;
  const o = opportunity;

  const sys = `You are an expert Hotmart copywriter and digital marketing strategist. Write ALL copy in ${language} for ${o.country}. The copy must be emotionally powerful, persuasive and culturally adapted. Return ONLY valid JSON with this exact structure: {productName, headline, subheadline, shortDesc, longDesc, benefits(array of 6 items), bullets(array of 6 items), salesPageTitle, salesPageBody, guarantee, bonus(array of 3), upsell, orderBump, category, cta, price, facebookPost, instagramCaption, instagramStory, emailSubject, emailBody}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: sys,
        messages: [{ role: 'user', content: `Product: ${o.ebookTitle}\nPromise: ${o.ebookPromise}\nProblem: ${o.problem}\nAudience: ${o.ageRange}, ${o.gender}, ${o.country}\nPrice: ${o.hotmartPrice}\nAuthor: ${author}\nEmotion: ${o.emotion}\nPain: ${o.emotionalPain}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// GENERATE META ADS KIT
// ============================================================
app.post('/api/generate-meta', async (req, res) => {
  const { opportunity, language } = req.body;
  const o = opportunity;

  const sys = `You are an expert Meta Ads strategist and copywriter. Write ALL copy in ${language} for ${o.country}. Return ONLY valid JSON: {segmentation:{age,gender,interests(array 6),behaviors(array 4),painPoints(array 5),excludeAudiences(array 3)}, ads(array of 5, each with: angle, headline, primaryText, description, cta, dallePrompt, platform), landingPage:{headline,subheadline,body,socialProof,cta}, retargeting:{headline,copy,cta}, emailSequence:[{subject,body}x3]}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY || OPENAI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: sys,
        messages: [{ role: 'user', content: `Product: ${o.ebookTitle}\nPromise: ${o.ebookPromise}\nProblem: ${o.problem}\nAudience: ${o.ageRange}, ${o.gender}, ${o.country}\nEmotion: ${o.emotion}\nPain: ${o.emotionalPain}\nPrice: ${o.hotmartPrice}\nKeyword: ${o.keyword}` }]
      })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// HELPERS
// ============================================================
function buildQueries(country, niche) {
  const b = [
    `most searched ${niche} problems in ${country} 2024`,
    `${country} ${niche} pain points Reddit forum`,
    `best selling ${niche} ebooks ${country} Amazon`,
    `${country} ${niche} questions Quora`,
    `${country} ${niche} YouTube most searched`,
    `${country} ${niche} forum problems help`
  ];
  const loc = {
    'France': ['comment soulager migraine rapidement', 'douleur chronique solution naturelle', 'anxiété insomnie remède naturel', 'ménopause prise de poids que faire', 'enfant autiste crise comment calmer', 'fatigue chronique femme solution'],
    'Germany': ['Rückenschmerzen Lösung natürlich', 'Burnout Anzeichen was tun', 'Angstzustände Schlafprobleme Lösung', 'Wechseljahre Gewicht verlieren', 'Erschöpfung chronisch was hilft'],
    'Italy': ['emicrania rimedi naturali efficaci', 'ansia insonnia soluzioni naturali', 'menopausa sintomi cura naturale', 'dolore cronico schiena soluzione'],
    'Spain': ['migraña remedios naturales eficaces', 'ansiedad insomnio foro ayuda', 'menopausia síntomas soluciones', 'dolor crónico espalda ejercicios'],
    'Portugal': ['enxaqueca remédios naturais', 'ansiedade insónia forum', 'menopausa sintomas soluções'],
    'United Kingdom': ['chronic pain relief natural UK', 'anxiety insomnia help UK', 'menopause weight gain UK', 'burnout recovery UK'],
    'USA': ['chronic pain relief without medication', 'anxiety insomnia natural solutions', 'perimenopause symptoms Reddit', 'burnout recovery protocol', 'long covid fatigue solutions'],
    'Netherlands': ['rugpijn oplossing natuurlijk', 'angststoornis slapeloosheid', 'overgangsklachten gewicht'],
    'Sweden': ['ryggsmärta naturlig lösning', 'ångest sömnproblem', 'klimakteriet viktuppgång'],
    'Poland': ['ból pleców naturalne rozwiązanie', 'lęk bezsenność forum', 'menopauza przyrost wagi']
  };
  if (loc[country]) b.push(...loc[country]);
  return b;
}

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FERNI AI running on port ${PORT}`));

module.exports = app;
