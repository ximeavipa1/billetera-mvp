import { useEffect, useState, useCallback } from 'react'
import { CHANNELS as DEFAULT_CHANNELS, RATES, FEES, EXCHANGE_DATE } from './mockConfig'

const KEY = 'walletConfig'

const defaultConfig = {
  exchangeDate: EXCHANGE_DATE,
  rates: RATES,
  fees: FEES,
  channels: DEFAULT_CHANNELS,   // paypal / BOB_QR / USDT / CARD
  limits: { maxUsers: 100, cardCap: 50 },       // NUEVO
  payout: {                                     // NUEVO: cuenta destino
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    note: ''
  }
}

export function loadConfig(){
  try{
    const raw = localStorage.getItem(KEY)
    if(!raw) return defaultConfig
    const parsed = JSON.parse(raw)
    return {
      ...defaultConfig,
      ...parsed,
      channels: { ...defaultConfig.channels, ...(parsed.channels||{}) },
      limits:   { ...defaultConfig.limits,   ...(parsed.limits||{}) },
      payout:   { ...defaultConfig.payout,   ...(parsed.payout||{}) },
    }
  }catch{ return defaultConfig }
}

export function saveConfig(cfg){
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function useConfig(){
  const [config, setConfig] = useState(loadConfig())

  useEffect(()=>{ saveConfig(config) }, [config])

  const setChannelField = useCallback((channel, field, value)=>{
    setConfig(prev => ({
      ...prev,
      channels: { ...prev.channels, [channel]: { ...prev.channels[channel], [field]: value } }
    }))
  },[])

  const setRate = useCallback((key, value)=>{
    setConfig(prev => ({ ...prev, rates: { ...prev.rates, [key]: Number(value)||0 } }))
  },[])

  const setFee = useCallback((key, value)=>{
    setConfig(prev => ({ ...prev, fees: { ...prev.fees, [key]: Number(value)||0 } }))
  },[])

  // NUEVOS setters
  const setLimit = useCallback((key, value)=>{
    setConfig(prev => ({ ...prev, limits: { ...prev.limits, [key]: Number(value)||0 } }))
  },[])

  const setPayoutField = useCallback((field, value)=>{
    setConfig(prev => ({ ...prev, payout: { ...prev.payout, [field]: value } }))
  },[])

  const resetDefaults = useCallback(()=>{
    setConfig(defaultConfig)
  },[])

  return { config, setChannelField, setRate, setFee, setLimit, setPayoutField, resetDefaults }
}
