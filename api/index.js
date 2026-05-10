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
        results.push(...(d.organic || []).map(x => ({ t: x.title, s: x.snippet, u: x.link, q: queries[i] })));
      }
    } catch (e) {}
  }
  const sys = `You are an AI Market Intelligence Analyst specializing in digital product monetization for Europe and USA. Analyze real web search results from ${country} in the "${niche}" niche. Return ONLY a valid JSON array of 6 opportunities sorted by monetizationScore descending. Each must have: problem, searchQuery, need, emotion, purchaseIntent, ageRange, gender, country, language, searchVolume, trend, competition, monetizationOpportunity, productType, ebookTitle, ebookPromise, hotmartPrice, monetizationScore, sourceURL, keyword, keywordES, emotionalPain, urgency, priorityLevel, whyThisOpportunity. No markdown, just JSON.`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: sys, messages: [{ role: 'user', content: `Country: ${country}\nNiche: ${niche}\nLanguage: ${language}\nSearch results:\n${results.slice(0, 20).map(r => `Q: ${r.q}\nTitle: ${r.t}\nSnippet: ${r.s}`).join('\n---\n')}` }] })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const opps = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, opportunities: opps });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: `Eres FERNI, AI experta en market intelligence y creación de ebooks vendibles para Europa y USA. Contexto: ${context}. Responde en español, conciso y accionable. Máximo 3 párrafos.`, messages: [{ role: 'user', content: message }] })
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
  const sys = `Eres un escritor profesional experto en ebooks vendibles para Europa y USA. Escribe en español. Genera un ebook COMPLETO con intro de 400+ palabras, 4 capítulos de 500+ palabras cada uno con ejercicios detallados, conclusión de 300+ palabras. Devuelve SOLO JSON válido: {title, subtitle, tagline, intro, chapters:[{number,title,opening,content,keyPoints,exercise:{title,description,steps}}], conclusion, actionPlan, authorNote, resources, disclaimer}`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 6000, system: sys, messages: [{ role: 'user', content: `Tema: ${o.problem}\nNecesidad: ${o.need}\nPúblico: ${o.ageRange}, ${o.gender}, ${o.country}\nTítulo: ${o.ebookTitle}\nPromesa: ${o.ebookPromise}\nEmoción: ${o.emotion}\nDolor: ${o.emotionalPain}\nAutor: ${author}` }] })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const ebook = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, ebook });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/translate-ebook', async (req, res) => {
  const { ebook, language, country, author } = req.body;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 6000, system: `Translate this ebook JSON from Spanish to ${language}. Keep exact JSON structure. Make it emotionally powerful and culturally adapted for ${country}. Keep author name "${author}" unchanged. Return ONLY valid JSON.`, messages: [{ role: 'user', content: JSON.stringify(ebook) }] })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const translated = JSON.parse(txt.replace(/```json|```/g, '').trim());
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
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd' })
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
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, system: `Expert Hotmart copywriter. Write ALL copy in ${language} for ${o.country}. Return ONLY valid JSON: {productName,headline,subheadline,shortDesc,longDesc,benefits,bullets,guarantee,bonus,upsell,orderBump,category,cta,facebookPost,instagramCaption,instagramStory,emailSubject,emailBody}`, messages: [{ role: 'user', content: `Product: ${o.ebookTitle}\nPromise: ${o.ebookPromise}\nProblem: ${o.problem}\nAudience: ${o.ageRange}, ${o.gender}, ${o.country}\nPrice: ${o.hotmartPrice}\nAuthor: ${author}` }] })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/generate-meta', async (req, res) => {
  const { opportunity, language } = req.body;
  const o = opportunity;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: `Expert Meta Ads strategist. Write ALL copy in ${language} for ${o.country}. Return ONLY valid JSON: {segmentation:{age,gender,interests,behaviors,painPoints,excludeAudiences},ads:[{angle,headline,primaryText,description,cta,dallePrompt,platform}x5],landingPage:{headline,subheadline,body,socialProof,cta},retargeting:{headline,copy,cta},emailSequence:[{subject,body}x3]}`, messages: [{ role: 'user', content: `Product: ${o.ebookTitle}\nProblem: ${o.problem}\nAudience: ${o.ageRange}, ${o.gender}, ${o.country}\nEmotion: ${o.emotion}\nPain: ${o.emotionalPain}\nPrice: ${o.hotmartPrice}` }] })
    });
    const d = await resp.json();
    const txt = d.content.map(c => c.text || '').join('');
    const kit = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.json({ success: true, kit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildQueries(country, niche) {
  const b = [`most searched ${niche} problems in ${country} 2024`, `${country} ${niche} pain points Reddit forum`, `best selling ${niche} ebooks ${country} Amazon`, `${country} ${niche} questions Quora`, `${country} ${niche} YouTube most searched`];
  const loc = { 'France': ['comment soulager migraine rapidement', 'douleur chronique solution naturelle', 'anxiété insomnie remède naturel', 'ménopause prise de poids que faire', 'enfant autiste crise comment calmer'], 'Germany': ['Rückenschmerzen Lösung natürlich', 'Burnout Anzeichen was tun', 'Angstzustände Schlafprobleme Lösung', 'Wechseljahre Gewicht verlieren'], 'Italy': ['emicrania rimedi naturali efficaci', 'ansia insonnia soluzioni naturali', 'menopausa sintomi cura naturale'], 'Spain': ['migraña remedios naturales eficaces', 'ansiedad insomnio foro ayuda', 'menopausia síntomas soluciones'], 'Portugal': ['enxaqueca remédios naturais', 'ansiedade insónia forum', 'menopausa sintomas soluções'], 'United Kingdom': ['chronic pain relief natural UK', 'anxiety insomnia help UK', 'menopause weight gain UK'], 'USA': ['chronic pain relief without medication', 'anxiety insomnia natural solutions', 'perimenopause symptoms Reddit', 'long covid fatigue solutions'] };
  if (loc[country]) b.push(...loc[country]);
  return b;
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FERNI AI running on port ${PORT}`));
module.exports = app;
