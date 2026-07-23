import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// ⚠️ Ajusta esta ruta al archivo donde tengas inicializado tu cliente de Supabase
import { supabase } from '../lib/supabase';

// ⚠️ Reemplaza estos datos con los reales del administrador
const DATOS_BANCARIOS = {
  banco: 'Banco Estado',
  tipoCuenta: 'Cuenta RUT',
  numeroCuenta: '12.345.678-9',
  titular: 'Nombre Apellido',
  rut: '12.345.678-9',
  email: 'admin@driverboos.cl',
};

// ⚠️ Debe existir un bucket con este nombre en Supabase Storage (puede ser público o privado)
const BUCKET_COMPROBANTES = 'comprobantes';

const SubscriptionBlocked = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState(null);
  const [errorSubida, setErrorSubida] = useState(null);

  const handleCopy = async (valor, campo) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(campo);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      // Si el navegador bloquea el clipboard (poco común), simplemente no mostramos feedback
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones básicas: solo imágenes o PDF, máx 5MB
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      setErrorSubida('Formato no permitido. Sube una imagen (JPG, PNG, WEBP) o un PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorSubida('El archivo supera los 5MB. Comprime la imagen e intenta de nuevo.');
      return;
    }

    setErrorSubida(null);
    setComprobanteUrl(null);
    setArchivo(file);
    setPreviewUrl(file.type === 'application/pdf' ? null : URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!archivo || !user) return;

    setSubiendo(true);
    setErrorSubida(null);

    try {
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${user.id}_${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_COMPROBANTES)
        .upload(nombreArchivo, archivo, { upsert: false });

      if (uploadError) throw uploadError;

      // Si el bucket es público, esto entrega una URL directa.
      // Si es privado, cambia esto por createSignedUrl() y ajusta el tiempo de expiración.
      const { data: urlData } = supabase.storage
        .from(BUCKET_COMPROBANTES)
        .getPublicUrl(nombreArchivo);

      setComprobanteUrl(urlData?.publicUrl || null);
    } catch (err) {
      setErrorSubida('No se pudo subir el comprobante. Intenta de nuevo o contacta directo por WhatsApp.');
      console.error('Error subiendo comprobante:', err);
    } finally {
      setSubiendo(false);
    }
  };

  const handleContact = () => {
    const nombre = user?.user_metadata?.nombre || 'Usuario';
    const email = user?.email || '';

    const mensaje =
      `Hola, ya realicé la transferencia para renovar mi suscripción de Driver Boos.\n\n` +
      `Nombre: ${nombre}\n` +
      `Correo: ${email}\n` +
      (comprobanteUrl ? `Comprobante: ${comprobanteUrl}\n\n` : '\n') +
      `Quedo atento para que actives mi cuenta. ¡Gracias!`;

    window.open(`https://wa.me/56997416485?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1a1a]">
      <div className="card w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-primary">⛔ Suscripción vencida</h1>

        <p className="text-gray-300">
          Tu período gratuito de 7 días ha finalizado. Para continuar utilizando{' '}
          <span className="font-semibold text-white">Driver Boos</span> debes renovar tu
          suscripción.
        </p>

        <div className="bg-[#3d3d3d] p-4 rounded-lg">
          <p className="text-2xl font-bold text-primary">$2.490</p>
          <p className="text-gray-400 text-sm">al mes</p>
        </div>

        {/* Datos bancarios */}
        <div className="bg-[#3d3d3d] p-4 rounded-lg text-left space-y-2">
          <p className="text-white font-semibold text-center mb-2">
            💳 Datos para transferencia
          </p>

          {[
            { label: 'Banco', valor: DATOS_BANCARIOS.banco, campo: 'banco' },
            { label: 'Tipo de cuenta', valor: DATOS_BANCARIOS.tipoCuenta, campo: 'tipo' },
            { label: 'N° de cuenta', valor: DATOS_BANCARIOS.numeroCuenta, campo: 'cuenta' },
            { label: 'Titular', valor: DATOS_BANCARIOS.titular, campo: 'titular' },
            { label: 'RUT', valor: DATOS_BANCARIOS.rut, campo: 'rut' },
            { label: 'Email', valor: DATOS_BANCARIOS.email, campo: 'correo' },
          ].map(({ label, valor, campo }) => (
            <div
              key={campo}
              className="flex items-center justify-between gap-2 border-b border-[#4d4d4d] last:border-0 pb-1.5 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white text-sm truncate">{valor}</p>
              </div>
              <button
                onClick={() => handleCopy(valor, campo)}
                className="shrink-0 text-xs px-2 py-1 rounded bg-[#4d4d4d] hover:bg-[#5d5d5d] text-gray-200 transition"
              >
                {copiado === campo ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          ))}

          <p className="text-gray-500 text-xs pt-2">
            Monto a transferir: <span className="text-primary font-semibold">$2.490</span>
          </p>
        </div>

        {/* Subida de comprobante */}
        <div className="bg-[#3d3d3d] p-4 rounded-lg text-left space-y-3">
          <p className="text-white font-semibold text-center">📎 Comprobante de transferencia</p>

          {!comprobanteUrl && (
            <>
              <label className="block w-full cursor-pointer text-center border border-dashed border-[#5d5d5d] rounded-lg py-4 text-gray-300 text-sm hover:border-primary hover:text-white transition">
                {archivo ? archivo.name : 'Toca para elegir una foto o PDF del comprobante'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Vista previa del comprobante"
                  className="w-full max-h-48 object-contain rounded-lg border border-[#4d4d4d]"
                />
              )}

              {errorSubida && <p className="text-red-400 text-xs text-center">{errorSubida}</p>}

              {archivo && (
                <button
                  onClick={handleUpload}
                  disabled={subiendo}
                  className="w-full py-2 rounded-lg bg-[#4d4d4d] hover:bg-[#5d5d5d] text-gray-100 text-sm transition disabled:opacity-50"
                >
                  {subiendo ? 'Subiendo...' : 'Subir comprobante'}
                </button>
              )}
            </>
          )}

          {comprobanteUrl && (
            <p className="text-green-400 text-sm text-center">
              ✓ Comprobante subido correctamente
            </p>
          )}

          <p className="text-gray-500 text-xs text-center">
            Este paso es opcional pero ayuda a que el administrador confirme tu pago más rápido.
          </p>
        </div>

        <button
          onClick={handleContact}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
        >
          <span>📱</span> Ya transferí, avisar al Administrador
        </button>

        <p className="text-gray-500 text-sm">
          Realiza la transferencia con los datos de arriba, sube tu comprobante y haz clic para
          avisarle al administrador. Tu cuenta se activará una vez confirmado el pago.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:underline text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBlocked;