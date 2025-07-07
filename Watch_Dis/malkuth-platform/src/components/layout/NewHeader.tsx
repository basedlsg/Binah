import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Typography from '../ui/atoms/Typography'
import { Search, Bell, Menu } from 'lucide-react'

const NewHeader = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 border-b border-white/10">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0L24.2487 3.75126L28 14L24.2487 24.2487L14 28L3.75126 24.2487L0 14L3.75126 3.75126L14 0Z" fill="white"/>
              <path d="M14 4.66663L20.8741 7.18764L23.3333 14L20.8741 20.8123L14 23.3333L7.12587 20.8123L4.66663 14L7.12587 7.18764L14 4.66663Z" fill="black"/>
            </svg>
            <Typography variant="h6" className="font-bold text-xl">
              MALKUTH
            </Typography>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/discover" className="text-white/80 hover:text-white transition-colors">Discover</Link>
            <Link href="/livestreams" className="text-white/80 hover:text-white transition-colors">Livestreams</Link>
            <Link href="/jobs" className="text-white/80 hover:text-white transition-colors">Jobs</Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="text-white/80 hover:text-white transition-colors">
              <Search size={20} />
            </button>
            <button className="text-white/80 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <button className="hidden md:inline-block bg-white text-black px-5 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors">
              Upload
            </button>
            <button className="md:hidden text-white/80 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NewHeader 