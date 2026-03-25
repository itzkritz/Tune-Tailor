import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Compass, Sparkles, Layers } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > 50 && window.scrollY > lastScrollY) {
          setShowNav(false);
        } else {
          setShowNav(true);
        }
        setLastScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Bypasses the Landing page entirely if the user successfully completed a Google Auth sequence!
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="landing-container">
      <nav className={`landing-nav ${showNav ? 'nav-visible' : 'nav-hidden'}`}>
        <div className="nav-logo">TUNE TAILOR</div>
        
        <ul className="nav-links">
          <li onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About Us</li>
          <li onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</li>
        </ul>

        <button className="nav-profile-btn" onClick={() => router.push(status === 'authenticated' ? '/dashboard' : '/login')}>
          {status === 'authenticated' ? 'Profile Area' : 'Sign In / Sign Up'}
        </button>
      </nav>

      <main className="hero">
        <h1 className="hero-title">
          Translate <br/>
          <span className="highlight">Feelings</span> <br/>
          Into Music
        </h1>
        <p className="hero-subtitle">
          Advanced Neural Engine designed to generate hyper-personalized 
          soundtracks by tracking your daily emotional variances. Connect your profile 
          to explore the database.
        </p>
        
        <button className="nav-profile-btn" style={{ padding: '1rem 3rem', fontSize: '1.1rem', marginTop: '1rem' }} onClick={() => router.push(status === 'authenticated' ? '/dashboard' : '/login')}>
          Launch Engine &rarr;
        </button>

        <div className="gradient-line"></div>

        <div id="about" className="about-section">
          <h2>About Tune Tailor</h2>
          <p>
            Tune Tailor is an advanced emotional sentiment translation engine. We understand that human emotion 
            rarely fits into simple boxes. Sometimes you are feeling a complex mix of nostalgia, heavy energy, and subtle hope. 
            By typing out a complete braindump of your current mental state, our proprietary Natural Language Processing model 
            deconstructs your linguistic patterns mathematically. We map those parameters along a geometric Euclidean space 
            and instantly retrieve exactly 10 Spotify tracks that acoustically and emotionally resonate with your exact wavelength.
          </p>
        </div>

        <div className="features-grid">
          <div className="glass-card">
            <Compass size={24} color="#ff0055" />
            <h3>Explore Vibes</h3>
            <p>100% Euclidean mathematically matched track alignment.</p>
          </div>
          <div className="glass-card">
            <Layers size={24} color="#ff0055" />
            <h3>Database Anchors</h3>
            <p>Securely save infinite arrays of generated moodboards directly to your profile.</p>
          </div>
          <div className="glass-card">
            <Sparkles size={24} color="#ff0055" />
            <h3>Global Datasets</h3>
            <p>90,000+ tracks tracked across semantic language and intent networks.</p>
          </div>
        </div>

        <footer id="contact" className="simple-footer">
          <div className="gradient-line" style={{ margin: '2rem 0', opacity: 0.3 }}></div>
          <p>
            GET IN TOUCH &nbsp;—&nbsp; 
            <a href="mailto:kritikamishra4000@gmail.com" style={{ color: 'var(--neon-primary)', textDecoration: 'none' }}> kritikamishra4000@gmail.com</a> &nbsp;|&nbsp; 
            <a href="https://www.linkedin.com/in/kritika-mishra-84a18728a" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-primary)', textDecoration: 'none' }}> linkedin.com/in/kritika-mishra-84a18728a</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
