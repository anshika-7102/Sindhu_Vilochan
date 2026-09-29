import { Link } from 'react-router-dom';
import { ArrowRight, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';

const OCEAN_IMAGE = '/ocean-hero.png';

export default function Landing() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-30">
        <Navbar />
      </div>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${OCEAN_IMAGE})` }}
      />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-[22vh] pb-24">
        <div className="flex flex-col items-center text-center max-w-4xl animate-fade-in">
          <h1 className="hero-wordmark mb-3.5 inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1">
            <span className="text-navy">SINDHU</span>
            <span className="text-ocean">VILOCHAN</span>
          </h1>

          <div className="text-xs md:text-sm font-bold tracking-[0.22em] uppercase text-navy-900 mb-3 drop-shadow-xs">
            Marine Debris Intelligence
          </div>

          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-px bg-ocean/40" />
            <div className="text-xs font-bold tracking-[0.25em] uppercase text-navy-900 drop-shadow-sm">
              See Beneath • Protect Tomorrow
            </div>
            <div className="w-12 h-px bg-ocean/40" />
          </div>

          <p className="text-base md:text-lg text-navy-900 leading-relaxed max-w-2xl mb-12 font-semibold drop-shadow-sm">
            A unified platform for analyzing side-scan sonar data to detect,
            classify and map underwater debris — enabling cleaner oceans
            and safer seas.
          </p>

          <Link
            to="/survey-ingestion"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-navy text-white rounded-md font-semibold text-sm tracking-wide shadow-lg hover:bg-ocean transition-all duration-300 hover:shadow-xl cursor-pointer"
          >
            <Upload size={18} strokeWidth={2} />
            PROCEED TO SURVEY INGESTION
            <ArrowRight size={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-5 text-xs text-navy-900 tracking-wide font-medium drop-shadow-sm">
            Upload your sonar data to begin analysis
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-3 bg-white/95 border-t border-navy-200/70 text-xs text-navy-900 font-bold">
        <div className="flex items-center gap-4">
          <span className="tracking-wider">© 2026 SINDHU VILOCHAN</span>
          <span className="w-px h-3 bg-navy-300" />
          <span className="tracking-wide">Indian Ocean Survey Program</span>
        </div>
        <div className="hidden md:flex items-center gap-4 tracking-wide">
          <span>Govt. of India</span>
          <span className="w-px h-3 bg-navy-300" />
          <span>Ministry of Earth Sciences</span>
        </div>
      </div>

    </div>
  );
}
