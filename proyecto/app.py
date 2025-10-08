from flask import Flask, render_template, request, jsonify
import pandas as pd
import io

app = Flask(__name__)

# ====================
# RUTAS DE LA APLICACIÓN
# ====================

@app.route('/')
def index():
    """Ruta principal: Muestra la página de carga."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Ruta para manejar la carga del archivo y procesar los datos."""
    
    if 'file' not in request.files:
        return jsonify({'error': 'No se encontró la parte del archivo.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo.'}), 400
        
    if file:
        try:
            # Leer el contenido del archivo subido como una cadena
            stream = io.StringIO(file.stream.read().decode("utf-8"))
            
            # Usar pandas para leer el CSV
            df = pd.read_csv(stream)
            
            # Limpieza básica: manejar NaNs llenándolos con 'N/A' o 0
            df = df.fillna('N/A')
            
            # Convertir todas las columnas a string para la transferencia segura de nombres
            columns = [str(col) for col in df.columns]
            
            # Convertir el DataFrame a un formato de lista de diccionarios (JSON)
            # Esto facilita el manejo en JavaScript
            data_records = df.to_dict(orient='records')
            
            return jsonify({
                'success': True,
                'columns': columns,
                'data_records': data_records,
                'row_count': len(df)
            })

        except Exception as e:
            # Capturar errores de lectura (ej. formato incorrecto)
            return jsonify({'error': f'Error al procesar el archivo: {str(e)}'}), 500

if __name__ == '__main__':
    # Ejecutar la aplicación
    # Asegúrate de usar 'flask run' en producción, no app.run()
    app.run(debug=True)