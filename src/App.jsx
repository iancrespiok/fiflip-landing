import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import RenovationSection from './components/RenovationSection.jsx'
import InvestSection from './components/InvestSection.jsx'
import PortfolioSection from './components/PortfolioSection.jsx'
import Footer from './components/Footer.jsx'
import AdminApp from './admin/AdminApp.jsx'

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }

  return (
    <>
      <Header />
      <Hero />
      <RenovationSection />
      <PortfolioSection />
      <InvestSection />
      <Footer />
    </>
  )
}
