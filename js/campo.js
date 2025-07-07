document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'api/';
    const AGENTES_API = API_BASE_URL + 'agentes_campo.php';
    const KPI_API = API_BASE_URL + 'kpi_campo.php';
    const ANALYSIS_API = API_BASE_URL + 'generate_analysis.php'; 
    const VERSUS_API = API_BASE_URL + 'versus_campo.php'; 

    const navStandings = document.getElementById('nav-standings-campo');
    const navVersus = document.getElementById('nav-versus-campo');
    const navDataEntry = document.getElementById('nav-data-entry-campo');
    const navEdit = document.getElementById('nav-edit-entries-campo');
    const navRoster = document.getElementById('nav-roster-campo');
    const navMobile = document.getElementById('nav-mobile-campo');

    const standingsView = document.getElementById('standings-view-campo');
    const versusView = document.getElementById('versus-view-campo');
    const dataEntryView = document.getElementById('data-entry-view-campo');
    const rosterView = document.getElementById('roster-view-campo');
    const editView = document.getElementById('edit-view-campo');
    const mobileView = document.getElementById('mobile-view-campo');

    const monthFilter = document.getElementById('month-filter-campo');
    const standingsBody = document.getElementById('standings-body-campo');
    const loader = document.getElementById('standings-loader-campo');
    
    const entryDateInput = document.getElementById('entry-date-campo');
    const versusDateInput = document.getElementById('entry-date-versus-campo');
    const dataEntryTableBody = document.getElementById('data-entry-table-body-campo');
    const saveAllBtn = document.getElementById('save-all-btn-campo');

    const agentesListDiv = document.getElementById('agentes-list-campo');
    const addAgenteBtn = document.getElementById('add-agente-btn-campo');
    const newAgenteNameInput = document.getElementById('new-agente-name-campo');
    const newAgentePhotoInput = document.getElementById('new-agente-photo-campo');
    
    const editEntriesBody = document.getElementById('edit-entries-body-campo');
    const editLoader = document.getElementById('edit-loader-campo');
    const saveUpdatesBtn = document.getElementById('save-updates-btn-campo');
    const searchEditBtn = document.getElementById('search-edit-btn-campo');
    const editAgentFilter = document.getElementById('edit-agent-filter-campo');
    const editDateFilter = document.getElementById('edit-date-filter-campo');
    let editEntriesCache = [];

    const mobileStandingsContainer = document.getElementById('mobile-standings-container-campo');
    const mobileLoader = document.getElementById('mobile-loader-campo');
    const mobileMonthDisplay = document.getElementById('mobile-month-display-campo');
    
    const notificationModal = document.getElementById('notification-modal-campo');
    const notificationMessage = document.getElementById('notification-message-campo');
    const closeNotificationBtn = document.getElementById('close-notification-btn-campo');

    const generateAnalysisBtn = document.getElementById('generate-analysis-btn-campo');
    const analysisContainer = document.getElementById('analysis-container-campo');
    const analysisLoader = document.getElementById('analysis-loader-campo');

    const explanationModal = document.getElementById('explanation-modal-campo');
    const closeExplanationBtn = document.getElementById('close-explanation-btn-campo');
    const explanationTitle = document.getElementById('explanation-title-campo');
    const explanationText = document.getElementById('explanation-text-campo');
    
    const kpiLeadersContainer = document.getElementById('kpi-leaders-container-campo');

    const versusAvailabilityContainer = document.getElementById('versus-availability-container-campo');
    const generateVersusBtn = document.getElementById('generate-versus-btn-campo');
    const activeVersusContainer = document.getElementById('active-versus-container-campo');
    const lastFinishedVersusContainer = document.getElementById('last-finished-versus-container-campo');
    const versusHistoryContainer = document.getElementById('versus-history-container-campo');
    const versusSummaryBody = document.getElementById('versus-summary-body-campo');

    const deleteVersusModal = document.getElementById('delete-versus-modal-campo');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn-campo');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn-campo');
    const adminPasswordInput = document.getElementById('admin-password-input-campo');
    let versusToDeleteId = null;

    const versusDetailModal = document.getElementById('versus-detail-modal-campo');
    const versusDetailContent = document.getElementById('versus-detail-content-campo');
    const closeVersusDetailBtn = document.getElementById('close-versus-detail-btn-campo');
    
    const editAgentModal = document.getElementById('edit-agent-modal-campo');
    const editAgentForm = document.getElementById('edit-agent-form-campo');
    const cancelEditAgentBtn = document.getElementById('cancel-edit-agent-btn-campo');

    let agentesCache = [];
    let kpiObjectives = {};
    let dailyVersusParticipants = [];
    const placeholderPhoto = `placeholder.svg`;

    async function initApp() { 
        const today = new Date().toISOString().split('T')[0];
        entryDateInput.value = today;
        versusDateInput.value = today;
        const currentMonth = new Date().toISOString().slice(0, 7);
        monthFilter.value = currentMonth;
        
        navStandings.addEventListener('click', () => showView('standings'));
        navVersus.addEventListener('click', () => showView('versus'));
        navDataEntry.addEventListener('click', () => showView('data-entry'));
        navEdit.addEventListener('click', () => showView('edit'));
        navRoster.addEventListener('click', () => showView('roster'));
        navMobile.addEventListener('click', () => showView('mobile'));

        addAgenteBtn.addEventListener('click', addAgente);
        saveAllBtn.addEventListener('click', saveAllKpiEntries);
        saveUpdatesBtn.addEventListener('click', saveAllUpdates);
        searchEditBtn.addEventListener('click', () => renderEditTable(false));

        monthFilter.addEventListener('change', () => {
            renderAllViews();
            if(!versusView.classList.contains('hidden')) {
                renderVersusSections();
            }
            if(!editView.classList.contains('hidden')) {
                renderEditTable(true);
            }
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

        closeNotificationBtn.addEventListener('click', () => notificationModal.classList.add('hidden'));
        closeExplanationBtn.addEventListener('click', () => explanationModal.classList.add('hidden')); 
        closeVersusDetailBtn.addEventListener('click', () => versusDetailModal.classList.add('hidden'));
        
        generateAnalysisBtn.addEventListener('click', generatePlayerByPlayerAnalysis); 
        generateVersusBtn.addEventListener('click', generateVersusChallenge); 

        cancelDeleteBtn.addEventListener('click', () => deleteVersusModal.classList.add('hidden'));
        confirmDeleteBtn.addEventListener('click', confirmDeleteVersus);

        document.getElementById('export-csv-btn-campo').addEventListener('click', () => {
            exportTableToCSV('standings-table-campo', 'standings_campo.csv');
        });
        
        cancelEditAgentBtn.addEventListener('click', () => editAgentModal.classList.add('hidden'));
        editAgentForm.addEventListener('submit', updateAgent);

        await fetchKpiObjectives();
        await fetchAgentes(); 
        await fetchDailyVersus();
        showView('standings');
    }

    function showView(viewName) {
        [standingsView, versusView, dataEntryView, rosterView, editView, mobileView].forEach(v => v.classList.add('hidden'));
        [navStandings, navVersus, navDataEntry, navEdit, navRoster, navMobile].forEach(b => b.classList.remove('active'));

        const viewMap = {
            'standings': { view: standingsView, nav: navStandings, render: renderStandings },
            'versus': { view: versusView, nav: navVersus, render: renderVersusSections },
            'data-entry': { view: dataEntryView, nav: navDataEntry, render: renderDataEntryTable }, 
            'roster': { view: rosterView, nav: navRoster, render: renderRosterList },
            'edit': { view: editView, nav: navEdit, render: () => renderEditTable(true) },
            'mobile': { view: mobileView, nav: navMobile, render: renderMobileStandings },
        };
        
        const selected = viewMap[viewName];
        if(selected) {
            selected.view.classList.remove('hidden');
            selected.nav.classList.add('active');
            selected.render();
        }
    }

    function renderVersusSections() {
        renderAgentAvailabilityList();
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

    async function fetchKpiObjectives() {
        try {
            const response = await fetch('api/objectives.php');
            const result = await response.json();
            if (result.success) {
                kpiObjectives = result.data;
                document.getElementById('meta-prospectos-display').textContent = kpiObjectives.campo_meta_prospectos || '--';
                document.getElementById('meta-cierres-display').textContent = kpiObjectives.campo_meta_cierres || '--';
                document.getElementById('ref-plan-caro-display').textContent = kpiObjectives.campo_ref_plan_caro || '--';
            } else {
                console.error("No se pudieron cargar los objetivos de KPIs.");
            }
        } catch (error) {
            console.error("Error fatal al cargar objetivos:", error);
        }
    }

    async function showExplanation(kpi) {
        const standings = await getStandingsData();
        if(!standings || standings.length === 0) {
            return showNotification("No hay datos del líder para mostrar un ejemplo.");
        }
        const leader = standings[0];
        const metaProspectos = parseFloat(kpiObjectives.campo_meta_prospectos) || 1;
        const metaCierres = parseFloat(kpiObjectives.campo_meta_cierres) || 1;
        const refPlanCaro = parseFloat(kpiObjectives.campo_ref_plan_caro) || 1;

        const explanations = {
            prospectos: {
                title: "Prospectos Cualificados (Contribución: 20% del puntaje total)",
                text: `Representa el porcentaje de la meta de prospectos alcanzada. Cada prospecto suma puntos.\n\nFórmula: (Prospectos Cualificados / Meta Prospectos) * 20\n\nEjemplo con ${leader.name}:\n(${leader.prospectos} / ${metaProspectos}) * 20 = ${leader.tc_points.toFixed(1)} puntos.`
            },
            oportunidades: {
                title: "Oportunidades Convertidas (Contribución: 30% del puntaje total)",
                text: `Representa el porcentaje de la meta de cierres alcanzada. Cada oportunidad convertida suma puntos.\n\nFórmula: (Oportunidades Convertidas / Meta Cierres) * 30\n\nEjemplo con ${leader.name}:\n(${leader.oportunidades} / ${metaCierres}) * 30 = ${leader.cierre_points.toFixed(1)} puntos.`
            },
            tasa_conversion: {
                title: "Tasa de Conversión (Contribución: 25% del puntaje total)",
                text: `Porcentaje de oportunidades convertidas respecto a los prospectos cualificados.\n\nFórmula: (Oportunidades Convertidas / Prospectos Cualificados) * 25\n\nEjemplo con ${leader.name}:\n(${leader.oportunidades} / ${leader.prospectos}) * 25 = ${leader.conversion_points.toFixed(1)} puntos.`
            },
            arpu: {
                title: "ARPU Prospectos (Contribución: 15% del puntaje total)",
                text: `Ingreso promedio por prospecto, comparado con un plan de referencia.\n\nFórmula: (ARPU Promedio / Referencia Plan Caro) * 15\n\nEjemplo con ${leader.name}:\n($${leader.arpu.toFixed(2)} / $${refPlanCaro}) * 15 = ${leader.arpu_points.toFixed(1)} puntos.`
            },
            actividades: {
                title: "Actividades Completadas (Contribución: 10% del puntaje total)",
                text: `Porcentaje de actividades completadas respecto a las asignadas.\n\nFórmula: (Actividades Completadas / Actividades Asignadas) * 10\n\nEjemplo con ${leader.name}:\n(${leader.actCompletadas} / ${leader.actAsignadas}) * 10 = ${leader.act_points.toFixed(1)} puntos.`
            },
            puntos_total_summary: {
                title: "Puntos Total del Mes",
                text: `Este es el puntaje acumulado de todas las métricas clave para el agente en el mes.\n\nFórmula: (P. Cualificados / Meta P.)*20 + (Op. Convertidas / Meta C.)*30 + (Op. Conv. / P. Cualif.)*25 + (ARPU / Ref. Plan Caro)*15 + (Act. Comp. / Act. Asig.)*10\n\nEjemplo con ${leader.name}:\n(${leader.prospectos}/${metaProspectos})*20 + (${leader.oportunidades}/${metaCierres})*30 + (${leader.oportunidades}/${leader.prospectos})*25 + (${leader.arpu.toFixed(2)}/${refPlanCaro})*15 + (${leader.actCompletadas}/${leader.actAsignadas})*10 = ${leader.puntaje.toFixed(2)} puntos.`
            }
        };
        const data = explanations[kpi];
        if(data) {
            explanationTitle.textContent = data.title;
            explanationText.textContent = data.text;
            explanationModal.classList.remove('hidden');
        }
    }

    async function addAgente() {
        const name = newAgenteNameInput.value.trim();
        const photoFile = newAgentePhotoInput.files[0];
        if (!name) return showNotification("El nombre del Agente no puede estar vacío.");
        if (photoFile && photoFile.size > 500 * 1024) return showNotification("Error: La imagen es demasiado grande (max 500KB).");
    
        addAgenteBtn.disabled = true;
        addAgenteBtn.textContent = 'Guardando...';

        const formData = new FormData();
        formData.append('name', name);
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        try {
            const response = await fetch(AGENTES_API, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(`Agente "${name}" añadido.`);
            fetchAgentes();
        } catch (error) {
            showNotification("Error al guardar el agente: " + error.message);
        } finally {
            addAgenteBtn.disabled = false;
            addAgenteBtn.textContent = 'Añadir al Roster';
            newAgenteNameInput.value = '';
            newAgentePhotoInput.value = '';
        }
    }

    async function deleteAgente(id) {
        try {
            const response = await fetch(`${AGENTES_API}?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if(result.error) throw new Error(result.error);
            showNotification(`Agente eliminado.`);
            fetchAgentes();
        } catch (error) {
            showNotification("Error al eliminar.");
        }
    }
    
    async function updateAgent(e) {
        e.preventDefault();
        const id = document.getElementById('edit-agent-id-campo').value;
        const name = document.getElementById('edit-agent-name-campo').value;
        const photoFile = document.getElementById('edit-agent-photo-campo').files[0];

        const formData = new FormData();
        formData.append('action', 'update');
        formData.append('id', id);
        formData.append('name', name);
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        const saveButton = document.getElementById('save-edit-agent-btn-campo');
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        try {
            const response = await fetch(AGENTES_API, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            showNotification('Agente actualizado correctamente.');
            editAgentModal.classList.add('hidden');
            fetchAgentes(); 
        } catch (error) {
            showNotification('Error al actualizar: ' + error.message);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar Cambios';
        }
    }

    async function fetchAgentes() {
        try {
            const response = await fetch(AGENTES_API);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            agentesCache = Array.isArray(data) ? data : [];

            renderRosterList();
            renderDataEntryTable(); 
            renderAgentAvailabilityList();
        } catch(error){
            showNotification("No se pudo cargar la lista de agentes desde el servidor.");
            agentesCache = []; 
        }
    }
    
    function renderRosterList() {
        agentesListDiv.innerHTML = agentesCache.length === 0 ? `<p class="text-gray-500">No hay agentes en el roster.</p>` : '';
        agentesCache.forEach(agente => {
            const el = document.createElement('div');
            el.className = 'flex justify-between items-center bg-gray-200 p-2 rounded';
            el.innerHTML = `
                <div class="flex items-center">
                    <img src="${agente.photoUrl || placeholderPhoto}" alt="${agente.name}" class="roster-photo mr-3">
                    <span class="font-semibold">${agente.name}</span>
                </div>
                <div>
                    <button data-id="${agente.id}" class="edit-agent-btn text-blue-600 hover:text-blue-800 text-xs font-bold mr-4">EDITAR</button>
                    <button data-id="${agente.id}" class="delete-agente-btn text-red-600 hover:text-red-800 text-xs font-bold">ELIMINAR</button>
                </div>
            `;
            agentesListDiv.appendChild(el);
        });
        document.querySelectorAll('.delete-agente-btn').forEach(btn => btn.addEventListener('click', (e) => deleteAgente(e.target.dataset.id)));
        document.querySelectorAll('.edit-agent-btn').forEach(btn => btn.addEventListener('click', (e) => openEditAgentModal(e.target.dataset.id)));
    }
    
    function openEditAgentModal(agentId) {
        const agent = agentesCache.find(a => a.id == agentId);
        if (!agent) return;

        document.getElementById('edit-agent-id-campo').value = agent.id;
        document.getElementById('edit-agent-name-campo').value = agent.name;
        document.getElementById('edit-agent-current-photo-campo').src = agent.photoUrl || placeholderPhoto;
        document.getElementById('edit-agent-photo-campo').value = '';
        
        editAgentModal.classList.remove('hidden');
    }

    function renderDataEntryTable() {
        dataEntryTableBody.innerHTML = '';
        if (agentesCache.length === 0) {
            dataEntryTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-500">Añade un agente para empezar.</td></tr>`;
            return;
        }
        agentesCache.forEach(agente => {
            const isParticipant = dailyVersusParticipants.includes(agente.id);
            const versusIcon = isParticipant ? `<span class="versus-icon" title="Tiene Versus Hoy">⚔️</span>` : '';
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100'; 
            row.dataset.agenteId = agente.id;
            row.innerHTML = `
                <td class="p-2 text-gray-800 font-semibold flex items-center min-w-[200px]">
                    <img src="${agente.photoUrl || placeholderPhoto}" alt="Foto" class="roster-photo mr-2"><span>${agente.name}</span>
                    ${versusIcon}
                </td>
                <td><input type="number" min="0" class="kpi-input-prospectos" placeholder="0"></td>
                <td><input type="number" min="0" class="kpi-input-oportunidades" placeholder="0"></td>
                <td><input type="number" min="0" step="0.01" class="kpi-input-arpu" placeholder="0.00"></td>
                <td><input type="number" min="0" class="kpi-input-act-asignadas" placeholder="0"></td>
                <td><input type="number" min="0" class="kpi-input-act-completadas" placeholder="0"></td>
            `;
            dataEntryTableBody.appendChild(row);
        });
    }

    function renderAgentAvailabilityList() {
        versusAvailabilityContainer.innerHTML = '';
        if (agentesCache.length === 0) {
            versusAvailabilityContainer.innerHTML = '<p class="text-gray-500 col-span-full">No hay agentes en el roster.</p>';
            return;
        }
        agentesCache.forEach(agente => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" data-id="${agente.id}" class="form-checkbox h-5 w-5 text-red-600 versus-availability-checkbox-campo">
                <span class="text-gray-700">${agente.name}</span>
            `;
            versusAvailabilityContainer.appendChild(label);
        });
    }

    async function saveAllKpiEntries() {
        const date = entryDateInput.value;
        if (!date) return showNotification("Selecciona una fecha.");
        const rows = document.querySelectorAll('#data-entry-table-body-campo tr');
        const entriesToSave = [];
        
        for (const row of rows) {
            const entry = {
                agenteId: parseInt(row.dataset.agenteId), 
                date: date,
                prospectosCualificados: parseInt(row.querySelector('.kpi-input-prospectos').value || 0),
                oportunidadesConvertidas: parseInt(row.querySelector('.kpi-input-oportunidades').value || 0),
                arpuProspectos: parseFloat(row.querySelector('.kpi-input-arpu').value || 0),
                actividadesAsignadas: parseInt(row.querySelector('.kpi-input-act-asignadas').value || 0),
                actividadesCompletadas: parseInt(row.querySelector('.kpi-input-act-completadas').value || 0)
            };
            if (entry.prospectosCualificados === 0 && entry.oportunidadesConvertidas === 0 && entry.arpuProspectos === 0 && entry.actividadesAsignadas === 0 && entry.actividadesCompletadas === 0) continue;
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
        const selectedDate = document.getElementById('entry-date-campo').value;
        try {
            const response = await fetch(`${VERSUS_API}?date=${selectedDate}`);
            const versusEntries = await response.json();
            dailyVersusParticipants = [];
            if (Array.isArray(versusEntries)) {
                versusEntries.forEach(v => {
                    dailyVersusParticipants.push(parseInt(v.agente1_id));
                    dailyVersusParticipants.push(parseInt(v.agente2_id));
                });
            }
        } catch (e) {
            console.error("Error fetching daily versus", e);
            dailyVersusParticipants = [];
        }
    }

    async function getStandingsData() {
        const month = monthFilter.value;
        const metaProspectos = parseFloat(kpiObjectives.campo_meta_prospectos) || 1;
        const metaCierres = parseFloat(kpiObjectives.campo_meta_cierres) || 1;
        const refPlanCaro = parseFloat(kpiObjectives.campo_ref_plan_caro) || 1;

        const aggregatedData = {};
        
        if (!Array.isArray(agentesCache)) {
            return []; 
        }

        agentesCache.forEach(c => {
            aggregatedData[c.id] = { id: parseInt(c.id), name: c.name, photoUrl: c.photoUrl, prospectos: 0, oportunidades: 0, arpuTotal: 0, arpuCount: 0, actAsignadas: 0, actCompletadas: 0, versus_points: 0 }; 
        });

        const kpiResponse = await fetch(`${KPI_API}?month=${month}`);
        const kpiEntries = await kpiResponse.json();
        
        const versusResponse = await fetch(`${VERSUS_API}?month=${month}`);
        const versusEntries = await versusResponse.json();

        if (Array.isArray(kpiEntries)) {
            kpiEntries.forEach(data => {
                if (aggregatedData[data.agenteId]) {
                    const agente = aggregatedData[data.agenteId];
                    agente.prospectos += parseInt(data.prospectosCualificados);
                    agente.oportunidades += parseInt(data.oportunidadesConvertidas);
                    if(parseFloat(data.arpuProspectos) > 0) {
                        agente.arpuTotal += parseFloat(data.arpuProspectos);
                        agente.arpuCount++;
                    }
                    agente.actAsignadas += parseInt(data.actividadesAsignadas); 
                    agente.actCompletadas += parseInt(data.actividadesCompletadas); 
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
        
        const finalStandings = Object.values(aggregatedData).map(agente => {
            const arpu_avg = agente.arpuCount > 0 ? agente.arpuTotal / agente.arpuCount : 0;
            const tc_percent = (agente.prospectos / metaProspectos) * 100;
            const cierre_percent = (agente.oportunidades / metaCierres) * 100;
            const conversion_percent = agente.prospectos > 0 ? (agente.oportunidades / agente.prospectos) * 100 : 0;
            const arpu_percent = (arpu_avg / refPlanCaro) * 100;
            const act_percent = agente.actAsignadas > 0 ? (agente.actCompletadas / agente.actAsignadas) * 100 : 0;

            const tc_points = (tc_percent/100 * 20);
            const cierre_points = (cierre_percent/100 * 30);
            const conversion_points = (conversion_percent/100 * 25);
            const arpu_points = (arpu_percent/100 * 15);
            const act_points = (act_percent/100 * 10);
            
            const puntaje = tc_points + cierre_points + conversion_points + arpu_points + act_points + (agente.versus_points || 0);

            return { 
                ...agente, 
                arpu: arpu_avg,
                tc_percent, 
                cierre_percent, 
                conversion_percent, 
                arpu_percent, 
                act_percent,
                puntaje, 
                tc_points, 
                cierre_points, 
                conversion_points, 
                arpu_points, 
                act_points,
                versus_points: (agente.versus_points || 0)
            };
        }).sort((a, b) => b.puntaje - a.puntaje);
        
        return finalStandings;
    }

    async function renderStandings() {
        loader.style.display = 'flex';
        standingsBody.innerHTML = '';
        try {
            const finalStandings = await getStandingsData();
            if (finalStandings.length === 0) {
                standingsBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-gray-500">No hay agentes o datos para este mes.</td></tr>`;
            } else {
                finalStandings.forEach((s, index) => {
                    const isParticipant = dailyVersusParticipants.includes(s.id);
                    const versusIcon = isParticipant ? `<span class="versus-icon" title="Tiene Versus Hoy">⚔️</span>` : '';

                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 text-center text-sm';
                    row.innerHTML = `
                        <td class="p-2 font-bold">${index + 1}</td>
                        <td class="p-2 font-semibold text-left">
                            <div class="flex items-center">
                                <img src="${s.photoUrl || placeholderPhoto}" alt="${s.name}" class="agent-photo mr-4"><span>${s.name}</span>
                                ${versusIcon}
                            </div>
                        </td>
                        <td class="p-2">${s.prospectos} (${s.tc_percent.toFixed(1)}%)</td>
                        <td class="p-2">${s.oportunidades} (${s.cierre_percent.toFixed(1)}%)</td>
                        <td class="p-2">${s.conversion_percent.toFixed(1)}%</td>
                        <td class="p-2">$${s.arpu.toFixed(2)} (${s.arpu_percent.toFixed(1)}%)</td>
                        <td class="p-2">${s.actCompletadas}/${s.actAsignadas} (${s.act_percent.toFixed(1)}%)</td>
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
            standingsBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Error al cargar datos.</td></tr>`;
        } finally {
            loader.style.display = 'none';
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

                const leaders = {
                    'Mejor en Prospectos': [...finalStandings].sort((a,b) => b.tc_points - a.tc_points)[0],
                    'Mejor en Oportunidades': [...finalStandings].sort((a,b) => b.cierre_points - a.cierre_points)[0],
                    'Mejor Tasa de Conversión': [...finalStandings].sort((a,b) => b.conversion_points - a.conversion_points)[0],
                    'Mejor ARPU': [...finalStandings].sort((a,b) => b.arpu_points - a.arpu_points)[0],
                    'Más Activo': [...finalStandings].sort((a,b) => b.act_points - a.act_points)[0]
                };
                
                for(const [title, leader] of Object.entries(leaders)){
                    if(leader && leader.puntaje > 0) {
                         const leaderCard = document.createElement('div');
                         leaderCard.className = 'bg-white p-3 rounded-lg shadow-md';
                         leaderCard.innerHTML = `
                            <h4 class="text-sm font-bold text-center text-blue-800 header-font">${title}</h4>
                            <div class="flex items-center mt-2">
                                <img src="${leader.photoUrl || placeholderPhoto}" alt="${leader.name}" class="agent-photo mr-3">
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

    async function renderEditTable(forceFetch = true) {
        editLoader.style.display = 'flex';
        editEntriesBody.innerHTML = '';
        
        try {
            if (forceFetch) {
                const month = monthFilter.value;
                const response = await fetch(`${KPI_API}?month=${month}&aggregate=true`);
                const kpiEntries = await response.json();
                editEntriesCache = Array.isArray(kpiEntries) ? kpiEntries : [];
                populateEditFilters();
            }

            const agentIdFilter = editAgentFilter.value;
            const dateFilter = editDateFilter.value;
            
            let filteredEntries = editEntriesCache;

            if (agentIdFilter) {
                filteredEntries = filteredEntries.filter(entry => entry.agenteId == agentIdFilter);
            }
            if (dateFilter) {
                filteredEntries = filteredEntries.filter(entry => entry.date === dateFilter);
            }
            
            if(filteredEntries.length === 0) {
                editEntriesBody.innerHTML = `<tr><td colspan="7" class="text-center p-8">No hay jugadas que coincidan con los filtros.</td></tr>`;
                return;
            }
            
            filteredEntries.sort((a,b) => new Date(a.date) - new Date(b.date) || a.agenteName.localeCompare(b.agenteName)); 

            filteredEntries.forEach(data => {
                const agente = agentesCache.find(c => c.id == data.agenteId); 
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-100 text-sm';
                row.dataset.agenteId = data.agenteId;
                row.dataset.date = data.date;
                row.innerHTML = `
                    <td class="p-2 font-semibold text-left"><div class="flex items-center"><img src="${agente?.photoUrl || placeholderPhoto}" alt="${agente?.name}" class="roster-photo mr-2"><span>${data.agenteName}</span></div></td>
                    <td class="p-2 text-center">${formatDate(data.date)}</td>
                    <td class="p-2"><input type="number" class="edit-prospectos" value="${data.prospectosCualificados}"></td>
                    <td class="p-2"><input type="number" class="edit-oportunidades" value="${data.oportunidadesConvertidas}"></td>
                    <td class="p-2"><input type="number" step="0.01" class="edit-arpu" value="${data.arpuProspectos}"></td>
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

    function populateEditFilters() {
        const currentAgent = editAgentFilter.value;
        editAgentFilter.innerHTML = '<option value="">Todos los Agentes</option>';
        agentesCache.forEach(agente => {
            const option = document.createElement('option');
            option.value = agente.id;
            option.textContent = agente.name;
            editAgentFilter.appendChild(option);
        });
        editAgentFilter.value = currentAgent;
        editDateFilter.value = '';
    }

    async function saveAllUpdates() {
        const rows = document.querySelectorAll('#edit-entries-body-campo tr'); 
        if(rows.length === 0) return showNotification('No hay nada que guardar.');

        saveUpdatesBtn.disabled = true;
        saveUpdatesBtn.textContent = 'Guardando...';
        
        const updatesToSave = [];
        for(const row of rows) {
             updatesToSave.push({
                agenteId: parseInt(row.dataset.agenteId),
                date: row.dataset.date,
                prospectosCualificados: parseInt(row.querySelector('.edit-prospectos').value || 0),
                oportunidadesConvertidas: parseInt(row.querySelector('.edit-oportunidades').value || 0),
                arpuProspectos: parseFloat(row.querySelector('.edit-arpu').value || 0),
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

    async function generateVersusChallenge() {
        const unavailableCheckboxes = document.querySelectorAll('.versus-availability-checkbox-campo:checked');
        const unavailableIds = Array.from(unavailableCheckboxes).map(cb => cb.dataset.id);
        
        const availableAgentsIds = agentesCache
            .filter(agente => !unavailableIds.includes(String(agente.id)))
            .map(agente => parseInt(agente.id));

        if (availableAgentsIds.length < 2) {
            return showNotification("Se necesitan al menos dos agentes disponibles para el sorteo.");
        }
        
        const date = versusDateInput.value; 
        if (!date) {
            return showNotification("Por favor, selecciona una fecha para el enfrentamiento.");
        }

        generateVersusBtn.disabled = true;
        generateVersusBtn.textContent = 'Generando...';
        
        try {
            const response = await fetch(VERSUS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'generate_challenge', 
                    available_agent_ids: availableAgentsIds, 
                    date: date 
                })
            });
            const result = await response.json();

            if (result.success) {
                showNotification(result.message);
                await renderAllViews();
                renderDailyVersusContainers();
                renderVersusHistory();
                renderVersusSummaryTable();
            } else {
                throw new Error(result.error || "Error desconocido al generar el desafío.");
            }
        } catch (error) {
            showNotification("Error al generar el desafío: " + error.message);
        } finally {
            generateVersusBtn.disabled = false;
            generateVersusBtn.textContent = 'Realizar Sorteo y Generar';
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
                return;
            }

            let analysisPrompt = "Actúa como un analista deportivo experto y conciso para la 'Liga SIGMA de Campeones' de Agentes de Campo. Tu tono debe ser directo y motivador. Proporciona un análisis táctico BREVE y PRECISO para CADA UNO de los siguientes agentes. Para cada agente, genera un título llamativo y un análisis conciso de 2-3 frases.\n\n";

            for(let i = 0; i < standings.length; i++) {
                const player = standings[i];
                analysisPrompt += `AGENTE ${i + 1}: ${player.name}\n`;
                analysisPrompt += `ESTADÍSTICAS: Prospectos=${player.prospectos}, Oportunidades=${player.oportunidades}, ARPU=$${player.arpu.toFixed(2)}, Actividades Completadas=${player.actCompletadas} de ${player.actAsignadas}, PUNTAJE TOTAL=${player.puntaje.toFixed(2)}\n`;

                if (i === 0) {
                    const rival = standings.length > 1 ? standings[i + 1] : null;
                    analysisPrompt += `TAREA: En 2-3 frases, analiza cómo ${player.name} puede MANTENER el liderato. ${rival ? `Compara brevemente sus fortalezas y debilidades (basado en los totales de cada métrica) con ${rival.name}.` : ''} Identifica la métrica clave para su dominio.\n\n`;
                } else {
                    const rival = standings[i - 1];
                    analysisPrompt += `TAREA: En 2-3 frases, analiza qué necesita ${player.name} para SUPERAR a ${rival.name} (Puntaje Total: ${rival.puntaje.toFixed(2)}). Especifica la métrica principal donde debe enfocarse para cerrar la brecha.\n\n`;
                }
            }
            analysisPrompt += "Devuelve el análisis para cada agente separado por '---'. Formato: ### TÍTULO\nAnálisis...";
            
            const response = await fetch(ANALYSIS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: analysisPrompt })
            });
            
            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.error?.message || result.error || `Error del servidor: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (analysisText) {
                const articles = analysisText.split('---');
                analysisContainer.innerHTML = standings.map((player, index) => {
                    const articleContent = articles[index] || "No se pudo generar análisis para este agente.";
                    const formattedContent = articleContent.trim().replace(/### (.*)/, '<h3 class="text-xl font-bold mb-2 header-font text-gray-800">$1</h3>');
                    return `
                        <div class="analysis-card p-4 rounded-lg shadow">
                            <div class="flex items-center mb-3">
                                <img src="${player.photoUrl || placeholderPhoto}" alt="${player.name}" class="agent-photo mr-4">
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
            showNotification(`Ocurrió un error al generar el análisis: ${error.message}`);
        } finally {
            analysisLoader.style.display = 'none';
            generateAnalysisBtn.disabled = false;
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

        document.querySelectorAll('.delete-versus-btn-campo').forEach(btn => btn.addEventListener('click', (e) => {
            versusToDeleteId = e.currentTarget.dataset.id;
            deleteVersusModal.classList.remove('hidden');
        }));

        document.querySelectorAll('.finish-versus-btn-campo').forEach(btn => btn.addEventListener('click', (e) => confirmFinishVersus(e.currentTarget.dataset.id)));
    }

    function createVersusCard(v, kpisToday){
        const metaProspectos = parseFloat(kpiObjectives.campo_meta_prospectos) || 1;
        const metaCierres = parseFloat(kpiObjectives.campo_meta_cierres) || 1;
        const refPlanCaro = parseFloat(kpiObjectives.campo_ref_plan_caro) || 1;

        const kpiAgente1 = kpisToday.find(k => k.agenteId == v.agente1_id) || { prospectosCualificados: 0, oportunidadesConvertidas: 0, arpuProspectos: 0, actividadesAsignadas: 0, actividadesCompletadas: 0 };
        const kpiAgente2 = kpisToday.find(k => k.agenteId == v.agente2_id) || { prospectosCualificados: 0, oportunidadesConvertidas: 0, arpuProspectos: 0, actividadesAsignadas: 0, actividadesCompletadas: 0 };
        
        const calculateScore = (kpi) => {
            if (!kpi) return 0;
            const tc_points = (kpi.prospectosCualificados / metaProspectos) * 20;
            const cierre_points = (kpi.oportunidadesConvertidas / metaCierres) * 30;
            const conversion_points = kpi.prospectosCualificados > 0 ? (kpi.oportunidadesConvertidas / kpi.prospectosCualificados) * 25 : 0;
            const arpu_points = kpi.arpuProspectos > 0 ? (kpi.arpuProspectos / refPlanCaro) * 15 : 0;
            const act_points = kpi.actividadesAsignadas > 0 ? (kpi.actividadesCompletadas / kpi.actividadesAsignadas) * 10 : 0;
            return tc_points + cierre_points + conversion_points + arpu_points + act_points;
        };

        const score1 = calculateScore(kpiAgente1);
        const score2 = calculateScore(kpiAgente2);
        
        const isFinished = v.winner_id || v.is_draw == 1;
        let content;

        if (isFinished) {
            let winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto;
            if(v.is_draw == 1){
                content = `<div class="text-center w-full"><span class="text-3xl font-bold text-gray-600 header-font">¡EMPATE!</span><p class="text-gray-500">(${v.name1} vs ${v.name2})</p><p class="font-bold text-2xl text-blue-600 mt-2">${score1.toFixed(2)} Puntos</p></div>`;
            } else {
                const winnerId = parseInt(v.winner_id);
                if(winnerId === parseInt(v.agente1_id)){
                    [winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto] = [v.name1, v.name2, score1, score2, v.photo1, v.photo2];
                } else {
                    [winnerName, loserName, winnerScore, loserScore, winnerPhoto, loserPhoto] = [v.name2, v.name1, score2, score1, v.photo2, v.photo1];
                }
                content = `<div class="flex flex-col items-center"><span class="text-2xl font-bold text-green-500 header-font">GANADOR</span><img src="${winnerPhoto || placeholderPhoto}" class="versus-card-photo mt-2"><p class="font-bold text-lg mt-2">${winnerName}</p><p class="font-bold text-3xl text-blue-600">${winnerScore.toFixed(2)}</p></div><span class="text-5xl font-bold text-gray-400 header-font mx-4">|</span><div class="flex flex-col items-center opacity-60"><span class="text-xl font-bold text-red-500 header-font">PERDEDOR</span><img src="${loserPhoto || placeholderPhoto}" class="versus-card-photo mt-2 border-gray-400"><p class="font-bold text-lg mt-2">${loserName}</p><p class="font-bold text-3xl text-gray-600">${loserScore.toFixed(2)}</p></div>`;
            }
        } else {
            content = `<div class="flex justify-around items-center text-center w-full"><div><img src="${v.photo1 || placeholderPhoto}" class="versus-card-photo"><p class="font-bold text-lg mt-2">${v.name1}</p><p class="font-bold text-3xl text-blue-600">${score1.toFixed(2)}</p></div><span class="text-4xl font-bold text-red-500 header-font mx-4">VS</span><div><img src="${v.photo2 || placeholderPhoto}" class="versus-card-photo"><p class="font-bold text-lg mt-2">${v.name2}</p><p class="font-bold text-3xl text-blue-600">${score2.toFixed(2)}</p></div></div><div class="mt-4 text-center border-t pt-3 w-full"><p class="mt-2 text-sm text-gray-800 bg-blue-100 p-2 rounded">El reto se define por el puntaje total del día.</p><button class="w-full mt-4 bg-green-500 text-white font-bold py-2 rounded-md hover:bg-green-600 finish-versus-btn-campo" data-id="${v.id}">Reto Terminado</button></div>`;
        }

        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-lg relative';
        card.innerHTML = `<div class="absolute top-2 left-2 text-xs text-gray-500 font-semibold">${formatDate(v.date)}</div><button class="absolute top-2 right-2 text-gray-400 hover:text-red-600 delete-versus-btn-campo" data-id="${v.id}" title="Eliminar Versus"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button><div class="flex flex-wrap justify-around items-center">${content}</div>`;
        return card;
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
                const winnerName = v.winner_id == v.agente1_id ? v.name1 : v.name2;
                const loserName = v.winner_id == v.agente1_id ? v.name2 : v.name1;
                resultText = `<strong>${winnerName}</strong> venció a <strong>${loserName}</strong>`;
            }
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-3 rounded-md border-l-4 border-gray-400 flex justify-between items-center';
            card.innerHTML = `<p class="text-sm"><strong class="text-gray-700">${formatDate(v.date)}:</strong> ${resultText}</p><button class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 view-history-btn-campo" data-versus='${JSON.stringify(v)}'>Ver Detalle</button>`;
            versusHistoryContainer.appendChild(card);
        });
        document.querySelectorAll('.view-history-btn-campo').forEach(btn => btn.addEventListener('click', (e) => showVersusDetail(JSON.parse(e.currentTarget.dataset.versus))));
    }
    
    async function showVersusDetail(versusData) {
        const kpisResponse = await fetch(`${KPI_API}?date=${versusData.date}`);
        const kpisToday = await kpisResponse.json();
        const detailCard = createVersusCard(versusData, kpisToday);
        versusDetailContent.innerHTML = '';
        versusDetailContent.appendChild(detailCard);
        versusDetailModal.classList.remove('hidden');
    }

    async function renderVersusSummaryTable() {
        const month = monthFilter.value;
        const response = await fetch(`${VERSUS_API}?month=${month}`);
        const versusHistory = await response.json();
        
        const stats = {};
        agentesCache.forEach(agente => {
            stats[agente.id] = { name: agente.name, photoUrl: agente.photoUrl, played: 0, won: 0, lost: 0 };
        });

        versusHistory.forEach(match => {
            if(match.is_draw == 0 && (match.winner_id || match.loser_id)) { 
                if (stats[match.agente1_id]) stats[match.agente1_id].played++;
                if (stats[match.agente2_id]) stats[match.agente2_id].played++;
                if (match.winner_id && stats[match.winner_id]) stats[match.winner_id].won++;
                if (match.loser_id && stats[match.loser_id]) stats[match.loser_id].lost++;
            }
        });

        const sortedStats = Object.values(stats).sort((a, b) => b.won - a.won || a.lost - b.lost);

        versusSummaryBody.innerHTML = '';
        if(sortedStats.filter(s => s.played > 0).length === 0) {
            versusSummaryBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">No hay datos de versus para este mes.</td></tr>`;
            return;
        }
        
        sortedStats.forEach(agent => {
            if (agent.played === 0) return;
            const effectiveness = agent.played > 0 ? ((agent.won / agent.played) * 100).toFixed(1) + '%' : 'N/A';
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50 text-sm';
            row.innerHTML = `<td class="p-2 font-semibold text-left"><div class="flex items-center"><img src="${agent.photoUrl || placeholderPhoto}" alt="${agent.name}" class="roster-photo mr-3"><span>${agent.name}</span></div></td><td class="p-2 text-center">${agent.played}</td><td class="p-2 text-center text-green-600 font-bold">${agent.won}</td><td class="p-2 text-center text-red-600 font-bold">${agent.lost}</td><td class="p-2 text-center font-bold text-blue-700">${effectiveness}</td>`;
            versusSummaryBody.appendChild(row);
        });
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

    initApp();
});