  // El resto del código JavaScript permanece igual
        // Coordenadas de Aguascalientes
        const aguascalientesCoords = [21.8818, -102.2916];
        
        // Inicializar el mapa
        const map = L.map('map').setView(aguascalientesCoords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Marcador para el centro de Aguascalientes
        L.marker(aguascalientesCoords).addTo(map)
            .bindPopup('Centro de Operaciones')
            .openPopup();

        // Variable global para almacenar las incidencias
        let incidencias = [];

        // Función para generar nuevas incidencias
        function generarNuevasIncidencias(cantidad) {
            const tipos = ['robo', 'asalto', 'vandalismo'];
            const nuevasIncidencias = [];
            for (let i = 0; i < cantidad; i++) {
                const lat = aguascalientesCoords[0] + (Math.random() - 0.5) * 0.1;
                const lng = aguascalientesCoords[1] + (Math.random() - 0.5) * 0.1;
                nuevasIncidencias.push({
                    tipo: tipos[Math.floor(Math.random() * tipos.length)],
                    latLng: [lat, lng],
                    gravedad: Math.floor(Math.random() * 10) + 1, // 1-10
                    tiempo: new Date()
                });
            }
            return nuevasIncidencias;
        }

        // Capas GIS para zonas de riesgo
        const capasGIS = {
            riesgoAlto: L.layerGroup(),
            riesgoMedio: L.layerGroup(),
            riesgoBajo: L.layerGroup()
        };

        // Función para clasificar y visualizar zonas de riesgo
        function clasificarZonasRiesgo() {
            incidencias.forEach(inc => {
                let capa, color;
                if (inc.gravedad >= 8) {
                    capa = capasGIS.riesgoAlto;
                    color = 'red';
                } else if (inc.gravedad >= 5) {
                    capa = capasGIS.riesgoMedio;
                    color = 'yellow';
                } else {
                    capa = capasGIS.riesgoBajo;
                    color = 'green';
                }
                
                L.circle(inc.latLng, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    radius: inc.gravedad * 50
                }).addTo(capa).bindPopup(`Tipo: ${inc.tipo}, Gravedad: ${inc.gravedad}`);
            });
        }

        clasificarZonasRiesgo();

        // Añadir todas las capas al mapa inicialmente
        Object.values(capasGIS).forEach(capa => capa.addTo(map));

        // Cambio de capas GIS
        document.getElementById('capasGIS').addEventListener('change', function(e) {
            Object.values(capasGIS).forEach(capa => map.removeLayer(capa));
            if (e.target.value === 'todas') {
                Object.values(capasGIS).forEach(capa => capa.addTo(map));
            } else if (e.target.value !== 'ninguna') {
                capasGIS[e.target.value].addTo(map);
            }
            // Si se selecciona 'ninguna', no se añade ninguna capa
        });

        // Función para generar ruta optimizada
        let rutaControl;
        document.getElementById('generarRuta').addEventListener('click', function() {
            if (rutaControl) {
                map.removeControl(rutaControl);
            }
            
            const posicionesPatrullas = [];
            capaPatrullas.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    posicionesPatrullas.push(layer.getLatLng());
                }
            });

            if (posicionesPatrullas.length < 2) {
                alert('No hay suficientes patrullas posicionadas para generar una ruta. Por favor, posicione las patrullas primero.');
                return;
            }

            rutaControl = L.Routing.control({
                waypoints: [aguascalientesCoords, ...posicionesPatrullas, aguascalientesCoords],
                routeWhileDragging: true
            }).addTo(map);
        });

        // Capa para las patrullas
        const capaPatrullas = L.layerGroup().addTo(map);

        // Función para posicionar patrullas
        function posicionarPatrullas() {
            capaPatrullas.clearLayers();
            
            const zonasAltoRiesgo = incidencias
                .filter(inc => inc.gravedad >= 8)
                .sort((a, b) => b.gravedad - a.gravedad)
                .slice(0, 5); // Seleccionamos las 5 zonas de más alto riesgo

            zonasAltoRiesgo.forEach((zona, index) => {
                const iconoPatrulla = L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1090/1090806.png',
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                    popupAnchor: [0, -19]
                });

                L.marker(zona.latLng, {icon: iconoPatrulla})
                    .addTo(capaPatrullas)
                    .bindPopup(`Patrulla ${index + 1} - Gravedad: ${zona.gravedad}`);
            });
        }

        // Evento para posicionar patrullas
        document.getElementById('posicionarPatrullas').addEventListener('click', posicionarPatrullas);

        // Simulación de horarios optimizados
        function actualizarHorarios() {
            const horarios = [
                { hora: '06:00 - 14:00', patrulla: 'Unidad A' },
                { hora: '14:00 - 22:00', patrulla: 'Unidad B' },
                { hora: '22:00 - 06:00', patrulla: 'Unidad C' }
            ];
            
            const horariosHTML = horarios.map(h => `<p>${h.hora}: ${h.patrulla}</p>`).join('');
            document.getElementById('horarios').innerHTML = horariosHTML;
        }
        
        actualizarHorarios();

        // Función para actualizar el mapa
        function actualizarMapa() {
            // Generar nuevas incidencias
            const nuevasIncidencias = generarNuevasIncidencias(5);
            
            // Añadir nuevas incidencias a la lista existente
            incidencias = [...incidencias, ...nuevasIncidencias];
            
            // Filtrar incidentes de medio y alto riesgo
            const incidentesUrgentes = nuevasIncidencias.filter(inc => inc.gravedad >= 5);
            incidentesPendientes = [...incidentesPendientes, ...incidentesUrgentes];
            
            // Eliminar incidencias antiguas (más de 1 hora)
            const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
            incidencias = incidencias.filter(inc => inc.tiempo > unaHoraAtras);
            incidentesPendientes = incidentesPendientes.filter(inc => inc.tiempo > unaHoraAtras);

            // Limpiar capas existentes
            Object.values(capasGIS).forEach(capa => capa.clearLayers());
            
            // Reclasificar y visualizar zonas de riesgo
            clasificarZonasRiesgo();

            // Añadir todas las capas al mapa
            Object.values(capasGIS).forEach(capa => capa.addTo(map));

            // Actualizar horarios
            actualizarHorarios();

            // Centrar el mapa en Aguascalientes
            map.setView(aguascalientesCoords, 13);

            // Actualizar el panel de información
            actualizarPanelInfo(nuevasIncidencias);

            // Asignar incidentes a patrullas disponibles si hay incidentes urgentes
            if (incidentesPendientes.length > 0) {
                asignarIncidentesAPatrullas();
            }
        }

        // Inicializar el mapa con algunas incidencias
        incidencias = generarNuevasIncidencias(50);
        clasificarZonasRiesgo();

        // Evento para actualizar el mapa
        document.getElementById('actualizarMapa').addEventListener('click', actualizarMapa);

        // Función para actualizar el panel de información
        function actualizarPanelInfo(nuevasIncidencias) {
            const listaIncidencias = document.getElementById('listaIncidencias');
            nuevasIncidencias.forEach(inc => {
                const li = document.createElement('li');
                li.textContent = `${inc.tipo} (Gravedad: ${inc.gravedad}) en [${inc.latLng[0].toFixed(4)}, ${inc.latLng[1].toFixed(4)}] - ${inc.tiempo.toLocaleTimeString()}`;
                listaIncidencias.insertBefore(li, listaIncidencias.firstChild);
            });

            // Limitar a las últimas 20 incidencias
            while (listaIncidencias.children.length > 20) {
                listaIncidencias.removeChild(listaIncidencias.lastChild);
            }
        }

        let patrullasActivas = {};
        let rutasActivas = {};
        let incidentesPendientes = [];
        let zonasAtendidas = new Set();

        function asignarIncidentesAPatrullas() {
            const patrullasDisponibles = Object.keys(patrullasActivas);
            if (patrullasDisponibles.length === 0 || incidentesPendientes.length === 0) return;

            // Ordenar incidentes por gravedad (de mayor a menor)
            incidentesPendientes.sort((a, b) => b.gravedad - a.gravedad);

            patrullasDisponibles.forEach(patrulla => {
                if (incidentesPendientes.length > 0) {
                    const incidente = incidentesPendientes.shift(); // Tomar el incidente más urgente
                    asignarIncidenteAPatrulla(patrulla, incidente);
                }
            });
        }

        function asignarIncidenteAPatrulla(patrulla, incidente) {
            if (rutasActivas[patrulla]) {
                map.removeControl(rutasActivas[patrulla]);
            }

            const rutaActual = patrullasActivas[patrulla].ruta || [];
            const nuevaRuta = [...rutaActual, L.latLng(incidente.latLng)];

            rutasActivas[patrulla] = L.Routing.control({
                waypoints: nuevaRuta,
                routeWhileDragging: false,
                lineOptions: {
                    styles: [{color: getColorPatrulla(patrulla), weight: 4}]
                }
            }).addTo(map);

            patrullasActivas[patrulla].ruta = nuevaRuta;
            console.log(`Patrulla ${patrulla} asignada a incidente de gravedad ${incidente.gravedad} en ${incidente.latLng}`);
        }

        document.getElementById('iniciarPatrullaje').addEventListener('click', function() {
            const patrullaSeleccionada = document.getElementById('seleccionPatrulla').value;
            if (!patrullaSeleccionada) {
                alert('Por favor, seleccione una patrulla');
                return;
            }
            
            if (patrullasActivas[patrullaSeleccionada]) {
                alert('Esta patrulla ya está en servicio');
                return;
            }
            
            // Inicializar la patrulla con una ruta vacía
            patrullasActivas[patrullaSeleccionada] = { ruta: [] };
            
            // Obtener zonas de alto y medio riesgo que no estén siendo atendidas
            const zonasAltoMedioRiesgo = incidencias.filter(inc => 
                inc.gravedad >= 5 && !zonasAtendidas.has(inc.latLng.toString())
            ).sort((a, b) => b.gravedad - a.gravedad);
            
            if (zonasAltoMedioRiesgo.length > 0) {
                // Seleccionar la zona de mayor riesgo no atendida
                const zonaObjetivo = zonasAltoMedioRiesgo[0];
                
                // Marcar la zona como atendida
                zonasAtendidas.add(zonaObjetivo.latLng.toString());
                
                // Crear una ruta desde el centro de operaciones hasta la zona de riesgo
                const ruta = [
                    L.latLng(aguascalientesCoords),
                    L.latLng(zonaObjetivo.latLng)
                ];
                
                // Crear y mostrar la ruta en el mapa
                rutasActivas[patrullaSeleccionada] = L.Routing.control({
                    waypoints: ruta,
                    routeWhileDragging: false,
                    lineOptions: {
                        styles: [{color: getColorPatrulla(patrullaSeleccionada), weight: 4}]
                    }
                }).addTo(map);
                
                patrullasActivas[patrullaSeleccionada].ruta = ruta;
                console.log(`Patrulla ${patrullaSeleccionada} desplegada a zona de riesgo (Gravedad: ${zonaObjetivo.gravedad})`);
            } else {
                console.log(`No hay zonas de alto o medio riesgo disponibles. La patrulla ${patrullaSeleccionada} permanece en espera.`);
            }
            
            actualizarEstadoPatrullas();
        });

        document.getElementById('finalizarPatrullaje').addEventListener('click', function() {
            const patrullaSeleccionada = document.getElementById('seleccionPatrulla').value;
            if (!patrullaSeleccionada || !patrullasActivas[patrullaSeleccionada]) {
                alert('Seleccione una patrulla activa para finalizar su patrullaje');
                return;
            }
            
            // Remover la ruta del mapa
            if (rutasActivas[patrullaSeleccionada]) {
                map.removeControl(rutasActivas[patrullaSeleccionada]);
                delete rutasActivas[patrullaSeleccionada];
            }
            
            // Liberar la zona atendida
            if (patrullasActivas[patrullaSeleccionada].ruta.length > 0) {
                const zonaAtendida = patrullasActivas[patrullaSeleccionada].ruta[1].toString();
                zonasAtendidas.delete(zonaAtendida);
            }
            
            delete patrullasActivas[patrullaSeleccionada];
            actualizarEstadoPatrullas();
        });

        function actualizarEstadoPatrullas() {
            console.log('Patrullas activas:', Object.keys(patrullasActivas));
            console.log('Incidentes urgentes pendientes:', incidentesPendientes.length);
            // Aquí podrías actualizar un elemento en la UI que muestre las patrullas activas y los incidentes pendientes
        }

        // Llamar a asignarIncidentesAPatrullas periódicamente solo si hay incidentes urgentes
        setInterval(() => {
            if (incidentesPendientes.length > 0) {
                asignarIncidentesAPatrullas();
            }
        }, 30000); // Cada 30 segundos

        function generarRutaPatrulla(patrulla) {
            // Generar una ruta aleatoria evitando las rutas existentes
            // Esta es una implementación simplificada
            const puntos = [];
            for (let i = 0; i < 5; i++) {
                let nuevoLat, nuevoLng;
                do {
                    nuevoLat = aguascalientesCoords[0] + (Math.random() - 0.5) * 0.1;
                    nuevoLng = aguascalientesCoords[1] + (Math.random() - 0.5) * 0.1;
                } while (puntoEnRutaExistente(nuevoLat, nuevoLng));
                
                puntos.push(L.latLng(nuevoLat, nuevoLng));
            }
            return puntos;
        }

        function puntoEnRutaExistente(lat, lng) {
            // Verificar si el punto está cerca de una ruta existente
            // Esta es una implementación simplificada
            for (let ruta of Object.values(rutasActivas)) {
                if (ruta.getWaypoints().some(wp => 
                    L.latLng(wp.latLng).distanceTo([lat, lng]) < 500
                )) {
                    return true;
                }
            }
            return false;
        }

        function getColorPatrulla(patrulla) {
            // Asignar un color único a cada patrulla
            const colores = {
                patrulla1: 'blue',
                patrulla2: 'green',
                patrulla3: 'red'
            };
            return colores[patrulla] || 'purple';
        }