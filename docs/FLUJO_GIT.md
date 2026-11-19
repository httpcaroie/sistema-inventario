# Flujo de trabajo Git propuesto

Ramas sugeridas para desarrollar y evidenciar cada historia de usuario:

- `main`: version estable.
- `develop`: integracion y pruebas.
- `feature/productos`: HU-01.
- `feature/busqueda`: HU-02.
- `feature/inventario`: HU-03.
- `feature/ventas`: HU-04.
- `feature/reportes`: HU-05.

Flujo recomendado: crear rama desde `develop`, implementar una historia, revisar los cambios, ejecutar pruebas manuales, registrar un commit y fusionar la rama en `develop`. Una vez verificadas todas las funcionalidades, integrar `develop` en `main`.

Comandos que se documentaran durante el trabajo: `git init`, `git status`, `git add`, `git commit`, `git branch`, `git switch`, `git remote`, `git push`, `git log`, `git clone` y reglas de `.gitignore`.
