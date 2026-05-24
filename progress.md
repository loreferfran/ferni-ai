# Progreso FERNI AI — Estado Actual (22 Mayo 2026)

## ÚLTIMOS CAMBIOS (sesión 22 Mayo)

### Bonus Pack — corrector natural (reemplaza modal JSON)
- Botón "✏ Editar" abre corrector en lenguaje natural: el usuario describe qué corregir
- Intento rápido local: detecta "cambia X por Y" o "X → Y" y aplica sin API
- Fallback: `/api/fix-bonus` (Claude Haiku) aplica instrucción al JSON del bonus
- Modal nuevo: título del bonus como referencia, textarea de instrucción, botón "✨ Aplicar corrección"
- Elimina el viejo modal de edición de JSON crudo

### Bonus Pack — Kit de marketing (NUEVO)
- Nueva sección al fondo del tab Bonus Pack: "📣 Kit de marketing — Bonus Pack"
- Botón **✦ Generar kit** (opcional, solo cuando hay bonuses generados)
- **Imagen bundle DALL-E**: mockup profesional de 4 mini-guías/libros, generada con prompt específico por tipo de bonus (checklist, tracker, plan30, etc.)
- Prompt usa iconos dinámicos según los tipos reales del pack + estilo visual del kit Hotmart (si existe) para concordancia de colores
- Texto overlay en el **idioma del ebook** (9 idiomas via `_getLangCode`)
- Textos de Hotmart (150-200 palabras) + Meta Ads (3-4 copies cortos) generados por Claude Haiku
- Imagen y textos se generan en **paralelo** (`Promise.all`) → ~15s total
- Textareas editables + botón "💾 Guardar cambios"
- Botón "↺ Regenerar imagen" → nueva llamada DALL-E + loading state
- **Persistencia total**: `ferni_extras` incluye campo `marketing`, IndexedDB guarda imagen (key: `bonus_bundle_img`), sobrevive refresh
- Si se regeneran los 4 bonuses: marketing se resetea automáticamente

### Bonus Pack — helper `_saveExtras()`
- Centraliza todos los saves de `ferni_extras` + `saveFullDataToHist` en una sola función
- Incluye `marketing: S.extrasMarketing` en todos los saves
- Reemplaza 4 bloques de código inline duplicados

### Nuevos endpoints backend
| Endpoint | Función |
|----------|---------|
| `/api/fix-bonus` | Claude Haiku aplica instrucción en lenguaje natural al JSON de un bonus |
| `/api/bonus-marketing-texts` | Claude Haiku genera texto Hotmart + texto Meta Ads para el pack |

### Commits sesión 22 Mayo
- `7797c4d` — Replace bonus edit modal with natural-language corrector + add /api/fix-bonus
- `a608643` — Add bonus marketing kit: bundle image + Hotmart & Meta texts in Bonus module
- `deb7c4e` — Replace Canvas bundle with DALL-E mockup image for bonus marketing kit
- `f2cba0e` — Fix bundle image: language-aware overlay + concordant visual style with Hotmart
- `57905de` — Improve bundle DALL-E prompt: icon-based illustration + dynamic bonus types

---

## ÚLTIMOS CAMBIOS (sesión tarde 21 Mayo)

### Módulo 📥 Importar & Mejorar (NUEVO)
- Nueva tab entre ✍️ Directo y 🌍 Traducción
- Sube PDF, DOCX o TXT → Claude mejora capítulo por capítulo → entra al flujo normal de Ferni AI
- Extracción de texto: PDF.js + mammoth.js (CDN, cargados on-demand — sin dependencias en el bundle)
- Detección de capítulos: regex por "Capítulo/Chapter/Cap." → fallback a chunks de 400 palabras
- Máximo 8 secciones por ebook (para no sobrecargar)
- Barra de progreso por capítulo: `Mejorando capítulo X de N...`
- API `/api/import-chapter`: Haiku por capítulo (~5s c/u, sin riesgo de timeout)
- Instrucciones al modelo: preservar voz personal/anécdotas, adaptar al mercado, mejorar gramática y flujo
- `sendToEbook()`: ensambla capítulos mejorados en `S.ebookData` + `selOpp` sintético → cambia al tab Ebook
- Una vez en Ebook: flujo normal (verificación, correcciones, PDF final, Hotmart, Meta Ads, Bonus)
- Campos: mercado objetivo (LatAm primero), idioma de salida, contexto libre, referencia adicional

### Países LatAm (NUEVO)
Agregados a todos los sistemas:
- **8 países**: México, Colombia, Argentina, Chile, Perú, Uruguay, Ecuador, Brasil
- `REGS`: legales, disclaimer salud, garantía, protección de datos (LFPDPPP, Ley 1581, Ley 25326, Ley 19628, Ley 29733, Ley 18331, LOPDP, LGPD)
- `POPULATION`: datos de población real por país
- `getCountryContext()`: descripción climática/arquitectónica para imágenes DALL-E
- `GEO_CODES`: MX, CO, AR, CL, PE, UY, EC, BR (para Google Trends)
- `DFS_LOCATION_CODES`: 2484, 2170, 2032, 2152, 2604, 2858, 2218, 2076 (DataForSEO)
- `LANGS` (frontend): todos con flag emoji y lang correcto
- `#sel-country` (análisis): nuevo optgroup "🌎 América Latina" con los 8 países
- Módulo Directo: Uruguay y Ecuador agregados (ya tenía los otros 6)
- Módulo Importar: selector de mercado con LatAm como primera opción

### Commits sesión tarde 21 Mayo
- `88aec7d` — Add Import & Upgrade module + LatAm countries

---

## ÚLTIMOS CAMBIOS (sesión mañana 21 Mayo)

### Bonus Pack — descarga como PDF individual
- Botón "🖨 Guardar PDF" — abre ventana con auto-print (igual que ebook principal)
- Nombre del archivo = título del bonus en el idioma correcto (via `<title>` tag)
- "Descargar todo" eliminado — cada card tiene su propio botón de descarga
- Ya no descarga como Word sin formato

### Bonus Pack — persistencia reforzada
- Bonus guardados en clave propia `ferni_extras` (independiente del historial)
- Sobrevive aunque localStorage falle por cuota en la entrada del historial
- Al recargar: primero busca en el historial, si no encuentra usa `ferni_extras` como fallback

### Bonus Pack — regenerar individual
- Botón "↺ Regenerar" por card → regenera ese bonus solo, sin tocar los demás
- `/api/regen-bonus`: recibe tipo + ebook + idioma → Claude Haiku genera 1 bonus

### Meta Ads — mejoras
- Campo precio de venta (monto + moneda) antes de generar
- Bonus detectados automáticamente si existen
- Corrector rápido: buscar → reemplazar en todo el kit
- Selector limpio: solo ebooks con PDF Final, sin duplicados

### Bonus Pack — fix timeout generación
- Solución: 2 llamadas con Claude Haiku (5x más rápido que Sonnet)
- Total ~20s, bien dentro del límite de 60s Vercel

---

## LO QUE FUNCIONA HOY ✅
- Generación ebook completo (7 capítulos + conclusión + disclaimer)
- Verificación 3 capas
- Correcciones por capítulo + Introducción
- Snapshot + Restaurar versión anterior
- PDF final sticky buttons
- Traducción a 28 idiomas
- Kit Hotmart: textos + 5 imágenes DALL-E + Canvas overlay ✅
- **Bonus Pack: 4 PDFs, corrector natural, regenerar individual, persistencia total ✅**
- **Bonus Pack — Kit marketing: imagen DALL-E bundle + textos Hotmart/Meta + persistencia ✅**
- **Meta Ads: precio real, bonus info, corrector rápido, selector limpio ✅**
- Portada ebook descarga compuesta Canvas
- Persistencia total: localStorage + ferni_extras (con marketing) + IndexedDB
- **📥 Importar & Mejorar: PDF/DOCX/TXT → capítulo por capítulo → flujo normal ✅**
- **🌎 LatAm: México, Colombia, Argentina, Chile, Perú, Uruguay, Ecuador, Brasil ✅**

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude Sonnet (ebooks + kits), Claude Haiku (bonus pack + import chapters + fix-bonus + marketing-texts), OpenAI GPT-4o (análisis), gpt-image-1 (imágenes), Serper (búsqueda), DataForSEO (keywords)
- **Canvas API**: compone DALL-E + texto overlay, cero dependencias
- **PDF.js + mammoth.js**: CDN on-demand para extracción de texto en Import & Upgrade
- **Deploy**: Vercel Hobby → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel**: 60s por función
- **Storage**: localStorage + ferni_extras (bonus + marketing) + IndexedDB (imágenes + bonus_bundle_img)

## Flujo Bonus Pack completo
```
Tab Bonus Pack → selecciona ebook → ingresa precio → ✦ Generar
→ Claude Haiku (x2): genera 4 bonus
→ Cada card: 👁 Preview · 🖨 Guardar PDF · ✏ Corregir (lenguaje natural) · ↺ Regenerar
→ Guardado en ferni_extras (sobrevive refresh siempre)

── Kit de marketing (opcional, al fondo) ──
→ ✦ Generar kit
→ Promise.all: DALL-E bundle image + Claude Haiku textos (paralelo ~15s)
→ Imagen: mockup 4 mini-guías, prompt dinámico según tipos reales, estilo concordante con Hotmart
→ Overlay en idioma del ebook (9 idiomas)
→ Textos: Hotmart (150-200 palabras) + Meta (3-4 copies)
→ Editables directamente, guardar con 💾
→ ↺ Regenerar imagen → nueva llamada DALL-E
→ Persistido en ferni_extras.marketing + IndexedDB(bonus_bundle_img)
```

## Flujo Meta Ads
```
Tab Meta Ads → selecciona ebook (solo finales, sin duplicados)
→ ingresa precio (ej: 17 USD) → bonus detectados automáticamente
→ ✦ Generar → Claude usa precio real + bonus + contenido ebook
→ Kit generado → ✏ Corrección rápida: buscar → reemplazar → Aplicar
```

## localStorage + IndexedDB — Claves
| Clave | Tipo | Contenido |
|-------|------|-----------|
| `ferni_pro` | localStorage | Historial completo |
| `ferni_active_id` | localStorage | ID ebook activo |
| `ferni_num_chapters` | localStorage | Número capítulos |
| `ferni_extras` | localStorage | `{data, lang, marketing}` — Bonus Pack + kit marketing |
| `bonus_bundle_img` | IndexedDB | Imagen bundle base64 (bonus marketing kit) |
| imágenes portada/caps | IndexedDB | Base64 imágenes Hotmart/ebook |

## Endpoints Backend
| Endpoint | Modelo | Función |
|----------|--------|---------|
| `/api/generate-extras` | Haiku x2 | Genera 4 bonus |
| `/api/regen-bonus` | Haiku | Regenera 1 bonus por tipo |
| `/api/fix-bonus` | Haiku | Corrige bonus con instrucción natural |
| `/api/bonus-marketing-texts` | Haiku | Texto Hotmart + Meta del bonus pack |
| `/api/import-chapter` | Haiku | Mejora 1 capítulo importado |
| `/api/fetch-url` | — | Extrae texto de URL externa |
| `/api/generate-hotmart` | Sonnet | Kit completo Hotmart |
| `/api/generate-meta` | Sonnet | Kit completo Meta Ads |
| `/api/generate-ebook` | Sonnet | Borrador ebook |
| `/api/generate-image` | gpt-image-1 | Imagen DALL-E |

## Pendiente
- **Meta Ads**: refactorizar imágenes con Canvas overlay (mismo sistema que Hotmart)
- PDF preview oscuro al restaurar desde historial — investigar

## Módulos / Tabs
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades |
| 📖 Ebook | Borrador → verificación → PDF |
| 🛒 Hotmart | Kit completo + 5 imágenes DALL-E + Canvas overlay ✅ |
| 📣 Meta Ads | Anuncios + RRSS + precio real + corrector ✅ |
| 🎁 Bonus Pack | 4 PDFs + corrector natural + kit marketing (imagen + textos) ✅ |
| ✍️ Directo | Tema libre → PDF |
| 📥 Importar | PDF/DOCX/TXT → mejora capítulo a capítulo → flujo normal ✅ |
| 🌍 Traducción | 28 idiomas |
| 🕐 Historial | Ver, restaurar, borrar |

## Países soportados
**Europa**: Francia, Alemania, Italia, España, Portugal, Reino Unido, Países Bajos, Bélgica, Suecia, Suiza, Austria, Polonia
**América del Norte**: USA, Canadá
**🌎 LatAm**: México, Colombia, Argentina, Chile, Perú, Uruguay, Ecuador, Brasil
**Asia**: Japón, Corea del Sur, India, China, Singapur, Tailandia
**África**: Sudáfrica, Nigeria, Kenya, UAE
**Oceanía**: Australia, Nueva Zelanda

## Variables de Entorno Vercel
CLAUDE_API_KEY ✅ | OPENAI_API_KEY ✅ | SERPER_API_KEY ✅ | DATAFORSEO_LOGIN ✅ | DATAFORSEO_PASSWORD ✅

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir: **"continuar desde progress.md"**
