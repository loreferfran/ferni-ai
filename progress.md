# Progreso FERNI AI — Estado Actual (15 Mayo 2026)

## ÚLTIMOS COMMITS (sesión 15 Mayo)
- `94d6a2a` — Add: Target Market en traducción y kit marketing — inglés Canada ≠ UK ≠ USA
- `b5ff4e2` — Enhance: Premium Marketing Kit — prompt elite copywriter + 6 imágenes por plataforma + Facebook/Instagram content
- `c95bb9e` — Enhance: imágenes Hotmart ultra-vendibles con prompts dinámicos por nicho y colores
- `43ada7b` — Fix UI: eliminar portada redundante en Hotmart, renombrar imágenes de marketing
- `cc94527` — Enhance: prompt premium workbook — checklists, ejercicios, tips, trackers en ebook
- `761011d` — Fix: Kit Hotmart y Meta Ads — split JSON en 2 llamadas Claude para evitar truncado

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción + Marketing Kit), OpenAI GPT-4o (análisis + quick-brief), gpt-image-1 (imágenes), Serper (búsqueda), DataForSEO (volumen real)
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
11. Usuario elige idioma + MERCADO OBJETIVO en el selector (ej: English + Canada)
12. APROBAR → Claude traduce al idioma elegido con adaptación cultural al mercado exacto
13. Preview del PDF final traducido
14. Descarga PDF final (ventana emergente → imprimir → Guardar como PDF)
15. (Opcional) Generar Kit Marketing desde tab 🛒 → textos Hotmart + Meta + Facebook + Instagram
16. (Opcional) Generar 6 imágenes de marketing en el Kit Marketing (una por plataforma)
17. (Opcional) Generar Kit Meta Ads desde tab 📣 → anuncios + Facebook + Instagram content
18. (Opcional) Generar Bonus Pack desde tab 🎁 → Claude elige 4 infoproductos ideales
19. (Opcional) Traducir ebook a otro idioma desde tab 🌍 → idioma + mercado exacto
20. (Opcional) Módulo Directo → generar ebook desde tema libre sin búsqueda
```

## Módulos / Tabs de la App
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades rankeadas |
| 📖 Ebook | Generar borrador → corregir → aprobar (idioma + mercado) → PDF final |
| 🛒 Hotmart | Kit Marketing Digital: textos Hotmart + Meta + FB + IG + 6 imágenes |
| 📣 Meta Ads | Anuncios Meta + contenido Facebook + contenido Instagram completo |
| 🎁 Bonus Pack | Claude analiza ebook y elige 4 infoproductos complementarios |
| 🌍 Traducción | Traducir cualquier ebook a 28 idiomas con mercado específico |
| ➡️ Directo | Generar ebook desde tema libre sin búsqueda previa |
| 🕐 Historial | Ver y restaurar ebooks anteriores |

## Sistema de Target Market (NUEVO — 15 Mayo)
- **Problema resuelto**: Inglés para Canada ≠ UK ≠ USA (modismos, tono, referencias culturales)
- **Dónde aparece**:
  1. Tab Ebook → selector APROBAR: campo "Mercado objetivo" (pre-rellenado con país del ebook)
  2. Tab Traducción: campo "Mercado objetivo" (pre-rellenado con país del ebook)
  3. Tab Hotmart → Kit Marketing: campo "Mercado objetivo" antes del botón generar
- **Cómo funciona en backend**: `/api/translate-custom` recibe `targetMarket` y lo añade al prompt de Claude con reglas específicas de adaptación cultural
- **Ejemplos**: English+Canada → canadianismos; English+UK → elegante/reservado; French+Canada → quebecois; German+Germany → estructurado/confianza

## Kit Marketing Digital (Tab 🛒 Hotmart) — Renovado 15 Mayo
Claude actúa como equipo completo de marketing:
- Elite direct response copywriter
- Meta Ads strategist
- Hotmart launch expert
- Luxury branding specialist
- Social media growth marketer

### Textos que genera (2 llamadas Claude):
**Llamada 1 — Hotmart listing:**
- productName, premiumSubtitle, emotionalHook, transformationPromise
- shortDesc, longDesc, targetAudience, category, pricing, guarantee
- benefits (6), highlights (4), bonus (3), upsell (2)

**Llamada 2 — Estrategia avanzada:**
- cta (3 variaciones), urgencyAngles (3), objectionHandling (3 con objeción+respuesta)
- seoKeywords (8), thumbnailTitleIdeas (3), emotionalPositioning, faq (3)

### 6 Imágenes DALL-E (una por plataforma):
| Slot | Formato | Uso |
|------|---------|-----|
| Mockup ebook | Landscape | Hotmart — foto del producto en dispositivo |
| Hero Hotmart | Landscape | Hotmart — thumbnail principal del listing |
| Ad Facebook | Landscape | Facebook — anuncio en feed |
| Post Instagram | **Cuadrado** 1024×1024 | Instagram — feed post |
| Story / Reel | **Vertical** 1024×1536 | Instagram Stories / Reels |
| Meta Ads | Landscape | Meta — creative para campañas pagas |

- Paleta de colores automática por nicho (beauty=rosado, fitness=naranja/azul, business=navy/oro, etc.)
- Prompts específicos por plataforma (composición, formato, estilo)
- Sin texto en imágenes — app añade textos después

## Kit Meta Ads (Tab 📣) — Renovado 15 Mayo
Claude genera en 2 llamadas:

**Llamada 1 — Meta Ads:**
- segmentation (edad, género, intereses, comportamientos, dolores, excluir, lookalike, budget)
- ads array 5 (ángulos: problema, urgencia, aspiración, curiosidad, autoridad)
  - Cada anuncio: angle, platform, format, headline, primaryText, shortCopy, longCopy, emotionalHook, cta, targetEmotion

**Llamada 2 — Facebook + Instagram + Email:**
- facebook: post, storytellingPost, authorityPost, viralHook, engagementPost, commentCTA
- instagram: caption, carouselIdeas (3), reelHooks (3), storyHooks (3), hashtags (15), shortHooks (3)
- emailSequence: 3 emails con subject + body
- retargeting: headline, copy, cta, offer

## Prompt Premium Ebook (NUEVO — 15 Mayo)
Añadido en `buildEbookSystem()` y en `/api/quick-brief`:
- Claude genera checklists, ejercicios prácticos, Pro Tips, Expert Tips, trackers, progress sections
- Common Mistakes, reflection prompts, before/after examples, worksheets, step-by-step blocks
- El ebook NO debe sentirse como paredes de texto genérico
- Resultado: premium workbook / guía digital / curso profesional

## Sistema de Imágenes (gpt-image-1)
### Tamaños por slot
| Slot | Tamaño | Razón |
|------|--------|-------|
| Portada ebook | 1024×1536 (portrait) | Coincide con proporción página A4 |
| Capítulos ebook | 1024×1024 (cuadrada) | Cuadrada, sin recorte en el PDF |
| Story/Reel marketing | 1024×1536 (portrait) | Formato vertical Instagram |
| Resto marketing | 1024×1024 (landscape prompt) | Landscape via prompt, cuadrado en API |

### Persistencia de imágenes (IndexedDB)
- IndexedDB (`ferni_images_v1`) — sin límite práctico de tamaño
- Funciones: `idbSet`, `idbGet`, `restoreImagesIDB`, `applyIDBImages`
- `output_format: 'jpeg'` → imágenes más livianas

## Generación del Ebook — 7 Pasos Claude
```
header  → título, subtítulo, definiciones (ebookDefs)
outline → plan de capítulos con temas asignados (ebookOutline)
ch1     → capítulo 1 (recibe ebookDefs + ebookOutline)
ch2     → capítulo 2
ch3     → capítulo 3
ch4     → capítulo 4
ending  → conclusión + plan de acción
```

## Traducción — Sistema Mejorado
- 4 llamadas Claude separadas (evita truncado JSON)
- p1: title, subtitle, tagline, intro
- p2: chapter1, chapter2
- p3: chapter3, chapter4
- p4: conclusion, actionPlan, resources, disclaimer
- `safeParseTranslation()` con recuperación de JSON truncado
- **Target Market**: Claude adapta culturalmente al mercado exacto, no solo al idioma

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅ (para gpt-image-1)
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅
- DATAFORSEO_PASSWORD ✅

## Estado de Archivos Clave
- **api/index.js**: todos los endpoints — búsqueda, análisis GPT-4o, generación Claude (7 pasos), correcciones, imágenes gpt-image-1, translate-custom (con targetMarket), generate-hotmart (2 llamadas), generate-meta (2 llamadas), generate-extras, quick-brief, buildMarketingSystemPrompt()
- **public/index.html**: UI completa + lógica frontend + buildFinalPdfHtml + IndexedDB + módulo traducción + Bonus Pack + Meta Ads + Kit Marketing + renderHotmart (campos premium) + renderMeta (FB+IG) + buildHotmartImgPrompts (6 imágenes por plataforma)

## Pendiente / Próxima Sesión
- 🔄 Fusionar tabs Hotmart + Meta Ads en un solo módulo "📣 Kit Marketing Digital"
- 🔄 Probar Kit Hotmart con el nuevo prompt premium (primera prueba real)
- 🔄 Probar generación de 6 imágenes de marketing
- 🔄 Probar Target Market en traducción (ej: English + Canada)
- 🔄 Probar Meta Ads con Facebook + Instagram content nuevo
- 🔄 Verificar que imágenes persisten tras cerrar navegador
- 🔄 Probar flujo completo: búsqueda → ebook → imágenes → aprobar → kit marketing → imágenes marketing

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
