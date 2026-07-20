import { useAuth } from '../context/AuthContext';

const Form = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const nombreCompleto = user?.user_metadata?.nombre && user?.user_metadata?.apellido
    ? `${user.user_metadata.nombre} ${user.user_metadata.apellido}`
    : user?.email || 'Usuario';

  const enviarBoleta = () => {
    const asunto = encodeURIComponent('Boleta de honorarios - ' + nombreCompleto);
    const cuerpo = encodeURIComponent(
      `Estimados,\n\nAdjunto mi boleta de honorarios correspondiente al mes de Junio.\n\nSaludos cordiales,\n${nombreCompleto}`
    );
    window.open(`mailto:finanzas@boosmap.com?subject=${asunto}&body=${cuerpo}`, '_blank');
  };

  const contactarSAF = () => {
    const asunto = encodeURIComponent('Consulta SAF - ' + nombreCompleto);
    const cuerpo = encodeURIComponent(
      `Hola,\n\nMe comunico para consultar sobre...\n\nNombre: ${nombreCompleto}\nEmail: ${user?.email || ''}\n\nSaludos.`
    );
    window.open(`mailto:saf@boosmap.com?subject=${asunto}&body=${cuerpo}`, '_blank');
  };

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-2xl font-bold text-primary mb-4">📄 Información de Boleta</h2>

      <div className="card space-y-6">
        {/* Sección 1: Datos de la boleta */}
        <div>
          <h3 className="font-semibold text-lg text-white mb-3">Datos de la boleta de honorarios</h3>
          <div className="space-y-2 text-gray-300">
            <p><span className="font-medium text-gray-400">Fecha:</span> {today}</p>
            <p><span className="font-medium text-gray-400">A nombre de:</span> INVERSIONES ASINARA SPA</p>
            <p><span className="font-medium text-gray-400">RUT:</span> 76.456.187-2</p>
            <p><span className="font-medium text-gray-400">Dirección:</span> AV. ANDRES BELLO 2777 Piso 19 Oficina 01, LAS CONDES</p>
            <p><span className="font-medium text-gray-400">Giro:</span> OTRAS ACTIVIDADES CONEXAS AL TRANSPORTE</p>
            <p><span className="font-medium text-gray-400">Enviar a:</span> finanzas@boosmap.com</p>
          </div>
        </div>

        <div className="border-t border-[#444] my-2"></div>

        {/* Sección 2: Prestación y acciones */}
        <div>
          <h3 className="font-semibold text-lg text-white mb-3"></h3>
          <p className="text-gray-300 mb-4"></p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.open('https://homer.sii.cl/', '_blank')}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              📋 Ir al SII
            </button>
            <button
              onClick={enviarBoleta}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              ✉️ Enviar boleta
            </button>
            <button
              onClick={contactarSAF}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              💬 Contactar SAF
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            finanzas@boosmap.com · saf@boosmap.com
          </p>
        </div>

        <div className="border-t border-[#444] my-2"></div>

        {/* Sección 3: Formularios externos */}
        <div>
          <h3 className="font-semibold text-lg text-white mb-3">Formularios de Registros Boosmap</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://boosmap.typeform.com/to/sFgws2bM"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-center"
            >
              📋 JUMBO VA
            </a>
            <a
              href="https://boosmap.typeform.com/to/tVQ0iVHF"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-center"
            >
              📋 EXTRAS
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form;