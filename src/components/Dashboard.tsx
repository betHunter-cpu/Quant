import React, { useEffect, useState } from 'react';
import { BasketballService, MatchData } from '../services/basketballService';
import { Activity, ServerCrash, Key } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LeagueDashboard } from './LeagueDashboard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Dashboard() {
  const [nbaMatches, setNbaMatches] = useState<MatchData[]>([]);
  const [ncaaMatches, setNcaaMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const today = new Date();
        const data = await BasketballService.getMatchesByDate(today.getDate(), today.getMonth() + 1, today.getFullYear());
        const matchesArray = Array.isArray(data) ? data : [];
        
        setNbaMatches(matchesArray.filter(m => m.tournamentName.includes('NBA')));
        setNcaaMatches(matchesArray.filter(m => m.tournamentName.includes('NCAA')));
        
        if (matchesArray.length === 0) {
          setApiError("No se encontraron partidos para hoy o el formato de la API es incorrecto.");
        }
      } catch (error: any) {
        console.error("Failed to load matches", error);
        if (error.message.includes('MISSING_SECRETS') || (error as any).error === 'MISSING_SECRETS') {
          setApiError('FALTAN CLAVES DE API: Haz clic en el ícono de engranaje (⚙️ Settings) arriba a la derecha, ve a "Secrets" y agrega EXTERNAL_API_URL y EXTERNAL_API_KEY con los datos de tu API real.');
        } else {
          setApiError(`Error al conectar con la API externa. Detalle: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  if (apiError && (apiError.includes('FALTAN CLAVES') || apiError.includes('MISSING_SECRETS'))) {
    return <MissingSecretsScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 animate-pulse text-emerald-500" />
          <p className="font-mono text-sm tracking-widest uppercase text-neutral-400">Conectando a API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 font-sans selection:bg-emerald-500/30">
      <header className="border-b border-white/10 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-mono text-sm font-semibold tracking-widest uppercase text-white">
              Quant<span className="text-emerald-500">Hoops</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {apiError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <ServerCrash className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Error de Conexión API</h3>
              <p className="text-sm opacity-80 mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {nbaMatches.length > 0 && <LeagueDashboard title="NBA" matches={nbaMatches} />}
        {ncaaMatches.length > 0 && <LeagueDashboard title="NCAA" matches={ncaaMatches} />}
        
        {nbaMatches.length === 0 && ncaaMatches.length === 0 && !apiError && (
          <div className="text-center py-20 text-neutral-500 font-mono">
            No hay partidos disponibles para hoy.
          </div>
        )}
      </main>
    </div>
  );
}

function MissingSecretsScreen() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-xl w-full bg-[#1f1f1f] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-emerald-500" />
        </div>
        
        <h1 className="text-2xl font-light tracking-tight mb-2">Configuración Requerida</h1>
        <p className="text-neutral-400 mb-8">
          Para que el modelo matemático funcione con datos reales, necesitas conectar tu API. Como estamos en un entorno seguro en la nube, esto se hace a través de las variables de entorno (Secrets).
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-mono text-sm">1</div>
            <div>
              <p className="font-medium">Abre la configuración</p>
              <p className="text-sm text-neutral-500 mt-1">Haz clic en el ícono de engranaje (⚙️ Settings) en la esquina superior derecha de esta pantalla.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-mono text-sm">2</div>
            <div>
              <p className="font-medium">Ve a la sección "Secrets"</p>
              <p className="text-sm text-neutral-500 mt-1">Aquí es donde puedes guardar claves privadas de forma segura.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-mono text-sm">3</div>
            <div>
              <p className="font-medium">Agrega las siguientes variables:</p>
              <div className="mt-3 space-y-3">
                <div className="bg-black/50 border border-white/5 rounded-lg p-3">
                  <p className="text-xs font-mono text-emerald-500 mb-1">Nombre del Secret</p>
                  <p className="font-mono text-sm">EXTERNAL_API_URL</p>
                  <p className="text-xs font-mono text-emerald-500 mb-1 mt-2">Valor</p>
                  <p className="text-sm text-neutral-400">La URL base de tu API (ej. https://v1.basketball.api-sports.io)</p>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-lg p-3">
                  <p className="text-xs font-mono text-emerald-500 mb-1">Nombre del Secret</p>
                  <p className="font-mono text-sm">EXTERNAL_API_KEY</p>
                  <p className="text-xs font-mono text-emerald-500 mb-1 mt-2">Valor</p>
                  <p className="text-sm text-neutral-400">Tu clave privada de la API</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-mono text-sm">4</div>
            <div>
              <p className="font-medium">Presiona Enter</p>
              <p className="text-sm text-neutral-500 mt-1">La aplicación se recargará automáticamente y comenzará a descargar los datos reales.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
