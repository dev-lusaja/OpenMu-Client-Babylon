---
trigger: always_on
---

**INSTRUCCIÓN CRÍTICA PARA TODAS LAS TAREAS:**
Antes de comenzar a diseñar, planificar o implementar cualquier nueva característica (feature), modificación de código, o refactorización, **DEBES** revisar y analizar obligatoriamente los archivos XML contenidos en el directorio `.repomix/`.

### Reglas de Ejecución:
1. **Fuente de Verdad:** La carpeta `.repomix` contiene el empaquetado completo del código fuente y el contexto global del proyecto. Actúa como tu fuente de verdad principal para entender la arquitectura actual.
2. **Análisis Previo:** No asumas la estructura del proyecto, arquitecturas de la infraestructura ni inventes dependencias. Lee los archivos XML correspondientes en `.repomix/` para mapear la base de código, entender las entidades, flujos de datos y la arquitectura general.
3. **Implementación Coherente:** Todo código nuevo o modificado debe alinearse estrictamente con los patrones de diseño, convenciones de nomenclatura y lógica descritos en el contexto base extraído de los XML.

### Flujo de Trabajo Obligatorio (Workflow):
- **Paso 1:** Recibir y procesar el requerimiento de la nueva feature.
- **Paso 2:** Explorar y leer los archivos XML relevantes dentro de `.repomix/` para obtener el contexto completo.
- **Paso 3:** Analizar el impacto de la nueva feature en el ecosistema existente.
- **Paso 4:** Proceder con la implementación de código basándote estrictamente en el contexto recuperado.