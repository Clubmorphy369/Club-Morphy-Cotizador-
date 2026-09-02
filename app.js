(function() {
    'use strict';

    // ---- CONSTANTES ----
    const PASSWORD_KEY = 'morphyy_admin_password';
    const DEFAULT_PASSWORD = 'ClubMorphy369';
    const USER_ID_KEY = 'morphyy_user_id';
    const LOG_KEY = 'morphyy_log';
    const TARIFAS_KEY = 'morphyy_tarifas_especiales';
    const VENCIMIENTO_DIAS = 3;

    // ---- ESTADO GLOBAL ----
    let horarios = [];
    let solicitudes = [];
    let tarifasEspeciales = [];
    let isAdminMode = false;
    let draggedIndex = null;
    let userId = null;
    let log = [];
    let chartEscuelas = null;
    let chartDias = null;
    let previewEditable = false;

    // ---- ELEMENTOS DOM ----
    const adminToggle = document.getElementById('adminToggle');
    const adminPanel = document.getElementById('adminPanel');
    const authModal = document.getElementById('authModal');
    const authPassword = document.getElementById('authPassword');
    const authConfirm = document.getElementById('authConfirm');
    const authCancel = document.getElementById('authCancel');
    const authError = document.getElementById('authError');
    const togglePwd = document.getElementById('togglePwd');
    const solicitudesPendientes = document.getElementById('solicitudesPendientes');
    const historialSolicitudes = document.getElementById('historialSolicitudes');
    const limpiarHistorialBtn = document.getElementById('limpiarHistorialBtn');
    const horariosListAdmin = document.getElementById('horariosListAdmin');
    const agregarHorarioAdmin = document.getElementById('agregarHorarioAdmin');
    const tarifasEspecialesContainer = document.getElementById('tarifasEspecialesContainer');
    const agregarTarifaBtn = document.getElementById('agregarTarifaBtn');
    const ingresosSemanalTotal = document.getElementById('ingresosSemanalTotal');
    const ingresosQuincenalTotal = document.getElementById('ingresosQuincenalTotal');
    const ingresosDetalle = document.getElementById('ingresosDetalle');
    const graficoEscuelasCanvas = document.getElementById('graficoEscuelas');
    const graficoDiasCanvas = document.getElementById('graficoDias');
    const cambiarPasswordBtn = document.getElementById('cambiarPasswordBtn');
    const nuevaPassword = document.getElementById('nuevaPassword');
    const passwordMsg = document.getElementById('passwordMsg');
    const bitacoraLista = document.getElementById('bitacoraLista');
    const exportarDatosBtn = document.getElementById('exportarDatosBtn');
    const importarDatosBtn = document.getElementById('importarDatosBtn');
    const importFileInput = document.getElementById('importFileInput');
    const solicitudEscuela = document.getElementById('solicitudEscuela');
    const solicitudDirigido = document.getElementById('solicitudDirigido');
    const solicitudAlumnos = document.getElementById('solicitudAlumnos');
    const solicitudComentario = document.getElementById('solicitudComentario');
    const btnSolicitar = document.getElementById('btnSolicitar');
    const mensajeSolicitud = document.getElementById('mensajeSolicitud');
    const horariosTablaContainer = document.getElementById('horariosTablaContainer');
    const calendarioSemanalContainer = document.getElementById('calendarioSemanal');
    const misSolicitudesContainer = document.getElementById('misSolicitudesContainer');
    const previewContainer = document.getElementById('pdf-preview');
    const inputAlumnos = document.getElementById('alumnosInput');
    const totalDisplay = document.getElementById('totalDisplay');
    const porAlumnoDisplay = document.getElementById('porAlumnoDisplay');
    const rangoDisplay = document.getElementById('rangoDisplay');
    const detalleDisplay = document.getElementById('detalleDisplay');
    const tarifaDescDisplay = document.getElementById('tarifaDescDisplay');
    const decrementBtn = document.getElementById('decrementBtn');
    const incrementBtn = document.getElementById('incrementBtn');
    const horariosDisponiblesCheckboxes = document.getElementById('horariosDisponiblesCheckboxes');
    const btnNuevaSolicitudManual = document.getElementById('btnNuevaSolicitudManual');
    const modalSolicitudManual = document.getElementById('modalSolicitudManual');
    const manualEscuela = document.getElementById('manualEscuela');
    const manualDirigido = document.getElementById('manualDirigido');
    const manualAlumnos = document.getElementById('manualAlumnos');
    const manualComentario = document.getElementById('manualComentario');
    const manualHorariosDisponibles = document.getElementById('manualHorariosDisponibles');
    const manualNoHorariosDisponibles = document.getElementById('manualNoHorariosDisponibles');
    const manualCancelar = document.getElementById('manualCancelar');
    const manualGuardar = document.getElementById('manualGuardar');
    const btnEditarPreview = document.getElementById('btnEditarPreview');

    // ---- FUNCIONES DE BITÁCORA ----
    function agregarLog(accion, detalles) {
        log.unshift({ fecha: new Date().toLocaleString('es-MX'), accion, detalles: detalles || '' });
        if (log.length > 100) log = log.slice(0, 100);
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
        renderBitacora();
    }

    function renderBitacora() {
        if (log.length === 0) {
            bitacoraLista.innerHTML = '<p class="text-muted">No hay eventos registrados.</p>';
            return;
        }
        let html = '';
        log.forEach(item => {
            html += `<div class="bitacora-item"><span class="bitacora-fecha">${item.fecha}</span> - <strong>${item.accion}</strong>${item.detalles ? `<br><span style="color:#5a6f8f;">${item.detalles}</span>` : ''}</div>`;
        });
        bitacoraLista.innerHTML = html;
    }

    // ---- RESPALDO ----
    function exportarDatos() {
        const datos = { version: 1, fecha: new Date().toISOString(), horarios, solicitudes, tarifasEspeciales, log };
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `morphyy_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        agregarLog('Exportación de datos', 'Se generó archivo de respaldo');
    }

    function importarDatos(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const datos = JSON.parse(e.target.result);
                if (datos.horarios) { horarios = datos.horarios; localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios)); }
                if (datos.solicitudes) { solicitudes = datos.solicitudes; saveSolicitudes(); }
                if (datos.tarifasEspeciales) { tarifasEspeciales = datos.tarifasEspeciales; saveTarifas(); }
                if (datos.log) { log = datos.log; localStorage.setItem(LOG_KEY, JSON.stringify(log)); }
                actualizarTodo();
                agregarLog('Importación de datos', 'Se restauraron datos desde archivo');
                alert('Datos importados correctamente.');
            } catch (err) { alert('Error al importar: archivo inválido.'); }
        };
        reader.readAsText(file);
    }

    exportarDatosBtn.addEventListener('click', exportarDatos);
    importarDatosBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', function(e) { if (this.files.length > 0) importarDatos(this.files[0]); });

    // ---- INICIALIZACIÓN ----
    function initUserId() {
        let stored = localStorage.getItem(USER_ID_KEY);
        if (!stored) {
            stored = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(USER_ID_KEY, stored);
        }
        userId = stored;
    }
    function initLog() {
        const saved = localStorage.getItem(LOG_KEY);
        if (saved) { try { log = JSON.parse(saved); } catch(e) { log = []; } }
    }
    function initTarifas() {
        const saved = localStorage.getItem(TARIFAS_KEY);
        if (saved) { try { tarifasEspeciales = JSON.parse(saved); } catch(e) { tarifasEspeciales = []; } }
    }
    function saveTarifas() {
        localStorage.setItem(TARIFAS_KEY, JSON.stringify(tarifasEspeciales));
    }

    // ---- CONTRASEÑA ----
    function getStoredPassword() {
        let pwd = localStorage.getItem(PASSWORD_KEY);
        if (!pwd) { localStorage.setItem(PASSWORD_KEY, DEFAULT_PASSWORD); pwd = DEFAULT_PASSWORD; }
        return pwd;
    }
    function setStoredPassword(pwd) {
        localStorage.setItem(PASSWORD_KEY, pwd);
        agregarLog('Cambio de contraseña', 'Se actualizó la contraseña de administrador');
    }
    function checkPassword(pwd) {
        return pwd.trim() === getStoredPassword();
    }

    // ---- AUTENTICACIÓN ----
    togglePwd.addEventListener('click', function() {
        const type = authPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        authPassword.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });

    function mostrarModal() {
        authPassword.value = '';
        authError.style.display = 'none';
        authModal.classList.add('active');
        authPassword.focus();
    }

    function ocultarModal() {
        authModal.classList.remove('active');
    }

    adminToggle.addEventListener('click', function() {
        if (isAdminMode) {
            isAdminMode = false;
            adminPanel.classList.remove('visible');
            this.classList.remove('active');
            this.textContent = '⚙️ Admin';
            actualizarTodo();
            agregarLog('Cierre de sesión admin', 'El administrador salió del panel');
            return;
        }
        mostrarModal();
    });

    authConfirm.addEventListener('click', function() {
        if (checkPassword(authPassword.value)) {
            isAdminMode = true;
            adminPanel.classList.add('visible');
            adminToggle.classList.add('active');
            adminToggle.textContent = '🔒 Ocultar Admin';
            ocultarModal();
            actualizarTodo();
            agregarLog('Inicio de sesión admin', 'Acceso concedido al panel de administración');
        } else {
            authError.style.display = 'block';
            authPassword.value = '';
            authPassword.focus();
        }
    });

    authCancel.addEventListener('click', ocultarModal);
    authPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') authConfirm.click(); });

    cambiarPasswordBtn.addEventListener('click', function() {
        const newPwd = nuevaPassword.value.trim();
        if (newPwd === '') { alert('Ingresa una nueva contraseña.'); return; }
        setStoredPassword(newPwd);
        passwordMsg.style.display = 'inline';
        setTimeout(() => passwordMsg.style.display = 'none', 3000);
        nuevaPassword.value = '';
        alert('Contraseña actualizada correctamente.');
    });

    // ---- CARGA DE DATOS ----
    function loadData() {
        const savedHorarios = localStorage.getItem('morphyy_horarios_avanzado');
        if (savedHorarios) {
            try { horarios = JSON.parse(savedHorarios); } catch(e) { horarios = []; }
        }
        if (horarios.length === 0) {
            horarios = [
                { dia: 'Lunes', inicio: '09:00', fin: '10:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '10:00', fin: '11:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '11:00', fin: '12:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '12:00', fin: '13:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '13:00', fin: '14:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '14:00', fin: '15:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Lunes', inicio: '15:00', fin: '16:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Martes', inicio: '09:00', fin: '10:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '10:00', fin: '11:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '11:00', fin: '12:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '12:00', fin: '13:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '13:00', fin: '14:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '14:00', fin: '15:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Martes', inicio: '15:00', fin: '16:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Miércoles', inicio: '09:00', fin: '10:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '10:00', fin: '11:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '11:00', fin: '12:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '12:00', fin: '13:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '13:00', fin: '14:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '14:00', fin: '15:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Miércoles', inicio: '15:00', fin: '16:00', estado: 'ocupado', escuela: 'ITSOEH', alumnos: 20 },
                { dia: 'Jueves', inicio: '09:00', fin: '10:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '10:00', fin: '11:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '11:00', fin: '12:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '12:00', fin: '13:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '13:00', fin: '14:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '14:00', fin: '15:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Jueves', inicio: '15:00', fin: '16:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '09:00', fin: '10:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '10:00', fin: '11:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '11:00', fin: '12:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '12:00', fin: '13:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '13:00', fin: '14:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '14:00', fin: '15:00', estado: 'disponible', escuela: '', alumnos: 0 },
                { dia: 'Viernes', inicio: '15:00', fin: '16:00', estado: 'disponible', escuela: '', alumnos: 0 },
            ];
            localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
        }

        const savedSolicitudes = localStorage.getItem('morphyy_solicitudes');
        if (savedSolicitudes) {
            try { solicitudes = JSON.parse(savedSolicitudes); } catch(e) { solicitudes = []; }
        }
        solicitudes.forEach(s => {
            if (s.horarioIndex !== undefined && !s.horariosSeleccionados) {
                s.horariosSeleccionados = [s.horarioIndex];
                delete s.horarioIndex;
            }
        });
    }

    function saveSolicitudes() {
        localStorage.setItem('morphyy_solicitudes', JSON.stringify(solicitudes));
    }

    // ---- CÁLCULO ----
    function calcular(n) {
        n = Math.min(30, Math.max(1, n));
        if (n < 15) return { total: 350, porAlumno: n > 0 ? 350 / n : 0, rango: 'Menos de 15 alumnos', detalle: 'Tarifa fija (1 o 2 hrs)', tarifaDesc: 'Menos de 15 → $350.00 fijos' };
        if (n <= 20) return { total: n * 25, porAlumno: 25, rango: '15 – 20 alumnos', detalle: '$25.00 por alumno', tarifaDesc: '15 a 20 → $25.00 c/u' };
        return { total: 500, porAlumno: 500 / n, rango: '21 – 30 alumnos', detalle: 'Precio cerrado por grupo', tarifaDesc: '21 a 30 → $500.00 total' };
    }

    // ---- GENERAR CONTENIDO PDF (con condiciones detalladas) ----
    function generarContenidoPDF(escuela, dirigido, horariosSeleccionados, alumnos, comentario) {
        const totalHoras = horariosSeleccionados.length;
        let costoTotal = 0;
        horariosSeleccionados.forEach(idx => {
            if (horarios[idx]) {
                costoTotal += calcular(alumnos).total;
            }
        });
        const resBase = calcular(alumnos);
        const fechaStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        let infoAdicional = '';
        if (escuela) infoAdicional += `<p><strong>Escuela:</strong> ${escuela}</p>`;
        if (dirigido) infoAdicional += `<p><strong>Dirigido a:</strong> ${dirigido}</p>`;
        if (comentario) infoAdicional += `<p><strong>Comentario:</strong> ${comentario}</p>`;

        let horariosHTML = '';
        horariosSeleccionados.forEach(idx => {
            const h = horarios[idx];
            if (h) horariosHTML += `<p><strong>Día:</strong> ${h.dia} · <strong>Horario:</strong> ${h.inicio} a ${h.fin} hrs.</p>`;
        });

        return `
            <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; max-width: 800px; margin: 0 auto; background: white; color: #1a2a3a; line-height: 1.6;">
                <div style="display: flex; align-items: center; gap: 1.2rem; border-bottom: 3px double #1a2b3c; padding-bottom: 0.8rem; margin-bottom: 1.5rem;">
                    <span style="font-size: 3.5rem;">♟️</span>
                    <div>
                        <h1 style="font-size: 2.2rem; margin: 0; letter-spacing: 1px; color: #0f1e2f;">CLUB MORPHYY</h1>
                        <p style="margin: 0; color: #3d506b; font-size: 1.1rem;">Clases de Ajedrez · Tarifas 2026</p>
                    </div>
                </div>
                <div style="text-align: right; font-size: 0.95rem; color: #3d506b; margin-bottom: 1.8rem;"><strong>Fecha de cotización:</strong> ${fechaStr}</div>
                ${infoAdicional ? `<div style="margin-bottom: 1.5rem; background: #f8faff; padding: 0.8rem 1.2rem; border-radius: 8px;">${infoAdicional}</div>` : ''}
                <h2 style="font-size: 1.3rem; color: #0f1e2f; border-bottom: 1px solid #d0d9e6; padding-bottom: 0.3rem; margin-bottom: 1rem;">1. Horarios propuestos</h2>
                ${horariosHTML}
                <h2 style="font-size: 1.3rem; color: #0f1e2f; border-bottom: 1px solid #d0d9e6; padding-bottom: 0.3rem; margin-top: 1.8rem; margin-bottom: 1rem;">2. Tabla de tarifas</h2>
                <p><strong>Número de alumnos considerados:</strong> ${alumnos}</p>
                <p><strong>Total de clases:</strong> ${totalHoras}</p>
                <table style="width:100%; border-collapse:collapse; margin:1rem 0;">
                    <thead><tr style="background:#eef3fa;"><th style="padding:0.5rem; border:1px solid #ccc;">Rango</th><th style="padding:0.5rem; border:1px solid #ccc;">Costo por clase</th><th style="padding:0.5rem; border:1px solid #ccc;">Costo total (${totalHoras} clase(s))</th></tr></thead>
                    <tbody>
                        <tr><td style="padding:0.5rem; border:1px solid #ccc;">Menos de 15</td><td style="padding:0.5rem; border:1px solid #ccc;">$350.00</td><td style="padding:0.5rem; border:1px solid #ccc;">$${(350 * totalHoras).toFixed(2)}</td></tr>
                        <tr><td style="padding:0.5rem; border:1px solid #ccc;">15 a 20</td><td style="padding:0.5rem; border:1px solid #ccc;">$${resBase.total.toFixed(2)}</td><td style="padding:0.5rem; border:1px solid #ccc;">$${costoTotal.toFixed(2)}</td></tr>
                        <tr><td style="padding:0.5rem; border:1px solid #ccc;">21 a 30</td><td style="padding:0.5rem; border:1px solid #ccc;">$500.00</td><td style="padding:0.5rem; border:1px solid #ccc;">$${(500 * totalHoras).toFixed(2)}</td></tr>
                    </tbody>
                </table>
                <div style="background: #f4f8fe; padding: 1rem 1.2rem; border-left: 5px solid #1a2b3c; margin: 1.2rem 0;">
                    <strong>✓ Tarifa aplicada:</strong> ${resBase.tarifaDesc}<br>
                    <span>Costo total: <strong>$${costoTotal.toFixed(2)} MXN</strong> · Costo por alumno: <strong>$${(costoTotal / alumnos).toFixed(2)} MXN</strong></span>
                </div>
                <h2 style="font-size: 1.3rem; color: #0f1e2f; border-bottom: 1px solid #d0d9e6; padding-bottom: 0.3rem; margin-top: 1.8rem;">3. Condiciones generales</h2>
                <p style="margin: 0.8rem 0;">Estimados,</p>
                <p style="margin: 0 0 1rem;">Si el horario propuesto les resulta adecuado, les comunico los costos de la clase:</p>
                <ul style="list-style: none; padding: 0; margin-bottom: 1rem;">
                    <li style="padding: 0.4rem 0; border-bottom: 1px dashed #e2eaf5;"><strong>De 15 a 20 alumnos:</strong> $25.00 por alumno (equivalente a un total de $375.00 a $500.00).</li>
                    <li style="padding: 0.4rem 0; border-bottom: 1px dashed #e2eaf5;"><strong>De 21 a 30 alumnos:</strong> $500.00 total por grupo (costo por alumno desde $23.80 para 21 hasta $16.60 para 30). Mientras más alumnos, menor costo por persona.</li>
                    <li style="padding: 0.4rem 0;"><strong>Menos de 15 alumnos:</strong> $350.00 fijos, aplicable para una o dos horas de clase.</li>
                </ul>
                <p style="margin: 1rem 0;">Es importante señalar que, en caso de formar dos grupos en horarios distintos (por ejemplo, uno de 14:00 a 15:00 y otro de 15:00 a 16:00), <strong>cada grupo pagará su propia tarifa</strong> conforme a las mismas condiciones. No se suman los alumnos de ambos grupos para acceder a descuentos, ya que éstos aplican por grupo de manera independiente.</p>
                <p style="margin: 1rem 0;"><strong>Sobre la política de pago y ajustes:</strong></p>
                <p style="margin: 0.5rem 0;">El costo se definirá al inicio de cada periodo (por ejemplo, por mes) con base en el número de alumnos inscritos formalmente. Dicho monto se mantendrá fijo durante ese periodo, independientemente de inasistencias puntuales.</p>
                <p style="margin: 0.5rem 0;">No obstante, si durante el curso se producen <strong>bajas definitivas</strong> que reduzcan el grupo a un tramo inferior (por ejemplo, de 21-30 a 15-20, o de 15-20 a menos de 15), el precio se ajustará a la tarifa correspondiente a partir de la siguiente clase, para beneficiar a ambas partes. Así, no se paga de más por alumnos que ya no están, y el profesor puede planificar sus ingresos sin cambios repentinos.</p>
                <p style="margin: 1rem 0 0.5rem;">Le agradeceré me confirme el número aproximado de participantes para definir el monto final.</p>
                <p style="margin: 0.5rem 0;">Quedo atento a su respuesta.</p>
                <p style="margin: 0.5rem 0;">Saludos cordiales.</p>
                <div style="margin-top: 2.5rem; padding-top: 1rem; border-top: 2px solid #d0d9e6; text-align: center; color: #3d506b;">
                    <p><strong>Contacto:</strong> German Hernández Cornejo · clubmorphy369@gmail.com · 7731856476</p>
                    <p style="font-size: 0.8rem; color: #6a7b96;">Vigencia: 15 días naturales.</p>
                </div>
            </div>
        `;
    }

    // ---- RENDER HORARIOS ADMIN ----
    function renderHorariosAdmin() {
        horariosListAdmin.innerHTML = '';
        horarios.forEach((h, index) => {
            const div = document.createElement('div');
            div.className = 'horario-item';
            div.setAttribute('data-index', index);
            div.innerHTML = `
                <span class="drag-handle" draggable="true" title="Arrastrar para reordenar">☰</span>
                <button class="btn-mover" data-dir="up" data-index="${index}" title="Subir">↑</button>
                <button class="btn-mover" data-dir="down" data-index="${index}" title="Bajar">↓</button>
                <select class="edit-dia" data-index="${index}">
                    ${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => `<option value="${d}" ${h.dia===d?'selected':''}>${d}</option>`).join('')}
                </select>
                <input type="time" class="edit-inicio" data-index="${index}" value="${h.inicio}" />
                <span>a</span>
                <input type="time" class="edit-fin" data-index="${index}" value="${h.fin}" />
                <select class="estado-select" data-index="${index}">
                    <option value="disponible" ${h.estado==='disponible'?'selected':''}>✅ Disponible</option>
                    <option value="ocupado" ${h.estado==='ocupado'?'selected':''}>❌ Ocupado</option>
                </select>
                <input type="text" class="escuela-input" data-index="${index}" placeholder="Escuela (si ocupado)" value="${h.escuela || ''}" />
                <input type="number" class="alumnos-input" data-index="${index}" placeholder="Alumnos" value="${h.alumnos || 0}" min="0" max="30" />
                <button class="btn-eliminar" data-index="${index}" title="Eliminar">✕</button>
            `;
            horariosListAdmin.appendChild(div);

            const selDia = div.querySelector('.edit-dia');
            const inpInicio = div.querySelector('.edit-inicio');
            const inpFin = div.querySelector('.edit-fin');
            const selEstado = div.querySelector('.estado-select');
            const inpEscuela = div.querySelector('.escuela-input');
            const inpAlumnos = div.querySelector('.alumnos-input');
            const btnEliminar = div.querySelector('.btn-eliminar');
            const dragHandle = div.querySelector('.drag-handle');
            const btnsMover = div.querySelectorAll('.btn-mover');

            const actualizar = () => {
                horarios[index].dia = selDia.value;
                horarios[index].inicio = inpInicio.value;
                horarios[index].fin = inpFin.value;
                horarios[index].estado = selEstado.value;
                horarios[index].escuela = inpEscuela.value;
                horarios[index].alumnos = parseInt(inpAlumnos.value) || 0;
                localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
                renderHorariosTabla();
                renderHorariosDisponiblesCheckboxes();
                renderCalendarioSemanal();
                calcularIngresos();
                agregarLog('Edición de horario', `Se modificó el horario ${horarios[index].dia} ${horarios[index].inicio}-${horarios[index].fin}`);
            };

            selDia.addEventListener('change', actualizar);
            inpInicio.addEventListener('change', actualizar);
            inpFin.addEventListener('change', actualizar);
            selEstado.addEventListener('change', actualizar);
            inpEscuela.addEventListener('input', actualizar);
            inpAlumnos.addEventListener('input', actualizar);

            btnEliminar.addEventListener('click', function() {
                const eliminado = horarios.splice(index, 1)[0];
                localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
                actualizarTodo();
                agregarLog('Eliminación de horario', `Se eliminó ${eliminado.dia} ${eliminado.inicio}-${eliminado.fin}`);
            });

            btnsMover.forEach(btn => {
                btn.addEventListener('click', function() {
                    const dir = this.dataset.dir;
                    const idx = parseInt(this.dataset.index);
                    const newIndex = dir === 'up' ? idx - 1 : idx + 1;
                    if (newIndex < 0 || newIndex >= horarios.length) return;
                    [horarios[idx], horarios[newIndex]] = [horarios[newIndex], horarios[idx]];
                    localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
                    actualizarTodo();
                    agregarLog('Reordenamiento de horarios', 'Se cambió el orden de los horarios');
                });
            });

            dragHandle.addEventListener('dragstart', function(e) {
                draggedIndex = index;
                div.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
            });
            dragHandle.addEventListener('dragend', function(e) {
                div.classList.remove('dragging');
                document.querySelectorAll('.horario-item').forEach(el => el.classList.remove('drag-over'));
                draggedIndex = null;
            });
            div.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                div.classList.add('drag-over');
            });
            div.addEventListener('dragleave', function(e) {
                div.classList.remove('drag-over');
            });
            div.addEventListener('drop', function(e) {
                e.preventDefault();
                div.classList.remove('drag-over');
                const fromIndex = draggedIndex;
                const toIndex = index;
                if (fromIndex === null || fromIndex === toIndex) return;
                const movedItem = horarios.splice(fromIndex, 1)[0];
                horarios.splice(toIndex, 0, movedItem);
                localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
                actualizarTodo();
                agregarLog('Reordenamiento de horarios', 'Se cambió el orden mediante arrastre');
            });
        });
    }

    // ---- RENDER TABLA HORARIOS ----
    function renderHorariosTabla() {
        if (horarios.length === 0) {
            horariosTablaContainer.innerHTML = '<p class="text-muted">No hay horarios registrados.</p>';
            return;
        }
        let html = `<table><thead><tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>`;
        horarios.forEach(h => {
            const isDisponible = h.estado === 'disponible';
            const rowClass = isDisponible ? 'disponible' : 'ocupado';
            const badgeClass = isDisponible ? 'badge-disponible' : 'badge-ocupado';
            const estadoTexto = isDisponible ? 'Disponible' : 'Ocupado';
            const detalle = isDisponible ? '—' : (h.escuela || 'Ocupado');
            html += `<tr class="${rowClass}"><td><strong>${h.dia}</strong></td><td>${h.inicio}</td><td>${h.fin}</td><td><span class="badge-estado ${badgeClass}">${estadoTexto}</span></td><td>${detalle}</td></tr>`;
        });
        html += '</tbody></table>';
        horariosTablaContainer.innerHTML = html;
    }

    // ---- CHECKBOXES HORARIOS DISPONIBLES (usuario) ----
    function renderHorariosDisponiblesCheckboxes() {
        horariosDisponiblesCheckboxes.innerHTML = '';
        const disponibles = horarios.filter(h => h.estado === 'disponible');
        if (disponibles.length === 0) {
            document.getElementById('noHorariosDisponibles').style.display = 'block';
            return;
        }
        document.getElementById('noHorariosDisponibles').style.display = 'none';
        disponibles.forEach(h => {
            const realIndex = horarios.indexOf(h);
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${realIndex}" /> ${h.dia} ${h.inicio} - ${h.fin}`;
            horariosDisponiblesCheckboxes.appendChild(label);
        });
    }

    // ---- CHECKBOXES HORARIOS DISPONIBLES (manual admin) ----
    function renderManualHorariosDisponibles() {
        manualHorariosDisponibles.innerHTML = '';
        const disponibles = horarios.filter(h => h.estado === 'disponible');
        if (disponibles.length === 0) {
            manualNoHorariosDisponibles.style.display = 'block';
            return;
        }
        manualNoHorariosDisponibles.style.display = 'none';
        disponibles.forEach(h => {
            const realIndex = horarios.indexOf(h);
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${realIndex}" /> ${h.dia} ${h.inicio} - ${h.fin}`;
            manualHorariosDisponibles.appendChild(label);
        });
    }

    // ---- CALENDARIO SEMANAL DINÁMICO ----
    function renderCalendarioSemanal() {
        if (horarios.length === 0) {
            calendarioSemanalContainer.innerHTML = '<p class="text-muted">No hay horarios registrados.</p>';
            return;
        }
        const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const diasUnicos = ordenDias.filter(dia => horarios.some(h => h.dia === dia));
        if (diasUnicos.length === 0) {
            calendarioSemanalContainer.innerHTML = '<p class="text-muted">No hay horarios registrados.</p>';
            return;
        }
        const horasSet = new Set();
        horarios.forEach(h => {
            horasSet.add(h.inicio);
            horasSet.add(h.fin);
        });
        const horasOrdenadas = Array.from(horasSet).sort((a, b) => a.localeCompare(b));
        if (horasOrdenadas.length === 0) {
            calendarioSemanalContainer.innerHTML = '<p class="text-muted">No hay horarios registrados.</p>';
            return;
        }
        let html = '<table><thead><tr><th>Hora</th>';
        diasUnicos.forEach(dia => { html += `<th>${dia}</th>`; });
        html += '</tr></thead><tbody>';
        for (let i = 0; i < horasOrdenadas.length; i++) {
            const horaInicio = horasOrdenadas[i];
            html += `<tr><td class="hora-columna">${horaInicio}</td>`;
            diasUnicos.forEach(dia => {
                const horario = horarios.find(h => h.dia === dia && h.inicio === horaInicio);
                let clase = 'celda-fuera';
                let titulo = '';
                let contenido = '';
                if (horario) {
                    if (horario.estado === 'disponible') {
                        clase = 'celda-disponible';
                        titulo = `Disponible ${horario.inicio}-${horario.fin}`;
                        contenido = 'Disponible';
                    } else {
                        clase = 'celda-ocupado';
                        titulo = `Ocupado ${horario.inicio}-${horario.fin} (${horario.escuela || 'Ocupado'})`;
                        contenido = horario.escuela || 'Ocupado';
                    }
                } else {
                    const horarioAnterior = horarios.find(h => h.dia === dia && h.inicio <= horaInicio && h.fin > horaInicio);
                    if (horarioAnterior && horarioAnterior.estado === 'ocupado') {
                        clase = 'celda-ocupado';
                        titulo = `Ocupado ${horarioAnterior.inicio}-${horarioAnterior.fin} (${horarioAnterior.escuela || 'Ocupado'})`;
                        contenido = horarioAnterior.escuela || 'Ocupado';
                    }
                }
                html += `<td class="${clase}" title="${titulo}">${contenido}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';
        calendarioSemanalContainer.innerHTML = html;
    }

    // ---- SOLICITUDES PENDIENTES (ADMIN) ----
    function renderSolicitudesPendientes() {
        const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
        if (pendientes.length === 0) {
            solicitudesPendientes.innerHTML = '<p class="text-muted">No hay solicitudes pendientes.</p>';
            return;
        }
        let html = '';
        pendientes.forEach(s => {
            const fechaSolicitud = new Date(s.fecha);
            const diasPendiente = Math.floor((Date.now() - fechaSolicitud) / (1000 * 60 * 60 * 24));
            const vencida = diasPendiente >= VENCIMIENTO_DIAS;
            const horariosSeleccionados = s.horariosSeleccionados || [];
            let horariosTexto = '';
            horariosSeleccionados.forEach(idx => {
                const h = horarios[idx];
                if (h) horariosTexto += `${h.dia} ${h.inicio}-${h.fin}<br>`;
            });
            html += `
                <div class="solicitud-item ${vencida ? 'vencida' : ''}" data-id="${s.id}">
                    <div class="info">
                        <p><strong>${s.escuela}</strong> · Dirigido a: ${s.dirigido}</p>
                        <p>Horarios: ${horariosTexto} · Alumnos: ${s.alumnos}</p>
                        <p style="font-size:0.8rem; color:#7a8fa3;">Solicitado el: ${s.fecha} (hace ${diasPendiente} días)</p>
                        ${s.comentario ? `<p class="comentario">💬 ${s.comentario}</p>` : ''}
                        ${vencida ? '<p style="color:#e53935; font-weight:600;">⚠️ Vencida</p>' : ''}
                    </div>
                    <div class="acciones">
                        <button class="btn-aprobar" data-id="${s.id}">✅ Aprobar</button>
                        <button class="btn-rechazar" data-id="${s.id}">❌ Rechazar</button>
                    </div>
                </div>
            `;
        });
        solicitudesPendientes.innerHTML = html;

        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', function() { aprobarSolicitud(this.dataset.id); });
        });
        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', function() { rechazarSolicitud(this.dataset.id); });
        });
    }

    // ---- HISTORIAL DE SOLICITUDES PROCESADAS (ADMIN) ----
    function renderHistorialSolicitudes() {
        const procesadas = solicitudes.filter(s => s.estado !== 'pendiente');
        if (procesadas.length === 0) {
            historialSolicitudes.innerHTML = '<p class="text-muted">No hay solicitudes procesadas.</p>';
            return;
        }
        let html = '';
        procesadas.forEach(s => {
            const estadoTexto = s.estado === 'aprobada' ? '✅ Aprobada' : '❌ Rechazada';
            const horariosSeleccionados = s.horariosSeleccionados || [];
            let horariosTexto = '';
            horariosSeleccionados.forEach(idx => {
                const h = horarios[idx];
                if (h) horariosTexto += `${h.dia} ${h.inicio}-${h.fin}<br>`;
            });
            html += `
                <div class="solicitud-item" data-id="${s.id}">
                    <div class="info">
                        <p><strong>${s.escuela}</strong> · ${s.dirigido}</p>
                        <p>Horarios: ${horariosTexto} · Alumnos: ${s.alumnos}</p>
                        <p style="font-size:0.8rem;">${estadoTexto}</p>
                        ${s.comentario ? `<p class="comentario">💬 ${s.comentario}</p>` : ''}
                    </div>
                    <div class="acciones">
                        ${s.estado === 'aprobada' ? `<button class="btn-descargar-pdf" data-id="${s.id}">📄 PDF</button>` : ''}
                        <button class="btn-eliminar-solicitud" data-id="${s.id}">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        });
        historialSolicitudes.innerHTML = html;

        document.querySelectorAll('.btn-descargar-pdf').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const solicitud = solicitudes.find(s => s.id == id);
                if (solicitud && solicitud.estado === 'aprobada') generarPDFDesdeSolicitud(solicitud);
            });
        });
        document.querySelectorAll('.btn-eliminar-solicitud').forEach(btn => {
            btn.addEventListener('click', function() {
                eliminarSolicitud(this.dataset.id);
            });
        });
    }

    // ---- TARIFAS ESPECIALES ----
    function renderTarifasEspeciales() {
        tarifasEspecialesContainer.innerHTML = '';
        if (tarifasEspeciales.length === 0) {
            tarifasEspecialesContainer.innerHTML = '<p class="text-muted">No hay tarifas especiales definidas.</p>';
            return;
        }
        let html = '';
        tarifasEspeciales.forEach((tarifa, idx) => {
            const tipo = tarifa.tipo === 'por_alumno' ? 'por_alumno' : 'semanal';
            const valor = tipo === 'semanal' ? (tarifa.pagoSemanal || 0) : (tarifa.costoPorAlumno || 0);
            html += `
                <div class="tarifa-item">
                    <input type="text" value="${tarifa.escuela}" placeholder="Escuela" class="tarifa-escuela" data-index="${idx}" />
                    <select class="tarifa-tipo" data-index="${idx}">
                        <option value="semanal" ${tipo === 'semanal' ? 'selected' : ''}>Pago semanal fijo</option>
                        <option value="por_alumno" ${tipo === 'por_alumno' ? 'selected' : ''}>Pago por alumno</option>
                    </select>
                    <input type="number" value="${valor}" placeholder="${tipo === 'semanal' ? 'Monto semanal' : 'Costo por alumno (por clase)'}" class="tarifa-monto" data-index="${idx}" min="0" step="0.01" />
                    <button class="btn-eliminar-tarifa" data-index="${idx}">✕</button>
                </div>
            `;
        });
        tarifasEspecialesContainer.innerHTML = html;

        tarifasEspecialesContainer.querySelectorAll('.tarifa-escuela').forEach(input => {
            input.addEventListener('change', function() {
                tarifasEspeciales[this.dataset.index].escuela = this.value;
                saveTarifas(); calcularIngresos();
            });
        });
        tarifasEspecialesContainer.querySelectorAll('.tarifa-tipo').forEach(select => {
            select.addEventListener('change', function() {
                const idx = this.dataset.index;
                const nuevoTipo = this.value;
                if (nuevoTipo === 'semanal') {
                    tarifasEspeciales[idx].tipo = 'semanal';
                    tarifasEspeciales[idx].pagoSemanal = tarifasEspeciales[idx].costoPorAlumno || 0;
                    delete tarifasEspeciales[idx].costoPorAlumno;
                } else {
                    tarifasEspeciales[idx].tipo = 'por_alumno';
                    tarifasEspeciales[idx].costoPorAlumno = tarifasEspeciales[idx].pagoSemanal || 0;
                    delete tarifasEspeciales[idx].pagoSemanal;
                }
                saveTarifas(); renderTarifasEspeciales(); calcularIngresos();
            });
        });
        tarifasEspecialesContainer.querySelectorAll('.tarifa-monto').forEach(input => {
            input.addEventListener('change', function() {
                const idx = this.dataset.index;
                if (tarifasEspeciales[idx].tipo === 'semanal') {
                    tarifasEspeciales[idx].pagoSemanal = parseFloat(this.value) || 0;
                } else {
                    tarifasEspeciales[idx].costoPorAlumno = parseFloat(this.value) || 0;
                }
                saveTarifas(); calcularIngresos();
            });
        });
        tarifasEspecialesContainer.querySelectorAll('.btn-eliminar-tarifa').forEach(btn => {
            btn.addEventListener('click', function() {
                tarifasEspeciales.splice(this.dataset.index, 1);
                saveTarifas(); renderTarifasEspeciales(); calcularIngresos();
            });
        });
    }

    // ---- CALCULAR INGRESOS ----
    function calcularIngresos() {
        let totalSemanal = 0;
        let detalleHTML = '';
        const escuelasConPagoSemanal = {};

        tarifasEspeciales.forEach(t => {
            if (t.tipo === 'semanal' && t.escuela) {
                escuelasConPagoSemanal[t.escuela] = t.pagoSemanal || 0;
            }
        });
        for (const escuela in escuelasConPagoSemanal) {
            totalSemanal += escuelasConPagoSemanal[escuela];
            detalleHTML += `<div class="ingreso-fila"><span>${escuela} (pago semanal fijo)</span><span>$${escuelasConPagoSemanal[escuela].toFixed(2)}</span></div>`;
        }

        const ocupados = horarios.filter(h => h.estado === 'ocupado');
        ocupados.forEach(h => {
            const escuela = h.escuela || 'Sin escuela';
            if (escuelasConPagoSemanal[escuela] !== undefined) return;
            const alumnos = h.alumnos || 15;
            const tarifaEspecial = tarifasEspeciales.find(t => t.escuela.toLowerCase() === escuela.toLowerCase() && t.tipo === 'por_alumno');
            let ingreso = tarifaEspecial ? alumnos * (tarifaEspecial.costoPorAlumno || 0) : calcular(alumnos).total;
            totalSemanal += ingreso;
            detalleHTML += `<div class="ingreso-fila"><span>${h.dia} ${h.inicio}-${h.fin} (${escuela})</span><span>${alumnos} alumnos × $${(ingreso / alumnos).toFixed(2)} = $${ingreso.toFixed(2)}</span></div>`;
        });

        if (totalSemanal === 0) {
            ingresosDetalle.innerHTML = '<p class="text-muted">No hay ingresos registrados.</p>';
            ingresosSemanalTotal.textContent = '$0.00';
            ingresosQuincenalTotal.textContent = '$0.00';
            if (chartEscuelas) chartEscuelas.destroy();
            if (chartDias) chartDias.destroy();
            return;
        }

        ingresosSemanalTotal.textContent = `$${totalSemanal.toFixed(2)}`;
        ingresosQuincenalTotal.textContent = `$${(totalSemanal * 2).toFixed(2)}`;
        ingresosDetalle.innerHTML = detalleHTML;
        actualizarGraficos();
    }

    function actualizarGraficos() {
        const ingresosPorEscuela = {};
        tarifasEspeciales.forEach(t => {
            if (t.tipo === 'semanal' && t.escuela) ingresosPorEscuela[t.escuela] = t.pagoSemanal || 0;
        });
        horarios.forEach(h => {
            if (h.estado === 'ocupado' && h.escuela) {
                if (ingresosPorEscuela[h.escuela] !== undefined) return;
                const alumnos = h.alumnos || 15;
                const tarifa = tarifasEspeciales.find(t => t.escuela.toLowerCase() === h.escuela.toLowerCase() && t.tipo === 'por_alumno');
                const ingreso = tarifa ? alumnos * (tarifa.costoPorAlumno || 0) : calcular(alumnos).total;
                ingresosPorEscuela[h.escuela] = (ingresosPorEscuela[h.escuela] || 0) + ingreso;
            }
        });

        const labelsEscuelas = Object.keys(ingresosPorEscuela);
        const valoresEscuelas = labelsEscuelas.map(e => ingresosPorEscuela[e]);

        if (chartEscuelas) chartEscuelas.destroy();
        chartEscuelas = new Chart(graficoEscuelasCanvas, {
            type: 'bar',
            data: {
                labels: labelsEscuelas,
                datasets: [{
                    label: 'Ingresos semanales por escuela',
                    data: valoresEscuelas,
                    backgroundColor: 'rgba(201, 168, 76, 0.6)',
                    borderColor: '#c9a84c',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });

        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const ingresosPorDia = {};
        diasSemana.forEach(d => ingresosPorDia[d] = 0);
        horarios.forEach(h => {
            if (h.estado === 'ocupado') {
                const escuela = h.escuela;
                if (escuela && tarifasEspeciales.find(t => t.tipo === 'semanal' && t.escuela.toLowerCase() === escuela.toLowerCase())) {
                    return;
                }
                const alumnos = h.alumnos || 15;
                const tarifa = tarifasEspeciales.find(t => t.escuela.toLowerCase() === (escuela||'').toLowerCase() && t.tipo === 'por_alumno');
                let ingreso = tarifa ? alumnos * (tarifa.costoPorAlumno || 0) : calcular(alumnos).total;
                if (ingresosPorDia[h.dia] !== undefined) ingresosPorDia[h.dia] += ingreso;
            }
        });

        if (chartDias) chartDias.destroy();
        chartDias = new Chart(graficoDiasCanvas, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Ingresos por día',
                    data: diasSemana.map(d => ingresosPorDia[d]),
                    backgroundColor: 'rgba(26, 42, 58, 0.6)',
                    borderColor: '#1a2a3a',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }

    // ---- APROBAR / RECHAZAR / ELIMINAR ----
    function aprobarSolicitud(id) {
        const solicitud = solicitudes.find(s => s.id == id);
        if (!solicitud || solicitud.estado !== 'pendiente') return;
        (solicitud.horariosSeleccionados || []).forEach(idx => {
            if (horarios[idx]) {
                horarios[idx].estado = 'ocupado';
                horarios[idx].escuela = solicitud.escuela;
                horarios[idx].alumnos = solicitud.alumnos || 15;
            }
        });
        localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
        solicitud.estado = 'aprobada';
        saveSolicitudes();
        actualizarTodo();
        agregarLog('Solicitud aprobada', `${solicitud.escuela}`);
        alert('✅ Solicitud aprobada. Los horarios han sido marcados como ocupados.');
    }

    function rechazarSolicitud(id) {
        const solicitud = solicitudes.find(s => s.id == id);
        if (!solicitud || solicitud.estado !== 'pendiente') return;
        solicitud.estado = 'rechazada';
        saveSolicitudes();
        actualizarTodo();
        agregarLog('Solicitud rechazada', `${solicitud.escuela}`);
        alert('❌ Solicitud rechazada.');
    }

    function eliminarSolicitud(id) {
        if (!confirm('¿Eliminar esta solicitud permanentemente?')) return;
        const solicitud = solicitudes.find(s => s.id == id);
        solicitudes = solicitudes.filter(s => s.id != id);
        saveSolicitudes();
        actualizarTodo();
        if (solicitud) agregarLog('Eliminación de solicitud', `${solicitud.escuela}`);
    }

    function limpiarHistorial() {
        if (!confirm('¿Eliminar todas las solicitudes procesadas (aprobadas y rechazadas)?')) return;
        solicitudes = solicitudes.filter(s => s.estado === 'pendiente');
        saveSolicitudes();
        actualizarTodo();
        agregarLog('Limpieza de historial', 'Se eliminaron todas las solicitudes procesadas');
    }

    limpiarHistorialBtn.addEventListener('click', limpiarHistorial);

    // ---- MIS SOLICITUDES (USUARIO) ----
    function renderMisSolicitudes() {
        const misSolicitudes = solicitudes.filter(s => s.userId === userId);
        if (misSolicitudes.length === 0) {
            misSolicitudesContainer.innerHTML = '<p class="text-muted">No has enviado ninguna solicitud.</p>';
            return;
        }
        let html = '';
        misSolicitudes.forEach(s => {
            let estadoHTML = '';
            let acciones = '';
            let vencidaClass = '';
            if (s.estado === 'pendiente') {
                const diasPendiente = Math.floor((Date.now() - new Date(s.fecha)) / (1000 * 60 * 60 * 24));
                if (diasPendiente >= VENCIMIENTO_DIAS) vencidaClass = 'vencida';
                estadoHTML = '<span class="estado-pendiente">⏳ Pendiente</span>';
            } else if (s.estado === 'aprobada') {
                estadoHTML = '<span class="estado-aprobada">✅ Aprobada</span>';
                acciones = `<button class="btn-descargar-pdf" data-id="${s.id}">📄 Descargar PDF</button>`;
            } else if (s.estado === 'rechazada') {
                estadoHTML = '<span class="estado-rechazada">❌ Rechazada</span>';
            }
            const horariosSeleccionados = s.horariosSeleccionados || [];
            let horariosTexto = '';
            horariosSeleccionados.forEach(idx => {
                const h = horarios[idx];
                if (h) horariosTexto += `${h.dia} ${h.inicio}-${h.fin}<br>`;
            });
            html += `
                <div class="solicitud-usuario ${vencidaClass}" data-id="${s.id}">
                    <div class="info">
                        <p><strong>Escuela:</strong> ${s.escuela}</p>
                        <p><strong>Horarios:</strong> ${horariosTexto}</p>
                        <p>${estadoHTML}</p>
                        ${s.comentario ? `<p class="comentario">💬 ${s.comentario}</p>` : ''}
                    </div>
                    <div>${acciones}</div>
                </div>
            `;
        });
        misSolicitudesContainer.innerHTML = html;

        document.querySelectorAll('.btn-descargar-pdf').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const solicitud = solicitudes.find(s => s.id == id);
                if (solicitud && solicitud.estado === 'aprobada') generarPDFDesdeSolicitud(solicitud);
            });
        });
    }

    // ---- GENERAR PDF DESDE SOLICITUD ----
    function generarPDFDesdeSolicitud(solicitud) {
        // Usar contenido del preview si está en modo edición
        let contenido;
        if (previewEditable) {
            contenido = previewContainer.innerHTML;
        } else {
            contenido = generarContenidoPDF(solicitud.escuela, solicitud.dirigido, solicitud.horariosSeleccionados, solicitud.alumnos, solicitud.comentario);
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contenido;
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '0';
        tempDiv.style.left = '0';
        tempDiv.style.width = '100%';
        tempDiv.style.height = '100%';
        tempDiv.style.background = 'white';
        tempDiv.style.zIndex = '10000';
        tempDiv.style.overflow = 'auto';
        tempDiv.style.padding = '20px';
        tempDiv.style.opacity = '0';
        tempDiv.style.pointerEvents = 'none';
        document.body.appendChild(tempDiv);

        setTimeout(() => {
            const pdfContent = tempDiv.querySelector('div');
            if (!pdfContent) { alert('Error al generar el PDF.'); document.body.removeChild(tempDiv); return; }
            html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: pdfContent.scrollWidth,
                height: pdfContent.scrollHeight,
            }).then((canvas) => {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'letter');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('Cotizacion_Club_Morphyy.pdf');
                document.body.removeChild(tempDiv);
                agregarLog('Generación de PDF', `Para ${solicitud.escuela}`);
            }).catch((err) => {
                console.error(err);
                document.body.removeChild(tempDiv);
                alert('Error al generar el PDF: ' + err.message);
            });
        }, 400);
    }

    // ---- ACTUALIZAR TODO ----
    function actualizarTodo() {
        // Calculadora simple
        let n = parseInt(inputAlumnos.value, 10) || 15;
        if (n < 1) n = 1; if (n > 30) n = 30;
        inputAlumnos.value = n;
        const res = calcular(n);
        totalDisplay.textContent = `$${res.total.toFixed(2)}`;
        porAlumnoDisplay.innerHTML = `$${res.porAlumno.toFixed(2)} <small>c/u</small>`;
        rangoDisplay.textContent = res.rango;
        detalleDisplay.textContent = res.detalle;
        tarifaDescDisplay.textContent = res.tarifaDesc;

        renderHorariosTabla();
        renderCalendarioSemanal();
        renderHorariosDisponiblesCheckboxes();

        if (isAdminMode) {
            renderHorariosAdmin();
            renderSolicitudesPendientes();
            renderHistorialSolicitudes();
            renderTarifasEspeciales();
            calcularIngresos();
        }

        renderBitacora();
        renderMisSolicitudes();

        // Vista previa del PDF
        let ultimaAprobada = null;
        if (isAdminMode) {
            const aprobadas = solicitudes.filter(s => s.estado === 'aprobada');
            ultimaAprobada = aprobadas.length > 0 ? aprobadas[aprobadas.length - 1] : null;
        } else {
            const misAprobadas = solicitudes.filter(s => s.userId === userId && s.estado === 'aprobada');
            ultimaAprobada = misAprobadas.length > 0 ? misAprobadas[misAprobadas.length - 1] : null;
        }

        if (ultimaAprobada) {
            previewContainer.innerHTML = generarContenidoPDF(ultimaAprobada.escuela, ultimaAprobada.dirigido, ultimaAprobada.horariosSeleccionados, ultimaAprobada.alumnos, ultimaAprobada.comentario);
        } else {
            const defaultHorario = horarios.find(h => h.estado === 'disponible');
            if (defaultHorario) {
                const idx = horarios.indexOf(defaultHorario);
                previewContainer.innerHTML = generarContenidoPDF('', '', [idx], 15, '');
            } else {
                previewContainer.innerHTML = '<p class="text-muted">No hay horarios disponibles para previsualizar.</p>';
            }
        }

        // Configurar edición del preview si es admin
        if (isAdminMode && ultimaAprobada) {
            previewContainer.setAttribute('contenteditable', 'true');
            previewContainer.style.border = '2px dashed #c9a84c';
            previewContainer.style.padding = '10px';
            previewEditable = true;
        } else {
            previewContainer.removeAttribute('contenteditable');
            previewContainer.style.border = 'none';
            previewContainer.style.padding = '0';
            previewEditable = false;
        }
    }

    // ---- ENVIAR SOLICITUD (USUARIO) ----
    btnSolicitar.addEventListener('click', function() {
        const escuela = solicitudEscuela.value.trim();
        const dirigido = solicitudDirigido.value.trim();
        const alumnos = parseInt(solicitudAlumnos.value, 10);
        const comentario = solicitudComentario.value.trim();

        const checkboxes = horariosDisponiblesCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
        const horariosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (!escuela) { mensajeSolicitud.textContent = '⚠️ Escribe el nombre de la escuela.'; mensajeSolicitud.style.color = '#e74c3c'; return; }
        if (!dirigido) { mensajeSolicitud.textContent = '⚠️ Escribe a quién va dirigido.'; mensajeSolicitud.style.color = '#e74c3c'; return; }
        if (horariosSeleccionados.length === 0) {
            mensajeSolicitud.textContent = '⚠️ Selecciona al menos un horario disponible.';
            mensajeSolicitud.style.color = '#e74c3c';
            return;
        }
        if (isNaN(alumnos) || alumnos < 1 || alumnos > 30) {
            mensajeSolicitud.textContent = '⚠️ El número de alumnos debe estar entre 1 y 30.';
            mensajeSolicitud.style.color = '#e74c3c';
            return;
        }

        solicitudes.push({
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            userId: userId,
            escuela: escuela,
            dirigido: dirigido,
            horariosSeleccionados: horariosSeleccionados,
            alumnos: alumnos,
            estado: 'pendiente',
            fecha: new Date().toLocaleString('es-MX'),
            comentario: comentario
        });
        saveSolicitudes();

        mensajeSolicitud.textContent = '✅ Solicitud enviada. Espera aprobación.';
        mensajeSolicitud.style.color = '#27ae60';
        solicitudComentario.value = '';
        actualizarTodo();
        agregarLog('Nueva solicitud', `${escuela} - ${horariosSeleccionados.length} horario(s)`);
    });

    // ---- EVENTOS CALCULADORA ----
    inputAlumnos.addEventListener('input', function() {
        let val = parseInt(this.value, 10);
        if (!isNaN(val) && val > 30) this.value = 30;
        if (!isNaN(val) && val < 1) this.value = 1;
        actualizarTodo();
    });
    inputAlumnos.addEventListener('change', function() {
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) this.value = 1;
        if (val > 30) this.value = 30;
        actualizarTodo();
    });
    decrementBtn.addEventListener('click', function() {
        let val = parseInt(inputAlumnos.value, 10);
        if (isNaN(val) || val <= 1) return;
        inputAlumnos.value = val - 1;
        actualizarTodo();
    });
    incrementBtn.addEventListener('click', function() {
        let val = parseInt(inputAlumnos.value, 10);
        if (isNaN(val) || val >= 30) return;
        inputAlumnos.value = val + 1;
        actualizarTodo();
    });

    // ---- AGREGAR HORARIO ADMIN ----
    agregarHorarioAdmin.addEventListener('click', function() {
        horarios.push({ dia: 'Lunes', inicio: '09:00', fin: '10:00', estado: 'disponible', escuela: '', alumnos: 0 });
        localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));
        actualizarTodo();
        agregarLog('Nuevo horario', 'Se agregó un bloque de horario');
    });

    // ---- AGREGAR TARIFA ESPECIAL ----
    agregarTarifaBtn.addEventListener('click', function() {
        tarifasEspeciales.push({ escuela: '', tipo: 'semanal', pagoSemanal: 0 });
        saveTarifas();
        renderTarifasEspeciales();
        calcularIngresos();
        agregarLog('Nueva tarifa especial', '');
    });

    // ---- MODAL NUEVA SOLICITUD MANUAL ----
    btnNuevaSolicitudManual.addEventListener('click', function() {
        if (!isAdminMode) return;
        renderManualHorariosDisponibles();
        manualEscuela.value = '';
        manualDirigido.value = '';
        manualAlumnos.value = 15;
        manualComentario.value = '';
        modalSolicitudManual.classList.add('active');
    });

    manualCancelar.addEventListener('click', function() {
        modalSolicitudManual.classList.remove('active');
    });

    manualGuardar.addEventListener('click', function() {
        const escuela = manualEscuela.value.trim();
        const dirigido = manualDirigido.value.trim();
        const alumnos = parseInt(manualAlumnos.value, 10);
        const comentario = manualComentario.value.trim();

        const checkboxes = manualHorariosDisponibles.querySelectorAll('input[type="checkbox"]:checked');
        const horariosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (!escuela) { alert('Escribe el nombre de la escuela.'); return; }
        if (!dirigido) { alert('Escribe a quién va dirigido.'); return; }
        if (horariosSeleccionados.length === 0) { alert('Selecciona al menos un horario.'); return; }
        if (isNaN(alumnos) || alumnos < 1 || alumnos > 30) { alert('Número de alumnos inválido (1-30).'); return; }

        const nuevaSolicitud = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            userId: 'admin_manual',
            escuela: escuela,
            dirigido: dirigido,
            horariosSeleccionados: horariosSeleccionados,
            alumnos: alumnos,
            estado: 'aprobada',
            fecha: new Date().toLocaleString('es-MX'),
            comentario: comentario,
            manual: true
        };
        solicitudes.push(nuevaSolicitud);
        saveSolicitudes();

        horariosSeleccionados.forEach(idx => {
            if (horarios[idx]) {
                horarios[idx].estado = 'ocupado';
                horarios[idx].escuela = escuela;
                horarios[idx].alumnos = alumnos;
            }
        });
        localStorage.setItem('morphyy_horarios_avanzado', JSON.stringify(horarios));

        modalSolicitudManual.classList.remove('active');
        actualizarTodo();
        agregarLog('Nueva cotización manual', `${escuela} - ${horariosSeleccionados.length} horario(s)`);
        alert('Cotización creada exitosamente.');
    });

    // ---- INICIALIZACIÓN ----
    initUserId();
    initLog();
    initTarifas();
    getStoredPassword();
    loadData();
    actualizarTodo();

})();
