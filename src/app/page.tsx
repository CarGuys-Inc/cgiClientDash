import Link from "next/link";

export default function Home() {
  return (
    // bg-background and text-foreground ensure the theme variables are applied
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground transition-colors duration-300">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        
        {/* Navigation - Uses a subtle border that adapts to light/dark */}
        <nav className="w-full flex justify-center border-b border-border/40 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="hover:opacity-80 transition-opacity">
                Carguys Inc
              </Link>
            </div>
            {/* You can move ThemeSwitcher here if you want it in the header */}
          </div>
        </nav>

        {/* Main Content Section */}
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <section className="flex-1 flex flex-col items-center justify-center text-center px-5">
            <h2 className="font-medium text-xl mb-4">
              <Link 
                href="/signup" 
                className="font-bold underline decoration-primary underline-offset-4 hover:text-primary transition-all"
              >
                Sign Up
              </Link>{" "}
              to get started.
            </h2>
          </section>
        </div>

        {/* Footer - Uses semantic border color */}
        <footer className="w-full flex items-center justify-center border-t border-border/40 mx-auto text-center text-xs gap-8 py-16">
          <p className="text-muted-foreground">
            Powered by{" "}
            <a
              href="/"
              className="font-bold text-foreground hover:underline"
              rel="noreferrer"
            >
              CarGuys Inc.
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}