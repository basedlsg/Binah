import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface IconButtonProps {
  icon: React.ReactNode
  count: number
  isActive?: boolean
  onClick?: () => void
  color?: 'default' | 'red' | 'blue' | 'purple' | 'green'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon,
    count,
    isActive = false,
    onClick,
    color = 'default',
    size = 'md',
    disabled = false,
    loading = false,
    tooltip,
    ...props 
  }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false)
    
    const colorClasses = {
      default: {
        base: 'text-gray-400 hover:text-gray-300',
        active: 'text-white',
        bg: 'hover:bg-white/10',
        activeBg: 'bg-white/20'
      },
      red: {
        base: 'text-gray-400 hover:text-red-400',
        active: 'text-red-400',
        bg: 'hover:bg-red-500/10',
        activeBg: 'bg-red-500/20'
      },
      blue: {
        base: 'text-gray-400 hover:text-blue-400',
        active: 'text-blue-400',
        bg: 'hover:bg-blue-500/10',
        activeBg: 'bg-blue-500/20'
      },
      purple: {
        base: 'text-gray-400 hover:text-purple-400',
        active: 'text-purple-400',
        bg: 'hover:bg-purple-500/10',
        activeBg: 'bg-purple-500/20'
      },
      green: {
        base: 'text-gray-400 hover:text-green-400',
        active: 'text-green-400',
        bg: 'hover:bg-green-500/10',
        activeBg: 'bg-green-500/20'
      }
    }

    const sizeClasses = {
      sm: {
        button: 'px-2 py-1 rounded-lg',
        icon: 'w-3 h-3',
        text: 'text-xs',
        gap: 'space-x-1'
      },
      md: {
        button: 'px-3 py-2 rounded-xl',
        icon: 'w-4 h-4',
        text: 'text-sm',
        gap: 'space-x-2'
      },
      lg: {
        button: 'px-4 py-3 rounded-xl',
        icon: 'w-5 h-5',
        text: 'text-base',
        gap: 'space-x-2'
      }
    }

    const currentColorClass = colorClasses[color]
    const currentSizeClass = sizeClasses[size]

    const handleClick = () => {
      if (disabled || loading) return
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 150)
      onClick?.()
    }

    const formatCount = (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`
          relative inline-flex items-center justify-center transition-all duration-200
          ${currentSizeClass.button}
          ${currentSizeClass.gap}
          ${isActive ? currentColorClass.active : currentColorClass.base}
          ${isActive ? currentColorClass.activeBg : currentColorClass.bg}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          group
        `}
        title={tooltip}
        {...props}
      >
        {/* Ripple effect */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 rounded-full ${
                color === 'red' ? 'bg-red-400' :
                color === 'blue' ? 'bg-blue-400' :
                color === 'purple' ? 'bg-purple-400' :
                color === 'green' ? 'bg-green-400' :
                'bg-white'
              }/20`}
            />
          )}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={`${currentSizeClass.icon} border-2 border-current border-t-transparent rounded-full`}
          />
        ) : (
          <motion.div
            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={currentSizeClass.icon}
          >
            {icon}
          </motion.div>
        )}

        {/* Count with animation */}
        <motion.span
          key={count} // Re-animate when count changes
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.2 }}
          className={`font-medium ${currentSizeClass.text} tabular-nums`}
        >
          {formatCount(count)}
        </motion.span>

        {/* Glow effect on hover */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
          ${color === 'red' ? 'shadow-lg shadow-red-500/20' :
            color === 'blue' ? 'shadow-lg shadow-blue-500/20' :
            color === 'purple' ? 'shadow-lg shadow-purple-500/20' :
            color === 'green' ? 'shadow-lg shadow-green-500/20' :
            'shadow-lg shadow-white/10'}
        `} />
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default IconButton
export type { IconButtonProps }