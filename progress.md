# Progreso FERNI AI - Estado Actual (13 Mayo 2026)

## ÚLTIMO COMMIT
`4d6af73` — Professional formatting: bullet lists, tables, headings in PDF

## Stack Técnico
- **Frontend**: public/index.html (vanilla JS, sin framework)
- **Backend**: api/index.js (Express en Vercel serverless)
- **APIs**: Claude (ebooks), OpenAI GPT-4o (análisis), Serper (búsqueda), DALL-E (imágenes)
- **Deploy**: Vercel → ferni-ai.vercel.app (auto-deploy desde GitHub master)
- **Repo**: https://github.com/loreferfran/ferni-ai

## Cambios Implementados (sesión actual)

### Generación de PDF
- ✅ Fix error "No valid JSON": subido max_tokens 4500 → 8000 para capítulos
- ✅ Modelo actualizado: claude-sonnet-4-5 → claude-sonnet-4-6
- ✅ Fix extractJSON mejorado: repara JSON truncado dentro de strings
- ✅ Fix preview vacío: cambiado div innerHTML → iframe srcdoc (renderiza HTML completo correctamente)
- ✅ Fix idioma mezclado: borrador SIEMPRE en español castellano, prohibidas palabras del idioma del país
- ✅ Eliminada línea "IDIOMA DEL PAIS DESTINO" del contexto (causaba que Claude escribiera en francés)
- ✅ Fix "Table des matières" hardcodeado: ahora usa variable de idioma (Índice de contenidos en español)
- ✅ Fix "Points clés" hardcodeado: ahora multiidioma

### Imágenes del PDF
- ✅ Slots de imágenes dinámicos según tipo de nicho:
  - Nicho visual/práctico (jardín, cocina, fitness, deco...): 7 imágenes (portada + 4 caps + conclusión + antes/después)
  - Nicho teórico (idiomas, finanzas, programación...): 5 imágenes (portada + 4 caps)
  - Detección automática por keywords del nicho
- ✅ Sección "Antes → Después" en PDF para nichos visuales con imagen dedicada

### Búsqueda e Inteligencia
- ✅ Google Trends REAL integrado (google-trends-api npm): score 0-100, búsquedas en alza, Breakout +5000%
- ✅ Fallback automático a Serper si Google bloquea desde Vercel
- ✅ Queries de intención de aprendizaje: "aprender a hacer X", "tutorial principiantes", "aprender fácilmente"
- ✅ Queries de viralidad: "viral tiktok youtube 2025", "tendencia 2025", "ahorro de tiempo"
- ✅ Prompt de análisis OpenAI reescrito: detecta viral, ahorro de tiempo, repetición, intención real de compra
- ✅ Nuevos campos en oportunidades: porQueViral, ahorroTiempo, señalesViralidad
- ✅ Países Asia/Africa/Oceania agregados (sesión anterior)

### Formato Profesional del PDF
- ✅ Claude ahora usa normas de escritura: viñetas •, tablas markdown |col|col|, subtítulos ##
- ✅ Parser formatContent() en frontend convierte markdown → HTML profesional
- ✅ Listas: <ul> con viñetas moradas, una por línea (no texto corrido)
- ✅ Tablas: <table> con cabecera azul, filas alternas, estilo profesional
- ✅ Subtítulos ## dentro de capítulos como <h3>

### UX / Interfaz
- ✅ Removida nota de autora del PDF
- ✅ Removido campo de autora en interfaz (siempre "Fermi Guides")
- ✅ Botón "Regenerar" renombrado a "Regenerar todo (costoso)" con tooltip de advertencia

## Flujo de la App
```
1. Usuario elige país + nicho → EJECUTAR ANÁLISIS
2. Serper API busca (Google + Reddit + YouTube + Amazon)
3. Google Trends real (score, rising queries, breakout)
4. OpenAI GPT-4o analiza resultados → 6 oportunidades con scoreMonetizacion
5. Usuario selecciona oportunidad → Generar PDF
6. Claude genera en 3 partes (p1: intro+cap1+cap2, p2: cap3+cap4, p3: conclusión)
7. Preview en iframe del borrador en ESPAÑOL
8. Usuario hace correcciones via chat (1 llamada Claude, barato)
9. Usuario genera imágenes por slot (DALL-E, clic en cada slot)
10. Usuario aprueba → Claude traduce al idioma del país
11. Descarga PDF final
```

## Estado de Archivos Clave
- **api/index.js**: Búsqueda, análisis GPT-4o, generación Claude, correcciones, imágenes
- **public/index.html**: Toda la UI + lógica frontend + buildFinalPdfHtml + formatContent parser

## Próximos Pasos Pendientes
- 🔄 Probar Google Trends real en Vercel (puede bloquearse por IP)
- 🔄 Revisar que el formato de tablas y listas se genere correctamente en el PDF
- 🔄 Revisar que el borrador salga 100% en español sin mezcla de idiomas
- 🔄 Probar slots de imágenes (clic → DALL-E → inserta en PDF)
- 🔄 Probar flujo completo: búsqueda → oportunidad → PDF → corrección → traducción → descarga

## Notas Técnicas Importantes
- **Regenerar PDF**: consume los mismos créditos que la generación inicial (3 llamadas Claude × 8000 tokens)
- **Corregir PDF (chat)**: mucho más barato (1 llamada Claude × 1000 tokens, solo manda resumen del ebook)
- **Google Trends**: si falla en Vercel (IP bloqueada), cae automáticamente a Serper sin error visible
- **max_tokens**: 8000 para capítulos (suficiente para 2500 palabras en JSON)
- **Modelo**: claude-sonnet-4-6 para todo el ebook
- **Formato**: Claude usa • para listas y | col | para tablas; el frontend las parsea a HTML

## Cómo Continuar
1. Abrir VS Code en este workspace
2. Decir "continuar desde progress.md"
3. Revisar Vercel si hay errores de deploy
4. Probar la app en ferni-ai.vercel.app
