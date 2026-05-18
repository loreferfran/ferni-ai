# Progreso FERNI AI — Estado Actual (19 Mayo 2026)

## ÚLTIMOS CAMBIOS (sesión 19 Mayo — tarde)

### Persistencia completa — nada se pierde con Ctrl+Shift+R
- `saveFullDataToHist` guarda `hmKit`, `maKit`, `generatedBonuses`
- IIFE de restauración al recargar recupera `hmKit`, `maKit`, `generatedBonuses`
- `genMeta` y `genBonuses` llaman `saveFullDataToHist` tras generar
- `showTab('meta')` restaura vista si `S.maKit` ya existe (igual que hotmart)

### DALL-E + Canvas API — texto perfecto en imágenes Hotmart
- **Claude** devuelve por imagen: `visual_prompt` (para DALL-E, sin texto) + `text_overlay` (texto exacto para Canvas)
- **DALL-E** genera solo el fondo visual — cero texto
- **Canvas API** (nativo del navegador, cero dependencias) superpone el texto de Claude con tipografía real, banner semitransparente oscuro, texto blanco
- Doble barrera anti-texto en API: `noTextRule` añadido a TODOS los prompts antes de enviárselos a DALL-E
- Estructura JSON Claude: `{ "texts": {...}, "images": { "image_1": { "visual_prompt": "...", "text_overlay": "..." }, ... } }`
- Compatibilidad: si Claude devuelve `dalle_prompts` (formato viejo), se convierte automáticamente

### Imágenes Hotmart — botón ✕ para eliminar
- Cada imagen generada tiene botón rojo ✕ al lado de Regenerar
- Al pulsar ✕ vuelve al estado vacío 🎨 y se puede regenerar

### Descarga imágenes Hotmart con texto compuesto
- `dlHmImgDataUrl` descarga la imagen ya compuesta (Canvas dataURL PNG)
- Nombres: FERNI_HOTMART_Gancho.png, Mockup.png, Credibilidad.png, Beneficios.png, Cierre.png

## COMMITS sesión 19 Mayo tarde
- `98bfb05` — Add: botón ✕ para eliminar imagen Hotmart individualmente
- `9620a3c` — Add: Canvas API superpone texto en imágenes Hotmart — DALL-E solo genera fondos
- `5ba5e6c` — Fix: DALL-E cero texto — doble barrera en prompts Claude + API
- `b347e03` — Fix: persistencia completa — hmKit, maKit, generatedBonuses sobreviven Ctrl+Shift+R
- `745afeb` — Fix: guardar S.hmKit en localStorage al generar — sobrevive Ctrl+Shift+R

## COMMITS sesión 19 Mayo mañana (referencia)
- Correcciones panel eb-approved, sticky buttons, Conclusión/Disclaimer
- Checklist tag en inglés
- Moneda UK: EUR para tools, GBP solo salarios
- Hotmart kit refactor — master prompt Claude + imágenes nombradas
- Hotmart kit persistencia

## LO QUE FUNCIONA HOY ✅
- 7 botones de capítulos aparecen correctamente al recargar
- ✏️ Corregir texto: reemplazos simples → instantáneo, sin API
- 🔄 Regenerar capítulo: reescritura completa
- Snapshot + Restaurar versión anterior
- Auto-guardado en localStorage tras cada corrección
- Auto-restauración del ebook al recargar
- PDF final con sticky buttons arriba (descargar, Hotmart, Meta, imágenes)
- Correcciones en PDF final (Cap 1..N + Conclusión + Disclaimer)
- Kit Hotmart: textos completos + 5 imágenes con Canvas overlay
- Imágenes Hotmart: generar individual, eliminar ✕, regenerar, descargar nombrado
- Traducción reanudable si falla a mitad
- Persistencia total: ebook, finalEbook, hmKit, maKit, generatedBonuses sobreviven Ctrl+Shift+R

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + verificación + kit texts + image prompts), OpenAI GPT-4o (análisis + quick-brief), gpt-image-1 (imágenes), Serper (búsqueda web), DataForSEO (volumen keywords)
- **Canvas API**: nativo del navegador — compone imagen DALL-E + texto, cero dependencias
- **Deploy**: Vercel Hobby gratuito → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel Hobby**: 60s por función
- **Storage**: localStorage (metadatos + historial) + IndexedDB (imágenes)

## localStorage — Claves usadas
| Clave | Contenido |
|-------|-----------|
| `ferni_pro` | Array historial completo (ebook, finalEbook, hmKit, maKit, generatedBonuses, selOpp...) |
| `ferni_active_id` | ID del ebook activo actual |
| `ferni_num_chapters` | Número de capítulos del ebook activo |

## Flujo Imágenes Hotmart
```
Kit Hotmart generado → Claude devuelve images[1..5]{ visual_prompt, text_overlay }
→ Usuario pulsa imagen → genHotmartImg(idx)
→ /api/generate-image recibe visual_prompt (sin texto)
→ DALL-E genera fondo visual
→ composeImageWithText() — Canvas dibuja imagen + text_overlay encima
→ Imagen final lista para descargar
```

## Flujo Módulo 2 — Directo
```
Tema libre → Serper 3 búsquedas → GPT-4o brief → Claude 7 pasos
→ verificación Capa 3 → correcciones por capítulo → PDF final
```

## Sistema de Verificación — 3 Capas
| Capa | Dónde | Qué hace |
|------|-------|---------|
| 1 | buildEbookSystem() | Filtro: fuente exacta, no atribuciones genéricas |
| 2 | espInstruction | Autorevisión antes de entregar JSON |
| 3 | /api/verify-content | Segundo Claude audita post-generación |

## Restricciones Permanentes
- No mencionar precio del producto en PDF
- No inventar estadísticas sin fuente
- No primera persona ("yo", "mi")
- Moneda: EUR (€) para precios de herramientas, GBP (£) solo para salarios/contexto laboral británico
- No pagar nada más que OpenAI y Anthropic antes de vender

## Pendiente
- **Meta Ads**: igual que Hotmart — refactorizar con master prompt Claude + Canvas overlay para imágenes
- Capítulo 3 (UK AI tools) fue sobreescrito accidentalmente — regenerar con prompt detallado
- PDF preview aparece oscuro/vacío al restaurar desde historial — investigar

## Módulos / Tabs
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades |
| 📖 Ebook | Borrador → verificación → PDF |
| 🛒 Hotmart | Kit Marketing completo + 5 imágenes Canvas |
| 📣 Meta Ads | Anuncios + contenido RRSS (pendiente refactor) |
| 🎁 Bonus Pack | 4 infoproductos complementarios |
| 🌍 Traducción | 28 idiomas |
| ➡️ Directo | Tema libre → PDF |
| 🕐 Historial | Ver, restaurar, borrar |

## Variables de Entorno Vercel
CLAUDE_API_KEY ✅ | OPENAI_API_KEY ✅ | SERPER_API_KEY ✅ | DATAFORSEO_LOGIN ✅ | DATAFORSEO_PASSWORD ✅

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir: **"continuar desde progress.md"**
