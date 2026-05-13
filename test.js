// Script de prueba para FERNI AI - Búsqueda belleza en Francia
const fetch = require('node-fetch');
const fs = require('fs');

// Simular las funciones necesarias (copiadas de index.js para prueba)
const SERPER_KEY = process.env.SERPER_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

const REGS = {
  France: { legal: 'RGPD, Loi Hamon garantie 14 jours, Directive UE 2011/83', healthDisclaimer: 'Ce guide est fourni a titre informatif uniquement et ne remplace pas lavis dun professionnel de sante.', guarantee: 'Garantie satisfait ou rembourse 14 jours', dataProtection: 'Donnees protegees conformement au RGPD.', forbidden: 'Pas de promesses de resultats garantis en sante.', language: 'French', currency: 'EUR' }
};

function getCountryName(countryStr) {
  if (!countryStr) return 'France';
  const parts = countryStr.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : countryStr;
}

function getRegs(country) { return REGS[country] || REGS.France; }

// Funciones de búsqueda (simplificadas para prueba)
async function serperTrends(keyword, country) {
  try {
    const r1 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword + ' tendances 2024 2025 ' + country, num: 8, tbs: 'qdr:m' })
    });

    const r2 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword + ' tendances emergentes 2025 ' + country, num: 6, tbs: 'qdr:m' })
    });

    const r3 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'qué busca la gente sobre ' + keyword + ' ' + country + ' 2025', num: 6, tbs: 'qdr:m' })
    });

    const results = [];

    if (r1.ok) {
      const d1 = await r1.json();
      (d1.organic || []).slice(0, 4).forEach(function(x) {
        results.push({ title: x.title, snippet: x.snippet, url: x.link, source: 'trends_main', query: 'TRENDS: ' + keyword });
      });
    }

    if (r2.ok) {
      const d2 = await r2.json();
      (d2.organic || []).slice(0, 3).forEach(function(x) {
        results.push({ title: x.title, snippet: x.snippet, url: x.link, source: 'trends_rising', query: 'RISING: ' + keyword });
      });
    }

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

async function searchWithSerper(country, niche, language) {
  const topic = niche || 'tendencias digitales';
  const allResults = [];

  // Búsquedas Google orgánicas
  const queries = ['belleza tendencias France 2024', 'comment prendre soin de sa peau France', 'cosmetiques naturels France', 'routines beaute France'];
  for (var i = 0; i < queries.length; i++) {
    var r = await serperSearch(queries[i]);
    r.forEach(function(x) { allResults.push(x); });
  }

  // Google Trends PREMIUM
  const trends1 = await serperTrends(topic, country);
  const trends2 = await serperTrends(topic + ' futuro 2025', country);
  const trends3 = await serperTrends(topic + ' tendencias emergentes', country);
  const allTrends = [...trends1, ...trends2, ...trends3];
  allTrends.forEach(function(x) { allResults.push(x); });

  return allResults;
}

// Ejecutar prueba
async function test() {
  console.log('Iniciando prueba de búsqueda: belleza en Francia...');
  const results = await searchWithSerper('France', 'belleza', 'French');
  console.log('Resultados encontrados:', results.length);
  console.log('Muestra de resultados:');
  results.slice(0, 10).forEach((r, i) => {
    console.log(`${i+1}. [${r.source}] ${r.title}`);
    console.log(`   ${r.snippet}`);
    console.log(`   Query: ${r.query}`);
    console.log('---');
  });

  // Guardar resultados en archivo
  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en test_results.json');
}

test().catch(console.error);