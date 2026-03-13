import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The passphrase required to unlock the website.
 * Change this to whatever secret phrase you want.
 */
const PASSPHRASE = "our story";

/**
 * PasswordGate
 * Full-screen overlay that blocks access until the correct passphrase is entered.
 * Authenticated state persists for the browser session (cleared on tab close).
 */
export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("valentines_unlocked") === "true";
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!unlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [unlocked]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === PASSPHRASE.toLowerCase()) {
      sessionStorage.setItem("valentines_unlocked", "true");
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(244,63,94,0.4) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139,92,246,0.4) 0%, transparent 50%)",
          }}
        />
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shaking ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        transition={shaking ? { duration: 0.4 } : { duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full"
      >
        {/* Lock icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center"
        >
          <svg
            className="w-7 h-7 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </motion.div>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight font-serif"
          >
            This is private
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-white/40 text-sm"
          >
            Enter the passphrase to continue
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter passphrase..."
            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10
                     text-white text-center text-lg font-sans tracking-wide
                     placeholder:text-white/20
                     focus:outline-none focus:border-white/25 focus:bg-white/8
                     transition-all duration-300"
          />
        </motion.div>

        <motion.button
          type="submit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-rose-500/80 to-violet-500/80
                   text-white font-sans text-sm font-medium tracking-wide
                   border border-white/10
                   hover:from-rose-500 hover:to-violet-500 transition-all duration-300"
        >
          Unlock
        </motion.button>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-rose-400/80 text-sm"
            >
              That's not it. Try again.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
