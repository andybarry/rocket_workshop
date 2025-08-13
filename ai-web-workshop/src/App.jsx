import './App.css'
import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (activeTab === 'design') {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - left
      const y = e.clientY - top
      const xPercent = x / width
      const yPercent = y / height
      
      setMousePos({ x, y })
      setMagnifierPos({ x: xPercent, y: yPercent })
    }
  }

  const handleMouseEnter = () => {
    if (activeTab === 'design') {
      setShowMagnifier(true)
    }
  }

  const handleMouseLeave = () => {
    if (activeTab === 'design') {
      setShowMagnifier(false)
    }
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="image-section">
            <div className="text-box text-box-1">
              <div className="text-content">
                <h3>Multi-Turbine Array</h3>
                <p>Multiple turbines connected on a single frame to increase energy capture from tidal flows.</p>
              </div>
              <div className="connector-line"></div>
            </div>
            <div className="text-box text-box-2">
              <div className="text-content">
                <h3>Corrosion-Resistant Structure</h3>
                <p>Yellow-painted steel or composite frame designed to withstand long-term saltwater exposure.</p>
              </div>
              <div className="connector-line"></div>
            </div>
            <div className="text-box text-box-3">
              <div className="text-content">
                <h3>Hydrodynamic Blade Design</h3>
                <p>Five-blade configuration optimized for efficient rotation at low current speeds.</p>
              </div>
              <div className="connector-line"></div>
            </div>
            <div className="text-box text-box-4">
              <div className="text-content">
                <h3>Seafloor Mooring System</h3>
                <p>Anchors and cables securing the generator to the seabed for stability in strong tidal currents.</p>
              </div>
              <div className="connector-line"></div>
            </div>
            <div className="center-image">
              <img src="/src/assets/image1.png" alt="Product image" />
            </div>
          </div>
        )
      case 'budget':
        return (
          <div className="budget-section">
            <h2>Project Budget Breakdown</h2>
            <p className="budget-intro">Detailed cost analysis for the underwater turbine project</p>
            
            <div className="budget-table-container">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Fiberglass/Composite Blades (purple) - 5 per turbine</td>
                    <td>15</td>
                    <td>$350.00</td>
                    <td>$5,250.00</td>
                  </tr>
                  <tr>
                    <td>Blade hub assemblies</td>
                    <td>3</td>
                    <td>$1,200.00</td>
                    <td>$3,600.00</td>
                  </tr>
                  <tr>
                    <td>Pitch mechanism kit (bearings, linkages, seals) - Per turbine; omit if fixed-pitch</td>
                    <td>3</td>
                    <td>$950.00</td>
                    <td>$2,850.00</td>
                  </tr>
                  <tr>
                    <td>Rotor shafts (SS316/Ti)</td>
                    <td>3</td>
                    <td>$1,800.00</td>
                    <td>$5,400.00</td>
                  </tr>
                  <tr>
                    <td>Sealed bearings (marine) - 2 per turbine</td>
                    <td>6</td>
                    <td>$180.00</td>
                    <td>$1,080.00</td>
                  </tr>
                  <tr>
                    <td>Nacelle housings - Machined/cast, coated</td>
                    <td>3</td>
                    <td>$1,400.00</td>
                    <td>$4,200.00</td>
                  </tr>
                  <tr>
                    <td>O-rings & seals assortment (fluorocarbon) - Bulk kit</td>
                    <td>1</td>
                    <td>$250.00</td>
                    <td>$250.00</td>
                  </tr>
                  <tr>
                    <td>Fasteners set (A4/SS316 bolts/nuts/washers) - Bulk kit</td>
                    <td>1</td>
                    <td>$400.00</td>
                    <td>$400.00</td>
                  </tr>
                  <tr>
                    <td>Anti-fouling & epoxy coatings - 1 project set</td>
                    <td>1</td>
                    <td>$300.00</td>
                    <td>$300.00</td>
                  </tr>
                  <tr>
                    <td>Permanent magnet generators (subsea-rated)</td>
                    <td>3</td>
                    <td>$4,200.00</td>
                    <td>$12,600.00</td>
                  </tr>
                  <tr>
                    <td>Gearboxes (marine-rated) or couplers - Skip if direct drive</td>
                    <td>3</td>
                    <td>$2,200.00</td>
                    <td>$6,600.00</td>
                  </tr>
                  <tr>
                    <td>Underwater armored power cable, 3-phase (m) - Approx. 40 m per turbine</td>
                    <td>120</td>
                    <td>$35.00</td>
                    <td>$4,200.00</td>
                  </tr>
                  <tr>
                    <td>Cable termination & gland kits</td>
                    <td>3</td>
                    <td>$260.00</td>
                    <td>$780.00</td>
                  </tr>
                  <tr>
                    <td>Cable strain relief hardware</td>
                    <td>3</td>
                    <td>$120.00</td>
                    <td>$360.00</td>
                  </tr>
                  <tr>
                    <td>Onshore inverter/rectifier & transformer unit</td>
                    <td>1</td>
                    <td>$7,500.00</td>
                    <td>$7,500.00</td>
                  </tr>
                  <tr>
                    <td>Structural frame (fabricated, coated steel) - Material + shop time</td>
                    <td>1</td>
                    <td>$5,200.00</td>
                    <td>$5,200.00</td>
                  </tr>
                  <tr>
                    <td>Cross braces & gussets</td>
                    <td>1</td>
                    <td>$900.00</td>
                    <td>$900.00</td>
                  </tr>
                  <tr>
                    <td>Cathodic protection (zinc anodes)</td>
                    <td>8</td>
                    <td>$45.00</td>
                    <td>$360.00</td>
                  </tr>
                  <tr>
                    <td>Concrete footings with baseplates</td>
                    <td>4</td>
                    <td>$380.00</td>
                    <td>$1,520.00</td>
                  </tr>
                  <tr>
                    <td>Mooring cables/ropes (Dyneema or galvanized) (m)</td>
                    <td>80</td>
                    <td>$10.00</td>
                    <td>$800.00</td>
                  </tr>
                  <tr>
                    <td>Chain sections (m) - High-wear zones</td>
                    <td>40</td>
                    <td>$12.00</td>
                    <td>$480.00</td>
                  </tr>
                  <tr>
                    <td>Shackles</td>
                    <td>16</td>
                    <td>$9.00</td>
                    <td>$144.00</td>
                  </tr>
                  <tr>
                    <td>Swivels</td>
                    <td>6</td>
                    <td>$24.00</td>
                    <td>$144.00</td>
                  </tr>
                  <tr>
                    <td>Turnbuckles/tensioners</td>
                    <td>6</td>
                    <td>$55.00</td>
                    <td>$330.00</td>
                  </tr>
                  <tr>
                    <td>Anchors (screw or gravity)</td>
                    <td>4</td>
                    <td>$450.00</td>
                    <td>$1,800.00</td>
                  </tr>
                  <tr>
                    <td>Junction box (IP68) & breakers</td>
                    <td>1</td>
                    <td>$950.00</td>
                    <td>$950.00</td>
                  </tr>
                  <tr>
                    <td>Sensors (flow, torque, temp) - Kit</td>
                    <td>1</td>
                    <td>$1,800.00</td>
                    <td>$1,800.00</td>
                  </tr>
                  <tr>
                    <td>Underwater camera + mount (optional)</td>
                    <td>1</td>
                    <td>$600.00</td>
                    <td>$600.00</td>
                  </tr>
                  <tr>
                    <td>Thread sealant & adhesives</td>
                    <td>1</td>
                    <td>$120.00</td>
                    <td>$120.00</td>
                  </tr>
                  <tr>
                    <td>Waterproof grease & lubricants</td>
                    <td>1</td>
                    <td>$90.00</td>
                    <td>$90.00</td>
                  </tr>
                  <tr>
                    <td>Heat-shrink, cable ties, clamps</td>
                    <td>1</td>
                    <td>$160.00</td>
                    <td>$160.00</td>
                  </tr>
                  <tr>
                    <td>Engineering design (CAD/FEA/hydrodynamics) - Avg. $85/hr</td>
                    <td>120</td>
                    <td>$85.00</td>
                    <td>$10,200.00</td>
                  </tr>
                  <tr>
                    <td>Fabrication/assembly - Shop rate</td>
                    <td>140</td>
                    <td>$70.00</td>
                    <td>$9,800.00</td>
                  </tr>
                  <tr>
                    <td>Diving crew & small workboat - Install & commissioning</td>
                    <td>2</td>
                    <td>$3,800.00</td>
                    <td>$7,600.00</td>
                  </tr>
                  <tr>
                    <td>Crating & protective packaging</td>
                    <td>1</td>
                    <td>$600.00</td>
                    <td>$600.00</td>
                  </tr>
                  <tr>
                    <td>Freight shipping (palletized, regional)</td>
                    <td>1</td>
                    <td>$2,200.00</td>
                    <td>$2,200.00</td>
                  </tr>
                  <tr>
                    <td>Customs/import buffer (if applicable)</td>
                    <td>1</td>
                    <td>$800.00</td>
                    <td>$800.00</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Estimated Cost:</strong></td>
                    <td><strong>$101,968.00</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      case 'team':
        return (
          <div className="team-section">
            <div className="team-background">
              <img src="/src/assets/image3.png" alt="Team background" />
            </div>
            <div className="team-member team-member-1">
              <div className="member-photo">
                <img src="https://cdn-icons-png.flaticon.com/512/616/616430.png" alt="Alex - Lion" />
              </div>
              <div className="member-info">
                <h3>Alex</h3>
                <p className="member-bio">A senior from San Francisco, CA with a passion for renewable energy. Alex has competed in multiple robotics competitions and leads the school's engineering club.</p>
              </div>
            </div>
            
            <div className="team-member team-member-2">
              <div className="member-photo">
                <img src="https://cdn-icons-png.flaticon.com/512/616/616432.png" alt="Maya - Rabbit" />
              </div>
              <div className="member-info">
                <h3>Maya</h3>
                <p className="member-bio">A junior from Miami, FL with expertise in electrical engineering and programming. Maya has won state science fairs for her work on smart grid technology and leads the school's coding team.</p>
              </div>
            </div>
            
            <div className="team-member team-member-3">
              <div className="member-photo">
                <img src="https://cdn-icons-png.flaticon.com/512/616/616429.png" alt="Jordan - Bear" />
              </div>
              <div className="member-info">
                <h3>Jordan</h3>
                <p className="member-bio">A senior from Portland, OR passionate about marine conservation and sustainable technology. Jordan has conducted research on ocean acidification and leads environmental awareness initiatives.</p>
              </div>
            </div>
            
            <div className="team-member team-member-4">
              <div className="member-photo">
                <img src="https://cdn-icons-png.flaticon.com/512/616/616431.png" alt="Priya - Koala" />
              </div>
              <div className="member-info">
                <h3>Priya</h3>
                <p className="member-bio">A junior from Austin, TX with strong leadership and communication skills. Priya has organized multiple community service projects and leads the school's debate team.</p>
              </div>
            </div>
          </div>
        )
      case 'design':
        return (
          <div className="image-section">
            <div className="center-image magnifier-container">
              <img 
                src="src/assets/image4.png" 
                alt="Design specifications"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              {showMagnifier && (
                <div 
                  className="magnifier"
                  style={{
                    left: mousePos.x - 100,
                    top: mousePos.y - 100,
                    backgroundImage: `url(src/assets/image4.png)`,
                    backgroundPosition: `${magnifierPos.x * 100}% ${magnifierPos.y * 100}%`
                  }}
                />
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      {/* Cartoon Bubbles - only show on team page */}
      {activeTab === 'team' && (
        <>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
        </>
      )}
      
      <section className="hero-section">
        <div className="hero-background">
          <img src="/src/assets/image2.png" alt="Hero background" />
        </div>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Underwater Turbine</h1>
            <h2 className="hero-subtitle">infinite energy harvester</h2>
            <p className="hero-location">Bimini Bahamas</p>
          </div>
        </div>
      </section>
      
      <nav className="header-nav">
        <div className="nav-container">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Budget
          </button>
          <button 
            className={`nav-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
          <button 
            className={`nav-tab ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
        </div>
      </nav>

      <section className="content-section">
        {/* Mission statement - positioned below tabs but above content */}
        {activeTab === 'overview' && (
          <div className="goal-description">
            <h2>Our Mission</h2>
            <p>To harness the infinite power of ocean tides and convert it into clean, renewable energy that powers coastal communities while preserving marine ecosystems.</p>
          </div>
        )}
        {renderContent()}
      </section>

      <footer className="footer">
        <div className="footer-bottom">
          <div className="footer-bottom-container">
            <p>&copy; 2026 Underwater Turbine Project. All rights reserved.</p>
            <p>Berkeley, CA Envision Engineering</p>
            <p>AI Web Workshop</p>
            <p>STAGE ONE EDUCATION</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
