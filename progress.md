# Progreso FERNI AI — Estado Actual (13 Mayo 2026)

## ÚLTIMO COMMIT
`0cf490f` — Selector de idioma en Aprobar: usuario elige destino, no el país automático

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks + traducción), OpenAI GPT-4o (análisis), Serper (búsqueda), DALL-E (imágenes)
- **Deploy**: Vercel → ferni-ai.vercel.app (auto-deploy desde GitHub master)
- **Repo**: https://github.com/loreferfran/ferni-ai

## Flujo Actual de la App (DEFINITIVO)
```
1. Usuario elige país + nicho → EJECUTAR ANÁLISIS
2. Serper API busca (Google + Reddit + YouTube + Amazon)
3. Google Trends real (score 0-100, rising queries, Breakout +5000%) con fallback a Serper
4. OpenAI GPT-4o analiza resultados → 6 oportunidades con scoreMonetizacion
5. Usuario selecciona oportunidad → Generar borrador ebook
6. Claude genera en 3 partes (p1: intro+cap1+cap2, p2: cap3+cap4, p3: conclusión)
   → SIEMPRE EN ESPAÑOL, Claude NO ve el idioma de destino en este paso
7. Preview en iframe del borrador en ESPAÑOL
8. Usuario hace correcciones via chat (1 llamada Claude barata, solo manda resumen)
9. Usuario genera imágenes por slot (DALL-E, clic en cada slot)
10. Usuario elige idioma en el selector (pre-seleccionado con idioma del país, editable)
11. APROBAR → Claude traduce al idioma elegido (/api/translate-custom)
12. Preview del PDF final traducido
13. Descarga PDF final
```

## Módulo Traducción (tab 🌍) — NUEVO
- Tab separado para traducir a CUALQUIER idioma (independiente del flujo de país)
- Selector con 28 idiomas: inglés, francés, alemán, italiano, portugués, chino, japonés, coreano, árabe, ruso, turco, polaco, holandés, sueco, noruego, danés, finlandés, griego, rumano, húngaro, checo, tailandés, vietnamita, indonesio, hebreo, hindi, español España
- Útil para reutilizar un ebook ya creado en otro mercado sin repetir todo el proceso

## Por Qué Claude Ya No Mezcla Idiomas
- Borrador: Claude solo recibe instrucción "ESCRIBE EN ESPAÑOL CASTELLANO" — no sabe nada del idioma de destino
- Traducción: ocurre DESPUÉS del borrador, en llamada separada, cuando ya todo está aprobado
- Eliminada la detección automática de idioma por país en approveEbook()

## Cambios Implementados (sesión 13 Mayo)

### Idioma del PDF
- ✅ Fix buildFinalPdfHtml: reemplaza 'Introduction' hardcoded → variable `lblIntro`
- ✅ buildPdfHtml() reemplazado para delegar a buildFinalPdfHtml (elimina duplicado francés)
- ✅ approveEbook() ahora lee selector #eb-lang-sel en vez de idioma automático del país
- ✅ renderDraft() pre-selecciona idioma del país en el selector pero usuario puede cambiarlo

### Nuevo Endpoint Backend
- ✅ `/api/translate-custom`: traduce ebook a cualquier idioma sin adaptación cultural forzada
  - 2 llamadas Claude (parte 1: intro+cap1+cap2 / parte 2: cap3+cap4+conclusión)
  - 7000 max_tokens por llamada
  - Sin requerir country — solo language + ebook + author

### UI
- ✅ Selector de 28 idiomas visible en la sección de borrador (antes del botón Aprobar)
- ✅ Nuevo tab 🌍 Traducción con selector + preview + descarga
- ✅ Estado S ampliado: translatedEbook, translatedLang, translatedPdfHtml

### Sesión anterior (mismo día)
- ✅ Fix error "No valid JSON": max_tokens 4500 → 8000
- ✅ Modelo: claude-sonnet-4-6
- ✅ Fix preview: div innerHTML → iframe srcdoc
- ✅ Borrador SIEMPRE en español, prohibidas palabras del idioma del país
- ✅ Fix "Table des matières" y "Points clés" hardcodeados → variables multiidioma
- ✅ Google Trends real integrado con fallback automático a Serper
- ✅ Queries de intención de aprendizaje y viralidad
- ✅ Prompt OpenAI reescrito: detecta viral, ahorro de tiempo, intención real de compra
- ✅ Slots de imágenes dinámicos: 7 para nichos visuales, 5 para nichos teóricos
- ✅ Sección "Antes → Después" en PDF para nichos visuales
- ✅ Formato profesional: • viñetas, | tablas, ## subtítulos → parser formatContent() en frontend
- ✅ Países Asia/Africa/Oceania agregados
- ✅ Removida autora de interfaz (siempre "Ferni Guides")

## Estado de Archivos Clave
- **api/index.js**: Búsqueda, análisis GPT-4o, generación Claude, correcciones, imágenes, translate-ebook, translate-custom
- **public/index.html**: Toda la UI + lógica frontend + buildFinalPdfHtml + formatContent parser + módulo traducción

## Notas Técnicas
- **Generar PDF completo**: 3 llamadas Claude × 8000 tokens (costoso, usar solo si necesario)
- **Corregir PDF (chat)**: 1 llamada Claude × 1000 tokens (barato, usa solo resumen del ebook)
- **Traducir ebook**: 2 llamadas Claude × 7000 tokens (translate-custom)
- **Google Trends**: si falla en Vercel (IP bloqueada), cae automáticamente a Serper
- **Formato**: Claude usa • para listas y | col | para tablas; el frontend las parsea a HTML

## Próximos Pasos Pendientes
- 🔄 Probar Google Trends real en Vercel (puede bloquearse por IP)
- 🔄 Probar slots de imágenes (clic → DALL-E → inserta en PDF)
- 🔄 Probar flujo completo: búsqueda → oportunidad → borrador → corrección → elegir idioma → traducir → descarga
- 🔄 Verificar que el formato de tablas y listas se genera correctamente en el PDF
- 🔄 Revisar dlFinalEbook() — tiene "Introduction" y "Conclusion" hardcodeados (función secundaria de descarga Word)

## Cómo Continuar en un Nuevo Chat
1. Abrir VS Code en este workspace
2. Escribir exactamente: **"continuar desde progress.md"**
3. Claude leerá este archivo y tendrá todo el contexto
4. Revisar Vercel si hay errores de deploy en ferni-ai.vercel.app
