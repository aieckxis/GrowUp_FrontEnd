"use client"

import { useState, useEffect } from "react"
import {
  Waves, Wind, Droplets, Activity, Zap, Sun, Bell, 
  Thermometer, AlertTriangle, Home, Camera, Settings, 
  BarChart3, CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* TYPES & INITIAL STATES */
interface SensorDataState { waterTemp: number; ph: number; dissolvedO2: number; ammonia: number; airTemp: number; waterFlow: number; airHumidity: number; lightIntensity: number; }
interface AlertData { id: number; type: "warning" | "error" | "info"; severity: "low" | "medium" | "high" | "critical"; title: string; message: string; time: string; }
interface SystemControls { pump: boolean; fan: boolean; phAdjustment: boolean; aerator: boolean; growLight: boolean; }
interface ThresholdState {
  waterTemp: { min: number; max: number };
  ph: { min: number; max: number };
  dissolvedO2: { min: number; max: number };
  ammonia: { min: number; max: number };
  airTemp: { min: number; max: number };
  waterFlow: { min: number; max: number };
  airHumidity: { min: number; max: number };
  lightIntensity: { min: number; max: number };
}
interface ControlToggleProps { label: string; description: string; icon: React.ElementType; active: boolean; onChange: (val: boolean) => void; }
interface PresetCardProps { title: string; description: string; icon: React.ElementType; active: boolean; onActivate: () => void; }
interface ThresholdRangeInputProps { label: string; unit: string; icon: React.ElementType; minValue: number; maxValue: number; minLimit: number; maxLimit: number; onMinChange: (val: number) => void; onMaxChange: (val: number) => void; }

const INITIAL_CONTROLS_FULL: SystemControls = { pump: true, fan: false, phAdjustment: true, aerator: true, growLight: true, }
const INITIAL_THRESHOLDS: ThresholdState = {
  waterTemp: { min: 22, max: 26 }, ph: { min: 6.5, max: 7.5 }, dissolvedO2: { min: 5, max: 8 }, ammonia: { min: 0, max: 0.5 },
  airTemp: { min: 22, max: 28 }, waterFlow: { min: 8, max: 12 }, airHumidity: { min: 50, max: 70 }, lightIntensity: { min: 500, max: 1500 },
}

const localStorageKey = 'aquaponics_settings_state';

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} hrs ago`
}

const generateAlerts = (sensor: SensorDataState, thresholds: ThresholdState): AlertData[] => {
  const now = new Date(); const alerts: AlertData[] = []; let alertId = 10;
  if (sensor.waterTemp < thresholds.waterTemp.min || sensor.waterTemp > thresholds.waterTemp.max) {
    alerts.push({ id: 1, type: "warning", severity: "medium", title: "Water Temp Issue", message: `Temp is ${sensor.waterTemp}°C`, time: timeAgo(now) });
  }
  if (sensor.ph < thresholds.ph.min || sensor.ph > thresholds.ph.max) {
    alerts.push({ id: 3, type: "warning", severity: "medium", title: "pH Level Alert", message: `pH is ${sensor.ph}`, time: timeAgo(now) });
  }
  return alerts;
}

const loadState = () => {
  if (typeof window === 'undefined') return { controls: INITIAL_CONTROLS_FULL, activePreset: "balanced", thresholds: INITIAL_THRESHOLDS };
  try {
    const saved = localStorage.getItem(localStorageKey);
    return saved ? JSON.parse(saved) : { controls: INITIAL_CONTROLS_FULL, activePreset: "balanced", thresholds: INITIAL_THRESHOLDS };
  } catch (e) { return { controls: INITIAL_CONTROLS_FULL, activePreset: "balanced", thresholds: INITIAL_THRESHOLDS }; }
};

const useAquaponicsSettings = () => {
  const [state, setState] = useState(loadState);
  const [hasChanges, setHasChanges] = useState(false);

  const setControls = (c: SystemControls) => { setState((p: any) => ({ ...p, controls: c })); setHasChanges(true); };
  const setPreset = (pr: string) => { setState((p: any) => ({ ...p, activePreset: pr })); setHasChanges(true); };
  const setThresholds = (t: ThresholdState) => { setState((p: any) => ({ ...p, thresholds: t })); setHasChanges(true); };

  const handleSave = (): Promise<boolean> => {
    return new Promise((res) => {
      setTimeout(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
        setHasChanges(false);
        res(true);
      }, 500);
    });
  };

  return { ...state, setControls, setPreset, setThresholds, handleSave, hasChanges };
};

/* UI COMPONENTS */
const Navbar = ({ time }: { time: string }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900">GROWUP</span>
    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs text-gray-600">{time}</span></div>
  </div>
)

const ControlToggle = ({ label, description, icon: Icon, active, onChange }: ControlToggleProps) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-3 flex-1">
      <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}><Icon className="w-5 h-5" /></div>
      <div><div className="font-medium text-gray-900">{label}</div><div className="text-xs text-gray-500">{description}</div></div>
    </div>
    <button onClick={() => onChange(!active)} className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${active ? 'left-6' : 'left-0.5'}`} />
    </button>
  </div>
)

const PresetCard = ({ title, description, icon: Icon, active, onActivate }: PresetCardProps) => (
  <button onClick={onActivate} className={`relative p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2 ${active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
    <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}><Icon className="w-6 h-6" /></div>
    <div className="font-semibold text-xs text-gray-900">{title}</div>
    {active && <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />}
  </button>
)

const ThresholdRangeInput = ({ label, unit, icon: Icon, minValue, maxValue, onMinChange, onMaxChange }: any) => (
  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
    <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-600" /><span className="font-medium text-sm">{label} ({unit})</span></div>
    <div className="flex items-center gap-3">
      <input type="number" value={minValue} onChange={(e) => onMinChange(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
      <span className="text-gray-400">—</span>
      <input type="number" value={maxValue} onChange={(e) => onMaxChange(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
    </div>
  </div>
)

const BottomNavigation = () => {
  const pathname = usePathname();
  const tabs = [{ href: "/dashboard", icon: Home, label: "Home" }, { href: "/analytics", icon: BarChart3, label: "Stats" }, { href: "/camera", icon: Camera, label: "Cam" }, { href: "/settings", icon: Settings, label: "Set" }];
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-3 flex justify-around z-50">
      {tabs.map((tab) => (
        <Link key={tab.label} href={tab.href} className={`flex flex-col items-center ${pathname === tab.href ? 'text-emerald-600' : 'text-gray-400'}`}>
          <tab.icon className="w-5 h-5" /><span className="text-[10px] font-bold">{tab.label}</span>
        </Link>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { controls, activePreset, thresholds, setControls, setPreset, setThresholds, handleSave, hasChanges } = useAquaponicsSettings();
  const [time, setTime] = useState(new Date());

  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);

  const handlePresetChange = (p: string) => {
    setPreset(p);
    if (p === "ecoMode") setControls({ ...controls, growLight: false, aerator: false });
    if (p === "balanced") setControls(INITIAL_CONTROLS_FULL);
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <Navbar time={time.toLocaleTimeString()} />
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-4">
          <h3 className="font-bold">Presets</h3>
          <div className="grid grid-cols-2 gap-3">
            <PresetCard title="Balanced" description="Standard" icon={Activity} active={activePreset === "balanced"} onActivate={() => handlePresetChange("balanced")} />
            <PresetCard title="Eco" description="Saving" icon={Sun} active={activePreset === "ecoMode"} onActivate={() => handlePresetChange("ecoMode")} />
          </div>
        </section>

        <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
          <h3 className="font-bold">Controls</h3>
          <ControlToggle label="Pump" description="Water flow" icon={Waves} active={controls.pump} onChange={(v) => setControls({...controls, pump: v})} />
          <ControlToggle label="Grow Light" description="LEDs" icon={Sun} active={controls.growLight} onChange={(v) => setControls({...controls, growLight: v})} />
        </section>

        <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
          <h3 className="font-bold">Thresholds</h3>
          <ThresholdRangeInput label="Water Temp" unit="°C" icon={Thermometer} minValue={thresholds.waterTemp.min} maxValue={thresholds.waterTemp.max} onMinChange={(v:any) => setThresholds({...thresholds, waterTemp: {...thresholds.waterTemp, min: v}})} onMaxChange={(v:any) => setThresholds({...thresholds, waterTemp: {...thresholds.waterTemp, max: v}})} />
        </section>

        <button onClick={handleSave} disabled={!hasChanges} className={`w-full py-4 rounded-xl font-bold ${hasChanges ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {hasChanges ? 'Save Changes' : 'Synced'}
        </button>
      </div>
      <BottomNavigation />
    </div>
  )
}