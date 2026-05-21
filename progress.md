# Progreso FERNI AI — Estado Actual (21 Mayo 2026 — sesión tarde)

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
- Botón "⬇ Descargar" → "🖨 Guardar PDF" — abre ventana con auto-print (igual que ebook principal)
- Nombre del archivo = título del bonus en el idioma correcto (via `<title>` tag)
- "Descargar todo" → abre 4 ventanas separadas (1.2s de diferencia) → 4 PDFs independientes
- Ya no descarga como Word sin formato

### Bonus Pack — persistencia reforzada
- Bonus guardados en clave propia `ferni_extras` (independiente del historial)
- Sobrevive aunque localStorage falle por cuota en la entrada del historial
- Al recargar: primero busca en el historial, si no encuentra usa `ferni_extras` como fallback
- Se guarda también al editar cada bonus (modal de corrección)

### Meta Ads — mejoras antes de generar
- Campo **💰 Precio de venta** (monto + moneda: USD/EUR/GBP/CAD/AUD) antes de generar
- Si hay Bonus Pack generado, aparece listado automáticamente con sus precios
- Precio real y bonus se pasan al prompt de Claude → ya no inventa precios
- El ebook (subtítulo, hook) también se pasa al API para más contexto

### Meta Ads — corrector rápido
- Panel **✏ Corrección rápida** visible en el kit generado
- Buscar texto → reemplazar por → Aplicar
- Actualiza TODO el kit al instante (busca en todos los anuncios, copies, segmentación)
- Se guarda automáticamente en localStorage

### Meta Ads — selector mejorado
- Solo muestra ebooks con PDF Final aprobado (no borradores)
- Sin duplicados — mismo título solo aparece una vez
- Auto-selecciona el ebook activo si lo hay

### Bonus Pack — fix timeout generación
- Error "Unterminated string in JSON" causado por Vercel 60s timeout
- Solución: 2 llamadas con **claude-haiku** (5x más rápido que Sonnet)
- Llamada 1: elige 4 tipos y genera 2 bonus (~2200 tokens, ~10s)
- Llamada 2: genera los 2 restantes con los tipos que quedan
- Total ~20s, bien dentro del límite de 60s

---

## LO QUE FUNCIONA HOY ✅
- Generación ebook completo (7 capítulos + conclusión + disclaimer)
- Verificación 3 capas
- Correcciones por capítulo + Introducción
- Snapshot + Restaurar versión anterior
- PDF final sticky buttons
- Traducción a 28 idiomas
- Kit Hotmart: textos + 5 imágenes Canvas
- **Bonus Pack: selector, edición, 4 PDFs separados, persistencia robusta ✅**
- **Meta Ads: precio real, bonus info, corrector rápido, selector limpio ✅**
- Portada ebook descarga compuesta Canvas
- Persistencia total: localStorage + ferni_extras + IndexedDB
- **📥 Importar & Mejorar: PDF/DOCX/TXT → capítulo por capítulo → flujo normal ✅**
- **🌎 LatAm: México, Colombia, Argentina, Chile, Perú, Uruguay, Ecuador, Brasil ✅**

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude Sonnet (ebooks + kits), Claude Haiku (bonus pack + import chapters — más rápido), OpenAI GPT-4o (análisis), gpt-image-1 (imágenes), Serper (búsqueda), DataForSEO (keywords)
- **Canvas API**: compone DALL-E + texto, cero dependencias
- **PDF.js + mammoth.js**: CDN on-demand para extracción de texto en Import & Upgrade
- **Deploy**: Vercel Hobby → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel**: 60s por función
- **Storage**: localStorage + ferni_extras (bonus) + IndexedDB (imágenes)

## Flujo Import & Upgrade
```
Tab 📥 Importar → sube archivo (PDF/DOCX/TXT)
→ Selecciona mercado (LatAm primero) + idioma de salida
→ Contexto opcional (voz, público, instrucciones especiales)
→ Referencia adicional opcional
→ ✦ Importar y Mejorar
→ PDF.js / mammoth.js extrae texto del archivo
→ Detecta capítulos (regex o chunks)
→ Llama /api/import-chapter por cada capítulo (Haiku, ~5s c/u)
→ Barra de progreso capítulo por capítulo
→ ✅ Ebook mejorado → lista de capítulos
→ "Enviar al módulo Ebook" → entra al flujo normal completo
```

## Flujo Bonus Pack
```
Tab Bonus Pack → selecciona ebook → ingresa precio → ✦ Generar
→ Claude Haiku (llamada 1): elige 4 tipos + genera bonus 1 y 2
→ Claude Haiku (llamada 2): genera bonus 3 y 4
→ Cada card: 👁 Preview · 🖨 Guardar PDF · ✏ Editar contenido
→ "Descargar todo" → 4 ventanas separadas → 4 PDFs individuales
→ Guardado en ferni_extras (sobrevive refresh siempre)
```

## Flujo Meta Ads
```
Tab Meta Ads → selecciona ebook (solo finales, sin duplicados)
→ ingresa precio (ej: 17 USD) → bonus detectados automáticamente
→ ✦ Generar → Claude usa precio real + bonus + contenido ebook
→ Kit generado → ✏ Corrección rápida: buscar → reemplazar → Aplicar
```

## localStorage — Claves
| Clave | Contenido |
|-------|-----------|
| `ferni_pro` | Historial completo (ebook, finalEbook, hmKit, maKit, extrasData, selOpp) |
| `ferni_active_id` | ID ebook activo |
| `ferni_num_chapters` | Número capítulos |
| `ferni_extras` | Bonus Pack actual (clave independiente, fallback robusto) |

## Pendiente
- **Meta Ads**: refactorizar imágenes con Canvas overlay (mismo sistema que Hotmart)
- PDF preview oscuro al restaurar desde historial — investigar

## Módulos / Tabs
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades |
| 📖 Ebook | Borrador → verificación → PDF |
| 🛒 Hotmart | Kit completo + 5 imágenes Canvas ✅ |
| 📣 Meta Ads | Anuncios + RRSS + precio real + corrector ✅ |
| 🎁 Bonus Pack | 4 PDFs separados + edición + persistencia robusta ✅ |
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
