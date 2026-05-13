# Progreso FERNI AI — Estado Actual (13 Mayo 2026)

## ÚLTIMOS COMMITS
- `04f47f9` — Mejorar prompt GPT-4o: fusión con prompt avanzado de inteligencia de mercado
- `f7bb26e` — Mejorar buildSmartQueries: fusión con prompt expandido del usuario
- `c5ffc33` — Meta Ads: selector manual de ebook — no automático para todos
- `626ae8a` — Fix: pre-seleccionar idioma en selector al generar/regenerar ebook

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción + Hotmart kit + Meta Ads kit + Bonus Pack), OpenAI GPT-4o (análisis), Serper (búsqueda), DALL-E (imágenes), DataForSEO (volumen real)
- **Deploy**: Vercel → ferni-ai.vercel.app (auto-deploy desde GitHub master)
- **Repo**: https://github.com/loreferfran/ferni-ai

## Flujo Actual de la App (DEFINITIVO)
```
1. Usuario elige país + nicho → EJECUTAR ANÁLISIS
2. Serper API busca (Google + Reddit + YouTube + Amazon + Quora + Pinterest + TikTok + Hotmart/Udemy)
3. Google Trends real (score 0-100, rising queries, Breakout +5000%) con fallback a Serper
4. DataForSEO consulta volumen real de Google Ads (en paralelo con Serper)
5. OpenAI GPT-4o analiza con clustering semántico → 10 oportunidades con scoreMonetizacion
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
15. (Opcional) Generar Kit Hotmart desde tab 🛒
16. (Opcional) Generar Kit Meta Ads desde tab 📣 → elige ebook del historial
17. (Opcional) Generar Bonus Pack desde tab 🎁 → Claude elige 4 infoproductos ideales
18. (Opcional) Traducir ebook a otro idioma desde tab 🌍
```

## Módulos / Tabs de la App
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades rankeadas |
| 📖 Ebook | Generar borrador → corregir → aprobar → PDF final |
| 🛒 Hotmart | Kit de lanzamiento: título, promesa, precio, descripción, bullets |
| 📣 Meta Ads | Selector manual de ebook → anuncios y textos publicitarios |
| 🎁 Bonus Pack | Claude analiza ebook y elige 4 infoproductos complementarios |
| 🌍 Traducción | Traducir cualquier ebook a 28 idiomas sin repetir el flujo |

## Módulo Búsqueda (buildSmartQueries) — Mejorado
- **4 bloques de queries** por idioma (FR/DE/IT/ES/PT/EN/NL/SV/PL):
  1. **Intención principal** (10 prefijos): cómo hacer, guía, tutorial, errores, ayuda, tips, checklist, método fácil, desde casa, sin experiencia, PDF, plantilla
  2. **Intención de aprendizaje** (4 prefijos): quiero aprender, desde cero, curso gratis, tutorial principiantes
  3. **Deseos/resultados** (3 sufijos): resultados en 7 días, método efectivo, ideas creativas
  4. **Plataformas** (8 queries): Reddit, Quora, TikTok viral, Pinterest, Udemy/Hotmart, Amazon, YouTube, foros
- **Total: hasta 20 queries por búsqueda** (antes 12)
- **Modo general**: expandido con Pinterest, TikTok, Quora, Hotmart/Udemy para todos los idiomas; Portuguese añadido

## Módulo Análisis GPT-4o (analyzeWithGPT4) — Mejorado
### Prompt fusionado (mejor de ambos prompts):
- **Clustering semántico obligatorio** (Paso 1): agrupa búsquedas similares en clusters antes de analizar
  - Ejemplo: "como bajar de peso" + "quemar grasa rapido" + "perder grasa abdominal" → cluster "Pérdida de peso"
  - 3+ variaciones = demanda confirmada; 1 fuente = señal débil
- **Reglas anti-alucinación** explícitas (✗): no inventar sin evidencia, no priorizar fuentes aisladas, no confundir curiosidad con compra, no confundir SEO viejo con demanda actual
- **Clasificación de ciclo**: evergreen / estacional / tendencia-temporal / viral
- **Señales de compra** identificadas: multi-fuente (Reddit+YouTube+Google=FUERTE), 100k+ views, Amazon/Hotmart/Udemy, Breakout trends, foros
- **Criterios de oportunidad válida**: mínimo 2 señales de la lista para que cuente
- **Penalización estacional**: -20/-30 puntos si está fuera de temporada
- **Regla SEO viejo**: no confundir contenido histórico indexado con demanda real actual
- **Instrucción final en userMsg**: refuerza clustering, anti-alucinación y JSON puro antes de responder

### Nuevos campos JSON en cada oportunidad:
- `tipoCiclo`: evergreen / estacional / tendencia-temporal / viral
- `mesesPico`: array de meses pico (solo para estacionales)
- `clusterKeywords`: array con 3-6 variaciones de búsqueda del cluster detectado
- `repeticionFuentes`: número de fuentes donde apareció el patrón (1=débil, 3+=fuerte)
- `motivacionProfunda`: deseo oculto, miedo, aspiración o frustración real detrás de la búsqueda

## Módulo Traducción (tab 🌍)
- Tab separado para traducir a CUALQUIER idioma (independiente del flujo de país)
- Selector con 28 idiomas: inglés, francés, alemán, italiano, portugués, chino, japonés, coreano, árabe, ruso, turco, polaco, holandés, sueco, noruego, danés, finlandés, griego, rumano, húngaro, checo, tailandés, vietnamita, indonesio, hebreo, hindi, español España
- Útil para reutilizar un ebook ya creado en otro mercado sin repetir todo el proceso

## Módulo Bonus Pack (tab 🎁)
- Claude analiza el contenido completo del ebook (600 chars/capítulo) y ELIGE los 4 mejores infoproductos
- Catálogo de 12 tipos: checklist, poster, tarjetas, plan30, plantilla, recetas, calendario, tracker, materiales, guiarapida, rutina, presupuesto
- Claude elige según el contenido específico del ebook (no hardcodeado)
- Reglas de calidad: 30+ ítems checklist, 8+ tarjetas, 28+ días plan30, 5+ recetas
- Cada producto: preview en nueva ventana, descarga individual, descarga todo (600ms stagger)
- Estrategia de precios incluida (precio individual vs pack bundle)

## Módulo Meta Ads (tab 📣) — Manual con selector
- NO automático para todos los ebooks — solo cuando el usuario lo solicita
- Selector de ebook: ebook actual de la sesión + historial de ebooks con ebook guardado
- Preview del ebook seleccionado antes de generar
- Botón "↺ Cambiar ebook" para volver al selector
- Genera: anuncios Facebook/Instagram, copy para stories, headlines, textos de conversión

## Por Qué Claude No Mezcla Idiomas
- Borrador: Claude solo recibe "ESCRIBE EN ESPAÑOL CASTELLANO" — no sabe el idioma de destino
- Traducción: ocurre DESPUÉS del borrador, en llamada separada, cuando todo está aprobado
- `S.approvedLang`: variable de estado que guarda el idioma elegido al aprobar
- Eliminada la detección automática de idioma por país en `approveEbook()`

## DataForSEO — Integración
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

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅ (lorenacardenascarrasco@gmail.com)
- DATAFORSEO_PASSWORD ✅ (agregado 13 Mayo 2026)

## Estado de Archivos Clave
- **api/index.js**: Búsqueda (buildSmartQueries mejorado), análisis GPT-4o (prompt fusionado), generación Claude, correcciones, imágenes DALL-E, translate-ebook, translate-custom, DataForSEO, /api/generate-extras (Bonus Pack), /api/generate-hotmart, /api/generate-meta
- **public/index.html**: Toda la UI + lógica frontend + buildFinalPdfHtml + formatContent parser + módulo traducción + tab Bonus Pack + Meta Ads con selector

## Notas Técnicas
- **Generar PDF completo**: 3 llamadas Claude × 8000 tokens (costoso, usar solo si necesario)
- **Corregir PDF (chat)**: 1 llamada Claude × 1000 tokens (barato, usa solo resumen del ebook)
- **Traducir ebook**: 2 llamadas Claude × 7000 tokens (translate-custom)
- **Bonus Pack**: 1 llamada Claude × 7000 tokens (/api/generate-extras)
- **Hotmart Kit**: 1 llamada Claude × 4000 tokens
- **Meta Ads Kit**: 1 llamada Claude × 5000 tokens
- **DataForSEO**: ~$0.002 por keyword consultada. buildSeedKeywords() genera máx 15 keywords/búsqueda
- **Google Trends**: si falla en Vercel (IP bloqueada), cae automáticamente a Serper
- **Formato**: Claude usa • para listas y | col | para tablas; el frontend las parsea a HTML

## Próximos Pasos
- 🔄 Probar flujo completo: búsqueda → oportunidad → borrador → corrección → elegir idioma → traducir → descarga
- 🔄 Verificar que DataForSEO retorna volúmenes reales (revisar campo dfsKeywords en respuesta)
- 🔄 Probar Bonus Pack con un ebook real (verificar que Claude elige 4 tipos correctos)
- 🔄 Probar Meta Ads con selector de ebook (sesión actual + historial)
- 🔄 Probar slots de imágenes (clic → DALL-E → inserta en PDF)
- 🔄 Probar Google Trends real en Vercel (puede bloquearse por IP)
- 🔄 Verificar formato de tablas y listas en el PDF final
- 🔄 Usuario mencionó 2 puntos más de mejora (pendiente de revelar)

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
4. Revisar Vercel si hay errores de deploy en ferni-ai.vercel.app
