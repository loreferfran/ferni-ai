# Progreso FERNI AI — Estado Actual (13 Mayo 2026)

## ÚLTIMOS COMMITS
- `03a6838` — Integrar DataForSEO: volumen real de búsquedas por país y nicho
- `626ae8a` — Fix: pre-seleccionar idioma en selector al generar/regenerar ebook

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción), OpenAI GPT-4o (análisis), Serper (búsqueda), DALL-E (imágenes), DataForSEO (volumen real)
- **Deploy**: Vercel → ferni-ai.vercel.app (auto-deploy desde GitHub master)
- **Repo**: https://github.com/loreferfran/ferni-ai

## Flujo Actual de la App (DEFINITIVO)
```
1. Usuario elige país + nicho → EJECUTAR ANÁLISIS
2. Serper API busca (Google + Reddit + YouTube + Amazon)
3. Google Trends real (score 0-100, rising queries, Breakout +5000%) con fallback a Serper
4. DataForSEO consulta volumen real de Google Ads (en paralelo con Serper)
5. OpenAI GPT-4o analiza resultados + volúmenes reales → 10 oportunidades con scoreMonetizacion
6. Usuario selecciona oportunidad → Generar borrador ebook
7. Claude genera en 3 partes (p1: intro+cap1+cap2, p2: cap3+cap4, p3: conclusión)
   → SIEMPRE EN ESPAÑOL, Claude NO ve el idioma de destino en este paso
8. Preview en iframe del borrador en ESPAÑOL
9. Usuario hace correcciones via chat (1 llamada Claude barata, solo manda resumen)
10. Usuario genera imágenes por slot (DALL-E, clic en cada slot)
11. Usuario elige idioma en el selector (pre-seleccionado con idioma del país, editable)
12. APROBAR → Claude traduce al idioma elegido (/api/translate-custom)
13. Preview del PDF final traducido
14. Descarga PDF final
```

## Módulo Traducción (tab 🌍)
- Tab separado para traducir a CUALQUIER idioma (independiente del flujo de país)
- Selector con 28 idiomas: inglés, francés, alemán, italiano, portugués, chino, japonés, coreano, árabe, ruso, turco, polaco, holandés, sueco, noruego, danés, finlandés, griego, rumano, húngaro, checo, tailandés, vietnamita, indonesio, hebreo, hindi, español España
- Útil para reutilizar un ebook ya creado en otro mercado sin repetir todo el proceso

## Por Qué Claude Ya No Mezcla Idiomas
- Borrador: Claude solo recibe instrucción "ESCRIBE EN ESPAÑOL CASTELLANO" — no sabe nada del idioma de destino
- Traducción: ocurre DESPUÉS del borrador, en llamada separada, cuando ya todo está aprobado
- S.approvedLang: variable de estado que guarda el idioma elegido al aprobar
- Eliminada la detección automática de idioma por país en approveEbook()

## DataForSEO — Integración (sesión 13 Mayo)
- ✅ Credenciales: DATAFORSEO_LOGIN y DATAFORSEO_PASSWORD en Vercel env vars
- ✅ DFS_LOCATION_CODES: 26 países con códigos de ubicación Google Ads
- ✅ DFS_LANG_CODES: 15 idiomas con códigos
- ✅ buildSeedKeywords(): genera ~15 keywords semilla por nicho+idioma
- ✅ getDataForSEOVolumes(): llama /v3/keywords_data/google_ads/search_volume/live
  - Auth Basic, retorna volumen, CPC y competencia reales
  - Fallback silencioso si falla (no rompe el flujo)
- ✅ /api/search: Serper + DataForSEO en paralelo (Promise.all)
- ✅ analyzeWithGPT4(): inyecta sección de volúmenes reales al inicio del mensaje
  - Regla: >10.000/mes=alto, 1.000-10.000=medio, <1.000=bajo
- ✅ Respuesta incluye dfsKeywords: N para confirmar cuántas keywords se obtuvieron

## Cambios Implementados (sesión 13 Mayo — completo)

### Backend (api/index.js)
- ✅ DataForSEO integrado (ver sección arriba)
- ✅ NICHE_TRANSLATIONS: 20 nichos × 8 idiomas para búsquedas en idioma local
- ✅ buildEbookSystem(): bloque de instrucción absoluta de idioma (20 líneas con checklist)
- ✅ GPT-4o: 10 oportunidades, temperatura 0.5, sin filtro estricto, estacionalidad
- ✅ /api/translate-custom: traduce ebook a cualquier idioma (2 llamadas Claude × 7000 tokens)

### Frontend (public/index.html)
- ✅ dlFinalEbook(): "par/by/von" → variable por idioma (por/par/von/di/by)
- ✅ dlFinalEbook(): "Introduction"/"Conclusion" hardcoded → variables multiidioma
- ✅ buildFinalPdfHtml(): variables isEs/isFr/isDe declaradas ANTES de usarse (fix hoisting)
- ✅ lblIntro, lblConcl, lblRights: multiidioma completo
- ✅ approveEbook(): lee selector #eb-lang-sel, guarda en S.approvedLang
- ✅ renderDraft(): pre-selecciona idioma del país en el selector
- ✅ Nuevo tab 🌍 Traducción con 28 idiomas
- ✅ translateCustom() y restoreTranslateTab() y dlTranslated()
- ✅ Eliminado botón "Corregir PDF" y campo "Pseudónimo de autor"

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅ (lorenacardenascarrasco@gmail.com)
- DATAFORSEO_PASSWORD ✅ (agregado 13 Mayo 2026)

## Estado de Archivos Clave
- **api/index.js**: Búsqueda, análisis GPT-4o, generación Claude, correcciones, imágenes, translate-ebook, translate-custom, DataForSEO
- **public/index.html**: Toda la UI + lógica frontend + buildFinalPdfHtml + formatContent parser + módulo traducción

## Notas Técnicas
- **Generar PDF completo**: 3 llamadas Claude × 8000 tokens (costoso, usar solo si necesario)
- **Corregir PDF (chat)**: 1 llamada Claude × 1000 tokens (barato, usa solo resumen del ebook)
- **Traducir ebook**: 2 llamadas Claude × 7000 tokens (translate-custom)
- **DataForSEO**: ~$0.002 por keyword consultada. buildSeedKeywords() genera máx 15 keywords/búsqueda
- **Google Trends**: si falla en Vercel (IP bloqueada), cae automáticamente a Serper
- **Formato**: Claude usa • para listas y | col | para tablas; el frontend las parsea a HTML

## Próximos Pasos
- 🔄 Probar flujo completo: búsqueda → oportunidad → borrador → corrección → elegir idioma → traducir → descarga
- 🔄 Verificar que DataForSEO retorna volúmenes reales (revisar campo dfsKeywords en respuesta)
- 🔄 Probar slots de imágenes (clic → DALL-E → inserta en PDF)
- 🔄 Probar Google Trends real en Vercel (puede bloquearse por IP)
- 🔄 Verificar que formato de tablas y listas se genera correctamente en el PDF

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
4. Revisar Vercel si hay errores de deploy en ferni-ai.vercel.app
