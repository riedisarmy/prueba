// Variables globales para almacenar los datos y la instancia del gráfico
let dataset = [];
let columnNames = [];
let chartInstance = null;


// ====================
// FUNCIÓN AÑADIDA: Generar Colores Aleatorios
// ====================
// Función para generar colores aleatorios
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * 200);
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`); // Color con opacidad
    }
    return colors;
}

// ...

function renderChart(type, xAxisLabel, yAxisLabel, labels, values) {
    // ...
    let chartColors;
    if (type === 'pie') {
        chartColors = generateColors(labels.length); // Genera N colores
        // ...
    } else {
        // Para otros tipos, usamos un color sólido por defecto
        chartColors = 'rgba(75, 192, 192, 0.6)'; 
    }

    chartInstance = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: datasetLabel,
                backgroundColor: chartColors, // Array de colores para 'pie'
                // ...
            }]
        },
        // ...
    });
}
// ====================
// PASO 1: MANEJAR LA CARGA DE ARCHIVO
// ====================

document.getElementById('upload-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('data-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecciona un archivo CSV.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Deshabilitar botón mientras se carga
    const uploadButton = e.target.querySelector('button');
    uploadButton.textContent = 'Cargando...';
    uploadButton.disabled = true;

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        uploadButton.textContent = 'Cargar y Analizar';
        uploadButton.disabled = false;

        if (data.success) {
            dataset = data.data_records;
            columnNames = data.columns;
            
            // Actualizar la interfaz de usuario con la información cargada
            updateUI(data.row_count, columnNames);
            
        } else {
            alert('Error del servidor: ' + data.error);
        }
    })
    .catch(error => {
        uploadButton.textContent = 'Cargar y Analizar';
        uploadButton.disabled = false;
        alert('Error de conexión: ' + error);
    });
});


// ====================
// PASO 2: CONFIGURAR LA INTERFAZ Y EVENTOS
// ====================

function updateUI(rowCount, columns) {
    // 1. Mostrar las estadísticas y el panel de configuración
    document.getElementById('row-count').textContent = rowCount;
    document.getElementById('col-count').textContent = columns.length;
    document.getElementById('visualization-settings').style.display = 'block';

    // 2. Llenar los selectores de eje X e Y con los nombres de las columnas
    const xAxisSelect = document.getElementById('x-axis');
    const yAxisSelect = document.getElementById('y-axis');
    
    // Limpiar selectores previos
    xAxisSelect.innerHTML = '';
    yAxisSelect.innerHTML = '';
    
    columns.forEach(col => {
        const optionX = new Option(col, col);
        const optionY = new Option(col, col);
        xAxisSelect.appendChild(optionX);
        yAxisSelect.appendChild(optionY);
    });
}

// Evento para el botón "Dibujar Gráfico"
document.getElementById('draw-chart-btn').addEventListener('click', function() {
    const chartType = document.getElementById('chart-type').value;
    const xAxisCol = document.getElementById('x-axis').value;
    const yAxisCol = document.getElementById('y-axis').value;

    if (!xAxisCol || !yAxisCol) {
        alert('Por favor, selecciona las columnas para los ejes X e Y.');
        return;
    }
    
    // Procesar los datos antes de graficar
    const processedData = processDataForChart(xAxisCol, yAxisCol);
    
    // Renderizar el gráfico
    renderChart(chartType, xAxisCol, yAxisCol, processedData.labels, processedData.values);
});


// ====================
// PASO 3: PROCESAMIENTO Y RENDERIZADO DEL GRÁFICO
// ====================

function processDataForChart(xAxisCol, yAxisCol) {
    const labels = [];
    const values = [];

    // Lógica para gráficos de Barras/Líneas: Agrupar por la columna X y sumar/contar la columna Y
    // Esto es una simplificación. En un proyecto más avanzado, esto debería hacerse en Flask
    const aggregatedData = {};
    
    dataset.forEach(row => {
        const xVal = String(row[xAxisCol]); // Asegurar que la etiqueta X es un string
        let yVal = row[yAxisCol];
        
        // Intentar convertir Y a número para sumarlo
        if (typeof yVal === 'string') {
            yVal = parseFloat(yVal.replace(/,/g, '')); // Limpiar comas y convertir
            if (isNaN(yVal)) yVal = 1; // Si no es número, tratamos como conteo (1)
        }

        if (!aggregatedData[xVal]) {
            // Inicializar el valor para la etiqueta X
            aggregatedData[xVal] = 0;
        }
        
        // Acumular el valor Y (o contar si yVal es 1)
        aggregatedData[xVal] += yVal;
    });

    // Separar en arrays de etiquetas y valores
    for (const key in aggregatedData) {
        labels.push(key);
        values.push(aggregatedData[key]);
    }

    return { labels, values };
}
function renderChart(type, xAxisLabel, yAxisLabel, labels, values) {
    const ctx = document.getElementById('myChart').getContext('2d');

    // Destruir la instancia de gráfico anterior si existe
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Crear la nueva instancia del gráfico
    chartInstance = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: `${yAxisLabel} por ${xAxisLabel}`,
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite ajustar el tamaño en el contenedor
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: xAxisLabel
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Gráfico de ${yAxisLabel} vs ${xAxisLabel}`
                }
            }
        }
    });
}
