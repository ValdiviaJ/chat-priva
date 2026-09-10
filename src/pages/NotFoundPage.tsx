import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-900/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-4l font-extrabold mb-2">404</h1>
        <h2 className="text-xl font-bold mb-3">Pāgina no encontrada</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          La ruta a la que intentas acceder no existe o la conversación ya fue eliminada.
        </p>
        <Button
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};
