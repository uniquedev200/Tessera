"""
Generates clean, authentic textbook sample PDFs for EPISTEME demos and drag-and-drop testing.
Outputs to:
  - sample_pdfs/
  - frontend/public/sample_pdfs/
"""
import os
import shutil
import fitz  # PyMuPDF

CHAPTERS = [
    {
        "filename": "Chapter_1_Electric_Potential_and_Drift_Dynamics.pdf",
        "title": "CHAPTER 1: ELECTRIC POTENTIAL & DRIFT DYNAMICS",
        "subject": "Physics: Electromagnetism & Solid-State Transport",
        "pages": [
            [
                ("1.1 Applied Electric Field & Conduction Electrons", 14, True),
                (
                    "When an external electric field is applied across a solid metallic conductor, free conduction electrons experience a steady electrostatic force F = -eE. Rather than accelerating infinitely without bound, mobile charge carriers undergo repetitive non-elastic scattering against the positive ionic crystal lattice. This mechanical drag opposes the electrostatic push, rapidly establishing a steady terminal drift velocity vd.",
                    10,
                    False
                ),
                ("1.2 Mean Free Path and Relaxation Time", 14, True),
                (
                    "Between successive collisions with crystal defects and vibrating lattice phonons, conduction electrons accelerate freely over an average characteristic timescale known as the momentum relaxation time tau. The steady-state drift velocity is governed by the equilibrium relation vd = (e * tau / m) * E, where m represents the effective electronic mass.",
                    10,
                    False
                ),
                ("1.3 Electric Potential Difference as an Energy Gradient", 14, True),
                (
                    "The macroscopic electric potential difference Delta V represents the work done per unit charge available to transport mobile electrons across this dense lattice barrier. A steeper potential gradient imparts greater mechanical acceleration between collision events, establishing a stronger driving pressure across the conductor.",
                    10,
                    False
                ),
                ("1.4 Volumetric Charge Flux and Current Density", 14, True),
                (
                    "Macroscopic electric current I is directly proportional to the number density of charge carriers n, the elementary electron charge e, the conductor cross-sectional area A, and the steady-state drift velocity: I = n * e * A * vd. When charge carriers scatter against the ionic lattice, kinetic energy gained from the potential drop is irreversibly transferred into lattice vibrational modes, generating thermal dissipation.",
                    10,
                    False
                ),
                ("1.5 Fundamental Conservation Invariant: Current Continuity", 14, True),
                (
                    "Under steady-state conditions, electric charge cannot spontaneously accumulate or deplete at any point within a closed conductor. The net flux of mobile charge entering any closed volume must exactly equal the net charge exiting that volume. Current continuity represents an inviolable topological invariant across all conductive circuits.",
                    10,
                    False
                )
            ]
        ]
    },
    {
        "filename": "Chapter_2_Resistive_Circuits_and_Thermal_Dissipation.pdf",
        "title": "CHAPTER 2: RESISTIVE DISSIPATION & THERMAL EQUILIBRIUM",
        "subject": "Physics: Circuit Dynamics & Thermodynamic Dissipation",
        "pages": [
            [
                ("2.1 Lattice Scattering and Joule Dissipation", 14, True),
                (
                    "As a steady drift current traverses a resistive material, frictional interactions between accelerated carriers and stationary lattice impurities convert coherent electrical potential energy into incoherent atomic vibrations. This microscopic process manifests macroscopically as Joule heating, characterized by volumetric thermal dissipation rate P = I^2 * R.",
                    10,
                    False
                ),
                ("2.2 Material Resistivity and Geometric Resistance", 14, True),
                (
                    "The electrical resistance R of any conductive cylinder depends intrinsically upon the material resistivity rho and extrinsically upon its physical geometry according to R = rho * (L / A). Increasing the cross-sectional area provides more parallel conductive channels for carrier flux, reducing resistance, whereas increasing length magnifies cumulative scattering barriers.",
                    10,
                    False
                ),
                ("2.3 Ohm's Constitutive Law as a Flow Constraint", 14, True),
                (
                    "According to Ohm's constitutive relation V = I * R, the potential drop across a resistive element is strictly proportional to the rate of charge flow through that barrier. Resistance acts as a localized impedance bottleneck, enforcing a continuous potential drop across the component in the direction of current flow.",
                    10,
                    False
                ),
                ("2.4 Temperature Dependence and Lattice Thermal Agitation", 14, True),
                (
                    "As temperature rises from persistent resistive scattering, the thermal vibration amplitude of positive lattice ions intensifies. This enlarged effective scattering cross-section curtails electron mean free path, causing metallic resistivity to increase linearly with temperature: rho(T) = rho_0 * (1 + alpha * Delta T).",
                    10,
                    False
                ),
                ("2.5 Hydrodynamic Analogy and Kirchhoff's Energy Conservation", 14, True),
                (
                    "Electric potential drop across a resistor is isomorphic to hydrostatic pressure drop across a constricted pipe valve, where fluid pressure converts to turbulent friction. Around any closed circuit loop, the algebraic sum of electrical potential gains and drops must sum strictly to zero (Kirchhoff's Loop Rule), preserving global electrostatic energy conservation.",
                    10,
                    False
                )
            ]
        ]
    },
    {
        "filename": "Chapter_3_Capacitance_and_Electrostatic_Energy.pdf",
        "title": "CHAPTER 3: CAPACITANCE & ELECTROSTATIC ENERGY STORAGE",
        "subject": "Physics: Dielectric Media & Transient Circuit Dynamics",
        "pages": [
            [
                ("3.1 Charge Accumulation and Electrostatic Displacement", 14, True),
                (
                    "A capacitor consists of two isolated conductors separated by a dielectric medium or vacuum. When an external potential difference V is applied, charge carriers accumulate on opposing conductive boundaries without direct conduction across the gap. The accumulated charge Q is strictly governed by the geometric capacitance: Q = C * V.",
                    10,
                    False
                ),
                ("3.2 Dielectric Polarization and Bound Charge", 14, True),
                (
                    "Introducing an insulating dielectric material between conductive plates causes microscopic molecular dipole alignment. This dielectric polarization produces internal bound surface charges that partially counteract the applied field, attenuating net electric field strength and multiplying overall capacitance by the dielectric constant kappa: C = kappa * epsilon_0 * (A / d).",
                    10,
                    False
                ),
                ("3.3 Electrostatic Potential Energy Density", 14, True),
                (
                    "Charging a capacitor requires thermodynamic work to overcome Coulombic repulsion from previously accumulated charges. This energy is stored directly within the electrostatic field filling the dielectric volume: U = 0.5 * C * V^2 = 0.5 * Q^2 / C. The spatial energy density of the field is given by u = 0.5 * epsilon * E^2.",
                    10,
                    False
                ),
                ("3.4 RC Transient Charging Dynamics & Time Constant", 14, True),
                (
                    "When placed in series with a resistive element R, charge accumulation is rate-limited by the current constraint. The potential across the capacitor relaxes exponentially toward asymptotic equilibrium according to V(t) = V_0 * (1 - exp(-t / (R * C))). The product tau = R * C defines the fundamental characteristic relaxation timescale.",
                    10,
                    False
                ),
                ("3.5 Mechanical Dualities: Spring Compliance vs. Capacitance", 14, True),
                (
                    "Capacitive energy storage behaves identically to elastic energy storage in a mechanical spring, where mechanical force corresponds to voltage, physical displacement corresponds to charge, and mechanical compliance (1/k) corresponds to capacitance C. These mathematical dualities govern harmonic oscillation in LC and RLC networks.",
                    10,
                    False
                )
            ]
        ]
    }
]

def build_pdf(chapter_data, out_path):
    doc = fitz.open()
    width, height = 595, 842  # standard A4
    margin = 54  # 0.75 in

    for page_items in chapter_data["pages"]:
        page = doc.new_page(width=width, height=height)
        
        # Header Box / Title Banner
        # Background header bar
        header_rect = fitz.Rect(margin, margin - 10, width - margin, margin + 45)
        page.draw_rect(header_rect, color=(0.15, 0.25, 0.45), fill=(0.95, 0.96, 0.98), width=1)
        
        # Super-title & title
        page.insert_text(fitz.Point(margin + 12, margin + 12), chapter_data["subject"].upper(), fontsize=8, color=(0.3, 0.4, 0.55), fontname="helv")
        page.insert_text(fitz.Point(margin + 12, margin + 32), chapter_data["title"], fontsize=13, color=(0.1, 0.12, 0.18), fontname="helv")
        
        # Horizontal rule
        page.draw_line(fitz.Point(margin, margin + 55), fitz.Point(width - margin, margin + 55), color=(0.8, 0.82, 0.88), width=1)
        
        # Body text rendering
        y_cursor = margin + 75
        for heading, font_size, is_heading in page_items:
            if is_heading:
                y_cursor += 12
                # Draw small colored bullet
                bullet_rect = fitz.Rect(margin, y_cursor - 7, margin + 5, y_cursor - 2)
                page.draw_rect(bullet_rect, color=(0.15, 0.38, 0.92), fill=(0.15, 0.38, 0.92))
                page.insert_text(fitz.Point(margin + 12, y_cursor), heading, fontsize=11, color=(0.1, 0.12, 0.18), fontname="helv")
                y_cursor += 16
            else:
                text_rect = fitz.Rect(margin + 12, y_cursor, width - margin - 10, y_cursor + 90)
                page.insert_textbox(text_rect, heading, fontsize=9.5, color=(0.25, 0.28, 0.35), fontname="helv")
                y_cursor += 80
        
        # Footer
        footer_y = height - margin + 20
        page.draw_line(fitz.Point(margin, footer_y - 12), fitz.Point(width - margin, footer_y - 12), color=(0.85, 0.87, 0.9), width=0.75)
        page.insert_text(fitz.Point(margin, footer_y), "EPISTEME // Cognitive Curriculum Framework - Verified Syllabus Benchmark", fontsize=7.5, color=(0.5, 0.55, 0.6), fontname="helv")
        page.insert_text(fitz.Point(width - margin - 50, footer_y), "Page 1 of 1", fontsize=7.5, color=(0.5, 0.55, 0.6), fontname="helv")

    doc.save(out_path)
    doc.close()
    print(f"Generated: {out_path}")

def main():
    root_dir = os.path.abspath("sample_pdfs")
    public_dir = os.path.abspath("frontend/public/sample_pdfs")
    
    os.makedirs(root_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)
    
    for ch in CHAPTERS:
        fname = ch["filename"]
        root_path = os.path.join(root_dir, fname)
        public_path = os.path.join(public_dir, fname)
        
        build_pdf(ch, root_path)
        shutil.copyfile(root_path, public_path)
        print(f"Copied to public: {public_path}")

if __name__ == "__main__":
    main()
