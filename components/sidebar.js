'use client';

export default function Sidebar() {
  return (
    <div className="w-[280px] min-h-screen bg-[#0A0F1C] fixed left-0 top-16">
      <div className="px-4 py-6 ">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            Welcome back, <span className="text-sky-400">Aliff</span>
          </h2>
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-4">MAIN MENU</p>
        <nav>
          <ul className="space-y-3">
            <li>
              <a href="#" className="flex items-center px-3 py-2 text-white bg-blue-600 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-3 py-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1v-3.25m-7.5 0h7.5m-7.5 0a1 1 0 011-1h5.5a1 1 0 011 1m-7.5 0v3.25" /></svg>
                <span>Portfolio</span>
              </a>
            </li>
             <li>
              <a href="#" className="flex items-center px-3 py-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.515-1.35 1.706-2.223 3.125-2.223h.004c1.42 0 2.61.873 3.125 2.223L21 9v6h-3.955a1.5 1.5 0 01-1.15.5H16l.5 2h-4.5c.276 0 .5-.224.5-.5V15h-1a1.5 1.5 0 01-1.15-.5H3V9l4.5-4.683z" /></svg>
                <span>Analysis</span>
              </a>
            </li>
             <li>
              <a href="#" className="flex items-center px-3 py-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12a2 2 0 11-4 0 2 2 0 014 0zM15 12a2 2 0 11-4 0 2 2 0 014 0zM21 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span>Market</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}