'use client'

import { useState, useEffect, useRef } from 'react'

export default function Page() {
  const [alumnos, setAlumnos] = useState<number>(15)
  const [total, setTotal] = useState<number>(375)
  const [porAlumno, setPorAlumno] = useState<number>(25)
  const [rango, setRango] = useState<string>('15 – 20 alumnos')
  const [detalle, setDetalle] = useState<string>('$25.00 por alumno')
  const [tarifaDesc, setTarifaDesc] = useState<string>('15 a 20 → $25.00 c/u')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false)

  const logoRef = useRef<HTMLImageElement>(null)

  const calcular = (n: number) => {
    n = Math.min(30, Math.max(1, n))
    let totalCalc, porAlumnoCalc, rangoCalc, detalleCalc, tarifaDescCalc

    if (n < 15) {
      totalCalc = 350
      porAlumnoCalc = n > 0 ? totalCalc / n : 0
      rangoCalc = 'Menos de 15 alumnos'
      detalleCalc = 'Tarifa fija (1 o 2 hrs)'
      tarifaDescCalc = 'Menos de 15 → $350.00 fijos'
    } else if (n >= 15 && n <= 20) {
      totalCalc = n * 25
      porAlumnoCalc = 25
      rangoCalc = '15 – 20 alumnos'
      detalleCalc = '$25.00 por alumno'
      tarifaDescCalc = '15 a 20 → $25.00 c/u'
    } else {
      totalCalc = 500
      porAlumnoCalc = totalCalc / n
      rangoCalc = '21 – 30 alumnos'
      detalleCalc = 'Precio cerrado por grupo'
      tarifaDescCalc = '21 a 30 → $500.00 total'
    }

    return { total: totalCalc, porAlumno: porAlumnoCalc, rango: rangoCalc, detalle: detalleCalc, tarifaDesc: tarifaDescCalc }
  }

  useEffect(() => {
    const res = calcular(alumnos)
    setTotal(res.total)
    setPorAlumno(res.porAlumno)
    setRango(res.rango)
    setDetalle(res.detalle)
    setTarifaDesc(res.tarifaDesc)
  }, [alumnos])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10)
    if (isNaN(val)) val = 1
    if (val > 30) val = 30
    if (val < 1) val = 1
    setAlumnos(val)
  }

  const increment = () => {
    if (alumnos < 30) setAlumnos(alumnos + 1)
  }

  const decrement = () => {
    if (alumnos > 1) setAlumnos(alumnos - 1)
  }

  const generarPDF = async () => {
    setIsGeneratingPDF(true)

    const res = calcular(alumnos)
    const logoSrc = logoRef.current?.src || '/logo.png'

    const hoy = new Date()
    const fechaStr = hoy.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const contenidoPDF = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cotización - Clases de Ajedrez</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 1.8cm 1.5cm;
          color: #1e2a3a;
          line-height: 1.6;
        }
        .header-pdf {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          border-bottom: 3px double #1a2b3c;
          padding-bottom: 0.8rem;
          margin-bottom: 1.8rem;
        }
        .header-pdf .logo-pdf {
          height: 65px;
          width: auto;
          flex-shrink: 0;
        }
        .header-pdf .titulos-pdf h1 {
          font-size: 1.9rem;
          letter-spacing: 1px;
          margin: 0;
          color: #0f1e2f;
        }
        .header-pdf .titulos-pdf p {
          font-size: 1rem;
          color: #3d506b;
          margin: 0.2rem 0 0;
        }
        .fecha {
          text-align: right;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          color: #3d506b;
        }
        .seccion {
          margin-bottom: 1.8rem;
        }
        .seccion h2 {
          font-size: 1.2rem;
          color: #0f1e2f;
          border-bottom: 1px solid #d0d9e6;
          padding-bottom: 0.3rem;
          margin-bottom: 0.8rem;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.95rem;
        }
        th {
          background: #eef3fa;
          text-align: left;
          padding: 0.6rem 0.8rem;
          border: 1px solid #c8d2e0;
          font-weight: 700;
          color: #0f1e2f;
        }
        td {
          padding: 0.6rem 0.8rem;
          border: 1px solid #c8d2e0;
        }
        .total-row {
          background: #f8faff;
          font-weight: 600;
        }
        .nota {
          background: #f4f8fe;
          padding: 0.8rem 1.2rem;
          border-left: 5px solid #1a2b3c;
          margin: 1.2rem 0;
          font-size: 0.95rem;
        }
        .condiciones {
          list-style: none;
          padding: 0;
        }
        .condiciones li {
          padding: 0.3rem 0;
          border-bottom: 1px dashed #e2eaf5;
        }
        .footer {
          margin-top: 2.5rem;
          padding-top: 1rem;
          border-top: 2px solid #d0d9e6;
          text-align: center;
          font-size: 0.9rem;
          color: #3d506b;
        }
      </style>
    </head>
    <body>
      <div class="header-pdf">
        <img src="${logoSrc}" alt="Logo del Club" class="logo-pdf" />
        <div class="titulos-pdf">
          <h1>♟️ PROPUESTA DE SERVICIOS</h1>
          <p>Clases de Ajedrez · Tarifas 2026</p>
        </div>
      </div>

      <div class="fecha">
        <strong>Fecha:</strong> ${fechaStr}
      </div>

      <div class="seccion">
        <h2>1. Horario propuesto</h2>
        <p><strong>Día:</strong> Jueves · <strong>Horario:</strong> 14:00 a 16:00 hrs.</p>
      </div>

      <div class="seccion">
        <h2>2. Tabla de tarifas</h2>
        <p><strong>Alumnos considerados para esta cotización:</strong> ${alumnos}</p>
        <table>
          <thead>
            <tr>
              <th>Rango de alumnos</th>
              <th>Costo total por clase</th>
              <th>Costo por alumno</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Menos de 15</strong></td>
              <td>$350.00 MXN (fijo)</td>
              <td>${alumnos < 15 ? `$${res.porAlumno.toFixed(2)} MXN` : '—'}</td>
            </tr>
            <tr>
              <td><strong>15 a 20</strong></td>
              <td>$375.00 a $500.00 MXN</td>
              <td>${(alumnos >= 15 && alumnos <= 20) ? `$${res.porAlumno.toFixed(2)} MXN` : '—'}</td>
            </tr>
            <tr class="total-row">
              <td><strong>21 a 30</strong></td>
              <td>$500.00 MXN (cerrado)</td>
              <td>${alumnos >= 21 ? `$${res.porAlumno.toFixed(2)} MXN` : '—'}</td>
            </tr>
          </tbody>
        </table>

        <div class="nota">
          <strong>✓ Tarifa aplicada a su grupo:</strong> ${res.tarifaDesc}
          <br />
          <span style="font-size:0.9rem;">Costo total: <strong>$${res.total.toFixed(2)} MXN</strong> · 
          Costo por alumno: <strong>$${res.porAlumno.toFixed(2)} MXN</strong></span>
        </div>
      </div>

      <div class="seccion">
        <h2>3. Condiciones generales</h2>
        <ul class="condiciones">
          <li><strong>Grupos separados:</strong> Si se forman dos grupos en horarios distintos (ej. 14-15 y 15-16), cada grupo paga su propia tarifa aplicando la tabla anterior. No se suman los alumnos para acceder al descuento.</li>
          <li><strong>Política de pago y ajustes:</strong> El costo se define al inicio de cada periodo (ej. mensual) con base en los alumnos inscritos formalmente. El monto acordado no cambia por inasistencias puntuales.</li>
          <li><strong>Bajas definitivas:</strong> Si durante el curso se producen bajas que reduzcan el grupo a un tramo inferior, el precio se ajustará a la tarifa correspondiente a partir de la siguiente clase, beneficiando a ambas partes.</li>
        </ul>
      </div>

      <div class="footer">
        <p>
          <strong>Contacto:</strong> [Tu Nombre] · [Tu teléfono] · [Tu correo electrónico]
        </p>
        <p style="font-size:0.8rem; color:#6a7b96;">
          Esta cotización tiene una vigencia de 15 días naturales.
        </p>
      </div>
    </body>
    </html>
    `

    const pdfDiv = document.createElement('div')
    pdfDiv.innerHTML = contenidoPDF
    pdfDiv.style.position = 'absolute'
    pdfDiv.style.left = '-9999px'
    document.body.appendChild(pdfDiv)

    try {
      const html2pdf = (window as any).html2pdf
      await html2pdf()
        .set({
          margin: [0.7, 0.7, 0.7, 0.7],
          filename: 'Cotizacion_Ajedrez.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
          },
          jsPDF: {
            unit: 'cm',
            format: 'letter',
            orientation: 'portrait'
          }
        })
        .from(pdfDiv)
        .save()
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Ocurrió un error al generar el PDF. Intente de nuevo.')
    } finally {
      document.body.removeChild(pdfDiv)
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-white to-[#f5f3f0] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#c9a84c]/20 p-8 md:p-10 relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1a2a3a]/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Encabezado con logo */}
        <div className="relative z-10 flex items-center gap-4 pb-6 border-b-2 border-[#1a2a3a]/10 mb-8">
          <img
            ref={logoRef}
            src="/logo.png"
            alt="Logo del Club de Ajedrez"
            className="h-16 w-auto object-contain drop-shadow-md"
          />
          <div>
            <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-[#1a2a3a] tracking-tight">
              ♟️ Calculadora de Tarifas
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide">
              Clases de Ajedrez · <span className="inline-block bg-[#c9a84c] text-white text-xs font-bold px-3 py-1 rounded-full ml-1 shadow">Tarifas 2026</span>
            </p>
          </div>
        </div>

        {/* Input con stepper */}
        <div className="bg-[#faf8f5]/70 rounded-xl p-6 mb-8 border border-[#c9a84c]/10 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="alumnos" className="font-['Playfair_Display',serif] text-lg font-semibold text-[#1a2a3a] sm:w-1/3">
              Número de alumnos
            </label>
            <div className="flex items-center gap-2 sm:w-2/3">
              <button
                onClick={decrement}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-[#1a2a3a] text-xl font-bold hover:bg-[#c9a84c]/10 hover:border-[#c9a84c] transition-colors duration-200 flex items-center justify-center"
                aria-label="Disminuir"
              >
                −
              </button>
              <input
                id="alumnos"
                type="number"
                min="1"
                max="30"
                value={alumnos}
                onChange={handleInputChange}
                className="w-20 text-center text-2xl font-semibold bg-white border-2 border-gray-200 rounded-xl py-2 px-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 outline-none transition-all duration-200"
              />
              <button
                onClick={increment}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-[#1a2a3a] text-xl font-bold hover:bg-[#c9a84c]/10 hover:border-[#c9a84c] transition-colors duration-200 flex items-center justify-center"
                aria-label="Aumentar"
              >
                +
              </button>
              <span className="text-sm text-gray-400 ml-2">(1 – 30)</span>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#c9a84c]/20 shadow-sm hover:shadow-md transition-shadow duration-300">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">💰 Costo Total por Clase</p>
            <p className="font-['Playfair_Display',serif] text-3xl font-bold text-[#1a2a3a] mt-2">
              ${total.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1 border-t border-gray-100 pt-2">{rango}</p>
          </div>
          <div className="bg-gradient-to-br from-[#c9a84c]/10 to-[#c9a84c]/5 rounded-xl p-6 border border-[#c9a84c]/30 shadow-sm hover:shadow-md transition-shadow duration-300">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">🧑‍🎓 Costo por Alumno</p>
            <p className="font-['Playfair_Display',serif] text-3xl font-bold text-[#1a2a3a] mt-2">
              ${porAlumno.toFixed(2)} <span className="text-base font-normal text-gray-500">c/u</span>
            </p>
            <p className="text-sm text-gray-500 mt-1 border-t border-[#c9a84c]/20 pt-2">{detalle}</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-[#1a2a3a]/5 rounded-xl p-5 border-l-4 border-[#c9a84c] mb-8">
          <p className="font-semibold text-[#1a2a3a]">✓ Tarifa Aplicada</p>
          <p className="text-gray-600">{tarifaDesc}</p>
          <p className="text-xs text-gray-400 mt-2 italic">
            ⚠️ Si el grupo baja de tramo por bajas definitivas, el precio se ajusta en la siguiente clase.
          </p>
        </div>

        {/* Botón PDF */}
        <button
          onClick={generarPDF}
          disabled={isGeneratingPDF}
          className="w-full py-4 bg-[#1a2a3a] text-white font-semibold rounded-xl hover:bg-[#1a2a3a]/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#1a2a3a]/20 hover:shadow-[#1a2a3a]/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
              Generando PDF...
            </>
          ) : (
            <>
              📄 Descargar Cotización en PDF
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
          Los precios son por grupo y por clase (1 o 2 horas). Aplican condiciones generales.
        </p>
      </div>
    </div>
  )
}
