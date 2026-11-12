# 🚀 NASA 1962: Desafío Euler en el Espacio
### Simulación Numérica Interactiva y Análisis de Trayectorias de Ascenso
**Asignatura:** Métodos Numéricos  
**Tema:** Ecuaciones Diferenciales Ordinarias (EDO) de Primer Orden  
**Modalidad:** Individual (20 / 20 Puntos)  
**Inspiración Histórica:** Película *Talentos Ocultos* (*Hidden Figures*) / *Mentes Brillantes* — Katherine Johnson, John Glenn y la misión orbital Mercury-Atlas 6 (1962).

---

## 🛰️ 1. Descripción del Proyecto

Este repositorio contiene una **aplicación web interactiva de simulación física y numérica** que modela el despegue vertical de un cohete experimental de la NASA durante sus primeros 20 segundos de vuelo propulsado.

La herramienta permite:
1. **Configurar parámetros físicos en tiempo real:** Masa del cohete ($m$), empuje del motor ($T$), gravedad ($g$), arrastre aerodinámico lineal ($c$), tiempo de simulación y tamaño de paso temporal ($h$).
2. **Ejecutar 3 algoritmos numéricos en simultáneo:**
   - **Método de Euler hacia adelante** (orden $O(h)$) - Algoritmo base.
   - **Método de Heun / Predictor-Corrector** (orden $O(h^2)$) - Ampliación de orden 2.
   - **Método de Runge-Kutta de 4.º Orden (RK4)** (orden $O(h^4)$) - Ampliación de alta precisión.
3. **Contrastar contra la Solución Analítica Exacta:** Derivada por separación de variables y cálculo integral.
4. **Visualizar el vuelo en un Canvas HTML5 interactivo:** Animación con física en tiempo real, efectos de partículas de escape y HUD de telemetría.
5. **Analizar gráficas interactivas con Chart.js:** Curvas de velocidad, altura, errores absolutos en el tiempo y gráficos de convergencia logarítmica.
6. **Consultar la tabla de iteraciones paso a paso** y descargar la telemetría en formato `.csv` compatible con Excel.
7. **Revisar el desarrollo teórico completo y las respuestas a las preguntas de reflexión** desde las pestañas integradas en la aplicación.

---

## 📁 2. Estructura del Repositorio

```text
desafio-euler-espacio/
│
├── index.html                  # Aplicación web completa con interfaz de Control de Misión
├── style.css                   # Hoja de estilos moderna estilo NASA Mission Control
├── simulation.js               # Motor de cálculo numérico, gráficas Chart.js y Canvas 2D
├── INFORME_DESAFIO_EULER.md    # Informe académico completo con deducciones y respuestas
├── GUION_VIDEO_2MIN.md         # Guion estructurado segundo a segundo para el video de 2 min
└── README.md                   # Documentación técnica del proyecto y guía de despliegue
```

---

## 🧮 3. Modelo Matemático y Solución Analítica

### Sistema de EDOs
A partir de la Segunda Ley de Newton ($\sum F_y = m \cdot a$):
$$\frac{dv}{dt} = 5{,}19 - 0{,}1 v, \quad v(0) = 0\text{ m/s}$$
$$\frac{dh}{dt} = v, \quad h(0) = 0\text{ m}$$

### Solución Analítica Exacta
$$v(t) = 51{,}9 \left(1 - e^{-0{,}1 t}\right)$$
$$h(t) = 51{,}9 t - 519 \left(1 - e^{-0{,}1 t}\right)$$

### Valores a $t = 20\text{ s}$ ($h = 2\text{ s}$)
| Método | Velocidad $v(20)$ (m/s) | Error Vel. (m/s) | Altura $h(20)$ (m) | Error Altura (m) | Factor de Mejora vs Euler |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Euler ($O(h)$)** | $46{,}3273$ | $1{,}4512$ | $574{,}7272$ | $14{,}5118$ | $1\times$ (Base) |
| **Heun ($O(h^2)$)** | $44{,}7664$ | $0{,}1097$ | $590{,}3355$ | $1{,}0965$ | **$13\times$ más preciso** |
| **RK4 ($O(h^4)$)** | $44{,}8759$ | $0{,}0002$ | $589{,}2412$ | $0{,}0022$ | **$6.554\times$ más preciso** |
| **Exacta (Analítica)** | **$44{,}8761$** | **0** | **$589{,}2390$** | **0** | **Exacto** |

---

## 💻 4. Cómo Ejecutar la Aplicación Localmente

No se requiere instalar Node.js, Python ni servidores pesados. La aplicación está construida en **HTML5 puro, CSS3 y JavaScript moderno**.

1. Clona o descarga esta carpeta.
2. Abre el archivo `index.html` haciendo doble clic en él con cualquier navegador moderno (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).
3. ¡Listo! Todo el sistema interactivo se ejecutará de forma instantánea.

---

## 🌐 5. Cómo Publicar en GitHub y Activar GitHub Pages (Gratis)

Para obtener un enlace web público funcional para la entrega de la tarea:

1. Crea un repositorio nuevo en tu cuenta de GitHub (por ejemplo, `desafio-euler-espacio`).
2. En tu terminal o consola Git, ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Desafío Euler en el Espacio - Métodos Numéricos NASA 1962"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/desafio-euler-espacio.git
   git push -u origin main
   ```
3. En la página de tu repositorio en GitHub:
   - Ve a **Settings** (Configuración) -> pestaña **Pages**.
   - En **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
   - Selecciona la rama `main` y la carpeta `/(root)`.
   - Haz clic en **Save** (Guardar).
4. En 1 minuto, GitHub generará tu enlace público:  
   `https://TU_USUARIO.github.io/desafio-euler-espacio/`

---

## 🎬 6. Entregables Incluidos en este Repositorio

- [x] **Aplicación Web Funcional:** `index.html`, `style.css`, `simulation.js`.
- [x] **Solución Analítica y EDOs:** Desarrollada paso a paso en `INFORME_DESAFIO_EULER.md` y dentro de la pestaña teórica de la aplicación.
- [x] **Implementación de Euler, Heun y RK4:** Con comparativa de orden de convergencia.
- [x] **Tabla de Iteraciones y Exportación CSV:** Lista para descargar.
- [x] **Respuestas a las 5 Preguntas de Reflexión:** Contextualizadas en la película *Talentos Ocultos*.
- [x] **Guion para Video de 2 Minutos:** Detallado segundo a segundo en `GUION_VIDEO_2MIN.md`.
