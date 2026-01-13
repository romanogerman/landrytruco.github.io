# Anotador de Truco 🎴

Aplicación web para anotar partidas de Truco con un diseño visual único que utiliza papas fritas animadas como sistema de conteo. Guarda el progreso automáticamente en `localStorage` del navegador.

## ✨ Características

- **Sistema de conteo visual**: Las papas fritas forman marcos cuadrados (5 puntos por cuadrado) con su diagonal característica
- **Diseño temático**: Logo personalizado de "Garage" y guarda decorativa estilo tablero
- **Persistencia automática**: El estado del juego se guarda en localStorage
- **Historial completo**: Accede al VAR para revisar todos los movimientos de la partida
- **Separador a los 15 puntos**: Línea divisoria visual cuando se alcanza la mitad del juego
- **Responsive**: Diseño adaptado para escritorio y móviles
- **Modal de victoria**: Notificación al alcanzar la meta de puntos

## 🎮 Uso

1. Abrir `index.html` en un navegador moderno
2. Opcional: usar Live Server o servir con:
   ```bash
   python -m http.server 8000
   ```
3. Personalizar nombres de equipos
4. Usar botones + y - para sumar/restar puntos
5. Acceder al menú (☰) para:
   - Ver historial completo (VAR)
   - Reiniciar la partida

## 📁 Estructura del Proyecto

```
Truco/
├── index.html          # Interfaz principal
├── style.css           # Estilos y diseño visual
├── app.js              # Lógica del juego y localStorage
├── assets/
│   ├── logo_garage.png           # Logo principal
│   ├── papafrita.svg             # Diseño base de papa (vertical)
│   ├── papafrita-horizontal.svg  # Papa horizontal para top/bottom
│   ├── papafrita1-5.svg          # Variantes de papas
│   ├── var.svg                   # Icono del historial
│   └── restar.png                # Icono de reiniciar
└── README.md
```

## 🎨 Sistema Visual

- **Papas fritas**: Cada punto se representa con una papa frita en estilo cartoon
- **Marco cuadrado**: 5 papas forman un marco (top, right, bottom, left + diagonal)
- **Guarda decorativa**: Patrón de cuadrados rojos y blancos en 2 filas intercaladas
- **Colores**: Esquema de rojos (#d92e03, #b71c1c) con detalles en naranja

## 🔧 Tecnologías

- HTML5
- CSS3 (Grid, Flexbox, gradientes)
- JavaScript Vanilla
- SVG para gráficos vectoriales
- localStorage API

## 📝 Notas

- La meta predeterminada es 30 puntos
- El historial registra cada movimiento con timestamp
- Los nombres de equipos por defecto son "Nosotros" y "Ellos"
- El estado se guarda automáticamente con cada cambio
