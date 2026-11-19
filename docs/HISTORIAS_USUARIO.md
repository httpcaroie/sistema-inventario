# Historias de usuario

## HU-01. Gestion de productos
Como encargada del inventario, quiero registrar, editar y eliminar productos para mantener actualizado el catalogo.

Criterios de aceptacion:
- El formulario solicita nombre, codigo, categoria, precio, stock inicial y nivel minimo.
- El codigo es obligatorio y no se puede repetir.
- El precio debe ser mayor que cero y las cantidades no pueden ser negativas.
- Los productos registrados aparecen en la tabla y pueden editarse o eliminarse.

## HU-02. Busqueda de productos
Como usuaria, quiero buscar productos por nombre, codigo o categoria para encontrarlos rapidamente.

Criterios de aceptacion:
- La tabla se filtra mientras se escribe.
- La busqueda no distingue entre mayusculas y minusculas.
- Si no hay coincidencias, el sistema informa que no se encontraron productos.

## HU-03. Movimientos de inventario
Como encargada del inventario, quiero registrar entradas y salidas para mantener actualizadas las existencias.

Criterios de aceptacion:
- Se selecciona un producto, tipo y cantidad entera positiva.
- Una entrada aumenta el stock.
- Una salida disminuye el stock.
- El sistema impide retirar mas unidades de las disponibles.
- El movimiento queda en el historial.

## HU-04. Registro de ventas
Como vendedora, quiero registrar una venta para calcular su total y descontar automaticamente las unidades vendidas.

Criterios de aceptacion:
- Se selecciona un producto y una cantidad entera positiva.
- El sistema muestra precio unitario y total.
- No permite vender mas unidades que las disponibles.
- La venta queda registrada y actualiza el stock.

## HU-05. Reportes
Como administradora, quiero consultar el estado del inventario y las ventas para conocer el comportamiento del negocio.

Criterios de aceptacion:
- El sistema muestra valor del inventario, ingresos por ventas, unidades vendidas y productos agotados.
- Presenta el stock y valor por producto.
- Permite descargar el reporte de inventario en formato CSV.
