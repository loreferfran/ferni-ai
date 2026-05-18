# Progreso FERNI AI — Estado Actual (19 Mayo 2026 — 19:20)

## ÚLTIMOS CAMBIOS (sesión 19 Mayo — tarde/noche)

### Canvas API — texto perfecto en imágenes Hotmart
- DALL-E genera solo el fondo visual (sin texto)
- Canvas API superpone texto con fuente real, sin distorsión
- **Auto font-size**: si el texto es largo, reduce tamaño hasta que quepa
- **maxWidth 88%**: margen 6% cada lado, nunca toca los bordes
- **Banner dinámico**: altura se ajusta al número de líneas
- Mockup (image_2) también lleva text_overlay: título + subtítulo del ebook
- Estructura Claude: `images[1..5]{ visual_prompt, text_overlay }`
- Compatibilidad: si kit es formato antiguo (`dalle_prompts`), usa fallback automático

### Hotmart kit — mejoras UI
- Botón **↺ Regenerar kit** en cabecera (junto a "Descargar kit Word")
- Regenerar kit usa `S.selOpp` directo si hay ebook activo — no pide selector
- Botón **✕** rojo en cada imagen para eliminarla individualmente
- Descarga imagen con nombre: FERNI_HOTMART_Gancho/Mockup/Credibilidad/Beneficios/Cierre.png
- `dlHmImgDataUrl` descarga el dataURL compuesto por Canvas (imagen + texto)

### Persistencia completa — nada se pierde con Ctrl+Shift+R
- `saveFullDataToHist` guarda `hmKit`, `maKit`, `generatedBonuses`
- IIFE de restauración recupera `hmKit`, `maKit`, `generatedBonuses` al recargar
- `genMeta` y `genBonuses` llaman `saveFullDataToHist` tras generar
- `showTab('meta')` restaura vista si `S.maKit` ya existe

### DALL-E — doble barrera anti-texto
- Prompts Claude reescritos: solo escenas visuales, sin pedir texto
- `noTextRule` añadido en API a TODOS los prompts antes de enviar a DALL-E
- Imagen Credibilidad: escena profesional, sin estadísticas escritas

## COMMITS sesión 19 Mayo (todos)
- `1349976` — Fix: Canvas texto con maxWidth y auto font-size
- `ceb27df` — Fix: Mockup también lleva text_overlay con título y subtítulo
- `fc7b017` — Fix: Regenerar kit usa S.selOpp directo si hay ebook activo
- `35196d7` — Add: botón Regenerar kit en cabecera Hotmart
- `538c951` — Fix: fallback dalle_prompts para kits formato antiguo
- `98bfb05` — Add: botón ✕ para eliminar imagen Hotmart
- `9620a3c` — Add: Canvas API superpone texto en imágenes Hotmart
- `5ba5e6c` — Fix: DALL-E cero texto — doble barrera
- `b347e03` — Fix: persistencia completa hmKit/maKit/generatedBonuses
- `745afeb` — Fix: guardar S.hmKit en localStorage al generar

## LO QUE FUNCIONA HOY ✅
- Generación ebook completo (7 capítulos + conclusión + disclaimer)
- Verificación 3 capas
- Correcciones por capítulo (instantáneo para reemplazos simples, API para cambios complejos)
- Snapshot + Restaurar versión anterior
- PDF final sticky buttons arriba
- Correcciones en PDF final (Cap 1..N + Conclusión + Disclaimer)
- Traducción a 28 idiomas, reanudable si falla
- Kit Hotmart: textos completos (título, subtítulo, headline, bullets, FAQ, garantía, CTA)
- Kit Hotmart: 5 imágenes con Canvas overlay (texto perfecto sin distorsión)
- Imágenes: generar, eliminar ✕, regenerar, descargar nombrado
- Persistencia total: todo sobrevive Ctrl+Shift+R
- Auto-restauración al recargar página

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + kit texts + image prompts), OpenAI GPT-4o (análisis), gpt-image-1 (imágenes), Serper (búsqueda), DataForSEO (keywords)
- **Canvas API**: nativo del navegador — compone DALL-E + texto, cero dependencias, cero costo
- **Deploy**: Vercel Hobby → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel**: 60s por función
- **Storage**: localStorage + IndexedDB (imágenes)

## Flujo Imágenes Hotmart
```
↺ Regenerar kit → Claude devuelve images[1..5]{ visual_prompt, text_overlay }
→ Usuario pulsa slot → DALL-E genera fondo sin texto
→ composeImageWithText() → Canvas superpone text_overlay con fuente real
→ Imagen final compuesta lista para descargar
```

## localStorage — Claves
| Clave | Contenido |
|-------|-----------|
| `ferni_pro` | Historial completo (ebook, finalEbook, hmKit, maKit, generatedBonuses, selOpp) |
| `ferni_active_id` | ID ebook activo |
| `ferni_num_chapters` | Número capítulos |

## Restricciones Permanentes
- No precio del producto en PDF
- No inventar estadísticas sin fuente
- No primera persona
- EUR (€) para herramientas, GBP (£) solo salarios UK
- No pagar nada más que OpenAI y Anthropic antes de vender

## Pendiente
- **Meta Ads**: refactorizar igual que Hotmart — master prompt Claude + Canvas overlay
- PDF preview oscuro al restaurar desde historial — investigar
- Capítulo 3 UK AI tools sobreescrito — pendiente regenerar

## Módulos / Tabs
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades |
| 📖 Ebook | Borrador → verificación → PDF |
| 🛒 Hotmart | Kit completo + 5 imágenes Canvas ✅ |
| 📣 Meta Ads | Anuncios + RRSS (pendiente refactor) |
| 🎁 Bonus Pack | 4 infoproductos |
| 🌍 Traducción | 28 idiomas |
| ➡️ Directo | Tema libre → PDF |
| 🕐 Historial | Ver, restaurar, borrar |

## Variables de Entorno Vercel
CLAUDE_API_KEY ✅ | OPENAI_API_KEY ✅ | SERPER_API_KEY ✅ | DATAFORSEO_LOGIN ✅ | DATAFORSEO_PASSWORD ✅

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir: **"continuar desde progress.md"**
