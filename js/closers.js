document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'api/';
    const CLOSERS_API = API_BASE_URL + 'closers.php';
    const KPI_API = API_BASE_URL + 'kpi.php';
    const ANALYSIS_API = API_BASE_URL + 'generate_analysis.php';
    const VERSUS_API = API_BASE_URL + 'versus_closers.php';
    const OBJECTIVES_API = API_BASE_URL + 'objectives.php';

    const navStandings = document.getElementById('nav-standings');
    const navVersus = document.getElementById('nav-versus');
    const navDataEntry = document.getElementById('nav-data-entry');
    const navEditEntries = document.getElementById('nav-edit-entries');
    const navMobile = document.getElementById('nav-mobile');
    const navRoster = document.getElementById('nav-roster');
    const standingsView = document.getElementById('standings-view');
    const versusView = document.getElementById('versus-view');
    const dataEntryView = document.getElementById('data-entry-view');
    const editView = document.getElementById('edit-view');
    const mobileView = document.getElementById('mobile-view');
    const rosterView = document.getElementById('roster-view');
    const addCloserBtn = document.getElementById('add-closer-btn');
    const newCloserNameInput = document.getElementById('new-closer-name');
    const newCloserPhotoInput = document.getElementById('new-closer-photo');
    const closersListDiv = document.getElementById('closers-list');
    const monthFilter = document.getElementById('month-filter');
    const standingsBody = document.getElementById('standings-body');
    const standingsLoader = document.getElementById('standings-loader');
    const mobileStandingsContainer = document.getElementById('mobile-standings-container');
    const kpiLeadersContainer = document.getElementById('kpi-leaders-container');
    const mobileLoader = document.getElementById('mobile-loader');
    const mobileMonthDisplay = document.getElementById('mobile-month-display');
    const dataEntryTableBody = document.getElementById('data-entry-table-body');
    const dataEntryLoader = document.getElementById('data-entry-loader');
    const editEntriesBody = document.getElementById('edit-entries-body');
    const editLoader = document.getElementById('edit-loader');
    const saveAllBtn = document.getElementById('save-all-btn');
    const saveUpdatesBtn = document.getElementById('save-updates-btn');
    const generateAnalysisBtn = document.getElementById('generate-analysis-btn');
    const analysisContainer = document.getElementById('analysis-container');
    const analysisLoader = document.getElementById('analysis-loader');
    const notificationModal = document.getElementById('notification-modal');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotificationBtn = document.getElementById('close-notification-btn');
    const explanationModal = document.getElementById('explanation-modal');
    const closeExplanationBtn = document.getElementById('close-explanation-btn');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    
    const entryDateInput = document.getElementById('entry-date');
    const versusDateInput = document.getElementById('entry-date-versus');
    const versusAvailabilityContainer = document.getElementById('versus-availability-container');
    const generateVersusBtn = document.getElementById('generate-versus-btn');
    const activeVersusContainer = document.getElementById('active-versus-container');
    const lastFinishedVersusContainer = document.getElementById('last-finished-versus-container');
    const versusHistoryContainer = document.getElementById('versus-history-container');
    const versusSummaryBody = document.getElementById('versus-summary-body');

    const deleteVersusModal = document.getElementById('delete-versus-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const adminPasswordInput = document.getElementById('admin-password-input');
    let versusToDeleteId = null;

    const versusDetailModal = document.getElementById('versus-detail-modal');
    const versusDetailContent = document.getElementById('versus-detail-content');
    const closeVersusDetailBtn = document.getElementById('close-versus-detail-btn');
    
    const editCloserModal = document.getElementById('edit-closer-modal');
    const editCloserForm = document.getElementById('edit-closer-form');
    const cancelEditCloserBtn = document.getElementById('cancel-edit-closer-btn');

    let closersCache = [];
    let kpiObjectives = {};
    let dailyVersusParticipants = [];
    const placeholderPhoto = `https://placehold.co/40x40/64748b/ffffff?text=CS`;
    
    async function initApp() { 
        const today = new Date().toISOString().split('T')[0];
        entryDateInput.value = today;
        versusDateInput.value = today;
        const currentMonth = new Date().toISOString().slice(0, 7);
        monthFilter.value = currentMonth;
        
        navStandings.addEventListener('click', () => showView('standings'));
        navVersus.addEventListener('click', () => showView('versus'));
        navDataEntry.addEventListener('click', () => showView('data-entry'));
        navEditEntries.addEventListener('click', () => showView('edit'));
        navMobile.addEventListener('click', () => showView('mobile'));
        navRoster.addEventListener('click', () => showView('roster'));
        addCloserBtn.addEventListener('click', addCloser);
        saveAllBtn.addEventListener('click', saveAllKpiEntries);
        saveUpdatesBtn.addEventListener('click', saveAllUpdates);
        monthFilter.addEventListener('change', () => {
            renderAllViews();
            if(!versusView.classList.contains('hidden')) {
                renderVersusSections();
            }
            if(!editView.classList.contains('hidden')) {
                renderEditTable(true);
            }
            analysisContainer.innerHTML = '';
        });
        
        entryDateInput.addEventListener('change', () => {
            versusDateInput.value = entryDateInput.value;
            renderAllViews();
        });

        versusDateInput.addEventListener('change', () => {
            entryDateInput.value = versusDateInput.value;
            renderAllViews();
            renderDailyVersusContainers();
        });
        
        generateAnalysisBtn.addEventListener('click', generatePlayerByPlayerAnalysis);
        closeNotificationBtn.addEventListener('click', () => notificationModal.classList.add('hidden'));
        closeExplanationBtn.addEventListener('click', () => explanationModal.classList.add('hidden'));
        
        generateVersusBtn.addEventListener('click', generateVersusChallenge); 
        cancelDeleteBtn.addEventListener('click', () => deleteVersusModal.classList.add('hidden'));
        confirmDeleteBtn.addEventListener('click', confirmDeleteVersus);
        closeVersusDetailBtn.addEventListener('click', () => versusDetailModal.classList.add('hidden'));
        
        cancelEditCloserBtn.addEventListener('click', () => editCloserModal.classList.add('hidden'));
        editCloserForm.addEventListener('submit', updateCloser);
        
        document.getElementById('export-csv-btn-closers').addEventListener('click', () => {
            exportTableToCSV('standings-table', 'standings_closers.csv');
        });
        
        await fetchObjectives(); 
        await fetchClosers(); 
        await fetchDailyVersus();
        showView('standings');
    }

    function showView(viewName) {
        [standingsView, versusView, dataEntryView, editView, mobileView, rosterView].forEach(v => v.classList.add('hidden'));
        [navStandings, navVersus, navDataEntry, navEditEntries, navMobile, navRoster].forEach(b => b.classList.remove('active'));

        const viewMap = {
            'standings': { view: standingsView, nav: navStandings, render: renderStandings },
            'versus': { view: versusView, nav: navVersus, render: renderVersusSections },
            'data-entry': { view: dataEntryView, nav: navDataEntry, render: renderDataEntryTable },
            'edit': { view: editView, nav: navEditEntries, render: renderEditTable },
            'mobile': { view: mobileView, nav: navMobile, render: renderMobileStandings },
            'roster': { view: rosterView, nav: navRoster, render: renderRosterList },
        };
        
        const selected = viewMap[viewName];
        if(selected) {
            selected.view.classList.remove('hidden');
            selected.nav.classList.add('active');
            selected.render();
        }
    }
    
    function renderVersusSections() {
        renderCloserAvailabilityList();
        renderDailyVersusContainers();
        renderVersusSummaryTable();
        renderVersusHistory();
    }
    
    async function renderAllViews(){
        await fetchDailyVersus();
        renderStandings();
        renderMobileStandings();
        renderDataEntryTable();
    }

    function showNotification(message) {
        notificationMessage.textContent = message;
        notificationModal.classList.remove('hidden');
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    async function fetchObjectives() {
        try {
            const response = await fetch(OBJECTIVES_API);
            const result = await response.json();
            if (result.success) {
                kpiObjectives = result.data;
                document.getElementById('cierre-meta-display').textContent = kpiObjectives.closer_cierre_meta || '--';
                document.getElementById('most-expensive-plan-display').textContent = kpiObjectives.closer_plan_caro || '--';
            } else {
                showNotification("Error al cargar los objetivos.");
            }
        } catch (error) {
            showNotification("Error de conexión al cargar objetivos.");
        }
    }
    
    async function showExplanation(kpi) {
        const standings = await getStandingsData();
        if(!standings || standings.length === 0) {
            return showNotification("No hay datos del líder para mostrar un ejemplo.");
        }
        const leader = standings[0];
        const cierreMeta = parseFloat(kpiObjectives.closer_cierre_meta) || 1; 
        const mostExpensivePlan = parseFloat(kpiObjectives.closer_plan_caro) || 1;

        const explanations = {
            cierre: {
                title: "Puntos de Cierre (40pts)",
                text: `Se calcula multiplicando el porcentaje de la Tasa de Cierre sobre la Meta con el valor en puntos del KPI (40).\n\nFórmula: (Real / Cuota) * 40\n\nEjemplo con ${leader.name}:\n(${leader.cierres} / ${cierreMeta}) * 40 = ${leader.tc_points.toFixed(1)} puntos.`
            },
            arpu: {
                title: "Puntos ARPU (30pts)",
                text: `Se calcula dividiendo el Valor Promedio del Plan (Prom. Plan) entre el Plan Más Caro para obtener un porcentaje. Ese porcentaje se multiplica por el valor en puntos del KPI (30).\n\nFórmula: (Prom. Plan / Plan Más Caro) * 30\n\nEjemplo con ${leader.name}:\n($${leader.arpu.toFixed(2)} / $${mostExpensivePlan}) * 30 = ${leader.arpu_points.toFixed(1)} puntos.`
            },
            pitch: {
                title: "Puntos Pitch (10pts)",
                text: `Se calcula promediando todas las evaluaciones de Pitch (escala 1-5), se divide entre 5 para obtener un porcentaje y se multiplica por el valor del KPI (10).\n\nFórmula: (Prom. Evaluación / 5) * 10\n\nEjemplo con ${leader.name}:\n(${leader.qual_avg.toFixed(1)} / 5) * 10 = ${leader.qual_points.toFixed(1)} puntos.`
            },
            actividad: {
                title: "Puntos Actividad (20pts)",
                text: `Resulta del porcentaje de cumplimiento de las actividades (Completadas / Asignadas), multiplicado por el valor del KPI (20).\n\nFórmula: (Completadas / Asignadas) * 20\n\nEjemplo con ${leader.name}:\n(${leader.actCompletadas} / ${leader.actAsignadas}) * 20 = ${leader.act_points.toFixed(1)} puntos.`
            },
            versus_points: {
                title: "Puntos Versus (Bono: +100 / -50 pts)",
                text: `Estos son los puntos ganados o perdidos en los enfrentamientos directos. Ganar un reto otorga 100 puntos, perderlo resta 50. Los empates no modifican el puntaje.\n\nEjemplo con ${leader.name}:\nTotal Puntos Versus acumulados: ${leader.versus_points.toFixed(2)} puntos.`
            }
        };
        const data = explanations[kpi];
        if(data) {
            explanationTitle.textContent = data.title;
            explanationText.textContent = data.text;
            explanationModal.classList.remove('hidden');
        }
    }

    function resetAddCloserForm() {
        newCloserNameInput.value = '';
        newCloserPhotoInput.value = '';
        addCloserBtn.disabled = false;
        addCloserBtn.textContent = 'Añadir al Roster';
    }

    async function addCloser() {
        const name = newCloserNameInput.value.trim();
        const photoFile = newCloserPhotoInput.files[0];
        if (!name) return showNotification("El nombre del Closer no puede estar vacío.");
        if (photoFile && photoFile.size > 500 * 1024) return showNotification("Error: La imagen es demasiado grande (max 500KB).");
        
        addCloserBtn.disabled = true;
        addCloserBtn.textContent = 'Guardando...';

        const formData = new FormData();
        formData.append('name', name);
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        try {
            const response = await fetch(CLOSERS_API, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(`Closer "${name}" añadido.`);
            fetchClosers();
        } catch (error) {
            showNotification("Error al guardar el closer: " + error.message);
        } finally {
            resetAddCloserForm();
        }
    }
    
    async function deleteCloser(id) {
        try {
            const response = await fetch(`${CLOSERS_API}?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(`Closer eliminado.`);
            fetchClosers();
        } catch (error) {
            showNotification("Error al eliminar.");
        }
    }
    
    async function updateCloser(e) {
        e.preventDefault();
        const id = document.getElementById('edit-closer-id').value;
        const name = document.getElementById('edit-closer-name').value;
        const photoFile = document.getElementById('edit-closer-photo').files[0];

        const formData = new FormData();
        formData.append('action', 'update');
        formData.append('id', id);
        formData.append('name', name);
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        const saveButton = document.getElementById('save-edit-closer-btn');
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        try {
            const response = await fetch(CLOSERS_API, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            showNotification('Closer actualizado correctamente.');
            editCloserModal.classList.add('hidden');
            fetchClosers(); 
        } catch (error) {
            showNotification('Error al actualizar: ' + error.message);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar Cambios';
        }
    }
    
    async function fetchClosers() {
         try {
            const response = await fetch(CLOSERS_API);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            closersCache = await response.json();
            renderRosterList();
            renderDataEntryTable();
            renderCloserAvailabilityList();
        } catch(error){
            showNotification("No se pudo cargar la lista de closers desde el servidor.");
        }
    }
    
    function renderRosterList() {
        closersListDiv.innerHTML = closersCache.length === 0 ? `<p class="text-gray-500">Aún no hay closers.</p>` : '';
        closersCache.forEach(closer => {
            const el = document.createElement('div');
            el.className = 'flex justify-between items-center bg-gray-200 p-2 rounded';
            el.innerHTML = `
                <div class="flex items-center">
                    <img src="${closer.photoUrl || placeholderPhoto}" alt="Foto" class="roster-photo mr-3">
                    <span class="font-semibold">${closer.name}</span>
                </div>
                <div>
                    <button data-id="${closer.id}" class="edit-closer-btn text-blue-600 hover:text-blue-800 text-xs font-bold mr-4">EDITAR</button>
                    <button data-id="${closer.id}" class="delete-closer-btn text-red-600 hover:text-red-800 text-xs font-bold">ELIMINAR</button>
                </div>
            `;
            closersListDiv.appendChild(el);
        });
        document.querySelectorAll('.delete-closer-btn').forEach(btn => btn.addEventListener('click', (e) => deleteCloser(e.target.dataset.id)));
        document.querySelectorAll('.edit-closer-btn').forEach(btn => btn.addEventListener('click', (e) => openEditCloserModal(e.target.dataset.id)));
    }
    
    function openEditCloserModal(closerId) {
        const closer = closersCache.find(a => a.id == closerId);
        if (!closer) return;

        document.getElementById('edit-closer-id').value = closer.id;
        document.getElementById('edit-closer-name').value = closer.name;
        document.getElementById('edit-closer-current-photo').src = closer.photoUrl || placeholderPhoto;
        document.getElementById('edit-closer-photo').value = '';
        
        editCloserModal.classList.remove('hidden');
    }

    function renderDataEntryTable() {
        dataEntryLoader.style.display = 'flex';
        dataEntryTableBody.innerHTML = '';
        if (closersCache.length === 0) {
            dataEntryTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-300">Añade un Closer para empezar.</td></tr>`;
            dataEntryLoader.style.display = 'none';
            return;
        }
        try {
            closersCache.forEach(closer => {
                const isParticipant = dailyVersusParticipants.includes(closer.id);
                const versusIcon = isParticipant ? `<span class="versus-icon" title="Tiene Versus Hoy">⚔️</span>` : '';
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-700';
                row.dataset.closerId = closer.id;
                row.innerHTML = `
                    <td class="p-2 text-white font-semibold flex items-center min-w-[200px]">
                         <img src="${closer.photoUrl || placeholderPhoto}" alt="Foto" class="roster-photo mr-2">
                         <span>${closer.name}</span>
                         ${versusIcon}
                    </td>
                    <td><input type="number" min="0" class="kpi-input-cierres" placeholder="0"></td>
                    <td><input type="number" min="0" step="0.01" class="kpi-input-ingresos" placeholder="0.00"></td>
                    <td><input type="number" min="1" max="5" step="0.1" class="kpi-input-calificacion" placeholder="5"></td>
                    <td><input type="number" min="0" class="kpi-input-act-asignadas" placeholder="0"></td>
                    <td><input type="number" min="0" class="kpi-input-act-completadas" placeholder="0"></td>
                `;
                dataEntryTableBody.appendChild(row);
            });
        } catch(e) {
            console.error("Error rendering data entry table", e);
        } finally {
            dataEntryLoader.style.display = 'none';
        }
    }

    async function saveAllKpiEntries() {
        const date = document.getElementById('entry-date').value;
        if (!date) return showNotification("Selecciona una fecha.");
        const rows = document.querySelectorAll('#data-entry-table-body tr');
        const entriesToSave = [];
        
        for (const row of rows) {
            const entry = {
                closerId: row.dataset.closerId, date: date,
                oportunidadesAsignadas: 0,
                cierresLogrados: parseInt(row.querySelector('.kpi-input-cierres').value || 0),
                ingresosTotales: parseFloat(row.querySelector('.kpi-input-ingresos').value || 0),
                calificacionPitch: parseFloat(row.querySelector('.kpi-input-calificacion').value || 0),
                actividadesAsignadas: parseInt(row.querySelector('.kpi-input-act-asignadas').value || 0),
                actividadesCompletadas: parseInt(row.querySelector('.kpi-input-act-completadas').value || 0)
            };
            if (entry.actividadesAsignadas === 0 && entry.cierresLogrados === 0) continue;
            if (entry.actividadesCompletadas > entry.actividadesAsignadas) {
                return showNotification(`Error de validación para el closer.`);
            }
            entriesToSave.push(entry);
        }
        
        if (entriesToSave.length === 0) return showNotification("No hay jugadas para guardar.");
        
        try {
             const response = await fetch(KPI_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entriesToSave)
            });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(result.message);
            renderDataEntryTable();
            await renderAllViews();
            if (!versusView.classList.contains('hidden')) {
                renderDailyVersusContainers();
            }
        } catch (error) {
            showNotification("Ocurrió un error al guardar.");
        }
    }
    
    async function fetchDailyVersus() {
        const selectedDate = document.getElementById('entry-date').value;
        try {
            const response = await fetch(`${VERSUS_API}?date=${selectedDate}`);
            const versusEntries = await response.json();
            dailyVersusParticipants = [];
            if (Array.isArray(versusEntries)) {
                versusEntries.forEach(v => {
                    dailyVersusParticipants.push(parseInt(v.closer1_id));
                    dailyVersusParticipants.push(parseInt(v.closer2_id));
                });
            }
        } catch (e) {
            console.error("Error fetching daily versus", e);
            dailyVersusParticipants = [];
        }
    }
    
    async function getStandingsData() {
        const month = monthFilter.value;
        const mostExpensivePlan = parseFloat(kpiObjectives.closer_plan_caro) || 1;
        const cierreMeta = parseFloat(kpiObjectives.closer_cierre_meta) || 1;
        
        const aggregatedData = {};
        closersCache.forEach(c => {
            aggregatedData[c.id] = { id: parseInt(c.id), name: c.name, photoUrl: c.photoUrl, cierres: 0, ingresos: 0, calificaciones: [], actAsignadas: 0, actCompletadas: 0, versus_points: 0 };
        });
        
        const kpiResponse = await fetch(`${KPI_API}?month=${month}`);
        const kpiEntries = await kpiResponse.json();
        
        const versusResponse = await fetch(`${VERSUS_API}?month=${month}`);
        const versusEntries = await versusResponse.json();
        
        if(Array.isArray(kpiEntries)) {
            kpiEntries.forEach(data => {
                if(aggregatedData[data.closerId]) {
                    const closer = aggregatedData[data.closerId];
                    closer.cierres += parseInt(data.cierresLogrados);
                    closer.ingresos += parseFloat(data.ingresosTotales);
                    if(parseFloat(data.calificacionPitch) > 0) closer.calificaciones.push(parseFloat(data.calificacionPitch));
                    closer.actAsignadas += parseInt(data.actividadesAsignadas);
                    closer.actCompletadas += parseInt(data.actividadesCompletadas);
                }
            });
        }
        
        if (Array.isArray(versusEntries)) {
            versusEntries.forEach(match => {
                if (match.winner_id) {
                    if (aggregatedData[match.winner_id]) {
                        aggregatedData[match.winner_id].versus_points += 100;
                    }
                    if (match.loser_id && aggregatedData[match.loser_id]) {
                        aggregatedData[match.loser_id].versus_points -= 50;
                    }
                }
            });
        }
        
        const finalStandings = Object.values(aggregatedData).map(closer => {
            const tc = (closer.cierres / cierreMeta) * 100;
            const arpu = closer.cierres > 0 ? closer.ingresos / closer.cierres : 0;
            const qual_avg = closer.calificaciones.length > 0 ? closer.calificaciones.reduce((a, b) => a + b, 0) / closer.calificaciones.length : 0;
            const act_percent = closer.actAsignadas > 0 ? (closer.actCompletadas / closer.actAsignadas) * 100 : 0;
            const arpu_percent = (arpu / mostExpensivePlan) * 100;
            const qual_percent = (qual_avg / 5) * 100;

            const tc_points = (closer.cierres / cierreMeta) * 40;
            const arpu_points = (arpu / mostExpensivePlan) * 30;
            const qual_points = (qual_avg / 5) * 10;
            const act_points = (act_percent / 100) * 20;
            
            const puntaje = tc_points + arpu_points + qual_points + act_points + (closer.versus_points || 0);

            return { 
                ...closer, tc, arpu, qual_avg, act_percent, arpu_percent, qual_percent,
                puntaje, tc_points, arpu_points, qual_points, act_points, versus_points: (closer.versus_points || 0)
            };
        }).sort((a, b) => b.puntaje - a.puntaje);

        return finalStandings;
    }

    async function renderStandings() {
        standingsLoader.style.display = 'flex';
        standingsBody.innerHTML = '';
        try {
            const finalStandings = await getStandingsData();
            const cierreMeta = parseFloat(kpiObjectives.closer_cierre_meta) || 1;

            if (finalStandings.length === 0) {
                 standingsBody.innerHTML = `<tr><td colspan="17" class="text-center p-8 text-gray-500">No hay datos para este mes.</td></tr>`;
            } else {
                finalStandings.forEach((s, index) => {
                    const isParticipant = dailyVersusParticipants.includes(s.id);
                    const versusIcon = isParticipant ? `<span class="versus-icon" title="Tiene Versus Hoy">⚔️</span>` : '';
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 text-center text-sm';
                    row.innerHTML = `
                        <td class="p-2 font-bold">${index + 1}</td>
                        <td class="p-2 font-semibold text-left"><div class="flex items-center"><img src="${s.photoUrl || placeholderPhoto}" alt="${s.name}" class="closer-photo mr-4"><span>${s.name}</span>${versusIcon}</div></td>
                        <td class="p-2">${cierreMeta}</td>
                        <td class="p-2">${s.cierres}</td>
                        <td class="p-2 font-bold bg-gray-100">${s.tc.toFixed(1)}%</td>
                        <td class="p-2 points-cell border-r border-gray-300">${s.tc_points.toFixed(1)}</td>
                        <td class="p-2">$${s.arpu.toFixed(2)}</td>
                        <td class="p-2 font-bold bg-gray-100">${s.arpu_percent.toFixed(1)}%</td>
                        <td class="p-2 points-cell border-r border-gray-300">${s.arpu_points.toFixed(1)}</td>
                        <td class="p-2">${s.qual_avg.toFixed(1)}</td>
                        <td class="p-2 font-bold bg-gray-100">${s.qual_percent.toFixed(1)}%</td>
                        <td class="p-2 points-cell border-r border-gray-300">${s.qual_points.toFixed(1)}</td>
                        <td class="p-2">${s.actCompletadas}</td>
                        <td class="p-2 font-bold bg-gray-100">${s.act_percent.toFixed(1)}%</td>
                        <td class="p-2 points-cell border-r border-gray-300">${s.act_points.toFixed(1)}</td>
                        <td class="p-2 font-bold text-lg border-l border-gray-300 points-cell">${s.versus_points.toFixed(2)}</td>
                        <td class="p-2 font-bold text-lg border-l border-gray-300">${s.puntaje.toFixed(2)}</td>
                    `;
                    standingsBody.appendChild(row);
                });
            }
            
            document.querySelectorAll('.info-icon').forEach(icon => {
                icon.addEventListener('click', (e) => {
                     e.stopPropagation();
                     showExplanation(e.target.dataset.kpi)
                });
            });

        } catch (error) {
            console.error("Error al renderizar standings:", error);
            standingsBody.innerHTML = `<tr><td colspan="17" class="text-center p-8 text-red-500">Error al cargar datos.</td></tr>`;
        } finally {
            standingsLoader.style.display = 'none';
        }
    }
    
    async function renderMobileStandings() {
        mobileLoader.style.display = 'flex';
        mobileStandingsContainer.innerHTML = '';
        kpiLeadersContainer.innerHTML = '';
        
        const monthDate = new Date(monthFilter.value + '-02');
        mobileMonthDisplay.textContent = monthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        
        try {
            const finalStandings = await getStandingsData();
             if (finalStandings.length === 0) {
                 mobileStandingsContainer.innerHTML = `<p class="text-center text-gray-500">No hay datos para este mes.</p>`;
            } else {
                finalStandings.forEach((s, index) => {
                    const card = document.createElement('div');
                    card.className = 'flex items-center bg-gray-50 p-3 rounded-lg shadow-md';
                    card.innerHTML = `
                        <span class="text-2xl font-bold w-10 text-center text-gray-500">${index + 1}</span>
                        <img src="${s.photoUrl || placeholderPhoto}" alt="${s.name}" class="mobile-card-photo mx-4">
                        <div class="flex-grow">
                            <p class="text-lg font-bold text-gray-800">${s.name}</p>
                        </div>
                        <div class="text-2xl font-bold text-blue-700 header-font text-right">
                            <span>${s.puntaje.toFixed(2)}</span>
                            <span class="text-sm font-normal text-gray-500 block -mt-1">pts</span>
                        </div>
                    `;
                    mobileStandingsContainer.appendChild(card);
                });

                // Render KPI Leaders
                const leaders = {
                    'Mejor Cerrador': [...finalStandings].sort((a,b) => b.tc_points - a.tc_points)[0],
                    'Mejor Productor': [...finalStandings].sort((a,b) => b.arpu_points - a.arpu_points)[0],
                    'Mejor Comunicador': [...finalStandings].sort((a,b) => b.qual_points - a.qual_points)[0],
                    'Máquina de Tareas': [...finalStandings].sort((a,b) => b.act_points - a.act_points)[0],
                    'Rey del Versus': [...finalStandings].sort((a,b) => b.versus_points - a.versus_points)[0]
                };
                
                for(const [title, leader] of Object.entries(leaders)){
                    if(leader && leader.puntaje > 0) {
                         const leaderCard = document.createElement('div');
                         leaderCard.className = 'bg-white p-3 rounded-lg shadow-md';
                         leaderCard.innerHTML = `
                            <h4 class="text-sm font-bold text-center text-blue-800 header-font">${title}</h4>
                            <div class="flex items-center mt-2">
                                <img src="${leader.photoUrl || placeholderPhoto}" alt="${leader.name}" class="closer-photo mr-3">
                                <span class="font-semibold text-gray-700">${leader.name}</span>
                            </div>
                         `;
                         kpiLeadersContainer.appendChild(leaderCard);
                    }
                }
            }
        } catch (error) {
            console.error("Error al renderizar ranking móvil:", error);
            mobileStandingsContainer.innerHTML = `<p class="text-center text-red-500">Error al cargar el ranking.</p>`;
        } finally {
            mobileLoader.style.display = 'none';
        }
    }

    async function renderEditTable() {
        editLoader.style.display = 'flex';
        editEntriesBody.innerHTML = '';
        try {
            const month = monthFilter.value;
            const response = await fetch(`${KPI_API}?month=${month}`);
            const kpiEntries = await response.json();
            
            if(!kpiEntries || kpiEntries.length === 0) {
                editEntriesBody.innerHTML = `<tr><td colspan="7" class="text-center p-8">No hay jugadas para editar en este mes.</td></tr>`;
                return;
            }
            
            kpiEntries.sort((a,b) => new Date(a.date) - new Date(b.date) || a.closerName.localeCompare(b.closerName));

            kpiEntries.forEach(data => {
                const closer = closersCache.find(c => c.id == data.closerId);
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-100 text-sm';
                row.dataset.id = data.id;
                row.innerHTML = `
                    <td class="p-2 font-semibold text-left"><div class="flex items-center"><img src="${closer?.photoUrl || placeholderPhoto}" alt="${closer?.name}" class="roster-photo mr-2"><span>${data.closerName}</span></div></td>
                    <td class="p-2 text-center">${data.date}</td>
                    <td class="p-2"><input type="number" class="edit-cierres" value="${data.cierresLogrados}"></td>
                    <td class="p-2"><input type="number" step="0.01" class="edit-ingresos" value="${data.ingresosTotales}"></td>
                    <td class="p-2"><input type="number" step="0.1" class="edit-calificacion" value="${data.calificacionPitch}"></td>
                    <td class="p-2"><input type="number" class="edit-act-asignadas" value="${data.actividadesAsignadas}"></td>
                    <td class="p-2"><input type="number" class="edit-act-completadas" value="${data.actividadesCompletadas}"></td>
                `;
                editEntriesBody.appendChild(row);
            });

        } catch(e) {
            console.error("Error rendering edit table", e);
            editEntriesBody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-red-500">Error al cargar la tabla de edición.</td></tr>`;
        } finally {
            editLoader.style.display = 'none';
        }
    }

    async function saveAllUpdates() {
        const rows = document.querySelectorAll('#edit-entries-body tr');
        if(rows.length === 0) return showNotification('No hay nada que guardar.');

        saveUpdatesBtn.disabled = true;
        saveUpdatesBtn.textContent = 'Guardando...';
        
        const updatesToSave = [];
        for(const row of rows) {
             updatesToSave.push({
                id: row.dataset.id,
                oportunidadesAsignadas: 0,
                cierresLogrados: parseInt(row.querySelector('.edit-cierres').value || 0),
                ingresosTotales: parseFloat(row.querySelector('.edit-ingresos').value || 0),
                calificacionPitch: parseFloat(row.querySelector('.edit-calificacion').value || 0),
                actividadesAsignadas: parseInt(row.querySelector('.edit-act-asignadas').value || 0),
                actividadesCompletadas: parseInt(row.querySelector('.edit-act-completadas').value || 0),
            });
        }

        try {
            const response = await fetch(KPI_API, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatesToSave)
            });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(result.message);
            renderAllViews();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            showNotification("Ocurrió un error al guardar los cambios.");
        } finally {
             saveUpdatesBtn.disabled = false;
             saveUpdatesBtn.textContent = 'GUARDAR TODOS LOS CAMBIOS';
        }
    }

    async function generatePlayerByPlayerAnalysis() {
        analysisLoader.style.display = 'flex';
        analysisContainer.innerHTML = '';
        generateAnalysisBtn.disabled = true;

        try {
            const standings = await getStandingsData();
            if (standings.length === 0) {
                showNotification("No hay datos en la tabla para analizar.");
                generateAnalysisBtn.disabled = false;
                analysisLoader.style.display = 'none';
                return;
            }

            let analysisPrompt = "Actúa como un analista deportivo experto y coach de rendimiento para la 'Liga SIGMA de Campeones'. Tu tono debe ser competitivo, directo y motivador. Proporciona un análisis táctico para CADA UNO de los siguientes jugadores. Para cada jugador, genera un título llamativo y un párrafo de análisis.\n\n";

            for(let i = 0; i < standings.length; i++) {
                const player = standings[i];
                analysisPrompt += `JUGADOR ${i + 1}: ${player.name}\n`;
                analysisPrompt += `ESTADÍSTICAS: Puntos Cierre=${player.tc_points.toFixed(1)}, Puntos ARPU=${player.arpu_points.toFixed(1)}, Puntos Pitch=${player.qual_points.toFixed(1)}, Puntos Actividad=${player.act_points.toFixed(1)}, Puntos Versus=${player.versus_points.toFixed(1)}, PUNTAJE TOTAL=${player.puntaje.toFixed(2)}\n`;

                if (i === 0) {
                    if (standings.length > 1) {
                        const rival = standings[i + 1];
                        analysisPrompt += `TAREA: Analiza cómo ${player.name} puede MANTENER el liderato. Compara sus fortalezas y debilidades (basado en los puntos de cada KPI) con su perseguidor más cercano, ${rival.name}.\n\n`;
                    } else {
                        analysisPrompt += `TAREA: Analiza la clave del dominio de ${player.name} y qué necesita para seguir mejorando su propia marca.\n\n`;
                    }
                } else {
                    const rival = standings[i - 1];
                    analysisPrompt += `TAREA: Analiza qué necesita ${player.name} para SUPERAR a ${rival.name} (Puntaje Total: ${rival.puntaje.toFixed(2)}). Especifica en qué KPI (donde tenga menos puntos) debe enfocarse y por qué para cerrar la brecha.\n\n`;
                }
            }
            analysisPrompt += "Devuelve el análisis para cada jugador separado por '---'. Formato: ### TÍTULO\nAnálisis...";
            
            const response = await fetch(ANALYSIS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: analysisPrompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error del servidor: ${response.status}`);
            }
            
            const result = await response.json();

            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const analysisText = result.candidates[0].content.parts[0].text;
                const articles = analysisText.split('---');
                
                analysisContainer.innerHTML = standings.map((player, index) => {
                    const articleContent = articles[index] || "No se pudo generar análisis para este jugador.";
                    const formattedContent = articleContent.trim().replace(/### (.*)/, '<h3 class="text-xl font-bold mb-2 header-font text-gray-800">$1</h3>');
                    
                    return `
                        <div class="analysis-card p-4 rounded-lg shadow">
                            <div class="flex items-center mb-3">
                                <img src="${player.photoUrl || placeholderPhoto}" alt="${player.name}" class="closer-photo mr-4">
                                <span class="text-lg font-semibold header-font">${player.name}</span>
                            </div>
                            <div>${formattedContent}</div>
                        </div>
                    `;
                }).join('');

            } else {
                throw new Error("La respuesta de la IA no tuvo el formato esperado.");
            }

        } catch (error) {
            console.error("Error generando análisis:", error);
            showNotification(`Ocurrió un error al generar el análisis: ${error.message}`);
        } finally {
            analysisLoader.style.display = 'none';
            generateAnalysisBtn.disabled = false;
        }
    }
    
    function exportTableToCSV(tableId, filename) {
        let csv = [];
        const rows = document.querySelectorAll(`#${tableId} tr`);
        
        for (const row of rows) {
            const cols = row.querySelectorAll("td, th");
            const rowData = [];
            for (const col of cols) {
                let text = col.innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/,/g, "");
                rowData.push(`"${text}"`);
            }
            csv.push(rowData.join(","));
        }

        const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
        const downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    function renderCloserAvailabilityList() {
        versusAvailabilityContainer.innerHTML = '';
        if (closersCache.length === 0) {
            versusAvailabilityContainer.innerHTML = '<p class="text-gray-500 col-span-full">No hay closers en el roster.</p>';
            return;
        }
        closersCache.forEach(closer => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" data-id="${closer.id}" class="form-checkbox h-5 w-5 text-red-600 versus-availability-checkbox">
                <span class="text-gray-700">${closer.name}</span>
            `;
            versusAvailabilityContainer.appendChild(label);
        });
    }

    async function generateVersusChallenge() {
        const activeVersus = await fetch(`${VERSUS_API}?date=${versusDateInput.value}`).then(res => res.json());
        if (activeVersus.filter(v => !v.winner_id && v.is_draw == 0).length >= 2) {
            return showNotification("Ya se han generado los 2 versus para hoy.");
        }

        const unavailableCheckboxes = document.querySelectorAll('.versus-availability-checkbox:checked');
        const unavailableIds = Array.from(unavailableCheckboxes).map(cb => cb.dataset.id);
        
        const availableAgentsIds = closersCache
            .filter(closer => !unavailableIds.includes(String(closer.id)))
            .map(closer => parseInt(closer.id));

        if (availableAgentsIds.length < 2) {
            return showNotification("Se necesitan al menos dos closers disponibles para el sorteo.");
        }
        
        const date = versusDateInput.value; 
        if (!date) return showNotification("Por favor, selecciona una fecha para el enfrentamiento.");

        generateVersusBtn.disabled = true;
        generateVersusBtn.textContent = 'Generando...';
        
        try {
            const response = await fetch(VERSUS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_challenge', available_agent_ids: availableAgentsIds, date })
            });
            const result = await response.json();

            if (result.success) {
                showNotification(result.message);
                await renderAllViews();
                renderDailyVersusContainers();
            } else {
                throw new Error(result.error || "Error desconocido.");
            }
        } catch (error) {
            showNotification("Error al generar el desafío: " + error.message);
        } finally {
            generateVersusBtn.disabled = false;
            generateVersusBtn.textContent = 'Realizar Sorteo y Generar';
        }
    }
    
    async function renderDailyVersusContainers() {
        const date = versusDateInput.value;
        const [versusToday, kpisToday] = await Promise.all([
            fetch(`${VERSUS_API}?date=${date}`).then(res => res.json()),
            fetch(`${KPI_API}?date=${date}`).then(res => res.json())
        ]);

        const activeVersus = versusToday.filter(v => !v.winner_id && v.is_draw == 0);
        const finishedVersus = versusToday.filter(v => v.winner_id || v.is_draw == 1);
        
        activeVersusContainer.innerHTML = '';
        if (activeVersus.length === 0) {
            activeVersusContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No hay enfrentamientos activos para hoy.</p>';
        } else {
            activeVersus.forEach(v => {
                const card = createVersusCard(v, kpisToday);
                activeVersusContainer.appendChild(card);
            });
        }
        
        lastFinishedVersusContainer.innerHTML = '';
        if(finishedVersus.length > 0){
            finishedVersus.forEach(v => {
               const card = createVersusCard(v, kpisToday);
               lastFinishedVersusContainer.appendChild(card);
            });
        } else {
             lastFinishedVersusContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">Aún no hay enfrentamientos terminados hoy.</p>';
        }

        document.querySelectorAll('.delete-versus-btn').forEach(btn => btn.addEventListener('click', (e) => {
            versusToDeleteId = e.currentTarget.dataset.id;
            deleteVersusModal.classList.remove('hidden');
        }));

        document.querySelectorAll('.finish-versus-btn').forEach(btn => btn.addEventListener('click', (e) => confirmFinishVersus(e.currentTarget.dataset.id)));
    }

    function createVersusCard(v, kpisToday){
        const kpiCloser1 = kpisToday.find(k => k.closerId == v.closer1_id) || { cierresLogrados: 0, ingresosTotales: 0, calificacionPitch: 0, actividadesCompletadas: 0 };
        const kpiCloser2 = kpisToday.find(k => k.closerId == v.closer2_id) || { cierresLogrados: 0, ingresosTotales: 0, calificacionPitch: 0, actividadesCompletadas: 0 };
        
        const score1 = (kpiCloser1.cierresLogrados * 40) + (kpiCloser1.ingresosTotales * 0.3) + (kpiCloser1.calificacionPitch * 10) + (kpiCloser1.actividadesCompletadas * 20);
        const score2 = (kpiCloser2.cierresLogrados * 40) + (kpiCloser2.ingresosTotales * 0.3) + (kpiCloser2.calificacionPitch * 10) + (kpiCloser2.actividadesCompletadas * 20);
        
        const isFinished = v.winner_id || v.is_draw == 1;
        let content;

        if (isFinished) {
            let winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto;
            if(v.is_draw == 1){
                content = `<div class="text-center w-full"><span class="text-3xl font-bold text-gray-600 header-font">¡EMPATE!</span><p class="text-gray-500">(${v.name1} vs ${v.name2})</p><p class="font-bold text-2xl text-blue-600 mt-2">${score1.toFixed(2)} Puntos</p></div>`;
            } else {
                const winnerId = parseInt(v.winner_id);
                if(winnerId === parseInt(v.closer1_id)){
                    [winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto] = [v.name1, v.name2, score1, score2, v.photo1, v.photo2];
                } else {
                    [winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto] = [v.name2, v.name1, score2, score1, v.photo2, v.photo1];
                }
                
                content = `
                    <div class="flex flex-col items-center">
                        <span class="text-2xl font-bold text-green-500 header-font">GANADOR</span>
                        <img src="${winnerPhoto || placeholderPhoto}" class="versus-card-photo mt-2">
                        <p class="font-bold text-lg mt-2">${winnerName}</p>
                        <p class="font-bold text-3xl text-blue-600">${winnerScore.toFixed(2)}</p>
                    </div>
                    <span class="text-5xl font-bold text-gray-400 header-font mx-4">|</span>
                    <div class="flex flex-col items-center opacity-60">
                        <span class="text-xl font-bold text-red-500 header-font">PERDEDOR</span>
                        <img src="${loserPhoto || placeholderPhoto}" class="versus-card-photo mt-2 border-gray-400">
                        <p class="font-bold text-lg mt-2">${loserName}</p>
                        <p class="font-bold text-3xl text-gray-600">${loserScore.toFixed(2)}</p>
                    </div>
                `;
            }
        } else {
            let statusText = `El reto de hoy es: ${v.challenge_description.split('\n')[0].replace('Título: ', '')}`;
            
            content = `
                <div class="flex justify-around items-center text-center w-full">
                    <div>
                        <img src="${v.photo1 || placeholderPhoto}" class="versus-card-photo">
                        <p class="font-bold text-lg mt-2">${v.name1}</p>
                        <p class="font-bold text-3xl text-blue-600">${score1.toFixed(2)}</p>
                    </div>
                    <span class="text-4xl font-bold text-red-500 header-font mx-4">VS</span>
                    <div>
                        <img src="${v.photo2 || placeholderPhoto}" class="versus-card-photo">
                        <p class="font-bold text-lg mt-2">${v.name2}</p>
                        <p class="font-bold text-3xl text-blue-600">${score2.toFixed(2)}</p>
                    </div>
                </div>
                <div class="mt-4 text-center border-t pt-3 w-full">
                     <p class="mt-2 text-sm text-gray-800 bg-blue-100 p-2 rounded">${statusText}</p>
                     <button class="w-full mt-4 bg-green-500 text-white font-bold py-2 rounded-md hover:bg-green-600 finish-versus-btn" data-id="${v.id}">Reto Terminado</button>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-lg relative';
        card.innerHTML = `
            <div class="absolute top-2 left-2 text-xs text-gray-500 font-semibold">${formatDate(v.date)}</div>
            <button class="absolute top-2 right-2 text-gray-400 hover:text-red-600 delete-versus-btn" data-id="${v.id}" title="Eliminar Versus">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <div class="flex flex-wrap justify-around items-center">${content}</div>
        `;
        return card;
    }

    async function renderVersusHistory() {
        const month = monthFilter.value;
        const response = await fetch(`${VERSUS_API}?month=${month}`);
        const versusHistory = await response.json();

        versusHistoryContainer.innerHTML = '';
        const finishedVersus = versusHistory.filter(v => v.winner_id || v.is_draw == 1).reverse();

        if (finishedVersus.length === 0) {
            versusHistoryContainer.innerHTML = '<p class="text-center text-gray-500">Aún no hay enfrentamientos finalizados este mes.</p>';
            return;
        }
        
        finishedVersus.forEach(v => {
            let resultText = '';
            if (v.is_draw == 1) {
                resultText = `<strong>Empate</strong> entre ${v.name1} y ${v.name2}`;
            } else {
                const winnerName = v.winner_id == v.closer1_id ? v.name1 : v.name2;
                const loserName = v.winner_id == v.closer1_id ? v.name2 : v.name1;
                resultText = `<strong>${winnerName}</strong> venció a <strong>${loserName}</strong>`;
            }
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-3 rounded-md border-l-4 border-gray-400 flex justify-between items-center';
            card.innerHTML = `
                <p class="text-sm"><strong class="text-gray-700">${formatDate(v.date)}:</strong> ${resultText}</p>
                <button class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 view-history-btn" data-versus='${JSON.stringify(v)}'>Ver Detalle</button>
            `;
            versusHistoryContainer.appendChild(card);
        });
        document.querySelectorAll('.view-history-btn').forEach(btn => btn.addEventListener('click', (e) => showVersusDetail(JSON.parse(e.currentTarget.dataset.versus))));
    }
    
    async function showVersusDetail(versusData) {
        const kpisResponse = await fetch(`${KPI_API}?date=${versusData.date}`);
        const kpisToday = await kpisResponse.json();
        const detailCard = createVersusCard(versusData, kpisToday);
        versusDetailContent.innerHTML = '';
        versusDetailContent.appendChild(detailCard);
        versusDetailModal.classList.remove('hidden');
    }


    async function confirmFinishVersus(versusId) {
        try {
            const response = await fetch(VERSUS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'finalize_match', versus_id: versusId })
            });
            const result = await response.json();
            if(result.success) {
                showNotification(result.message);
                await renderAllViews();
                renderDailyVersusContainers();
                renderVersusHistory();
                renderVersusSummaryTable();
            } else {
                throw new Error(result.error || 'Error al finalizar el reto.');
            }
        } catch (error) {
            showNotification("Error: " + error.message);
        }
    }

    async function confirmDeleteVersus() {
        const password = adminPasswordInput.value;
        if (!password) {
            return showNotification("Debes ingresar la contraseña.");
        }

        try {
            const response = await fetch(VERSUS_API, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versus_id: versusToDeleteId, password: password })
            });
            const result = await response.json();

            if(response.ok && result.success) {
                showNotification(result.message);
                deleteVersusModal.classList.add('hidden');
                adminPasswordInput.value = '';
                await renderAllViews();
                renderDailyVersusContainers();
                renderVersusHistory();
                renderVersusSummaryTable();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch(error) {
            showNotification("Error: " + error.message);
        }
    }

    async function renderVersusSummaryTable() {
        const month = monthFilter.value;
        const response = await fetch(`${VERSUS_API}?month=${month}`);
        const versusHistory = await response.json();
        
        const stats = {};

        closersCache.forEach(closer => {
            stats[closer.id] = { name: closer.name, photoUrl: closer.photoUrl, played: 0, won: 0, lost: 0 };
        });

        versusHistory.forEach(match => {
            if(match.is_draw == 0) { 
                if (stats[match.closer1_id]) stats[match.closer1_id].played++;
                if (stats[match.closer2_id]) stats[match.closer2_id].played++;

                if (match.winner_id) {
                    if (stats[match.winner_id]) stats[match.winner_id].won++;
                    if (stats[match.loser_id]) stats[match.loser_id].lost++;
                }
            }
        });

        const sortedStats = Object.values(stats).sort((a, b) => b.won - a.won || a.lost - b.lost);

        versusSummaryBody.innerHTML = '';
        if(sortedStats.length === 0) {
            versusSummaryBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">No hay datos de versus para este mes.</td></tr>`;
            return;
        }
        
        sortedStats.forEach(closer => {
            const effectiveness = closer.played > 0 ? ((closer.won / closer.played) * 100).toFixed(1) + '%' : 'N/A';
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50 text-sm';
            row.innerHTML = `
                <td class="p-2 font-semibold text-left">
                    <div class="flex items-center">
                        <img src="${closer.photoUrl || placeholderPhoto}" alt="${closer.name}" class="roster-photo mr-3">
                        <span>${closer.name}</span>
                    </div>
                </td>
                <td class="p-2 text-center">${closer.played}</td>
                <td class="p-2 text-center text-green-600 font-bold">${closer.won}</td>
                <td class="p-2 text-center text-red-600 font-bold">${closer.lost}</td>
                <td class="p-2 text-center font-bold text-blue-700">${effectiveness}</td>
            `;
            versusSummaryBody.appendChild(row);
        });
    }

    initApp();
});