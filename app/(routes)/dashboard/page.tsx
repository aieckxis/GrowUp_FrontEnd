"use client"

import React, { useState, useEffect } from "react"
import { 
  Thermometer, Droplets, Activity, Zap, Waves, Gauge, 
  Wind, Fish, ChevronDown, AlertTriangle, CheckCircle, 
  Camera, Maximize2, Bell, X, Clock, Home, BarChart3, 
  Settings, Sun, WifiOff 
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// --- INTERFACES ---
interface SystemControls { 
  pump: boolean; 
  fan: boolean; 
  phAdjustment: boolean; 
  aerator: boolean; 
  growLight: boolean; 
}

interface ThresholdState { 
  waterTemp: { min: number; max: number }; 
  ph: { min: number; max: number }; 
}

interface ControlState { 
  pump: boolean; 
  fan: boolean; 
  phAdjustment: boolean; 
  aerator: boolean; 
  growLight: boolean; 
}

interface SensorCardProps { 
  icon: React.ElementType; 
  title: string; 
  value: number; 
  unit: string; 
  min: number; 
  max: number; 
  color: string; 
}

interface SensorDataState {
  waterTemp: number;
  ph: number;
  waterLevel: number;
  waterFlow: number;
  humidity: number;
  lightIntensity: number;
  airTemp: number;
  airPressure: number;
}

interface AlertData { 
  id: number; 
  type: "warning" | "info"; 
  severity: "low" | "medium" | "high"; 
  title: string; 
  message: string; 
  time: string; 
}

interface ControlToggleProps { 
  label: string; 
  icon: React.ElementType; 
  active: boolean; 
  onChange: (val: boolean) => void; 
}

// --- INITIAL STATE & CONSTANTS ---
const INITIAL_CONTROLS_FULL: SystemControls = { 
  pump: true, 
  fan: false, 
  phAdjustment: true, 
  aerator: true, 
  growLight: true 
}

const INITIAL_THRESHOLDS: ThresholdState = { 
  waterTemp: { min: 20, max: 26 }, 
  ph: { min: 6.5, max: 7.5 }, 
}

const INITIAL_SENSOR_DATA: SensorDataState = {
  waterTemp: 23.2,
  ph: 6.8,
  waterLevel: 85,
  waterFlow: 4.5,
  humidity: 65,
  lightIntensity: 15000,
  airTemp: 25.5,
  airPressure: 1012.0
}

const localStorageKey = 'aquaponics_settings_state';

// --- HELPER FUNCTIONS ---
const loadState = (): { controls: SystemControls, activePreset: string, thresholds: ThresholdState } => { 
  try { 
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(localStorageKey); 
      if (savedState) return JSON.parse(savedState);
    }
  } catch (error) { 
    console.error('Error loading state:', error); 
  } 
  return { 
    controls: INITIAL_CONTROLS_FULL, 
    activePreset: "balanced", 
    thresholds: INITIAL_THRESHOLDS, 
  }; 
}

type ThresholdStatus = "good" | "warning" | "critical"

const getThresholdStatus = (value: number, min: number, max: number): ThresholdStatus => {
  if (value < min || value > max) return "critical"
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) return "warning"
  return "good"
}

const getStatusColor = (status: ThresholdStatus): string => {
  switch (status) {
    case "good": return "bg-emerald-500"
    case "warning": return "bg-amber-500"
    case "critical": return "bg-red-500"
    default: return "bg-gray-500"
  }
}

const calculatePercentage = (value: number, min: number, max: number) => 
  ((value - min) / (max - min)) * 100

// --- CUSTOM HOOKS ---
const useAquaponicsSettings = () => {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === localStorageKey && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const quickSaveControls = (newControls: SystemControls) => {
    setState(prevState => {
      const newState = { ...prevState, controls: newControls };
      localStorage.setItem(localStorageKey, JSON.stringify(newState));
      return newState;
    });
  }

  return { 
    controls: state.controls, 
    quickSaveControls, 
    activePreset: state.activePreset, 
    thresholds: state.thresholds 
  }
}

// --- ALERT GENERATION ---
const generateAlerts = (data: SensorDataState, thresholds: ThresholdState): AlertData[] => {
  const newAlerts: AlertData[] = []
  let alertIdCounter = 1

  const checkParam = (title: string, value: number, min: number, max: number, unit: string) => {
    if (value < min || value > max) {
      newAlerts.push({
        id: alertIdCounter++,
        type: "warning",
        severity: "high",
        title: `${title} Critical!`,
        message: `${title} (${value.toFixed(1)}${unit}) is outside critical range [${min}-${max}${unit}].`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    } else if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
      newAlerts.push({
        id: alertIdCounter++,
        type: "warning",
        severity: "medium",
        title: `${title} Warning`,
        message: `${title} (${value.toFixed(1)}${unit}) is approaching boundary range [${min}-${max}${unit}].`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  checkParam("Water Temp", data.waterTemp, thresholds.waterTemp.min, thresholds.waterTemp.max, "°C")
  checkParam("pH Level", data.ph, thresholds.ph.min, thresholds.ph.max, "")

  if (data.waterLevel < 75) {
    newAlerts.push({
      id: alertIdCounter++,
      type: "warning",
      severity: "medium",
      title: "Water Level Low",
      message: `Water reservoir is at ${data.waterLevel.toFixed(0)}%. Consider checking auto-fill or adding water.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  if (newAlerts.length === 0) {
    newAlerts.push({
      id: alertIdCounter++,
      type: "info",
      severity: "low",
      title: "System Running Optimally",
      message: "All monitored parameters are within ideal ranges.",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  return newAlerts.reverse()
}

// --- UI COMPONENTS ---

const Navbar: React.FC<{ time: string; isConnected: boolean }> = ({ time, isConnected }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900 tracking-tight">GROWUP</span>
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      ) : (
        <WifiOff className="w-3 h-3 text-red-500" />
      )}
      <span className="text-xs text-gray-600 font-medium">{time}</span>
    </div>
  </div>
)

const BottomNavigation = () => {
  const pathname = usePathname() || "/dashboard"
  const tabs = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "camera", label: "Camera", href: "/camera", icon: Camera },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ]
  
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-3">
        {tabs.map(tab => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const SensorCard: React.FC<SensorCardProps> = ({ icon: Icon, title, value, unit, min, max, color }) => {
  const status = getThresholdStatus(value, min, max)
  const percentage = calculatePercentage(value, min, max)
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{title}</span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)} animate-pulse`}></div>
      </div>
      <div className="mb-3">
        <div className="text-2xl font-black text-gray-900">
          {value.toFixed(1)}
          <span className="text-xs text-gray-400 ml-1 font-bold">{unit}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getStatusColor(status)}`} 
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
      </div>
    </div>
  )
}

const ControlToggle: React.FC<ControlToggleProps> = ({ label, icon: Icon, active, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-bold text-gray-700 text-sm">{label}</span>
    </div>
    <button 
      onClick={() => onChange(!active)} 
      className={`w-12 h-7 rounded-full transition-all relative ${active ? 'bg-emerald-500 shadow-inner' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${active ? 'right-1' : 'left-1'}`} />
    </button>
  </div>
)

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard() {
  const { controls, quickSaveControls, thresholds } = useAquaponicsSettings()
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false)
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [localControls, setLocalControls] = useState<ControlState>({ ...controls })
  const [sensorData, setSensorData] = useState<SensorDataState>(INITIAL_SENSOR_DATA)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [isCameraConnected, setIsCameraConnected] = useState<boolean>(false)
  const [cameraLoading, setCameraLoading] = useState<boolean>(true)
  const [isRaspiConnected, setIsRaspiConnected] = useState<boolean>(true)
  
  const LIVE_STREAM_URL = "http://192.168.210.142:8000/video_feed"

  const overallSeverity = alerts.reduce((maxSeverity, alert) => {
    if (alert.severity === 'high') return 'high'
    if (alert.severity === 'medium' && maxSeverity !== 'high') return 'medium'
    return maxSeverity
  }, 'low' as AlertData['severity'])

  const getOverallStatus = (severity: AlertData['severity']) => {
    if (severity === 'high') return { color: 'bg-red-500', text: 'System Critical' }
    if (severity === 'medium') return { color: 'bg-amber-500', text: 'System Warning' }
    return { color: 'bg-emerald-500', text: 'System Healthy' }
  }

  const status = getOverallStatus(overallSeverity)

  useEffect(() => {
    if (showControlsModal) setLocalControls({ ...controls })
  }, [showControlsModal, controls])

  useEffect(() => {
    const checkCameraConnection = () => {
      const img = new Image()
      img.onload = () => { setIsCameraConnected(true); setCameraLoading(false); }
      img.onerror = () => { setIsCameraConnected(false); setCameraLoading(false); }
      img.src = `${LIVE_STREAM_URL}?t=${Date.now()}`
    }
    checkCameraConnection()
    const cameraCheckInterval = setInterval(checkCameraConnection, 10000)
    return () => clearInterval(cameraCheckInterval)
  }, [])

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("/api/sensors")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const apiResponse = await response.json()
        if (apiResponse.status === "success" && apiResponse.data) {
          setSensorData(apiResponse.data)
          setAlerts(generateAlerts(apiResponse.data, thresholds))
          setIsRaspiConnected(true)
        } else {
          setIsRaspiConnected(false)
        }
      } catch (error) {
        console.error("❌ Failed to fetch sensor data:", error)
        setIsRaspiConnected(false)
      }
      setCurrentTime(new Date())
    }

    fetchSensorData()
    const interval = setInterval(fetchSensorData, 3000)
    return () => clearInterval(interval)
  }, [thresholds])

  const handleQuickControlsSave = async () => {
    try {
      const response = await fetch("/api/controls", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localControls),
      })
      if (!response.ok) throw new Error(`Failed to update controls: ${response.status}`)
      
      quickSaveControls({ ...localControls })
      setShowControlsModal(false)
    } catch (error) {
      console.error("Error saving controls:", error)
      alert("❌ Failed to connect to the system.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      <Navbar time={currentTime.toLocaleTimeString()} isConnected={isRaspiConnected} />
      
      <div className="space-y-6 pb-28 px-4 py-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter italic">GROWUP</h1>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest opacity-80">Aquaponics Tower</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-[10px] font-bold text-emerald-200 uppercase mb-1">Plants</div>
              <div className="text-xl font-black tracking-tight">4</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-[10px] font-bold text-emerald-200 uppercase mb-1">Health</div>
              <div className="text-xl font-black tracking-tight">94%</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-[10px] font-bold text-emerald-200 uppercase mb-1">Status</div>
              <div className="text-xl font-black tracking-tight">LIVE</div>
            </div>
          </div>
        </div>

        {/* System Health Summary */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 ${status.color} rounded-full animate-pulse shadow-lg`} />
              <div>
                <div className="font-black text-gray-800 tracking-tight">{status.text}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isRaspiConnected ? "Sensors Online" : "Communication Lost"}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowControlsModal(true)} 
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-tight active:scale-95 transition-all"
            >
              Controls
            </button>
          </div>
        </div>

        {/* Live Camera Feed Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Monitoring Feed</h2>
          <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white relative group">
            <div className="aspect-video relative cursor-pointer" onClick={() => setShowCameraModal(true)}>
              {cameraLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                </div>
              ) : isCameraConnected ? (
                <img src={LIVE_STREAM_URL} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Live" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Camera size={32} className="opacity-20 mb-2" />
                  <span className="text-[10px] font-bold uppercase">Signal Lost</span>
                </div>
              )}
              
              <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" /> LIVE
              </div>
              
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono">
                {currentTime.toLocaleTimeString()}
              </div>

              <button className="absolute bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2 uppercase tracking-tight">
              <Bell className="w-4 h-4 text-amber-500" /> Notifications
            </h3>
            <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
              {alerts.length} NEW
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto px-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 transition-all rounded-2xl mb-1 ${expandedAlert === alert.id ? "bg-gray-50" : "bg-white"}`} 
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    alert.severity === "high" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {alert.type === "warning" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-xs leading-tight">{alert.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">{alert.time}</div>
                    {expandedAlert === alert.id && (
                      <div className="text-[11px] text-gray-500 mt-2 leading-relaxed font-medium animate-in fade-in slide-in-from-top-1">
                        {alert.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Sections */}
        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-4">Critical Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <SensorCard icon={Thermometer} title="Water Temp" value={sensorData.waterTemp} unit="°C" min={20} max={26} color="bg-blue-500" />
            <SensorCard icon={Droplets} title="pH Level" value={sensorData.ph} unit="pH" min={6.5} max={7.5} color="bg-purple-500" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-4">Tower Systems</h2>
          <div className="grid grid-cols-2 gap-4">
            <SensorCard icon={Waves} title="Water Level" value={sensorData.waterLevel} unit="%" min={70} max={100} color="bg-cyan-500" />
            <SensorCard icon={Gauge} title="Flow Rate" value={sensorData.waterFlow} unit="L/m" min={3} max={6} color="bg-indigo-500" />
            <SensorCard icon={Zap} title="Grow Lights" value={sensorData.lightIntensity} unit="lux" min={10000} max={20000} color="bg-amber-500" />
            <SensorCard icon={Wind} title="Humidity" value={sensorData.humidity} unit="%" min={50} max={80} color="bg-sky-500" />
          </div>
        </section>
      </div>

      <BottomNavigation />

      {/* MODALS */}
      {showControlsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center px-4 pb-4">
          <div className="w-full bg-white rounded-[3rem] p-8 max-w-sm animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Quick Controls</h2>
              <button onClick={() => setShowControlsModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <ControlToggle label="Water Pump" icon={Waves} active={localControls.pump} onChange={v => setLocalControls(p => ({...p, pump: v}))} />
              <ControlToggle label="Ventilation Fan" icon={Wind} active={localControls.fan} onChange={v => setLocalControls(p => ({...p, fan: v}))} />
              <ControlToggle label="pH Balancer" icon={Droplets} active={localControls.phAdjustment} onChange={v => setLocalControls(p => ({...p, phAdjustment: v}))} />
              <ControlToggle label="UV Grow Light" icon={Sun} active={localControls.growLight} onChange={v => setLocalControls(p => ({...p, growLight: v}))} />
              <ControlToggle label="Aerator" icon={Activity} active={localControls.aerator} onChange={v => setLocalControls(p => ({...p, aerator: v}))} />
            </div>
            <button onClick={handleQuickControlsSave} className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-100 transition-all active:scale-95 uppercase tracking-widest text-sm">
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Camera Modal Placeholder */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
          <button onClick={() => setShowCameraModal(false)} className="absolute top-10 right-10 text-white bg-white/20 p-3 rounded-full backdrop-blur-md">
            <X size={24} />
          </button>
          <img src={LIVE_STREAM_URL} className="w-full h-auto" alt="Fullscreen Feed" />
          <div className="mt-6 text-white text-center">
            <p className="font-black text-xl tracking-tight">TOWER FEED 01</p>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">1080p Resolution • 30 FPS</p>
          </div>
        </div>
      )}
    </div>
  )
}