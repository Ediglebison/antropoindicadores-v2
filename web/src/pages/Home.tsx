import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container" style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: '#2c3e50' }}>Projeto Antropoindicadores</h1>
        <h3 style={{ color: '#34495e', fontWeight: 'normal' }}>
          Programa de Pós-Graduação em Estudos Antrópicos na Amazônia (PPGEAA)
        </h3>
        <h4 style={{ color: '#7f8c8d' }}>Universidade Federal do Pará - Campus Castanhal</h4>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
        <section>
          <h2>Sobre o Projeto</h2>
          <p>
            O projeto Antropoindicadores visa coletar, sistematizar e analisar dados 
            socioambientais e antrópicos na região amazônica. Nosso objetivo é fornecer 
            uma base sólida de indicadores para auxiliar na compreensão das dinâmicas 
            territoriais, impactos ambientais e no desenvolvimento de políticas públicas 
            voltadas para a sustentabilidade e o bem-estar das populações locais.
          </p>
        </section>

        <section style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Acesso para Pesquisadores</h3>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Área restrita para a equipe do projeto e administradores do sistema.
          </p>
          
          {/* Este é o botão que leva para a nova página de login */}
          <Link 
            to="/login" 
            style={{ 
              backgroundColor: '#0056b3', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Acessar o Sistema
          </Link>
        </section>
      </main>
    </div>
  );
}