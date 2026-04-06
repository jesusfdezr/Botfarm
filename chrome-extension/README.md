# 🛡️ BotFarm Twitter Spam Reporter - Chrome Extension

Extension para detectar y reportear spam bots en X/Twitter sin necesidad de API.

## ⚠️ ADVERTENCIA IMPORTANTE

Esta herramienta debe usarse **ÚNICAMENTE** para casos legítimos de spam, harassment o cuentas maliciosas verificadas. El uso indebido puede violar los Términos de Servicio de Twitter.

## 📦 Instalación

1. **Clona el repositorio** o descarga la carpeta `chrome-extension`
2. Abre Chrome y navega a `chrome://extensions/`
3. Activa **Modo de desarrollador** (esquina superior derecha)
4. Haz clic en **Cargar descomprimida**
5. Selecciona la carpeta `chrome-extension`

## 🚀 Uso

### Desde el popup:
1. Navega a `twitter.com/notifications`
2. Haz clic en el icono de la extensión
3. Pulsa **Escanear notificaciones**
4. Revisa las cuentas detectas como spam
5. Reportea y/o bloquea manualmente

### Desde la página:
- La extensión agrega botones de **🚩 Report** y **🚫 Block** automáticamente en cada notificación
- Puedes activar/desactivar esta función desde el popup

## 🎯 Características

- ✅ Escaneo automático de notificaciones
- ✅ Detección de spam basada en indicadores:
  - Avatar por defecto
  - Patrones de username sospechosos
  - Cuentas muy nuevas
  - Contenido repetitivo
- ✅ Botones de acción directa en notificaciones
- ✅ Reporte automático con un clic
- ✅ Bloqueo automático con un clic
- ✅ Estadísticas de actividad
- ✅ Sin necesidad de API de Twitter

## 🔒 Seguridad

- **No almacena credenciales**
- **No envía datos a servidores externos**
- **Todo se ejecuta localmente en tu navegador**
- Código open-source y auditable

## 🛠️ Tecnologías

- Manifest V3 (Chrome Extensions)
- JavaScript vanilla
- CSS3 con animaciones

## 📝 Notas

- El algoritmo de detección está en versión inicial
- Puede haber falsos positivos - **revisa siempre antes de reportear**
- Twitter puede cambiar su interfaz y romper la extensión

## 🐛 Troubleshooting

**No aparecen los botones:**
- Recarga la página de notificaciones
- Verifica que estás en twitter.com o x.com

**Error al reportear:**
- Twitter puede haber cambiado sus selectores
- Revisa la consola para más detalles

## 📄 Licencia

MIT - Parte del proyecto BotFarm
