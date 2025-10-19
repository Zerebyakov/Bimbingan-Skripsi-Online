import React from 'react'

const Footbar = () => {
  return (
    <footer className="w-full bg-gray-100 text-gray-500 text-xs py-3 text-center border-t border-gray-300">
      © {new Date().getFullYear()} Sistem Bimbingan Online — Mahasiswa Panel
    </footer>
  )
}

export default Footbar