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
  'France': { legal:'RGPD, Loi Hamon (garantie 14 jours), Directive UE 2011/83', healthDisclaimer:'Ce guide est fourni à titre informatif uniquement et ne remplace pas l\'avis d\'un professionnel de santé.', guarantee:'Garantie satisfait ou remboursé 14 jours', dataProtection:'Données protégées conformément au RGPD.', forbidden:'Pas de promesses de résultats garantis en santé.', language:'French', currency:'EUR' },
  'Germany': { legal:'DSGVO, Heilmittelwerbegesetz HWG, UWG, Fernabsatzrecht', healthDisclaimer:'Dieser Leitfaden dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.', guarantee:'14-tägiges Widerrufsrecht', dataProtection:'Daten werden gemäß DSGVO verarbeitet.', forbidden:'Keine garantierten Heilversprechen.', language:'German', currency:'EUR' },
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

async function claudeCall(system, userContent, maxTokens = 4000) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }]
    })
  });
  const d = await resp.json();
  return d.content.map(c => c.text || '').join('');
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
  const sys = `Eres un analista senior de investigación de mercado especializado en productos digitales para Europa y USA.

IMPORTANTE: Responde TODO en ESPAÑOL. Todos los campos de texto deben estar en español.

Analiza los resultados de
