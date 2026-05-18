# Progreso FERNI AI — Estado Actual (18 Mayo 2026)

## ÚLTIMOS COMMITS (sesión 18 Mayo)
- `7462a0c` — Fix: 7 chapter buttons — save numChapters to tiny localStorage key, survive quota overflow

## COMMITS sesión 17 Mayo (referencia)
- `9bc6e33` — Fix: rebuildRewriteBtns al final del script — después de que todas las funciones estén definidas
- `932aeb3` — Fix: outline respeta estructura del tema (mini-cursos, herramientas específicas)
- `326687f` — Add: auto-continuación cuando capítulo es largo — sin intervención del usuario
- `95e7b28` — Fix: arquitectura correcta — 1 llamada Claude por request, frontend orquesta
- `f4add48` — Fix: truncamiento JSON en reescritura — split metadata+content sin JSON
- `012d176` — Fix: capítulos de cualquier tamaño — auto-extensión + max_tokens igualados
- `49845e5` — Fix: reescritura capítulo — 2 llamadas para contenido largo + sanitizar ASCII
- `3ac8932` — Add: panel reescritura por capítulo — openChRewrite() + runChRewrite()

## COMMITS sesión 16 Mayo (referencia)
- `014b29b` — Add: Serper en Módulo Directo
- `41e407e` — Fix: historial botones clickeables
- `2ad5817` — Fix: restricción permanente precio del producto
- `5e9ff28` — Add: verificación de hechos 3 capas
- `b4a5c6c` — Enhance: paletas dinámicas + parser visual + retry por capítulo

## Causa raíz del bug "4 capítulos" (RESUELTO en 7462a0c)
El ebook de 7 capítulos es demasiado grande para localStorage (límite ~5MB).
`saveEbookToHist` fallaba silenciosamente en el `try/catch` → `ferni_active_id` nunca se guardaba
→ al recargar, auto-restore no encontraba el ebook activo → `nc = 4` (default hardcodeado).

**Solución triple:**
1. Guardar `ferni_active_id` y `ferni_num_chapters` en localStorage ANTES del JSON grande (nunca fallan)
2. Si el JSON grande falla por cuota, eliminar ebooks de entradas viejas y reintentar
3. Auto-restore y IIFE final usan `ferni_num_chapters` como fallback
4. `generateDirectEbook` guarda `ferni_active_id` inmediatamente al crear la entrada (no esperar al fin del ebook)

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + verificación), OpenAI GPT-4o (análisis + quick-brief), gpt-image-1 (imágenes), Serper (búsqueda web), DataForSEO (volumen keywords)
- **Deploy**: Vercel Hobby gratuito → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel Hobby**: 60s por función → arquitectura: 1 llamada Claude = 1 request

## Flujo Módulo 1 — Automático
```
País + nicho → Serper → DataForSEO → GPT-4o → 10 oportunidades
→ selección → Claude 7 pasos (header/outline/ch1-4/ending)
→ verificación Capa 3 → chat correcciones → imágenes → PDF final
```

## Flujo Módulo 2 — Directo
```
Tema libre (con instrucciones detalladas) → Serper 3 búsquedas
→ GPT-4o brief → Claude 7 pasos → verificación → PDF final
```

## Panel Reescritura por Capítulo
Botones Cap 1-N → abre textarea con instrucciones.

### Dos modos de corrección:
- **✏️ Corregir texto** → `runChPatch()` → `/api/patch-chapter` → solo aplica el cambio indicado (~15s)
  - Guarda snapshot antes de modificar → botón "Restaurar versión anterior" aparece
  - Auto-guarda en historial + actualiza PDF
- **🔄 Regenerar capítulo** → `runChRewrite()` → reescribe el capítulo completo con instrucciones (~60s)

### Flujo reescritura completa (3 requests separados, cada uno <60s):
1. `metadataOnly` → title, opening, keyPoints, exercise (~15s)
2. `contentOnly` → content como Markdown puro (~40s)
   - Si `truncated:true` → auto-continuación sin que el usuario haga nada
3. (opcional) `contentOnly` con `--- PARTE 2 ---` para capítulos muy largos

### Separador para capítulos muy largos:
```
[instrucciones primeras secciones]

--- PARTE 2 ---

[instrucciones secciones restantes]
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
- Todo en español en Fase 1
- Moneda: EUR (€) para precios de herramientas, GBP (£) para salarios/contexto laboral británico

## Sanitizador ASCII en PDF
`sanitizeAsciiBoxes()` en `preProcessTags()`:
convierte ╔═╗/┌─┐ a divs HTML. Claude usa [HIGHLIGHT BOX] en rewrites.

## generate-chapter — Flags disponibles
| Flag | Uso | Tiempo |
|------|-----|--------|
| `section: ch1-chN` | generación normal JSON | ~40s |
| `metadataOnly: true` | solo metadata sin content | ~15s |
| `contentOnly: true` | solo content texto Markdown | ~40s |
| `contentOnly + previousContent` | continuación del content | ~40s |
| `chMaxTokens = 8000` | rewrites; 1800 generación normal | — |

## localStorage — Claves usadas
| Clave | Tamaño | Contenido |
|-------|--------|-----------|
| `ferni_pro` | Grande (~5MB) | Array historial completo (puede fallar si ebooks grandes) |
| `ferni_active_id` | Tiny | ID del ebook activo actual |
| `ferni_num_chapters` | Tiny | Número de capítulos del ebook activo |

## Paletas Dinámicas por Nicho
`getNichePalette(o)` → 5 paletas via `P.xxx`:
beauty/yoga → rosa | fitness → naranja | lifestyle → mint | business/AI → navy | default → morado

## Módulos / Tabs
| Tab | Función |
|-----|---------|
| 🔍 Análisis | País + nicho → 10 oportunidades |
| 📖 Ebook | Borrador → verificación → PDF |
| 🛒 Hotmart | Kit Marketing completo |
| 📣 Meta Ads | Anuncios + contenido RRSS |
| 🎁 Bonus Pack | 4 infoproductos complementarios |
| 🌍 Traducción | 28 idiomas |
| ➡️ Directo | Tema libre → PDF |
| 🕐 Historial | Ver, restaurar, borrar |

## Variables de Entorno Vercel
CLAUDE_API_KEY ✅ | OPENAI_API_KEY ✅ | SERPER_API_KEY ✅ | DATAFORSEO_LOGIN ✅ | DATAFORSEO_PASSWORD ✅

## Pendiente
- Capítulo 3 (UK AI tools) fue sobreescrito accidentalmente — necesita regenerarse con el prompt detallado de mini-cursos AI
- Capítulo 5 (Otter.ai) estaba truncado — puede necesitar corrección
- PDF preview a veces aparece vacío/oscuro después de restaurar desde historial

## Ebook UK AI tools — Prompt Módulo Directo usado
```
Guía completa de herramientas AI para trabajadores del Reino Unido 2026.
CONTENIDO OBLIGATORIO: mini-cursos de ChatGPT, Claude, Copilot, Gemini,
Canva AI, Otter.ai, Midjourney y Perplexity.
ESTRUCTURA: exactamente 2 herramientas AI por capítulo.
Cada mini-curso: qué es, configuración en UK, 3 casos de uso,
prompts listos para usar, errores comunes.
```

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir: **"continuar desde progress.md"**
