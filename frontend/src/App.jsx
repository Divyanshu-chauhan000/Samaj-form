import React from 'react';
import PaperForm from './components/PaperForm';
import { BookOpen } from 'lucide-react';

export default function App() {
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header no-print">
        <div className="app-title">
          <BookOpen size={26} style={{ color: '#c59b27' }} />
          <span>कुमावत समाज परिचय पुस्तिका, कर्नाटक-2026</span>
        </div>
      </header>

      {/* Main Form View */}
      <main className="main-content">
        <PaperForm />
      </main>
    </div>
  );
}


