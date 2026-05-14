# Progreso FERNI AI — Estado Actual (14 Mayo 2026)

## ÚLTIMOS COMMITS (sesión 14 Mayo)
- `1823d4e` — Fix: imágenes sin recorte — output_format jpeg, thumbnails con contain, max-height:none en PDF
- `c97fb85` — Fix: persistencia de imágenes via IndexedDB (sin límite de 5MB)
- `11c3d68` — Fix: imágenes capítulo cuadradas 1024x1024, sin márgenes negativos
- `49279d0` — Fix: tamaños de imagen coordinados con el PDF
- `ac075ae` — Fix: guardar y restaurar imágenes (coverUrl + chapterImages) tras recarga

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción + Hotmart kit + Meta Ads kit + Bonus Pack), OpenAI GPT-4o (análisis), Serper (búsqueda), gpt-image-1 (imágenes), DataForSEO (volumen real)
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
7. Claude genera en 7 pasos: header → outline → ch1 → ch2 → ch3 → ch4 → ending
   → SIEMPRE EN ESPAÑOL, Claude NO ve el idioma de destino en este paso
8. Preview en iframe del borrador en ESPAÑOL
9. Usuario hace correcciones via chat (1 llamada Claude barata, solo manda resumen)
10. Usuario genera imágenes por slot (gpt-image-1, clic en cada slot)
    → Portada: 1024x1536 (portrait, full-bleed sobre toda la portada)
    → Capítulos: 1024x1024 (cuadrada, sin recorte)
    → Las imágenes se guardan automáticamente en IndexedDB (sobreviven recarga)
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

## Sistema de Imágenes (gpt-image-1) — Arreglado en sesión 14 Mayo

### Tamaños por slot
| Slot | Tamaño | Razón |
|------|--------|-------|
| Portada | 1024×1536 (portrait) | Coincide con proporción página A4 |
| Capítulos | 1024×1024 (cuadrada) | Cuadrada, sin recorte en el PDF |

### CSS en el PDF (`buildFinalPdfHtml`)
- **Portada**: `position:absolute; width:100%; height:100%; object-fit:cover` → imagen como fondo de toda la portada
- **Texto portada**: dentro de `.cover-content` con `z-index:2` y overlay oscuro degradado para legibilidad
- **Capítulos**: `width:100%; height:auto; max-height:none` → muestra imagen cuadrada completa sin recortar

### Persistencia de imágenes (IndexedDB)
- Las imágenes base64 (~2MB c/u) son demasiado grandes para localStorage (límite 5MB)
- **Solución**: IndexedDB (`ferni_images_v1`) — sin límite práctico de tamaño
- Funciones: `idbSet`, `idbGet`, `restoreImagesIDB`, `applyIDBImages`
- **Claves IDB**: `img_{histId}_cover`, `img_{histId}_ch0`, `img_{histId}_ch1`, etc.
- **Guardado automático**: cada vez que se genera una imagen → `idbSet` inmediato
- **Restauración**: `autoRestore` y `loadAndDraft` cargan imágenes de IDB antes de renderizar
- `output_format: 'jpeg'` → imágenes más livianas que PNG

### Thumbnails del panel de imágenes
- CSS: `max-height:120px; object-fit:contain; background:#000` → imagen completa visible, sin recorte

## Generación del Ebook — 7 Pasos Claude
```
header  → título, subtítulo, definiciones (ebookDefs)
outline → plan de capítulos con temas asignados (ebookOutline)
ch1     → capítulo 1 (recibe ebookDefs + ebookOutline, sin repetir temas)
ch2     → capítulo 2 (ídem)
ch3     → capítulo 3 (ídem)
ch4     → capítulo 4 (ídem)
ending  → conclusión + plan de acción
```
- `ebookDefs`: diccionario de nombres/términos fijo para todos los capítulos (evita nombres diferentes)
- `ebookOutline`: plan con temas por capítulo (evita repetición de contenido entre capítulos)
- `buildOutlineRule(chNum)`: inyecta temas del capítulo actual + temas ya explicados en anteriores

## Módulo Búsqueda (buildSmartQueries)
- 4 bloques de queries por idioma (FR/DE/IT/ES/PT/EN/NL/SV/PL)
- Hasta 20 queries por búsqueda
- Plataformas: Reddit, Quora, TikTok, Pinterest, Udemy/Hotmart, Amazon, YouTube, foros

## Módulo Análisis GPT-4o
- Clustering semántico obligatorio antes de analizar
- Reglas anti-alucinación explícitas
- Campos: tipoCiclo, mesesPico, clusterKeywords, repeticionFuentes, motivacionProfunda
- Penalización estacional: -20/-30 puntos si está fuera de temporada

## DataForSEO — Integración
- DATAFORSEO_LOGIN y DATAFORSEO_PASSWORD en Vercel env vars
- ~$0.002 por keyword consultada, máx 15 keywords/búsqueda
- Fallback silencioso si falla

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅ (para gpt-image-1)
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅
- DATAFORSEO_PASSWORD ✅

## Estado de Archivos Clave
- **api/index.js**: todos los endpoints — búsqueda, análisis GPT-4o, generación Claude (7 pasos), correcciones, imágenes gpt-image-1 (con imageType: cover/chapter), translate-ebook, translate-custom, DataForSEO, /api/generate-extras, /api/generate-hotmart, /api/generate-meta
- **public/index.html**: UI completa + lógica frontend + buildFinalPdfHtml + IndexedDB para imágenes + módulo traducción + Bonus Pack + Meta Ads con selector

## Notas Técnicas
- **gpt-image-1**: modelo de imagen disponible en esta cuenta (NO dall-e-2, NO dall-e-3)
  - Tamaños soportados: 1024×1024, 1024×1536, 1536×1024
  - Siempre devuelve base64 (b64_json) — por eso se usa IndexedDB, no localStorage
  - `output_format: 'jpeg'` para imágenes más ligeras
- **Generar PDF completo**: 7 llamadas Claude (costoso)
- **Corregir PDF (chat)**: 1 llamada Claude × 1000 tokens (barato)
- **Traducir ebook**: 2 llamadas Claude × 7000 tokens
- **Bonus Pack**: 1 llamada Claude × 7000 tokens
- **Hotmart Kit**: 1 llamada Claude × 4000 tokens
- **Meta Ads Kit**: 1 llamada Claude × 5000 tokens

## Pendiente / Por Probar
- 🔄 Regenerar imágenes de capítulo (la del cap 1 fue generada con 1536×1024 landscape antes del fix — regenerar con 1024×1024)
- 🔄 Probar portada full-bleed (imagen 1024×1536 como fondo completo)
- 🔄 Verificar que imágenes persisten tras cerrar navegador y volver al día siguiente
- 🔄 Probar flujo completo: búsqueda → ebook → imágenes → aprobar → traducir → descargar
- 🔄 Verificar DataForSEO retorna volúmenes reales (campo dfsKeywords en respuesta)
- 🔄 Probar Bonus Pack, Meta Ads, Kit Hotmart con ebook real

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
4. La imagen del cap 1 necesita regenerarse (ver Pendiente arriba)
