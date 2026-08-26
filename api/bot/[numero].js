export default async function handler(req, res) {
  // 1. Extraemos el número de la URL
  const { numero } = req.query;

  try {
    // 2. Vercel hace la llamada a tu VPS por la puerta trasera
    const response = await fetch(`http://116.203.222.62:8000/buscar/${numero}`, {
      method: 'GET',
      headers: {
        // 🛑 AQUÍ PONES LA MISMA CONTRASEÑA QUE PUSISTE EN PYTHON
        'X-API-Key': 'Maikol_Dev_2026_Secure' 
      }
    });

    // 3. Recibimos la respuesta limpia del VPS y se la pasamos a tu HTML
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    // Si algo falla, que no se rompa la app
    res.status(500).json({ status: 'error', nombre: 'Desconocido', detalle: error.message });
  }
}