# Progreso FERNI AI — Estado Actual (16 Mayo 2026)

## ÚLTIMOS COMMITS (sesión 16 Mayo)
- `014b29b` — Add: Serper en Módulo Directo — datos reales de web como contexto para Claude
- `41e407e` — Fix: historial — botones no clickeables por IDs sin comillas en onclick
- `2ad5817` — Fix: restricción permanente — prohibido mencionar precio del producto en el PDF
- `6e7c4b5` — Fix: historial muestra undefined — fallbacks para entradas antiguas y Módulo Directo
- `5e9ff28` — Add: verificación de hechos en 3 capas para ambos módulos
- `b4a5c6c` — Enhance: dynamic niche palettes + visual tag parser + chapter retry system

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción + Marketing Kit + verificación), OpenAI GPT-4o (análisis + quick-brief), gpt-image-1 (imágenes), Serper (búsqueda + Módulo Directo), DataForSEO (volumen real)
- **Deploy**: Vercel → ferni-ai.vercel.app (auto-deploy desde GitHub master)
- **Repo**: https://github.com/loreferfran/ferni-ai

## Flujo Módulo 1 — Automático con Serper (DEFINITIVO)
```
1. Usuario elige país + nicho → EJECUTAR ANÁLISIS
2. Serper busca (Google + Reddit + YouTube + Amazon + Quora + Pinterest + TikTok + Hotmart/Udemy)
3. Google Trends real con fallback a Serper
4. DataForSEO consulta volumen real de Google Ads
5. OpenAI GPT-4o analiza → 10 oportunidades con scoreMonetizacion
6. Usuario selecciona oportunidad → Generar borrador ebook
7. Claude genera en 7 pasos: header → outline → ch1 → ch2 → ch3 → ch4 → ending
8. Preview borrador en ESPAÑOL
9. Verificación automática Capa 3 (segundo Claude audita datos y fuentes)
10. Correcciones via chat → imágenes → APROBAR → traducción → PDF final
```

## Flujo Módulo 2 — Directo (ACTUALIZADO — 16 Mayo)
```
1. Usuario escribe tema + elige país
2. Serper busca 3 queries (~3 búsquedas): topic+país, topic+estadísticas, topic+guía expertos
3. GPT-4o genera el brief con datos reales de Serper como contexto
4. S.ebookSerperContext guarda los snippets de Serper
5. Claude genera cada capítulo recibiendo los snippets como contexto adicional
   → Instrucción: "cita datos reales con Según [nombre del sitio]"
6. Preview borrador en ESPAÑOL
7. Verificación automática Capa 3
8. Correcciones → imágenes → APROBAR → traducción → PDF final
```
**Nota:** si Serper falla, el flujo continúa sin contexto web sin bloquearse.

## Sistema de Verificación de Hechos — 3 Capas
### Módulo 1 → isModule1=true (modo estricto — datos pasaron por OpenAI)
### Módulo 2 → isModule1=false (modo estándar — solo Claude)

| Capa | Dónde | Qué hace |
|------|-------|---------|
| Capa 1 | buildEbookSystem() — system prompt | Filtro interno: fuente exacta, no atribuciones genéricas, no proyecciones como hechos |
| Capa 2 | espInstruction — fin de cada capítulo | Autorevisión antes de entregar JSON: fuentes, atribuciones, herramientas activas |
| Capa 3 | /api/verify-content — segundo Claude | Auditoría post-generación, muestra alerta en UI antes de APROBAR |

## Restricciones Permanentes en System Prompt
- **No mencionar precio del producto**: prohibido "pagaste X", "este libro cuesta X", etc.
- **No inventar estadísticas**: solo fuente exacta + año, estimación con rango, o eliminar
- **No primera persona**: nunca "yo", "mi", "he"
- **No experiencias personales inventadas**
- **Idioma**: siempre en español en Fase 1, sin excepciones

## Sistema de Paletas Dinámicas por Nicho
`getNichePalette(o)` detecta nicho por keywords → paleta CSS completa:

| Nicho | Colores | Tipografía |
|-------|---------|------------|
| beauty/skincare/yoga/wellness | Rosa/nude #C96B6B | Georgia serif |
| fitness/gym/nutrición/salud | Naranja/verde #E8630A | Arial sans-serif |
| lifestyle/cocina/productividad | Mint/cyan #00B894 | Georgia serif |
| business/AI/tech/digital | Navy/oro #1B2A4A | Arial sans-serif |
| default | Morado Ferni #6c5ce7 | Georgia serif |

Todas las variables CSS usan `P.xxx` — incluyendo vis-* elements.

## Parser de Elementos Visuales
Claude genera tags → buildFinalPdfHtml() los renderiza como HTML:
`[TABLE]` `[BAR CHART]` `[LINE CHART]` `[HIGHLIGHT BOX]` `[CHECKLIST]` `[ICON + TITLE]`

## Sistema de Retry por Capítulo
- `runEbookSteps(startFrom)` — si falla CH3, CH1+CH2 se preservan
- `S.ebookParts` guarda progreso capítulo por capítulo
- `retryEbook()` reintenta desde el punto de falla
- `resetEbookFull()` empieza de cero

## Historial (Tab 🕐) — Fixes aplicados
- IDs del Módulo Directo son strings `dir_123` — se requería comillas en onclick
- Fix: todos los onclick con `'${e.id}'` + comparaciones con `String(h.id)===String(id)`
- Fix: entradas antiguas y Módulo Directo muestran datos con fallbacks (no más "undefined")
- Botones 🗑 🖼 📊 funcionan correctamente

## Módulos / Tabs de la App
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades rankeadas |
| 📖 Ebook | Generar borrador → verificación automática → aprobar → PDF final |
| 🛒 Hotmart | Kit Marketing: textos + 6 imágenes + bonos + upsells |
| 📣 Meta Ads | Anuncios Meta + contenido Facebook + Instagram |
| 🎁 Bonus Pack | 4 infoproductos complementarios |
| 🌍 Traducción | 28 idiomas con mercado específico |
| ➡️ Directo | Tema libre + Serper + Claude → PDF |
| 🕐 Historial | Ver, restaurar y borrar ebooks anteriores |

## Consumo Serper
- **Módulo 1**: ~11 búsquedas por análisis
- **Módulo 2**: ~3 búsquedas por PDF generado
- **Free tier**: 2,500 búsquedas/mes → ~220 análisis Módulo 1 o ~830 PDFs Módulo 2
- Ambos módulos no se usan en paralelo → el consumo no se duplica

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅
- DATAFORSEO_PASSWORD ✅

## Estado de Archivos Clave
**api/index.js**: búsqueda, análisis GPT-4o, generación Claude 7 pasos, correcciones,
imágenes gpt-image-1, translate-custom, generate-hotmart, generate-meta, generate-extras,
generate-bonuses, quick-brief **(ahora con Serper)**, verify-content, buildEbookSystem,
buildEbookContext, buildMarketingSystemPrompt

**public/index.html**: UI completa + IndexedDB + getNichePalette() + buildFinalPdfHtml()
con P.xxx + preProcessTags() + renderVisualTag() + runEbookSteps() + retryEbook() +
buildVerificationContent() + runVerification() + renderHist() **(IDs con comillas)**
+ genDirecto() **(guarda serperContext)** + goEbook(isModule1)

## Pendiente / Próxima Sesión
- 🔄 Probar Módulo Directo completo: tema → Serper → GPT-4o → Claude con datos reales → verificación
- 🔄 Verificar que Claude cita fuentes reales de Serper en los capítulos
- 🔄 Probar paletas: ebook skincare (rosa) vs business (navy)
- 🔄 Probar tags visuales [TABLE], [BAR CHART] en PDF real
- 🔄 Probar retry de capítulo sin perder lo anterior
- 🔄 Verificar que historial funciona (botones clickeables, sin undefined)

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
