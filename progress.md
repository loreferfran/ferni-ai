# Progreso FERNI AI — Estado Actual (19 Mayo 2026)

## ÚLTIMOS CAMBIOS (sesión 19 Mayo)
- **Traducción reanudable** — si falla en Capítulo 6, el progreso queda guardado en `S.translationProgress`. Al pulsar APROBAR de nuevo, pregunta si continuar desde donde falló. Solo paga tokens por los capítulos pendientes.
  - Guarda header, cada capítulo y conclusión según se completan
  - `failedAt` indica exactamente qué capítulo falló
  - Al completar, limpia `S.translationProgress = null`
  - Mensaje de error claro: "X capítulos ya traducidos — pulsa APROBAR para continuar desde Capítulo Y"

## ÚLTIMOS COMMITS (sesión 18 Mayo)
- `c8cb0c7` — Fix: correcciones simples de símbolo/texto se aplican sin API — instantáneo y sin errores de parseo ✅
- `decc659` — Fix: patch-chapter tokens dinámicos según tamaño del capítulo — evita truncamiento JSON
- `7462a0c` — Fix: 7 chapter buttons — save numChapters to tiny localStorage key, survive quota overflow ✅
- `844a096` — Update progress.md

## COMMITS sesión 17 Mayo (referencia)
- `9bc6e33` — Fix: rebuildRewriteBtns al final del script
- `932aeb3` — Fix: outline respeta estructura del tema
- `326687f` — Add: auto-continuación cuando capítulo es largo
- `95e7b28` — Fix: arquitectura correcta — 1 llamada Claude por request
- `f4add48` — Fix: truncamiento JSON en reescritura
- `012d176` — Fix: capítulos de cualquier tamaño
- `49845e5` — Fix: reescritura capítulo 2 llamadas + sanitizar ASCII
- `3ac8932` — Add: panel reescritura por capítulo

## LO QUE FUNCIONA HOY ✅
- 7 botones de capítulos aparecen correctamente al recargar
- ✏️ Corregir texto: reemplazos simples (símbolo/palabra) → instantáneo, sin API
  - Ejemplos: `reemplaza £ por €`, `cambia 2024 a 2026`, `£ → €`
- 🔄 Regenerar capítulo: reescritura completa con instrucciones
- Snapshot + Restaurar versión anterior antes de cada cambio
- Auto-guardado en localStorage tras cada corrección
- Auto-restauración del ebook al recargar la página

## Causa raíz del bug "4 capítulos" (RESUELTO)
El ebook de 7 capítulos supera el límite de localStorage (~5MB).
`saveEbookToHist` fallaba silenciosamente → `ferni_active_id` nunca se guardaba
→ al recargar, `nc = 4` (default hardcodeado).

**Solución:**
- `ferni_active_id` y `ferni_num_chapters` se guardan en claves tiny separadas (nunca fallan por cuota)
- Si el JSON grande falla, borra ebooks de entradas viejas y reintenta
- IIFE final usa `ferni_num_chapters` como fallback directo

## Cómo funciona ✏️ Corregir texto
- Detecta patrón "reemplaza X por Y" / "cambia X a Y" / "X → Y"
- Si X es ≤20 chars: aplica `replace()` directo en el JSON del capítulo — **instantáneo**
- Si no detecta patrón simple: llama a `/api/patch-chapter` con tokens dinámicos (4000-8000 según tamaño)

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + verificación), OpenAI GPT-4o (análisis + quick-brief), gpt-image-1 (imágenes), Serper (búsqueda web), DataForSEO (volumen keywords)
- **Deploy**: Vercel Hobby gratuito → ferni-ai.vercel.app
- **Repo**: https://github.com/loreferfran/ferni-ai
- **Timeout Vercel Hobby**: 60s por función → arquitectura: 1 llamada Claude = 1 request
- **Storage**: localStorage (metadatos + historial) + IndexedDB (imágenes)

## localStorage — Claves usadas
| Clave | Tamaño | Contenido |
|-------|--------|-----------|
| `ferni_pro` | Grande (~5MB) | Array historial completo |
| `ferni_active_id` | Tiny | ID del ebook activo actual |
| `ferni_num_chapters` | Tiny | Número de capítulos del ebook activo |

## Flujo Módulo 2 — Directo
```
Tema libre → Serper 3 búsquedas → GPT-4o brief → Claude 7 pasos
→ verificación Capa 3 → correcciones por capítulo → PDF final
```

## Panel Reescritura por Capítulo
- **✏️ Corregir texto** → reemplazo instantáneo (sin API) o patch quirúrgico
- **🔄 Regenerar** → reescritura completa (metadataOnly + contentOnly, 2 requests)
- Snapshot automático antes de cualquier cambio → Restaurar versión anterior

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
- Moneda: EUR (€) para precios de herramientas, GBP (£) para salarios/contexto laboral británico

## Pendiente
- Capítulo 3 (UK AI tools) fue sobreescrito accidentalmente — regenerar con prompt detallado
- Capítulo 5 (Otter.ai) estaba truncado — verificar y corregir si hace falta
- PDF preview aparece oscuro/vacío al restaurar desde historial — investigar

## Ebook UK AI tools — Prompt Módulo Directo
```
Guía completa de herramientas AI para trabajadores del Reino Unido 2026.
CONTENIDO OBLIGATORIO: mini-cursos de ChatGPT, Claude, Copilot, Gemini,
Canva AI, Otter.ai, Midjourney y Perplexity.
ESTRUCTURA: exactamente 2 herramientas AI por capítulo.
Cada mini-curso: qué es, configuración en UK, 3 casos de uso,
prompts listos para usar, errores comunes.
```

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

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir: **"continuar desde progress.md"**
