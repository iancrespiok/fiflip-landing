import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import RenovationSection from './components/RenovationSection.jsx'
import InvestSection from './components/InvestSection.jsx'
import PortfolioSection from './components/PortfolioSection.jsx'
import ProjectDetailPage from './components/ProjectDetailPage.jsx'
import Footer from './components/Footer.jsx'
import AdminApp from './admin/AdminApp.jsx'

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (pathname.startsWith('/admin')) {
    return <AdminApp />
  }

  const projectMatch = pathname.match(/^\/proyecto\/(\d+)/)
  if (projectMatch) {
    return <ProjectDetailPage id={projectMatch[1]} />
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
