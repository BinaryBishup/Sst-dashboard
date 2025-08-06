import { useEffect, useRef, useState } from 'react'
import { ordersService } from '@/lib/supabase-utils'

export function useNewOrderNotification(onPendingOrders?: (orders: any[]) => void) {
  const [hasPendingOrders, setHasPendingOrders] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio with the zomato ring sound
  useEffect(() => {
    // Use the actual sound file from public folder
    audioRef.current = new Audio('/zomato_ring_5.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = 0.7 // Set volume to 70% to not be too loud
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Check for pending orders
  const checkForPendingOrders = async () => {
    try {
      const orders = await ordersService.getAll('pending')
      console.log(`Checking for pending orders... Found: ${orders?.length || 0}`)
      
      if (orders && orders.length > 0) {
        // If there are pending orders, start notification
        if (!hasPendingOrders) {
          console.log('New pending orders detected! Starting notification...')
          setHasPendingOrders(true)
          startNotification()
        }
        
        if (onPendingOrders) {
          onPendingOrders(orders)
        }
      } else {
        // No pending orders, stop notification
        if (hasPendingOrders) {
          console.log('No pending orders remaining. Stopping notification...')
          setHasPendingOrders(false)
          stopNotification()
        }
      }
    } catch (error) {
      console.error('Error checking for pending orders:', error)
    }
  }

  // Start the notification sound
  const startNotification = () => {
    if (audioRef.current) {
      console.log('Attempting to play notification sound for pending orders...')
      audioRef.current.play().then(() => {
        console.log('Notification sound started playing successfully')
        setIsPlaying(true)
      }).catch(e => {
        console.error('Error playing notification sound:', e)
        console.log('This may be due to browser autoplay policy. User interaction may be required.')
        setIsPlaying(false)
      })
    }
  }

  // Stop the notification sound
  const stopNotification = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  // Start polling for pending orders
  useEffect(() => {
    // Initial check
    checkForPendingOrders()
    
    // Poll every 5 seconds for pending orders
    intervalRef.current = setInterval(checkForPendingOrders, 5000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [hasPendingOrders])

  // Manual play function for user interaction
  const manualPlay = () => {
    if (hasPendingOrders) {
      startNotification()
    }
  }

  return {
    isPlaying,
    stopNotification,
    manualPlay,
    hasPendingOrders
  }
}