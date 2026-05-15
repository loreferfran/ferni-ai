# Progreso FERNI AI — Estado Actual (15 Mayo 2026)

## ÚLTIMOS COMMITS (sesión 15 Mayo — parte 2)
- `24a509e` — Fix: Upsell sugerido — solo infoproductos PDF, nunca servicios ni consultas
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
    → Capítulos: 1024x1024 (cuadrada, sin recorte en el PDF)
    → Las imágenes se guardan automáticamente en IndexedDB (sobreviven recarga)
11. Usuario elige idioma + MERCADO OBJETIVO en el selector (ej: English + Canada)
12. APROBAR → Claude traduce al idioma elegido con adaptación cultural al mercado exacto
13. Preview del PDF final traducido
14. Descarga PDF final (ventana emergente → imprimir → Guardar como PDF)
15. (Opcional) Generar Kit Marketing desde tab 🛒 → textos Hotmart + Meta + Facebook + Instagram
16. (Opcional) Generar 6 imágenes de marketing en el Kit Marketing (una por plataforma)
17. (Opcional) Generar bonos con Claude → PDFs descargables para subir a Hotmart
18. (Opcional) Generar upsells con Claude → PDFs complementarios para vender aparte
19. (Opcional) Traducir ebook a otro idioma desde tab 🌍 → idioma + mercado exacto
20. (Opcional) Módulo Directo → generar ebook desde tema libre sin búsqueda
```

## Módulos / Tabs de la App
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades rankeadas |
| 📖 Ebook | Generar borrador → corregir → aprobar (idioma + mercado) → PDF final |
| 🛒 Hotmart | Kit Marketing Digital: textos Hotmart + Meta + FB + IG + 6 imágenes + bonos + upsells |
| 📣 Meta Ads | Anuncios Meta + contenido Facebook + contenido Instagram completo |
| 🎁 Bonus Pack | Claude analiza ebook y elige 4 infoproductos complementarios |
| 🌍 Traducción | Traducir cualquier ebook a 28 idiomas con mercado específico |
| ➡️ Directo | Generar ebook desde tema libre sin búsqueda previa |
| 🕐 Historial | Ver y restaurar ebooks anteriores |

## Sistema Bonus + Upsell (NUEVO — 15 Mayo)
### Bonos (🎁 sección en Kit Hotmart)
- Claude sugiere 3 infoproductos PDF para incluir gratis con el ebook principal
- Botón "✦ Generar estos bonos con Claude" → llama `/api/generate-bonuses`
- Devuelve PDFs completos (checklist, guide, tracker, worksheet, glossary)
- Botón "📄 Descargar PDF" por bono → abre print dialog con diseño morado premium

### Upsells (⬆️ sección en Kit Hotmart)
- Claude sugiere 2 ebooks complementarios para vender como upsell aparte
- **Restricción de prompt**: SOLO puede sugerir ebooks/guías PDF — NUNCA servicios, consultas, coaching ni programas de entrega personal
- Label UI: "Ideas de upsell — infoproductos PDF que podrías crear y vender aparte"
- Nota: "Claude sugiere ebooks complementarios para vender como upsell"
- Botón "✦ Generar estos upsells con Claude" → reutiliza `/api/generate-bonuses`
- Diseño naranja (diferenciado de bonos morados)

## Sistema de Target Market (15 Mayo)
- **Problema resuelto**: Inglés para Canada ≠ UK ≠ USA (modismos, tono, referencias culturales)
- **Dónde aparece**:
  1. Tab Ebook → selector APROBAR: campo "Mercado objetivo"
  2. Tab Traducción: campo "Mercado objetivo"
  3. Tab Hotmart → Kit Marketing: campo "Mercado objetivo"
- **Backend**: `/api/translate-custom` recibe `targetMarket` → prompt Claude con reglas culturales específicas

## Kit Marketing Digital (Tab 🛒 Hotmart)
Claude actúa como equipo completo (elite copywriter + Meta strategist + Hotmart expert + social marketer)

### Textos (2 llamadas Claude):
**Llamada 1:** productName, premiumSubtitle, emotionalHook, shortDesc, longDesc, transformationPromise, benefits(6), highlights(4), targetAudience, category, pricing, guarantee, bonus(3), upsell(2 — solo PDF)
**Llamada 2:** cta(3), urgencyAngles(3), objectionHandling(3), seoKeywords(8), thumbnailTitleIdeas(3), emotionalPositioning, faq(3)

### 6 Imágenes DALL-E (una por plataforma):
| Slot | Formato | Uso |
|------|---------|-----|
| Mockup ebook | Landscape | Hotmart — foto del producto en dispositivo |
| Hero Hotmart | Landscape | Hotmart — thumbnail principal del listing |
| Ad Facebook | Landscape | Facebook — anuncio en feed |
| Post Instagram | Cuadrado 1024×1024 | Instagram — feed post |
| Story / Reel | Vertical 1024×1536 | Instagram Stories / Reels |
| Meta Ads | Landscape | Meta — creative para campañas pagas |

## Sistema de Imágenes (gpt-image-1)
| Slot | Tamaño | Razón |
|------|--------|-------|
| Portada ebook | 1024×1536 (portrait) | Proporción página A4 |
| Capítulos ebook | 1024×1024 (cuadrada) | Sin recorte en PDF |
| Story/Reel marketing | 1024×1536 (portrait) | Formato vertical Instagram |
| Resto marketing | 1024×1024 (landscape prompt) | Landscape via prompt |

### Persistencia (IndexedDB)
- `ferni_images_v1` — sin límite práctico de tamaño
- `output_format: 'jpeg'` → imágenes más livianas
- Botón "💾 Descargar imágenes" → descarga todas a PC como JPG

## Historial (Tab 🕐)
- 3 botones separados por ebook: 📊 Excel | 🖼 Borrar imágenes | 🗑 Borrar texto
- Borrar texto → solo localStorage (sin tocar IndexedDB)
- Borrar imágenes → solo IndexedDB (sin tocar localStorage)
- Selector de ebook en Kit Hotmart → elegir cualquier ebook del historial

## Generación del Ebook — 7 Pasos Claude
```
header → outline → ch1 → ch2 → ch3 → ch4 → ending
```
Con prompt premium: checklists, ejercicios prácticos, Pro Tips, trackers, worksheets

## Traducción — Sistema
- 4 llamadas Claude separadas (evita truncado JSON)
- p1: title, subtitle, tagline, intro
- p2: chapter1, chapter2
- p3: chapter3, chapter4
- p4: conclusion, actionPlan, resources, disclaimer
- Target Market: adaptación cultural al mercado exacto

## Variables de Entorno en Vercel
- CLAUDE_API_KEY ✅
- OPENAI_API_KEY ✅ (para gpt-image-1)
- SERPER_API_KEY ✅
- DATAFORSEO_LOGIN ✅
- DATAFORSEO_PASSWORD ✅

## Estado de Archivos Clave
- **api/index.js**: búsqueda, análisis GPT-4o, generación Claude (7 pasos), correcciones, imágenes gpt-image-1, translate-custom (targetMarket), generate-hotmart (2 llamadas), generate-meta (2 llamadas), generate-extras, generate-bonuses (bonos + upsells), quick-brief, buildMarketingSystemPrompt()
- **public/index.html**: UI completa + IndexedDB + módulo traducción + Bonus Pack + Meta Ads + Kit Marketing + genBonuses() + dlBonus() + genUpsells() + dlUpsell() + renderHotmart() + renderMeta() + buildHotmartImgPrompts(6 imágenes)

## Pendiente / Próxima Sesión
- 🔄 Probar flujo completo: búsqueda → ebook → imágenes → aprobar → kit marketing → imágenes marketing → bonos → upsells
- 🔄 Probar Target Market en traducción (ej: English + Canada)
- 🔄 Probar que bonos y upsells generan PDFs correctos
- 🔄 Verificar que upsell ya no sugiere servicios/consultas
- 🔄 Verificar que imágenes persisten tras cerrar navegador
- 🔄 Posible fusión de tab Meta Ads dentro del Kit Marketing (misma pantalla)

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
