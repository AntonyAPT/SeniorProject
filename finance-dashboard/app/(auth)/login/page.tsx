import Link from 'next/link'
import styles from './login.module.css'

export default function LoginPage() {
  return (
    // Tailwind: basic layout
    <div className="flex flex-col items-center gap-8">
      
      {/* CSS Module: branded logo style */}
      <div className={styles.logo}>[ STONKS ]</div>
      
      {/* CSS Module: unique card design */}
      <div className={styles.card}>
        {/* Tailwind: simple text styling */}
        <h1 className="text-lg font-medium text-zinc-200">Welcome Back</h1>
        
        {/* Tailwind: form layout */}
        <form className="flex flex-col gap-4 w-full">
          
          {/* Tailwind: input row layout */}
          <div className="flex items-center gap-3">
            <label className="text-zinc-400 text-sm min-w-[70px]">Email:</label>
            {/* CSS Module: custom input styling */}
            <input 
              type="email" 
              className={styles.input}
              name="email"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-zinc-400 text-sm min-w-[70px]">Password:</label>
            <input 
              type="password" 
              className={styles.input}
              name="password"
            />
          </div>
          
          {/* CSS Module: branded button */}
          <button type="submit" className={styles.button}>
            LOGIN
          </button>
        </form>
        
        {/* Tailwind: simple link layout */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/forgot-password" className={styles.link}>
            Forgot Password?
          </Link>
          <span className="text-zinc-400 text-sm">
            New? <Link href="/signup" className={styles.linkHighlight}>[Sign Up Here]</Link>
          </span>
        </div>
      </div>
    </div>
  )
}