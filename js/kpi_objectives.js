document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('objectives-form');
    const OBJECTIVES_API = 'api/objectives.php';

    async function loadObjectives() {
        try {
            const response = await fetch(OBJECTIVES_API);
            const result = await response.json();
            if (result.success) {
                const objectives = result.data;
                for (const key in objectives) {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = objectives[key];
                    }
                }
            } else {
                throw new Error(result.error || 'Error al cargar objetivos.');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = form.querySelectorAll('.kpi-input');
        const objectivesToSave = {};
        
        inputs.forEach(input => {
            objectivesToSave[input.dataset.key] = input.value;
        });

        try {
            const response = await fetch(OBJECTIVES_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(objectivesToSave)
            });
            const result = await response.json();
            if(result.success) {
                alert(result.message);
            } else {
                throw new Error(result.error);
            }
        } catch(error) {
            alert('Error: ' + error.message);
        }
    });

    loadObjectives();
});