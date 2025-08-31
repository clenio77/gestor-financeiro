'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useIsTouchDevice } from './useDevice'

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface PinchGesture {
  scale: number
  center: TouchPoint
}

export interface GestureCallbacks {
  onSwipe?: (gesture: SwipeGesture) => void
  onPinch?: (gesture: PinchGesture) => void
  onTap?: (point: TouchPoint) => void
  onDoubleTap?: (point: TouchPoint) => void
  onLongPress?: (point: TouchPoint) => void
  onPullToRefresh?: () => void
}

export function useGestures(callbacks: GestureCallbacks = {}) {
  const isTouchDevice = useIsTouchDevice()
  const [isGestureActive, setIsGestureActive] = useState(false)
  
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const lastTapRef = useRef<TouchPoint | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialDistanceRef = useRef<number>(0)
  const isPinchingRef = useRef(false)

  const minSwipeDistance = 50
  const maxTapDistance = 10
  const doubleTapDelay = 300
  const longPressDelay = 500

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  }), [])

  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )
  }, [])

  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] => {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isTouchDevice) return

    const touches = e.touches
    setIsGestureActive(true)

    if (touches.length === 1) {
      // Single touch
      const touchPoint = getTouchPoint(touches[0])
      touchStartRef.current = touchPoint
      
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (callbacks.onLongPress && touchStartRef.current) {
          callbacks.onLongPress(touchStartRef.current)
        }
      }, longPressDelay)

    } else if (touches.length === 2) {
      // Two finger touch (pinch)
      isPinchingRef.current = true
      initialDistanceRef.current = getTouchDistance(touches[0], touches[1])
      
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [isTouchDevice, callbacks, getTouchPoint, getTouchDistance])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTouchDevice || !isGestureActive) return

    const touches = e.touches

    if (touches.length === 1 && touchStartRef.current) {
      // Single touch move
      const currentPoint = getTouchPoint(touches[0])
      const distance = getDistance(touchStartRef.current, currentPoint)
      
      // Cancel long press if moved too much
      if (distance > maxTapDistance && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      // Check for pull to refresh (swipe down from top)
      if (callbacks.onPullToRefresh && 
          touchStartRef.current.y < 100 && 
          currentPoint.y - touchStartRef.current.y > 100 &&
          window.scrollY === 0) {
        callbacks.onPullToRefresh()
      }

    } else if (touches.length === 2 && isPinchingRef.current) {
      // Two finger move (pinch)
      const currentDistance = getTouchDistance(touches[0], touches[1])
      const scale = currentDistance / initialDistanceRef.current
      
      const center: TouchPoint = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
        timestamp: Date.now()
      }

      if (callbacks.onPinch) {
        callbacks.onPinch({ scale, center })
      }
    }
  }, [isTouchDevice, isGestureActive, callbacks, getTouchPoint, getDistance, getTouchDistance])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isTouchDevice) return

    const touches = e.changedTouches
    setIsGestureActive(false)

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (touches.length === 1 && touchStartRef.current) {
      const touchPoint = getTouchPoint(touches[0])
      touchEndRef.current = touchPoint
      
      const distance = getDistance(touchStartRef.current, touchPoint)
      const duration = touchPoint.timestamp - touchStartRef.current.timestamp

      if (distance < maxTapDistance) {
        // Tap detected
        const now = Date.now()
        
        if (lastTapRef.current && 
            now - lastTapRef.current.timestamp < doubleTapDelay &&
            getDistance(lastTapRef.current, touchPoint) < maxTapDistance) {
          // Double tap
          if (callbacks.onDoubleTap) {
            callbacks.onDoubleTap(touchPoint)
          }
          lastTapRef.current = null
        } else {
          // Single tap
          lastTapRef.current = touchPoint
          setTimeout(() => {
            if (lastTapRef.current === touchPoint && callbacks.onTap) {
              callbacks.onTap(touchPoint)
            }
          }, doubleTapDelay)
        }
      } else if (distance >= minSwipeDistance) {
        // Swipe detected
        const direction = getSwipeDirection(touchStartRef.current, touchPoint)
        const velocity = distance / duration
        
        if (callbacks.onSwipe) {
          callbacks.onSwipe({
            direction,
            distance,
            velocity,
            duration
          })
        }
      }
    }

    // Reset pinch state
    isPinchingRef.current = false
    touchStartRef.current = null
    touchEndRef.current = null
  }, [isTouchDevice, callbacks, getTouchPoint, getDistance, getSwipeDirection])

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }

  return {
    gestureHandlers,
    isGestureActive
  }
}

// Hook for swipe-to-delete functionality
export function useSwipeToDelete(onDelete: () => void, threshold: number = 100) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const { gestureHandlers } = useGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'left' && gesture.distance > threshold) {
        setIsDeleting(true)
        setTimeout(() => {
          onDelete()
          setIsDeleting(false)
          setSwipeOffset(0)
        }, 200)
      } else {
        setSwipeOffset(0)
      }
    }
  })

  const swipeStyles = {
    transform: `translateX(${swipeOffset}px)`,
    transition: isDeleting ? 'transform 0.2s ease-out' : 'none'
  }

  return {
    gestureHandlers,
    swipeStyles,
    isDeleting
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh, isRefreshing])

  const { gestureHandlers } = useGestures({
    onPullToRefresh: handlePullToRefresh
  })

  return {
    gestureHandlers,
    isRefreshing,
    pullDistance
  }
}

// Hook for pinch-to-zoom functionality
export function usePinchToZoom(initialScale: number = 1, minScale: number = 0.5, maxScale: number = 3) {
  const [scale, setScale] = useState(initialScale)
  const [isZooming, setIsZooming] = useState(false)

  const { gestureHandlers } = useGestures({
    onPinch: (gesture) => {
      setIsZooming(true)
      const newScale = Math.min(Math.max(gesture.scale * initialScale, minScale), maxScale)
      setScale(newScale)
    }
  })

  const resetZoom = useCallback(() => {
    setScale(initialScale)
    setIsZooming(false)
  }, [initialScale])

  const zoomStyles = {
    transform: `scale(${scale})`,
    transition: isZooming ? 'none' : 'transform 0.2s ease-out'
  }

  return {
    gestureHandlers,
    scale,
    isZooming,
    zoomStyles,
    resetZoom
  }
}

// Haptic feedback utility
export function useHapticFeedback() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (canVibrate) {
      navigator.vibrate(pattern)
    }
  }, [canVibrate])

  const lightTap = useCallback(() => vibrate(10), [vibrate])
  const mediumTap = useCallback(() => vibrate(20), [vibrate])
  const heavyTap = useCallback(() => vibrate(50), [vibrate])
  const doubleTap = useCallback(() => vibrate([10, 50, 10]), [vibrate])
  const success = useCallback(() => vibrate([10, 10, 10]), [vibrate])
  const error = useCallback(() => vibrate([50, 50, 50]), [vibrate])

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    success,
    error,
    canVibrate
  }
}
